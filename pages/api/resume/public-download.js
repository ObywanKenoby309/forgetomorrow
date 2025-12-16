// pages/api/resume/public-download.js
import { prisma } from '@/lib/prisma';
import {
  pdf,
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';

// ✅ NEW: session gating for PUBLIC vs RECRUITERS_ONLY vs PRIVATE
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  contact: {
    fontSize: 10,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 4,
  },
  text: {
    fontSize: 10,
    marginBottom: 2,
  },
  bullet: {
    fontSize: 10,
    marginLeft: 10,
    marginBottom: 2,
  },
});

function PublicResumePdf({ data }) {
  const {
    personalInfo,
    summary,
    workExperiences = [],
    educationList = [],
    certifications = [],
    skills = [],
  } = data;

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <Text style={styles.name}>{personalInfo.name || 'Your Name'}</Text>
        <Text style={styles.contact}>
          {[
            personalInfo.email,
            personalInfo.phone,
            personalInfo.location,
            personalInfo.ftProfile,
          ]
            .filter(Boolean)
            .join(' • ')}
        </Text>

        {/* Summary */}
        {summary && summary.trim() && (
          <View>
            <Text style={styles.sectionTitle}>SUMMARY</Text>
            <Text style={styles.text}>{summary}</Text>
          </View>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>SKILLS</Text>
            <Text style={styles.text}>{skills.join(', ')}</Text>
          </View>
        )}

        {/* Experience */}
        {workExperiences.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>EXPERIENCE</Text>
            {workExperiences.map((exp, idx) => (
              <View key={idx} style={{ marginBottom: 4 }}>
                <Text style={styles.text}>
                  {(exp.title || exp.jobTitle || 'Role') +
                    (exp.company ? ` – ${exp.company}` : '')}
                </Text>
                <Text style={styles.text}>
                  {[
                    exp.location,
                    exp.startDate,
                    exp.endDate || (exp.current ? 'Present' : ''),
                  ]
                    .filter(Boolean)
                    .join(' • ')}
                </Text>
                {Array.isArray(exp.bullets) &&
                  exp.bullets.map((b, i) => (
                    <Text key={i} style={styles.bullet}>
                      • {b}
                    </Text>
                  ))}
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {educationList.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>EDUCATION</Text>
            {educationList.map((edu, idx) => (
              <View key={idx} style={{ marginBottom: 4 }}>
                <Text style={styles.text}>
                  {(edu.degree || edu.field || 'Program') +
                    (edu.school || edu.institution
                      ? ` – ${edu.school || edu.institution}`
                      : '')}
                </Text>
                <Text style={styles.text}>
                  {[edu.location, edu.startDate, edu.endDate]
                    .filter(Boolean)
                    .join(' • ')}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>CERTIFICATIONS</Text>
            {certifications.map((cert, idx) => (
              <Text key={idx} style={styles.text}>
                {cert.name}
                {cert.issuer ? ` – ${cert.issuer}` : ''}
              </Text>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { slug } = req.query || {};

    if (!slug || typeof slug !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid slug' });
    }

    // ✅ NEW: session gating
    const session = await getServerSession(req, res, authOptions);
    const viewerEmail = session?.user?.email ? String(session.user.email) : null;

    // Find user + primary resume by slug
    const user = await prisma.user.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,

        // ✅ visibility fields
        isProfilePublic: true,
        profileVisibility: true, // PRIVATE | PUBLIC | RECRUITERS_ONLY

        resumes: {
          where: { isPrimary: true },
          orderBy: { updatedAt: 'desc' },
          take: 1,
          select: {
            id: true,
            name: true,
            content: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // ✅ NEW: normalize legacy boolean into enum behavior (back-compat)
    const effectiveVisibility =
      user.profileVisibility || (user.isProfilePublic ? 'PUBLIC' : 'PRIVATE');

    // ✅ NEW: viewer role lookup (only if logged in)
    let viewerRole = null;
    if (viewerEmail) {
      const viewer = await prisma.user.findUnique({
        where: { email: viewerEmail },
        select: { role: true, email: true },
      });
      viewerRole = viewer?.role || null;
    }

    const isOwner =
      Boolean(viewerEmail) &&
      Boolean(user.email) &&
      String(user.email).toLowerCase() === String(viewerEmail).toLowerCase();

    const isAdmin = viewerRole === 'ADMIN';
    const isRecruiter = viewerRole === 'RECRUITER';

    const allowed =
      effectiveVisibility === 'PUBLIC'
        ? true
        : effectiveVisibility === 'RECRUITERS_ONLY'
        ? (isOwner || isAdmin || isRecruiter)
        : (isOwner || isAdmin); // PRIVATE

    if (!allowed) {
      // stealth 404 prevents slug enumeration
      return res.status(404).json({ error: 'Not found' });
    }

    const primaryResume =
      user.resumes && user.resumes.length > 0 ? user.resumes[0] : null;

    if (!primaryResume) {
      return res.status(404).json({ error: 'No primary resume found' });
    }

    if (!primaryResume.content) {
      return res.status(400).json({ error: 'Resume has no saved content' });
    }

    let builderData;
    try {
      builderData =
        typeof primaryResume.content === 'string'
          ? JSON.parse(primaryResume.content)
          : primaryResume.content;
    } catch (err) {
      console.error('[public-download] Failed to parse resume.content', err);
      return res
        .status(500)
        .json({ error: 'Failed to parse stored resume content' });
    }

    const fd = builderData.formData || {};

    // Map builder data -> PDF data shape
    const resumeData = {
      personalInfo: {
        name: fd.fullName || fd.name || user.name || 'Your Name',
        targetedRole: fd.targetedRole || '',
        email: fd.email || '',
        phone: fd.phone || '',
        location: fd.location || '',
        linkedin: fd.linkedin || '',
        github: fd.github || '',
        portfolio: fd.portfolio || '',
        ftProfile: fd.forgeUrl || fd.ftProfile || '',
      },
      summary: builderData.summary || '',
      workExperiences: builderData.experiences || [],
      projects: builderData.projects || [],
      educationList: builderData.educationList || [],
      certifications: builderData.certifications || [],
      skills: builderData.skills || [],
      customSections: builderData.customSections || [],
    };

    const baseName =
      (primaryResume.name && primaryResume.name.trim()) ||
      (user.name && `${user.name.replace(/\s+/g, '_')}_Resume`) ||
      'resume';

    const safeName = baseName.replace(/[^a-z0-9_\-]+/gi, '_');

    const doc = pdf(<PublicResumePdf data={resumeData} />);
    const pdfBuffer = await doc.toBuffer();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${safeName}.pdf"`
    );

    return res.status(200).send(pdfBuffer);
  } catch (err) {
    console.error('[api/resume/public-download] error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
