// pages/api/cover/export-foundry.js
// Exports a structured Forge cover letter into a real PDF file, stores it in Supabase Storage,
// then shares that stored artifact into a Foundry room.

import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '@/lib/prisma';
import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { nanoid } from 'nanoid';
import { uploadFile } from '@/lib/storage';

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

function safeFileBaseName(value) {
  return String(value || 'cover_letter')
    .trim()
    .replace(/[^a-z0-9_\-]+/gi, '_')
    .replace(/^_+|_+$/g, '') || 'cover_letter';
}

function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeCoverData({ stored, rawContent, user, cover }) {
  const root = stored?.data || stored?.coverData || stored || {};

  // If an older record stored plain text instead of JSON, preserve it as the body.
  const plainTextBody = !stored && typeof rawContent === 'string' ? rawContent : '';

  const fullName =
    root.fullName ||
    root.name ||
    root.personalInfo?.fullName ||
    root.personalInfo?.name ||
    user.name ||
    'Your Name';

  return {
    fullName: normalizeText(fullName),
    email: normalizeText(root.email || root.personalInfo?.email || user.email || ''),
    phone: normalizeText(root.phone || root.personalInfo?.phone || ''),
    location: normalizeText(root.location || root.personalInfo?.location || ''),
    portfolio: normalizeText(root.portfolio || root.forgeUrl || root.personalInfo?.portfolio || ''),
    recipient: normalizeText(root.recipient || 'Hiring Manager'),
    company: normalizeText(root.company || root.targetCompany || 'the company'),
    greeting: normalizeText(root.greeting || 'Dear Hiring Manager,'),
    opening: normalizeText(root.opening || ''),
    body: normalizeText(root.body || root.bullets || root.content || plainTextBody || ''),
    closing: normalizeText(root.closing || ''),
    signoff: normalizeText(root.signoff || 'Warm regards,'),
    fileBaseName: safeFileBaseName(cover.name || `${fullName || 'ForgeTomorrow'}_Cover_Letter`),
  };
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 11,
    paddingTop: 72,
    paddingRight: 72,
    paddingBottom: 72,
    paddingLeft: 72,
    color: '#1f2937',
    lineHeight: 1.6,
  },
  header: { marginBottom: 36 },
  name: { fontSize: 13, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  contact: { fontSize: 10, color: '#6b7280' },
  recipientBlock: { marginBottom: 22 },
  greeting: { marginBottom: 18, fontFamily: 'Helvetica-Bold' },
  paragraph: { marginBottom: 14, textAlign: 'justify' },
  bullets: { marginTop: 2, marginBottom: 16 },
  bulletRow: { flexDirection: 'row', marginBottom: 8 },
  bulletSymbol: { width: 14, fontFamily: 'Helvetica-Bold' },
  bulletText: { flex: 1, textAlign: 'justify' },
  closing: { marginTop: 4, marginBottom: 30, textAlign: 'justify' },
  signoff: { marginTop: 24 },
  signoffText: { marginBottom: 8 },
  signature: { fontFamily: 'Helvetica-Bold' },
});

function CoverLetterPdf({ data }) {
  const contact = [data.email, data.phone, data.location].filter(Boolean).slice(0, 3).join(' · ');
  const bodyLines = String(data.body || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{data.fullName}</Text>
          {(contact || data.portfolio) && (
            <Text style={styles.contact}>
              {contact}{contact && data.portfolio ? ' · ' : ''}{data.portfolio || ''}
            </Text>
          )}
        </View>

        <View style={styles.recipientBlock}>
          <Text>{data.recipient}</Text>
          <Text>{data.company}</Text>
        </View>

        <Text style={styles.greeting}>{data.greeting}</Text>

        {data.opening ? <Text style={styles.paragraph}>{data.opening}</Text> : null}

        {bodyLines.length > 0 ? (
          <View style={styles.bullets}>
            {bodyLines.map((line, index) => (
              <View key={`${line}-${index}`} style={styles.bulletRow}>
                <Text style={styles.bulletSymbol}>•</Text>
                <Text style={styles.bulletText}>{line.replace(/^[•\-]\s*/, '')}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {data.closing ? <Text style={styles.closing}>{data.closing}</Text> : null}

        <View style={styles.signoff}>
          <Text style={styles.signoffText}>{data.signoff}</Text>
          <Text style={styles.signature}>{data.fullName}</Text>
        </View>
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

    const { coverId, roomId } = req.body || {};
    const parsedCoverId = Number(coverId);
    const resolvedRoomId = typeof roomId === 'string' ? roomId : '';

    if (!parsedCoverId || Number.isNaN(parsedCoverId)) {
      return res.status(400).json({ error: 'Invalid cover id' });
    }

    if (!resolvedRoomId) {
      return res.status(400).json({ error: 'roomId required' });
    }

    const [user, cover, room] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, name: true, email: true },
      }),
      prisma.cover.findFirst({
        where: { id: parsedCoverId, userId: session.user.id },
        select: { id: true, userId: true, name: true, content: true },
      }),
      prisma.foundryRoom.findUnique({
        where: { roomId: resolvedRoomId },
        select: { id: true, status: true, hostId: true, coHostUserId: true },
      }),
    ]);

    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!cover) return res.status(404).json({ error: 'Cover letter not found for this user' });
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

    const stored = safeJsonParse(cover.content);
    const data = normalizeCoverData({ stored, rawContent: cover.content, user, cover });
    const pdfBuffer = await pdf(<CoverLetterPdf data={data} />).toBuffer();

    const fileName = `${data.fileBaseName}.pdf`;
    const storagePath = `${session.user.id}/foundry/${resolvedRoomId}/forge-cover-${cover.id}-${Date.now()}-${nanoid(8)}.pdf`;

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
    console.error('[api/cover/export-foundry]', err);
    return res.status(500).json({ error: 'Could not export cover letter for Foundry' });
  }
}
