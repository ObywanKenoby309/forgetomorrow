// pages/api/coaching/clients/profile/[id].js
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';

function safeJsonParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

function dedupeCaseInsensitive(arr) {
  const out = [];
  const seen = new Set();

  for (const raw of Array.isArray(arr) ? arr : []) {
    const value = String(raw || '').trim();
    if (!value) continue;

    const key = value.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    out.push(value);
  }

  return out;
}

function toArrayJson(value) {
  if (Array.isArray(value)) {
    return value.map((x) => String(x || '').trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    const parsed = safeJsonParse(value);
    if (Array.isArray(parsed)) {
      return parsed.map((x) => String(x || '').trim()).filter(Boolean);
    }
  }

  return [];
}

function toEducationObjects(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (!item || typeof item !== 'object') return null;

        return {
          school: String(item.school || item.name || '').trim(),
          degree: String(item.degree || '').trim(),
          field: String(item.field || item.study || '').trim(),
          startYear: String(item.startYear || '').trim(),
          endYear: String(item.endYear || '').trim(),
        };
      })
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    const parsed = safeJsonParse(value);
    if (Array.isArray(parsed)) return toEducationObjects(parsed);
  }

  return [];
}

function getWorkPreferencesObject(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value;

  if (typeof value === 'string') {
    const parsed = safeJsonParse(value);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
  }

  return {};
}

function getPreferredLocationsFromWorkPreferences(workPreferences) {
  const prefs = getWorkPreferencesObject(workPreferences);

  const raw =
    prefs.preferredLocations ??
    prefs.locations ??
    prefs.locationPreferences ??
    prefs.preferredLocation ??
    prefs.location ??
    [];

  if (Array.isArray(raw)) {
    return dedupeCaseInsensitive(
      raw.map((x) => {
        if (typeof x === 'string') return x;
        if (x && typeof x === 'object') {
          return x.label || x.name || x.value || x.location || '';
        }
        return '';
      })
    );
  }

  if (typeof raw === 'string') {
    return dedupeCaseInsensitive(
      raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    );
  }

  return [];
}

function getWorkStatusFromWorkPreferences(workPreferences) {
  const prefs = getWorkPreferencesObject(workPreferences);
  return prefs.workStatus || prefs.currentWorkStatus || prefs.status || '';
}

function getPreferredWorkTypeFromWorkPreferences(workPreferences) {
  const prefs = getWorkPreferencesObject(workPreferences);
  return prefs.preferredWorkType || prefs.workType || prefs.employmentType || '';
}

function getRelocateFromWorkPreferences(workPreferences) {
  const prefs = getWorkPreferencesObject(workPreferences);
  return prefs.willingToRelocate ?? prefs.relocate ?? prefs.relocation ?? '';
}

function extractExperienceFromResumeContent(contentStr) {
  const parsed = typeof contentStr === 'string' ? safeJsonParse(contentStr) : null;
  if (!parsed || typeof parsed !== 'object') return [];

  const root = parsed?.data && typeof parsed.data === 'object' ? parsed.data : parsed;

  const list =
    (Array.isArray(root.workExperiences) && root.workExperiences) ||
    (Array.isArray(root.experiences) && root.experiences) ||
    (Array.isArray(root.experience) && root.experience) ||
    [];

  if (!Array.isArray(list)) return [];

  return list
    .map((exp) => {
      const title = exp?.title || exp?.jobTitle || exp?.role || '';
      const company = exp?.company || '';
      const start = exp?.startDate || exp?.start || '';
      const end = exp?.endDate || exp?.end || '';
      const range = [start, end].filter(Boolean).join(' - ') || exp?.range || '';

      const highlightsRaw =
        exp?.highlights ||
        exp?.bullets ||
        exp?.description ||
        exp?.details ||
        [];

      let highlights = [];
      if (Array.isArray(highlightsRaw)) {
        highlights = highlightsRaw.map((x) => String(x || '').trim()).filter(Boolean);
      } else if (typeof highlightsRaw === 'string') {
        const s = highlightsRaw.trim();
        highlights = s
          ? s.split('\n').map((x) => String(x || '').trim()).filter(Boolean)
          : [];
      }

      return {
        title: String(title || '').trim(),
        company: String(company || '').trim(),
        range: String(range || '').trim(),
        highlights,
      };
    })
    .filter((item) => item.title || item.company || item.range || item.highlights?.length);
}

function extractSkillsFromResumeContent(contentStr) {
  const parsed = typeof contentStr === 'string' ? safeJsonParse(contentStr) : null;
  if (!parsed || typeof parsed !== 'object') return [];

  const root = parsed?.data && typeof parsed.data === 'object' ? parsed.data : parsed;
  const skills = Array.isArray(root.skills) ? root.skills : [];
  return dedupeCaseInsensitive(skills.map((s) => String(s || '').trim()).filter(Boolean));
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const id = String(req.query.id || '').trim();
  if (!id) {
    return res.status(400).json({ error: 'Missing profile id' });
  }

  try {
    const coachingClient = await prisma.coachingClient.findFirst({
      where: {
        coachId: String(session.user.id),
        clientId: id,
      },
      select: {
        id: true,
      },
    });

    if (!coachingClient) {
      return res.status(403).json({ error: 'Not authorized to view this client profile' });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        headline: true,
        aboutMe: true,
        location: true,
        workPreferences: true,
        skillsJson: true,
        languagesJson: true,
        educationJson: true,
        slug: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const bestResume = await prisma.resume.findFirst({
      where: { userId: id },
      orderBy: [{ isPrimary: 'desc' }, { updatedAt: 'desc' }],
      select: {
        id: true,
        content: true,
      },
    });

    const workPreferencesObj = getWorkPreferencesObject(user.workPreferences);
    const preferredLocations = getPreferredLocationsFromWorkPreferences(workPreferencesObj);
    const workStatus = getWorkStatusFromWorkPreferences(workPreferencesObj);
    const preferredWorkType = getPreferredWorkTypeFromWorkPreferences(workPreferencesObj);
    const willingToRelocate = getRelocateFromWorkPreferences(workPreferencesObj);

    const profileSkills = dedupeCaseInsensitive(toArrayJson(user.skillsJson));
    const resumeSkills = bestResume?.content
      ? extractSkillsFromResumeContent(bestResume.content)
      : [];
    const effectiveSkills = profileSkills.length ? profileSkills : resumeSkills;

    const experience = bestResume?.content
      ? extractExperienceFromResumeContent(bestResume.content)
      : [];

    const education = toEducationObjects(user.educationJson);
    const languages = toArrayJson(user.languagesJson);

    const profile = {
      id: user.id,
      userId: user.id,
      name: user.name || '',
      email: user.email || '',
      headline: user.headline || '',
      summary: user.aboutMe || '',
      aboutMe: user.aboutMe || '',
      location: user.location || '',
      slug: user.slug || '',
      profileUrl: user.slug ? `/profile/${user.slug}` : '',
      workPreferences: workPreferencesObj,
      preferredLocations,
      workStatus,
      preferredWorkType,
      willingToRelocate,
      skills: effectiveSkills,
      skillsProfile: profileSkills,
      skillsResume: resumeSkills,
      languages,
      education,
      experience,
      resumeId: bestResume?.id || null,
    };

    return res.status(200).json({ profile });
  } catch (error) {
    console.error('[api/coaching/clients/profile/[id]] error:', error);
    return res.status(500).json({ error: 'Failed to load client profile' });
  }
}