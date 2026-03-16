// pages/api/profile/details.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

export const config = {
  api: {
    bodyParser: { sizeLimit: "4mb" },
  },
};

const WELCOME_DRAFT_KEY = "profile_welcome_dismissed_v1";

type ProfileDetails = {
  slug: string | null;

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
  certificationsJson: any | null;
  projectsJson: any | null;
  customSectionJson: any | null;

  // UI flags (DB-backed via UserDraft)
  welcomeDismissed: boolean;
};

function getCookie(req: NextApiRequest, name: string) {
  const raw = req.headers.cookie || "";
  const parts = raw.split(";").map((p) => p.trim());
  for (const p of parts) {
    if (p.startsWith(name + "=")) return decodeURIComponent(p.slice(name.length + 1));
  }
  return null;
}

function getJwtSecret() {
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

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const userId = user.id;

  if (req.method === "GET") {
    try {
      const [record, welcomeDraft] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            slug: true,

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
            certificationsJson: true,
            projectsJson: true,
            customSectionJson: true,
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
            slug: record.slug ?? null,

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
            educationJson: record.educationJson ?? null,
            certificationsJson: (record as any).certificationsJson ?? null,
            projectsJson: (record as any).projectsJson ?? null,
            customSectionJson: (record as any).customSectionJson ?? null,

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

  if (req.method === "PATCH") {
    try {
      const body = (req.body || {}) as Partial<ProfileDetails>;
      const data: any = {};

      if (body.name !== undefined) data.name = body.name;
      if (body.headline !== undefined) data.headline = body.headline;
      if (body.location !== undefined) data.location = body.location;
      if (body.status !== undefined) data.status = body.status;
      if (body.pronouns !== undefined) data.pronouns = body.pronouns;
      if (body.avatarUrl !== undefined) data.avatarUrl = body.avatarUrl;
      if (body.coverUrl !== undefined) data.coverUrl = body.coverUrl;

      if (body.aboutMe !== undefined) data.aboutMe = body.aboutMe;
      if (body.workPreferences !== undefined) data.workPreferences = body.workPreferences;
      if (body.skillsJson !== undefined) data.skillsJson = body.skillsJson;
      if (body.languagesJson !== undefined) data.languagesJson = body.languagesJson;
      if (body.hobbiesJson !== undefined) data.hobbiesJson = body.hobbiesJson;
      if (body.educationJson !== undefined) data.educationJson = body.educationJson;
      if (body.certificationsJson !== undefined)
        data.certificationsJson = body.certificationsJson;
      if (body.projectsJson !== undefined) data.projectsJson = body.projectsJson;
      if (body.customSectionJson !== undefined) data.customSectionJson = body.customSectionJson;

      const updatedUser =
        Object.keys(data).length > 0
          ? await prisma.user.update({
              where: { id: userId },
              data,
              select: {
                slug: true,

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
                certificationsJson: true,
                projectsJson: true,
                customSectionJson: true,
              },
            })
          : await prisma.user.findUnique({
              where: { id: userId },
              select: {
                slug: true,

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
                certificationsJson: true,
                projectsJson: true,
                customSectionJson: true,
              },
            });

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

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
        slug: (updatedUser as any).slug ?? null,

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
        certificationsJson: (updatedUser as any).certificationsJson ?? null,
        projectsJson: (updatedUser as any).projectsJson ?? null,
        customSectionJson: (updatedUser as any).customSectionJson ?? null,

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
