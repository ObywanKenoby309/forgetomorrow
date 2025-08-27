// pages/resume-cover.js
import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import SeekerRightColumn from '@/components/seeker/SeekerRightColumn';
import SavedDocs from '../components/SavedDocs';

/** -------------------------------------------
 * Small utility UI bits (kept inline to avoid new files)
 * ------------------------------------------*/
function Pill({ children }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        background: '#FFEDE6',
        color: '#FF7043',
        border: '1px solid #FFD2C2',
      }}
    >
      {children}
    </span>
  );
}

function Button({ children, variant = 'primary', onClick, href, block = false }) {
  const base = {
    display: 'inline-block',
    width: block ? '100%' : 'auto',
    textAlign: 'center',
    cursor: 'pointer',
    padding: '10px 12px',
    borderRadius: 10,
    fontWeight: 800,
    border: '1px solid rgba(0,0,0,0.06)',
    textDecoration: 'none',
  };
  const styles =
    variant === 'primary'
      ? { background: '#FF7043', color: 'white' }
      : variant === 'ghost'
      ? { background: 'white', color: '#455A64', border: '1px solid #E0E0E0' }
      : { background: '#ECEFF1', color: '#263238' };

  if (href) {
    return (
      <Link href={href} style={{ ...base, ...styles }}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} style={{ ...base, ...styles }}>
      {children}
    </button>
  );
}

/** -------------------------------------------
 * Template Gallery (resume + cover)
 * ------------------------------------------*/
const RESUME_TEMPLATES = [
  {
    id: 'modern',
    kind: 'resume',
    name: 'Modern',
    blurb: 'Clean two-column, strong headings. Great for tech and startups.',
  },
  {
    id: 'classic',
    kind: 'resume',
    name: 'Classic',
    blurb: 'Single column, ATS-friendly. Best for conservative industries.',
  },
  {
    id: 'minimal',
    kind: 'resume',
    name: 'Minimal',
    blurb: 'Whitespace-first, elegant. Ideal for senior ICs and design-adjacent roles.',
  },
];

const COVER_TEMPLATES = [
  {
    id: 'impact',
    kind: 'cover',
    name: 'Impact',
    blurb: 'Short, results-first letter with quantified wins up top.',
  },
  {
    id: 'formal',
    kind: 'cover',
    name: 'Formal',
    blurb: 'Traditional, professional tone with clear structure.',
  },
  {
    id: 'warm',
    kind: 'cover',
    name: 'Warm',
    blurb: 'Personable intro, values-forward voice for people-facing roles.',
  },
];

function TemplatePreview({ t }) {
  // Simple visual stub preview so we don’t add assets: boxes represent sections
  return (
    <div
      style={{
        background: 'white',
        border: '1px solid #E0E0E0',
        borderRadius: 12,
        padding: 16,
        width: '100%',
      }}
    >
      <div style={{ display: 'grid', gap: 8 }}>
        <div style={{ height: 10, width: '60%', background: '#ECEFF1', borderRadius: 6 }} />
        <div style={{ height: 6, width: '40%', background: '#F5F5F5', borderRadius: 6 }} />
        <div style={{ height: 1, width: '100%', background: '#E0E0E0', margin: '8px 0' }} />
        {/* pretend sections */}
        <div style={{ display: 'grid', gap: 6 }}>
          <div style={{ height: 8, width: '30%', background: '#ECEFF1', borderRadius: 6 }} />
          <div style={{ height: 6, width: '100%', background: '#F5F5F5', borderRadius: 6 }} />
          <div style={{ height: 6, width: '95%', background: '#F5F5F5', borderRadius: 6 }} />
          <div style={{ height: 6, width: '92%', background: '#F5F5F5', borderRadius: 6 }} />
        </div>
        <div style={{ display: 'grid', gap: 6, marginTop: 6 }}>
          <div style={{ height: 8, width: '35%', background: '#ECEFF1', borderRadius: 6 }} />
          <div style={{ height: 6, width: '100%', background: '#F5F5F5', borderRadius: 6 }} />
          <div style={{ height: 6, width: '96%', background: '#F5F5F5', borderRadius: 6 }} />
        </div>
      </div>
      <div style={{ marginTop: 12, fontSize: 12, color: '#607D8B' }}>
        Preview: <strong>{t.name}</strong> {t.kind === 'resume' ? 'resume' : 'cover letter'}
      </div>
    </div>
  );
}

function TemplateCard({ t, onPreview, onUse }) {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: 12,
        border: '1px solid #eee',
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        padding: 16,
        display: 'grid',
        gap: 12,
      }}
    >
      <TemplatePreview t={t} />
      <div style={{ display: 'grid', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontWeight: 800, color: '#263238' }}>{t.name}</div>
          <Pill>{t.kind === 'resume' ? 'Resume' : 'Cover'}</Pill>
        </div>
        <div style={{ fontSize: 13, color: '#607D8B' }}>{t.blurb}</div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button variant="primary" onClick={() => onUse(t)} block>
          Use Template
        </Button>
        <Button variant="ghost" onClick={() => onPreview(t)} block>
          Preview
        </Button>
      </div>
    </div>
  );
}

function TemplateGallery() {
  const router = useRouter();
  const [preview, setPreview] = useState(null);

  const onUse = (t) => {
    if (t.kind === 'resume') {
      router.push(`/resume/create?template=${encodeURIComponent(t.id)}`);
    } else {
      router.push(`/cover/create?template=${encodeURIComponent(t.id)}`);
    }
  };

  return (
    <section
      style={{
        background: 'white',
        borderRadius: 12,
        border: '1px solid #eee',
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        padding: 24,
        display: 'grid',
        gap: 16,
      }}
    >
      <div style={{ display: 'grid', gap: 4 }}>
        <h3 style={{ margin: 0, color: '#263238', fontSize: 18, fontWeight: 800, letterSpacing: 0.2 }}>
          Quick-start with a template
        </h3>
        <p style={{ margin: 0, color: '#607D8B', fontSize: 14 }}>
          Pick a starting point. You can change fonts, accents, and sections later.
        </p>
      </div>

      {/* Resume row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
        {RESUME_TEMPLATES.map((t) => (
          <TemplateCard key={t.id} t={t} onPreview={setPreview} onUse={onUse} />
        ))}
      </div>

      {/* Cover row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
        {COVER_TEMPLATES.map((t) => (
          <TemplateCard key={t.id} t={t} onPreview={setPreview} onUse={onUse} />
        ))}
      </div>

      {/* Lightweight preview modal */}
      {preview && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setPreview(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(900px, 92vw)',
              background: 'white',
              borderRadius: 12,
              border: '1px solid #eee',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              padding: 20,
              display: 'grid',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 800, color: '#263238' }}>
                {preview.name} · {preview.kind === 'resume' ? 'Resume' : 'Cover Letter'}
              </div>
              <button
                type="button"
                onClick={() => setPreview(null)}
                style={{
                  border: '1px solid #E0E0E0',
                  borderRadius: 8,
                  padding: '6px 10px',
                  background: 'white',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                Close
              </button>
            </div>
            <TemplatePreview t={preview} />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <Button variant="primary" onClick={() => { const t = preview; setPreview(null); onUse(t); }}>
                Use This Template
              </Button>
              <Button variant="ghost" onClick={() => setPreview(null)}>Keep Browsing</Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/** -------------------------------------------
 * Upload handler (kept super light; no backend yet)
 * ------------------------------------------*/
function ResumeUploader() {
  const fileRef = useRef(null);
  const [fileName, setFileName] = useState('');

  return (
    <>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        style={{
          marginTop: 8,
          background: '#FF7043',
          color: 'white',
          padding: '10px 12px',
          borderRadius: 10,
          border: '1px solid rgba(0,0,0,0.06)',
          fontWeight: 800,
          cursor: 'pointer',
          width: '100%',
        }}
      >
        Upload Resume
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.doc,.docx"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          setFileName(f ? f.name : '');
        }}
      />
      {fileName && (
        <div style={{ marginTop: 8, fontSize: 12, color: '#607D8B' }}>
          Selected: <strong>{fileName}</strong> (not uploaded yet)
        </div>
      )}
    </>
  );
}

export default function ResumeCoverCreator() {
  const RightPane = (
    <div style={{ display: 'grid', gap: 12 }}>
      {/* Shortcuts (shared) */}
      <SeekerRightColumn variant="creator" />

      {/* Saved Docs */}
      <div style={{ color: 'white', fontWeight: 700, marginTop: 4 }}>Saved Docs</div>
      <SavedDocs />
    </div>
  );

  return (
    <SeekerLayout
      title="Resume & Cover Creator | ForgeTomorrow"
      headerTitle="Resume & Cover Letter Creator"
      headerDescription="Build from scratch or upload an existing file. Soon: AI tailoring, ATS-ready exports, and versioning for each opportunity."
      right={RightPane}
    >
      {/* Center column content */}
      <div style={{ display: 'grid', gap: 20 }}>
        {/* Intro card (unchanged) */}
        <section
          style={{
            background: 'white',
            borderRadius: 12,
            border: '1px solid #eee',
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
            padding: 24,
            display: 'grid',
            gap: 12,
          }}
        >
          <h2
            style={{
              color: '#FF7043',
              fontSize: 28,
              fontWeight: 800,
              textAlign: 'center',
              margin: 0,
            }}
          >
            Resume & Cover Letter Creator
          </h2>
          <p
            style={{
              color: '#455A64',
              fontSize: 16,
              textAlign: 'center',
              maxWidth: 720,
              margin: '0 auto',
              lineHeight: 1.5,
            }}
          >
            Easily build your professional resume and cover letter — from scratch or using your existing documents.
            Soon, you’ll generate ATS-optimized files with AI, tailor each version to job descriptions, and save versions
            for each opportunity.
          </p>
        </section>

        {/* Options grid (kept as-is; swapped plain Upload button with ResumeUploader for tiny UX polish) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 16,
          }}
        >
          {/* Start from Scratch */}
          <section
            style={{
              background: '#F5F5F5',
              border: '1px dashed #B0BEC5',
              borderRadius: 12,
              padding: 24,
              textAlign: 'center',
              display: 'grid',
              gap: 8,
            }}
          >
            <h3 style={{ color: '#FF7043', fontSize: 20, fontWeight: 700, margin: 0 }}>Start from Scratch</h3>
            <p style={{ color: '#607D8B', fontSize: 14, margin: 0 }}>
              Use our AI-enhanced builder to create a new resume step-by-step.
            </p>
            <Link href="/resume/create" style={{ display: 'block', marginTop: 8 }}>
              <button
                type="button"
                style={{
                  width: '100%',
                  background: '#FF7043',
                  color: 'white',
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid rgba(0,0,0,0.06)',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Create Resume
              </button>
            </Link>
          </section>

          {/* Use Existing Resume */}
          <section
            style={{
              background: '#F5F5F5',
              border: '1px dashed '#B0BEC5',
              borderRadius: 12,
              padding: 24,
              textAlign: 'center',
              display: 'grid',
              gap: 8,
            }}
          >
            <h3 style={{ color: '#FF7043', fontSize: 20, fontWeight: 700, margin: 0 }}>Use Existing Resume</h3>
            <p style={{ color: '#607D8B', fontSize: 14, margin: 0 }}>
              Upload your resume to improve and tailor it using AI tools.
            </p>
            <ResumeUploader />
          </section>

          {/* Cover Letter (full width) */}
          <section
            style={{
              gridColumn: '1 / -1',
              background: '#F5F5F5',
              border: '1px dashed #B0BEC5',
              borderRadius: 12,
              padding: 24,
              textAlign: 'center',
              display: 'grid',
              gap: 8,
            }}
          >
            <h3 style={{ color: '#FF7043', fontSize: 20, fontWeight: 700, margin: 0 }}>Cover Letter Builder</h3>
            <p style={{ color: '#607D8B', fontSize: 14, margin: 0 }}>
              Build custom, targeted cover letters with one click.
            </p>
            <Button href="/cover/create" block>
              Start Cover Letter
            </Button>
          </section>
        </div>

        {/* NEW: Template Gallery */}
        <TemplateGallery />
      </div>
    </SeekerLayout>
  );
}
