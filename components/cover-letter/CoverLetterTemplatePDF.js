// components/cover-letter/CoverLetterTemplatePDF.js
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: 'Helvetica' },
  header: { marginBottom: 20 },
  name: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  contact: { fontSize: 10, color: '#555', marginBottom: 20 },
  section: { marginBottom: 16 },
  text: { marginBottom: 6, lineHeight: 1.5 },
});

export default function CoverLetterTemplatePDF({ data }) {
  const safeData = data || {};
  const {
    fullName = 'Your Name',
    email = '',
    phone = '',
    location = '',
    portfolio = '',
    recipient = 'Hiring Manager',
    company = 'the company',
    role = '',
    greeting = 'Dear Hiring Manager,',
    opening = '',
    body = '',
    closing = '',
    signoff = 'Sincerely,',
  } = safeData;

  const paragraphs = [
    opening,
    ...(body ? body.split('\n').filter(Boolean) : []),
    closing,
  ].filter(Boolean);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.contact}>
            {[email, phone, location, portfolio].filter(Boolean).join(' • ')}
          </Text>
        </View>
        <View style={styles.section}>
          <Text>{company}</Text>
          {recipient !== 'Hiring Manager' && <Text>Attn: {recipient}</Text>}
        </View>
        <View style={styles.section}>
          <Text>{greeting}</Text>
        </View>
        {paragraphs.length > 0 ? (
          paragraphs.map((para, i) => (
            <View key={i} style={styles.section}>
              <Text style={styles.text}>{para}</Text>
            </View>
          ))
        ) : (
          <View style={styles.section}>
            <Text style={styles.text}>[No content]</Text>
          </View>
        )}
        <View style={styles.section}>
          <Text>{signoff}</Text>
          <Text style={{ marginTop: 30 }}>{fullName}</Text>
        </View>
      </Page>
    </Document>
  );
}