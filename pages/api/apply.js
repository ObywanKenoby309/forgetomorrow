// pages/api/apply.js
// Seeker submits a job application.
// Triggers full pipeline automation for the recruiter org:
//   - CandidateGroup ensured for the job (org-scoped)
//   - ContactCategory tree seeded once for the org (not per-recruiter)
//   - Contact row created per recruiter (one-directional: recruiter → seeker)
//   - RecruiterCandidate record per recruiter (org-scoped)
//   - ContactCategoryAssignment written per recruiter contact row
//   - CandidateGroupMember written once (canonical anchor)
//
// Seeker sees nothing until a recruiter initiates contact.

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

    // ── Pipeline automation — only if job has an org ──────────────────────────
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
    } else if (candidateGroup.name !== groupName || candidateGroup.status !== 'active') {
      candidateGroup = await prisma.candidateGroup.update({
        where: { id: candidateGroup.id },
        data: { name: groupName, status: 'active' },
        select: { id: true, name: true, status: true },
      });
    }

    // ── Step 2: Ensure org-scoped ContactCategory tree ────────────────────────
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

    await prisma.contactCategory.upsert({
      where: {
        accountKey_parentCategoryId_name: {
          accountKey: orgAccountKey,
          parentCategoryId: candidatesRoot.id,
          name: 'Unassigned / Review Queue',
        },
      },
      update: {},
      create: {
        accountKey: orgAccountKey,
        userId: jobPosterId,
        name: 'Unassigned / Review Queue',
        parentCategoryId: candidatesRoot.id,
      },
    });

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

    // ── Step 3: Get all recruiters in the org ─────────────────────────────────
    const orgMembers = await prisma.organizationMember.findMany({
      where: { accountKey: orgAccountKey },
      select: { userId: true },
      orderBy: { createdAt: 'asc' },
    });

    const recruiterUserIds = [
      ...new Set(orgMembers.map((m) => String(m.userId || '')).filter(Boolean)),
    ];

    if (!recruiterUserIds.length) {
      return res.status(200).json(application);
    }

    // ── Step 4: Per recruiter — Contact row + RecruiterCandidate ─────────────
    let canonicalRecruiterCandidateId = null;

    for (const recruiterUserId of recruiterUserIds) {
      await prisma.contact.upsert({
        where: {
          userId_contactUserId: {
            userId: recruiterUserId,
            contactUserId: seekerUserId,
          },
        },
        update: {},
        create: {
          userId: recruiterUserId,
          contactUserId: seekerUserId,
        },
      });

      const rc = await prisma.recruiterCandidate.upsert({
        where: {
          recruiterUserId_candidateUserId_accountKey: {
            recruiterUserId,
            candidateUserId: seekerUserId,
            accountKey: orgAccountKey,
          },
        },
        update: {},
        create: {
          recruiterUserId,
          candidateUserId: seekerUserId,
          accountKey: orgAccountKey,
        },
        select: { id: true, recruiterUserId: true },
      });

      if (recruiterUserId === jobPosterId || canonicalRecruiterCandidateId === null) {
        canonicalRecruiterCandidateId = rc.id;
      }
    }

    // ── Step 5: ContactCategoryAssignment per recruiter's own contact row ─────
    // This matches what the single shared contact center actually reads.
    for (const recruiterUserId of recruiterUserIds) {
      const recruiterContact = await prisma.contact.findUnique({
        where: {
          userId_contactUserId: {
            userId: recruiterUserId,
            contactUserId: seekerUserId,
          },
        },
        select: { id: true },
      });

      if (!recruiterContact?.id || !jobCategory?.id) continue;

      await prisma.contactCategoryAssignment.deleteMany({
        where: {
          accountKey: orgAccountKey,
          contactId: recruiterContact.id,
          categoryId: candidatesRoot.id,
        },
      });

      await prisma.contactCategoryAssignment.upsert({
        where: {
          accountKey_contactId_categoryId: {
            accountKey: orgAccountKey,
            contactId: recruiterContact.id,
            categoryId: jobCategory.id,
          },
        },
        update: {},
        create: {
          accountKey: orgAccountKey,
          userId: recruiterUserId,
          contactId: recruiterContact.id,
          categoryId: jobCategory.id,
        },
      });
    }

    // ── Step 6: CandidateGroupMember ──────────────────────────────────────────
    if (candidateGroup?.id && canonicalRecruiterCandidateId) {
      await prisma.candidateGroupMember.upsert({
        where: {
          groupId_recruiterCandidateId: {
            groupId: candidateGroup.id,
            recruiterCandidateId: canonicalRecruiterCandidateId,
          },
        },
        update: {},
        create: {
          groupId: candidateGroup.id,
          recruiterCandidateId: canonicalRecruiterCandidateId,
          addedByUserId: seekerUserId,
        },
      });
    }

    return res.status(200).json(application);
  } catch (error) {
    console.error('[/api/apply] Error:', error);
    return res.status(500).json({ error: 'Failed to submit application' });
  }
}