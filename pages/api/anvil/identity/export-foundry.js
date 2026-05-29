// pages/api/anvil/identity/export-foundry.js
// Exports a saved Professional Operating Profile snapshot into a real PDF file,
// stores it in Supabase Storage, then shares that artifact into a Foundry room.

import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
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

function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function toArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean).map((item) => String(item || '').trim()).filter(Boolean);
  return [String(value || '').trim()].filter(Boolean);
}

function safeFileBaseName(value) {
  return String(value || 'professional_operating_profile')
    .trim()
    .replace(/[^a-z0-9_\-]+/gi, '_')
    .replace(/^_+|_+$/g, '') || 'professional_operating_profile';
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 42,
    paddingBottom: 42,
    paddingHorizontal: 46,
    fontFamily: 'Helvetica',
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },
  eyebrow: {
    fontSize: 9,
    color: '#FF7043',
    fontWeight: 700,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 7,
  },
  title: {
    fontSize: 22,
    color: '#111827',
    fontWeight: 700,
    lineHeight: 1.18,
    marginBottom: 8,
  },
  summary: {
    fontSize: 10.5,
    color: '#475569',
    lineHeight: 1.55,
    marginBottom: 12,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: 14,
  },
  chip: {
    fontSize: 8.5,
    color: '#C2410C',
    backgroundColor: '#FFF1EC',
    border: '1px solid #FED7C8',
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 7,
  },
  section: {
    marginTop: 10,
    paddingTop: 9,
    borderTop: '1px solid #E5E7EB',
  },
  sectionTitle: {
    fontSize: 10,
    color: '#FF7043',
    fontWeight: 700,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  itemRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4.5,
  },
  bullet: {
    width: 8,
    fontSize: 9.5,
    color: '#FF7043',
    lineHeight: 1.45,
  },
  item: {
    flex: 1,
    fontSize: 9.4,
    color: '#334155',
    lineHeight: 1.45,
  },
  smallNote: {
    fontSize: 8.5,
    color: '#64748B',
    lineHeight: 1.4,
    marginBottom: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 46,
    right: 46,
    borderTop: '1px solid #E5E7EB',
    paddingTop: 6,
    fontSize: 8,
    color: '#94A3B8',
  },
});

function BulletSection({ title, items }) {
  const list = toArray(items).slice(0, 8);
  if (!list.length) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {list.map((item, index) => (
        <View key={`${title}-${index}`} style={styles.itemRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.item}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function EvidenceSection({ title, items }) {
  const list = toArray(items).slice(0, 5);
  if (!list.length) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {list.map((item, index) => (
        <Text key={`${title}-${index}`} style={styles.smallNote}>• {item}</Text>
      ))}
    </View>
  );
}

function ProfessionalOperatingProfilePDF({ snapshot, user }) {
  const strengthSignals = toArray(snapshot?.strengthSignals).slice(0, 10);
  const why = snapshot?.why || {};

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.eyebrow}>ForgeTomorrow · Professional Operating Profile</Text>
        <Text style={styles.title}>{safeText(snapshot?.operatingStyle, 'Professional Operating Profile')}</Text>
        <Text style={styles.summary}>{safeText(snapshot?.professionalSummary, 'Saved professional operating profile.')}</Text>

        {strengthSignals.length > 0 && (
          <View style={styles.chips}>
            {strengthSignals.map((signal, index) => (
              <Text key={`${signal}-${index}`} style={styles.chip}>{signal}</Text>
            ))}
          </View>
        )}

        <BulletSection title="The Person" items={snapshot?.person || snapshot?.personProfile} />
        <BulletSection title="The Professional" items={snapshot?.professional || snapshot?.professionalProfile} />
        <BulletSection title="Where I Thrive" items={snapshot?.thrivesIn} />
        <BulletSection title="How I Perform Best" items={snapshot?.howTheyPerformBest} />
        <BulletSection title="How I Learn" items={snapshot?.learningProfile || snapshot?.learningGuidance || snapshot?.learningStyle} />
        <BulletSection title="How I Process Pressure" items={snapshot?.stressProcessing || snapshot?.pressureGuidance} />
        <BulletSection title="What Motivates Me" items={snapshot?.motivationProfile || snapshot?.motivationDrivers || snapshot?.motivation} />
        <BulletSection title="How To Integrate Me" items={snapshot?.integrationGuidance} />
        <BulletSection title="Where I May Need Support" items={snapshot?.supportAreas} />
        <BulletSection title="Career Direction" items={snapshot?.careerDirection} />

        <EvidenceSection title="Why This Result Appeared · Self Reflection" items={why.selfReflection} />
        <EvidenceSection title="Why This Result Appeared · Resume Evidence" items={why.resumeEvidence} />
        <EvidenceSection title="Why This Result Appeared · Portfolio Evidence" items={why.portfolioEvidence} />
        <EvidenceSection title="Why This Result Appeared · Project Evidence" items={why.projectEvidence} />
        <EvidenceSection title="Why This Result Appeared · Intelligence Signals" items={why.intelligenceEvidence} />

        <Text style={styles.footer}>
          Generated from ForgeTomorrow saved profile data{user?.name ? ` for ${user.name}` : ''}. This profile is guidance, not a personality test, diagnosis, hidden score, or automatic hiring filter.
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

    const { roomId } = req.body || {};
    const resolvedRoomId = typeof roomId === 'string' ? roomId : '';

    if (!resolvedRoomId) {
      return res.status(400).json({ error: 'roomId required' });
    }

    const [user, profile, room] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, name: true, email: true },
      }),
      prisma.professionalOperatingProfile.findUnique({
        where: { userId: session.user.id },
        select: { id: true, userId: true, snapshotJson: true, updatedAt: true },
      }),
      prisma.foundryRoom.findUnique({
        where: { roomId: resolvedRoomId },
        select: { id: true, status: true, hostId: true, coHostUserId: true },
      }),
    ]);

    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!profile?.snapshotJson) return res.status(404).json({ error: 'Professional Operating Profile not found. Save it before sharing.' });
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

    const snapshot = profile.snapshotJson || {};
    const pdfBuffer = await pdf(<ProfessionalOperatingProfilePDF snapshot={snapshot} user={user} />).toBuffer();

    const fileBaseName = safeFileBaseName(snapshot.operatingStyle || 'Professional_Operating_Profile');
    const fileName = `${fileBaseName}.pdf`;
    const storagePath = `${session.user.id}/foundry/${resolvedRoomId}/forge-pop-${profile.id}-${Date.now()}-${nanoid(8)}.pdf`;

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
    console.error('[api/anvil/identity/export-foundry]', err);
    return res.status(500).json({ error: 'Could not export Professional Operating Profile for Foundry' });
  }
}
