// lib/privacy/deleteUserData.ts
import { prisma } from "@/lib/prisma";

/**
 * Clear a user's personal data but keep their account.
 * This is used for "Clear my data, keep my account".
 */
export async function clearUserData(userId: string) {
  return prisma.$transaction(async (tx) => {
    // ─────────────────────────────────────────────────────────────
    //  JOB SEEKER DATA
    // ─────────────────────────────────────────────────────────────

    // Applications the user has submitted
    await tx.application.deleteMany({
      where: { userId },
    });

    // Job views recorded for this user
    await tx.jobView.deleteMany({
      where: { userId },
    });

    // Interviews tied to this user
    await tx.interview.deleteMany({
      where: { userId },
    });

    // Offers tied to this user
    await tx.offer.deleteMany({
      where: { userId },
    });

    // Jobs pinned by this user
    await tx.pinnedJob.deleteMany({
      where: { userId },
    });

    // Resumes the user has created
    await tx.resume.deleteMany({
      where: { userId },
    });

    // Cover letters the user has created
    await tx.cover.deleteMany({
      where: { userId },
    });

    // Scan logs (ATS scan history)
    await tx.scanLog.deleteMany({
      where: { userId },
    });

    // Career path / roadmap data
    await tx.careerRoadmap.deleteMany({
      where: { userId },
    });

    // Negotiation tool runs
    await tx.negotiation.deleteMany({
      where: { userId },
    });

    // Profile snapshots created by the AI tools
    await tx.profileSnapshot.deleteMany({
      where: { userId },
    });

    // Consent logs (like cookie/marketing consent)
    await tx.userConsent.deleteMany({
      where: { userId },
    });

    // Recruiter candidate automation rules created by this user
    await tx.recruiterCandidateAutomation.deleteMany({
      where: { userId },
    });

    // Candidate snapshot records referencing this user
    await tx.candidate.deleteMany({
      where: { userId },
    });

    // NOTE:
    // - We DO NOT delete Job records here (jobs the user owns as a recruiter),
    //   because this is "clear my data, keep my account". Jobs are considered
    //   workspace / business entities, not personal usage data.
    // - We DO NOT delete the User row itself here.
  });
}

/**
 * Delete a user's account and their data.
 * This is used for "Delete my account & data".
 * It:
 *  - Deletes all personal records (applications, resumes, scans, etc.)
 *  - Deletes jobs owned by this user AND their related records
 *  - Deletes candidate/automation rows
 *  - Deletes verification tokens for this email
 *  - Finally deletes the User row
 */
export async function deleteUserCompletely(userId: string) {
  // Look up the user once so we can remove related email-based records
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    // Nothing to do
    return;
  }

  return prisma.$transaction(async (tx) => {
    // ─────────────────────────────────────────────────────────────
    //  JOBS OWNED BY THIS USER (RECRUITER)
    // ─────────────────────────────────────────────────────────────

    const jobsOwned = await tx.job.findMany({
      where: { userId },
      select: { id: true },
    });

    const ownedJobIds = jobsOwned.map((j) => j.id);

    if (ownedJobIds.length > 0) {
      // Delete applications tied to these jobs (from any seeker)
      await tx.application.deleteMany({
        where: { jobId: { in: ownedJobIds } },
      });

      // Delete views tied to these jobs
      await tx.jobView.deleteMany({
        where: { jobId: { in: ownedJobIds } },
      });

      // Delete interviews tied to these jobs
      await tx.interview.deleteMany({
        where: { jobId: { in: ownedJobIds } },
      });

      // Delete offers tied to these jobs
      await tx.offer.deleteMany({
        where: { jobId: { in: ownedJobIds } },
      });

      // Delete pinned jobs tied to these jobs
      await tx.pinnedJob.deleteMany({
        where: { jobId: { in: ownedJobIds } },
      });

      // Delete covers explicitly linked to these jobs
      await tx.cover.deleteMany({
        where: { jobId: { in: ownedJobIds } },
      });

      // Finally delete the jobs themselves
      await tx.job.deleteMany({
        where: { id: { in: ownedJobIds } },
      });
    }

    // ─────────────────────────────────────────────────────────────
    //  PERSONAL DATA (SAME AS clearUserData, PLUS SOME EXTRAS)
    // ─────────────────────────────────────────────────────────────

    // Applications submitted BY this user
    await tx.application.deleteMany({
      where: { userId },
    });

    // Job views recorded for this user
    await tx.jobView.deleteMany({
      where: { userId },
    });

    // Interviews tied to this user
    await tx.interview.deleteMany({
      where: { userId },
    });

    // Offers tied to this user
    await tx.offer.deleteMany({
      where: { userId },
    });

    // Pinned jobs for this user
    await tx.pinnedJob.deleteMany({
      where: { userId },
    });

    // Resumes
    await tx.resume.deleteMany({
      where: { userId },
    });

    // Covers
    await tx.cover.deleteMany({
      where: { userId },
    });

    // Scan logs
    await tx.scanLog.deleteMany({
      where: { userId },
    });

    // Career roadmaps
    await tx.careerRoadmap.deleteMany({
      where: { userId },
    });

    // Negotiations
    await tx.negotiation.deleteMany({
      where: { userId },
    });

    // Profile snapshots
    await tx.profileSnapshot.deleteMany({
      where: { userId },
    });

    // Consent logs
    await tx.userConsent.deleteMany({
      where: { userId },
    });

    // Recruiter candidate automations
    await tx.recruiterCandidateAutomation.deleteMany({
      where: { userId },
    });

    // Candidate records referencing this user
    await tx.candidate.deleteMany({
      where: { userId },
    });

    // Verification tokens for this user's email (signup tokens)
    if (user.email) {
      await tx.verificationToken.deleteMany({
        where: { email: user.email },
      });
    }

    // ─────────────────────────────────────────────────────────────
    //  FINALLY, DELETE THE USER RECORD
    // ─────────────────────────────────────────────────────────────

    await tx.user.delete({
      where: { id: userId },
    });
  });
}
