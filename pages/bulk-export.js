// pages/bulk-export.js
import { useContext, useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import ApplySteps from '@/components/apply/ApplySteps';
import { ResumeContext } from '@/context/ResumeContext';
import { extractTextFromFile } from '@/lib/jd/ingest';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { usePlan } from '@/context/PlanContext';

const ORANGE = '#FF7043';

function Banner({ children }) {
  return (
    <div style={{
      background: '#FFF3E0',
      border: '1px solid #FFCC80',
      borderRadius: 12,
      padding: 14,
      fontSize: 15,
      color: '#E65100',
      fontWeight: 600
    }}>
      {children}
    </div>
  );
}

function Section({ title, open, onToggle, children, required = false }) {
  return (
    <div style={{
      background: 'white',
      border: '1px solid #E5E7EB',
      borderRadius: 12,
      overflow: 'hidden',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
    }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          padding: '16px 20px',
          background: required ? '#FFF7E6' : '#FAFAFA',
          textAlign: 'left',
          fontWeight: 800,
          fontSize: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <span style={{ color: required ? ORANGE : '#1F2937' }}>{title}</span>
        <span style={{ fontSize: 28, fontWeight: 300 }}>{open ? 'Minus' : 'Plus'}</span>
      </button>
      {open && <div style={{ padding: '24px 20px', borderTop: '1px solid #E5E7EB' }}>{children}</div>}
    </div>
  );
}

export default function BulkExportPage() {
  const { plan, role } = usePlan();
  const { formData, summary, experiences, educationList, skills, projects, certifications, customSections } = useContext(ResumeContext);
  const fileInputRef = useRef(null);
  const dropRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openDrop, setOpenDrop] = useState(true);

  // === PRO LOCK ===
  const allowedRoles = ['coach', 'smb-recruiter', 'enterprise-recruiter'];
  const isProSeeker = plan === 'enterprise';
  const hasAccess = isProSeeker || allowedRoles.includes(role);

  // === FILE HANDLING (HOOKS FIRST) ===
  const handleFile = async (file) => {
    if (!file || files.length >= 10) return;
    try {
      const text = await extractTextFromFile(file);
      setFiles(prev => [...prev, { file, text, name: file.name }]);
    } catch (e) {
      alert('Failed to read: ' + file.name);
    }
  };

  useEffect(() => {
    const el = dropRef.current;
    if (!el) return;
    const prevent = (e) => e.preventDefault();
    const onDrop = (e) => { prevent(e); handleFile(e.dataTransfer.files[0]); };
    el.addEventListener('dragover', prevent);
    el.addEventListener('drop', onDrop);
    return () => {
      el.removeEventListener('dragover', prevent);
      el.removeEventListener('drop', onDrop);
    };
  }, [files.length]);

  // === GENERATE BULK ZIP (DUMMY) ===
  const generateBulk = async () => {
    if (files.length === 0) return alert('Drop JDs first');
    setIsLoading(true);

    const zip = new JSZip();
    const folder = zip.folder('Eric_James_Applications');

    const resumeData = {
      personalInfo: {
        name: formData.name || 'Your Name',
        targetedRole: formData.targetedRole || '',
        email: formData.email || '',
        phone: formData.phone || '',
        location: formData.location || '',
        linkedin: formData.linkedin || '',
        github: formData.github || '',
        portfolio: formData.portfolio || '',
      },
      summary: summary || '',
      workExperiences: experiences,
      projects,
      educationList,
      certifications,
      skills,
      customSections,
    };

    for (let i = 0; i < files.length; i++) {
      const { text: jdText, name } = files[i];
      const base = name.replace(/\.[^/.]+$/, '');

      const resumeAtsText = `ATS RESUME for ${base}\n\nJD: ${jdText.slice(0, 200)}...\n\n[AI Resume Here]`;
      const coverAtsText = `Dear Hiring Manager,\n\n[AI Cover for ${base}]\n\nSincerely,\n${formData.name || 'Candidate'}`;

      folder.file(`${base}_Resume_ATS.pdf`, resumeAtsText);
      folder.file(`${base}_Resume_Designed.pdf`, resumeAtsText);
      folder.file(`${base}_Cover_ATS.pdf`, coverAtsText);
      folder.file(`${base}_Cover_Designed.pdf`, coverAtsText);
    }

    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, 'Eric_James_Applications.zip');
    setIsLoading(false);
  };

  // === RENDER: ACCESS DENIED ===
  if (!hasAccess) {
    return (
      <SeekerLayout title="Upgrade Required">
        <div style={{ padding: 40, textAlign: 'center', maxWidth: 800, margin: '0 auto' }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: ORANGE, marginBottom: 16 }}>
            Pro Feature
          </h1>
          <p style={{ fontSize: 18, margin: '20px 0', color: '#374151' }}>
            Bulk Export is available to <strong>Seeker Pro</strong>, <strong>Coaches</strong>, and <strong>SMB/Enterprise Recruiters</strong>.
          </p>
          <a
            href="/pricing"
            style={{
              background: ORANGE,
              color: 'white',
              padding: '16px 40px',
              borderRadius: 12,
              fontWeight: 800,
              textDecoration: 'none',
              display: 'inline-block',
              fontSize: 18,
              boxShadow: '0 10px 25px rgba(255,112,67,0.3)'
            }}
          >
            Upgrade to Pro
          </a>
        </div>
      </SeekerLayout>
    );
  }

  // === RENDER: MAIN UI ===
  return (
    <SeekerLayout title="Bulk Export" header={<ApplySteps current={3} />} activeNav="bulk">
      <div style={{ maxWidth: 1600, margin: '0 auto', padding: '20px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'start' }}>
        {/* LEFT */}
        <div style={{ display: 'grid', gap: 20, position: 'sticky', top: 20 }}>
          <Banner>
            Drop up to 10 JDs to Get 40 tailored PDFs in 1 ZIP to Pro Feature
          </Banner>

          <Section title="Drop Job Descriptions (Max 10)" open={openDrop} onToggle={() => setOpenDrop(v => !v)} required>
            <div style={{ display: 'grid', gap: 16 }}>
              <div
                ref={dropRef}
                onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
                onDragOver={(e) => e.preventDefault()}
                style={{
                  border: '3px dashed #D1D5DB',
                  borderRadius: 16,
                  padding: 40,
                  textAlign: 'center',
                  background: files.length > 0 ? '#F0FDF4' : '#FAFAFA'
                }}
              >
                <p style={{ fontWeight: 700, fontSize: 18 }}>Drop JDs here</p>
                <p style={{ fontSize: 14, color: '#6B7280' }}>
                  or <button onClick={() => fileInputRef.current?.click()} style={{ color: ORANGE, background: 'none', border: 0, fontWeight: 800, textDecoration: 'underline', cursor: 'pointer' }}>upload</button>
                </p>
                <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" onChange={e => handleFile(e.target.files?.[0])} style={{ display: 'none' }} />
              </div>

              {files.length > 0 && (
                <div style={{ display: 'grid', gap: 8 }}>
                  {files.map((f, i) => (
                    <div key={i} style={{ padding: '8px 12px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, fontSize: 13, color: '#166534', fontWeight: 600 }}>
                      {f.name} to {f.text.split(/\s+/).length} words
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={generateBulk}
                disabled={isLoading || files.length === 0}
                style={{
                  width: '100%',
                  background: isLoading ? '#9CA3AF' : ORANGE,
                  color: 'white',
                  padding: 18,
                  borderRadius: 12,
                  fontWeight: 800,
                  fontSize: 18,
                  border: 'none',
                  cursor: isLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {isLoading ? 'Generating 40 PDFs...' : `Generate ZIP (${files.length} JDs)`}
              </button>
            </div>
          </Section>
        </div>

        {/* RIGHT: PREVIEW */}
        <div style={{ position: 'sticky', top: 20 }}>
          <div style={{ background: '#263238', color: 'white', padding: '16px 32px', fontWeight: 800, fontSize: 18, textAlign: 'center', borderRadius: '16px 16px 0 0' }}>
            LIVE OUTPUT PREVIEW
          </div>
          <div style={{ background: 'white', padding: 40, borderRadius: '0 0 16px 16px', boxShadow: '0 20px 50px rgba(0,0,0,0.15)', minHeight: 600 }}>
            {files.length > 0 ? (
              <p style={{ color: '#6B7280', fontStyle: 'italic' }}>
                AI will generate 4 PDFs per JD: ATS Resume, Designed Resume, ATS Cover, Designed Cover
              </p>
            ) : (
              <p style={{ color: '#9CA3AF', textAlign: 'center', marginTop: 100 }}>
                Drop JDs to see preview
              </p>
            )}
          </div>
        </div>
      </div>
    </SeekerLayout>
  );
}