// pages/api/profile/avatar.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import authOptions from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

export const config = {
  api: {
    // ✅ Fix 413 Payload Too Large for base64/dataURL avatar uploads
    // Adjust if needed, but keep reasonable since we're storing in DB for now.
    bodyParser: { sizeLimit: "4mb" },
  },
};

type AvatarResponse = {
  avatarUrl: string | null;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AvatarResponse | { error: string }>
) {
  const session = (await getServerSession(req, res, authOptions)) as
    | { user?: { email?: string | null } }
    | null;

  if (!session?.user?.email) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const email = session.user.email as string;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, avatarUrl: true },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const userId = user.id;

  if (req.method === "GET") {
    return res.status(200).json({ avatarUrl: user.avatarUrl || null });
  }

  if (req.method === "POST") {
    try {
      const { avatarDataUrl } = (req.body || {}) as {
        avatarDataUrl?: string;
      };

      if (!avatarDataUrl || typeof avatarDataUrl !== "string") {
        return res
          .status(400)
          .json({ error: "avatarDataUrl (data URL) is required" });
      }

      // Very basic sanity check – Phase 1 (we can tighten later)
      if (!avatarDataUrl.startsWith("data:image/")) {
        return res
          .status(400)
          .json({ error: "Invalid avatar format. Must be image data URL." });
      }

      // Optional size guard – keep below our API sizeLimit headroom
      // (data URLs expand size; 3.2M chars is a reasonable ceiling under 4mb parsing)
      if (avatarDataUrl.length > 3_200_000) {
        return res.status(400).json({
          error: "Avatar is too large. Please upload a smaller image.",
        });
      }

      const updated = await prisma.user.update({
        where: { id: userId },
        data: { avatarUrl: avatarDataUrl },
        select: { avatarUrl: true },
      });

      return res.status(200).json({ avatarUrl: updated.avatarUrl || null });
    } catch (err) {
      console.error("[profile/avatar] POST error", err);
      return res.status(500).json({ error: "Failed to save avatar" });
    }
  }

  if (req.method === "DELETE") {
    try {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { avatarUrl: null },
        select: { avatarUrl: true },
      });

      return res.status(200).json({ avatarUrl: updated.avatarUrl || null });
    } catch (err) {
      console.error("[profile/avatar] DELETE error", err);
      return res.status(500).json({ error: "Failed to delete avatar" });
    }
  }

  res.setHeader("Allow", ["GET", "POST", "DELETE"]);
  return res.status(405).json({ error: "Method not allowed" });
}
