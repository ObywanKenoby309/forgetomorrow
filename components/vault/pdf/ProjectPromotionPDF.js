// components/vault/pdf/ProjectPromotionPDF.js
// React PDF component for Project & Promotion Intelligence export.
// Matches the @react-pdf/renderer pattern used in SignalDesignedPDF.js.

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const ORANGE  = '#FF7043';
const SLATE   = '#334155';
const MUTED   = '#64748B';
const DARK    = '#111827';
const RULE    = '#E5E7EB';
const BG_HIGH = '#FFF7F5';
const BG_WARN = '#FFF3E0';

const safe = (v) => (v == null ? '' : String(v).trim());
const arr  = (v) => (Array.isArray(v) ? v.filter(Boolean) : []);

const S = StyleSheet.create({
  page: { padding: '36 48', fontFamily: 'Helvetica', fontSize: 11, color: DARK, lineHeight: 1.5 },

  brand:    { fontSize: 8, fontWeight: 'bold', color: ORANGE, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 6 },
  docTitle: { fontSize: 20, fontWeight: 'bold', color: DARK, marginBottom: 3 },
  docMeta:  { fontSize: 9, color: MUTED, marginBottom: 2 },
  rule:     { height: 2.5, backgroundColor: ORANGE, borderRadius: 1, marginTop: 10, marginBottom: 16 },

  sectionLabel: {
    fontSize: 8, fontWeight: 'bold', letterSpacing: 1.2, textTransform: 'uppercase',
    color: ORANGE, marginBottom: 5, paddingBottom: 3,
    borderBottomWidth: 1.5, borderBottomColor: ORANGE, borderBottomStyle: 'solid',
  },
  section: { marginBottom: 18 },

  highlightBox: { backgroundColor: BG_HIGH, borderLeftWidth: 3, borderLeftColor: ORANGE, borderLeftStyle: 'solid', padding: '10 12', borderRadius: 3, marginBottom: 4 },
  highlightText: { fontSize: 11, fontWeight: 'bold', color: DARK, lineHeight: 1.5 },
  warnBox:  { backgroundColor: BG_WARN, borderLeftWidth: 3, borderLeftColor: '#F4511E', borderLeftStyle: 'solid', padding: '10 12', borderRadius: 3, marginBottom: 4 },
  warnText: { fontSize: 11, color: '#7A2A0E', lineHeight: 1.5 },

  listRow:  { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 5, gap: 7 },
  dot:      { width: 5, height: 5, borderRadius: 2.5, backgroundColor: ORANGE, marginTop: 4, flexShrink: 0 },
  listText: { fontSize: 10.5, color: SLATE, flex: 1, lineHeight: 1.5 },

  numRow:   { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 7, gap: 8 },
  numBadge: { fontSize: 9, fontWeight: 'bold', color: ORANGE, width: 16, flexShrink: 0, marginTop: 1 },
  numText:  { fontSize: 10.5, color: SLATE, flex: 1, lineHeight: 1.5 },

  footer:     { position: 'absolute', bottom: 28, left: 48, right: 48, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 8.5, color: MUTED },
});

function SectionLabel({ children }) {
  return <Text style={S.sectionLabel}>{children}</Text>;
}

function BulletList({ items = [] }) {
  if (!items.length) return null;
  return (
    <View>
      {items.map((item, i) => (
        <View key={i} style={S.listRow}>
          <View style={S.dot} />
          <Text style={S.listText}>{safe(typeof item === 'object' ? JSON.stringify(item) : item)}</Text>
        </View>
      ))}
    </View>
  );
}

function NumberedList({ items = [] }) {
  if (!items.length) return null;
  return (
    <View>
      {items.map((item, i) => (
        <View key={i} style={S.numRow}>
          <Text style={S.numBadge}>{i + 1}.</Text>
          <Text style={S.numText}>{safe(typeof item === 'object' ? JSON.stringify(item) : item)}</Text>
        </View>
      ))}
    </View>
  );
}

// Render any unknown field generically
function renderValue(val) {
  if (!val) return null;
  if (Array.isArray(val)) {
    return <BulletList items={val} />;
  }
  if (typeof val === 'object') {
    return (
      <View>
        {Object.entries(val).map(([k, v], i) => (
          <View key={i} style={S.listRow}>
            <View style={S.dot} />
            <Text style={S.listText}><Text style={{ fontWeight: 'bold' }}>{k}: </Text>{safe(String(v || ''))}</Text>
          </View>
        ))}
      </View>
    );
  }
  return <Text style={S.listText}>{safe(String(val))}</Text>;
}

// Fields to show prominently at top
const HIGHLIGHT_KEYS = new Set([
  'positioningInsight', 'positioning_insight', 'insight',
  'promotionCase', 'promotion_case',
  'executiveSummary', 'executive_summary', 'summary',
]);

// Fields to render as numbered lists
const NUMBERED_KEYS = new Set([
  'executionPlan', 'execution_plan', 'steps', 'actionPlan', 'action_plan', 'recommendations',
]);

// Fields to render as warning boxes
const WARN_KEYS = new Set([
  'risks', 'gaps', 'warnings', 'narrativeGaps', 'narrative_gaps', 'marketWarning', 'caution',
]);

function toLabel(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .trim()
    .replace(/^./, c => c.toUpperCase());
}

export default function ProjectPromotionPDF({ title, result, formInput, createdAt }) {
  const r = result || {};
  const dateStr = createdAt
    ? new Date(createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const role    = safe(formInput?.currentRole    || '');
  const company = safe(formInput?.currentCompany || '');
  const meta    = [role, company].filter(Boolean).join(' · ');

  const highlights = Object.entries(r)
    .filter(([k]) => HIGHLIGHT_KEYS.has(k))
    .map(([, v]) => safe(String(v || '')))
    .filter(Boolean);

  const otherEntries = Object.entries(r).filter(([k]) => !HIGHLIGHT_KEYS.has(k));

  return (
    <Document title={title} author="ForgeTomorrow">
      <Page size="LETTER" style={S.page}>

        {/* Header */}
        <Text style={S.brand}>ForgeTomorrow · The Anvil · Project & Promotion Intelligence</Text>
        <Text style={S.docTitle}>{safe(title)}</Text>
        {meta ? <Text style={S.docMeta}>{meta}  ·  Generated: {dateStr}</Text> : <Text style={S.docMeta}>Generated: {dateStr}</Text>}
        <View style={S.rule} />

        {/* Highlights */}
        {highlights.length ? (
          <View style={S.section}>
            <SectionLabel>Key Insight</SectionLabel>
            {highlights.map((h, i) => (
              <View key={i} style={S.highlightBox}>
                <Text style={S.highlightText}>{h}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* All other fields */}
        {otherEntries.map(([key, val], i) => {
          if (!val || (Array.isArray(val) && !val.length)) return null;
          const label = toLabel(key);
          const isWarn    = WARN_KEYS.has(key);
          const isNumered = NUMBERED_KEYS.has(key);

          return (
            <View key={i} style={S.section}>
              <SectionLabel>{label}</SectionLabel>
              {isWarn && typeof val === 'string' ? (
                <View style={S.warnBox}><Text style={S.warnText}>{safe(val)}</Text></View>
              ) : isNumered && Array.isArray(val) ? (
                <NumberedList items={val} />
              ) : (
                renderValue(val)
              )}
            </View>
          );
        })}

        {/* Footer */}
        <View style={S.footer} fixed>
          <Text style={S.footerText}>ForgeTomorrow · The Anvil · Confidential</Text>
          <Text style={S.footerText}>forgetomorrow.com</Text>
        </View>

      </Page>
    </Document>
  );
}