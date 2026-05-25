// pages/api/anvil/identity.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { buildProfessionalOperatingProfile } from '@/lib/intelligence/professionalOperatingProfileEngine';

export const config = {
  api: {
    bodyParser: { sizeLimit: '2mb' },
  },
};

function safeJsonParse(value: any) {
  try {
    if (!value) return null;
    if (typeof value === 'object') return value;
    if (typeof value !== 'string') return null;
    return JSON.parse(value.trim());
  } catch {
    return null;
  }
}

function toArray(value: any): any[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);

  if (typeof value === 'string') {
    const parsed = safeJsonParse(value);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);

    return value
      .split(/[,|]/g)
      .map((x) => String(x || '').trim())
      .filter(Boolean);
  }

  return [];
}

function extractResumeContext(resume: any) {
  const parsed = safeJsonParse(resume?.content);
  const root = parsed?.data && typeof parsed.data === 'object' ? parsed.data : parsed || {};

  return {
    resumeId: resume?.id || null,
    summary: root.summary || root.professionalSummary || '',
    skills: toArray(root.skills),
    experience: Array.isArray(root.experiences)
      ? root.experiences
      : Array.isArray(root.workExperiences)
      ? root.workExperiences
      : Array.isArray(root.experience)
      ? root.experience
      : [],
    projects: Array.isArray(root.projects) ? root.projects : [],
    certifications: Array.isArray(root.certifications) ? root.certifications : [],
  };
}

async function getSessionEmail(req: NextApiRequest, res: NextApiResponse) {
  const session = (await getServerSession(req, res, authOptions as any)) as {
  user?: {
    email?: string | null;
  };
} | null;

const email = session?.user?.email
  ? String(session.user.email).toLowerCase().trim()
  : '';

return email || null;
}

async function loadIdentityContext(userId: string, email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      headline: true,
      aboutMe: true,
      location: true,
      workPreferences: true,
      skillsJson: true,
      languagesJson: true,
      educationJson: true,
      projectsJson: true,
    },
  });

  if (!user) return null;

  const primaryResume =
    (await prisma.resume.findFirst({
      where: { userId, isPrimary: true },
      select: { id: true, content: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    })) ||
    (await prisma.resume.findFirst({
      where: { userId },
      select: { id: true, content: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    }));

  const resume = extractResumeContext(primaryResume);

  return {
    userId: user.id,
    name: user.name,
    headline: user.headline,
    aboutMe: user.aboutMe,
    location: user.location,
    workPreferences: user.workPreferences,
    skills: toArray(user.skillsJson),
    languages: toArray(user.languagesJson),
    education: toArray(user.educationJson),
    projects: toArray((user as any).projectsJson),
    resume,
    resumeId: resume.resumeId,
    resumeUpdatedAt: primaryResume?.updatedAt || null,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const email = await getSessionEmail(req, res);

  if (!email) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (req.method === 'GET') {
    try {
      const profile = await prisma.professionalOperatingProfile.findUnique({
        where: { userId: user.id },
      });

      return res.status(200).json({ profile });
    } catch (error) {
      console.error('[anvil/identity] GET error', error);
      return res.status(500).json({ error: 'Failed to load Professional Operating Profile' });
    }
  }

  if (req.method === 'POST' || req.method === 'PATCH') {
    try {
      const body = req.body || {};
      const answersJson = body.answersJson;

      if (!answersJson || typeof answersJson !== 'object') {
        return res.status(400).json({ error: 'answersJson is required' });
      }

      const identityContext = await loadIdentityContext(user.id, email);

      if (!identityContext) {
        return res.status(404).json({ error: 'Identity context could not be loaded' });
      }

      const snapshotJson = buildProfessionalOperatingProfile({
        answersJson,
        identityContext,
      });

	  if (body.generateOnly) {
	    return res.status(200).json({
		  snapshot: snapshotJson,
		});
	  }

      const profile = await prisma.professionalOperatingProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          answersJson,
          snapshotJson,
          showOnPortfolio: Boolean(body.showOnPortfolio),
          shareWithCoach: Boolean(body.shareWithCoach),
          includeInHiringPacket: Boolean(body.includeInHiringPacket),
        },
        update: {
          answersJson,
          snapshotJson,
          showOnPortfolio: Boolean(body.showOnPortfolio),
          shareWithCoach: Boolean(body.shareWithCoach),
          includeInHiringPacket: Boolean(body.includeInHiringPacket),
        },
      });

      return res.status(200).json({
		profile,
		snapshot: snapshotJson,
	  });
    } catch (error) {
      console.error('[anvil/identity] SAVE error', error);
      return res.status(500).json({ error: 'Failed to save Professional Operating Profile' });
    }
  }

  res.setHeader('Allow', 'GET, POST, PATCH');
  return res.status(405).json({ error: 'Method not allowed' });
}