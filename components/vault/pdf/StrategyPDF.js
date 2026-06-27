// components/vault/pdf/StrategyPDF.js
// React PDF component for Coaching Target Strategy export.
// Matches the @react-pdf/renderer pattern used in SignalDesignedPDF.js.

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const ORANGE  = '#FF7043';
const SLATE   = '#334155';
const MUTED   = '#64748B';
const DARK    = '#111827';
const RULE    = '#E5E7EB';
const BG_WARN = '#FFF3E0';
const BG_HIGH = '#FFF7F5';

const safe = (v) => (v == null ? '' : String(v).trim());
const arr  = (v) => (Array.isArray(v) ? v.filter(Boolean) : []);

const S = StyleSheet.create({
  page: { padding: '36 48', fontFamily: 'Helvetica', fontSize: 11, color: DARK, lineHeight: 1.5 },

  // Header
  brand:    { fontSize: 8, fontWeight: 'bold', color: ORANGE, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 6 },
  docTitle: { fontSize: 20, fontWeight: 'bold', color: DARK, marginBottom: 3 },
  docMeta:  { fontSize: 9, color: MUTED, marginBottom: 2 },
  rule:     { height: 2.5, backgroundColor: ORANGE, borderRadius: 1, marginTop: 10, marginBottom: 16 },

  // Section
  sectionLabel: {
    fontSize: 8, fontWeight: 'bold', letterSpacing: 1.2, textTransform: 'uppercase',
    color: ORANGE, marginBottom: 5, paddingBottom: 3,
    borderBottomWidth: 1.5, borderBottomColor: ORANGE, borderBottomStyle: 'solid',
  },
  section: { marginBottom: 28 },

  // Highlight / warning boxes
  highlightBox: { backgroundColor: BG_HIGH, borderLeftWidth: 3, borderLeftColor: ORANGE, borderLeftStyle: 'solid', padding: '10 12', borderRadius: 3, marginBottom: 4 },
  highlightText: { fontSize: 11, fontWeight: 'bold', color: DARK, lineHeight: 1.5 },
  warnBox:  { backgroundColor: BG_WARN, borderLeftWidth: 3, borderLeftColor: '#F4511E', borderLeftStyle: 'solid', padding: '10 12', borderRadius: 3, marginBottom: 4 },
  warnText: { fontSize: 11, color: '#7A2A0E', lineHeight: 1.5 },

  // List items
  listRow:  { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 5, gap: 7 },
  dot:      { width: 5, height: 5, borderRadius: 2.5, backgroundColor: ORANGE, marginTop: 4, flexShrink: 0 },
  listText: { fontSize: 10.5, color: SLATE, flex: 1, lineHeight: 1.5 },

  // Numbered list
  numRow:   { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 7, gap: 8 },
  numBadge: { fontSize: 9, fontWeight: 'bold', color: ORANGE, width: 16, flexShrink: 0, marginTop: 1 },
  numText:  { fontSize: 10.5, color: SLATE, flex: 1, lineHeight: 1.5 },

  // Target items
  targetItem:    { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: RULE, borderBottomStyle: 'solid' },
  targetName:    { fontSize: 11, fontWeight: 'bold', color: DARK, marginBottom: 2 },
  targetReason:  { fontSize: 10, color: MUTED, lineHeight: 1.4 },

  // Two-col grid
  twoCol:   { flexDirection: 'row', gap: 20 },
  col:      { flex: 1 },

  // Footer
  footer:   { position: 'absolute', bottom: 28, left: 48, right: 48, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 8.5, color: MUTED },

  mb4:  { marginBottom: 4  },
  mb8:  { marginBottom: 8  },
  mb12: { marginBottom: 12 },
  mb16: { marginBottom: 16 },
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
          <Text style={S.listText}>{safe(item)}</Text>
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
          <Text style={S.numText}>{safe(item)}</Text>
        </View>
      ))}
    </View>
  );
}

function TargetList({ items = [] }) {
  if (!items.length) return null;
  return (
    <View>
      {items.map((t, i) => (
        <View key={i} style={S.targetItem}>
          <Text style={S.targetName}>{safe(t.name || t.title || '')}</Text>
          {t.reason ? <Text style={S.targetReason}>{safe(t.reason)}</Text> : null}
        </View>
      ))}
    </View>
  );
}

export default function StrategyPDF({ clientName, title, strategy, targetCompanies, generatedAt }) {
  const s = strategy || {};

  const dateStr = generatedAt
    ? new Date(generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <Document title={title} author="ForgeTomorrow">
      <Page size="LETTER" style={S.page}>

        {/* Header */}
        <Text style={S.brand}>ForgeTomorrow Coaching Intelligence</Text>
        <Text style={S.docTitle}>{safe(title)}</Text>
        <Text style={S.docMeta}>Generated: {dateStr}</Text>
        {targetCompanies ? <Text style={S.docMeta}>Targets: {safe(targetCompanies)}</Text> : null}
        <View style={S.rule} />

        {/* Positioning Insight */}
        {s.positioningInsight ? (
          <View style={S.section}>
            <SectionLabel>Positioning Insight</SectionLabel>
            <View style={S.highlightBox}>
              <Text style={S.highlightText}>{safe(s.positioningInsight)}</Text>
            </View>
          </View>
        ) : null}

        {/* Market Position Warning */}
        {s.marketPositionWarning ? (
          <View style={S.section}>
            <SectionLabel>Market Position Warning</SectionLabel>
            <View style={S.warnBox}>
              <Text style={S.warnText}>{safe(s.marketPositionWarning)}</Text>
            </View>
          </View>
        ) : null}

        {/* Hidden Signal Gap */}
        {s.hiddenSignalGap ? (
          <View style={S.section}>
            <SectionLabel>Hidden Signal Gap</SectionLabel>
            <View style={S.warnBox}>
              <Text style={S.warnText}>{safe(s.hiddenSignalGap)}</Text>
            </View>
          </View>
        ) : null}

        {/* Themes */}
        {arr(s.themes).length ? (
          <View style={S.section}>
            <SectionLabel>Themes</SectionLabel>
            <BulletList items={arr(s.themes)} />
          </View>
        ) : null}

        {/* Role Lanes */}
        {arr(s.roleLanes).length ? (
          <View style={S.section}>
            <SectionLabel>Role Lanes</SectionLabel>
            <BulletList items={arr(s.roleLanes)} />
          </View>
        ) : null}

        {/* Transferability Signals */}
        {arr(s.transferabilitySignals).length ? (
          <View style={S.section}>
            <SectionLabel>Transferability Signals</SectionLabel>
            <BulletList items={arr(s.transferabilitySignals)} />
          </View>
        ) : null}

        {/* Narrative Gaps */}
        {arr(s.narrativeGaps).length ? (
          <View style={S.section}>
            <SectionLabel>Narrative Gaps</SectionLabel>
            <BulletList items={arr(s.narrativeGaps)} />
          </View>
        ) : null}

        {/* Targets — two col */}
        {(arr(s.safeHarborTargets).length || arr(s.stretchTargets).length) ? (
          <View style={[S.section, S.twoCol]}>
            {arr(s.safeHarborTargets).length ? (
              <View style={S.col}>
                <SectionLabel>Safe Harbor Targets</SectionLabel>
                <TargetList items={arr(s.safeHarborTargets)} />
              </View>
            ) : null}
            {arr(s.stretchTargets).length ? (
              <View style={S.col}>
                <SectionLabel>Stretch Targets</SectionLabel>
                <TargetList items={arr(s.stretchTargets)} />
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Execution Plan */}
        {arr(s.executionPlan).length ? (
          <View style={S.section}>
            <SectionLabel>Execution Plan</SectionLabel>
            <NumberedList items={arr(s.executionPlan)} />
          </View>
        ) : null}

        {/* Next Step */}
        {s.nextStep ? (
          <View style={S.section}>
            <SectionLabel>Priority Next Step</SectionLabel>
            <View style={S.highlightBox}>
              <Text style={S.highlightText}>{safe(s.nextStep)}</Text>
            </View>
          </View>
        ) : null}

        {/* Session Focus */}
        {s.sessionFocus ? (
          <View style={[S.section, { breakBefore: 'page' }]}>
            <SectionLabel>Next Session Focus</SectionLabel>
            <Text style={S.listText}>{safe(s.sessionFocus)}</Text>
          </View>
        ) : null}

        {/* Reasoning */}
        {arr(s.reasoning).length ? (
          <View style={[S.section, { breakBefore: s.sessionFocus ? 'avoid' : 'page' }]}>
            <SectionLabel>Strategy Reasoning</SectionLabel>
            <BulletList items={arr(s.reasoning)} />
          </View>
        ) : null}

        {/* Footer */}
        <View style={S.footer} fixed>
          <Text style={S.footerText}>ForgeTomorrow Coaching Intelligence · Confidential</Text>
          <Text style={S.footerText}>forgetomorrow.com</Text>
        </View>

      </Page>
    </Document>
  );
}