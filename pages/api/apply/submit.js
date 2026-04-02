// pages/api/apply/submit.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notifications/writer';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'dev-secret-change-in-production';

function getCookie(req, name) {
  try {
    const raw = req.headers?.cookie || '';
    const parts = raw.split(';').map((p) => p.trim());
    for (const p of parts) {
      if (p.startsWith(name + '=')) {
        return decodeURIComponent(p.slice(name.length + 1));
      }
    }
    return null;
  } catch {
    return null;
  }
}

function normalizeEmail(v) {
  const s = String(v || '').toLowerCase().trim();
  return s || null;
}

function buildJobGroupName(jobId, title) {
  return `Job ${jobId} - ${String(title || '').trim()}`;
}

async function getAuthedUserId(req, res) {
  const session = await getServerSession(req, res, authOptions);
  const sid = session?.user?.id;
  if (sid) return sid;

  const token = getCookie(req, 'auth');
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const email = normalizeEmail(decoded?.email);
    if (!email) return null;

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    return user?.id || null;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  try {
    const userId = await getAuthedUserId(req, res);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { applicationId } = req.body || {};
    const appId = Number(applicationId);
    if (!appId) return res.status(400).json({ error: 'Missing applicationId' });

    const app = await prisma.application.findUnique({
      where: { id: appId },
      include: {
        consent: true,
        answers: true,
        template: true,
      },
    });

    if (!app || app.userId !== userId) return res.status(403).json({ error: 'Forbidden' });

    if (!app.consent || !app.consent.termsAccepted) {
      return res.status(400).json({ error: 'Consent is required before submitting.' });
    }
    const sig = String(app.consent.signatureName || '').trim();
    if (sig.length < 2) {
      return res.status(400).json({ error: 'Signature name is required before submitting.' });
    }

    if (app.submittedAt) {
      return res.status(200).json({ ok: true, alreadySubmitted: true, submittedAt: app.submittedAt });
    }

    const now = new Date();

    // ── Submit + bump job counter ─────────────────────────────────────────────
    const result = await prisma.$transaction(async (tx) => {
      const updatedApp = await tx.application.update({
        where: { id: appId },
        data: {
          submittedAt: now,
          status: 'Applied',
        },
      });

      if (updatedApp.jobId) {
        await tx.job.update({
          where: { id: updatedApp.jobId },
          data: { applicationsCount: { increment: 1 } },
        });
      }

      return updatedApp;
    });

    // ── Pipeline automation — only if job has an org ──────────────────────────
    const orgAccountKey = result.accountKey || null;
    if (!orgAccountKey || !result.jobId) {
      return res.status(200).json({ ok: true, application: result });
    }

    // Load the job for title and poster
    const job = await prisma.job.findUnique({
      where: { id: result.jobId },
      select: { id: true, title: true, userId: true, accountKey: true },
    });

    if (!job) {
      return res.status(200).json({ ok: true, application: result });
    }

    const seekerUserId = userId;
    const jobPosterId = String(job.userId || '');
    const groupName = buildJobGroupName(job.id, job.title);

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

    // ── Step 2: Ensure shared org Candidates root ─────────────────────────────
    let candidatesRoot = await prisma.contactCategory.findFirst({
      where: { accountKey: orgAccountKey, parentCategoryId: null, name: 'Candidates' },
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

    // ── Step 4: Load all recruiters in the org ────────────────────────────────
    const orgMembers = await prisma.organizationMember.findMany({
      where: { accountKey: orgAccountKey },
      select: { userId: true },
      orderBy: { createdAt: 'asc' },
    });

    const recruiterUserIds = [
      ...new Set(orgMembers.map((m) => String(m.userId || '')).filter(Boolean)),
    ];

    // ── Step 5: Ensure canonical job-poster-owned contact for this seeker ─────
    const legacyContacts = recruiterUserIds.length
      ? await prisma.contact.findMany({
          where: {
            contactUserId: seekerUserId,
            userId: { in: recruiterUserIds },
          },
          select: { id: true, userId: true, contactUserId: true },
          orderBy: { createdAt: 'asc' },
        })
      : [];

    let orgContact = legacyContacts.find((c) => String(c.userId) === jobPosterId) || null;

    if (!orgContact) {
      try {
        orgContact = await prisma.contact.create({
          data: { userId: jobPosterId, contactUserId: seekerUserId },
          select: { id: true, userId: true, contactUserId: true },
        });
      } catch {
        orgContact = await prisma.contact.findUnique({
          where: {
            userId_contactUserId: { userId: jobPosterId, contactUserId: seekerUserId },
          },
          select: { id: true, userId: true, contactUserId: true },
        });
      }
    }

    // ── Step 6: Ensure ONE org-scoped RecruiterCandidate ──────────────────────
    let recruiterCandidate = await prisma.recruiterCandidate.findFirst({
      where: { accountKey: orgAccountKey, candidateUserId: seekerUserId },
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

    // ── Step 7: Clean any bad root-level assignments ──────────────────────────
    if (orgContact?.id) {
      await prisma.contactCategoryAssignment.deleteMany({
        where: {
          accountKey: orgAccountKey,
          contactId: orgContact.id,
          categoryId: candidatesRoot.id,
        },
      });
    }

    // ── Step 8: Assign canonical contact into the job bucket ──────────────────
    if (orgContact?.id && jobCategory?.id) {
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

    // ── Step 10: Ensure recruiter ↔ candidate conversation ────────────────────
    const existingParticipations = await prisma.conversationParticipant.findMany({
      where: {
        userId: { in: [jobPosterId, seekerUserId] },
        conversation: { channel: 'recruiter' },
      },
      select: { conversationId: true, userId: true },
    });

    const convoMap = new Map();
    existingParticipations.forEach((p) => {
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
      const convo = await prisma.conversation.create({
        data: {
          isGroup: false,
          channel: 'recruiter',
          participants: {
            create: [{ userId: jobPosterId }, { userId: seekerUserId }],
          },
        },
        select: { id: true },
      });
      conversationId = convo.id;
    }

    await prisma.message.create({
      data: {
        conversationId,
        senderId: seekerUserId,
        content: `Applied for ${groupName}`,
      },
    });

    // ── Step 11: Notify all org recruiters of new application ─────────────────
    await Promise.all(
      recruiterUserIds.map((recruiterId) =>
        createNotification({
          userId: recruiterId,
          actorUserId: seekerUserId,
          category: 'APPLICATION',
          scope: 'RECRUITER',
          entityType: 'APPLICATION',
          entityId: String(result.id),
          dedupeKey: `application:new:${result.id}:${recruiterId}`,
          title: `New application for ${job.title}`,
          body: null,
          requiresAction: true,
          metadata: {
            jobId: job.id,
            jobTitle: job.title,
            applicationId: result.id,
            accountKey: orgAccountKey,
          },
        })
      )
    );

    return res.status(200).json({ ok: true, application: result });
  } catch (e) {
    console.error('[/api/apply/submit] Error:', e);
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
}