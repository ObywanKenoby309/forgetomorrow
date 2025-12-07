// pages/api/resume/public-download.js
import { prisma } from '@/lib/prisma';
import { pdf } from '@react-pdf/renderer';
// Use your PDF resume template (hybrid or reverse)
import ReverseResumeTemplatePDF from '@/components/resume-form/templates/ReverseResumeTemplate.pdf';

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

    // 1) Find user by slug, ensure profile is public
    const user = await prisma.user.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        isProfilePublic: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.isProfilePublic) {
      // Safety: don't leak resumes for private profiles
      return res.status(403).json({ error: 'Profile is not public' });
    }

    // 2) Find primary resume for this user
    const resume = await prisma.resume.findFirst({
      where: { userId: user.id, isPrimary: true },
      orderBy: { updatedAt: 'desc' },
    });

    if (!resume) {
      return res.status(404).json({ error: 'No primary resume found' });
    }

    // 3) Parse stored JSON content
    let parsed = {};
    try {
      parsed = resume.content ? JSON.parse(resume.content) : {};
    } catch {
      parsed = {};
    }

    const {
      formData = {},
      summary = '',
      experiences = [],
      projects = [],
      educationList = [],
      certifications = [],
      skills = [],
      customSections = [],
    } = parsed;

    // 4) Map to the PDF template data shape
    const resumeData = {
      personalInfo: {
        name: formData.fullName || formData.name || user.name || 'Your Name',
        targetedRole: formData.targetedRole || '',
        email: formData.email || '',
        phone: formData.phone || '',
        location: formData.location || '',
        linkedin: formData.linkedin || '',
        github: formData.github || '',
        portfolio: formData.portfolio || '',
        ftProfile: formData.forgeUrl || formData.ftProfile || '',
      },
      summary,
      workExperiences: experiences,
      projects,
      educationList,
      certifications,
      skills,
      customSections,
    };

    // 5) Build PDF
    const baseName =
      (resume.name && resume.name.trim()) ||
      (user.name && `${user.name}-resume`) ||
      'resume';

    const safeName = baseName.replace(/[^a-z0-9_\-]+/gi, '_') + '.pdf';

    const doc = <ReverseResumeTemplatePDF data={resumeData} />;

    // Generate a PDF buffer
    const pdfInstance = pdf(doc);
    const pdfBuffer = await pdfInstance.toBuffer();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);

    return res.status(200).send(pdfBuffer);
  } catch (err) {
    console.error('[api/resume/public-download] error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
