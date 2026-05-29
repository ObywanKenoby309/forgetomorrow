// pages/api/apply/application-packets/export-foundry.js
// Exports a saved ForgeTomorrow application packet into a real PDF file, stores it in Supabase Storage,
// then shares that stored artifact into a Foundry room.
//
// Privacy note: voluntary self-identification data is intentionally excluded from this packet export.
// That data should remain separate from recruiter/meeting artifacts unless a later compliance workflow
// explicitly requires and authorizes it.

import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { nanoid } from 'nanoid';
import { uploadFile } from '@/lib/storage';

function safe(value = '') {
  return String(value || '').trim();
}

function safeArray(value, limit = 40) {
  if (Array.isArray(value)) return value.filter(Boolean).slice(0, limit);
  return [];
}

function safeJsonParse(value) {
  try {
    if (!value) return null;
    if (typeof value === 'object') return value;
    if (typeof value !== 'string') return null;
    const text = value.trim();
    if (!text) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function safeFileBaseName(value) {
  return String(value || 'application_packet')
    .trim()
    .replace(/[^a-z0-9_\-]+/gi, '_')
    .replace(/^_+|_+$/g, '') || 'application_packet';
}

function relativeTime(date) {
  const d = date ? new Date(date) : new Date();
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (!Number.isFinite(diff) || diff < 60) return 'just now';
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

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function valueToText(value) {
  if (value == null || value === '') return '—';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(valueToText).join(', ');
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function normalizeResumeData(raw) {
  const parsed = safeJsonParse(raw);
  if (!parsed || typeof parsed !== 'object') return null;
  if (parsed.data && typeof parsed.data === 'object') return parsed.data;
  if (parsed.resume && typeof parsed.resume === 'object') return parsed.resume;
  return parsed;
}

function extractResumeLines(raw) {
  const data = normalizeResumeData(raw);
  if (!data) {
    const text = safe(raw);
    return text ? text.split(/\n+/).slice(0, 24) : [];
  }

  const lines = [];

  const name =
    safe(data?.formData?.fullName) ||
    safe(data?.personalInfo?.fullName) ||
    safe(data?.fullName);
  const headline = safe(data?.headline || data?.targetedRole || data?.formData?.targetedRole);
  const summary = safe(data?.summary || data?.professionalSummary);

  if (name) lines.push(`Name: ${name}`);
  if (headline) lines.push(`Headline / Target: ${headline}`);
  if (summary) lines.push(`Summary: ${summary}`);

  const skills = safeArray(data?.skills, 30)
    .map((item) => (typeof item === 'string' ? item : safe(item?.name || item?.label)))
    .filter(Boolean);
  if (skills.length) lines.push(`Skills: ${skills.join(', ')}`);

  const experiences = safeArray(
    data?.experiences || data?.workExperiences || data?.experience,
    6
  );

  experiences.forEach((exp, index) => {
    const title = safe(exp?.title || exp?.role || exp?.position);
    const company = safe(exp?.company || exp?.employer);
    const header = [title, company].filter(Boolean).join(' — ');
    if (header) lines.push(`Experience ${index + 1}: ${header}`);

    const desc = safe(exp?.description);
    if (desc) lines.push(desc);

    const bullets = safeArray(exp?.bullets || exp?.highlights, 4).map((b) => safe(b)).filter(Boolean);
    bullets.forEach((b) => lines.push(`• ${b}`));
  });

  const education = safeArray(data?.educationList || data?.education, 4);
  education.forEach((edu) => {
    const parts = [edu?.degree, edu?.field, edu?.school].map(safe).filter(Boolean);
    if (parts.length) lines.push(`Education: ${parts.join(' — ')}`);
  });

  return lines.filter(Boolean).slice(0, 42);
}

function extractCoverLines(raw) {
  const parsed = safeJsonParse(raw);
  if (parsed && typeof parsed === 'object') {
    const candidates = [
      parsed.content,
      parsed.body,
      parsed.letter,
      parsed.coverLetter,
      parsed.text,
      parsed.generatedText,
    ].map(safe).filter(Boolean);

    if (candidates.length) return candidates[0].split(/\n+/).filter(Boolean).slice(0, 34);

    const values = Object.values(parsed)
      .filter((v) => typeof v === 'string')
      .map(safe)
      .filter(Boolean);

    if (values.length) return values.join('\n\n').split(/\n+/).filter(Boolean).slice(0, 34);

    return JSON.stringify(parsed, null, 2).split(/\n+/).slice(0, 34);
  }

  const text = safe(raw);
  return text ? text.split(/\n+/).filter(Boolean).slice(0, 34) : [];
}

function buildQuestionLabelMap(template, jobQuestions) {
  const map = new Map();

  safeArray(jobQuestions, 20).forEach((q) => {
    const key = safe(q?.key || q?.questionKey || q?.id);
    const label = safe(q?.label || q?.question || q?.prompt);
    if (key && label) map.set(key, label);
  });

  safeArray(template?.steps, 20).forEach((step) => {
    safeArray(step?.questions, 40).forEach((q) => {
      const key = safe(q?.key || q?.questionKey || q?.id);
      const label = safe(q?.label || q?.question || q?.prompt);
      if (key && label) map.set(key, label);
    });
  });

  return map;
}

const styles = StyleSheet.create({
  page: {
    padding: 34,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1E293B',
    lineHeight: 1.35,
  },
  title: {
    fontSize: 22,
    color: '#FF7043',
    fontWeight: 700,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 14,
  },
  section: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    borderTopStyle: 'solid',
  },
  sectionTitle: {
    fontSize: 12,
    color: '#FF7043',
    fontWeight: 700,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 3,
  },
  label: {
    width: 112,
    color: '#64748B',
    fontWeight: 700,
  },
  value: {
    flex: 1,
    color: '#1E293B',
  },
  bullet: {
    marginBottom: 3,
  },
  note: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 8,
  },
});

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || '—'}</Text>
    </View>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function BulletList({ items }) {
  const arr = safeArray(items, 60);
  if (!arr.length) return <Text style={styles.bullet}>—</Text>;

  return (
    <View>
      {arr.map((item, index) => (
        <Text key={`${index}-${String(item).slice(0, 20)}`} style={styles.bullet}>
          • {String(item)}
        </Text>
      ))}
    </View>
  );
}

function ApplicationPacketPDF({ application, questionLabels }) {
  const candidateName =
    safe(application?.user?.name) ||
    [application?.user?.firstName, application?.user?.lastName].map(safe).filter(Boolean).join(' ') ||
    safe(application?.user?.email) ||
    'Candidate';

  const title = safe(application?.title || application?.job?.title || 'Application');
  const company = safe(application?.company || application?.job?.company || 'Company');

  const answers = safeArray(application?.answers, 80).map((answer) => ({
    label: questionLabels.get(answer.questionKey) || answer.questionKey,
    value: valueToText(answer.value),
  }));

  const resumeLines = extractResumeLines(application?.resume?.content);
  const coverLines = extractCoverLines(application?.cover?.content);

  return (
    <Document title={`${candidateName} Application Packet`}>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>ForgeTomorrow Application Packet</Text>
        <Text style={styles.subtitle}>
          Generated {formatDate(new Date())} · Privacy-safe export · Self-identification data excluded
        </Text>

        <Section title="Application Snapshot">
          <Row label="Candidate" value={candidateName} />
          <Row label="Email" value={application?.user?.email || '—'} />
          <Row label="Role" value={title} />
          <Row label="Company" value={company} />
          <Row label="Location" value={application?.location || application?.job?.location || '—'} />
          <Row label="Status" value={application?.status || '—'} />
          <Row label="Applied" value={formatDate(application?.appliedAt)} />
          <Row label="Submitted" value={application?.submittedAt ? formatDate(application.submittedAt) : 'Not submitted'} />
        </Section>

        <Section title="Selected Documents">
          <Row label="Resume" value={application?.resume?.name || 'No resume selected'} />
          <Row label="Cover Letter" value={application?.cover?.name || 'No cover letter selected'} />
        </Section>

        {application?.expectations ? (
          <Section title="Expectations">
            <Row label="Availability" value={application.expectations.availability} />
            <Row label="Start Date" value={application.expectations.startDate ? formatDate(application.expectations.startDate) : '—'} />
            <Row label="Relocation" value={application.expectations.willingToRelocate} />
            <Row label="Expected Salary" value={application.expectations.expectedSalary} />
            <Row label="Work Auth" value={application.expectations.workAuthorization} />
            <Row label="Sponsorship" value={application.expectations.needsSponsorship == null ? '—' : application.expectations.needsSponsorship ? 'Yes' : 'No'} />
            <Row label="Travel" value={application.expectations.willingToTravel} />
            <Row label="Notes" value={application.expectations.notes} />
          </Section>
        ) : null}

        <Section title="Screening Answers">
          {answers.length ? (
            answers.map((answer, index) => (
              <View key={`${index}-${answer.label}`} style={{ marginBottom: 7 }}>
                <Text style={{ fontWeight: 700, color: '#334155' }}>{answer.label}</Text>
                <Text>{answer.value}</Text>
              </View>
            ))
          ) : (
            <Text>—</Text>
          )}
        </Section>

        <Section title="Consent Record">
          <Row label="Terms Accepted" value={application?.consent?.termsAccepted ? 'Yes' : 'No'} />
          <Row label="Signature" value={application?.consent?.signatureName || '—'} />
          <Row label="Signed At" value={application?.consent?.signedAt ? formatDate(application.consent.signedAt) : '—'} />
          <Row label="Version" value={application?.consent?.consentTextVersion || '—'} />
        </Section>

        <Section title="Resume Snapshot">
          <BulletList items={resumeLines} />
        </Section>

        <Section title="Cover Letter Snapshot">
          <BulletList items={coverLines} />
        </Section>

        <Text style={styles.note}>
          ForgeTomorrow note: This packet is generated from saved application data, selected resume/cover records,
          screening answers, expectations, and consent. Voluntary self-identification fields are excluded from this
          meeting/share artifact by default.
        </Text>
      </Page>
    </Document>
  );
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });

    const applicationId = Number(req.body?.applicationId);
    const roomId = safe(req.body?.roomId);

    if (!applicationId) return res.status(400).json({ error: 'applicationId required' });
    if (!roomId) return res.status(400).json({ error: 'roomId required' });

    const [user, application, room] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, name: true, email: true, firstName: true, lastName: true },
      }),
      prisma.application.findFirst({
        where: { id: applicationId, userId: session.user.id },
        include: {
          user: { select: { id: true, name: true, email: true, firstName: true, lastName: true } },
          job: { select: { id: true, title: true, company: true, location: true, additionalQuestions: true } },
          resume: { select: { id: true, name: true, content: true, updatedAt: true } },
          cover: { select: { id: true, name: true, content: true, updatedAt: true } },
          answers: { orderBy: { createdAt: 'asc' } },
          consent: true,
          expectations: true,
          template: {
            include: {
              steps: {
                orderBy: { order: 'asc' },
                include: { questions: { orderBy: { key: 'asc' } } },
              },
            },
          },
        },
      }),
      prisma.foundryRoom.findUnique({
        where: { roomId },
        select: { id: true, status: true, hostId: true, coHostUserId: true },
      }),
    ]);

    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!application) return res.status(404).json({ error: 'Application not found for this user' });
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

    const questionLabels = buildQuestionLabelMap(application.template, application.job?.additionalQuestions);
    const candidateName =
      user.name ||
      [user.firstName, user.lastName].map(safe).filter(Boolean).join(' ') ||
      user.email ||
      'Candidate';

    const roleName = safe(application.title || application.job?.title || 'Application');
    const companyName = safe(application.company || application.job?.company || 'Company');
    const fileBaseName = safeFileBaseName(`${candidateName}_${companyName}_${roleName}_Application_Packet`);

    const pdfBuffer = await pdf(
      <ApplicationPacketPDF application={application} questionLabels={questionLabels} />
    ).toBuffer();

    const fileName = `${fileBaseName}.pdf`;
    const storagePath = `${session.user.id}/foundry/${roomId}/application-packet-${application.id}-${Date.now()}-${nanoid(8)}.pdf`;

    const savedPath = await uploadFile({
      buffer: pdfBuffer,
      path: storagePath,
      contentType: 'application/pdf',
    });

    const packetExport = await prisma.applicationPacketExport.create({
      data: {
        applicationId: application.id,
        format: 'pdf',
        url: savedPath,
        createdByUserId: session.user.id,
      },
      select: { id: true },
    });

    const sharedByName = candidateName || user.email || 'Unknown';
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

    return res.status(200).json({
      packetExportId: packetExport.id,
      file: normalizeFile(sharedFile),
    });
  } catch (err) {
    console.error('[api/apply/application-packets/export-foundry]', err);
    return res.status(500).json({ error: 'Could not export application packet for Foundry' });
  }
}
