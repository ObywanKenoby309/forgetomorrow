import { prisma } from "@/lib/prisma";

const SELF_VIEW_BLOCKED_EVENTS = new Set([
  "PROFILE_VIEW",
  "RESUME_VIEW",
  "PORTFOLIO_VIEW",
]);

export async function trackVisibilityEvent({
  actorId = null,
  targetUserId,
  eventType,
  metadata = {},
}) {
  try {
    if (!targetUserId || !eventType) return null;

    const cleanActorId = actorId ? String(actorId) : null;
    const cleanTargetUserId = String(targetUserId);
    const cleanEventType = String(eventType).trim().toUpperCase();

    if (
      cleanActorId &&
      cleanActorId === cleanTargetUserId &&
      SELF_VIEW_BLOCKED_EVENTS.has(cleanEventType)
    ) {
      return null;
    }

    return await prisma.visibilityEvent.create({
      data: {
        actorId: cleanActorId,
        targetUserId: cleanTargetUserId,
        eventType: cleanEventType,
        metadata: metadata && typeof metadata === "object" ? metadata : {},
      },
    });
  } catch (error) {
    console.error("[trackVisibilityEvent] failed:", error);
    return null;
  }
}