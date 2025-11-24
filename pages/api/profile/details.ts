import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

type ProfileDetails = {
  aboutMe: string | null;
  workPreferences: any | null;
  skillsJson: any | null;
  languagesJson: any | null;
  hobbiesJson: any | null;
};

type Data =
  | { user: ProfileDetails }
  | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user?.email) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const email = session.user.email;

    if (req.method === "GET") {
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          aboutMe: true,
          workPreferences: true,
          skillsJson: true,
          languagesJson: true,
          hobbiesJson: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.status(200).json({
        user: {
          aboutMe: user.aboutMe ?? null,
          workPreferences: user.workPreferences ?? null,
          skillsJson: user.skillsJson ?? null,
          languagesJson: user.languagesJson ?? null,
          hobbiesJson: user.hobbiesJson ?? null,
        },
      });
    }

    if (req.method === "PATCH") {
      const {
        aboutMe,
        workPreferences,
        skills,
        languages,
        hobbies,
      } = req.body || {};

      const data: any = {};

      // About Me
      if (typeof aboutMe === "string") {
        data.aboutMe = aboutMe.trim() === "" ? null : aboutMe.trim();
      }

      // Work Preferences: expect an object, store as JSON
      if (workPreferences !== undefined) {
        data.workPreferences = workPreferences;
      }

      // Skills: expect an array of strings
      if (Array.isArray(skills)) {
        data.skillsJson = skills;
      }

      // Languages: expect an array of objects (e.g. { name, level })
      if (Array.isArray(languages)) {
        data.languagesJson = languages;
      }

      // Hobbies: expect an array of strings
      if (Array.isArray(hobbies)) {
        data.hobbiesJson = hobbies;
      }

      if (Object.keys(data).length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }

      const updated = await prisma.user.update({
        where: { email },
        data,
        select: {
          aboutMe: true,
          workPreferences: true,
          skillsJson: true,
          languagesJson: true,
          hobbiesJson: true,
        },
      });

      return res.status(200).json({
        user: {
          aboutMe: updated.aboutMe ?? null,
          workPreferences: updated.workPreferences ?? null,
          skillsJson: updated.skillsJson ?? null,
          languagesJson: updated.languagesJson ?? null,
          hobbiesJson: updated.hobbiesJson ?? null,
        },
      });
    }

    res.setHeader("Allow", "GET, PATCH");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("[profile/details] error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
