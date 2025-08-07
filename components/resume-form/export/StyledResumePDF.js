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

const safe = (v) => (v == null ? '' : String(v).trim());
const joinBar = (...vals) => vals.filter((x) => safe(x)).join(' | ');
const joinDash = (a, b) => [safe(a) || 'Start', safe(b) || 'End'].join(' - ');
const splitLines = (txt) =>
  safe(txt)
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

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
  const contactLine = joinBar(
    safe(formData.location),
    safe(formData.email),
    safe(formData.phone),
    safe(formData.portfolio)
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ===== HEADER ===== */}
        <View style={styles.headerBlock}>
          <Text style={styles.name}>{safe(formData.fullName) || 'Your Name'}</Text>
          {safe(formData.role) ? <Text style={styles.title}>{safe(formData.role)}</Text> : null}
          {contactLine ? <Text style={styles.contact}>{contactLine}</Text> : null}
        </View>
        <View style={styles.rule} />

        {/* ===== SUMMARY ===== */}
        {safe(summary) ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Career Summary</Text>
            {splitLines(summary).map((l, i) => (
              <Text key={i} style={styles.line}>{l}</Text>
            ))}
          </View>
        ) : null}
        <View style={styles.rule} />

        {/* ===== EXPERIENCE ===== */}
        {Array.isArray(experiences) && experiences.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Experience</Text>
            {experiences.map((exp, i) => {
              const headline = [safe(exp?.jobTitle), safe(exp?.company) && `, ${safe(exp?.company)}`]
                .filter(Boolean)
                .join('');
              const meta = joinBar(safe(exp?.location), joinDash(exp?.startDate, exp?.endDate));
              const bullets = splitLines(exp?.description);

              return (
                <View key={i} style={styles.itemBlock}>
                  <Text style={styles.headline}>{headline || 'Job Title, Company'}</Text>
                  {meta ? <Text style={styles.meta}>{meta}</Text> : null}
                  {bullets.map((b, idx) => (
                    <Text key={idx} style={styles.bullet}>- {b}</Text>
                  ))}
                </View>
              );
            })}
          </View>
        ) : null}
        <View style={styles.rule} />

        {/* ===== PROJECTS ===== */}
        {Array.isArray(projects) && projects.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projects</Text>
            {projects.map((p, i) => (
              <View key={i} style={styles.itemBlock}>
                <Text style={styles.headline}>{safe(p?.title) || 'Project Title'}</Text>
                {safe(p?.description) ? <Text style={styles.line}>{safe(p?.description)}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}
        <View style={styles.rule} />

        {/* ===== VOLUNTEER ===== */}
        {Array.isArray(volunteerExperiences) && volunteerExperiences.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Volunteer Experience</Text>
            {volunteerExperiences.map((v, i) => (
              <View key={i} style={styles.itemBlock}>
                <Text style={styles.headline}>
                  {safe(v?.role) || 'Role'}{safe(v?.organization) ? `, ${safe(v?.organization)}` : ''}
                </Text>
                <Text style={styles.meta}>{joinDash(v?.startDate, v?.endDate)}</Text>
                {safe(v?.description) ? <Text style={styles.line}>{safe(v?.description)}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}
        <View style={styles.rule} />

        {/* ===== EDUCATION ===== */}
        {Array.isArray(educationList) && educationList.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {educationList.map((e, i) => (
              <View key={i} style={styles.itemBlock}>
                <Text style={styles.headline}>
                  {[safe(e?.degree), safe(e?.school)].filter(Boolean).join(', ') || 'Degree, School'}
                </Text>
                <Text style={styles.meta}>{joinDash(e?.startDate, e?.endDate)}</Text>
                {safe(e?.description) ? <Text style={styles.line}>{safe(e?.description)}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}
        <View style={styles.rule} />

        {/* ===== CERTS ===== */}
        {Array.isArray(certifications) && certifications.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Certifications & Training</Text>
            {certifications.map((c, i) => (
              <Text key={i} style={styles.line}>
                - {safe(c?.name)}
                {safe(c?.issuer) ? ` | ${safe(c?.issuer)}` : ''}
                {safe(c?.dateEarned) ? ` | Earned: ${safe(c?.dateEarned)}` : ''}
                {safe(c?.expirationDate) ? ` | Expires: ${safe(c?.expirationDate)}` : ''}
              </Text>
            ))}
          </View>
        ) : null}
        <View style={styles.rule} />

        {/* ===== LANGUAGES ===== */}
        {Array.isArray(languages) && languages.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Languages</Text>
            {languages.map((l, i) => (
              <Text key={i} style={styles.line}>
                - {safe(l?.language)}
                {safe(l?.proficiency) ? ` | ${safe(l?.proficiency)}` : ''}
                {safe(l?.years) ? ` | ${safe(l?.years)} years` : ''}
              </Text>
            ))}
          </View>
        ) : null}
        <View style={styles.rule} />

        {/* ===== SKILLS ===== */}
        {Array.isArray(skills) && skills.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <Text style={styles.line}>{skills.map(safe).filter(Boolean).join(', ')}</Text>
          </View>
        ) : null}
        <View style={styles.rule} />

        {/* ===== ACHIEVEMENTS ===== */}
        {Array.isArray(achievements) && achievements.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Achievements & Awards</Text>
            {achievements.map((a, i) => (
              <View key={i} style={styles.itemBlock}>
                <Text style={styles.headline}>{safe(a?.title) || 'Title'}</Text>
                {safe(a?.description) ? <Text style={styles.line}>{safe(a?.description)}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}

        {/* ===== CUSTOM ===== */}
        {Array.isArray(customSections) && customSections.length > 0 ? (
          <>
            <View style={styles.rule} />
            <View style={styles.section}>
              {customSections.map((s, i) => (
                <View key={i} style={styles.itemBlock}>
                  <Text style={styles.sectionTitle}>{safe(s?.title) || 'Custom Section'}</Text>
                  {safe(s?.content) ? <Text style={styles.line}>{safe(s?.content)}</Text> : null}
                </View>
              ))}
            </View>
          </>
        ) : null}
      </Page>
    </Document>
  );
}
