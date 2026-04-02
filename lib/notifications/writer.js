// lib/notifications/writer.js
import { prisma } from "@/lib/prisma";

/**
 * Upserts a notification using the dedupeKey.
 *
 * For ITIL-style breach notifications (e.g. stalled candidates):
 *   - First breach creates the record
 *   - Subsequent calls with the same dedupeKey are silent no-ops (readAt is NOT reset)
 *   - Resolution happens when the trigger point calls resolveNotification()
 *
 * For event notifications (e.g. new application, status change):
 *   - Each discrete event should have a unique dedupeKey (include a timestamp or entityId)
 *   - Re-firing the same dedupeKey updates title/body but does NOT unread it
 */
export async function createNotification({
  userId,
  actorUserId = null,
  category,
  scope,
  entityType,
  entityId,
  dedupeKey,
  title,
  body = null,
  requiresAction = true,
  metadata = null,
}) {
  if (!userId || !category || !scope || !entityType || !entityId || !dedupeKey || !title) {
    console.warn("[notifications/writer] Missing required fields — skipping", {
      userId, category, scope, entityType, entityId, dedupeKey, title,
    });
    return null;
  }

  try {
    const notification = await prisma.notification.upsert({
      where: {
        userId_dedupeKey: { userId, dedupeKey },
      },
      create: {
        userId,
        actorUserId,
        category,
        scope,
        entityType,
        entityId: String(entityId),
        dedupeKey,
        title,
        body,
        requiresAction,
        metadata,
      },
      update: {
        // For breach-style notifications: do NOT reset readAt — once breached, stays breached
        // Only refresh title/body in case the context changed (e.g. job title updated)
        title,
        body,
        metadata,
        actorUserId,
      },
    });

    return notification;
  } catch (err) {
    // Never let a notification failure crash a real operation
    console.error("[notifications/writer] createNotification failed:", err);
    return null;
  }
}

/**
 * Resolves a breach-style notification when the condition is cleared.
 * Example: recruiter moves a stalled candidate → clears the stalled alert.
 *
 * Pass the same dedupeKey that was used to create it.
 */
export async function resolveNotification({ userId, dedupeKey }) {
  if (!userId || !dedupeKey) return null;

  try {
    const notification = await prisma.notification.updateMany({
      where: {
        userId,
        dedupeKey,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return notification;
  } catch (err) {
    console.error("[notifications/writer] resolveNotification failed:", err);
    return null;
  }
}

/**
 * Bulk resolve — used by cron or batch operations.
 * Example: job expired notification resolved when job is republished.
 */
export async function resolveNotificationsByEntity({ userId, entityType, entityId }) {
  if (!userId || !entityType || !entityId) return null;

  try {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        entityType,
        entityId: String(entityId),
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return result;
  } catch (err) {
    console.error("[notifications/writer] resolveNotificationsByEntity failed:", err);
    return null;
  }
}