// pages/api/coaching/clients/strategy/export-foundry.js
// Exports a saved Coaching Target Strategy / Command Brief as a real PDF.
// GET  ?clientId=...              -> streams PDF download
// POST { clientId, roomId }       -> stores PDF in Supabase and shares it into Foundry

import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
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
  return String(value || 'target-strategy')
    .trim()
    .replace(/[^a-z0-9_\-]+/gi, '_')
    .replace(/^_+|_+$/g, '') || 'target-strategy';
}

function targetName(target) {
  if (typeof target === 'string') return target;
  return safeText(target?.name || target?.title || target?.target, 'Target');
}

function targetReason(target) {
  if (typeof target === 'string') return '';
  return safeText(target?.reason || target?.why || target?.description, '');
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
    marginBottom: 12,
  },
  hero: {
    backgroundColor: '#FFF4EF',
    border: '1 solid #FED7C8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 15,
    color: '#111827',
    fontWeight: 700,
    marginBottom: 5,
  },
  heroText: {
    fontSize: 10,
    color: '#334155',
    marginBottom: 4,
  },
  warning: {
    backgroundColor: '#FFFBEB',
    border: '1 solid #FDE68A',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
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
  blockTitle: {
    fontSize: 9,
    color: '#FF7043',
    fontWeight: 700,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  paragraph: {
    color: '#334155',
    marginBottom: 5,
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
  targetCard: {
    border: '1 solid #E5E7EB',
    borderRadius: 6,
    padding: 8,
    marginBottom: 7,
  },
  targetTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: '#111827',
    marginBottom: 3,
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

function Section({ title, children }) {
  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function TextBlock({ title, value }) {
  if (!value) return null;
  return (
    <View style={{ marginBottom: 8 }}>
      <Text style={styles.blockTitle}>{title}</Text>
      <Text style={styles.paragraph}>{String(value)}</Text>
    </View>
  );
}

function TargetList({ title, items }) {
  const list = safeArray(items);
  if (!list.length) return null;
  return (
    <View style={{ marginBottom: 8 }}>
      <Text style={styles.blockTitle}>{title}</Text>
      {list.map((target, index) => (
        <View key={`${title}-${index}-${targetName(target)}`} style={styles.targetCard}>
          <Text style={styles.targetTitle}>{targetName(target)}</Text>
          {targetReason(target) ? <Text style={styles.paragraph}>{targetReason(target)}</Text> : null}
        </View>
      ))}
    </View>
  );
}

function TargetStrategyPDF({ client, coach, strategy }) {
  const generatedAt = strategy?.generatedAt || client?.updatedAt || new Date().toISOString();

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.eyebrow}>ForgeTomorrow · Coaching Intelligence</Text>
        <Text style={styles.title}>Target Strategy Command Brief</Text>
        <Text style={styles.subtitle}>
          {safeText(client?.name, 'Client')} · Coach: {safeText(coach?.name || coach?.email, 'ForgeTomorrow Coach')}
        </Text>
        <Text style={styles.subtitle}>Generated: {new Date(generatedAt).toLocaleString()}</Text>

        {(strategy?.positioningInsight || strategy?.marketPositionWarning || strategy?.hiddenSignalGap) ? (
          <View style={styles.hero}>
            <Text style={styles.blockTitle}>Who This Person Is</Text>
            <Text style={styles.heroTitle}>{safeText(strategy.positioningInsight, 'Target strategy brief')}</Text>
            {strategy.marketPositionWarning ? (
              <Text style={styles.heroText}>Market Reality: {strategy.marketPositionWarning}</Text>
            ) : null}
            {strategy.hiddenSignalGap ? (
              <Text style={styles.heroText}>Hidden Signal Gap: {strategy.hiddenSignalGap}</Text>
            ) : null}
          </View>
        ) : null}

        {safeArray(strategy?.themes).length ? (
          <Section title="Sector Alignment">
            <BulletList items={strategy.themes} />
          </Section>
        ) : null}

        {(safeArray(strategy?.transferabilitySignals).length || safeArray(strategy?.roleLanes).length) ? (
          <Section title="Direction">
            <Text style={styles.blockTitle}>What Carries Over</Text>
            <BulletList items={strategy.transferabilitySignals} />
            <Text style={styles.blockTitle}>Role Lanes</Text>
            <BulletList items={strategy.roleLanes} />
          </Section>
        ) : null}

        {safeArray(strategy?.narrativeGaps).length ? (
          <View style={styles.warning} wrap={false}>
            <Text style={styles.sectionTitle}>Narrative Gaps</Text>
            <BulletList items={strategy.narrativeGaps} />
          </View>
        ) : null}

        {(safeArray(strategy?.safeHarborTargets).length || safeArray(strategy?.stretchTargets).length) ? (
          <Section title="Targets">
            <TargetList title="Safe Harbor Targets" items={strategy.safeHarborTargets} />
            <TargetList title="Stretch Targets" items={strategy.stretchTargets} />
          </Section>
        ) : null}

        {(safeArray(strategy?.executionPlan).length || strategy?.nextStep || strategy?.sessionFocus) ? (
          <Section title="Execution">
            <Text style={styles.blockTitle}>This Week's Execution Plan</Text>
            <BulletList items={strategy.executionPlan} />
            <TextBlock title="Next Step" value={strategy.nextStep} />
            <TextBlock title="Session Focus" value={strategy.sessionFocus} />
          </Section>
        ) : null}

        {safeArray(strategy?.reasoning).length ? (
          <Section title="Why This Strategy">
            <BulletList items={strategy.reasoning} />
          </Section>
        ) : null}

        <Text style={styles.footer}>
          ForgeTomorrow coaching guidance. Use this as a strategy artifact for coaching, planning, and meeting discussion.
        </Text>
      </Page>
    </Document>
  );
}

async function loadAuthorizedClient({ req, res }) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return { errorStatus: 401, error: 'Not authenticated' };

  const clientId = String(req.method === 'GET' ? req.query?.clientId : req.body?.clientId || '').trim();
  if (!clientId) return { errorStatus: 400, error: 'clientId required' };

  const [coach, client] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true },
    }),
    prisma.coachingClient.findFirst({
      where: { id: clientId, coachId: session.user.id },
      select: {
        id: true,
        coachId: true,
        clientId: true,
        name: true,
        email: true,
        strategyJson: true,
        strategyNextStep: true,
        updatedAt: true,
      },
    }),
  ]);

  if (!coach) return { errorStatus: 404, error: 'Coach not found' };
  if (!client) return { errorStatus: 404, error: 'Client not found' };
  if (!client.strategyJson) return { errorStatus: 404, error: 'No saved target strategy found for this client' };

  return { session, coach, client, strategy: client.strategyJson };
}

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const loaded = await loadAuthorizedClient({ req, res });
    if (loaded.error) return res.status(loaded.errorStatus || 500).json({ error: loaded.error });

    const { session, coach, client, strategy } = loaded;
    const fileBaseName = safeFileBaseName(`${client.name || 'Client'}_Target_Strategy_Command_Brief`);
    const fileName = `${fileBaseName}.pdf`;
    const pdfBuffer = await pdf(<TargetStrategyPDF client={client} coach={coach} strategy={strategy} />).toBuffer();

    if (req.method === 'GET') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.setHeader('Cache-Control', 'private, no-cache');
      return res.status(200).send(pdfBuffer);
    }

    const roomId = String(req.body?.roomId || '').trim();
    if (!roomId) return res.status(400).json({ error: 'roomId required' });

    const room = await prisma.foundryRoom.findUnique({
      where: { roomId },
      select: { id: true, status: true, hostId: true, coHostUserId: true },
    });

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

    const storagePath = `${session.user.id}/foundry/${roomId}/target-strategy-${client.id}-${Date.now()}-${nanoid(8)}.pdf`;
    const savedPath = await uploadFile({
      buffer: pdfBuffer,
      path: storagePath,
      contentType: 'application/pdf',
    });

    const sharedByName = coach.name || coach.email || 'Unknown';
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
    console.error('[api/coaching/clients/strategy/export-foundry]', err);
    return res.status(500).json({ error: 'Could not export target strategy' });
  }
}
