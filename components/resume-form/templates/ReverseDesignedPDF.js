import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 11 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 12, textAlign: 'center', marginBottom: 8, color: '#666' },
  subtitleTight: { fontSize: 11, textAlign: 'center', marginBottom: 12, color: '#666' },

  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 6,
    borderBottom: 1,
    borderColor: '#000',
    paddingBottom: 2,
  },

  text: { marginBottom: 4 },
  bullet: { marginLeft: 16, marginBottom: 4 },

  skills: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  skill: { marginRight: 12, marginBottom: 4 },

  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  expHeaderLeft: { fontWeight: 'bold' },
  expHeaderRight: { fontWeight: 'bold', color: '#444' },
});

// ----------------- small helpers (minimal) -----------------
const safe = (v) => (v == null ? '' : String(v).trim());
const normalizeArray = (v) => (Array.isArray(v) ? v : []);

function fmtMonth(val) {
  const s = safe(val);
  if (!s) return '';
  if (/^\d{4}-\d{2}/.test(s)) return s.slice(0, 7);
  return s;
}

function fmtRange(start, end, current) {
  const a = fmtMonth(start);
  const b = safe(end) || (current ? 'Present' : '');
  const bb = b ? fmtMonth(b) : '';
  if (!a && !bb) return '';
  if (a && bb) return `${a} – ${bb}`;
  return a || bb;
}

function parseStartToDate(val) {
  const s = safe(val);
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(`${s}T00:00:00Z`);
  if (/^\d{4}-\d{2}$/.test(s)) return new Date(`${s}-01T00:00:00Z`);
  if (/^\d{4}$/.test(s)) return new Date(`${s}-01-01T00:00:00Z`);
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function calcYearsExperience(exps) {
  const starts = normalizeArray(exps)
    .map((e) => parseStartToDate(e?.startDate || e?.start || e?.from || e?.begin))
    .filter(Boolean)
    .sort((a, b) => a.getTime() - b.getTime());

  if (!starts.length) return '';
  const first = starts[0];
  const now = new Date();
  const ms = now.getTime() - first.getTime();
  const years = Math.floor(ms / (1000 * 60 * 60 * 24 * 365.25));
  if (!Number.isFinite(years) || years <= 0) return '';
  return `${years}+ years experience`;
}

function normalizeBullets(exp) {
  const bullets = normalizeArray(exp?.bullets).map(safe).filter(Boolean);
  const highlights = normalizeArray(exp?.highlights).map(safe).filter(Boolean);
  const desc = safe(exp?.description);
  const descBullets = desc
    ? desc.split('\n').map((l) => l.trim()).filter(Boolean)
    : [];
  return [...descBullets, ...bullets, ...highlights].filter(Boolean);
}

function normalizeLanguages(langs) {
  return normalizeArray(langs)
    .map((l) => {
      if (!l) return '';
      if (typeof l === 'string') return l.trim();
      const language = safe(l.language || l.name || l.label);
      const prof = safe(l.proficiency || l.level);
      return [language, prof].filter(Boolean).join(' — ');
    })
    .filter(Boolean);
}

function normalizeCerts(certs) {
  return normalizeArray(certs)
    .map((c) => {
      if (!c) return '';
      if (typeof c === 'string') return c.trim();
      const name = safe(c.name || c.title);
      const issuer = safe(c.issuer || c.org || c.organization);
      const earned = safe(c.dateEarned || c.earned || c.date);
      const parts = [name, issuer].filter(Boolean).join(' — ');
      return earned ? `${parts} (${earned})` : parts;
    })
    .filter(Boolean);
}
// -----------------------------------------------------------

export default function ReverseDesignedPDF({ data }) {
  const work = normalizeArray(data?.workExperiences);
  const yearsExp = calcYearsExperience(work);

  const languages = normalizeLanguages(data?.languages);
  const certs = normalizeCerts(data?.certifications);

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>{data?.personalInfo?.name || ''}</Text>

        <Text style={styles.subtitle}>
          {[
            data?.personalInfo?.email,
            data?.personalInfo?.phone,
            data?.personalInfo?.location,
            data?.personalInfo?.portfolio && `Portfolio: ${data.personalInfo.portfolio}`,
          ]
            .filter(Boolean)
            .join(' | ')}
        </Text>

        {(data?.personalInfo?.targetedRole || data?.personalInfo?.role || yearsExp) && (
          <Text style={styles.subtitleTight}>
            {[data?.personalInfo?.targetedRole || data?.personalInfo?.role, yearsExp]
              .filter(Boolean)
              .join(' | ')}
          </Text>
        )}

        {data?.summary && (
          <>
            <Text style={styles.sectionTitle}>PROFESSIONAL SUMMARY</Text>
            <Text style={styles.text}>{data.summary}</Text>
          </>
        )}

        {languages.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>LANGUAGES</Text>
            <Text style={styles.text}>{languages.join(' | ')}</Text>
          </>
        )}

        {work.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>EXPERIENCE</Text>
            {work.map((exp, i) => {
              const title = safe(exp?.jobTitle || exp?.title || exp?.role || exp?.position);
              const company = safe(exp?.company || exp?.employer || exp?.organization);
              const location = safe(exp?.location);
              const range = fmtRange(exp?.startDate || exp?.start, exp?.endDate || exp?.end, exp?.current);

              const bullets = normalizeBullets(exp);

              return (
                <View key={i} style={{ marginBottom: 10 }}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.expHeaderLeft}>
                      {[title, company, location].filter(Boolean).join(' • ')}
                    </Text>
                    <Text style={styles.expHeaderRight}>{range}</Text>
                  </View>

                  {bullets.map((b, j) => (
                    <Text key={j} style={styles.bullet}>
                      • {b}
                    </Text>
                  ))}
                </View>
              );
            })}
          </>
        )}

        {data?.educationList?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>EDUCATION</Text>
            {normalizeArray(data.educationList).map((edu, i) => {
              const degree = safe(edu?.degree || edu?.program || edu?.field);
              const institution = safe(edu?.institution || edu?.school || edu?.name);
              const location = safe(edu?.location);
              const range = fmtRange(edu?.startDate || edu?.start, edu?.endDate || edu?.end);

              return (
                <View key={i} style={{ marginBottom: 8 }}>
                  {degree ? <Text style={{ fontWeight: 'bold' }}>{degree}</Text> : null}
                  <Text>{[institution, location].filter(Boolean).join(' • ')}</Text>
                  {range ? <Text>{range}</Text> : null}
                </View>
              );
            })}
          </>
        )}

        {certs.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>CERTIFICATIONS</Text>
            {certs.map((c, i) => (
              <Text key={i} style={styles.text}>
                • {c}
              </Text>
            ))}
          </>
        )}

        {data?.skills?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>SKILLS</Text>
            <View style={styles.skills}>
              {data.skills.map((s, i) => (
                <Text key={i} style={styles.skill}>
                  • {s}
                </Text>
              ))}
            </View>
          </>
        )}
      </Page>
    </Document>
  );
}
