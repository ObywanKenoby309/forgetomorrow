// components/resume-form/templates/HybridResumeTemplate.pdf.js
import { Document, Page, Text, View } from '@react-pdf/renderer';

export default function HybridResumeTemplate({ data }) {
  const { personalInfo, summary, skills = [], workExperiences = [], educationList = [] } = data;

  return (
    <Document>
      <Page size="LETTER" style={{ padding: 50, fontFamily: 'Helvetica', fontSize: 11 }}>
        {/* HEADER */}
        <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{personalInfo.name}</Text>
        <Text style={{ fontSize: 10, marginBottom: 10 }}>
          {[personalInfo.email, personalInfo.phone, personalInfo.location].filter(Boolean).join(' | ')}
        </Text>

        {/* SKILLS FIRST */}
        {skills.length > 0 && (
          <>
            <Text style={{ fontWeight: 'bold', marginTop: 10 }}>SKILLS</Text>
            <Text style={{ marginBottom: 10 }}>{skills.join(', ')}</Text>
          </>
        )}

        {/* EXPERIENCE */}
        {workExperiences.map((exp, i) => (
          <View key={i} style={{ marginTop: 10 }}>
            <Text style={{ fontWeight: 'bold' }}>{exp.title} - {exp.company}</Text>
            <Text style={{ fontSize: 10 }}>{exp.startDate} - {exp.endDate || 'Present'}</Text>
            {(exp.bullets || []).map((b, bi) => (
              <Text key={bi} style={{ marginLeft: 20 }}>• {b}</Text>
            ))}
          </View>
        ))}

        {/* EDUCATION */}
        {educationList.map((edu, i) => (
          <View key={i} style={{ marginTop: 10 }}>
            <Text style={{ fontWeight: 'bold' }}>{edu.degree} in {edu.field}</Text>
            <Text style={{ fontSize: 10 }}>{edu.school}, {edu.startDate} - {edu.endDate}</Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}