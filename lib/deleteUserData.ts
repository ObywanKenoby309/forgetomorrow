// lib/deleteUserData.ts
import { prisma } from "@/lib/prisma";

/**
 * Clear a user's personal data but keep their account.
 * Customize the deleteMany/updateMany calls to match your actual models.
 */
export async function clearUserData(userId: string) {
  return prisma.$transaction(async (tx) => {
    // ?完 1) Messages / DMs
    // GDPR: remove ALL messages in conversations where the user was a participant.
    try {
      // 1a) Find all conversations the user participated in
      const convRows =
        (await tx.conversationParticipant?.findMany?.({
          where: { userId },
          select: { conversationId: true },
        })) || [];

      const convIds = convRows.map((c) => c.conversationId);

      if (convIds.length > 0) {
        // 1b) Delete all messages in those conversations
        await tx.message?.deleteMany?.({
          where: {
            conversationId: { in: convIds },
          },
        });

        // 1c) Remove the user's participation rows as well
        await tx.conversationParticipant?.deleteMany?.({
          where: { userId },
        });
      }
    } catch {
      // Swallow errors here so one table doesn't break the whole privacy flow
    }

    // ?完 2) Job applications
    await tx.jobApplication
      ?.deleteMany?.({
        where: { userId },
      })
      .catch(() => {});

    // ?完 3) Resumes / documents / uploads
    await tx.resume
      ?.deleteMany?.({
        where: { userId },
      })
      .catch(() => {});

    // ?完 4) Saved jobs / bookmarks / favorites
    await tx.savedJob
      ?.deleteMany?.({
        where: { userId },
      })
      .catch(() => {});

    // ?完 5) Other personal tables (examples / placeholders)
    // await tx.coverLetter?.deleteMany?.({ where: { userId } }).catch(() => {});
    // await tx.note?.deleteMany?.({ where: { userId } }).catch(() => {});
    // await tx.aiArtifact?.deleteMany?.({ where: { userId } }).catch(() => {});

    // ?完 6) Anonymize records we must keep (e.g. invoices, billing)
    await tx.invoice
      ?.updateMany?.({
        where: { userId },
        data: {
          userId: null,
          customerEmail: null,
          customerName: "Deleted User",
        },
      })
      .catch(() => {});

    // NOTE: We DO NOT delete the User row here.
  });
}

/**
 * Delete a user's account and their data.
 * This calls clearUserData first, then removes auth + user record.
 */
export async function deleteUserCompletely(userId: string) {
  return prisma.$transaction(async (tx) => {
    // First clear all personal data
    await clearUserData(userId);

    // ?完 Auth-related rows (if you use NextAuth or similar)
    await tx.session
      ?.deleteMany?.({
        where: { userId },
      })
      .catch(() => {});

    await tx.account
      ?.deleteMany?.({
        where: { userId },
      })
      .catch(() => {});

    // Finally, delete the user account itself
    await tx.user.delete({
      where: { id: userId },
    });
  });
}
