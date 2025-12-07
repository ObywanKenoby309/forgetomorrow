// components/resume-form/templates/ReverseResumeTemplate.pdf.js
import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 50, fontFamily: 'Helvetica', fontSize: 10, color: '#1f2937' },
  header: { marginBottom: 20 },
  name: { fontSize: 18, fontWeight: 'bold' },
  contact: { fontSize: 9, color: '#666', marginTop: 4 },
  targetedRole: { fontSize: 10, fontStyle: 'italic', marginTop: 4 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 6,
    textTransform: 'uppercase',
    color: '#1f2937',
  },
  paragraph: { fontSize: 10 },
  job: { marginBottom: 12 },
  jobHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  jobTitle: { fontSize: 11, fontWeight: 'bold' },
  company: { fontSize: 10, color: '#444' },
  jobDates: { fontSize: 9, color: '#666', marginBottom: 4 },
  bullet: { fontSize: 10, marginLeft: 16, marginTop: 2 },
  eduItem: { marginBottom: 10 },
  eduDegree: { fontSize: 10, fontWeight: 'bold' },
  eduLine: { fontSize: 9 },
  skills: { fontSize: 10 },
  certItem: { marginBottom: 6 },
  certTitle: { fontSize: 10, fontWeight: 'bold' },
  certMeta: { fontSize: 9, color: '#444' },
  certDesc: { fontSize: 9, marginTop: 2 },
  customList: { marginLeft: 12 },
  customItem: { fontSize: 10, marginBottom: 3 },
});

export default function ReverseResumeTemplatePDF({ data }) {
  const {
    personalInfo,
    summary,
    workExperiences = [],
    educationList = [],
    skills = [],
    certifications = [],
    customSections = [],
  } = data;

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.name}>{personalInfo.name}</Text>
          <Text style={styles.contact}>
            {[
              personalInfo.email,
              personalInfo.phone,
              personalInfo.location,
              personalInfo.linkedin && `LinkedIn: ${personalInfo.linkedin}`,
              personalInfo.github && `GitHub: ${personalInfo.github}`,
              personalInfo.portfolio && `Portfolio: ${personalInfo.portfolio}`,
              personalInfo.ftProfile && `FT Profile: ${personalInfo.ftProfile}`,
            ]
              .filter(Boolean)
              .join(' | ')}
          </Text>
          {personalInfo.targetedRole && (
            <Text style={styles.targetedRole}>{personalInfo.targetedRole}</Text>
          )}
        </View>

        {/* SUMMARY */}
        {summary && (
          <>
            <Text style={styles.sectionTitle}>Professional Summary</Text>
            <Text style={styles.paragraph}>{summary}</Text>
          </>
        )}

        {/* EXPERIENCE */}
        {workExperiences.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Experience</Text>
            {workExperiences.map((exp, i) => (
              <View key={i} style={styles.job}>
                <View style={styles.jobHeader}>
                  <Text style={styles.jobTitle}>{exp.title || exp.jobTitle}</Text>
                  <Text style={styles.company}>
                    {exp.company}
                    {exp.location ? ` • ${exp.location}` : ''}
                  </Text>
                </View>
                <Text style={styles.jobDates}>
                  {exp.startDate} – {exp.endDate || 'Present'}
                </Text>
                {(exp.bullets || []).map((b, bi) => (
                  <Text key={bi} style={styles.bullet}>
                    • {b}
                  </Text>
                ))}
              </View>
            ))}
          </>
        )}

        {/* EDUCATION */}
        {educationList.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Education</Text>
            {educationList.map((edu, i) => (
              <View key={i} style={styles.eduItem}>
                <Text style={styles.eduDegree}>
                  {edu.degree}{' '}
                  {edu.field && `${edu.field}`}
                </Text>
                <Text style={styles.eduLine}>
                  {(edu.institution || edu.school) || ''}
                  {edu.location ? ` • ${edu.location}` : ''}
                </Text>
                <Text style={styles.eduLine}>
                  {edu.startDate} – {edu.endDate || 'Present'}
                </Text>
                {edu.description && (
                  <Text style={styles.paragraph}>{edu.description}</Text>
                )}
                {!edu.description && edu.details && (
                  <Text style={styles.paragraph}>{edu.details}</Text>
                )}
              </View>
            ))}
          </>
        )}

        {/* CERTIFICATIONS / TRAINING */}
        {certifications.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Certifications & Training</Text>
            {certifications.map((cert, i) => {
              if (typeof cert === 'string') {
                return (
                  <Text key={i} style={styles.paragraph}>
                    • {cert}
                  </Text>
                );
              }

              const title =
                cert.name ||
                cert.title ||
                cert.certification;
              const org =
                cert.issuer ||
                cert.organization ||
                cert.provider;
              const date =
                cert.date ||
                cert.issued ||
                cert.obtained;
              const desc =
                cert.description || cert.details;

              return (
                <View key={i} style={styles.certItem}>
                  <Text style={styles.certTitle}>{title}</Text>
                  {(org || date) && (
                    <Text style={styles.certMeta}>
                      {org}
                      {org && date && ' • '}
                      {date}
                    </Text>
                  )}
                  {desc && <Text style={styles.certDesc}>{desc}</Text>}
                </View>
              );
            })}
          </>
        )}

        {/* SKILLS */}
        {skills.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Skills</Text>
            <Text style={styles.skills}>{skills.join(' • ')}</Text>
          </>
        )}

        {/* CUSTOM SECTIONS */}
        {customSections.length > 0 &&
          customSections.map((section, i) => {
            if (!section) return null;
            const title =
              section.title ||
              section.heading ||
              'Additional Information';
            const items = Array.isArray(section.items)
              ? section.items
              : null;
            const content =
              section.content ||
              section.text ||
              section.body;

            return (
              <View key={i}>
                <Text style={styles.sectionTitle}>{title}</Text>
                {items && items.length > 0 ? (
                  <View style={styles.customList}>
                    {items.map((item, idx) => (
                      <Text key={idx} style={styles.customItem}>
                        • {item}
                      </Text>
                    ))}
                  </View>
                ) : (
                  content && (
                    <Text style={styles.paragraph}>{content}</Text>
                  )
                )}
              </View>
            );
          })}
      </Page>
    </Document>
  );
}
