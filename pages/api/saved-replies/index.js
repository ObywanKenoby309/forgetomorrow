// pages/api/saved-replies/index.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) return res.status(401).json({ error: "Unauthorized" });

    const userId = session.user.id;
    const persona = typeof req.query.persona === "string" && req.query.persona.trim()
      ? req.query.persona.trim()
      : "recruiter";

    if (req.method === "GET") {
      const items = await prisma.savedReply.findMany({
        where: { userId, persona },
        orderBy: { createdAt: "desc" },
      });

      return res.status(200).json({ items });
    }

    if (req.method === "POST") {
      const body = req.body || {};
      const text = typeof body.text === "string" ? body.text.trim() : "";
      const bodyPersona = typeof body.persona === "string" && body.persona.trim()
        ? body.persona.trim()
        : persona;

      if (!text) return res.status(400).json({ error: "Missing text" });

      const created = await prisma.savedReply.create({
        data: {
          userId,
          persona: bodyPersona,
          text,
        },
      });

      return res.status(200).json({ item: created });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("[saved-replies] index error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
