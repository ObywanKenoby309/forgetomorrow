// pages/api/offer-negotiation/export-foundry.js
// Exports a saved Offer & Negotiation report into a real PDF file,
// stores it in Supabase Storage, then shares that artifact into a Foundry room.

import React from 'react';
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

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function safeFileBaseName(value) {
  return String(value || 'negotiation-brief')
    .trim()
    .replace(/[^a-z0-9_\-]+/gi, '_')
    .replace(/^_+|_+$/g, '') || 'negotiation-brief';
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
    marginBottom: 4,
  },
  heroText: {
    fontSize: 10,
    color: '#334155',
    marginBottom: 3,
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

function OfferNegotiationPDF({ negotiation, user }) {
  const result = negotiation?.result || {};
  const input = negotiation?.input || {};
  const form = input?.formData || {};
  const decision = result.decision || {};
  const role =
    result?.roleContext?.interpretedRole ||
    form?.offerRoleTitle ||
    form?.currentJobTitle ||
    'Offer & Negotiation Brief';
  const company = form?.offerCompany || '';
  const generatedAt = negotiation?.createdAt || new Date().toISOString();

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.eyebrow}>ForgeTomorrow · Offer & Negotiation</Text>
        <Text style={styles.title}>Negotiation Brief</Text>
        <Text style={styles.subtitle}>
          {safeText(user?.name || user?.email, 'Candidate')} · {safeText(role, 'Target Role')}{company ? ` · ${company}` : ''}
        </Text>
        <Text style={styles.subtitle}>Generated: {new Date(generatedAt).toLocaleString()}</Text>

        <View style={styles.hero}>
          <Text style={styles.heroTitle}>{safeText(decision.recommendedMove, 'Recommended Move')}</Text>
          <Text style={styles.heroText}>{safeText(decision.oneLineSummary, 'Review the full brief before negotiating.')}</Text>
          <Text style={styles.heroText}>Leverage: {safeText(decision.leverageBand, '—')}{decision.leverageScore != null ? ` (${decision.leverageScore}/10)` : ''}</Text>
          <Text style={styles.heroText}>Risk: {safeText(decision.riskLevel, '—')}</Text>
          <Text style={styles.heroText}>Target Ask: {safeText(decision.targetAsk, '—')}</Text>
          <Text style={styles.heroText}>Fallback Floor: {safeText(decision.fallbackFloor, '—')}</Text>
        </View>

        <Section title="Decision Drivers">
          <TextBlock title="Leverage Drivers" value={safeArray(decision.leverageDrivers).join('; ')} />
          <TextBlock title="Do Not Trade Away" value={safeArray(decision.doNotTradeAway).join('; ')} />
        </Section>

        {result.negotiationRiskSnapshot ? (
          <Section title="Negotiation Risk Snapshot">
            <TextBlock title="Biggest Strength" value={result.negotiationRiskSnapshot.biggestStrength} />
            <TextBlock title="Biggest Weakness" value={result.negotiationRiskSnapshot.biggestWeakness} />
            <TextBlock title="Biggest Opportunity" value={result.negotiationRiskSnapshot.biggestOpportunity} />
            <TextBlock title="Biggest Risk" value={result.negotiationRiskSnapshot.biggestRisk} />
          </Section>
        ) : null}

        {result.marketReality ? (
          <Section title="Market Reality">
            <TextBlock title="Directional Range" value={result.marketReality.directionalRange} />
            <TextBlock title="Market Tension" value={result.marketReality.marketTension} />
            <TextBlock title="Confidence Level" value={result.marketReality.confidenceLevel} />
          </Section>
        ) : null}

        {result.valueJustification ? (
          <Section title="Value Justification">
            <Text style={styles.blockTitle}>Core Leverage</Text>
            <BulletList items={result.valueJustification.coreLeverage} />
            <Text style={styles.blockTitle}>Non-Salary Levers</Text>
            <BulletList items={result.valueJustification.nonSalaryLevers} />
          </Section>
        ) : null}

        {safeArray(result.negotiationPaths).length ? (
          <Section title="Negotiation Paths">
            {safeArray(result.negotiationPaths).slice(0, 3).map((path, index) => (
              <View key={`${index}-${path?.label || 'path'}`} style={{ marginBottom: 8 }}>
                <Text style={styles.blockTitle}>{path?.label || `Path ${index + 1}`}</Text>
                <Text style={styles.paragraph}>Ask: {safeText(path?.askFraming, '—')}</Text>
                <Text style={styles.paragraph}>Best when: {safeText(path?.bestWhen, '—')}</Text>
                <Text style={styles.paragraph}>Tradeoffs: {safeText(path?.tradeoffs, '—')}</Text>
              </View>
            ))}
          </Section>
        ) : null}

        {result.conversationScript ? (
          <Section title="Conversation Scripts">
            <TextBlock title="Email Version" value={result.conversationScript.emailVersion} />
            <TextBlock title="Live Conversation" value={result.conversationScript.liveConversationVersion} />
          </Section>
        ) : null}

        {result.nextSteps ? (
          <Section title="Next Steps">
            <Text style={styles.blockTitle}>Immediate</Text>
            <BulletList items={result.nextSteps.immediate} />
            <Text style={styles.blockTitle}>Prepare For Pushback</Text>
            <BulletList items={result.nextSteps.prepareForPushback} />
            <Text style={styles.blockTitle}>Walk-Away Signals</Text>
            <BulletList items={result.nextSteps.walkAwaySignals} />
          </Section>
        ) : null}

        {result.mentorEscalation ? (
          <Section title="Mentor Escalation">
            <TextBlock title="Why It Helps" value={result.mentorEscalation.whyItHelps} />
            <TextBlock title="What To Bring" value={result.mentorEscalation.whatToBring} />
          </Section>
        ) : null}

        <Text style={styles.footer}>
          ForgeTomorrow guidance only — not legal, financial, or tax advice. Use this for planning, coaching, and discussion.
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

    const { negotiationId, roomId } = req.body || {};
    const resolvedNegotiationId = String(negotiationId || '').trim();
    const resolvedRoomId = String(roomId || '').trim();

    if (!resolvedNegotiationId) return res.status(400).json({ error: 'negotiationId required' });
    if (!resolvedRoomId) return res.status(400).json({ error: 'roomId required' });

    const [user, negotiation, room] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, name: true, email: true },
      }),
      prisma.negotiation.findFirst({
        where: { id: resolvedNegotiationId, userId: session.user.id },
        select: { id: true, userId: true, input: true, result: true, pdfUrl: true, createdAt: true },
      }),
      prisma.foundryRoom.findUnique({
        where: { roomId: resolvedRoomId },
        select: { id: true, status: true, hostId: true, coHostUserId: true },
      }),
    ]);

    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!negotiation) return res.status(404).json({ error: 'Negotiation report not found for this user' });
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

    const result = negotiation.result || {};
    const form = negotiation.input?.formData || {};
    const role = result?.roleContext?.interpretedRole || form?.offerRoleTitle || form?.currentJobTitle || 'Negotiation Brief';
    const fileBaseName = safeFileBaseName(`${role}_Negotiation_Brief`);

    const pdfBuffer = await pdf(<OfferNegotiationPDF negotiation={negotiation} user={user} />).toBuffer();

    const fileName = `${fileBaseName}.pdf`;
    const storagePath = `${session.user.id}/foundry/${resolvedRoomId}/forge-negotiation-${negotiation.id}-${Date.now()}-${nanoid(8)}.pdf`;

    const savedPath = await uploadFile({
      buffer: pdfBuffer,
      path: storagePath,
      contentType: 'application/pdf',
    });

    await prisma.negotiation.updateMany({
      where: { id: negotiation.id, userId: session.user.id },
      data: { pdfUrl: savedPath },
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
    console.error('[api/offer-negotiation/export-foundry]', err);
    return res.status(500).json({ error: 'Could not export negotiation brief for Foundry' });
  }
}
