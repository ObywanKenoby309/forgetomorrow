// pages/api/apply.js
// Seeker submits a job application.
// Recruiter behavior:
//   - CandidateGroup ensured for the job (org-scoped)
//   - Single shared org Candidates root
//   - Single shared org job subcategory under Candidates
//   - Single shared org contact for the candidate
//   - Single org-scoped RecruiterCandidate record
//   - ContactCategoryAssignment written against the shared org contact
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

    // ── Step 4: Load all recruiters in the org (for cleanup of legacy rows) ──
    const orgMembers = await prisma.organizationMember.findMany({
      where: { accountKey: orgAccountKey },
      select: { userId: true },
      orderBy: { createdAt: 'asc' },
    });

    const recruiterUserIds = [
      ...new Set(orgMembers.map((m) => String(m.userId || '')).filter(Boolean)),
    ];

    // ── Step 5: Ensure ONE shared org contact for this candidate ──────────────
    const legacyContacts = await prisma.contact.findMany({
      where: {
        contactUserId: seekerUserId,
        OR: [
          { accountKey: orgAccountKey },
          ...(recruiterUserIds.length
            ? [{ userId: { in: recruiterUserIds } }]
            : []),
        ],
      },
      select: {
        id: true,
        userId: true,
        accountKey: true,
        contactUserId: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    let orgContact =
      legacyContacts.find((c) => String(c.accountKey || '') === String(orgAccountKey)) ||
      legacyContacts[0] ||
      null;

    if (!orgContact) {
      orgContact = await prisma.contact.create({
        data: {
          accountKey: orgAccountKey,
          userId: jobPosterId,
          contactUserId: seekerUserId,
        },
        select: {
          id: true,
          userId: true,
          accountKey: true,
          contactUserId: true,
        },
      });
    } else if (String(orgContact.accountKey || '') !== String(orgAccountKey)) {
      orgContact = await prisma.contact.update({
        where: { id: orgContact.id },
        data: {
          accountKey: orgAccountKey,
        },
        select: {
          id: true,
          userId: true,
          accountKey: true,
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

    // ── Step 7: Clean legacy assignments for this candidate in this org ───────
    const legacyContactIds = [
      ...new Set(
        legacyContacts
          .map((c) => String(c.id || ''))
          .filter(Boolean)
      ),
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

    // ── Step 8: Assign shared org contact into the job bucket ─────────────────
    await prisma.contactCategoryAssignment.upsert({
      where: {
        accountKey_contactId_categoryId: {
          accountKey: orgAccountKey,
          contactId: orgContact.id,
          categoryId: jobCategory.id,
        },
      },
      update: {},
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

    return res.status(200).json(application);
  } catch (error) {
    console.error('[/api/apply] Error:', error);
    return res.status(500).json({ error: 'Failed to submit application' });
  }
}