// pages/api/profile/details.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import authOptions from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const WELCOME_DRAFT_KEY = "profile_welcome_dismissed_v1";

type ProfileDetails = {
  // Header / identity
  name: string | null;
  headline: string | null;
  location: string | null;
  status: string | null;
  pronouns: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;

  // Sections
  aboutMe: string | null;
  workPreferences: any | null;
  skillsJson: any | null;
  languagesJson: any | null;
  hobbiesJson: any | null;
  educationJson: any | null;

  // UI flags (DB-backed via UserDraft)
  welcomeDismissed: boolean;
};

// ─────────────────────────────────────────────────────────────
// ✅ MIN CHANGE: allow auth via NextAuth session OR HttpOnly `auth` cookie
// ─────────────────────────────────────────────────────────────
function getCookie(req: NextApiRequest, name: string) {
  const raw = req.headers.cookie || "";
  const parts = raw.split(";").map((p) => p.trim());
  for (const p of parts) {
    if (p.startsWith(name + "=")) return decodeURIComponent(p.slice(name.length + 1));
  }
  return null;
}

function getJwtSecret() {
  // Must match what /api/auth/verify-email uses
  return process.env.NEXTAUTH_SECRET || "dev-secret-change-in-production";
}

async function getAuthedEmail(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<string | null> {
  const session = (await getServerSession(req, res, authOptions)) as
    | { user?: { email?: string | null } }
    | null;

  const sessionEmail = session?.user?.email ? String(session.user.email) : null;
  if (sessionEmail) return sessionEmail;

  const token = getCookie(req, "auth");
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as any;
    const email = decoded?.email ? String(decoded.email) : null;
    return email ? email.toLowerCase().trim() : null;
  } catch {
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const email = await getAuthedEmail(req, res);

  if (!email) {
    return res.status(401).json({ error: "Not authenticated" });
  }

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
      const [record, welcomeDraft] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            name: true,
            headline: true,
            location: true,
            status: true,
            pronouns: true,
            avatarUrl: true,
            coverUrl: true,

            aboutMe: true,
            workPreferences: true,
            skillsJson: true,
            languagesJson: true,
            hobbiesJson: true,
            educationJson: true,
          },
        }),
        prisma.userDraft.findUnique({
          where: {
            userId_key: {
              userId,
              key: WELCOME_DRAFT_KEY,
            },
          },
          select: { content: true },
        }),
      ]);

      const dismissed = Boolean((welcomeDraft?.content as any)?.dismissed) === true;

      const details: ProfileDetails | null = record
        ? {
            name: record.name,
            headline: record.headline,
            location: record.location,
            status: record.status,
            pronouns: record.pronouns,
            avatarUrl: record.avatarUrl ?? null,
            coverUrl: record.coverUrl ?? null,

            aboutMe: record.aboutMe,
            workPreferences: record.workPreferences,
            skillsJson: record.skillsJson,
            languagesJson: record.languagesJson,
            hobbiesJson: record.hobbiesJson,
            educationJson: (record as any).educationJson ?? null,

            welcomeDismissed: dismissed,
          }
        : null;

      return res.status(200).json({
        details,
        ...(details || {}),
      });
    } catch (err) {
      console.error("[profile/details] GET error", err);
      return res.status(500).json({ error: "Failed to load profile details" });
    }
  }

  // ──────────────── PATCH: update profile details ────────────────
  if (req.method === "PATCH") {
    try {
      const body = (req.body || {}) as Partial<ProfileDetails>;

      const data: any = {};

      // Header / identity
      if (body.name !== undefined) data.name = body.name;
      if (body.headline !== undefined) data.headline = body.headline;
      if (body.location !== undefined) data.location = body.location;
      if (body.status !== undefined) data.status = body.status;
      if (body.pronouns !== undefined) data.pronouns = body.pronouns;
      if (body.avatarUrl !== undefined) data.avatarUrl = body.avatarUrl;
      if (body.coverUrl !== undefined) data.coverUrl = body.coverUrl;

      // Sections
      if (body.aboutMe !== undefined) data.aboutMe = body.aboutMe;
      if (body.workPreferences !== undefined) data.workPreferences = body.workPreferences;
      if (body.skillsJson !== undefined) data.skillsJson = body.skillsJson;
      if (body.languagesJson !== undefined) data.languagesJson = body.languagesJson;
      if (body.hobbiesJson !== undefined) data.hobbiesJson = body.hobbiesJson;
      if (body.educationJson !== undefined) data.educationJson = body.educationJson;

      // Persist user fields first (only if something actually changed)
      const updatedUser =
        Object.keys(data).length > 0
          ? await prisma.user.update({
              where: { id: userId },
              data,
              select: {
                name: true,
                headline: true,
                location: true,
                status: true,
                pronouns: true,
                avatarUrl: true,
                coverUrl: true,

                aboutMe: true,
                workPreferences: true,
                skillsJson: true,
                languagesJson: true,
                hobbiesJson: true,
                educationJson: true,
              },
            })
          : await prisma.user.findUnique({
              where: { id: userId },
              select: {
                name: true,
                headline: true,
                location: true,
                status: true,
                pronouns: true,
                avatarUrl: true,
                coverUrl: true,

                aboutMe: true,
                workPreferences: true,
                skillsJson: true,
                languagesJson: true,
                hobbiesJson: true,
                educationJson: true,
              },
            });

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // DB-backed welcome dismiss flag via UserDraft
      if (body.welcomeDismissed !== undefined) {
        if (body.welcomeDismissed) {
          await prisma.userDraft.upsert({
            where: {
              userId_key: { userId, key: WELCOME_DRAFT_KEY },
            },
            create: {
              userId,
              key: WELCOME_DRAFT_KEY,
              content: { dismissed: true },
            },
            update: {
              content: { dismissed: true },
            },
          });
        } else {
          // if you ever want to re-show it cross-device
          await prisma.userDraft.deleteMany({
            where: { userId, key: WELCOME_DRAFT_KEY },
          });
        }
      }

      const draft = await prisma.userDraft.findUnique({
        where: { userId_key: { userId, key: WELCOME_DRAFT_KEY } },
        select: { content: true },
      });

      const details: ProfileDetails = {
        name: updatedUser.name ?? null,
        headline: updatedUser.headline ?? null,
        location: updatedUser.location ?? null,
        status: updatedUser.status ?? null,
        pronouns: updatedUser.pronouns ?? null,
        avatarUrl: (updatedUser as any).avatarUrl ?? null,
        coverUrl: (updatedUser as any).coverUrl ?? null,

        aboutMe: updatedUser.aboutMe ?? null,
        workPreferences: updatedUser.workPreferences ?? null,
        skillsJson: updatedUser.skillsJson ?? null,
        languagesJson: updatedUser.languagesJson ?? null,
        hobbiesJson: updatedUser.hobbiesJson ?? null,
        educationJson: (updatedUser as any).educationJson ?? null,

        welcomeDismissed: Boolean((draft?.content as any)?.dismissed) === true,
      };

      return res.status(200).json({
        details,
        ...details,
      });
    } catch (err) {
      console.error("[profile/details] PATCH error", err);
      return res.status(500).json({ error: "Failed to update profile details" });
    }
  }

  res.setHeader("Allow", ["GET", "PATCH"]);
  return res.status(405).json({ error: "Method not allowed" });
}
