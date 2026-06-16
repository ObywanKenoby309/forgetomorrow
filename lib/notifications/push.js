// lib/notifications/push.js
// Sends web push notifications to a user's subscribed devices.
// Wired into createNotification() in lib/notifications/writer.js.

import webpush from 'web-push';
import { prisma } from '@/lib/prisma';

let vapidConfigured = false;

function ensureVapidConfigured() {
  if (vapidConfigured) return true;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:support@forgetomorrow.com';

  if (!publicKey || !privateKey) {
    console.warn('[push] VAPID keys not configured — skipping push send. Run scripts/generate-vapid-keys.js');
    return false;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
  return true;
}

/**
 * Sends a push notification to every device a user has subscribed on.
 * Automatically prunes subscriptions that are no longer valid (410/404 from the push service).
 * Never throws — push failures must never break the calling code path.
 *
 * `icon` is the large circular image shown in the notification (ideally the sender's avatar).
 * If not provided and `actorUserId` is set, we look up that user's avatar automatically.
 * Falls back to the ForgeTomorrow app icon if no avatar is available.
 *
 * `badge` is the small monochrome status-bar icon — almost never needs overriding per-call,
 * since it should always be the ForgeTomorrow mark regardless of who sent the notification.
 */
export async function sendPushToUser({
  userId,
  title,
  body,
  url = '/',
  tag = null,
  notificationId = null,
  icon = null,
  actorUserId = null,
}) {
  if (!ensureVapidConfigured()) return;
  if (!userId || !title) return;

  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
      select: { id: true, endpoint: true, p256dh: true, auth: true },
    });

    if (subscriptions.length === 0) return;

    // Resolve the icon shown in the notification's large circle.
    // Priority: explicit `icon` param > actor's avatar > ForgeTomorrow default.
    let resolvedIcon = icon;

    if (!resolvedIcon && actorUserId) {
      try {
        const actor = await prisma.user.findUnique({
          where: { id: actorUserId },
          select: { avatarUrl: true, image: true },
        });
        resolvedIcon = actor?.avatarUrl || actor?.image || null;
      } catch {
        // Non-fatal — fall through to default icon
      }
    }

    if (!resolvedIcon) resolvedIcon = '/icons/icon-192.png';

    const payload = JSON.stringify({
      title,
      body: body || '',
      url,
      tag: tag || undefined,
      notificationId,
      icon: resolvedIcon,
      badge: '/icons/badge-72.png',
    });

    const staleIds = [];

    await Promise.all(
      subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        };

        try {
          await webpush.sendNotification(pushSubscription, payload);
        } catch (err) {
          // 404/410 means the subscription is dead — the browser unsubscribed or the user uninstalled
          if (err?.statusCode === 404 || err?.statusCode === 410) {
            staleIds.push(sub.id);
          } else {
            console.error('[push] sendNotification failed:', err?.statusCode, err?.body || err?.message);
          }
        }
      })
    );

    if (staleIds.length > 0) {
      await prisma.pushSubscription.deleteMany({ where: { id: { in: staleIds } } }).catch(() => {});
    }
  } catch (err) {
    console.error('[push] sendPushToUser failed:', err);
  }
}