// pages/api/visibility/track.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { trackVisibilityEvent } from "@/lib/visibility/trackVisibilityEvent";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    const actorId = session?.user?.id || null;
    const { targetUserId, eventType, metadata = {} } = req.body || {};

    if (!targetUserId || !eventType) {
      return res.status(400).json({
        error: "targetUserId and eventType are required",
      });
    }

    const event = await trackVisibilityEvent({
      actorId,
      targetUserId,
      eventType,
      metadata,
    });

    return res.status(200).json({
      ok: true,
      tracked: Boolean(event),
    });
  } catch (error) {
    console.error("[api/visibility/track] failed:", error);
    return res.status(500).json({ error: "Failed to track visibility event" });
  }
}