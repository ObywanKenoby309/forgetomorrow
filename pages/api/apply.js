// pages/api/apply.js
// Seeker submits a job application.
// Recruiter behavior:
//   - CandidateGroup ensured for the job (org-scoped)
//   - Single shared org Candidates root
//   - Single shared org job subcategory under Candidates
//   - Canonical recruiter-owned contact for the candidate
//   - Single org-scoped RecruiterCandidate record
//   - ContactCategoryAssignment written against the canonical contact
//   - CandidateGroupMember written once for the org candidate
//
// Seeker behavior remains unchanged.

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function buildJobGroupName(jobId, title) {
  return `Job ${jobId} - ${String(title || '').trim()}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const seekerUserId = session.user.id;
  const { jobId, resumeId, coverId } = req.body || {};

  if (!jobId) {
    return res.status(400).json({ error: 'jobId is required' });
  }

  try {
    // ── Load job ──────────────────────────────────────────────────────────────
    const job = await prisma.job.findUnique({
      where: { id: Number(jobId) },
      select: {
        id: true,
        title: true,
        accountKey: true,
        userId: true,
        status: true,
      },
    });

    if (!job?.id) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // ── Create application ────────────────────────────────────────────────────
    const application = await prisma.application.create({
      data: {
        userId: seekerUserId,
        jobId: job.id,
        resumeId: resumeId || null,
        coverId: coverId || null,
        source: 'FORGETOMORROW',
        accountKey: job.accountKey || null,
      },
    });

    await prisma.job.update({
      where: { id: job.id },
      data: { applicationsCount: { increment: 1 } },
    });

    // ── Recruiter pipeline automation only if job has an org ─────────────────
    const orgAccountKey = job.accountKey || null;
    if (!orgAccountKey) {
      return res.status(200).json(application);
    }

    const groupName = buildJobGroupName(job.id, job.title);
    const jobPosterId = String(job.userId || '');

    // ── Step 1: Ensure CandidateGroup ─────────────────────────────────────────
    let candidateGroup = await prisma.candidateGroup.findFirst({
      where: { accountKey: orgAccountKey, jobId: job.id },
      select: { id: true, name: true, status: true },
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
        select: { id: true, name: true, status: true },
      });
    } else if (
      candidateGroup.name !== groupName ||
      candidateGroup.status !== 'active'
    ) {
      candidateGroup = await prisma.candidateGroup.update({
        where: { id: candidateGroup.id },
        data: { name: groupName, status: 'active' },
        select: { id: true, name: true, status: true },
      });
    }

    // ── Step 2: Ensure shared org Candidates root ────────────────────────────
    let candidatesRoot = await prisma.contactCategory.findFirst({
      where: {
        accountKey: orgAccountKey,
        parentCategoryId: null,
        name: 'Candidates',
      },
      select: { id: true },
    });

    if (!candidatesRoot) {
      candidatesRoot = await prisma.contactCategory.create({
        data: {
          accountKey: orgAccountKey,
          userId: jobPosterId,
          name: 'Candidates',
          parentCategoryId: null,
        },
        select: { id: true },
      });
    }

    // ── Step 3: Ensure shared org job subcategory ─────────────────────────────
    let jobCategory = await prisma.contactCategory.findFirst({
      where: {
        accountKey: orgAccountKey,
        parentCategoryId: candidatesRoot.id,
        name: groupName,
      },
      select: { id: true },
    });

    if (!jobCategory) {
      jobCategory = await prisma.contactCategory.create({
        data: {
          accountKey: orgAccountKey,
          userId: jobPosterId,
          name: groupName,
          parentCategoryId: candidatesRoot.id,
        },
        select: { id: true },
      });
    }

    // ── Step 4: Load all recruiters in the org ───────────────────────────────
    const orgMembers = await prisma.organizationMember.findMany({
      where: { accountKey: orgAccountKey },
      select: { userId: true },
      orderBy: { createdAt: 'asc' },
    });

    const recruiterUserIds = [
      ...new Set(orgMembers.map((m) => String(m.userId || '')).filter(Boolean)),
    ];

    // ── Step 5: Ensure ONE canonical recruiter-owned contact for this seeker ──
    // Contact model is recruiter-owned by userId, so we canonicalize to the job poster.
    const legacyContacts = recruiterUserIds.length
      ? await prisma.contact.findMany({
          where: {
            contactUserId: seekerUserId,
            userId: { in: recruiterUserIds },
          },
          select: {
            id: true,
            userId: true,
            contactUserId: true,
          },
          orderBy: { createdAt: 'asc' },
        })
      : [];

    let orgContact =
      legacyContacts.find((c) => String(c.userId) === jobPosterId) ||
      legacyContacts[0] ||
      null;

    if (!orgContact) {
      orgContact = await prisma.contact.create({
        data: {
          userId: jobPosterId,
          contactUserId: seekerUserId,
        },
        select: {
          id: true,
          userId: true,
          contactUserId: true,
        },
      });
    } else if (String(orgContact.userId) !== jobPosterId) {
      orgContact = await prisma.contact.update({
        where: { id: orgContact.id },
        data: {
          userId: jobPosterId,
        },
        select: {
          id: true,
          userId: true,
          contactUserId: true,
        },
      });
    }

    // ── Step 6: Ensure ONE org-scoped RecruiterCandidate ──────────────────────
    let recruiterCandidate = await prisma.recruiterCandidate.findFirst({
      where: {
        accountKey: orgAccountKey,
        candidateUserId: seekerUserId,
      },
      select: { id: true },
    });

    if (!recruiterCandidate) {
      recruiterCandidate = await prisma.recruiterCandidate.create({
        data: {
          recruiterUserId: jobPosterId,
          candidateUserId: seekerUserId,
          accountKey: orgAccountKey,
        },
        select: { id: true },
      });
    }

    // ── Step 7: Clean duplicate candidate assignments for this org/contact set ─
    const legacyContactIds = [
      ...new Set(legacyContacts.map((c) => String(c.id || '')).filter(Boolean)),
    ];

    if (legacyContactIds.length) {
      await prisma.contactCategoryAssignment.deleteMany({
        where: {
          accountKey: orgAccountKey,
          contactId: { in: legacyContactIds },
          OR: [
            { categoryId: candidatesRoot.id },
            { categoryId: jobCategory.id },
          ],
        },
      });
    }

    // ── Step 8: Assign canonical contact into the job bucket ──────────────────
    await prisma.contactCategoryAssignment.upsert({
      where: {
        accountKey_contactId_categoryId: {
          accountKey: orgAccountKey,
          contactId: orgContact.id,
          categoryId: jobCategory.id,
        },
      },
      update: {
        userId: jobPosterId,
      },
      create: {
        accountKey: orgAccountKey,
        userId: jobPosterId,
        contactId: orgContact.id,
        categoryId: jobCategory.id,
      },
    });

        // ── Step 9: CandidateGroupMember ──────────────────────────────────────────
    await prisma.candidateGroupMember.upsert({
      where: {
        groupId_recruiterCandidateId: {
          groupId: candidateGroup.id,
          recruiterCandidateId: recruiterCandidate.id,
        },
      },
      update: {},
      create: {
        groupId: candidateGroup.id,
        recruiterCandidateId: recruiterCandidate.id,
        addedByUserId: seekerUserId,
      },
    });

    // ── Step 10: Ensure recruiter ↔ candidate conversation ───────────────────

    // Find existing conversation between these two users
    let existing = await prisma.conversationParticipant.findMany({
      where: {
        userId: { in: [jobPosterId, seekerUserId] },
      },
      select: {
        conversationId: true,
        userId: true,
      },
    });

    // Group by conversationId
    const convoMap = new Map();

    existing.forEach((p) => {
      if (!convoMap.has(p.conversationId)) {
        convoMap.set(p.conversationId, new Set());
      }
      convoMap.get(p.conversationId).add(p.userId);
    });

    let conversationId = null;

    for (const [cid, users] of convoMap.entries()) {
      if (users.has(jobPosterId) && users.has(seekerUserId)) {
        conversationId = cid;
        break;
      }
    }

    // Create conversation if not found
    if (!conversationId) {
      const convo = await prisma.conversation.create({
        data: {
          isGroup: false,
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
    }

    // Create system message
    await prisma.message.create({
      data: {
        conversationId,
        senderId: seekerUserId,
        content: 'Application submitted',
      },
    });

    return res.status(200).json(application);
	} catch (error) {
    console.error('[/api/apply] Error:', error);
    return res.status(500).json({
      error: 'Failed to submit application',
      detail: error?.message || null,
      code: error?.code || null,
      meta: error?.meta || null,
    });
  }
}