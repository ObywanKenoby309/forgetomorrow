// components/resume-form/templates/SignalDesignedPDF.js
// PDF version of SignalResumeTestTemplate — mirrors the two-page ForgeFormat layout.
// Page 1: Signal Page (header, impact snapshot, core capabilities, employer spine)
// Page 2+: Story Pages (full experience, education, projects, additional)
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const ORANGE = '#FF7043';
const SLATE = '#334155';
const MUTED = '#64748B';
const DARK = '#111827';
const RULE = '#E5E7EB';
const RULE_LIGHT = '#F1F5F9';

// ─── Helpers ────────────────────────────────────────────────────────────────

const safe = (v) => (v == null ? '' : String(v).trim());
const normalizeArray = (v) => (Array.isArray(v) ? v : []);

function getName(data) {
  return safe(data?.personalInfo?.name || data?.personalInfo?.fullName || 'Your Name');
}

function getContactLine(data) {
  const info = data?.personalInfo || {};
  return [info.email, info.phone, info.location, info.externalurl, info.github, info.portfolio, info.ftProfile]
    .filter(Boolean).join('  ·  ');
}

function getPositioningLine(data) {
  const info = data?.personalInfo || {};
  const summary = safe(data?.summary);
  const firstSentence = summary.split('.')[0].trim();
  if (info.targetedRole && firstSentence) return `${info.targetedRole} — ${firstSentence}.`;
  if (info.targetedRole) return info.targetedRole;
  if (firstSentence) return `${firstSentence}.`;
  return '';
}

function collectImpactSnapshot(data) {
  const achievements = normalizeArray(data?.achievements).filter(Boolean);
  if (achievements.length) return achievements.slice(0, 5);
  const work = normalizeArray(data?.workExperiences);
  const bullets = [];
  for (const role of work) {
    const rb = normalizeArray(role?.bullets || role?.highlights);
    for (const b of rb) {
      if (b && /%|\$|million|k|reduced|increased|scaled|launched|built/i.test(b)) bullets.push(b);
    }
  }
  return bullets.slice(0, 5);
}

function buildEmployerSpine(data) {
  return normalizeArray(data?.workExperiences).map((role) => ({
    company: safe(role?.company),
    title: safe(role?.title || role?.role),
    range: safe(role?.dateRange || role?.range ||
      [role?.startDate || role?.start, role?.endDate || role?.end].filter(Boolean).join(' – ')),
  }));
}

function groupSkills(skills) {
  const all = normalizeArray(skills).filter(Boolean);
  const buckets = {
    'Systems & Operations': [],
    'Leadership & Delivery': [],
    'Tools & Platforms': [],
    'Domain & Functional': [],
  };
  const toolHints = ['salesforce','jira','servicenow','excel','sql','tableau','power bi','zendesk','hubspot','figma','notion','asana','trello','slack','google analytics','workday','sap','oracle','microsoft'];
  const leadershipHints = ['leadership','coaching','training','mentoring','management','cross-functional','stakeholder','program','delivery','team'];
  const systemsHints = ['operations','process','workflow','onboarding','support ops','continuous improvement','quality','compliance','optimization','system','implementation','scaling','efficiency'];
  all.forEach((skill) => {
    const s = String(skill).toLowerCase();
    if (toolHints.some((h) => s.includes(h))) buckets['Tools & Platforms'].push(skill);
    else if (leadershipHints.some((h) => s.includes(h))) buckets['Leadership & Delivery'].push(skill);
    else if (systemsHints.some((h) => s.includes(h))) buckets['Systems & Operations'].push(skill);
    else buckets['Domain & Functional'].push(skill);
  });
  Object.keys(buckets).forEach((k) => { buckets[k] = buckets[k].slice(0, 6); });
  return buckets;
}

function normalizeBullets(role) {
  const bullets = normalizeArray(role?.bullets || role?.highlights).map(safe).filter(Boolean);
  const desc = safe(role?.description);
  const descBullets = desc ? desc.split('\n').map((l) => l.trim()).filter(Boolean) : [];
  return [...descBullets, ...bullets];
}

function normalizeCerts(certs) {
  return normalizeArray(certs).map((c) => {
    if (!c) return '';
    if (typeof c === 'string') return c.trim();
    const name = safe(c.name || c.title);
    const issuer = safe(c.issuer || c.org);
    return [name, issuer].filter(Boolean).join(' — ');
  }).filter(Boolean);
}

function normalizeLanguages(langs) {
  return normalizeArray(langs).map((l) => {
    if (!l) return '';
    if (typeof l === 'string') return l.trim();
    return [safe(l.language || l.name), safe(l.proficiency || l.level)].filter(Boolean).join(' — ');
  }).filter(Boolean);
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  page: { padding: '40 48', fontFamily: 'Helvetica', fontSize: 11, color: DARK, lineHeight: 1.45 },

  // Header
  name: { fontSize: 26, fontWeight: 'bold', color: DARK, letterSpacing: -0.5, marginBottom: 3 },
  positioning: { fontSize: 11, fontWeight: 'bold', color: SLATE, marginBottom: 4 },
  contact: { fontSize: 9.5, color: MUTED, marginBottom: 0 },
  orangeRule: { height: 2.5, backgroundColor: ORANGE, borderRadius: 1, marginTop: 10, marginBottom: 18 },

  // Section labels
  sectionLabel: { fontSize: 8.5, fontWeight: 'bold', letterSpacing: 1.2, textTransform: 'uppercase', color: ORANGE, marginBottom: 6, paddingBottom: 4, borderBottomWidth: 1.5, borderBottomColor: ORANGE, borderBottomStyle: 'solid' },

  // Impact Snapshot
  impactRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 5, gap: 8 },
  impactDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: ORANGE, marginTop: 3.5, flexShrink: 0 },
  impactText: { fontSize: 11, color: '#1E293B', flex: 1, lineHeight: 1.45 },

  // Skills grid
  skillsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  skillBucket: { width: '47%' },
  skillBucketLabel: { fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.8, color: SLATE, marginBottom: 2 },
  skillBucketItems: { fontSize: 10.5, color: '#374151', lineHeight: 1.5 },

  // Employer spine table
  spineHeader: { flexDirection: 'row', paddingBottom: 4, marginBottom: 5, borderBottomWidth: 1, borderBottomColor: RULE, borderBottomStyle: 'solid' },
  spineHeaderCell: { fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, color: MUTED },
  spineRow: { flexDirection: 'row', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: RULE, borderBottomStyle: 'solid', alignItems: 'baseline' },
  spineCompany: { fontSize: 11, fontWeight: 'bold', color: DARK },
  spineTitle: { fontSize: 11, color: SLATE },
  spineRange: { fontSize: 10, color: MUTED },

  // Divider / page break
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#D1D5DB' },
  dividerText: { fontSize: 8, fontWeight: 'bold', letterSpacing: 1.2, textTransform: 'uppercase', color: '#9CA3AF' },

  // Experience
  roleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 },
  roleTitle: { fontSize: 12.5, fontWeight: 'bold', color: DARK, lineHeight: 1.2 },
  roleCompany: { fontSize: 10.5, fontWeight: 'bold', color: SLATE, marginTop: 1 },
  roleRange: { fontSize: 10, color: MUTED, paddingTop: 1 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4, gap: 7 },
  bulletDot: { width: 3.5, height: 3.5, borderRadius: 2, backgroundColor: '#9CA3AF', marginTop: 4.5, flexShrink: 0 },
  bulletText: { fontSize: 10.5, color: '#374151', flex: 1, lineHeight: 1.45 },
  roleDivider: { height: 1, backgroundColor: RULE_LIGHT, marginTop: 14, marginBottom: 2 },

  // Education
  eduHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  eduDegree: { fontSize: 11.5, fontWeight: 'bold', color: DARK },
  eduSchool: { fontSize: 10.5, color: SLATE, marginTop: 1 },
  eduRange: { fontSize: 10, color: MUTED },

  // Additional
  additionalLabel: { fontSize: 8.5, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.8, color: SLATE, marginBottom: 3, marginTop: 8 },
  additionalText: { fontSize: 10.5, color: '#374151', lineHeight: 1.5 },

  mb4: { marginBottom: 4 },
  mb8: { marginBottom: 8 },
  mb16: { marginBottom: 16 },
  mb20: { marginBottom: 20 },
});

// ─── Main Component ──────────────────────────────────────────────────────────

export default function SignalDesignedPDF({ data }) {
  const name = getName(data);
  const contactLine = getContactLine(data);
  const positioningLine = getPositioningLine(data);
  const impactSnapshot = collectImpactSnapshot(data);
  const employerSpine = buildEmployerSpine(data);
  const skillBuckets = groupSkills(data?.skills);
  const hasSkills = Object.values(skillBuckets).some((arr) => arr.length > 0);
  const singleRole = employerSpine.length <= 1;

  const work = normalizeArray(data?.workExperiences);
  const education = normalizeArray(data?.educationList);
  const projects = normalizeArray(data?.projects);
  const certifications = normalizeCerts(data?.certifications);
  const languages = normalizeLanguages(data?.languages);
  const customSections = normalizeArray(data?.customSections);
  const hasAdditional = certifications.length > 0 || languages.length > 0 || customSections.length > 0;

  return (
    <Document>
      {/* ══════════════════════════════════════
          PAGE 1 — SIGNAL PAGE
      ══════════════════════════════════════ */}
      <Page size="LETTER" style={S.page}>

        {/* Header */}
        <View style={S.mb16}>
          <Text style={S.name}>{name}</Text>
          {positioningLine ? <Text style={S.positioning}>{positioningLine}</Text> : null}
          {contactLine ? <Text style={S.contact}>{contactLine}</Text> : null}
          <View style={S.orangeRule} />
        </View>

        {/* Impact Snapshot */}
        <View style={S.mb20}>
          <Text style={S.sectionLabel}>Impact Snapshot</Text>
          {impactSnapshot.length > 0 ? impactSnapshot.map((item, i) => (
            <View key={i} style={S.impactRow}>
              <View style={S.impactDot} />
              <Text style={S.impactText}>{safe(item)}</Text>
            </View>
          )) : (
            <Text style={{ fontSize: 10.5, color: MUTED, fontStyle: 'italic' }}>
              Add 3–5 strongest wins to populate your signal layer.
            </Text>
          )}
        </View>

        {/* Core Capabilities */}
        {hasSkills && (
          <View style={S.mb20}>
            <Text style={S.sectionLabel}>Core Capabilities</Text>
            <View style={S.skillsGrid}>
              {Object.entries(skillBuckets).map(([label, items]) =>
                items.length > 0 ? (
                  <View key={label} style={S.skillBucket}>
                    <Text style={S.skillBucketLabel}>{label}</Text>
                    <Text style={S.skillBucketItems}>{items.join('  ·  ')}</Text>
                  </View>
                ) : null
              )}
            </View>
          </View>
        )}

        {/* Employer Spine */}
        <View style={S.mb8}>
          <Text style={S.sectionLabel}>{singleRole ? 'Current Role' : 'Career at a Glance'}</Text>
          {singleRole ? (
            employerSpine[0] ? (
              <View style={{ flexDirection: 'row', gap: 14, alignItems: 'baseline' }}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: DARK }}>{employerSpine[0].company || 'Company'}</Text>
                <Text style={{ fontSize: 11, fontWeight: 'bold', color: SLATE }}>{employerSpine[0].title || 'Role'}</Text>
                {employerSpine[0].range ? <Text style={{ fontSize: 10, color: MUTED }}>{employerSpine[0].range}</Text> : null}
              </View>
            ) : null
          ) : (
            <View>
              <View style={S.spineHeader}>
                {[['1.4fr', 'Company'], ['1fr', 'Title'], ['auto', 'Dates']].map(([, h]) => (
                  <Text key={h} style={[S.spineHeaderCell, { flex: h === 'auto' ? 0 : h === '1.4fr' ? 1.4 : 1 }]}>{h}</Text>
                ))}
              </View>
              {employerSpine.map((item, i) => (
                <View key={i} style={[S.spineRow, { opacity: i > 3 ? 0.55 : 1 }]}>
                  <Text style={[S.spineCompany, { flex: 1.4 }]}>{item.company || 'Company'}</Text>
                  <Text style={[S.spineTitle, { flex: 1, fontWeight: i === 0 ? 'bold' : 'normal' }]}>{item.title || 'Role'}</Text>
                  <Text style={S.spineRange}>{item.range || ''}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

      </Page>

      {/* ══════════════════════════════════════
          PAGE 2+ — STORY PAGES
      ══════════════════════════════════════ */}
      <Page size="LETTER" style={S.page}>

        {/* Full Career History divider */}
        <View style={S.dividerRow}>
          <View style={S.dividerLine} />
          <Text style={S.dividerText}>Full Career History</Text>
          <View style={S.dividerLine} />
        </View>

        {/* Professional Experience */}
        {work.length > 0 && (
          <View style={S.mb20}>
            <Text style={S.sectionLabel}>Professional Experience</Text>
            {work.map((role, i) => {
              const bullets = normalizeBullets(role);
              const range = safe(role?.dateRange || role?.range ||
                [role?.startDate || role?.start, role?.endDate || role?.end].filter(Boolean).join(' – '));
              return (
                <View key={i}>
                  <View style={S.roleHeader}>
                    <View>
                      <Text style={S.roleTitle}>{safe(role?.title || role?.role || 'Role')}</Text>
                      <Text style={S.roleCompany}>
                        {safe(role?.company || 'Company')}{role?.location ? `  ·  ${safe(role.location)}` : ''}
                      </Text>
                    </View>
                    {range ? <Text style={S.roleRange}>{range}</Text> : null}
                  </View>
                  {bullets.map((b, j) => (
                    <View key={j} style={S.bulletRow}>
                      <View style={S.bulletDot} />
                      <Text style={S.bulletText}>{b}</Text>
                    </View>
                  ))}
                  {i < work.length - 1 && <View style={S.roleDivider} />}
                </View>
              );
            })}
          </View>
        )}

        {/* Education */}
        {education.length > 0 && (
          <View style={S.mb20}>
            <Text style={S.sectionLabel}>Education</Text>
            {education.map((item, i) => {
              const range = [item?.startDate, item?.endDate].filter(Boolean).join(' – ');
              return (
                <View key={i} style={S.eduHeader}>
                  <View>
                    <Text style={S.eduDegree}>
                      {safe(item?.degree || item?.program || 'Degree')}{item?.field ? `, ${safe(item.field)}` : ''}
                    </Text>
                    <Text style={S.eduSchool}>{safe(item?.school || item?.institution || 'School')}</Text>
                  </View>
                  {range ? <Text style={S.eduRange}>{range}</Text> : null}
                </View>
              );
            })}
          </View>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <View style={S.mb20}>
            <Text style={S.sectionLabel}>Projects</Text>
            {projects.map((project, i) => {
              const bullets = normalizeBullets(project);
              return (
                <View key={i} style={S.mb8}>
                  <Text style={{ fontSize: 12, fontWeight: 'bold', color: DARK, marginBottom: 2 }}>
                    {safe(project?.title || project?.name || 'Project')}
                  </Text>
                  {project?.company ? <Text style={{ fontSize: 10.5, color: SLATE, marginBottom: 3 }}>{safe(project.company)}</Text> : null}
                  {bullets.map((b, j) => (
                    <View key={j} style={S.bulletRow}>
                      <View style={S.bulletDot} />
                      <Text style={S.bulletText}>{b}</Text>
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        )}

        {/* Additional */}
        {hasAdditional && (
          <View>
            <Text style={S.sectionLabel}>Additional</Text>
            {certifications.length > 0 && (
              <View style={S.mb8}>
                <Text style={S.additionalLabel}>Certifications</Text>
                <Text style={S.additionalText}>{certifications.join('  ·  ')}</Text>
              </View>
            )}
            {languages.length > 0 && (
              <View style={S.mb8}>
                <Text style={S.additionalLabel}>Languages</Text>
                <Text style={S.additionalText}>{languages.join('  ·  ')}</Text>
              </View>
            )}
            {customSections.length > 0 && (
              <View>
                <Text style={S.additionalLabel}>Other</Text>
                {customSections.map((section, i) => (
                  <Text key={i} style={S.additionalText}>
                    {safe(section?.title || section?.name || 'Custom Section')}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}

      </Page>
    </Document>
  );
}