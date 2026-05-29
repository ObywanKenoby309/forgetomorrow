// pages/api/anvil/onboarding-growth/export-foundry.js
// Exports a saved Growth & Pivot / Career Roadmap into a real PDF file,
// stores it in Supabase Storage, then shares that artifact into a Foundry room.

import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
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

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function safeFileBaseName(value) {
  return String(value || 'growth-pivot-roadmap')
    .trim()
    .replace(/[^a-z0-9_\-]+/gi, '_')
    .replace(/^_+|_+$/g, '') || 'growth-pivot-roadmap';
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 42,
    paddingHorizontal: 46,
    fontFamily: 'Helvetica',
    color: '#1E293B',
    fontSize: 10,
    lineHeight: 1.45,
  },
  eyebrow: {
    fontSize: 8,
    color: '#FF7043',
    fontWeight: 700,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: '#FF7043',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 16,
  },
  section: {
    border: '1 solid #E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#111827',
    fontWeight: 700,
    marginBottom: 8,
  },
  block: {
    marginBottom: 8,
  },
  blockTitle: {
    fontSize: 9,
    color: '#FF7043',
    fontWeight: 700,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  bullet: {
    color: '#FF7043',
    width: 8,
  },
  bulletText: {
    flex: 1,
    color: '#334155',
  },
  paragraph: {
    color: '#334155',
    marginBottom: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 46,
    right: 46,
    fontSize: 8,
    color: '#94A3B8',
    borderTop: '1 solid #E5E7EB',
    paddingTop: 8,
  },
});

function BulletList({ items }) {
  const list = safeArray(items);
  if (!list.length) return <Text style={styles.paragraph}>—</Text>;
  return (
    <View>
      {list.map((item, index) => (
        <View key={`${index}-${String(item).slice(0, 12)}`} style={styles.bulletRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>{String(item)}</Text>
        </View>
      ))}
    </View>
  );
}

function Block({ title, children }) {
  return (
    <View style={styles.block}>
      <Text style={styles.blockTitle}>{title}</Text>
      {children}
    </View>
  );
}

function PhaseSection({ title, data }) {
  if (!data || typeof data !== 'object') return null;
  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Block title="Objectives"><BulletList items={data.objectives} /></Block>
      <Block title="Actions"><BulletList items={data.actions} /></Block>
      <Block title="Metrics"><BulletList items={data.metrics} /></Block>
      {!!safeArray(data.quickWins).length && <Block title="Quick Wins"><BulletList items={data.quickWins} /></Block>}
      {!!safeArray(data.risks).length && <Block title="Risks"><BulletList items={data.risks} /></Block>}
      {data.presentation ? <Block title="Presentation"><Text style={styles.paragraph}>{String(data.presentation)}</Text></Block> : null}
    </View>
  );
}

function GrowthRoadmapPDF({ roadmap }) {
  const plan = roadmap?.data || {};
  const meta = plan.meta || {};
  const candidate = safeText(meta.candidate, 'Candidate');
  const headline = safeText(meta.headline, 'Growth & Pivot Roadmap');
  const generatedAt = meta.generatedAt || roadmap?.generatedAt || roadmap?.createdAt || new Date().toISOString();

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.eyebrow}>ForgeTomorrow · Growth & Pivot Roadmap</Text>
        <Text style={styles.title}>30/60/90 Growth & Pivot Plan</Text>
        <Text style={styles.subtitle}>{candidate} · {headline}</Text>
        <Text style={styles.subtitle}>Generated: {new Date(generatedAt).toLocaleString()}</Text>

        <PhaseSection title="First 30 Days" data={plan.day30} />
        <PhaseSection title="Days 31 to 60" data={plan.day60} />
        <PhaseSection title="Days 61 to 90" data={plan.day90} />

        {!!safeArray(plan.growthRecommendations).length && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Growth Recommendations</Text>
            <BulletList items={plan.growthRecommendations} />
          </View>
        )}

        {!!safeArray(plan.skillsFocus).length && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills Focus</Text>
            <BulletList items={plan.skillsFocus} />
          </View>
        )}

        <Text style={styles.footer}>
          This roadmap is AI-assisted guidance based on ForgeTomorrow data and the selected resume. Use it for planning, coaching, and discussion.
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

    const { roadmapId, planId, roomId } = req.body || {};
    const resolvedRoadmapId = String(roadmapId || planId || '').trim();
    const resolvedRoomId = String(roomId || '').trim();

    if (!resolvedRoadmapId) return res.status(400).json({ error: 'roadmapId required' });
    if (!resolvedRoomId) return res.status(400).json({ error: 'roomId required' });

    const [user, roadmap, room] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, name: true, email: true },
      }),
      prisma.careerRoadmap.findFirst({
        where: { id: resolvedRoadmapId, userId: session.user.id },
        select: { id: true, userId: true, data: true, generatedAt: true, createdAt: true, updatedAt: true },
      }),
      prisma.foundryRoom.findUnique({
        where: { roomId: resolvedRoomId },
        select: { id: true, status: true, hostId: true, coHostUserId: true },
      }),
    ]);

    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!roadmap) return res.status(404).json({ error: 'Roadmap not found for this user' });
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

    const plan = roadmap.data || {};
    const candidate = safeText(plan?.meta?.candidate, user.name || user.email || 'Candidate');
    const fileBaseName = safeFileBaseName(`${candidate}_Growth_Pivot_Roadmap`);

    const pdfBuffer = await pdf(<GrowthRoadmapPDF roadmap={roadmap} />).toBuffer();

    const fileName = `${fileBaseName}.pdf`;
    const storagePath = `${session.user.id}/foundry/${resolvedRoomId}/forge-growth-roadmap-${roadmap.id}-${Date.now()}-${nanoid(8)}.pdf`;

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
    console.error('[api/anvil/onboarding-growth/export-foundry]', err);
    return res.status(500).json({ error: 'Could not export Growth & Pivot Roadmap for Foundry' });
  }
}
