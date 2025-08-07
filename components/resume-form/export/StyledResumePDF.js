// components/resume-form/export/StyledResumePDF.js
import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Use built-in Helvetica (no remote font registration)
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
  const safe = (v) => (v == null ? '' : String(v));
  const nonEmptyLines = (txt) =>
    safe(txt)
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.section}>
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
            {safe(formData.fullName) || 'Your Name'}
          </Text>
          {(safe(formData.location) || safe(formData.email) || safe(formData.phone) || safe(formData.portfolio)) && (
            <>
              {safe(formData.location) ? (
                <Text style={styles.smallText}>{safe(formData.location)}</Text>
              ) : null}
              <Text style={styles.smallText}>
                {[safe(formData.email), safe(formData.phone), safe(formData.portfolio)]
                  .filter(Boolean)
                  .join(' | ')}
              </Text>
            </>
          )}
        </View>

        {/* Summary */}
        {safe(summary) && (
          <View style={styles.section}>
            <Text style={styles.header}>Career Summary</Text>
            <Text>{safe(summary)}</Text>
          </View>
        )}

        {/* Experience */}
        {Array.isArray(experiences) && experiences.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.header}>Professional Background</Text>
            {experiences.map((exp, i) => (
              <View key={i} style={{ marginBottom: 6 }}>
                <Text style={styles.subHeader}>
                  {safe(exp?.jobTitle) || 'Job Title'} — {safe(exp?.company)}
                </Text>
                {(safe(exp?.startDate) || safe(exp?.endDate) || safe(exp?.location)) && (
                  <Text style={styles.smallText}>
                    {[`${safe(exp?.startDate) || 'Start'} – ${safe(exp?.endDate) || 'End'}`, safe(exp?.location)]
                      .filter(Boolean)
                      .join(' | ')}
                  </Text>
                )}
                {nonEmptyLines(exp?.description).map((line, idx) => (
                  <Text key={idx} style={styles.bullet}>• {line}</Text>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Projects */}
        {Array.isArray(projects) && projects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.header}>Selected Projects</Text>
            {projects.map((proj, i) => (
              <View key={i} style={{ marginBottom: 6 }}>
                <Text style={styles.subHeader}>{safe(proj?.title) || 'Project Title'}</Text>
                {safe(proj?.description) ? <Text>{safe(proj?.description)}</Text> : null}
              </View>
            ))}
          </View>
        )}

        {/* Volunteer */}
        {Array.isArray(volunteerExperiences) && volunteerExperiences.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.header}>Community Involvement</Text>
            {volunteerExperiences.map((vol, i) => (
              <View key={i} style={{ marginBottom: 6 }}>
                <Text style={styles.subHeader}>
                  {safe(vol?.role) || 'Role'} — {safe(vol?.organization)}
                </Text>
                {(safe(vol?.startDate) || safe(vol?.endDate)) && (
                  <Text style={styles.smallText}>
                    {`${safe(vol?.startDate) || 'Start'} – ${safe(vol?.endDate) || 'End'}`}
                  </Text>
                )}
                {safe(vol?.description) ? <Text>{safe(vol?.description)}</Text> : null}
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {Array.isArray(educationList) && educationList.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.header}>Education & Honors</Text>
            {educationList.map((edu, i) => (
              <View key={i} style={{ marginBottom: 6 }}>
                <Text style={styles.subHeader}>
                  {[safe(edu?.degree), safe(edu?.school)].filter(Boolean).join(', ') || 'Degree, School'}
                </Text>
                {(safe(edu?.startDate) || safe(edu?.endDate)) && (
                  <Text style={styles.smallText}>
                    {`${safe(edu?.startDate) || 'Start'} – ${safe(edu?.endDate) || 'End'}`}
                  </Text>
                )}
                {safe(edu?.description) ? <Text>{safe(edu?.description)}</Text> : null}
              </View>
            ))}
          </View>
        )}

        {/* Certifications */}
        {Array.isArray(certifications) && certifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.header}>Certifications & Training</Text>
            {certifications.map((cert, i) => (
              <Text key={i}>• {safe(cert?.name)}{safe(cert?.issuer) ? ` — ${safe(cert?.issuer)}` : ''}</Text>
            ))}
          </View>
        )}

        {/* Languages */}
        {Array.isArray(languages) && languages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.header}>Languages</Text>
            {languages.map((lang, i) => (
              <Text key={i}>
                • {safe(lang?.language)}
                {safe(lang?.proficiency) ? ` — ${safe(lang?.proficiency)}` : ''}
                {safe(lang?.years) ? ` (${safe(lang?.years)} yrs)` : ''}
              </Text>
            ))}
          </View>
        )}

        {/* Skills */}
        {Array.isArray(skills) && skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.header}>Skills</Text>
            <Text>{skills.map((s) => safe(s)).filter(Boolean).join(', ')}</Text>
          </View>
        )}

        {/* Achievements */}
        {Array.isArray(achievements) && achievements.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.header}>Achievements & Awards</Text>
            {achievements.map((item, i) => (
              <View key={i} style={{ marginBottom: 6 }}>
                <Text style={styles.subHeader}>{safe(item?.title) || 'Title'}</Text>
                {safe(item?.description) ? <Text>{safe(item?.description)}</Text> : null}
              </View>
            ))}
          </View>
        )}

        {/* Custom Sections */}
        {Array.isArray(customSections) && customSections.length > 0 && (
          <View style={styles.section}>
            {customSections.map((section, i) => (
              <View key={i} style={{ marginBottom: 6 }}>
                <Text style={styles.header}>{safe(section?.title) || 'Custom Section'}</Text>
                {safe(section?.content) ? <Text>{safe(section?.content)}</Text> : null}
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}
