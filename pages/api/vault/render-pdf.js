// pages/api/vault/render-pdf.js
// Universal PDF renderer for vault sharing.
// Renders any shareable doc type as a PDF using the SENDER's session.
// Stores in Supabase, returns a signed downloadUrl.
// Recipients get a static read-only PDF — no access to underlying doc system.

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { nanoid } from 'nanoid';
import { uploadFile } from '@/lib/storage';

// ─── Import existing PDF components where they exist ──────────────────────────
import ReverseDesignedPDF from '@/components/resume-form/templates/ReverseDesignedPDF';
import HybridDesignedPDF from '@/components/resume-form/templates/HybridDesignedPDF';

function safeJsonParse(val) {
  try {
    if (!val) return null;
    if (typeof val === 'object') return val;
    return JSON.parse(val);
  } catch { return null; }
}

function safe(val, fallback = '') {
  return String(val || '').trim() || fallback;
}

function safeArr(val) {
  return Array.isArray(val) ? val.filter(Boolean) : [];
}

// ─── Generic section PDF — used for types without a bespoke template ──────────
const genericStyles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 11, padding: 56, color: '#1f2937', lineHeight: 1.6 },
  header: { marginBottom: 24, borderBottom: '1px solid #e5e7eb', paddingBottom: 14 },
  title: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#FF7043', marginBottom: 4 },
  subtitle: { fontSize: 11, color: '#6b7280' },
  section: { marginBottom: 18 },
  sectionTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#112033', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  text: { fontSize: 11, color: '#374151', marginBottom: 4 },
  bullet: { flexDirection: 'row', marginBottom: 4 },
  bulletDot: { width: 12, color: '#FF7043', fontFamily: 'Helvetica-Bold' },
  bulletText: { flex: 1, fontSize: 11, color: '#374151' },
  kv: { flexDirection: 'row', marginBottom: 3 },
  kvKey: { width: 140, fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#6b7280', textTransform: 'uppercase' },
  kvVal: { flex: 1, fontSize: 11, color: '#374151' },
  footer: { position: 'absolute', bottom: 30, left: 56, right: 56, fontSize: 9, color: '#9ca3af', textAlign: 'center' },
});

function GenericPDF({ title, subtitle, sections, footer }) {
  return (
    <Document>
      <Page size="LETTER" style={genericStyles.page}>
        <View style={genericStyles.header}>
          <Text style={genericStyles.title}>{title}</Text>
          {subtitle ? <Text style={genericStyles.subtitle}>{subtitle}</Text> : null}
        </View>
        {sections.map((s, i) => (
          <View key={i} style={genericStyles.section}>
            {s.heading ? <Text style={genericStyles.sectionTitle}>{s.heading}</Text> : null}
            {s.text ? <Text style={genericStyles.text}>{s.text}</Text> : null}
            {s.bullets ? s.bullets.map((b, j) => (
              <View key={j} style={genericStyles.bullet}>
                <Text style={genericStyles.bulletDot}>•</Text>
                <Text style={genericStyles.bulletText}>{b}</Text>
              </View>
            )) : null}
            {s.kvPairs ? s.kvPairs.map((kv, j) => (
              <View key={j} style={genericStyles.kv}>
                <Text style={genericStyles.kvKey}>{kv.key}</Text>
                <Text style={genericStyles.kvVal}>{kv.val}</Text>
              </View>
            )) : null}
          </View>
        ))}
        <Text style={genericStyles.footer}>{footer || 'Shared via ForgeTomorrow — View only'}</Text>
      </Page>
    </Document>
  );
}

// ─── Per-type renderers ───────────────────────────────────────────────────────

async function renderResume(docId, userId) {
  const resume = await prisma.resume.findFirst({
    where: { id: Number(docId), userId },
    select: { id: true, name: true, content: true },
  });
  if (!resume) throw new Error('Resume not found');

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });
  const stored = safeJsonParse(resume.content) || {};
  const root = stored.data || stored.resumeData || stored;
  const formData = root.formData || root.personalInfo || {};
  const templateId = typeof stored.template === 'string' && stored.template === 'hybrid' ? 'hybrid' : 'reverse';

  const data = {
    personalInfo: {
      name: formData.fullName || formData.name || user?.name || '',
      email: formData.email || user?.email || '',
      phone: formData.phone || '',
      location: formData.location || '',
      portfolio: formData.portfolio || formData.forgeUrl || '',
      role: formData.role || formData.targetedRole || '',
    },
    summary: root.summary || root.professionalSummary || '',
    workExperiences: safeArr(root.experiences || root.workExperiences),
    projects: safeArr(root.projects),
    educationList: safeArr(root.educationList || root.education),
    certifications: safeArr(root.certifications),
    skills: safeArr(root.skills),
    languages: safeArr(root.languages),
    achievements: safeArr(root.achievements),
    customSections: safeArr(root.customSections),
    volunteerExperiences: safeArr(root.volunteerExperiences),
  };

  const Component = templateId === 'hybrid' ? HybridDesignedPDF : ReverseDesignedPDF;
  return { pdfBuffer: await pdf(<Component data={data} />).toBuffer(), fileName: `${safe(resume.name, 'resume')}.pdf` };
}

async function renderCover(docId, userId) {
  const cover = await prisma.cover.findFirst({
    where: { id: Number(docId), userId },
    select: { id: true, name: true, content: true },
  });
  if (!cover) throw new Error('Cover letter not found');

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });
  const stored = safeJsonParse(cover.content) || {};
  const root = stored.data || stored.coverData || stored;

  const data = {
    fullName: safe(root.fullName || root.name || user?.name, 'Your Name'),
    email: safe(root.email || user?.email),
    phone: safe(root.phone),
    location: safe(root.location),
    portfolio: safe(root.portfolio),
    recipient: safe(root.recipient, 'Hiring Manager'),
    company: safe(root.company || root.targetCompany, 'the company'),
    greeting: safe(root.greeting, 'Dear Hiring Manager,'),
    opening: safe(root.opening),
    body: safe(root.body || root.bullets || root.content),
    closing: safe(root.closing),
    signoff: safe(root.signoff, 'Warm regards,'),
  };

  const sections = [
    { text: data.greeting },
    ...(data.opening ? [{ text: data.opening }] : []),
    ...(data.body ? [{ bullets: data.body.split('\n').map(l => l.replace(/^[•\-]\s*/, '')).filter(Boolean) }] : []),
    ...(data.closing ? [{ text: data.closing }] : []),
    { text: `${data.signoff}\n${data.fullName}` },
  ];

  const pdfBuffer = await pdf(
    <GenericPDF
      title={`Cover Letter — ${data.company}`}
      subtitle={`${data.fullName} · ${data.email}`}
      sections={sections}
    />
  ).toBuffer();

  return { pdfBuffer, fileName: `${safe(cover.name, 'cover_letter').replace(/[^a-z0-9_-]+/gi, '_')}.pdf` };
}

async function renderProfile(userId) {
  const profile = await prisma.professionalOperatingProfile.findUnique({
    where: { userId },
    select: { snapshotJson: true, updatedAt: true },
  });
  if (!profile) throw new Error('Professional Operating Profile not found');

  const snap = safeJsonParse(profile.snapshotJson) || {};
  const sections = [];

  if (snap.headline) sections.push({ text: snap.headline });
  if (snap.summary || snap.coreBeliefs) sections.push({ heading: 'Professional Philosophy', text: safe(snap.summary || snap.coreBeliefs) });
  if (safeArr(snap.workingStyle).length) sections.push({ heading: 'Working Style', bullets: safeArr(snap.workingStyle) });
  if (safeArr(snap.strengths).length) sections.push({ heading: 'Core Strengths', bullets: safeArr(snap.strengths) });
  if (safeArr(snap.values).length) sections.push({ heading: 'Values', bullets: safeArr(snap.values) });
  if (snap.communicationStyle) sections.push({ heading: 'Communication Style', text: safe(snap.communicationStyle) });
  if (snap.leadershipApproach) sections.push({ heading: 'Leadership Approach', text: safe(snap.leadershipApproach) });

  if (!sections.length) sections.push({ text: 'Professional Operating Profile on file.' });

  const pdfBuffer = await pdf(
    <GenericPDF title="Professional Operating Profile" sections={sections} />
  ).toBuffer();

  return { pdfBuffer, fileName: 'professional_operating_profile.pdf' };
}

async function renderRoadmap(docId, userId) {
  const roadmap = await prisma.careerRoadmap.findFirst({
    where: { id: String(docId), userId },
    select: { data: true, generatedAt: true },
  });
  if (!roadmap) throw new Error('Roadmap not found');

  const d = safeJsonParse(roadmap.data) || {};
  const meta = d.meta || {};
  const sections = [];

  if (d.summary || d.overview) sections.push({ heading: 'Overview', text: safe(d.summary || d.overview) });
  if (safeArr(d.pivotOptions || d.options).length) {
    sections.push({
      heading: 'Growth & Pivot Options',
      bullets: safeArr(d.pivotOptions || d.options).map(o => safe(o.title || o.name || o)),
    });
  }
  if (safeArr(d.milestones || d.steps).length) {
    sections.push({
      heading: 'Milestones',
      bullets: safeArr(d.milestones || d.steps).map(m => safe(m.description || m.title || m)),
    });
  }
  if (d.nextStep || d.immediateAction) {
    sections.push({ heading: 'Next Step', text: safe(d.nextStep || d.immediateAction) });
  }

  if (!sections.length) sections.push({ text: 'Growth & Pivot Roadmap on file.' });

  const pdfBuffer = await pdf(
    <GenericPDF
      title={`${safe(meta.candidate, 'Growth')} · Growth & Pivot Roadmap`}
      subtitle={safe(meta.headline)}
      sections={sections}
    />
  ).toBuffer();

  return { pdfBuffer, fileName: 'growth_pivot_roadmap.pdf' };
}

async function renderNegotiation(docId, userId) {
  const neg = await prisma.negotiation.findFirst({
    where: { id: String(docId), userId },
    select: { input: true, result: true, createdAt: true },
  });
  if (!neg) throw new Error('Negotiation not found');

  const result = safeJsonParse(neg.result) || {};
  const input = safeJsonParse(neg.input) || {};
  const form = input.formData || {};
  const role = safe(result.roleContext?.interpretedRole || form.offerRoleTitle || form.currentJobTitle, 'Role');
  const company = safe(form.offerCompany, '');

  const sections = [];
  if (result.summary) sections.push({ heading: 'Summary', text: safe(result.summary) });
  if (safeArr(result.leveragePoints).length) sections.push({ heading: 'Leverage Points', bullets: safeArr(result.leveragePoints).map(l => safe(l.point || l)) });
  if (safeArr(result.scripts || result.negotiationScripts).length) {
    sections.push({ heading: 'Talking Points', bullets: safeArr(result.scripts || result.negotiationScripts).map(s => safe(s.script || s.line || s)) });
  }
  if (result.recommendation) sections.push({ heading: 'Recommendation', text: safe(result.recommendation) });
  if (result.floorSalary || result.targetSalary) {
    sections.push({
      heading: 'Compensation Range',
      kvPairs: [
        ...(result.floorSalary ? [{ key: 'Floor', val: safe(result.floorSalary) }] : []),
        ...(result.targetSalary ? [{ key: 'Target', val: safe(result.targetSalary) }] : []),
      ],
    });
  }

  if (!sections.length) sections.push({ text: 'Offer & Negotiation Brief on file.' });

  const pdfBuffer = await pdf(
    <GenericPDF
      title={`Offer & Negotiation Brief${company ? ` · ${company}` : ''}`}
      subtitle={role}
      sections={sections}
    />
  ).toBuffer();

  return { pdfBuffer, fileName: `negotiation_brief${company ? `_${company.replace(/[^a-z0-9]+/gi, '_')}` : ''}.pdf` };
}

// ─── Strategy PDF — full layout matching the coach's view ────────────────────
const stratStyles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 11, padding: 48, color: '#1f2937', lineHeight: 1.55 },
  footer: { position: 'absolute', bottom: 28, left: 48, right: 48, fontSize: 9, color: '#9ca3af', textAlign: 'center' },
  // Header block
  headerWrap: { marginBottom: 22, paddingBottom: 16, borderBottom: '1.5px solid #FF7043' },
  clientName: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#FF7043', marginBottom: 4 },
  positioning: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#112033', lineHeight: 1.4, marginBottom: 10 },
  // Warning blocks
  warningWrap: { backgroundColor: '#FFF8F0', border: '1px solid #FFD0B0', borderRadius: 4, padding: '8 10', marginBottom: 8 },
  warningLabel: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#E65100', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  warningText: { fontSize: 10, color: '#7C3500' },
  gapWrap: { backgroundColor: '#FFFBEA', border: '1px solid #FFE082', borderRadius: 4, padding: '8 10', marginBottom: 16 },
  gapLabel: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#E65100', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  gapText: { fontSize: 10, color: '#5D4037' },
  // Section
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 6 },
  // Bullets
  bulletRow: { flexDirection: 'row', marginBottom: 5 },
  bulletDot: { width: 10, fontSize: 11, color: '#FF7043', fontFamily: 'Helvetica-Bold' },
  bulletText: { flex: 1, fontSize: 11, color: '#374151' },
  // Numbered
  numRow: { flexDirection: 'row', marginBottom: 6 },
  numDot: { width: 18, fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#FF7043' },
  numText: { flex: 1, fontSize: 11, color: '#374151' },
  // Company pill rows
  companyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 2 },
  companyPill: { border: '1px solid #FFD0B0', borderRadius: 12, padding: '3 8', marginRight: 5, marginBottom: 4 },
  companyText: { fontSize: 10, color: '#993C1D' },
  // KV table
  kvRow: { flexDirection: 'row', marginBottom: 4 },
  kvKey: { width: 16, fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#FF7043' },
  kvVal: { flex: 1, fontSize: 11, color: '#374151' },
  // Card for target company
  card: { border: '1px solid #e5e7eb', borderRadius: 4, padding: '8 10', marginBottom: 6 },
  cardName: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#112033', marginBottom: 2 },
  cardReason: { fontSize: 10, color: '#6b7280' },
  cardStretch: { border: '1px solid #FFD0B0', borderRadius: 4, padding: '8 10', marginBottom: 6 },
});

function StrategyPDF({ clientName, s, targetCompanies }) {
  const safeHarbors = safeArr(s.safeHarborTargets);
  const stretches = safeArr(s.stretchTargets);
  const roleLanes = safeArr(s.roleLanes);
  const themes = safeArr(s.themes);
  const reasoning = safeArr(s.reasoning);
  const narrativeGaps = safeArr(s.narrativeGaps);
  const transferability = safeArr(s.transferabilitySignals);
  const executionPlan = safeArr(s.executionPlan);

  // Parse targetCompanies string into array
  const companyList = targetCompanies
    ? targetCompanies.split(/[,\n]/).map(c => c.trim()).filter(Boolean)
    : [];

  return (
    <Document>
      <Page size="LETTER" style={stratStyles.page}>
        {/* Header */}
        <View style={stratStyles.headerWrap}>
          <Text style={stratStyles.clientName}>{clientName} — Target Strategy</Text>
          {s.positioningInsight ? (
            <Text style={stratStyles.positioning}>{s.positioningInsight}</Text>
          ) : null}

          {/* Market warning */}
          {s.marketPositionWarning ? (
            <View style={stratStyles.warningWrap}>
              <Text style={stratStyles.warningLabel}>Market Reality — How they&apos;re being seen right now</Text>
              <Text style={stratStyles.warningText}>{s.marketPositionWarning}</Text>
            </View>
          ) : null}

          {/* Hidden signal gap */}
          {s.hiddenSignalGap ? (
            <View style={stratStyles.gapWrap}>
              <Text style={stratStyles.gapLabel}>⚠ Hidden Signal Gap Detected</Text>
              <Text style={stratStyles.gapText}>{s.hiddenSignalGap}</Text>
            </View>
          ) : null}
        </View>

        {/* Why this strategy / Reasoning */}
        {reasoning.length > 0 ? (
          <View style={stratStyles.section}>
            <Text style={stratStyles.sectionTitle}>Why this strategy</Text>
            {reasoning.map((r, i) => (
              <View key={i} style={stratStyles.numRow}>
                <Text style={stratStyles.numDot}>{i + 1}.</Text>
                <Text style={stratStyles.numText}>{safe(r)}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Role Lanes */}
        {roleLanes.length > 0 ? (
          <View style={stratStyles.section}>
            <Text style={stratStyles.sectionTitle}>Target Role Lanes</Text>
            {roleLanes.map((r, i) => (
              <View key={i} style={stratStyles.bulletRow}>
                <Text style={stratStyles.bulletDot}>•</Text>
                <Text style={stratStyles.bulletText}>{safe(r)}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Target companies */}
        {companyList.length > 0 ? (
          <View style={stratStyles.section}>
            <Text style={stratStyles.sectionTitle}>Target Companies</Text>
            <View style={stratStyles.companyRow}>
              {companyList.map((c, i) => (
                <View key={i} style={stratStyles.companyPill}>
                  <Text style={stratStyles.companyText}>{c}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Strategic themes */}
        {themes.length > 0 ? (
          <View style={stratStyles.section}>
            <Text style={stratStyles.sectionTitle}>Sector Alignment</Text>
            {themes.map((t, i) => (
              <View key={i} style={stratStyles.bulletRow}>
                <Text style={stratStyles.bulletDot}>•</Text>
                <Text style={stratStyles.bulletText}>{safe(t)}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Safe harbor targets */}
        {safeHarbors.length > 0 ? (
          <View style={stratStyles.section}>
            <Text style={stratStyles.sectionTitle}>Safe Harbor Targets</Text>
            {safeHarbors.map((c, i) => (
              <View key={i} style={stratStyles.card}>
                <Text style={stratStyles.cardName}>{safe(c.name)}</Text>
                <Text style={stratStyles.cardReason}>{safe(c.reason)}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Stretch targets */}
        {stretches.length > 0 ? (
          <View style={stratStyles.section}>
            <Text style={stratStyles.sectionTitle}>Stretch Targets</Text>
            {stretches.map((c, i) => (
              <View key={i} style={stratStyles.cardStretch}>
                <Text style={stratStyles.cardName}>{safe(c.name)}</Text>
                <Text style={stratStyles.cardReason}>{safe(c.reason)}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Transferability signals */}
        {transferability.length > 0 ? (
          <View style={stratStyles.section}>
            <Text style={stratStyles.sectionTitle}>Transferability Signals</Text>
            {transferability.map((t, i) => (
              <View key={i} style={stratStyles.bulletRow}>
                <Text style={stratStyles.bulletDot}>•</Text>
                <Text style={stratStyles.bulletText}>{safe(t)}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Narrative gaps */}
        {narrativeGaps.length > 0 ? (
          <View style={stratStyles.section}>
            <Text style={stratStyles.sectionTitle}>Narrative Gaps to Address</Text>
            {narrativeGaps.map((g, i) => (
              <View key={i} style={stratStyles.bulletRow}>
                <Text style={stratStyles.bulletDot}>•</Text>
                <Text style={stratStyles.bulletText}>{safe(g)}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Session focus */}
        {s.sessionFocus ? (
          <View style={stratStyles.section}>
            <Text style={stratStyles.sectionTitle}>Session Focus</Text>
            <Text style={{ fontSize: 11, color: '#374151' }}>{s.sessionFocus}</Text>
          </View>
        ) : null}

        {/* Execution plan */}
        {executionPlan.length > 0 ? (
          <View style={stratStyles.section}>
            <Text style={stratStyles.sectionTitle}>Execution Plan</Text>
            {executionPlan.map((step, i) => (
              <View key={i} style={stratStyles.numRow}>
                <Text style={stratStyles.numDot}>{i + 1}.</Text>
                <Text style={stratStyles.numText}>{safe(step)}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Immediate next step */}
        {s.nextStep ? (
          <View style={stratStyles.section}>
            <Text style={stratStyles.sectionTitle}>Immediate Next Step</Text>
            <Text style={{ fontSize: 11, color: '#374151' }}>{s.nextStep}</Text>
          </View>
        ) : null}

        <Text style={stratStyles.footer}>Shared via ForgeTomorrow — View only</Text>
      </Page>
    </Document>
  );
}

async function renderStrategy(docId, userId) {
  const client = await prisma.coachingClient.findFirst({
    where: { id: String(docId), coachId: userId },
    select: {
      name: true,
      strategyJson: true,
      targetCompanies: true,
      strategyNextStep: true,
      strategyThemes: true,
      strategyRoleLanes: true,
    },
  });
  if (!client) throw new Error('Strategy not found');

  const strategy = safeJsonParse(client.strategyJson) || {};
  const clientName = safe(client.name, 'Client');

  const pdfBuffer = await pdf(
    <StrategyPDF
      clientName={clientName}
      s={strategy}
      targetCompanies={client.targetCompanies || ''}
    />
  ).toBuffer();

  return {
    pdfBuffer,
    fileName: `target_strategy_${clientName.replace(/[^a-z0-9]+/gi, '_')}.pdf`,
  };
}

async function renderInterviewPrep(docId, userId) {
  const prep = await prisma.seekerInterviewPrep.findFirst({
    where: {
      id: String(docId),
      application: { userId },
    },
    select: {
      result: true,
      application: {
        select: { title: true, company: true, job: { select: { title: true, company: true } } },
      },
    },
  });
  if (!prep) throw new Error('Interview prep not found');

  const result = safeJsonParse(prep.result) || {};
  const app = prep.application || {};
  const job = app.job || {};
  const role = safe(app.title || job.title, 'Role');
  const company = safe(app.company || job.company, '');

  const sections = [];
  if (result.overview || result.summary) sections.push({ heading: 'Overview', text: safe(result.overview || result.summary) });
  if (safeArr(result.likelyQuestions || result.questions).length) {
    sections.push({ heading: 'Likely Interview Questions', bullets: safeArr(result.likelyQuestions || result.questions).map(q => safe(q.question || q)) });
  }
  if (safeArr(result.storyFrameworks || result.stories).length) {
    sections.push({ heading: 'Story Frameworks', bullets: safeArr(result.storyFrameworks || result.stories).map(s => safe(s.situation || s.title || s)) });
  }
  if (result.keyProofPoints || result.proofPoints) {
    sections.push({ heading: 'Key Proof Points', bullets: safeArr(result.keyProofPoints || result.proofPoints).map(p => safe(p.point || p)) });
  }

  if (!sections.length) sections.push({ text: 'Interview prep guide on file.' });

  const pdfBuffer = await pdf(
    <GenericPDF
      title={`Interview Prep${company ? ` · ${company}` : ''}`}
      subtitle={role}
      sections={sections}
    />
  ).toBuffer();

  return { pdfBuffer, fileName: `interview_prep${company ? `_${company.replace(/[^a-z0-9]+/gi, '_')}` : ''}.pdf` };
}

async function renderProjectPromotion(docId, userId) {
  const record = await prisma.projectPromotionResult.findFirst({
    where: { id: String(docId), userId },
    select: { title: true, formInput: true, result: true, createdAt: true },
  });
  if (!record) throw new Error('Project promotion result not found');

  const plan = record.result?.plan || {};
  const moves = Array.isArray(plan.rankedMoves) ? plan.rankedMoves : [];
  const recommended = moves.find(m => Number(m.rank) === Number(plan.recommendedMove?.rank || 1)) || moves[0] || null;
  const form = record.formInput || {};

  const sections = [];

  if (plan.performanceRead) {
    sections.push({ heading: 'Performance Read — How Leadership Sees You', text: safe(plan.performanceRead) });
  }

  if (plan.promotionReadiness) {
    sections.push({ heading: 'Promotion Readiness', text: safe(plan.promotionReadiness) });
  }

  if (recommended) {
    sections.push({ heading: `Recommended Move — ${safe(recommended.title)}`, text: safe(recommended.rationale || recommended.description) });
    if (safeArr(recommended.successMetrics).length) {
      sections.push({ heading: 'Success Metrics', bullets: safeArr(recommended.successMetrics).map(m => safe(m)) });
    }
    if (safeArr(recommended.exampleProjects).length) {
      sections.push({ heading: 'Example Projects', bullets: safeArr(recommended.exampleProjects).map(p => safe(p)) });
    }
  }

  if (moves.length > 1) {
    sections.push({
      heading: 'All Ranked Moves',
      bullets: moves.map(m => `${m.rank}. ${safe(m.title)}`),
    });
  }

  if (plan.executionPlan) {
    const ep = plan.executionPlan;
    if (ep.firstStep) sections.push({ heading: 'First Step', text: safe(ep.firstStep) });
    if (ep.whoToAlign) sections.push({ heading: 'Who to Align', text: safe(ep.whoToAlign) });
    if (ep.howToPitch) sections.push({ heading: 'How to Pitch It', text: safe(ep.howToPitch) });
    if (ep.proofArtifact) sections.push({ heading: 'Proof Artifact', text: safe(ep.proofArtifact) });
  }

  if (plan.reviewNarrative) {
    sections.push({ heading: 'Performance Review Narrative', text: safe(plan.reviewNarrative) });
  }

  if (!sections.length) sections.push({ text: 'Project & Promotion Brief on file.' });

  const title = safe(record.title, 'Project & Promotion Brief');
  const subtitle = [safe(form.currentRole), safe(form.currentCompany)].filter(Boolean).join(' · ');

  const pdfBuffer = await pdf(
    <GenericPDF title={title} subtitle={subtitle || undefined} sections={sections} />
  ).toBuffer();

  return { pdfBuffer, fileName: `${title.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}.pdf` };
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });

    const userId = session.user.id;
    const { docType, docId } = req.body || {};

    if (!docType || !docId) return res.status(400).json({ error: 'docType and docId required' });

    let pdfBuffer, fileName;

    switch (docType) {
      case 'resume':        ({ pdfBuffer, fileName } = await renderResume(docId, userId)); break;
      case 'cover':         ({ pdfBuffer, fileName } = await renderCover(docId, userId)); break;
      case 'profile':       ({ pdfBuffer, fileName } = await renderProfile(userId)); break;
      case 'roadmap':       ({ pdfBuffer, fileName } = await renderRoadmap(docId, userId)); break;
      case 'negotiation':   ({ pdfBuffer, fileName } = await renderNegotiation(docId, userId)); break;
      case 'strategy':      ({ pdfBuffer, fileName } = await renderStrategy(docId, userId)); break;
      case 'interview':          ({ pdfBuffer, fileName } = await renderInterviewPrep(docId, userId)); break;
      case 'projectPromotion':   ({ pdfBuffer, fileName } = await renderProjectPromotion(docId, userId)); break;
      default:
        return res.status(400).json({ error: `Unsupported docType: ${docType}` });
    }

    const storagePath = `${userId}/vault/shared/${nanoid(12)}-${fileName}`;
    const savedPath = await uploadFile({ buffer: pdfBuffer, path: storagePath, contentType: 'application/pdf' });
    const downloadUrl = `/api/vault/file?path=${encodeURIComponent(savedPath)}`;

    // Create a VaultUpload record so the owner can access the file through /api/vault/file.
    // vault/file.js checks VaultShare OR VaultUpload — without this record it returns 403.
    try {
      await prisma.vaultUpload.create({
        data: {
          userId,
          storagePath: savedPath,
          fileName,
          fileType: 'application/pdf',
          fileSizeBytes: Buffer.isBuffer(pdfBuffer) ? pdfBuffer.length : Buffer.from(pdfBuffer).length,
          downloadUrl,
        },
      });
      console.log('[api/vault/render-pdf] VaultUpload created OK — storagePath:', savedPath);
    } catch (e) {
      console.error('[api/vault/render-pdf] VaultUpload FAILED:', e?.message);
      // Non-fatal — PDF is in storage, user can still access it this session
    }

    return res.status(200).json({ ok: true, downloadUrl, storagePath, fileName });
  } catch (err) {
    console.error('[api/vault/render-pdf]', err);
    return res.status(500).json({ error: err.message || 'Could not render PDF' });
  }
}