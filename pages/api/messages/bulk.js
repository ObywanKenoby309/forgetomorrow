// pages/api/messages/bulk.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

function normalizeChannel(raw) {
  if (typeof raw !== "string") return null;
  const v = raw.trim().toLowerCase();
  if (!v) return null;

  if (v === "coaching") return "coach";
  if (v === "recruiting") return "recruiter";
  if (v === "candidate") return "seeker";

  if (v === "coach" || v === "recruiter" || v === "seeker") return v;
  return v;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) return res.status(401).json({ error: "Unauthorized" });

    const meId = session.user.id;

    const body = req.body || {};
    const ids = Array.isArray(body.recipientIds) ? body.recipientIds : [];
    const content = typeof body.content === "string" ? body.content.trim() : "";
    const channel = normalizeChannel(body.channel) || "coach";

    const recipientIds = ids
      .map((x) => (typeof x === "string" ? x.trim() : ""))
      .filter(Boolean)
      .filter((x) => x !== meId);

    if (!recipientIds.length) return res.status(400).json({ error: "Missing recipientIds" });
    if (!content) return res.status(400).json({ error: "Missing content" });

    // validate targets exist
    const targets = await prisma.user.findMany({
      where: { id: { in: recipientIds } },
      select: { id: true },
    });

    const targetIds = targets.map((t) => t.id);

    let sentCount = 0;
    const conversationIds = [];

    for (const targetId of targetIds) {
      // find existing 1:1 convo in this channel
      const existing = await prisma.conversation.findFirst({
        where: {
          isGroup: false,
          channel: { equals: channel, mode: "insensitive" },
          participants: { some: { userId: meId } },
          AND: [{ participants: { some: { userId: targetId } } }],
        },
        select: { id: true },
      });

      let convoId = existing?.id;

      if (!convoId) {
        const createdConvo = await prisma.conversation.create({
          data: {
            isGroup: false,
            title: null,
            channel,
            participants: {
              create: [
                { userId: meId, role: "owner" },
                { userId: targetId, role: "member" },
              ],
            },
          },
          select: { id: true },
        });
        convoId = createdConvo.id;
      }

      const msg = await prisma.message.create({
        data: {
          conversationId: convoId,
          senderId: meId,
          content,
        },
        select: { id: true },
      });

      await prisma.conversation.update({
        where: { id: convoId },
        data: { updatedAt: new Date() },
      });

      sentCount += 1;
      conversationIds.push(convoId);
      void msg; // keep lint calm if needed
    }

    return res.status(200).json({
      ok: true,
      sentCount,
      conversationIds,
    });
  } catch (err) {
    console.error("[messages/bulk] error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
