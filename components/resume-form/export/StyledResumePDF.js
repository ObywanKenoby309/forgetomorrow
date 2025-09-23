// components/resume-form/export/StyledResumePDF.js
import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Neutral, ATS-safe styling (usable by both layouts)
const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 44,
    fontSize: 10,
    fontFamily: 'Helvetica',
    lineHeight: 1.35,
    color: '#222',
  },

  // Header
  headerBlock: { marginBottom: 16 },
  name: { fontSize: 18, fontWeight: 'bold' },
  title: { fontSize: 11, fontWeight: 'bold', marginTop: 2 },
  contact: { fontSize: 9, color: '#444', marginTop: 6 },

  // Sectioning
  rule: { height: 1, backgroundColor: '#DADADA', marginVertical: 10 },
  section: { marginTop: 8, marginBottom: 8 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', marginBottom: 6, color: '#333' },

  // Content
  headline: {},
  headlineTitle: { fontWeight: 'normal' },
  headlineCompany: { fontWeight: 'bold' },
  meta: { fontSize: 9, color: '#555', marginTop: 1, marginBottom: 2 },
  itemBlock: { marginBottom: 8 },
  line: { marginBottom: 3 },
  bullet: { marginLeft: 10, marginBottom: 2 },

  // Hybrid layout columns
  row: { flexDirection: 'row', gap: 14 },
  colLeft: { width: '40%' },
  colRight: { width: '60%' },
});

const safe = (v) => (v == null ? '' : String(v).trim());
const nonEmpty = (v) => safe(v).length > 0;
const joinBar = (...vals) => vals.map(safe).filter(Boolean).join(' · ');
const joinDash = (a, b) => {
  const start = safe(a);
  const end = safe(b);
  if (!start && !end) return '';
  if (start && end) return `${start} – ${end}`;
  return start || end;
};
const splitLines = (txt) =>
  safe(txt)
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
const hasAnyFields = (obj, fields) => fields.some((f) => nonEmpty(obj?.[f]));
const stackWithRules = (nodes, keyPrefix = 's') =>
  nodes.reduce((acc, node, idx) => {
    if (idx > 0) acc.push(<View key={`${keyPrefix}-rule-${idx}`} style={styles.rule} />);
    acc.push(node);
    return acc;
  }, []);

/**
 * StyledResumePDF
 * Renders Reverse (single column) or Hybrid (two columns) depending on templateId.
 */
export default function StyledResumePDF({
  templateId = 'reverse', // 'reverse' | 'hybrid'
  formData = {},
  summary = '',
  experiences = [],
  projects = [],
  volunteerExperiences = [],
  educationList = [],
  certifications = [],
  languages = [],
  skills = [],
  achievements = [],
  customSections = [],
}) {
  // Filter/normalize data
  const filledExperiences = Array.isArray(experiences)
    ? experiences.filter((exp) =>
        hasAnyFields(exp, ['jobTitle', 'company', 'location', 'startDate', 'endDate', 'description'])
      )
    : [];

  const filledProjects = Array.isArray(projects)
    ? projects.filter((p) => hasAnyFields(p, ['title', 'description']))
    : [];

  const filledVol = Array.isArray(volunteerExperiences)
    ? volunteerExperiences.filter((v) =>
        hasAnyFields(v, ['role', 'organization', 'startDate', 'endDate', 'description'])
      )
    : [];

  const filledEdu = Array.isArray(educationList)
    ? educationList.filter((e) => hasAnyFields(e, ['degree', 'school', 'startDate', 'endDate', 'description']))
    : [];

  const filledCerts = Array.isArray(certifications)
    ? certifications.filter((c) => hasAnyFields(c, ['name', 'issuer', 'dateEarned', 'expirationDate']))
    : [];

  const filledLangs = Array.isArray(languages)
    ? languages.filter((l) => hasAnyFields(l, ['language', 'proficiency', 'years']))
    : [];

  const filledSkills = Array.isArray(skills) ? skills.map(safe).filter(Boolean) : [];

  const filledAch = Array.isArray(achievements)
    ? achievements.filter((a) => hasAnyFields(a, ['title', 'description']))
    : [];

  const filledCustom = Array.isArray(customSections)
    ? customSections.filter((s) => hasAnyFields(s, ['title', 'content']))
    : [];

  const contactLine = joinBar(
    safe(formData.location),
    safe(formData.email),
    safe(formData.phone),
    safe(formData.portfolio)
  );

  // -------- Section builders (return <View/> blocks) --------
  const Section_Summary =
    nonEmpty(summary) && (
      <View key="summary" style={styles.section}>
        <Text style={styles.sectionTitle}>Professional Summary</Text>
        {splitLines(summary).map((l, i) => (
          <Text key={i} style={styles.line}>
            {l}
          </Text>
        ))}
      </View>
    );

  const Section_Experience =
    filledExperiences.length > 0 && (
      <View key="experience" style={styles.section}>
        <Text style={styles.sectionTitle}>Work Experience</Text>
        {filledExperiences.map((exp, i) => {
          const title = safe(exp?.jobTitle);
          const company = safe(exp?.company);
          const dateRange = joinDash(exp?.startDate, exp?.endDate);
          const metaPieces = [safe(exp?.location), dateRange].filter(Boolean);
          const bullets = splitLines(exp?.description);

          return (
            <View key={i} style={styles.itemBlock}>
              {(title || company) ? (
                <Text style={styles.headline}>
                  {title ? <Text style={styles.headlineTitle}>{title}</Text> : null}
                  {company ? <Text style={styles.headlineCompany}>{title ? `, ${company}` : company}</Text> : null}
                </Text>
              ) : null}
              {metaPieces.length > 0 ? <Text style={styles.meta}>{metaPieces.join(' • ')}</Text> : null}
              {bullets.map((b, idx) => (
                <Text key={idx} style={styles.bullet}>
                  • {b}
                </Text>
              ))}
            </View>
          );
        })}
      </View>
    );

  const Section_Projects =
    filledProjects.length > 0 && (
      <View key="projects" style={styles.section}>
        <Text style={styles.sectionTitle}>Projects</Text>
        {filledProjects.map((p, i) => (
          <View key={i} style={styles.itemBlock}>
            {nonEmpty(p?.title) ? <Text style={styles.headlineCompany}>{safe(p?.title)}</Text> : null}
            {nonEmpty(p?.description) ? <Text style={styles.line}>{safe(p?.description)}</Text> : null}
          </View>
        ))}
      </View>
    );

  const Section_Volunteer =
    filledVol.length > 0 && (
      <View key="volunteer" style={styles.section}>
        <Text style={styles.sectionTitle}>Volunteer Experience</Text>
        {filledVol.map((v, i) => {
          const role = safe(v?.role);
          const org = safe(v?.organization);
          const dateRange = joinDash(v?.startDate, v?.endDate);
          return (
            <View key={i} style={styles.itemBlock}>
              {(role || org) ? (
                <Text style={styles.headline}>
                  {role ? <Text style={styles.headlineTitle}>{role}</Text> : null}
                  {org ? <Text style={styles.headlineCompany}>{role ? `, ${org}` : org}</Text> : null}
                </Text>
              ) : null}
              {nonEmpty(dateRange) ? <Text style={styles.meta}>{dateRange}</Text> : null}
              {nonEmpty(v?.description) ? <Text style={styles.line}>{safe(v?.description)}</Text> : null}
            </View>
          );
        })}
      </View>
    );

  const Section_Education =
    filledEdu.length > 0 && (
      <View key="education" style={styles.section}>
        <Text style={styles.sectionTitle}>Education</Text>
        {filledEdu.map((e, i) => {
          const degree = safe(e?.degree);
          const school = safe(e?.school);
          const dateRange = joinDash(e?.startDate, e?.endDate);
          return (
            <View key={i} style={styles.itemBlock}>
              {(degree || school) ? (
                <Text style={styles.headline}>
                  {degree ? <Text style={styles.headlineTitle}>{degree}</Text> : null}
                  {school ? <Text style={styles.headlineCompany}>{degree ? `, ${school}` : school}</Text> : null}
                </Text>
              ) : null}
              {nonEmpty(dateRange) ? <Text style={styles.meta}>{dateRange}</Text> : null}
              {nonEmpty(e?.description) ? <Text style={styles.line}>{safe(e?.description)}</Text> : null}
            </View>
          );
        })}
      </View>
    );

  const Section_Certs =
    filledCerts.length > 0 && (
      <View key="certs" style={styles.section}>
        <Text style={styles.sectionTitle}>Certifications & Training</Text>
        {filledCerts.map((c, i) => {
          const parts = [
            nonEmpty(c?.name) ? safe(c?.name) : '',
            nonEmpty(c?.issuer) ? safe(c?.issuer) : '',
            nonEmpty(c?.dateEarned) ? `Earned: ${safe(c?.dateEarned)}` : '',
            nonEmpty(c?.expirationDate) ? `Expires: ${safe(c?.expirationDate)}` : '',
          ].filter(Boolean);
          return (
            <Text key={i} style={styles.line}>
              • {parts.join(' • ')}
            </Text>
          );
        })}
      </View>
    );

  const Section_Languages =
    filledLangs.length > 0 && (
      <View key="languages" style={styles.section}>
        <Text style={styles.sectionTitle}>Languages</Text>
        {filledLangs.map((l, i) => {
          const parts = [
            nonEmpty(l?.language) ? safe(l?.language) : '',
            nonEmpty(l?.proficiency) ? safe(l?.proficiency) : '',
            nonEmpty(l?.years) ? `${safe(l?.years)} years` : '',
          ].filter(Boolean);
          return (
            <Text key={i} style={styles.line}>
              • {parts.join(' • ')}
            </Text>
          );
        })}
      </View>
    );

  const Section_Skills =
    filledSkills.length > 0 && (
      <View key="skills" style={styles.section}>
        <Text style={styles.sectionTitle}>Skills</Text>
        <Text style={styles.line}>{filledSkills.join(', ')}</Text>
      </View>
    );

  const Section_Achievements =
    filledAch.length > 0 && (
      <View key="achievements" style={styles.section}>
        <Text style={styles.sectionTitle}>Achievements & Awards</Text>
        {filledAch.map((a, i) => (
          <View key={i} style={styles.itemBlock}>
            {nonEmpty(a?.title) ? <Text style={styles.headlineCompany}>{safe(a?.title)}</Text> : null}
            {nonEmpty(a?.description) ? <Text style={styles.line}>{safe(a?.description)}</Text> : null}
          </View>
        ))}
      </View>
    );

  const Section_Custom =
    filledCustom.length > 0 && (
      <View key="custom" style={styles.section}>
        {filledCustom.map((s, i) => (
          <View key={i} style={styles.itemBlock}>
            <Text style={styles.sectionTitle}>{nonEmpty(s?.title) ? safe(s?.title) : 'Custom Section'}</Text>
            {nonEmpty(s?.content) ? <Text style={styles.line}>{safe(s?.content)}</Text> : null}
          </View>
        ))}
      </View>
    );

  // ---- Reverse (single column) composition ----
  const ReverseBody = (
    <>
      {stackWithRules(
        [
          Section_Summary,
          Section_Experience,
          Section_Projects,
          Section_Education,
          Section_Languages,
          Section_Skills,
          Section_Achievements,
          Section_Certs,
          Section_Volunteer,
          Section_Custom,
        ].filter(Boolean),
        'rev'
      )}
    </>
  );

  // ---- Hybrid (two columns) composition ----
  const HybridBody = (
    <View style={styles.row}>
      <View style={styles.colLeft}>
        {stackWithRules(
          [Section_Summary, Section_Skills, Section_Languages].filter(Boolean),
          'left'
        )}
      </View>
      <View style={styles.colRight}>
        {stackWithRules(
          [
            Section_Experience,
            Section_Projects,
            Section_Education,
            Section_Achievements,
            Section_Certs,
            Section_Volunteer,
            Section_Custom,
          ].filter(Boolean),
          'right'
        )}
      </View>
    </View>
  );

  // ---- Render ----
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerBlock}>
          <Text style={styles.name}>{nonEmpty(formData.fullName) ? safe(formData.fullName) : 'Your Name'}</Text>
          {nonEmpty(formData.role) ? <Text style={styles.title}>{safe(formData.role)}</Text> : null}
          {nonEmpty(contactLine) ? <Text style={styles.contact}>{contactLine}</Text> : null}
        </View>

        {/* Body based on templateId */}
        {templateId === 'hybrid' ? HybridBody : ReverseBody}
      </Page>
    </Document>
  );
}
