// components/resume-form/export/StyledResumePDF.js
import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Neutral, ATS-safe styling
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
  headerBlock: { marginBottom: 10 },
  name: { fontSize: 18, fontWeight: 'bold' },
  title: { fontSize: 11, fontWeight: 'bold', marginTop: 2 },
  contact: { fontSize: 9, color: '#444', marginTop: 6 },

  // Sectioning
  rule: { height: 1, backgroundColor: '#DADADA', marginVertical: 12 },
  section: { marginTop: 8, marginBottom: 8 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', marginBottom: 6, color: '#333' },

  // Content
  headline: { fontWeight: 'bold' },
  meta: { fontSize: 9, color: '#555', marginTop: 1, marginBottom: 2 },
  itemBlock: { marginBottom: 8 },
  line: { marginBottom: 3 },
  bullet: { marginLeft: 10, marginBottom: 2 },
});

// ---------- helpers ----------
const safe = (v) => (v == null ? '' : String(v).trim());
const nonEmpty = (v) => safe(v).length > 0;
const joinBar = (...vals) => vals.map(safe).filter(Boolean).join(' | ');

// return "" if both are empty; otherwise "start - end" (with single dash only if both exist)
const joinDash = (a, b) => {
  const start = safe(a);
  const end = safe(b);
  if (!start && !end) return '';
  if (start && end) return `${start} - ${end}`;
  return start || end; // one-sided date
};

const splitLines = (txt) =>
  safe(txt)
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

const hasAnyFields = (obj, fields) => fields.some((f) => nonEmpty(obj?.[f]));

// ---------- component ----------
export default function StyledResumePDF({
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
  // --- filter each section to only keep truly filled items ---
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

  // header contact line
  const contactLine = joinBar(
    safe(formData.location),
    safe(formData.email),
    safe(formData.phone),
    safe(formData.portfolio)
  );

  // --- build sections conditionally; we'll insert rules only between sections that render ---
  const sections = [];

  // Summary
  if (nonEmpty(summary)) {
    sections.push(
      <View key="summary" style={styles.section}>
        <Text style={styles.sectionTitle}>Career Summary</Text>
        {splitLines(summary).map((l, i) => (
          <Text key={i} style={styles.line}>
            {l}
          </Text>
        ))}
      </View>
    );
  }

  // Experience
  if (filledExperiences.length > 0) {
    sections.push(
      <View key="experience" style={styles.section}>
        <Text style={styles.sectionTitle}>Professional Experience</Text>
        {filledExperiences.map((exp, i) => {
          const headline = [safe(exp?.jobTitle), nonEmpty(exp?.company) ? `, ${safe(exp?.company)}` : '']
            .filter(Boolean)
            .join('');
          const dateRange = joinDash(exp?.startDate, exp?.endDate);
          const metaPieces = [safe(exp?.location), dateRange].filter(Boolean);
          const bullets = splitLines(exp?.description);

          return (
            <View key={i} style={styles.itemBlock}>
              {nonEmpty(headline) ? <Text style={styles.headline}>{headline}</Text> : null}
              {metaPieces.length > 0 ? <Text style={styles.meta}>{metaPieces.join(' | ')}</Text> : null}
              {bullets.map((b, idx) => (
                <Text key={idx} style={styles.bullet}>
                  - {b}
                </Text>
              ))}
            </View>
          );
        })}
      </View>
    );
  }

  // Projects
  if (filledProjects.length > 0) {
    sections.push(
      <View key="projects" style={styles.section}>
        <Text style={styles.sectionTitle}>Projects</Text>
        {filledProjects.map((p, i) => (
          <View key={i} style={styles.itemBlock}>
            {nonEmpty(p?.title) ? <Text style={styles.headline}>{safe(p?.title)}</Text> : null}
            {nonEmpty(p?.description) ? <Text style={styles.line}>{safe(p?.description)}</Text> : null}
          </View>
        ))}
      </View>
    );
  }

  // Volunteer
  if (filledVol.length > 0) {
    sections.push(
      <View key="volunteer" style={styles.section}>
        <Text style={styles.sectionTitle}>Volunteer Experience</Text>
        {filledVol.map((v, i) => {
          const headline = [safe(v?.role), nonEmpty(v?.organization) ? `, ${safe(v?.organization)}` : '']
            .filter(Boolean)
            .join('');
          const dateRange = joinDash(v?.startDate, v?.endDate);

          return (
            <View key={i} style={styles.itemBlock}>
              {nonEmpty(headline) ? <Text style={styles.headline}>{headline}</Text> : null}
              {nonEmpty(dateRange) ? <Text style={styles.meta}>{dateRange}</Text> : null}
              {nonEmpty(v?.description) ? <Text style={styles.line}>{safe(v?.description)}</Text> : null}
            </View>
          );
        })}
      </View>
    );
  }

  // Education
  if (filledEdu.length > 0) {
    sections.push(
      <View key="education" style={styles.section}>
        <Text style={styles.sectionTitle}>Education</Text>
        {filledEdu.map((e, i) => {
          const headline =
            [safe(e?.degree), safe(e?.school)].filter(Boolean).join(', ') || 'Degree, School';
          const dateRange = joinDash(e?.startDate, e?.endDate);

          return (
            <View key={i} style={styles.itemBlock}>
              <Text style={styles.headline}>{headline}</Text>
              {nonEmpty(dateRange) ? <Text style={styles.meta}>{dateRange}</Text> : null}
              {nonEmpty(e?.description) ? <Text style={styles.line}>{safe(e?.description)}</Text> : null}
            </View>
          );
        })}
      </View>
    );
  }

  // Certifications
  if (filledCerts.length > 0) {
    sections.push(
      <View key="certs" style={styles.section}>
        <Text style={styles.sectionTitle}>Certifications & Training</Text>
        {filledCerts.map((c, i) => {
          const lineParts = [
            nonEmpty(c?.name) ? safe(c?.name) : '',
            nonEmpty(c?.issuer) ? safe(c?.issuer) : '',
            nonEmpty(c?.dateEarned) ? `Earned: ${safe(c?.dateEarned)}` : '',
            nonEmpty(c?.expirationDate) ? `Expires: ${safe(c?.expirationDate)}` : '',
          ].filter(Boolean);
          return (
            <Text key={i} style={styles.line}>
              - {lineParts.join(' | ')}
            </Text>
          );
        })}
      </View>
    );
  }

  // Languages
  if (filledLangs.length > 0) {
    sections.push(
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
              - {parts.join(' | ')}
            </Text>
          );
        })}
      </View>
    );
  }

  // Skills
  if (filledSkills.length > 0) {
    sections.push(
      <View key="skills" style={styles.section}>
        <Text style={styles.sectionTitle}>Skills</Text>
        <Text style={styles.line}>{filledSkills.join(', ')}</Text>
      </View>
    );
  }

  // Achievements
  if (filledAch.length > 0) {
    sections.push(
      <View key="achievements" style={styles.section}>
        <Text style={styles.sectionTitle}>Achievements & Awards</Text>
        {filledAch.map((a, i) => (
          <View key={i} style={styles.itemBlock}>
            {nonEmpty(a?.title) ? <Text style={styles.headline}>{safe(a?.title)}</Text> : null}
            {nonEmpty(a?.description) ? <Text style={styles.line}>{safe(a?.description)}</Text> : null}
          </View>
        ))}
      </View>
    );
  }

  // Custom
  if (filledCustom.length > 0) {
    sections.push(
      <View key="custom" style={styles.section}>
        {filledCustom.map((s, i) => (
          <View key={i} style={styles.itemBlock}>
            <Text style={styles.sectionTitle}>{nonEmpty(s?.title) ? safe(s?.title) : 'Custom Section'}</Text>
            {nonEmpty(s?.content) ? <Text style={styles.line}>{safe(s?.content)}</Text> : null}
          </View>
        ))}
      </View>
    );
  }

  // interleave rules only between rendered sections
  const withRules = sections.reduce((acc, node, idx) => {
    if (idx > 0) acc.push(<View key={`rule-${idx}`} style={styles.rule} />);
    acc.push(node);
    return acc;
  }, []);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerBlock}>
          <Text style={styles.name}>{nonEmpty(formData.fullName) ? safe(formData.fullName) : 'Your Name'}</Text>
          {nonEmpty(formData.role) ? <Text style={styles.title}>{safe(formData.role)}</Text> : null}
          {nonEmpty(contactLine) ? <Text style={styles.contact}>{contactLine}</Text> : null}
        </View>
        {/* Dynamic sections + rules */}
        {withRules}
      </Page>
    </Document>
  );
}
