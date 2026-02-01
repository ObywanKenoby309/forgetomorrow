// pages/api/messages/index.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

function displayName(u) {
  const full = [u?.firstName, u?.lastName].filter(Boolean).join(" ").trim();
  return full || u?.name || u?.email || "Conversation";
}

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) return res.status(401).json({ error: "Unauthorized" });

    const meId = session.user.id;

    const channel =
      typeof req.query.channel === "string" && req.query.channel.trim()
        ? req.query.channel.trim()
        : null;

    const conversationIdRaw =
      (typeof req.query.conversationId === "string" && req.query.conversationId.trim()) ||
      (typeof req.query.c === "string" && req.query.c.trim()) ||
      null;

    // ------------------------------------------------------------
    // GET: Messages for a conversation
    // ------------------------------------------------------------
    if (req.method === "GET" && conversationIdRaw) {
      const conversationId = Number(conversationIdRaw);
      if (!conversationId) return res.status(400).json({ error: "Invalid conversationId" });

      // Verify membership
      const member = await prisma.conversationParticipant.findFirst({
        where: { conversationId, userId: meId },
        select: { id: true },
      });
      if (!member) return res.status(403).json({ error: "Forbidden" });

      const messages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          senderId: true,
          content: true,
          createdAt: true,
        },
      });

      return res.status(200).json({
        messages: messages.map((m) => ({
          id: m.id,
          senderId: m.senderId,
          text: m.content,
          timeIso: m.createdAt.toISOString(),
        })),
      });
    }

    // ------------------------------------------------------------
    // GET: List conversations for this user (optionally filtered by channel)
    // ------------------------------------------------------------
    if (req.method === "GET") {
      const conversations = await prisma.conversation.findMany({
        where: {
          ...(channel ? { channel } : {}),
          participants: { some: { userId: meId } },
        },
        orderBy: { updatedAt: "desc" },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                  name: true,
                },
              },
            },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { content: true, createdAt: true },
          },
        },
      });

      const mapped = conversations.map((c) => {
        const others = (c.participants || [])
          .map((p) => p.user)
          .filter((u) => u?.id && u.id !== meId);

        const other = others[0] || null;

        return {
          id: c.id,
          name: other ? displayName(other) : c.title || "Conversation",
          otherUserId: other?.id || null,
          lastMessage: c.messages?.[0]?.content || "",
          lastMessageAt: c.messages?.[0]?.createdAt?.toISOString?.() || null,
          unread: 0, // keep 0 until we implement read receipts
          channel: c.channel || null,
        };
      });

      return res.status(200).json({ conversations: mapped });
    }

    // ------------------------------------------------------------
    // POST: Send a message in a conversation
    // body: { conversationId, content, channel? }
    // ------------------------------------------------------------
    if (req.method === "POST") {
      const body = req.body || {};
      const conversationId = Number(body.conversationId);
      const content = typeof body.content === "string" ? body.content.trim() : "";
      if (!conversationId) return res.status(400).json({ error: "Missing conversationId" });
      if (!content) return res.status(400).json({ error: "Missing content" });

      // Verify membership
      const member = await prisma.conversationParticipant.findFirst({
        where: { conversationId, userId: meId },
        select: { id: true },
      });
      if (!member) return res.status(403).json({ error: "Forbidden" });

      const created = await prisma.message.create({
        data: {
          conversationId,
          senderId: meId,
          content,
        },
        select: { id: true, senderId: true, content: true, createdAt: true },
      });

      // bump conversation updatedAt so it sorts to top
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      return res.status(200).json({
        message: {
          id: created.id,
          senderId: created.senderId,
          text: created.content,
          timeIso: created.createdAt.toISOString(),
        },
      });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("[messages] error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
