// pages/cover/create.js
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import CoverSideRail from '@/components/cover/CoverSideRail';
import CoverPreviewModal from '@/components/cover/CoverPreviewModal';
import { applyCoverTemplate } from '@/lib/templates/applyCoverTemplate';

// Template registry + matcher
import { coverTemplates, getCoverTemplateComponent } from '@/lib/templates';
import { matchTemplate } from '@/lib/ai/matchTemplate';

// ATS modal (reused from resume)
import AtsPreviewModal from '@/components/resume-form/AtsPreviewModal';

// AI writer used by the “Tailor with AI” button
import { writeCover } from '@/lib/ai/writeCover';

// Stepper for the unified flow (always visible now)
import ApplySteps from '@/components/apply/ApplySteps';

function Field({ label, children }) {
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: '#607D8B' }}>{label}</label>
      {children}
    </div>
  );
}
function TextInput(props) {
  return (
    <input
      {...props}
      style={{
        border: '1px solid #E0E0E0',
        borderRadius: 10,
        padding: '10px 12px',
        outline: 'none',
        ...props.style,
      }}
    />
  );
}
function TextArea(props) {
  return (
    <textarea
      {...props}
      style={{
        border: '1px solid #E0E0E0',
        borderRadius: 10,
        padding: '10px 12px',
        minHeight: 100,
        outline: 'none',
        ...props.style,
      }}
    />
  );
}
function GhostButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: 'white',
        border: '1px solid #E0E0E0',
        borderRadius: 10,
        padding: '8px 12px',
        fontWeight: 800,
        color: '#37474F',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}
function PrimaryButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: '#FF7043',
        color: 'white',
        border: '1px solid rgba(0,0,0,0.06)',
        borderRadius: 10,
        padding: '10px 14px',
        fontWeight: 800,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

function CoverPreview({ fields }) {
  return (
    <div style={{ background: 'white', border: '1px solid #eee', borderRadius: 12, padding: 24 }}>
      <div style={{ color: '#263238', fontSize: 14 }}>
        {fields.signatureContact && (
          <div style={{ marginBottom: 12, color: '#607D8B' }}>{fields.signatureContact}</div>
        )}
        {(fields.recipient || fields.company) && (
          <div style={{ marginBottom: 6 }}>
            {fields.recipient && <div>{fields.recipient}</div>}
            {fields.company && <div>{fields.company}</div>}
          </div>
        )}
        <div style={{ margin: '12px 0' }}>{fields.greeting}</div>
        {fields.opening && <p style={{ margin: '8px 0' }}>{fields.opening}</p>}
        {Array.isArray(fields.body) &&
          fields.body.map((b, i) => (
            <p key={i} style={{ margin: '8px 0' }}>
              • {b}
            </p>
          ))}
        {fields.valueProp && <p style={{ margin: '8px 0' }}>{fields.valueProp}</p>}
        {fields.closing && <p style={{ margin: '12px 0' }}>{fields.closing}</p>}
        <div style={{ margin: '12px 0' }}>
          {fields.signoff}
          <br />
          {fields.signatureName && <strong>{fields.signatureName}</strong>}
        </div>
      </div>
    </div>
  );
}

export default function CoverCreatePage() {
  const router = useRouter();
  const seededRef = useRef(false);
  const initialMountRef = useRef(true); // ← prevents reseed on first render

  // unified flow: default on
  const [jd, setJd] = useState('');
  const [useSavedJd, setUseSavedJd] = useState(true);
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ft_last_job_text') || '';
      setJd(saved);
    } catch {}
  }, []);

  // selected cover template + lazy component
  const [coverId, setCoverId] = useState(() => String(router.query?.template || 'concise'));
  const [CoverComp, setCoverComp] = useState(null);

  // include cover on resume export toggle (persisted)
  const [includeWithResume, setIncludeWithResume] = useState(() => {
    try {
      return localStorage.getItem('ft_merge_cover_with_resume') === '1';
    } catch {
      return false;
    }
  });

  // client-only "Last saved" label to avoid hydration mismatch
  const [lastSavedLabel, setLastSavedLabel] = useState('');
  useEffect(() => {
    setLastSavedLabel(`Last saved: ${new Date().toLocaleString()}`);
  }, []);

  const [fields, setFields] = useState({
    recipient: '',
    company: '',
    role: '',
    greeting: 'Dear Hiring Manager,',
    opening: '',
    body: [''],
    valueProp: '',
    closing: '',
    signoff: 'Sincerely,',
    signatureName: '',
    signatureContact: '',
  });

  // Modals
  const [openAtsPreview, setOpenAtsPreview] = useState(false);
  const [openLivePreview, setOpenLivePreview] = useState(false);

  // Seed from ?template= on the very first load, if fields are blank
  useEffect(() => {
    const t = router.query?.template;
    if (!t || seededRef.current) {
      if (t) setCoverId(String(t));
      return;
    }
    const isBlank =
      !fields.opening &&
      (!fields.body || fields.body.every((l) => !l)) &&
      !fields.valueProp &&
      !fields.closing &&
      !fields.signatureName &&
      !fields.signatureContact;
    if (!isBlank) {
      setCoverId(String(t));
      return;
    }
    const profile = { name: '', targetRole: '' };
    const doc = applyCoverTemplate(String(t), profile);
    if (doc?.fields) {
      // initial seed uses all template fields
      setFields((prev) => ({ ...prev, ...doc.fields }));
      seededRef.current = true;
      setCoverId(String(t));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query?.template]);

  // Load template component
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const Comp = await getCoverTemplateComponent(coverId || 'concise');
        if (mounted) setCoverComp(() => Comp);
      } catch {
        if (mounted) setCoverComp(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [coverId]);

  // Helper: reseed *format* fields from a template while preserving user specifics
  const applyTemplateToFields = (templateId) => {
    const doc = applyCoverTemplate(String(templateId), {
      name: fields.signatureName || '',
      targetRole: fields.role || '',
    });
    const d = doc?.fields || {};

    setFields((prev) => ({
      // preserve user specifics
      recipient: prev.recipient,
      company: prev.company,
      role: prev.role,
      signatureName: prev.signatureName,
      signatureContact: prev.signatureContact,
      // replace template-driven format parts
      greeting: d.greeting || prev.greeting,
      opening: d.opening || '',
      body: Array.isArray(d.body) ? d.body : [],
      valueProp: d.valueProp || '',
      closing: d.closing || '',
      signoff: d.signoff || prev.signoff || '',
    }));
  };

  // Reseed on any *subsequent* template change (dropdown, AI pick, URL change)
  useEffect(() => {
    if (initialMountRef.current) {
      initialMountRef.current = false;
      return; // skip reseed on very first render
    }
    applyTemplateToFields(coverId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coverId]);

  // Persist draft + include flag for combined export
  useEffect(() => {
    try {
      localStorage.setItem('ft_cover_draft', JSON.stringify({ fields }));
    } catch {}
  }, [fields]);
  useEffect(() => {
    try {
      localStorage.setItem('ft_merge_cover_with_resume', includeWithResume ? '1' : '0');
    } catch {}
  }, [includeWithResume]);

  const update = (key, val) => setFields((f) => ({ ...f, [key]: val }));
  const updateBody = (idx, val) =>
    setFields((f) => {
      const body = [...(f.body || [])];
      body[idx] = val;
      return { ...f, body };
    });
  const addBodyLine = () => setFields((f) => ({ ...f, body: [...(f.body || []), ''] }));
  const removeBodyLine = (idx) =>
    setFields((f) => ({ ...f, body: (f.body || []).filter((_, i) => i !== idx) }));

  // Data mapping for ATS + preview components
  const atsData = useMemo(() => {
    const bullets = (fields.body || []).filter(Boolean);
    return {
      formData: {
        fullName: fields.signatureName || '',
      },
      summary: [fields.opening, fields.valueProp].filter(Boolean).join(' '),
      experiences: bullets.length
        ? [{ title: 'Relevant Highlights', company: fields.company || '', bullets }]
        : [],
      projects: [],
      volunteerExperiences: [],
      educationList: [],
      certifications: [],
      languages: [],
      skills: [],
      achievements: [],
      customSections: [],
    };
  }, [fields]);

  const mappedPreviewData = useMemo(
    () => ({
      formData: { fullName: fields.signatureName || '' },
      summary: fields.opening || fields.valueProp || '',
      experiences: [{ bullets: (fields.body || []).filter(Boolean) }],
    }),
    [fields]
  );

  // -------- Right Sidebar (componentized to match resume UX) --------
  const RightPane = (
    <CoverSideRail
      atsData={atsData}
      onOpenAtsPreview={() => setOpenAtsPreview(true)}
      includeWithResume={includeWithResume}
      setIncludeWithResume={setIncludeWithResume}
      onDownloadAtsPdf={() => window.print?.()} // placeholder until dedicated PDF is wired
      onDownloadDesignedPdf={() => window.print?.()}
      onExportWord={() => alert('Export Word coming soon')}
      onExportText={() => {
        try {
          const text = [
            fields.signatureContact,
            (fields.recipient || fields.company)
              ? `${fields.recipient || ''}\n${fields.company || ''}`
              : '',
            fields.greeting,
            fields.opening,
            ...(fields.body || []),
            fields.valueProp,
            fields.closing,
            `${fields.signoff}\n${fields.signatureName || ''}`,
          ]
            .filter(Boolean)
            .join('\n\n');
          const blob = new Blob([text], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'Cover_Letter.txt';
          a.click();
          URL.revokeObjectURL(url);
        } catch {}
      }}
      onSaveCover={() => {
        try {
          localStorage.setItem('ft_cover_draft', JSON.stringify({ fields }));
          alert('Cover saved.');
        } catch {
          alert('Could not save.');
        }
      }}
      onConfigureAdvanced={() => router.push('/resume/create#export')}
      lastSavedLabel={lastSavedLabel || undefined} // ← CLIENT-ONLY to avoid hydration mismatch
      onExportApply={() => {
        try {
          localStorage.setItem('ft_cover_draft', JSON.stringify({ fields }));
          localStorage.setItem('ft_merge_cover_with_resume', includeWithResume ? '1' : '0');
        } catch {}
        router.push('/resume/create#export');
      }}
      onTailorLocal={async () => {
        const fromSaved = (localStorage.getItem('ft_last_job_text') || '').trim();
        const jobText =
          (useSavedJd ? fromSaved : jd).trim() ||
          window.prompt('Paste the job description to tailor your letter:') ||
          '';
        if (!jobText) return;

        // optional resume context
        let resume = {};
        try {
          const raw = localStorage.getItem('ft_resume_draft');
          if (raw) {
            const d = JSON.parse(raw);
            resume = {
              fullName: d?.formData?.fullName || '',
              contact: [d?.formData?.email, d?.formData?.phone, d?.formData?.location]
                .filter(Boolean)
                .join(' · '),
              headline: d?.formData?.headline || '',
              skills: d?.skills || [],
              achievements: d?.achievements || [],
            };
          }
        } catch {}

        const out = await writeCover({ jobText, resume, style: coverId });
        if (out?.fields) setFields((prev) => ({ ...prev, ...out.fields }));
        try {
          localStorage.setItem('ft_last_job_text', jobText);
        } catch {}
      }}
      onOpenLivePreview={() => setOpenLivePreview(true)}
    />
  );

  const HeaderBox = (
    <section
      style={{
        background: 'white',
        border: '1px solid #eee',
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        textAlign: 'center',
        display: 'grid',
        gap: 10,
      }}
    >
      <ApplySteps current={2} />

      <h1
        style={{
          color: '#FF7043',
          fontSize: 28,
          fontWeight: 800,
          margin: 0,
        }}
      >
        Cover Letter Builder
      </h1>
      <p style={{ marginTop: 0, color: '#546E7A', fontSize: 14 }}>
        Pick a template, then tailor with AI or manually refine. Export with your resume or solo.
      </p>
    </section>
  );

  return (
    <SeekerLayout
      title="Create Cover Letter | ForgeTomorrow"
      header={HeaderBox}
      right={RightPane}
      activeNav="resume-cover"
    >
      <div style={{ display: 'grid', gap: 16 }}>
        {/* JD reuse banner (always visible) */}
        <section
          style={{
            background: 'white',
            border: '1px solid #eee',
            borderRadius: 12,
            padding: 12,
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
            display: 'grid',
            gap: 8,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <div style={{ fontWeight: 800, color: '#37474F' }}>
              Using job description from Resume step
            </div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
              }}
            >
              <input
                type="checkbox"
                checked={useSavedJd}
                onChange={(e) => setUseSavedJd(e.target.checked)}
              />
              Reuse saved JD
            </label>
          </div>
          {!useSavedJd && (
            <textarea
              placeholder="Paste a different job description for this cover letter…"
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              style={{
                width: '100%',
                minHeight: 140,
                border: '1px solid #E0E0E0',
                borderRadius: 10,
                padding: 10,
                outline: 'none',
              }}
            />
          )}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <GhostButton
              onClick={() => {
                try {
                  localStorage.setItem(
                    'ft_last_job_text',
                    useSavedJd ? localStorage.getItem('ft_last_job_text') || '' : jd
                  );
                } catch {}
              }}
            >
              Save JD
            </GhostButton>
            <a
              href="/resume/create"
              style={{
                textDecoration: 'none',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid #E0E0E0',
                fontWeight: 800,
              }}
            >
              ← Back to Resume
            </a>
            <a
              href="/resume/create#export"
              style={{
                textDecoration: 'none',
                padding: '10px 14px',
                borderRadius: 10,
                background: '#FF7043',
                color: 'white',
                border: '1px solid rgba(0,0,0,0.06)',
                fontWeight: 800,
              }}
            >
              Next: Export / Apply
            </a>
          </div>
        </section>

        {/* Template selector + AI choose */}
        <section
          style={{
            background: 'white',
            border: '1px solid #eee',
            borderRadius: 12,
            padding: 16,
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
            display: 'grid',
            gap: 8,
          }}
        >
          <label
            htmlFor="cover-template"
            style={{
              display: 'block',
              fontWeight: 700,
              marginBottom: 4,
              color: '#FF7043',
            }}
          >
            Choose Cover Template
          </label>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: 8,
              alignItems: 'center',
            }}
          >
            <select
              id="cover-template"
              value={coverId}
              onChange={(e) => setCoverId(e.target.value)} // ← triggers reseed via useEffect
              style={{
                border: '1px solid #ddd',
                borderRadius: 8,
                padding: '10px 12px',
                width: '100%',
                outline: 'none',
              }}
            >
              {coverTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={async () => {
                try {
                  const jobText = localStorage.getItem('ft_last_job_text') || '';
                  const result = await matchTemplate({ jobText });
                  if (result?.coverId) setCoverId(result.coverId); // ← also triggers reseed
                  // eslint-disable-next-line no-alert
                  if (result?.reasons?.cover?.why) {
                    alert(`AI picked: ${result.coverId}\nReason: ${result.reasons.cover.why}`);
                  }
                } catch {
                  // eslint-disable-next-line no-alert
                  alert('Could not run template matcher. Using current selection.');
                }
              }}
              style={{
                background: '#FF7043',
                color: 'white',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid rgba(0,0,0,0.06)',
                fontWeight: 800,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Use AI to choose
            </button>
          </div>
          <div style={{ marginTop: 4, fontSize: 12, color: '#607D8B' }}>
            Tip: Open this page with <code>?template=concise|narrative|achievement</code> to auto-select and seed.
          </div>
        </section>

        {/* Form fields */}
        <section
          style={{
            background: 'white',
            border: '1px solid #eee',
            borderRadius: 12,
            padding: 16,
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
            display: 'grid',
            gap: 12,
          }}
        >
          <div
            style={{
              display: 'grid',
              gap: 10,
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            }}
          >
            <Field label="Recipient name">
              <TextInput
                placeholder="Jane Doe"
                value={fields.recipient}
                onChange={(e) => update('recipient', e.target.value)}
              />
            </Field>
            <Field label="Company">
              <TextInput
                placeholder="Company XYZ"
                value={fields.company}
                onChange={(e) => update('company', e.target.value)}
              />
            </Field>
            <Field label="Role (optional)">
              <TextInput
                placeholder="Customer Success Lead"
                value={fields.role}
                onChange={(e) => update('role', e.target.value)}
              />
            </Field>
          </div>

          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr' }}>
            <Field label="Greeting">
              <TextInput
                placeholder="Dear Hiring Manager,"
                value={fields.greeting}
                onChange={(e) => update('greeting', e.target.value)}
              />
            </Field>
            <div />
          </div>

          <Field label="Opening">
            <TextArea
              placeholder="Open with intent and a clear, relevant statement."
              value={fields.opening}
              onChange={(e) => update('opening', e.target.value)}
            />
          </Field>

          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ fontWeight: 700, color: '#607D8B', fontSize: 12 }}>Body points</div>
            {(fields.body || []).map((line, idx) => (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: 8,
                  alignItems: 'start',
                }}
              >
                <TextArea
                  placeholder={`Point ${idx + 1}`}
                  value={line}
                  onChange={(e) => updateBody(idx, e.target.value)}
                  style={{ minHeight: 60 }}
                />
                <GhostButton onClick={() => removeBodyLine(idx)}>Remove</GhostButton>
              </div>
            ))}
            <div>
              <GhostButton onClick={addBodyLine}>Add point</GhostButton>
            </div>
          </div>

          <Field label="Value proposition">
            <TextArea
              placeholder="Bring it together—how you’ll help them hit goals fast."
              value={fields.valueProp}
              onChange={(e) => update('valueProp', e.target.value)}
            />
          </Field>

          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr' }}>
            <Field label="Closing">
              <TextArea
                placeholder="Thank them and invite next steps."
                value={fields.closing}
                onChange={(e) => update('closing', e.target.value)}
              />
            </Field>
            <Field label="Signoff">
              <TextInput
                placeholder="Sincerely,"
                value={fields.signoff}
                onChange={(e) => update('signoff', e.target.value)}
              />
            </Field>
          </div>

          {/* Contact label updated to remove LinkedIn reference by default */}
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr' }}>
            <Field label="Your name">
              <TextInput
                placeholder="Your Name"
                value={fields.signatureName}
                onChange={(e) => update('signatureName', e.target.value)}
              />
            </Field>
            <Field label="Contact (email · phone · website)">
              <TextInput
                placeholder="you@email.com · (555) 123-4567 · yoursite.com"
                value={fields.signatureContact}
                onChange={(e) => update('signatureContact', e.target.value)}
              />
            </Field>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <GhostButton onClick={() => window.print?.()}>Print / Save PDF</GhostButton>
            <PrimaryButton onClick={() => alert('Export coming soon')}>Export</PrimaryButton>
          </div>
        </section>
      </div>

      {/* MODALS */}
      <AtsPreviewModal
        open={openAtsPreview}
        onClose={() => setOpenAtsPreview(false)}
        formData={atsData.formData}
        summary={atsData.summary}
        experiences={atsData.experiences}
        projects={atsData.projects}
        volunteerExperiences={atsData.volunteerExperiences}
        educationList={atsData.educationList}
        certifications={atsData.certifications}
        languages={atsData.languages}
        skills={atsData.skills}
        achievements={atsData.achievements}
        customSections={atsData.customSections}
      />

      <CoverPreviewModal
        open={openLivePreview}
        onClose={() => setOpenLivePreview(false)}
        CoverComp={CoverComp}
        mappedPreviewData={mappedPreviewData}
        FallbackPreview={CoverPreview}
        fields={fields}
      />
    </SeekerLayout>
  );
}
