// pages/resume-cover.js
import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import ResumeRightRail from '@/components/resume/ResumeRightRail';

const ORANGE = '#FF7043';
const SLATE = '#455A64';

function Card({ children, style }) {
  return (
    <section
      style={{
        background: 'white',
        border: '1px solid #eee',
        borderRadius: 12,
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        padding: 16,
        ...style,
      }}
    >
      {children}
    </section>
  );
}

function PrimaryButton({ href, onClick, children }) {
  const base = {
    background: ORANGE,
    border: '1px solid rgba(0,0,0,0.06)',
    color: 'white',
    fontWeight: 800,
    padding: '10px 14px',
    borderRadius: 10,
    cursor: 'pointer',
    display: 'inline-block',
    textDecoration: 'none',
  };
  if (href) return <Link href={href} style={base}>{children}</Link>;
  return <button type="button" onClick={onClick} style={base}>{children}</button>;
}

function SoftLink({ href, onClick, children }) {
  const style = {
    color: ORANGE,
    fontWeight: 700,
    textDecoration: 'none',
    background: 'transparent',
    border: 0,
    cursor: 'pointer',
  };
  if (href) return <Link href={href} style={style}>{children}</Link>;
  return <button type="button" onClick={onClick} style={style}>{children}</button>;
}

// Only the two ATS-recommended templates
const TEMPLATES = [
  {
    key: 'reverse',
    name: 'Reverse (Default)',
    tagline: 'Safest for ATS: clear roles, companies, dates, and results.',
  },
  {
    key: 'hybrid',
    name: 'Hybrid (Combination)',
    tagline: 'Skills & highlights up top, then full reverse-chronological history.',
  },
];

function TemplatePreviewModal({ open, onClose, tpl }) {
  if (!open || !tpl) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'grid', placeItems: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: 'relative',
          width: 'min(460px, 96vw)',
          background: 'white',
          border: '1px solid #eee',
          borderRadius: 12,
          boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
          padding: 16,
          display: 'grid',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 800 }}>{tpl.name} — Preview</div>
          <button
            onClick={onClose}
            style={{ background: 'white', border: '1px solid #E0E0E0', borderRadius: 10, padding: '6px 10px', fontWeight: 800, cursor: 'pointer' }}
          >
            Close
          </button>
        </div>
        <p style={{ color: SLATE, margin: 0 }}>{tpl.tagline}</p>
        <div
          style={{
            height: 200,
            border: '1px dashed #CFD8DC',
            borderRadius: 10,
            display: 'grid',
            placeItems: 'center',
            color: '#607D8B',
            fontSize: 12,
          }}
        >
          (Thumbnail placeholder)
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Link
            href={`/resume/create?template=${encodeURIComponent(tpl.key)}`}
            style={{
              background: ORANGE,
              color: 'white',
              border: '1px solid rgba(0,0,0,0.06)',
              borderRadius: 10,
              padding: '10px 14px',
              fontWeight: 800,
              textDecoration: 'none',
            }}
          >
            Use {tpl.name}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResumeCoverLanding() {
  const router = useRouter();
  const fileRef = useRef(null);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTpl, setPreviewTpl] = useState(null);

  const onUploadClick = () => fileRef.current?.click();
  const onFilePicked = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try { localStorage.setItem('ft_resume_last_upload_name', file.name); } catch {}
    router.push('/resume/create?uploaded=1');
  };

  const HeaderHero = (
    <Card style={{ textAlign: 'center' }}>
      <h1 style={{ color: ORANGE, fontSize: 28, fontWeight: 800, margin: 0 }}>Build your resume</h1>
      <p style={{ color: SLATE, margin: '8px 0 16px' }}>
        Start with a template or upload an existing file. You can add a cover letter later.
      </p>

      <div
        style={{
          display: 'flex',
          gap: 16,
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <PrimaryButton href="/resume/create?template=reverse">Build a Resume</PrimaryButton>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 16, height: 38 }}>
          <SoftLink onClick={onUploadClick}>Upload a resume</SoftLink>
          <span aria-hidden="true" style={{ width: 1, height: 18, background: '#E0E0E0' }} />
          <SoftLink href="/cover/create">Create a cover letter</SoftLink>
        </div>
      </div>

      <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt" onChange={onFilePicked} style={{ display: 'none' }} />
    </Card>
  );

  const ATSWhyBanner = (
    <Card style={{ display: 'grid', gap: 6 }}>
      <div style={{ fontWeight: 800 }}>Why only two resume formats?</div>
      <div style={{ color: '#607D8B', fontSize: 14, lineHeight: 1.45 }}>
        Because <strong>Reverse-Chronological</strong> and <strong>Hybrid</strong> are the only layouts consistently
        passing ATS scans and recruiter reviews. Formats like “Functional” can be misread or flagged. Our goal is your
        success—not fluff. As ATS improves, we’ll expand responsibly.
      </div>
    </Card>
  );

  const TemplatesRow = (
    <Card>
      <div style={{ fontWeight: 800 }}>Quick-start templates</div>
      <div style={{ color: '#90A4AE', fontSize: 12, marginTop: 2 }}>
        ATS-friendly by default. Switch any time.
      </div>

      <div
        style={{
          marginTop: 12,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12,
        }}
      >
        {TEMPLATES.map((tpl) => (
          <div
            key={tpl.key}
            style={{
              border: '1px solid #eee',
              borderRadius: 12,
              padding: 12,
              display: 'grid',
              gap: 8,
              alignContent: 'start',
            }}
          >
            <div style={{ fontWeight: 800 }}>{tpl.name}</div>
            <div style={{ color: '#607D8B', fontSize: 12 }}>{tpl.tagline}</div>

            <div
              style={{
                height: 80,
                border: '1px dashed #CFD8DC',
                borderRadius: 10,
                display: 'grid',
                placeItems: 'center',
                color: '#90A4AE',
                fontSize: 12,
              }}
            >
              (Preview thumb)
            </div>

            <Link
              href={`/resume/create?template=${encodeURIComponent(tpl.key)}`}
              style={{
                background: ORANGE,
                color: 'white',
                border: '1px solid rgba(0,0,0,0.06)',
                borderRadius: 10,
                padding: '8px 10px',
                fontWeight: 800,
                textDecoration: 'none',
                textAlign: 'center',
              }}
            >
              Use template
            </Link>

            <button
              type="button"
              onClick={() => { setPreviewTpl(tpl); setPreviewOpen(true); }}
              style={{
                background: 'transparent',
                border: 0,
                color: ORANGE,
                fontWeight: 700,
                justifySelf: 'start',
                cursor: 'pointer',
              }}
            >
              Preview
            </button>
          </div>
        ))}
      </div>
    </Card>
  );

  // Constrain the center column width a bit for calm reading
  const CenterWrap = ({ children }) => (
    <div style={{ display: 'grid', gap: 16, maxWidth: 1080, margin: '0 auto', width: '100%' }}>
      {children}
    </div>
  );

  return (
    <SeekerLayout
      title="Resume & Cover | ForgeTomorrow"
      header={HeaderHero}
      right={<ResumeRightRail />}
      rightVariant="light"   // will apply once SeekerLayout supports it
      rightWidth={270}       // request: use this to fix the gutter in SeekerLayout
      activeNav="resume-cover"
    >
      <CenterWrap>
        {ATSWhyBanner}
        {TemplatesRow}
      </CenterWrap>

      <TemplatePreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        tpl={previewTpl}
      />
    </SeekerLayout>
  );
}
