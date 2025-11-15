// components/resume-form/templates/AtsResumeTemplate.pdf.js
import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 11, lineHeight: 1.5 },
  text: { marginBottom: 4 },
  bold: { fontWeight: 'bold' },
  section: { marginTop: 12 },
});

export default function AtsResumeTemplate({ data }) {
  const { personalInfo, summary, workExperiences = [], educationList = [], skills = [] } = data;

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={{ fontSize: 16, ...styles.bold, ...styles.text }}>
          {personalInfo.name}
        </Text>
        <Text style={styles.text}>
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
        {personalInfo.targetedRole && <Text style={{ ...styles.text, fontStyle: 'italic' }}>{personalInfo.targetedRole}</Text>}

        {summary && (
          <View style={styles.section}>
            <Text style={styles.bold}>Professional Summary</Text>
            <Text style={styles.text}>{summary}</Text>
          </View>
        )}

        {workExperiences.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.bold}>Experience</Text>
            {workExperiences.map((exp, i) => (
              <View key={i} style={{ marginTop: 8 }}>
                <Text style={styles.bold}>{exp.title} | {exp.company}</Text>
                <Text style={styles.text}>{exp.location} | {exp.startDate} - {exp.endDate || 'Present'}</Text>
                {(exp.bullets || []).map((b, bi) => (
                  <Text key={bi} style={{ ...styles.text, marginLeft: 20 }}>• {b}</Text>
                ))}
              </View>
            ))}
          </View>
        )}

        {educationList.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.bold}>Education</Text>
            {educationList.map((edu, i) => (
              <View key={i} style={{ marginTop: 6 }}>
                <Text style={styles.bold}>{edu.degree} {edu.field && `in ${edu.field}`}</Text>
                <Text style={styles.text}>{edu.school} | {edu.location}</Text>
                <Text style={styles.text}>{edu.startDate} - {edu.endDate || 'Present'}</Text>
              </View>
            ))}
          </View>
        )}

        {skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.bold}>Skills</Text>
            <Text style={styles.text}>{skills.join(', ')}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}