// pages/api/saved-replies/[id].js
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) return res.status(401).json({ error: "Unauthorized" });

    const userId = session.user.id;

    const idRaw = req.query.id;
    const id = Number(idRaw);
    if (!id || Number.isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    // Ensure ownership
    const existing = await prisma.savedReply.findFirst({
      where: { id, userId },
    });

    if (!existing) return res.status(404).json({ error: "Not found" });

    if (req.method === "DELETE") {
      await prisma.savedReply.delete({ where: { id } });
      return res.status(200).json({ ok: true });
    }

    if (req.method === "PATCH") {
      const body = req.body || {};
      const text = typeof body.text === "string" ? body.text.trim() : "";
      if (!text) return res.status(400).json({ error: "Missing text" });

      const updated = await prisma.savedReply.update({
        where: { id },
        data: { text },
      });

      return res.status(200).json({ item: updated });
    }

    res.setHeader("Allow", "DELETE, PATCH");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("[saved-replies] id error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
