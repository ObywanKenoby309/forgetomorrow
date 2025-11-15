// components/resume-form/templates/ReverseResumeTemplate.pdf.js
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Register a fallback font (Helvetica is built-in)
const styles = StyleSheet.create({
  page: { padding: 50, fontFamily: 'Helvetica', fontSize: 10 },
  header: { marginBottom: 20 },
  name: { fontSize: 18, fontWeight: 'bold' },
  contact: { fontSize: 9, color: '#666', marginTop: 4 },
  targetedRole: { fontSize: 10, fontStyle: 'italic', marginTop: 4 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', marginTop: 16, marginBottom: 6, textTransform: 'uppercase', color: '#1f2937' },
  job: { marginBottom: 12 },
  jobHeader: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between' },
  jobTitle: { fontSize: 11, fontWeight: 'bold' },
  company: { fontSize: 10, color: '#444' },
  bullet: { fontSize: 10, marginLeft: 16, marginTop: 2 },
  skills: { fontSize: 10 },
});

export default function ReverseResumeTemplate({ data }) {
  const { personalInfo, summary, workExperiences = [], educationList = [], skills = [] } = data;

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{personalInfo.name}</Text>
          <Text style={styles.contact}>
            {[
              personalInfo.email,
              personalInfo.phone,
              personalInfo.location,
              personalInfo.linkedin,
              personalInfo.github,
              personalInfo.portfolio,
              personalInfo.ftProfile
            ].filter(Boolean).join(' | ')}
          </Text>
          {personalInfo.targetedRole && (
            <Text style={styles.targetedRole}>{personalInfo.targetedRole}</Text>
          )}
        </View>

        {summary && <Text style={{ marginBottom: 16, fontSize: 10 }}>{summary}</Text>}

        {workExperiences.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Experience</Text>
            {workExperiences.map((exp, i) => (
              <View key={i} style={styles.job}>
                <View style={styles.jobHeader}>
                  <Text style={styles.jobTitle}>{exp.title || exp.jobTitle}</Text>
                  <Text style={styles.company}>
                    {exp.company} {exp.location && `| ${exp.location}`}
                  </Text>
                </View>
                <Text style={{ fontSize: 9, color: '#666', marginBottom: 4 }}>
                  {exp.startDate} - {exp.endDate || 'Present'}
                </Text>
                {(exp.bullets || []).map((b, bi) => (
                  <Text key={bi} style={styles.bullet}>• {b}</Text>
                ))}
              </View>
            ))}
          </>
        )}

        {educationList.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Education</Text>
            {educationList.map((edu, i) => (
              <View key={i} style={{ marginBottom: 10 }}>
                <Text style={{ fontSize: 10, fontWeight: 'bold' }}>
                  {edu.degree} {edu.field && `${edu.field}`}
                </Text>
                <Text style={{ fontSize: 9 }}>
                  {edu.school} {edu.location && `| ${edu.location}`}
                </Text>
                <Text style={{ fontSize: 9, color: '#666' }}>
                  {edu.startDate} - {edu.endDate || 'Present'}
                </Text>
              </View>
            ))}
          </>
        )}

        {skills.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Skills</Text>
            <Text style={styles.skills}>{skills.join(', ')}</Text>
          </>
        )}
      </Page>
    </Document>
  );
}