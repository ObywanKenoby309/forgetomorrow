// pages/api/resume/export-foundry.js
// Exports a structured Forge resume into a real PDF file, stores it in Supabase Storage,
// then shares that stored artifact into a Foundry room.

import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '@/lib/prisma';
import { pdf } from '@react-pdf/renderer';
import { nanoid } from 'nanoid';
import { uploadFile } from '@/lib/storage';

import ReverseDesignedPDF from '@/components/resume-form/templates/ReverseDesignedPDF';
import HybridDesignedPDF from '@/components/resume-form/templates/HybridDesignedPDF';

function relativeTime(date) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function normalizeFile(file) {
  return {
    id: file.id,
    name: file.fileName,
    downloadUrl: `/api/files/download?fileId=${file.id}`,
    hasFile: !!file.fileUrl,
    sharedBy: file.sharedByName || 'Unknown',
    ago: relativeTime(file.sharedAt),
    source: file.source || 'FORGE',
  };
}

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
  return builderData.resumeData || builderData.data || builderData;
}

function normalizeArray(val) {
  return Array.isArray(val) ? val : [];
}

function pickFirstNonEmptyArray(...vals) {
  for (const v of vals) {
    const arr = normalizeArray(v);
    if (arr.length > 0) return arr;
  }
  return [];
}

function safeFileBaseName(value) {
  return String(value || 'resume')
    .trim()
    .replace(/[^a-z0-9_\-]+/gi, '_')
    .replace(/^_+|_+$/g, '') || 'resume';
}

function buildResumePdfData({ stored, user, resume }) {
  const templateIdRaw = typeof stored?.template === 'string' ? stored.template : '';
  const templateId = templateIdRaw === 'hybrid' || templateIdRaw === 'reverse' ? templateIdRaw : 'reverse';
  const root = normalizeRoot(stored?.data || stored);
  const formDataRaw = root.formData || root.personalInfo || {};

  const personalInfo = {
    name: formDataRaw.fullName || formDataRaw.name || user.name || '',
    email: formDataRaw.email || user.email || '',
    phone: formDataRaw.phone || '',
    location: formDataRaw.location || '',
    portfolio: formDataRaw.portfolio || formDataRaw.forgeUrl || formDataRaw.ftProfile || '',
    externalurl: formDataRaw.externalurl || '',
    github: formDataRaw.github || '',
    role: formDataRaw.role || formDataRaw.targetedRole || '',
  };

  return {
    templateId,
    fileBaseName: safeFileBaseName(resume.name || `${user.name || 'ForgeTomorrow'}_Resume`),
    data: {
      personalInfo,
      summary: root.summary || root.professionalSummary || root.about || root.summaryText || '',
      workExperiences: pickFirstNonEmptyArray(root.experiences, root.workExperiences, root.workExperience),
      projects: normalizeArray(root.projects),
      volunteerExperiences: pickFirstNonEmptyArray(root.volunteerExperiences, root.volunteer, root.volunteering),
      educationList: pickFirstNonEmptyArray(root.educationList, root.education, root.educations),
      certifications: pickFirstNonEmptyArray(root.certifications, root.certificationList),
      languages: normalizeArray(root.languages),
      skills: normalizeArray(root.skills),
      achievements: normalizeArray(root.achievements),
      customSections: normalizeArray(root.customSections),
    },
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });

    const { resumeId, roomId } = req.body || {};
    const parsedResumeId = Number(resumeId);
    const resolvedRoomId = typeof roomId === 'string' ? roomId : '';

    if (!parsedResumeId || Number.isNaN(parsedResumeId)) {
      return res.status(400).json({ error: 'Invalid resume id' });
    }

    if (!resolvedRoomId) {
      return res.status(400).json({ error: 'roomId required' });
    }

    const [user, resume, room] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, name: true, email: true },
      }),
      prisma.resume.findFirst({
        where: { id: parsedResumeId, userId: session.user.id },
        select: { id: true, userId: true, name: true, content: true },
      }),
      prisma.foundryRoom.findUnique({
        where: { roomId: resolvedRoomId },
        select: { id: true, status: true, hostId: true, coHostUserId: true },
      }),
    ]);

    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!resume) return res.status(404).json({ error: 'Resume not found for this user' });
    if (!room) return res.status(404).json({ error: 'Foundry not found' });
    if (room.status === 'ENDED') return res.status(410).json({ error: 'Session has ended' });

    const isHost = room.hostId === session.user.id;
    const isCoHost = room.coHostUserId === session.user.id;
    let isParticipant = false;

    if (!isHost && !isCoHost) {
      const participant = await prisma.foundryParticipant.findFirst({
        where: { roomId: room.id, userId: session.user.id },
        select: { id: true },
      });
      isParticipant = !!participant;
    }

    if (!isHost && !isCoHost && !isParticipant) {
      return res.status(403).json({ error: 'You are not a participant in this Foundry' });
    }

    const stored = safeJsonParse(resume.content);
    if (!stored) return res.status(500).json({ error: 'Failed to parse stored resume content' });

    const { templateId, fileBaseName, data } = buildResumePdfData({ stored, user, resume });
    const Component = templateId === 'hybrid' ? HybridDesignedPDF : ReverseDesignedPDF;
    const pdfBuffer = await pdf(<Component data={data} />).toBuffer();

    const fileName = `${fileBaseName}.pdf`;
    const storagePath = `${session.user.id}/foundry/${resolvedRoomId}/forge-resume-${resume.id}-${Date.now()}-${nanoid(8)}.pdf`;

    const savedPath = await uploadFile({
      buffer: pdfBuffer,
      path: storagePath,
      contentType: 'application/pdf',
    });

    const sharedByName = user.name || user.email || 'Unknown';
    const sharedFile = await prisma.foundrySharedFile.create({
      data: {
        roomId: room.id,
        sharedById: session.user.id,
        sharedByName,
        fileName,
        fileUrl: savedPath,
        source: 'FORGE',
        sharedAt: new Date(),
      },
    });

    return res.status(200).json({ file: normalizeFile(sharedFile) });
  } catch (err) {
    console.error('[api/resume/export-foundry]', err);
    return res.status(500).json({ error: 'Could not export resume for Foundry' });
  }
}
