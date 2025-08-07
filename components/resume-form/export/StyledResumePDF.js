// components/resume-form/export/StyledResumePDF.js
import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

// Register a clean, ATS-friendly font
Font.register({
  family: 'Helvetica',
  fonts: [{ src: 'https://fonts.gstatic.com/s/helvetica/v6/XYRbZYM1Di0zU5E1o8hv.ttf' }],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    lineHeight: 1.5,
    color: '#212121',
  },
  section: {
    marginBottom: 12,
  },
  header: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    textTransform: 'uppercase',
    color: '#FF7043',
  },
  subHeader: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  smallText: {
    fontSize: 9,
    color: '#555',
  },
  bullet: {
    marginLeft: 8,
  },
});

export default function StyledResumePDF({
  formData,
  summary,
  experiences,
  projects,
  volunteerExperiences,
  educationList,
  certifications,
  languages,
  skills,
  achievements,
  customSections,
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.section}>
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{formData.fullName || 'Your Name'}</Text>
          <Text style={styles.smallText}>{formData.location}</Text>
          <Text style={styles.smallText}>{formData.email} | {formData.phone} | {formData.portfolio}</Text>
        </View>

        {/* Summary */}
        {summary && (
          <View style={styles.section}>
            <Text style={styles.header}>Career Summary</Text>
            <Text>{summary}</Text>
          </View>
        )}

        {/* Experience */}
        {experiences.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.header}>Professional Background</Text>
            {experiences.map((exp, i) => (
              <View key={i} style={{ marginBottom: 6 }}>
                <Text style={styles.subHeader}>{exp.jobTitle || 'Job Title'} — {exp.company}</Text>
                <Text style={styles.smallText}>{exp.startDate} – {exp.endDate} | {exp.location}</Text>
                {(exp.description || '').split('\n').map((line, idx) => (
                  <Text key={idx} style={styles.bullet}>• {line}</Text>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.header}>Selected Projects</Text>
            {projects.map((proj, i) => (
              <View key={i}>
                <Text style={styles.subHeader}>{proj.title}</Text>
                <Text>{proj.description}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Volunteer */}
        {volunteerExperiences.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.header}>Community Involvement</Text>
            {volunteerExperiences.map((vol, i) => (
              <View key={i}>
                <Text style={styles.subHeader}>{vol.role} — {vol.organization}</Text>
                <Text style={styles.smallText}>{vol.startDate} – {vol.endDate}</Text>
                <Text>{vol.description}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {educationList.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.header}>Education & Honors</Text>
            {educationList.map((edu, i) => (
              <View key={i}>
                <Text style={styles.subHeader}>{edu.degree}, {edu.school}</Text>
                <Text style={styles.smallText}>{edu.startDate} – {edu.endDate}</Text>
                <Text>{edu.description}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.header}>Certifications & Training</Text>
            {certifications.map((cert, i) => (
              <Text key={i}>• {cert.name} — {cert.issuer}</Text>
            ))}
          </View>
        )}

        {/* Languages */}
        {languages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.header}>Languages</Text>
            {languages.map((lang, i) => (
              <Text key={i}>• {lang.language} — {lang.proficiency} ({lang.years} yrs)</Text>
            ))}
          </View>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.header}>Skills</Text>
            <Text>{skills.join(', ')}</Text>
          </View>
        )}

        {/* Achievements */}
        {achievements.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.header}>Achievements & Awards</Text>
            {achievements.map((item, i) => (
              <View key={i}>
                <Text style={styles.subHeader}>{item.title}</Text>
                <Text>{item.description}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Custom Sections */}
        {customSections.length > 0 && (
          <View style={styles.section}>
            {customSections.map((section, i) => (
              <View key={i}>
                <Text style={styles.header}>{section.title}</Text>
                <Text>{section.content}</Text>
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}
