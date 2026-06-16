// lib/notifications/writer.js
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/notifications/push";

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
 *
 * Push notifications fire ONLY on first creation by default (not on dedupe re-fires), so
 * breach-style alerts don't spam a user's phone every time the underlying trigger re-checks.
 *
 * Some notification types (e.g. chat messages) intentionally dedupe to ONE notification row
 * per thread/conversation so the unread badge doesn't multiply — but the user should still get
 * a push for every new message in that thread, not just the first one ever. Pass `forcePush: true`
 * for those cases: the DB row stays deduped, but push fires on every call regardless of
 * create-vs-update.
 *
 * Pass `pushUrl` to control where tapping the push notification navigates the user.
 * Pass `skipPush: true` to suppress push for this specific call (e.g. silent/internal notifications).
 *
 * @param {Object} params
 * @param {string} params.userId
 * @param {string|null} [params.actorUserId]
 * @param {string} params.category
 * @param {string} params.scope
 * @param {string} params.entityType
 * @param {string|number} params.entityId
 * @param {string} params.dedupeKey
 * @param {string} params.title
 * @param {string|null} [params.body]
 * @param {boolean} [params.requiresAction]
 * @param {Object|null} [params.metadata]
 * @param {string} [params.pushUrl]
 * @param {boolean} [params.skipPush]
 * @param {boolean} [params.forcePush]
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
  /** @type {string|null} */
  body = null,
  requiresAction = true,
  metadata = null,
  pushUrl = "/",
  skipPush = false,
  forcePush = false,
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

    // Detect first-creation vs. re-fire: on create, createdAt and updatedAt are identical
    // (or within a few ms of each other due to DB write timing).
    const isNewlyCreated =
      notification.createdAt && notification.updatedAt &&
      new Date(notification.createdAt).getTime() === new Date(notification.updatedAt).getTime();

    if (!skipPush && (forcePush || isNewlyCreated)) {
      // Never let a push failure block or slow down the calling code path.
      sendPushToUser({
        userId,
        title,
        body: body || "",
        url: pushUrl,
        tag: dedupeKey,
        notificationId: notification.id,
        actorUserId,
      }).catch((err) => {
        console.error("[notifications/writer] push send failed (non-fatal):", err);
      });
    }

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