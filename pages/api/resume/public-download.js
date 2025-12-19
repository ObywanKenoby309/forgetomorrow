// pages/api/resume/public-download.js
import { prisma } from '@/lib/prisma';
import { pdf } from '@react-pdf/renderer';

// ✅ Designed templates (same ones used by DesignedPDFButton)
import ReverseDesignedPDF from '@/components/resume-form/templates/ReverseDesignedPDF';
import HybridDesignedPDF from '@/components/resume-form/templates/HybridDesignedPDF';

// ✅ session gating for PUBLIC vs RECRUITERS_ONLY vs PRIVATE
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

function safeJsonParse(val) {
  if (!val) return null;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return null;
  }
}

function normalizeRoot(builderData) {
  if (!builderData || typeof builderData !== 'object') return {};
  // Support a few legacy shapes
  return builderData.resumeData || builderData.data || builderData;
}

function normalizeArray(val) {
  return Array.isArray(val) ? val : [];
}

// ✅ picks the first array that is actually non-empty
function pickFirstNonEmptyArray(...vals) {
  for (const v of vals) {
    const arr = normalizeArray(v);
    if (arr.length > 0) return arr;
  }
  return [];
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { slug, resumeId } = req.query || {};

    if (!slug || typeof slug !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid slug' });
    }

    // ✅ session gating
    const session = await getServerSession(req, res, authOptions);
    const viewerEmail = session?.user?.email ? String(session.user.email) : null;

    // Find user by slug (visibility + owner checks)
    const user = await prisma.user.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        email: true,

        // ✅ visibility fields
        isProfilePublic: true,
        profileVisibility: true, // PRIVATE | PUBLIC | RECRUITERS_ONLY

        // Primary resume fallback
        resumes: {
          where: { isPrimary: true },
          orderBy: { updatedAt: 'desc' },
          take: 1,
          select: { id: true, name: true, content: true },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // ✅ normalize legacy boolean into enum behavior (back-compat)
    const effectiveVisibility =
      user.profileVisibility || (user.isProfilePublic ? 'PUBLIC' : 'PRIVATE');

    // ✅ viewer role lookup (only if logged in)
    let viewerRole = null;
    if (viewerEmail) {
      const viewer = await prisma.user.findUnique({
        where: { email: viewerEmail },
        select: { role: true, email: true },
      });
      viewerRole = viewer?.role || null;
    }

    const isOwner =
      Boolean(viewerEmail) &&
      Boolean(user.email) &&
      String(user.email).toLowerCase() === String(viewerEmail).toLowerCase();

    const isAdmin = viewerRole === 'ADMIN';
    const isRecruiter = viewerRole === 'RECRUITER';

    const allowed =
      effectiveVisibility === 'PUBLIC'
        ? true
        : effectiveVisibility === 'RECRUITERS_ONLY'
        ? isOwner || isAdmin || isRecruiter
        : isOwner || isAdmin; // PRIVATE

    if (!allowed) {
      // stealth 404 prevents slug enumeration
      return res.status(404).json({ error: 'Not found' });
    }

    // ✅ Prefer explicit resumeId (deterministic), fallback to current primary
    let resumeRecord = null;

    if (resumeId && typeof resumeId === 'string') {
      const resumeIdNum = Number(resumeId);
      if (!Number.isFinite(resumeIdNum)) {
        return res.status(400).json({ error: 'Invalid resumeId' });
      }

      const r = await prisma.resume.findUnique({
        where: { id: resumeIdNum },
        select: { id: true, name: true, content: true, userId: true },
      });

      if (r && r.userId === user.id) {
        resumeRecord = r;
      }
    }

    if (!resumeRecord) {
      resumeRecord =
        user.resumes && user.resumes.length > 0 ? user.resumes[0] : null;
    }

    if (!resumeRecord) {
      return res.status(404).json({ error: 'No resume found' });
    }

    if (!resumeRecord.content) {
      return res.status(400).json({ error: 'Resume has no saved content' });
    }

    const stored = safeJsonParse(resumeRecord.content);
    if (!stored) {
      return res
        .status(500)
        .json({ error: 'Failed to parse stored resume content' });
    }

    // DB save format (from your save.js):
    // { template: 'hybrid'|'reverse', data: { ...builderState } }
    const templateIdRaw =
      typeof stored?.template === 'string' ? stored.template : '';
    const templateId =
      templateIdRaw === 'hybrid' || templateIdRaw === 'reverse'
        ? templateIdRaw
        : 'reverse';

    const root = normalizeRoot(stored?.data || stored);

    // Build the same `data` shape the Designed templates receive in DesignedPDFButton
    const formDataRaw = root.formData || root.personalInfo || {};

    const personalInfo = {
      name: formDataRaw.fullName || formDataRaw.name || user.name || '',
      email: formDataRaw.email || '',
      phone: formDataRaw.phone || '',
      location: formDataRaw.location || '',
      portfolio:
        formDataRaw.portfolio ||
        formDataRaw.forgeUrl ||
        formDataRaw.ftProfile ||
        `https://forgetomorrow.com/u/${slug}`,
      linkedin: formDataRaw.linkedin || '',
      github: formDataRaw.github || '',
      role: formDataRaw.role || formDataRaw.targetedRole || '',
    };

    const summary =
      root.summary ||
      root.professionalSummary ||
      root.about ||
      root.summaryText ||
      '';

    const workExperiences = pickFirstNonEmptyArray(
      root.experiences,
      root.workExperiences,
      root.workExperience
    );

    const projects = normalizeArray(root.projects);

    const volunteerExperiences = pickFirstNonEmptyArray(
      root.volunteerExperiences,
      root.volunteer,
      root.volunteering
    );

    const educationList = pickFirstNonEmptyArray(
      root.educationList,
      root.education,
      root.educations
    );

    const certifications = pickFirstNonEmptyArray(
      root.certifications,
      root.certificationList
    );

    const languages = normalizeArray(root.languages);
    const skills = normalizeArray(root.skills);
    const achievements = normalizeArray(root.achievements);
    const customSections = normalizeArray(root.customSections);

    const data = {
      personalInfo,
      summary,
      workExperiences,
      projects,
      volunteerExperiences,
      educationList,
      certifications,
      languages,
      skills,
      achievements,
      customSections,
    };

    const baseName =
      (resumeRecord.name && resumeRecord.name.trim()) ||
      (user.name && `${user.name.replace(/\s+/g, '_')}_Resume`) ||
      'resume';

    const safeName = baseName.replace(/[^a-z0-9_\-]+/gi, '_');

    // ✅ Render using the SAME component choice as DesignedPDFButton
    let pdfBuffer;
    try {
      const Component = templateId === 'hybrid' ? HybridDesignedPDF : ReverseDesignedPDF;
      const doc = pdf(<Component data={data} />);
      pdfBuffer = await doc.toBuffer();
    } catch (e) {
      console.error('[public-download] PDF render failed', e);
      return res.status(500).json({
        error: 'PDF render failed',
        detail: e?.message || String(e),
      });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${safeName}.pdf"`
    );

    return res.status(200).send(pdfBuffer);
  } catch (err) {
    console.error('[api/resume/public-download] error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
