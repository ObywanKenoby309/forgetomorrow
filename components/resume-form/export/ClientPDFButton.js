// components/resume-form/export/ClientPDFButton.js
import React, { useContext, useState, useMemo } from 'react';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { Document as DocxDocument, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';

import StyledResumePDF from './StyledResumePDF';
import { ResumeContext } from '../../../context/ResumeContext';

/* ----------------- helpers ----------------- */
function fileSafeName(name) {
  if (!name) return 'Resume';
  return String(name).trim().replace(/\s+/g, '_').replace(/[^A-Za-z0-9_\-]/g, '');
}
function formatLocal(dt) {
  if (!dt) return '';
  try {
    const d = typeof dt === 'string' ? new Date(dt) : dt;
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(d);
  } catch {
    return '';
  }
}

/* ----------------- minimal designed (Reverse/Hybrid) PDFs ----------------- */
/* Keep these lightweight and robust. */
const designed = StyleSheet.create({
  page: { padding: 36, fontSize: 11, lineHeight: 1.4 },
  h1: { fontSize: 16, fontWeight: 700, marginBottom: 2 },
  meta: { color: '#455A64', marginBottom: 8 },
  h2: { fontSize: 12, fontWeight: 700, color: '#37474F', marginTop: 6, marginBottom: 4 },
  li: { marginLeft: 12, marginBottom: 2 },
  row: { marginBottom: 6 },
  hr: { borderBottomWidth: 1, borderBottomColor: '#E0E0E0', marginVertical: 8 },
});
function ReversePDF({
  formData = {}, summary = '', experiences = [], projects = [],
  volunteerExperiences = [], educationList = [], certifications = [],
  languages = [], skills = [], achievements = [], customSections = [],
}) {
  const name = formData?.fullName || formData?.name || 'Your Name';
  const meta = [formData?.location, formData?.email, formData?.phone, formData?.portfolio]
    .filter(Boolean).join(' • ');

  return (
    <Document>
      <Page size="LETTER" style={designed.page}>
        <Text style={designed.h1}>{name}</Text>
        {meta ? <Text style={designed.meta}>{meta}</Text> : null}

        {summary ? (<><Text style={designed.h2}>Professional Summary</Text><Text>{summary}</Text><View style={designed.hr} /></>) : null}

        {!!experiences?.length && (
          <>
            <Text style={designed.h2}>Work Experience</Text>
            {experiences.map((e, i) => (
              <View key={i} style={designed.row}>
                <Text>{(e?.title || e?.jobTitle || 'Role')}{e?.company ? `, ${e.company}` : ''}</Text>
                <Text style={designed.meta}>
                  {[e?.location, e?.dateRange || e?.range || `${e?.startDate || ''} – ${e?.endDate || 'Present'}`]
                    .filter(Boolean).join(' • ')}
                </Text>
                {(e?.highlights || e?.bullets || (e?.description ? String(e.description).split('\n') : []))
                  .map((b, j) => <Text key={j} style={designed.li}>• {b}</Text>)}
              </View>
            ))}
            <View style={designed.hr} />
          </>
        )}

        {!!projects?.length && (
          <>
            <Text style={designed.h2}>Projects</Text>
            {projects.map((p, i) =>
              <Text key={i} style={designed.li}>• {(p?.title || p?.name || 'Project')}{p?.description ? ` — ${p.description}` : ''}</Text>
            )}
            <View style={designed.hr} />
          </>
        )}

        {!!educationList?.length && (
          <>
            <Text style={designed.h2}>Education</Text>
            {educationList.map((ed, i) => (
              <View key={i} style={designed.row}>
                <Text>{(ed?.degree || ed?.program || '')}{ed?.school ? `, ${ed.school}` : (ed?.institution ? `, ${ed.institution}` : '')}</Text>
                <Text style={designed.meta}>{[ed?.startDate, ed?.endDate].filter(Boolean).join(' – ')}</Text>
                {ed?.description ? <Text>{ed.description}</Text> : null}
              </View>
            ))}
            <View style={designed.hr} />
          </>
        )}

        {!!languages?.length && (
          <>
            <Text style={designed.h2}>Languages</Text>
            {languages.map((l, i) => {
              const obj = typeof l === 'string' ? { language: l } : l || {};
              const detail = [obj.proficiency || null, obj.years ? `${obj.years} years` : null].filter(Boolean).join(' | ');
              return <Text key={i} style={designed.li}>• {obj.language || 'Language'}{detail ? ` | ${detail}` : ''}</Text>;
            })}
            <View style={designed.hr} />
          </>
        )}

        {!!skills?.length && (<><Text style={designed.h2}>Skills</Text><Text>{skills.join(', ')}</Text></>)}
      </Page>
    </Document>
  );
}
const hybrid = StyleSheet.create({
  twoCol: { display: 'flex', flexDirection: 'row', gap: 12 },
  left: { width: '36%' },
  right: { width: '64%' },
});
function HybridPDF(props) {
  const {
    formData = {}, summary = '', experiences = [], educationList = [],
    languages = [], skills = [], projects = [],
  } = props;

  const name = formData?.fullName || formData?.name || 'Your Name';
  const meta = [formData?.location, formData?.email, formData?.phone, formData?.portfolio]
    .filter(Boolean).join(' • ');

  return (
    <Document>
      <Page size="LETTER" style={designed.page}>
        <Text style={designed.h1}>{name}</Text>
        {meta ? <Text style={designed.meta}>{meta}</Text> : null}

        <View style={hybrid.twoCol}>
          {/* LEFT */}
          <View style={hybrid.left}>
            {!!summary && (<><Text style={designed.h2}>Summary</Text><Text>{summary}</Text><View style={designed.hr} /></>)}
            {!!skills?.length && (<><Text style={designed.h2}>Skills</Text><Text>{skills.join(', ')}</Text><View style={designed.hr} /></>)}
            {!!languages?.length && (
              <>
                <Text style={designed.h2}>Languages</Text>
                {languages.map((l, i) => {
                  const obj = typeof l === 'string' ? { language: l } : l || {};
                  const detail = [obj.proficiency || null, obj.years ? `${obj.years} years` : null].filter(Boolean).join(' | ');
                  return <Text key={i} style={designed.li}>• {obj.language || 'Language'}{detail ? ` | ${detail}` : ''}</Text>;
                })}
                <View style={designed.hr} />
              </>
            )}
            {!!educationList?.length && (
              <>
                <Text style={designed.h2}>Education</Text>
                {educationList.map((ed, i) => (
                  <View key={i} style={designed.row}>
                    <Text>{(ed?.degree || ed?.program || '')}{ed?.school ? `, ${ed.school}` : (ed?.institution ? `, ${ed.institution}` : '')}</Text>
                    <Text style={designed.meta}>{[ed?.startDate, ed?.endDate].filter(Boolean).join(' – ')}</Text>
                  </View>
                ))}
              </>
            )}
          </View>

          {/* RIGHT */}
          <View style={hybrid.right}>
            {!!experiences?.length && (
              <>
                <Text style={designed.h2}>Experience</Text>
                {experiences.map((e, i) => (
                  <View key={i} style={designed.row}>
                    <Text>{(e?.title || e?.jobTitle || 'Role')}{e?.company ? `, ${e.company}` : ''}</Text>
                    <Text style={designed.meta}>
                      {[e?.location, e?.dateRange || e?.range || `${e?.startDate || ''} – ${e?.endDate || 'Present'}`]
                        .filter(Boolean).join(' • ')}
                    </Text>
                    {(e?.highlights || e?.bullets || (e?.description ? String(e.description).split('\n') : []))
                      .map((b, j) => <Text key={j} style={designed.li}>• {b}</Text>)}
                  </View>
                ))}
              </>
            )}

            {!!projects?.length && (
              <>
                <Text style={designed.h2}>Projects</Text>
                {projects.map((p, i) =>
                  <Text key={i} style={designed.li}>• {(p?.title || p?.name || 'Project')}{p?.description ? ` — ${p.description}` : ''}</Text>
                )}
              </>
            )}
          </View>
        </View>
      </Page>
    </Document>
  );
}
function TemplatePDF({ templateId = 'reverse', ...props }) {
  return templateId === 'hybrid' ? <HybridPDF {...props} /> : <ReversePDF {...props} />;
}

/* ----------------- component ----------------- */
export default function ClientPDFButton({
  templateId = 'reverse', // 'reverse' | 'hybrid'
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
  className,
}) {
  const { resumes, setResumes, lastAutosaveAt, setSaveEventAt } =
    useContext(ResumeContext) || {};
  const [saving, setSaving] = useState(false);
  const [lastManualSaveAt, setLastManualSaveAt] = useState(null);

  const baseName = fileSafeName(formData?.fullName);
  const designedPdfName = `${baseName}_Resume.pdf`;
  const atsPdfName = `${baseName}_Resume_ATS.pdf`;

  /* --------- Word export (template-aware section order) ---------- */
  const exportWord = async () => {
    const orderReverse = ['summary', 'experience', 'projects', 'education', 'languages', 'skills', 'achievements', 'certifications', 'volunteer', 'custom'];
    const orderHybrid  = ['summary', 'skills', 'languages', 'education', 'experience', 'projects', 'achievements', 'certifications', 'volunteer', 'custom'];
    const order = templateId === 'hybrid' ? orderHybrid : orderReverse;

    const parts = [];

    // Header
    parts.push(
      new Paragraph({
        children: [new TextRun({ text: formData?.fullName || 'Your Name', bold: true, size: 32 })],
      })
    );
    if (formData?.email) parts.push(new Paragraph(formData.email));
    if (formData?.phone) parts.push(new Paragraph(formData.phone));
    if (formData?.location) parts.push(new Paragraph(formData.location));
    if (formData?.portfolio) parts.push(new Paragraph(formData.portfolio));
    parts.push(new Paragraph(''));

    const addH2 = (t) =>
      parts.push(new Paragraph({ children: [new TextRun({ text: t, bold: true, size: 24 })] }));
    const addLine = (t) => parts.push(new Paragraph(t || ''));

    for (const sec of order) {
      if (sec === 'summary' && summary) {
        addH2('Professional Summary'); addLine(summary);
      }
      if (sec === 'skills' && skills?.length) {
        addH2('Skills'); addLine(skills.join(', '));
      }
      if (sec === 'languages' && languages?.length) {
        addH2('Languages');
        languages.forEach((l) => {
          const obj = typeof l === 'string' ? { language: l } : l || {};
          const detail = [obj.proficiency || null, obj.years ? `${obj.years} years` : null].filter(Boolean).join(' | ');
          addLine(`• ${obj.language || 'Language'}${detail ? ` | ${detail}` : ''}`);
        });
      }
      if (sec === 'education' && educationList?.length) {
        addH2('Education');
        educationList.forEach((ed) => {
          const name = ed?.degree || ed?.program || '';
          const inst = ed?.school || ed?.institution || '';
          const dates = [ed?.startDate, ed?.endDate].filter(Boolean).join(' – ');
          addLine(`• ${name}${inst ? `, ${inst}` : ''}${dates ? ` (${dates})` : ''}`);
          if (ed?.description) addLine(ed.description);
        });
      }
      if (sec === 'experience' && experiences?.length) {
        addH2('Experience');
        experiences.forEach((e) => {
          addLine(`${e?.title || e?.jobTitle || 'Role'}${e?.company ? `, ${e.company}` : ''}`);
          const meta = [e?.location, e?.dateRange || e?.range || `${e?.startDate || ''} – ${e?.endDate || 'Present'}`]
            .filter(Boolean).join(' • ');
          if (meta) addLine(meta);
          (e?.highlights || e?.bullets || (e?.description ? String(e.description).split('\n') : []))
            .forEach((b) => addLine(`• ${b}`));
        });
      }
      if (sec === 'projects' && projects?.length) {
        addH2('Projects');
        projects.forEach((p) => addLine(`• ${(p?.title || p?.name || 'Project')}${p?.description ? ` — ${p.description}` : ''}`));
      }
      if (sec === 'achievements' && achievements?.length) {
        addH2('Achievements & Awards');
        achievements.forEach((a) => addLine(`• ${a?.title || ''}${a?.description ? ` — ${a.description}` : ''}`));
      }
      if (sec === 'certifications' && certifications?.length) {
        addH2('Certifications & Training');
        certifications.forEach((c) => {
          const line = [c?.name || c, c?.issuer || null, c?.dateEarned ? `Earned: ${c.dateEarned}` : null, c?.expirationDate ? `Expires: ${c.expirationDate}` : null]
            .filter(Boolean).join(' • ');
          addLine(`• ${line}`);
        });
      }
      if (sec === 'volunteer' && volunteerExperiences?.length) {
        addH2('Volunteer Experience');
        volunteerExperiences.forEach((v) => {
          const head = [v?.role, v?.organization].filter(Boolean).join(', ');
          const dates = [v?.startDate, v?.endDate].filter(Boolean).join(' – ');
          addLine(`• ${head}${dates ? ` (${dates})` : ''}`);
          if (v?.description) addLine(v.description);
        });
      }
      if (sec === 'custom' && customSections?.length) {
        customSections.forEach((s) => {
          if (s?.title) addH2(s.title);
          if (s?.content) addLine(s.content);
        });
      }
    }

    const doc = new DocxDocument({ sections: [{ children: parts }] });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${baseName}_Resume.docx`);
  };

  /* --------- Plain text export ---------- */
  const exportPlainText = () => {
    let text = `${formData?.fullName || 'Your Name'}\n`;
    text += [formData?.email, formData?.phone, formData?.location, formData?.portfolio]
      .filter(Boolean).join(' • ') + '\n\n';
    if (summary) text += `Professional Summary:\n${summary}\n\n`;
    if (skills?.length) text += `Skills:\n${skills.join(', ')}\n\n`;

    const element = document.createElement('a');
    const file = new Blob([text], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${baseName}_Resume.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  /* --------- Save snapshot ---------- */
  const saveResume = () => {
    try {
      setSaving(true);
      const id = `res-${Date.now()}`;
      const snapshot = {
        id,
        fullName: formData?.fullName || 'Untitled Resume',
        summary: summary || '',
        updatedAt: new Date().toISOString(),
        formData: { ...(formData || {}) },
        experiences: [...(experiences || [])],
        projects: [...(projects || [])],
        volunteerExperiences: [...(volunteerExperiences || [])],
        educationList: [...(educationList || [])],
        certifications: [...(certifications || [])],
        languages: [...(languages || [])],
        skills: [...(skills || [])],
        achievements: [...(achievements || [])],
        customSections: [...(customSections || [])],
        templateId, // keep user’s chosen template
      };

      const next = [snapshot, ...(Array.isArray(resumes) ? resumes : [])];
      if (typeof window !== 'undefined') {
        try { localStorage.setItem('ft_saved_resumes', JSON.stringify(next)); } catch {}
      }
      if (setResumes) setResumes(next);

      const now = new Date();
      setLastManualSaveAt(now);
      if (setSaveEventAt) setSaveEventAt(now.toISOString());
    } finally {
      setSaving(false);
    }
  };

  const lastSavedDisplay = useMemo(() => {
    const a = lastAutosaveAt ? new Date(lastAutosaveAt).getTime() : 0;
    const m = lastManualSaveAt ? lastManualSaveAt.getTime() : 0;
    const latest = Math.max(a, m);
    return latest ? formatLocal(new Date(latest)) : null;
  }, [lastAutosaveAt, lastManualSaveAt]);

  const primaryBtn = className || 'bg-[#FF7043] hover:bg-[#F4511E] text-white py-2 px-4 rounded';
  const atsBtn = 'bg-[#0F766E] hover:bg-[#115E59] text-white py-2 px-4 rounded';
  const saveBtn = saving
    ? 'bg-gray-400 text-white py-2 px-4 rounded cursor-not-allowed'
    : 'bg-[#2E7D32] hover:bg-[#1B5E20] text-white py-2 px-4 rounded';

  const commonProps = {
    formData, summary, experiences, projects, volunteerExperiences,
    educationList, certifications, languages, skills, achievements, customSections,
  };

  return (
    <div className="mt-4 flex flex-col items-center gap-2">
      <div className="flex gap-4 justify-center items-center flex-wrap">
        {/* ATS PDF (neutral, single-column) */}
        <PDFDownloadLink
          document={<StyledResumePDF {...commonProps} />}
          fileName={atsPdfName}
          className={atsBtn}
        >
          {({ loading }) => (loading ? 'Preparing ATS PDF…' : 'Download ATS PDF')}
        </PDFDownloadLink>

        {/* Designed PDF (matches selected template) */}
        <PDFDownloadLink
          document={<TemplatePDF templateId={templateId} {...commonProps} />}
          fileName={designedPdfName}
          className={primaryBtn}
        >
          {({ loading }) => (loading ? 'Preparing PDF…' : 'Download Designed PDF')}
        </PDFDownloadLink>

        <button onClick={exportWord} className={primaryBtn}>
          Export Word
        </button>

        <button onClick={exportPlainText} className={primaryBtn}>
          Export Text
        </button>

        <button
          onClick={saveResume}
          disabled={saving}
          className={saveBtn}
          title="Save this version so you can analyze or export later"
        >
          {saving ? 'Saving…' : 'Save Resume'}
        </button>
      </div>

      <div className="text-sm text-gray-600 h-5">
        {lastSavedDisplay ? `Last saved: ${lastSavedDisplay}` : 'Not saved yet'}
      </div>
    </div>
  );
}
