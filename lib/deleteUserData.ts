// lib/privacy/deleteUserData.ts
import { prisma } from "@/lib/prisma";

/**
 * Clear a user's personal data but keep their account.
 * Customize the deleteMany/updateMany calls to match your actual models.
 */
export async function clearUserData(userId: string) {
  return prisma.$transaction(async (tx) => {
    // 🧹 1) Messages / DMs
    // TODO: rename `message` + fields to your real models/columns
    await tx.message?.deleteMany?.({
      where: {
        OR: [{ senderId: userId }, { recipientId: userId }],
      },
    }).catch(() => {});

    // 🧹 2) Job applications
    await tx.jobApplication?.deleteMany?.({
      where: { userId },
    }).catch(() => {});

    // 🧹 3) Resumes / documents / uploads
    await tx.resume?.deleteMany?.({
      where: { userId },
    }).catch(() => {});

    // 🧹 4) Saved jobs / bookmarks / favorites
    await tx.savedJob?.deleteMany?.({
      where: { userId },
    }).catch(() => {});

    // 🧹 5) Other personal tables (examples / placeholders)
    // await tx.coverLetter?.deleteMany?.({ where: { userId } }).catch(() => {});
    // await tx.note?.deleteMany?.({ where: { userId } }).catch(() => {});
    // await tx.aiArtifact?.deleteMany?.({ where: { userId } }).catch(() => {});

    // 🧹 6) Anonymize records we must keep (e.g. invoices, billing)
    await tx.invoice?.updateMany?.({
      where: { userId },
      data: {
        userId: null,
        customerEmail: null,
        customerName: "Deleted User",
      },
    }).catch(() => {});

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

    // 🧹 Auth-related rows (if you use NextAuth or similar)
    await tx.session?.deleteMany?.({
      where: { userId },
    }).catch(() => {});

    await tx.account?.deleteMany?.({
      where: { userId },
    }).catch(() => {});

    // Finally, delete the user account itself
    await tx.user.delete({
      where: { id: userId },
    });
  });
}
