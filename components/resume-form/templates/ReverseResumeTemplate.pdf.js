// components/resume-form/templates/HybridResumeTemplate.pdf.js
import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.4,
    color: '#1f2937',
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  contact: {
    fontSize: 9,
    color: '#666',
    marginTop: 4,
  },
  extraLine: {
    fontSize: 9,
    color: '#666',
    marginTop: 2,
  },
  targetedRole: {
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 8,
    color: '#444',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 6,
    textTransform: 'uppercase',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderBottomStyle: 'solid',
  },
  paragraph: {
    fontSize: 10,
  },
  twoColumn: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 8,
  },
  colLeft: {
    flex: 1,
    paddingRight: 12,
  },
  colRight: {
    flex: 2,
    paddingLeft: 12,
  },
  skillItem: {
    fontSize: 10,
    marginBottom: 2,
  },
  job: {
    marginBottom: 10,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  jobTitle: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  jobCompany: {
    fontSize: 10,
    color: '#444',
    marginLeft: 4,
  },
  jobDates: {
    fontSize: 9,
    color: '#666',
  },
  bullet: {
    fontSize: 10,
    marginLeft: 12,
    marginTop: 2,
  },
  project: {
    marginBottom: 10,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  projectTitle: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  projectMeta: {
    fontSize: 10,
    color: '#444',
    marginLeft: 4,
  },
  eduItem: {
    marginBottom: 10,
  },
  eduDegree: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  eduLine: {
    fontSize: 9,
  },
  certItem: {
    marginBottom: 6,
  },
  certTitle: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  certOrg: {
    fontSize: 9,
    color: '#444',
  },
  customList: {
    marginLeft: 12,
  },
  customItem: {
    fontSize: 10,
    marginBottom: 3,
  },
});

export default function HybridResumeTemplatePDF({ data }) {
  const {
    personalInfo = {},
    summary,
    workExperiences = [],
    projects = [],
    educationList = [],
    skills = [],
    certifications = [],
    customSections = [],
  } = data || {};

  const contactLine = [
    personalInfo.email,
    personalInfo.phone,
    personalInfo.location,
  ]
    .filter(Boolean)
    .join(' | ');

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.name}>{personalInfo.name}</Text>
          {contactLine ? (
            <Text style={styles.contact}>{contactLine}</Text>
          ) : null}

          {personalInfo.portfolio && (
            <Text style={styles.extraLine}>{personalInfo.portfolio}</Text>
          )}

          {personalInfo.ftProfile && (
            <Text style={styles.extraLine}>{personalInfo.ftProfile}</Text>
          )}

          {personalInfo.targetedRole && (
            <Text style={styles.targetedRole}>
              {personalInfo.targetedRole}
            </Text>
          )}
        </View>

        {/* SUMMARY */}
        {summary && (
          <View>
            <Text style={styles.sectionTitle}>Professional Summary</Text>
            <Text style={styles.paragraph}>{summary}</Text>
          </View>
        )}

        {/* SKILLS + EXPERIENCE TWO-COLUMN */}
        <View style={styles.twoColumn}>
          {/* SKILLS */}
          <View style={styles.colLeft}>
            <Text style={styles.sectionTitle}>Skills</Text>
            {skills && skills.length > 0 ? (
              <View>
                {skills.map((skill, i) => (
                  <Text key={i} style={styles.skillItem}>
                    • {skill}
                  </Text>
                ))}
              </View>
            ) : (
              <Text style={styles.paragraph}>No skills listed.</Text>
            )}
          </View>

          {/* EXPERIENCE */}
          <View style={styles.colRight}>
            <Text style={styles.sectionTitle}>Experience</Text>
            {workExperiences && workExperiences.length > 0 ? (
              workExperiences.map((exp, i) => (
                <View key={i} style={styles.job}>
                  <View style={styles.jobHeader}>
                    <View style={{ flexDirection: 'row', flexShrink: 1 }}>
                      <Text style={styles.jobTitle}>
                        {exp.title || exp.jobTitle}
                      </Text>
                      {exp.company && (
                        <Text style={styles.jobCompany}>{exp.company}</Text>
                      )}
                    </View>
                    <Text style={styles.jobDates}>
                      {exp.startDate} – {exp.endDate || 'Present'}
                    </Text>
                  </View>
                  {(exp.bullets || []).map((b, bi) => (
                    <Text key={bi} style={styles.bullet}>
                      • {b}
                    </Text>
                  ))}
                </View>
              ))
            ) : (
              <Text style={styles.paragraph}>No experience listed.</Text>
            )}
          </View>
        </View>

        {/* PROJECTS */}
        {projects.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Projects</Text>
            {projects.map((proj, i) => {
              const headerRight =
                proj.startDate || proj.endDate
                  ? `${proj.startDate || ''} – ${proj.endDate || 'Present'}`
                  : null;

              const org =
                proj.company || proj.org || proj.client || '';

              return (
                <View key={i} style={styles.project}>
                  <View style={styles.projectHeader}>
                    <View style={{ flexDirection: 'row', flexShrink: 1 }}>
                      <Text style={styles.projectTitle}>
                        {proj.title || proj.name}
                      </Text>
                      {org && (
                        <Text style={styles.projectMeta}>{org}</Text>
                      )}
                    </View>
                    {headerRight && (
                      <Text style={styles.jobDates}>{headerRight}</Text>
                    )}
                  </View>

                  {(proj.bullets || []).map((b, bi) => (
                    <Text key={bi} style={styles.bullet}>
                      • {b}
                    </Text>
                  ))}

                  {proj.description &&
                    (!proj.bullets || proj.bullets.length === 0) && (
                      <Text style={styles.paragraph}>
                        {proj.description}
                      </Text>
                    )}
                </View>
              );
            })}
          </View>
        )}

        {/* EDUCATION */}
        {educationList.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Education</Text>
            {educationList.map((edu, i) => (
              <View key={i} style={styles.eduItem}>
                <Text style={styles.eduDegree}>
                  {edu.degree}{' '}
                  {edu.field ? edu.field : ''}
                </Text>
                <Text style={styles.eduLine}>
                  {(edu.institution || edu.school) || ''}
                  {edu.location ? ` • ${edu.location}` : ''}
                </Text>
                <Text style={styles.eduLine}>
                  {edu.startDate} – {edu.endDate || 'Present'}
                </Text>
                {edu.description && (
                  <Text style={styles.paragraph}>
                    {edu.description}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* CERTIFICATIONS */}
        {certifications.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>
              Certifications &amp; Training
            </Text>
            {certifications.map((cert, i) => (
              <View key={i} style={styles.certItem}>
                <Text style={styles.certTitle}>
                  {cert.name || cert.title}
                </Text>
                {(cert.organization || cert.issuer) && (
                  <Text style={styles.certOrg}>
                    {cert.organization || cert.issuer}
                  </Text>
                )}
              </View>
            ))}
          </View>
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
