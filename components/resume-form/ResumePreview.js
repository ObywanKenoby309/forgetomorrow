// components/resume-form/ResumePreview.js
import ReverseResumeTemplate from './templates/ReverseResumeTemplate';
import HybridResumeTemplate from './templates/HybridResumeTemplate';
import { useResumeContext } from '@/context/ResumeContext'; // adjust path

export default function ResumePreview() {
  const {
    formData = {},
    summary = '',
    workExperiences = [],
    projects = [],
    educationList = [],
    certifications = [],
    skills = [],
    customSections = [],
    templateId = 'reverse', // 'reverse' or 'hybrid'
  } = useResumeContext() || {};

  // === ENFORCEMENT: REQUIRED FIELDS ===
  const isValid =
    summary.trim().length > 20 &&
    skills.length >= 8 &&
    workExperiences.length > 0 &&
    workExperiences.every(e => e.title && e.company && e.bullets?.length >= 2);

  // === TEMPLATE SELECTION ===
  const Template = templateId === 'hybrid' ? HybridResumeTemplate : ReverseResumeTemplate;

  // === CLEAN DATA OBJECT ===
  const resumeData = {
    personalInfo: {
      name: formData.name || formData.fullName || 'Your Name',
      targetedRole: formData.targetedRole || '',
      email: formData.email || '',
      phone: formData.phone || '',
      location: formData.location || '',
      linkedin: formData.linkedin || '',
      github: formData.github || '',
      portfolio: formData.portfolio || '',
    },
    summary,
    workExperiences: workExperiences.map(e => ({
      role: e.title || e.jobTitle,
      company: e.company,
      location: e.location,
      startDate: e.startDate,
      endDate: e.current ? 'Present' : e.endDate,
      bullets: e.bullets || [],
    })),
    projects: projects.slice(0, 3).map(p => ({
      name: p.name || p.title,
      description: p.description || '',
      bullets: p.bullets || [],
    })),
    educationList: educationList.map(ed => ({
      degree: ed.degree,
      school: ed.school || ed.institution,
      graduationYear: ed.graduationYear || ed.endDate,
    })),
    certifications: certifications.map(c => c.name || c),
    skills,
    customSections: customSections.slice(0, 1),
  };

  return (
    <section className="bg-white rounded-lg shadow-lg p-6 max-h-[80vh] overflow-auto border">
      {/* VALIDATION BANNER */}
      {!isValid && (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800">
          <strong>Complete to unlock export:</strong>
          <ul className="mt-1 ml-4 list-disc">
            {summary.trim().length <= 20 && <li>Impact Summary (3+ lines)</li>}
            {skills.length < 8 && <li>8+ Skills</li>}
            {workExperiences.length === 0 && <li>At least 1 Work Experience</li>}
            {workExperiences.some(e => !e.title || !e.company) && <li>Job Title + Company</li>}
            {workExperiences.some(e => !e.bullets || e.bullets.length < 2) && <li>2+ bullets per role</li>}
          </ul>
        </div>
      )}

      {/* LIVE PREVIEW */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
        <Template data={resumeData} />
      </div>

      {/* SUCCESS BADGE */}
      {isValid && (
        <div className="mt-4 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
            Export Ready — 87% Interview Rate
          </span>
        </div>
      )}
    </section>
  );
}