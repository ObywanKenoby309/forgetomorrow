// pages/api/apply.js
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function buildJobGroupName(jobId, title) {
  return `Job ${jobId} - ${String(title || "").trim()}`;
}

async function ensureRecruiterJobStructures({ accountKey, jobId, jobTitle }) {
  if (!accountKey || !jobId) return null;

  const groupName = buildJobGroupName(jobId, jobTitle);

  let candidateGroup = await prisma.candidateGroup.findFirst({
    where: {
      accountKey,
      jobId,
    },
    select: {
      id: true,
      name: true,
      status: true,
    },
  });

  if (!candidateGroup) {
    candidateGroup = await prisma.candidateGroup.create({
      data: {
        accountKey,
        jobId,
        name: groupName,
        isSystem: true,
        status: "active",
      },
      select: {
        id: true,
        name: true,
        status: true,
      },
    });
  } else if (
    candidateGroup.name !== groupName ||
    candidateGroup.status !== "active"
  ) {
    candidateGroup = await prisma.candidateGroup.update({
      where: { id: candidateGroup.id },
      data: {
        name: groupName,
        status: "active",
      },
      select: {
        id: true,
        name: true,
        status: true,
      },
    });
  }

  const orgMembers = await prisma.organizationMember.findMany({
    where: { accountKey },
    select: { userId: true },
  });

  const recruiterUserIds = [
    ...new Set(
      (orgMembers || [])
        .map((m) => String(m.userId || ""))
        .filter(Boolean)
    ),
  ];

  for (const recruiterUserId of recruiterUserIds) {
    let parentCategory = await prisma.contactCategory.findFirst({
      where: {
        userId: recruiterUserId,
        accountKey,
        name: "Candidates",
        parentCategoryId: null,
      },
      select: { id: true },
    });

    if (!parentCategory) {
      parentCategory = await prisma.contactCategory.create({
        data: {
          userId: recruiterUserId,
          accountKey,
          name: "Candidates",
          parentCategoryId: null,
        },
        select: { id: true },
      });
    }

    const existingJobCategory = await prisma.contactCategory.findFirst({
      where: {
        userId: recruiterUserId,
        accountKey,
        parentCategoryId: parentCategory.id,
        name: groupName,
      },
      select: { id: true },
    });

    if (!existingJobCategory) {
      await prisma.contactCategory.create({
        data: {
          userId: recruiterUserId,
          accountKey,
          name: groupName,
          parentCategoryId: parentCategory.id,
        },
      });
    }
  }

  return candidateGroup;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { jobId, resumeId, coverId } = req.body || {};

  if (!jobId) {
    return res.status(400).json({ error: "jobId is required" });
  }

  try {
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
      return res.status(404).json({ error: "Job not found" });
    }

    const application = await prisma.application.create({
      data: {
        userId: session.user.id,
        jobId: job.id,
        resumeId: resumeId || null,
        coverId: coverId || null,
        source: "FORGETOMORROW",
        accountKey: job.accountKey || null,
      },
    });

    await prisma.job.update({
      where: { id: job.id },
      data: { applicationsCount: { increment: 1 } },
    });

    const accountKey = job.accountKey || null;

    if (accountKey) {
      const candidateGroup = await ensureRecruiterJobStructures({
        accountKey,
        jobId: job.id,
        jobTitle: job.title,
      });

      const orgMembers = await prisma.organizationMember.findMany({
        where: { accountKey },
        select: { userId: true },
        orderBy: { createdAt: "asc" },
      });

      const recruiterUserIds = [
        ...new Set(
          (orgMembers || [])
            .map((m) => String(m.userId || ""))
            .filter(Boolean)
        ),
      ];

      const canonicalRecruiterUserId =
        recruiterUserIds.find((id) => id === String(job.userId || "")) ||
        recruiterUserIds[0] ||
        null;

      let canonicalRecruiterCandidateId = null;

      for (const recruiterUserId of recruiterUserIds) {
        const recruiterCandidate = await prisma.recruiterCandidate.upsert({
          where: {
            recruiterUserId_candidateUserId_accountKey: {
              recruiterUserId,
              candidateUserId: session.user.id,
              accountKey,
            },
          },
          update: {},
          create: {
            recruiterUserId,
            candidateUserId: session.user.id,
            accountKey,
          },
          select: {
            id: true,
            recruiterUserId: true,
          },
        });

        if (
          canonicalRecruiterUserId &&
          recruiterCandidate.recruiterUserId === canonicalRecruiterUserId
        ) {
          canonicalRecruiterCandidateId = recruiterCandidate.id;
        }

        const contact = await prisma.contact.upsert({
          where: {
            userId_contactUserId: {
              userId: recruiterUserId,
              contactUserId: session.user.id,
            },
          },
          update: {},
          create: {
            userId: recruiterUserId,
            contactUserId: session.user.id,
          },
          select: { id: true },
        });

        let parentCategory = await prisma.contactCategory.findFirst({
          where: {
            userId: recruiterUserId,
            accountKey,
            name: "Candidates",
            parentCategoryId: null,
          },
          select: { id: true },
        });

        if (!parentCategory) {
          parentCategory = await prisma.contactCategory.create({
            data: {
              userId: recruiterUserId,
              accountKey,
              name: "Candidates",
              parentCategoryId: null,
            },
            select: { id: true },
          });
        }

        const groupName = buildJobGroupName(job.id, job.title);

        let jobCategory = await prisma.contactCategory.findFirst({
          where: {
            userId: recruiterUserId,
            accountKey,
            parentCategoryId: parentCategory.id,
            name: groupName,
          },
          select: { id: true },
        });

        if (!jobCategory) {
          jobCategory = await prisma.contactCategory.create({
            data: {
              userId: recruiterUserId,
              accountKey,
              name: groupName,
              parentCategoryId: parentCategory.id,
            },
            select: { id: true },
          });
        }

        await prisma.contactCategoryAssignment.upsert({
          where: {
            userId_contactId_categoryId: {
              userId: recruiterUserId,
              contactId: contact.id,
              categoryId: parentCategory.id,
            },
          },
          update: {},
          create: {
            userId: recruiterUserId,
            accountKey,
            contactId: contact.id,
            categoryId: parentCategory.id,
          },
        });

        await prisma.contactCategoryAssignment.upsert({
          where: {
            userId_contactId_categoryId: {
              userId: recruiterUserId,
              contactId: contact.id,
              categoryId: jobCategory.id,
            },
          },
          update: {},
          create: {
            userId: recruiterUserId,
            accountKey,
            contactId: contact.id,
            categoryId: jobCategory.id,
          },
        });
      }

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
            addedByUserId: session.user.id,
          },
        });
      }
    }

    return res.status(200).json(application);
  } catch (error) {
    console.error("[/api/apply] Error:", error);
    return res.status(500).json({ error: "Failed to submit application" });
  }
}