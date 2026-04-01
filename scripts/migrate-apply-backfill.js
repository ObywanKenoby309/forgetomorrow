// scripts/migrate-apply-backfill.js
// One-time migration to fix applications submitted before the apply.js fix.
//
// What it fixes:
//   1. Conversations between recruiters and candidates that have no channel
//      or wrong channel — sets channel = 'recruiter'
//   2. Missing ContactCategoryAssignment rows for existing applications
//   3. Missing CandidateGroup / CandidateGroupMember entries
//
// Run with:  node scripts/migrate-apply-backfill.js
// Safe to run multiple times — all writes are upserts or conditional creates.

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function buildJobGroupName(jobId, title) {
  return `Job ${jobId} - ${String(title || '').trim()}`;
}

async function main() {
  console.log('Starting apply backfill migration...\n');

  // ── 1) Find all applications that have an org accountKey ─────────────────
  const applications = await prisma.application.findMany({
    where: {
      accountKey: { not: null },
      source: 'FORGETOMORROW',
    },
    select: {
      id: true,
      userId: true,        // seeker
      jobId: true,
      accountKey: true,
      appliedAt: true,
    },
    orderBy: { appliedAt: 'asc' },
  });

  console.log(`Found ${applications.length} ForgeTomorrow applications with org accountKey\n`);

  let fixed = 0;
  let skipped = 0;
  let errors = 0;

  for (const app of applications) {
    try {
      const { userId: seekerUserId, jobId, accountKey: orgAccountKey } = app;
      if (!jobId || !orgAccountKey || !seekerUserId) { skipped++; continue; }

      // Load job
      const job = await prisma.job.findUnique({
        where: { id: jobId },
        select: { id: true, title: true, accountKey: true, userId: true },
      });

      if (!job?.id || !job.userId) { skipped++; continue; }

      const jobPosterId = String(job.userId);
      const groupName = buildJobGroupName(job.id, job.title);

      // ── Fix 1: Ensure CandidateGroup ──────────────────────────────────────
      let candidateGroup = await prisma.candidateGroup.findFirst({
        where: { accountKey: orgAccountKey, jobId: job.id },
        select: { id: true, name: true },
      });

      if (!candidateGroup) {
        candidateGroup = await prisma.candidateGroup.create({
          data: {
            accountKey: orgAccountKey,
            jobId: job.id,
            name: groupName,
            isSystem: true,
            status: 'active',
          },
          select: { id: true, name: true },
        });
        console.log(`  [${app.id}] Created CandidateGroup: ${groupName}`);
      }

      // ── Fix 2: Ensure org ContactCategory tree ─────────────────────────────
      let candidatesRoot = await prisma.contactCategory.findFirst({
        where: { accountKey: orgAccountKey, parentCategoryId: null, name: 'Candidates' },
        select: { id: true },
      });

      if (!candidatesRoot) {
        candidatesRoot = await prisma.contactCategory.create({
          data: { accountKey: orgAccountKey, userId: jobPosterId, name: 'Candidates', parentCategoryId: null },
          select: { id: true },
        });
      }

      let jobCategory = await prisma.contactCategory.findFirst({
        where: { accountKey: orgAccountKey, parentCategoryId: candidatesRoot.id, name: groupName },
        select: { id: true },
      });

      if (!jobCategory) {
        jobCategory = await prisma.contactCategory.create({
          data: { accountKey: orgAccountKey, userId: jobPosterId, name: groupName, parentCategoryId: candidatesRoot.id },
          select: { id: true },
        });
      }

      // ── Fix 3: Ensure canonical contact (job poster owns it) ───────────────
      let orgContact = await prisma.contact.findUnique({
        where: { userId_contactUserId: { userId: jobPosterId, contactUserId: seekerUserId } },
        select: { id: true, userId: true },
      });

      if (!orgContact) {
        try {
          orgContact = await prisma.contact.create({
            data: { userId: jobPosterId, contactUserId: seekerUserId },
            select: { id: true, userId: true },
          });
        } catch (e) {
          orgContact = await prisma.contact.findUnique({
            where: { userId_contactUserId: { userId: jobPosterId, contactUserId: seekerUserId } },
            select: { id: true, userId: true },
          });
        }
      }

      // ── Fix 4: Ensure RecruiterCandidate ───────────────────────────────────
      let rc = await prisma.recruiterCandidate.findFirst({
        where: { accountKey: orgAccountKey, candidateUserId: seekerUserId },
        select: { id: true },
      });

      if (!rc) {
        rc = await prisma.recruiterCandidate.create({
          data: { recruiterUserId: jobPosterId, candidateUserId: seekerUserId, accountKey: orgAccountKey },
          select: { id: true },
        });
      }

      // ── Fix 5: Ensure ContactCategoryAssignment ────────────────────────────
      if (orgContact?.id && jobCategory?.id) {
        // Remove any bad root-level assignment first
        await prisma.contactCategoryAssignment.deleteMany({
          where: { accountKey: orgAccountKey, contactId: orgContact.id, categoryId: candidatesRoot.id },
        });

        await prisma.contactCategoryAssignment.upsert({
          where: {
            accountKey_contactId_categoryId: {
              accountKey: orgAccountKey,
              contactId: orgContact.id,
              categoryId: jobCategory.id,
            },
          },
          update: { userId: jobPosterId },
          create: {
            accountKey: orgAccountKey,
            userId: jobPosterId,
            contactId: orgContact.id,
            categoryId: jobCategory.id,
          },
        });
      }

      // ── Fix 6: Ensure CandidateGroupMember ─────────────────────────────────
      if (candidateGroup?.id && rc?.id) {
        await prisma.candidateGroupMember.upsert({
          where: {
            groupId_recruiterCandidateId: {
              groupId: candidateGroup.id,
              recruiterCandidateId: rc.id,
            },
          },
          update: {},
          create: {
            groupId: candidateGroup.id,
            recruiterCandidateId: rc.id,
            addedByUserId: seekerUserId,
          },
        });
      }

      // ── Fix 7: Ensure recruiter conversation with channel: 'recruiter' ─────
      // First check if a recruiter-channel conversation already exists
      const existingParts = await prisma.conversationParticipant.findMany({
        where: {
          userId: { in: [jobPosterId, seekerUserId] },
          conversation: { channel: 'recruiter' },
        },
        select: { conversationId: true, userId: true },
      });

      const convoMap = new Map();
      existingParts.forEach((p) => {
        if (!convoMap.has(p.conversationId)) convoMap.set(p.conversationId, new Set());
        convoMap.get(p.conversationId).add(p.userId);
      });

      let conversationId = null;
      for (const [cid, users] of convoMap.entries()) {
        if (users.has(jobPosterId) && users.has(seekerUserId)) {
          conversationId = cid;
          break;
        }
      }

      if (!conversationId) {
        // Check if a channelless conversation exists between these two and fix it
        const channellessParts = await prisma.conversationParticipant.findMany({
          where: {
            userId: { in: [jobPosterId, seekerUserId] },
            conversation: { channel: null },
          },
          select: { conversationId: true, userId: true },
        });

        const channellessMap = new Map();
        channellessParts.forEach((p) => {
          if (!channellessMap.has(p.conversationId)) channellessMap.set(p.conversationId, new Set());
          channellessMap.get(p.conversationId).add(p.userId);
        });

        for (const [cid, users] of channellessMap.entries()) {
          if (users.has(jobPosterId) && users.has(seekerUserId)) {
            // Fix the channel on this existing conversation
            await prisma.conversation.update({
              where: { id: cid },
              data: { channel: 'recruiter' },
            });
            conversationId = cid;
            console.log(`  [${app.id}] Fixed channel on existing conversation ${cid}`);
            break;
          }
        }

        // Still no conversation — create one
        if (!conversationId) {
          const convo = await prisma.conversation.create({
            data: {
              isGroup: false,
              channel: 'recruiter',
              participants: {
                create: [
                  { userId: jobPosterId },
                  { userId: seekerUserId },
                ],
              },
            },
            select: { id: true },
          });
          conversationId = convo.id;

          // Add a system message so the thread appears non-empty
          await prisma.message.create({
            data: {
              conversationId,
              senderId: seekerUserId,
              content: `Applied for ${groupName}`,
            },
          });
          console.log(`  [${app.id}] Created recruiter conversation ${conversationId}`);
        }
      }

      fixed++;
    } catch (err) {
      console.error(`  [${app.id}] ERROR:`, err.message);
      errors++;
    }
  }

  console.log('\n── Migration complete ──────────────────────────────');
  console.log(`  Fixed:   ${fixed}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Errors:  ${errors}`);
  console.log('────────────────────────────────────────────────────\n');
}

main()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });