// pages/resume-cover.js
import Link from 'next/link';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import SeekerRightColumn from '@/components/seeker/SeekerRightColumn';
import SavedDocs from '../components/SavedDocs';

export default function ResumeCoverCreator() {
  const RightPane = (
    <div style={{ display: 'grid', gap: 12 }}>
      {/* Shortcuts (shared) */}
      <SeekerRightColumn variant="creator" />

      {/* Saved Docs */}
      <div style={{ color: 'white', fontWeight: 700, marginTop: 4 }}>Saved Docs</div>
      {/* SavedDocs renders its own internal styles/cards */}
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
        {/* Intro card */}
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
            Soon, you’ll generate ATS‑optimized files with AI, tailor each version to job descriptions, and save versions
            for each opportunity.
          </p>
        </section>

        {/* Options grid */}
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
              Use our AI‑enhanced builder to create a new resume step‑by‑step.
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
              border: '1px dashed #B0BEC5',
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
            <button
              type="button"
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
            <button
              type="button"
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
              Start Cover Letter
            </button>
          </section>
        </div>
      </div>
    </SeekerLayout>
  );
}
