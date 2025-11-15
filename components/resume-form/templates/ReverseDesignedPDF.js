// components/resume-form/templates/ReverseDesignedPDF.js
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 11 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 12, textAlign: 'center', marginBottom: 16, color: '#666' },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginTop: 16, marginBottom: 6, borderBottom: 1, borderColor: '#000', paddingBottom: 2 },
  text: { marginBottom: 4 },
  bullet: { marginLeft: 16, marginBottom: 4 },
  skills: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  skill: { marginRight: 12, marginBottom: 4 }
});

export default function ReverseDesignedPDF({ data }) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>{data.personalInfo.name}</Text>
        <Text style={styles.subtitle}>
          {[
            data.personalInfo.email,
            data.personalInfo.phone,
            data.personalInfo.location,
            data.personalInfo.portfolio && `Portfolio: ${data.personalInfo.portfolio}`
          ].filter(Boolean).join(' | ')}
        </Text>
        {data.personalInfo.targetedRole && <Text style={styles.subtitle}>{data.personalInfo.targetedRole}</Text>}

        {data.summary && (
          <>
            <Text style={styles.sectionTitle}>PROFESSIONAL SUMMARY</Text>
            <Text style={styles.text}>{data.summary}</Text>
          </>
        )}

        {data.workExperiences?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>EXPERIENCE</Text>
            {data.workExperiences.map((exp, i) => (
              <View key={i}>
                <Text style={{ fontWeight: 'bold' }}>
                  {exp.title} • {exp.company} • {exp.location}
                  <Text style={{ float: 'right' }}>{exp.start} – {exp.end}</Text>
                </Text>
                {exp.bullets?.map((b, j) => (
                  <Text key={j} style={styles.bullet}>• {b}</Text>
                ))}
              </View>
            ))}
          </>
        )}

        {data.educationList?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>EDUCATION</Text>
            {data.educationList.map((edu, i) => (
              <View key={i}>
                <Text style={{ fontWeight: 'bold' }}>{edu.degree}</Text>
                <Text>{edu.institution} • {edu.location}</Text>
                <Text>{edu.start} – {edu.end}</Text>
              </View>
            ))}
          </>
        )}

        {data.skills?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>SKILLS</Text>
            <View style={styles.skills}>
              {data.skills.map((s, i) => (
                <Text key={i} style={styles.skill}>• {s}</Text>
              ))}
            </View>
          </>
        )}
      </Page>
    </Document>
  );
}