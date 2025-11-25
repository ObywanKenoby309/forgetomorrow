// pages/api/profile/details.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import authOptions from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

type ProfileDetails = {
  headline: string | null;
  aboutMe: string | null;
  location: string | null;
  status: string | null;
  pronouns: string | null;
  workPreferences: any | null;
  skillsJson: any | null;
  languagesJson: any | null;
  hobbiesJson: any | null;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = (await getServerSession(req, res, authOptions)) as
    | { user?: { email?: string | null } }
    | null;

  if (!session?.user?.email) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const email = session.user.email as string;

  // Resolve user once
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const userId = user.id;

  // ──────────────── GET: load profile details ────────────────
  if (req.method === "GET") {
    try {
      const record = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          headline: true,
          aboutMe: true,
          location: true,
          status: true,
          pronouns: true,
          workPreferences: true,
          skillsJson: true,
          languagesJson: true,
          hobbiesJson: true,
        },
      });

      const details: ProfileDetails | null = record
        ? {
            headline: record.headline,
            aboutMe: record.aboutMe,
            location: record.location,
            status: record.status,
            pronouns: record.pronouns,
            workPreferences: record.workPreferences,
            skillsJson: record.skillsJson,
            languagesJson: record.languagesJson,
            hobbiesJson: record.hobbiesJson,
          }
        : null;

      return res.status(200).json({ details });
    } catch (err) {
      console.error("[profile/details] GET error", err);
      return res.status(500).json({ error: "Failed to load profile details" });
    }
  }

  // ──────────────── PATCH: update profile details ────────────────
  if (req.method === "PATCH") {
    try {
      const {
        headline,
        aboutMe,
        location,
        status,
        pronouns,
        workPreferences,
        skillsJson,
        languagesJson,
        hobbiesJson,
      } = (req.body || {}) as Partial<ProfileDetails>;

      const data: any = {};

      if (headline !== undefined) data.headline = headline;
      if (aboutMe !== undefined) data.aboutMe = aboutMe;
      if (location !== undefined) data.location = location;
      if (status !== undefined) data.status = status;
      if (pronouns !== undefined) data.pronouns = pronouns;
      if (workPreferences !== undefined) data.workPreferences = workPreferences;
      if (skillsJson !== undefined) data.skillsJson = skillsJson;
      if (languagesJson !== undefined) data.languagesJson = languagesJson;
      if (hobbiesJson !== undefined) data.hobbiesJson = hobbiesJson;

      const updated = await prisma.user.update({
        where: { id: userId },
        data,
        select: {
          headline: true,
          aboutMe: true,
          location: true,
          status: true,
          pronouns: true,
          workPreferences: true,
          skillsJson: true,
          languagesJson: true,
          hobbiesJson: true,
        },
      });

      const details: ProfileDetails = {
        headline: updated.headline,
        aboutMe: updated.aboutMe,
        location: updated.location,
        status: updated.status,
        pronouns: updated.pronouns,
        workPreferences: updated.workPreferences,
        skillsJson: updated.skillsJson,
        languagesJson: updated.languagesJson,
        hobbiesJson: updated.hobbiesJson,
      };

      return res.status(200).json({ details });
    } catch (err) {
      console.error("[profile/details] PATCH error", err);
      return res
        .status(500)
        .json({ error: "Failed to update profile details" });
    }
  }

  // ──────────────── Unsupported methods ────────────────
  res.setHeader("Allow", ["GET", "PATCH"]);
  return res.status(405).json({ error: "Method not allowed" });
}
