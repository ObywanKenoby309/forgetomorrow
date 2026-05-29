// pages/api/seeker/applications/[id]/interview-prep-export-foundry.js
// Exports a saved Seeker Interview Prep guide into a real PDF file, stores it in Supabase Storage,
// then shares that stored artifact into a Foundry room.
//
// IMPORTANT: This route is intentionally named interview-prep-export-foundry.js because
// pages/api/seeker/applications/[id]/interview-prep.js already exists as a file. Creating
// pages/api/seeker/applications/[id]/interview-prep/export-foundry.js would conflict in Next.js.

import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import prisma from '@/lib/prisma';
import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { nanoid } from 'nanoid';
import { uploadFile } from '@/lib/storage';

function safe(value = '') {
  return String(value || '').trim();
}

function safeArray(value, limit = 20) {
  if (Array.isArray(value)) return value.filter(Boolean).slice(0, limit);
  return [];
}

function safeJsonParse(value) {
  try {
    if (!value) return null;
    if (typeof value === 'object') return value;
    if (typeof value !== 'string') return null;
    const s = value.trim();
    if (!s) return null;
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function safeFileBaseName(value) {
  return String(value || 'interview_prep')
    .trim()
    .replace(/[^a-z0-9_\-]+/gi, '_')
    .replace(/^_+|_+$/g, '') || 'interview_prep';
}

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

function extractMatchedSignals(why) {
  return safeArray(why?.signals?.matched, 8)
    .concat(safeArray(why?.strengths, 6))
    .map((item) => {
      if (typeof item === 'string') return item;
      return safe(item?.seekerLabel || item?.label || item?.text || item?.skill || '');
    })
    .filter(Boolean)
    .filter((item, index, arr) => arr.findIndex((x) => x.toLowerCase() === item.toLowerCase()) === index)
    .slice(0, 8);
}

function extractPrepAreas(why) {
  return safeArray(why?.signals?.not_yet_demonstrated, 10)
    .concat(safeArray(why?.gaps, 8))
    .map((gap) => {
      if (typeof gap === 'string') {
        return {
          area: gap,
          priority: 'medium',
          prepNote: `Prepare a specific example that connects your experience to ${gap}.`,
        };
      }

      const area = safe(gap?.label || gap?.requirement || gap?.skill || gap?.area || 'Prep area');
      const priority = safe(gap?.tier || gap?.priority || 'B') === 'A' ? 'high' : safe(gap?.tier || gap?.priority || 'B') === 'C' ? 'low' : 'medium';
      const note = safe(gap?.why_missing || gap?.description || gap?.prepNote || gap?.note);

      return {
        area,
        priority,
        prepNote: note || `Prepare a specific example that shows your closest real experience with ${area}.`,
      };
    })
    .filter((item) => item.area)
    .filter((item, index, arr) => arr.findIndex((x) => x.area.toLowerCase() === item.area.toLowerCase()) === index)
    .slice(0, 8);
}

function extractTransferable(why) {
  return safeArray(why?.skills?.transferable, 8)
    .map((item) => {
      if (typeof item === 'string') {
        return {
          skill: item,
          note: `Bridge this explicitly. Show how your experience transfers into the interview context without overclaiming identical experience.`,
        };
      }
      const skill = safe(item?.label || item?.name || item?.skill || 'Transferable skill');
      return {
        skill,
        note: safe(item?.note || item?.description) || `Bridge this explicitly. Show how your experience transfers into ${skill} without assuming the interviewer will make the connection for you.`,
      };
    })
    .filter((item) => item.skill)
    .filter((item, index, arr) => arr.findIndex((x) => x.skill.toLowerCase() === item.skill.toLowerCase()) === index)
    .slice(0, 8);
}

function extractInterviewQuestions(why) {
  const behavioral = safeArray(why?.interviewQuestions?.behavioral, 4)
    .map((question) => ({ type: 'Behavioral', question: safe(question) }))
    .filter((item) => item.question);

  const roleSpecific = safeArray(why?.interviewQuestions?.occupational || why?.interviewQuestions?.roleSpecific, 4)
    .map((question) => ({ type: 'Role-specific', question: safe(question) }))
    .filter((item) => item.question);

  return [...behavioral, ...roleSpecific].slice(0, 8);
}

function buildPrepPayload(why, job) {
  const company = safe(job?.company) || 'the company';
  const title = safe(job?.title) || 'the role';

  return {
    prepAreas: extractPrepAreas(why),
    confidenceAreas: extractMatchedSignals(why).map((area) => ({
      area,
      note: `Lead with a concrete example that proves ${area}. Use this early so the conversation starts from demonstrated capability.`,
    })),
    transferable: extractTransferable(why),
    interviewQuestions: extractInterviewQuestions(why),
    storyBankPrompts: [
      'Prepare a story where you owned a project or problem from start to finish. Focus on scope, decisions, obstacles, and result.',
      'Be ready to discuss a situation where you had to learn quickly, adapt under pressure, and turn that learning into a useful outcome.',
      'Have an example ready that shows how you handled disagreement, changing expectations, or ambiguity without losing professionalism or momentum.',
      'Think through a real example where you solved a complex problem by breaking it down, communicating clearly, and following through.',
    ],
    universalPrep: [
      {
        area: 'Know the company',
        note: `Review ${company}'s mission, product/service, customer base, and recent public-facing updates. Prepare one reason their work matters to you beyond needing a job.`,
      },
      {
        area: 'Know the role',
        note: `Read the ${title} description like an interviewer. Identify the top responsibilities, top requirements, and one proof example for each.`,
      },
      {
        area: 'Your walk-away conditions',
        note: 'Know your minimum acceptable compensation, role scope, schedule/work arrangement, and any deal-breakers before the conversation gets emotional.',
      },
      {
        area: 'Questions for them',
        note: 'Prepare 3-5 questions that reveal expectations, success measures, team structure, and what a strong first 90 days would look like.',
      },
    ],
  };
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 42,
    paddingBottom: 42,
    paddingHorizontal: 46,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1f2937',
    lineHeight: 1.45,
  },
  eyebrow: {
    fontSize: 9,
    color: '#FF7043',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 11,
    color: '#4b5563',
    marginBottom: 18,
  },
  section: {
    marginBottom: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    borderTopStyle: 'solid',
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#FF7043',
    marginBottom: 8,
  },
  card: {
    padding: 9,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'solid',
    marginBottom: 7,
  },
  cardTitle: {
    fontSize: 10.5,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    marginBottom: 3,
  },
  cardMeta: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#FF7043',
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  body: {
    fontSize: 9.5,
    color: '#374151',
  },
  bullet: {
    fontSize: 9.5,
    color: '#374151',
    marginBottom: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 22,
    left: 46,
    right: 46,
    fontSize: 8,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

function Card({ title, meta, children }) {
  return (
    <View style={styles.card} wrap={false}>
      {meta ? <Text style={styles.cardMeta}>{meta}</Text> : null}
      {title ? <Text style={styles.cardTitle}>{title}</Text> : null}
      <Text style={styles.body}>{children}</Text>
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

function InterviewPrepPDF({ application, prep }) {
  const jobTitle = safe(application?.job?.title) || 'this role';
  const company = safe(application?.job?.company) || 'this company';

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.eyebrow}>ForgeTomorrow Interview Prep</Text>
        <Text style={styles.title}>{jobTitle}</Text>
        <Text style={styles.subtitle}>{company} · Application #{application.id}</Text>

        {prep.prepAreas.length > 0 ? (
          <Section title="Focus Areas">
            {prep.prepAreas.map((item, index) => (
              <Card key={`prep-${index}`} title={item.area} meta={item.priority ? `${item.priority} focus` : 'Prep area'}>
                {item.prepNote}
              </Card>
            ))}
          </Section>
        ) : null}

        {prep.confidenceAreas.length > 0 ? (
          <Section title="Lead With These">
            {prep.confidenceAreas.map((item, index) => (
              <Card key={`confidence-${index}`} title={item.area} meta="Confidence signal">
                {item.note}
              </Card>
            ))}
          </Section>
        ) : null}

        {prep.transferable.length > 0 ? (
          <Section title="Bridge These Explicitly">
            {prep.transferable.map((item, index) => (
              <Card key={`transfer-${index}`} title={item.skill} meta="Transferable signal">
                {item.note}
              </Card>
            ))}
          </Section>
        ) : null}

        {prep.interviewQuestions.length > 0 ? (
          <Section title="Practice Questions">
            {prep.interviewQuestions.map((item, index) => (
              <Card key={`question-${index}`} title={item.question} meta={item.type}>
                Answer with context, what you owned, what you did, what changed, and what the result proved.
              </Card>
            ))}
          </Section>
        ) : null}

        <Section title="Story Bank Prompts">
          {prep.storyBankPrompts.map((item, index) => (
            <Text key={`story-${index}`} style={styles.bullet}>• {item}</Text>
          ))}
        </Section>

        <Section title="Always Prepare These">
          {prep.universalPrep.map((item, index) => (
            <Card key={`universal-${index}`} title={item.area}>
              {item.note}
            </Card>
          ))}
        </Section>

        <Text style={styles.footer}>Generated by ForgeTomorrow · Interview preparation guidance is evidence-based and seeker-facing.</Text>
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

    const applicationId = Number(req.query.id);
    const { roomId } = req.body || {};
    const resolvedRoomId = typeof roomId === 'string' ? roomId : '';

    if (!applicationId || Number.isNaN(applicationId)) {
      return res.status(400).json({ error: 'Invalid application id' });
    }

    if (!resolvedRoomId) {
      return res.status(400).json({ error: 'roomId required' });
    }

    const [user, application, room] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, name: true, email: true },
      }),
      prisma.application.findFirst({
        where: { id: applicationId, userId: session.user.id },
        select: {
          id: true,
          status: true,
          jobId: true,
          job: { select: { id: true, title: true, company: true } },
          resume: { select: { id: true, name: true } },
          interviewPrep: { select: { id: true, result: true, generatedAt: true } },
        },
      }),
      prisma.foundryRoom.findUnique({
        where: { roomId: resolvedRoomId },
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

    const why = safeJsonParse(application.interviewPrep?.result);
    if (!why) {
      return res.status(400).json({ error: 'Interview prep has not been generated for this application yet' });
    }

    const prep = buildPrepPayload(why, application.job);
    const pdfBuffer = await pdf(<InterviewPrepPDF application={application} prep={prep} />).toBuffer();

    const jobBase = safeFileBaseName(`${application.job?.company || 'Company'}_${application.job?.title || 'Interview'}_Prep`);
    const fileName = `${jobBase}.pdf`;
    const storagePath = `${session.user.id}/foundry/${resolvedRoomId}/forge-interview-prep-${application.id}-${Date.now()}-${nanoid(8)}.pdf`;

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
    console.error('[api/seeker/applications/[id]/interview-prep-export-foundry]', err);
    return res.status(500).json({ error: 'Could not export interview prep for Foundry' });
  }
}
