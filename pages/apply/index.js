// pages/apply/index.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import { matchTemplate } from '@/lib/ai/matchTemplate';
import { writeCover } from '@/lib/ai/writeCover';
import { writeResume } from '@/lib/ai/writeResume'; // ← NEW (see below)

function Card({ children, style }) {
  return (
    <section
      style={{
        background: 'white',
        border: '1px solid #eee',
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        ...style,
      }}
    >
      {children}
    </section>
  );
}

function Primary({ onClick, children, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        background: '#FF7043',
        color: 'white',
        border: '1px solid rgba(0,0,0,0.06)',
        borderRadius: 10,
        padding: '10px 14px',
        fontWeight: 800,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
      }}
      aria-disabled={disabled}
    >
      {children}
    </button>
  );
}

function Ghost({ onClick, children }) {
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
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

export default function ApplyAssistant() {
  const router = useRouter();
  const [jobText, setJobText] = useState('');
  const [source, setSource] = useState('draft'); // 'draft' | 'blank'
  const [busy, setBusy] = useState(false);

  async function onGenerate() {
    if (!jobText.trim()) {
      alert('Please paste the job description.');
      return;
    }
    setBusy(true);
    try {
      // 1) get minimal resume source
      let resumeDraft = {};
      if (source === 'draft') {
        try {
          const raw = localStorage.getItem('ft_resume_draft');
          if (raw) {
            const d = JSON.parse(raw);
            resumeDraft = {
              formData: d?.formData || {},
              summary: d?.summary || '',
              experiences: d?.experiences || [],
              projects: d?.projects || [],
              volunteerExperiences: d?.volunteerExperiences || [],
              educationList: d?.educationList || [],
              certifications: d?.certifications || [],
              languages: d?.languages || [],
              skills: d?.skills || [],
              achievements: d?.achievements || [],
              customSections: d?.customSections || [],
            };
          }
        } catch {
          // ignore localStorage parse errors
        }
      }

      // 2) choose best templates
      const { resumeId, coverId } = await matchTemplate({
        jobText,
        profile: { skills: resumeDraft.skills || [] },
      });

      // 3) generate drafts
      const resumeOut = await writeResume({
        jobText,
        resume: resumeDraft,
        style: resumeId,
      });

      const coverOut = await writeCover({
        jobText,
        resume: {
          fullName: resumeDraft?.formData?.fullName || '',
          contact: [
            resumeDraft?.formData?.email,
            resumeDraft?.formData?.phone,
            resumeDraft?.formData?.location,
          ]
            .filter(Boolean)
            .join(' · '),
          headline: resumeDraft?.formData?.headline || '',
          skills: resumeDraft?.skills || [],
          achievements: resumeDraft?.achievements || [],
        },
        style: coverId,
      });

      // 4) persist shared context for builders
      try {
        localStorage.setItem('ft_last_job_text', jobText);
        localStorage.setItem(
          'ft_resume_seed',
          JSON.stringify({ ...resumeOut.seed, templateId: resumeId }),
        );
        localStorage.setItem(
          'ft_cover_draft',
          JSON.stringify({ fields: coverOut.fields }),
        );
      } catch {
        // ignore storage errors
      }

      // 5) jump into Resume builder (cover can be opened after)
      router.push(`/resume/create?template=${encodeURIComponent(resumeId)}`);
      // If you want to auto-open cover too, uncomment:
      // window.open(`/cover/create?template=${encodeURIComponent(coverId)}`, '_blank');
    } finally {
      setBusy(false);
    }
  }

  const Header = (
    <Card style={{ textAlign: 'center' }}>
      <h1
        style={{
          color: '#FF7043',
          fontSize: 28,
          fontWeight: 800,
          margin: 0,
        }}
      >
        Apply Assistant
      </h1>
      <p style={{ color: '#546E7A', margin: '8px 0 0' }}>
        One flow → AI drafts a resume and cover letter from your job description
        and resume.
      </p>
    </Card>
  );

  const Right = (
    <div style={{ display: 'grid', gap: 12 }}>
      <Card>
        <div style={{ fontWeight: 800, marginBottom: 6 }}>Tips</div>
        <ul
          style={{
            margin: 0,
            paddingLeft: 18,
            color: '#607D8B',
            fontSize: 14,
            display: 'grid',
            gap: 6,
          }}
        >
          <li>Paste the full job description for best keyword coverage.</li>
          <li>
            “Use my current builder draft” pulls from your last saved resume
            here.
          </li>
        </ul>
      </Card>
    </div>
  );

  return (
    <SeekerLayout
      title="Apply Assistant | ForgeTomorrow"
      header={Header}
      right={Right}
      activeNav="resume-cover"
      rightVariant="light"
      rightWidth={280}
    >
      <div
        style={{
          display: 'grid',
          gap: 16,
          maxWidth: 960,
          margin: '0 auto',
        }}
      >
        <Card>
          <label
            htmlFor="apply-job-description"
            style={{
              fontWeight: 800,
              color: '#37474F',
              marginBottom: 8,
              display: 'block',
            }}
          >
            1) Job Description
          </label>
          <textarea
            id="apply-job-description"
            placeholder="Paste the job description here…"
            value={jobText}
            onChange={(e) => setJobText(e.target.value)}
            style={{
              width: '100%',
              minHeight: 220,
              border: '1px solid #E0E0E0',
              borderRadius: 10,
              padding: 12,
              outline: 'none',
            }}
            aria-describedby="apply-job-description-help"
          />
          <div
            id="apply-job-description-help"
            style={{ marginTop: 8, fontSize: 12, color: '#90A4AE' }}
          >
            We’ll pull keywords and requirements to guide both drafts.
          </div>
        </Card>

        <Card>
          <fieldset
            style={{
              border: 'none',
              padding: 0,
              margin: 0,
            }}
          >
            <legend
              style={{
                fontWeight: 800,
                color: '#37474F',
                marginBottom: 8,
              }}
            >
              2) Resume Source
            </legend>
            <div style={{ display: 'grid', gap: 10 }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="resume-source"
                  checked={source === 'draft'}
                  onChange={() => setSource('draft')}
                />
                <span>Use my current builder draft (recommended)</span>
              </label>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="resume-source"
                  checked={source === 'blank'}
                  onChange={() => setSource('blank')}
                />
                <span>Start from blank (we’ll create a minimal resume)</span>
              </label>
            </div>
          </fieldset>

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <Primary onClick={onGenerate} disabled={busy}>
              {busy ? 'Generating…' : 'Generate drafts & open resume'}
            </Primary>
            <Ghost onClick={() => window.open('/resume/create', '_blank')}>
              Open builder
            </Ghost>
          </div>
        </Card>
      </div>
    </SeekerLayout>
  );
}
