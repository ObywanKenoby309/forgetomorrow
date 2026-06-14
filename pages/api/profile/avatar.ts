// pages/api/profile/avatar.ts
// Uploads avatar to Supabase Storage (forge-docs bucket) and saves the public URL.
// Replaces the Phase 1 base64-in-DB approach which caused JWT bloat and session failures.

import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/storage";

export const config = {
  api: {
    bodyParser: { sizeLimit: "6mb" },
  },
};

type AvatarResponse = {
  avatarUrl: string | null;
};

const BUCKET = "forge-docs";
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg":  "jpg",
  "image/png":  "png",
  "image/webp": "webp",
  "image/gif":  "gif",
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

  // ── GET ──────────────────────────────────────────────────────────────────
  if (req.method === "GET") {
    return res.status(200).json({ avatarUrl: user.avatarUrl || null });
  }

  // ── POST — upload new avatar ──────────────────────────────────────────────
  if (req.method === "POST") {
    try {
      const { avatarDataUrl } = (req.body || {}) as {
        avatarDataUrl?: string;
      };

      if (!avatarDataUrl || typeof avatarDataUrl !== "string") {
        return res.status(400).json({ error: "avatarDataUrl is required" });
      }

      if (!avatarDataUrl.startsWith("data:image/")) {
        return res.status(400).json({ error: "Invalid image format" });
      }

      // Parse the data URL: data:image/jpeg;base64,<data>
      const matches = avatarDataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if (!matches) {
        return res.status(400).json({ error: "Malformed data URL" });
      }

      const mimeType = matches[1].toLowerCase();
      const base64Data = matches[2];
      const ext = ALLOWED_TYPES[mimeType];

      if (!ext) {
        return res.status(400).json({ error: "Unsupported image type. Use JPEG, PNG, WebP, or GIF." });
      }

      // Convert base64 → Buffer
      const buffer = Buffer.from(base64Data, "base64");

      // Reasonable size cap: 4MB uncompressed
      if (buffer.length > 4 * 1024 * 1024) {
        return res.status(400).json({ error: "Image too large. Maximum 4MB." });
      }

      // Upload to Supabase Storage — path must start with userId to satisfy RLS
      const storagePath = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(storagePath, buffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (uploadError) {
        console.error("[profile/avatar] Supabase upload error", uploadError);
        return res.status(500).json({ error: "Failed to upload avatar" });
      }

      // Get the public URL
      const { data: publicUrlData } = supabaseAdmin.storage
        .from(BUCKET)
        .getPublicUrl(storagePath);

      const avatarUrl = publicUrlData?.publicUrl || null;

      if (!avatarUrl) {
        return res.status(500).json({ error: "Could not resolve public URL" });
      }

      // Save the short public URL (not base64) to the DB
      await prisma.user.update({
        where: { id: user.id },
        data: { avatarUrl },
      });

      return res.status(200).json({ avatarUrl });
    } catch (err) {
      console.error("[profile/avatar] POST error", err);
      return res.status(500).json({ error: "Failed to save avatar" });
    }
  }

  // ── DELETE — remove avatar ────────────────────────────────────────────────
  if (req.method === "DELETE") {
    try {
      // Best-effort delete from storage (try all common extensions)
      const exts = ["jpg", "png", "webp", "gif"];
      await Promise.allSettled(
        exts.map((ext) =>
          supabaseAdmin.storage
            .from(BUCKET)
            .remove([`${user.id}/avatar.${ext}`])
        )
      );

      // Clear the DB field
      await prisma.user.update({
        where: { id: user.id },
        data: { avatarUrl: null },
      });

      return res.status(200).json({ avatarUrl: null });
    } catch (err) {
      console.error("[profile/avatar] DELETE error", err);
      return res.status(500).json({ error: "Failed to remove avatar" });
    }
  }

  res.setHeader("Allow", ["GET", "POST", "DELETE"]);
  return res.status(405).json({ error: "Method not allowed" });
}