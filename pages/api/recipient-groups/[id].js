// pages/api/recipient-groups/[id].js
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: "Unauthorized" });

  const userId = session.user.id;
  const { id } = req.query;

  // Verify ownership
  const group = await prisma.recipientGroup.findUnique({ where: { id } });
  if (!group) return res.status(404).json({ error: "Not found" });
  if (group.userId !== userId) return res.status(403).json({ error: "Forbidden" });

  // PATCH — rename or update members
  if (req.method === "PATCH") {
    const { name, memberIds } = req.body;
    try {
      const updated = await prisma.recipientGroup.update({
        where: { id },
        data: {
          ...(name?.trim() && { name: name.trim() }),
          ...(Array.isArray(memberIds) && { memberIds: memberIds.filter(Boolean).map(String) }),
        },
      });
      return res.status(200).json({ group: updated });
    } catch (err) {
      console.error("[recipient-groups PATCH]", err);
      return res.status(500).json({ error: "Failed to update" });
    }
  }

  // DELETE
  if (req.method === "DELETE") {
    try {
      await prisma.recipientGroup.delete({ where: { id } });
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error("[recipient-groups DELETE]", err);
      return res.status(500).json({ error: "Failed to delete" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}