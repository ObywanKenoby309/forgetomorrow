// pages/resume-cover.js — Resume + cover landing with job insights context
import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import ResumeRightRail from '@/components/resume/ResumeRightRail';
import { getClientSession } from '@/lib/auth-client';
import ProfileResumeAttach from '@/components/profile/ProfileResumeAttach';
import ProfileCoverAttach from '@/components/profile/ProfileCoverAttach';
import SectionHint from '@/components/SectionHint';
import { extractTextFromFile, normalizeJobText } from '@/lib/jd/ingest';

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

function PrimaryButton({ href, onClick, children, disabled }) {
  const base = {
    background: disabled ? '#999' : ORANGE,
    border: '1px solid rgba(0,0,0,0.06)',
    color: 'white',
    fontWeight: 800,
    padding: '12px 20px',
    borderRadius: 10,
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'inline-block',
    textDecoration: 'none',
    opacity: disabled ? 0.7 : 1,
  };
  if (href) {
    return (
      <Link href={href} style={base}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} style={base}>
      {children}
    </button>
  );
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
  if (href) {
    return (
      <Link href={href} style={style}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} style={style}>
      {children}
    </button>
  );
}

const TEMPLATES = [
  {
    key: 'reverse',
    name: 'Reverse (Default)',
    tagline: 'Clean roles, companies, dates, and impact — easy to scan.',
    helper: 'Best for online parsers and quick recruiter review.',
  },
  {
    key: 'hybrid',
    name: 'Hybrid (Combination)',
    tagline: 'Highlights up top, then full reverse-chronological history.',
    helper: 'Best when you want a strong “top story” for human scanning.',
    pro: true,
  },
];

// 🔹 Preview image paths for each template (screenshots you provide)
const TEMPLATE_PREVIEW_IMAGES = {
  reverse: '/images/resume-templates/reverse-preview.png',
  hybrid: '/images/resume-templates/hybrid-preview.png',
};

function TemplatePreviewModal({ open, onClose, tpl, buildCreateHref }) {
  if (!open || !tpl) return null;

  const href = buildCreateHref
    ? buildCreateHref({ template: tpl.key })
    : `/resume/create?template=${tpl.key}`;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: 'relative',
          width: 'min(460px, 96vw)',
          background: 'white',
          borderRadius: 12,
          boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
          padding: 24,
        }}
      >
        <div style={{ fontWeight: 800, fontSize: 20 }}>{tpl.name} — Preview</div>
        <p style={{ color: SLATE, margin: '8px 0 16px' }}>{tpl.tagline}</p>
        <div
          style={{
            height: 240,
            background: '#f9f9f9',
            border: '2px dashed #CFD8DC',
            borderRadius: 12,
            display: 'grid',
            placeItems: 'center',
            color: '#90A4AE',
          }}
        >
          Full preview coming soon
        </div>
        <div style={{ marginTop: 20, textAlign: 'right' }}>
          <PrimaryButton href={href}>Use {tpl.name}</PrimaryButton>
        </div>
      </div>
    </div>
  );
}

export default function ResumeCoverLanding() {
  const router = useRouter();
  const chrome = String(router.query.chrome || '').toLowerCase();
  const withChrome = (path) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

  const fileRef = useRef(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTpl, setPreviewTpl] = useState(null);
  const [user, setUser] = useState(null);

  // Live data placeholders until wired:
  const [tier, setTier] = useState('basic'); // 'basic' | 'pro'
  const [usage, setUsage] = useState({ used: 0, limit: 3 }); // AI generations

  const [savedResumes, setSavedResumes] = useState([]);
  const [savedCovers, setSavedCovers] = useState([]);

  // Upload status for user confirmation
  const [uploadState, setUploadState] = useState({
    status: 'idle', // 'idle' | 'uploading' | 'uploaded' | 'error'
    message: '',
  });

  // Context: job insights pack + job params from jobs page
  const [atsPack, setAtsPack] = useState(null);
  const [atsSource, setAtsSource] = useState(null); // e.g., 'ats'
  const [jobContext, setJobContext] = useState(null); // { jobId, copyJD }

  // Init session; no redirect here so recruiters don't get bounced
  useEffect(() => {
    async function init() {
      try {
        const session = await getClientSession();

        if (session?.user) {
          setUser(session.user);

          // Load saved resumes from backend
          try {
            const res = await fetch('/api/resume/list');
            if (res.ok) {
              const json = await res.json();
              const resumes = json.resumes || [];
              setSavedResumes(resumes);
            }
          } catch (err) {
            console.error('[resume-cover] Failed to load resumes', err);
          }

          // Load saved covers (optional list; you already have api/cover/list)
          try {
            const res = await fetch('/api/cover/list');
            if (res.ok) {
              const json = await res.json();
              setSavedCovers(json.covers || []);
            }
          } catch (err) {
            console.error('[resume-cover] Failed to load covers', err);
          }
        } else {
          console.warn('[resume-cover] No session user found on client init');
        }

        // TODO: Replace these placeholders with real DB-driven values
        setTier((prev) => prev);
        setUsage((prev) => prev);
      } catch (err) {
        console.error('[resume-cover] Failed to init session/usage', err);
      }
    }
    init();
  }, [router]);

  // ✅ NO LOCAL STORAGE: Read insights pack + jobId/copyJD from query + DB drafts
  useEffect(() => {
    if (!router.isReady) return;

    const { from, jobId, copyJD } = router.query || {};

    if (jobId) {
      setJobContext({
        jobId: String(jobId),
        copyJD: String(copyJD || '').toLowerCase() === 'true',
      });
    }

    if (String(from || '').toLowerCase() === 'ats') {
      setAtsSource('ats');

      (async () => {
        try {
          const res = await fetch('/api/drafts/get?key=forge-ats-pack');
          if (!res.ok) return;
          const json = await res.json();
          const content = json?.draft?.content || null;
          if (content) setAtsPack(content);
        } catch (err) {
          console.error('[resume-cover] Failed to load insights pack from DB drafts', err);
        }
      })();
    }
  }, [router.isReady, router.query]);

  // Helper: builder route that carries job context (AND chrome)
  const buildCreateHref = (options = {}) => {
    const params = new URLSearchParams();

    if (options.template) params.set('template', options.template);
    if (options.uploaded) params.set('uploaded', '1');

    if (jobContext?.jobId) {
      params.set('jobId', jobContext.jobId);
      if (jobContext.copyJD) params.set('copyJD', 'true');
    }

    if (atsSource === 'ats') params.set('from', 'ats');

    const qs = params.toString();
    const basePath = `/resume/create${qs ? `?${qs}` : ''}`;
    return withChrome(basePath);
  };

  const buildCoverCreateHref = (opts = {}) => {
    const params = new URLSearchParams();

    // NOTE: resumeId is optional; cover builder can still run without it
    if (opts.resumeId) params.set('resumeId', String(opts.resumeId));

    if (jobContext?.jobId) {
      params.set('jobId', jobContext.jobId);
      if (jobContext.copyJD) params.set('copyJD', 'true');
    }

    if (atsSource === 'ats') params.set('from', 'ats');

    const qs = params.toString();
    return withChrome(`/cover/create${qs ? `?${qs}` : ''}`);
  };

  const onUploadClick = () => {
    setUploadState({ status: 'idle', message: '' });
    fileRef.current?.click();
  };

  // When a file is picked:
  // 1) Upload to /api/resume/upload for storage + keywords.
  // 2) Extract text client-side and store in DB drafts (NO localStorage).
  // 3) Navigate to /resume/create?uploaded=1&... so the builder can hydrate.
  const onFilePicked = async (event) => {
    const file = event?.target?.files?.[0] || fileRef.current?.files?.[0];
    if (!file) {
      setUploadState({ status: 'idle', message: '' });
      return;
    }

    setUploadState({ status: 'uploading', message: 'Uploading your resume…' });

    let uploadPayload = null;

    // 1) Upload to backend
    try {
      const formData = new FormData();
      formData.append('resume', file);

      const res = await fetch('/api/resume/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        uploadPayload = await res.json();
        setUploadState({ status: 'uploading', message: 'Resume uploaded. Preparing your builder…' });
      } else {
        console.warn('[resume-cover] Resume upload failed with status', res.status);
        setUploadState({
          status: 'error',
          message:
            'We could not save your resume yet. You can still continue to the builder, but the upload may not be stored.',
        });
      }
    } catch (err) {
      console.error('[resume-cover] Resume upload error', err);
      setUploadState({
        status: 'error',
        message:
          'Something went wrong while uploading your resume. You can still continue to the builder.',
      });
    }

    // 2) Extract text for auto-fill in the builder (store in DB drafts)
    try {
      const raw = await extractTextFromFile(file);
      const clean = raw ? normalizeJobText(raw) : '';

      // Store both meta + text in DB drafts (NO localStorage)
      try {
        await fetch('/api/drafts/set', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: 'ft_last_uploaded_resume_meta',
            content: {
              ...(uploadPayload || {}),
              originalName: file.name,
              uploadedAt: new Date().toISOString(),
            },
          }),
        });
      } catch (e) {
        console.error('[resume-cover] Failed to store upload meta draft', e);
      }

      try {
        await fetch('/api/drafts/set', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: 'ft_last_uploaded_resume_text',
            content: {
              text: clean || '',
              originalName: file.name,
              updatedAt: new Date().toISOString(),
            },
          }),
        });
      } catch (e) {
        console.error('[resume-cover] Failed to store upload text draft', e);
      }
    } catch (err) {
      console.error('[resume-cover] Failed to extract resume text for auto-fill', err);
    }

    // 3) Navigate to builder with uploaded flag + job context
    setUploadState({ status: 'uploaded', message: 'Resume uploaded. Opening the builder…' });
    router.push(buildCreateHref({ uploaded: true }));
  };

  const canUseHybrid = tier === 'pro' || usage.used < usage.limit;

  // ─────────────────────────────────────────────────────────────
  // Header hero
  // ─────────────────────────────────────────────────────────────
  const HeaderHero = (
    <Card style={{ textAlign: 'center' }} aria-label="Resume and cover letter builder overview">
      <h1 style={{ color: ORANGE, fontSize: 32, fontWeight: 800, margin: 0 }}>Build your resume</h1>
      <p style={{ color: SLATE, margin: '12px 0 24px', fontSize: 17 }}>
        Start with a template or upload an existing file. You can add a cover letter later.
      </p>

      <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
        <PrimaryButton href={buildCreateHref({ template: 'reverse' })}>Build a Resume</PrimaryButton>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <SoftLink onClick={onUploadClick}>Upload a resume</SoftLink>
          <span style={{ width: 1, height: 24, background: '#E0E0E0' }} />
          <SoftLink href={buildCoverCreateHref()}>Create a cover letter</SoftLink>
        </div>
      </div>

      {/* Upload status / confirmation */}
      {uploadState.status !== 'idle' && (
        <div
          style={{
            marginTop: 12,
            fontSize: 14,
            color: uploadState.status === 'error' ? '#B71C1C' : '#2E7D32',
          }}
        >
          {uploadState.message}
        </div>
      )}

      {tier === 'basic' && usage && typeof usage.used === 'number' && (
        <div style={{ marginTop: 16, color: '#666', fontSize: 14 }}>
          Free tier: {usage.used}/{usage.limit === Infinity ? '∞' : usage.limit} AI generations used
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={onFilePicked}
        style={{ display: 'none' }}
      />
    </Card>
  );

  const ATSContextBanner =
    atsPack && atsPack.job ? (
      <Card style={{ marginTop: 16, borderColor: '#1A4B8F', borderWidth: 1 }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: '#1A4B8F', marginBottom: 4 }}>
          We’ve loaded screening insights for this job
        </div>
        <p style={{ margin: '4px 0', fontSize: 14, color: '#37474F' }}>
          <strong>{atsPack.job.title}</strong> at <strong>{atsPack.job.company}</strong>
          {atsPack.job.location ? ` — ${atsPack.job.location}` : ''}
        </p>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#607D8B' }}>
          When you open the builder, we’ll surface these recommendations so you can tune your resume
          before you export or apply.
        </p>
      </Card>
    ) : null;

  const TemplatesRow = (
    <Card>
      <div style={{ fontWeight: 800, fontSize: 18 }}>Quick-start templates</div>
      <p style={{ color: '#90A4AE', fontSize: 14, marginTop: 4 }}>
        Clean formats designed to survive online parsing and still read great to humans.
      </p>

      <div style={{ marginTop: 12, borderTop: '1px solid #eee', paddingTop: 12 }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: '#263238' }}>Why only two formats?</div>
        <p style={{ color: '#607D8B', lineHeight: 1.5, margin: '6px 0 0' }}>
          Because <strong>Reverse-Chronological</strong> and <strong>Hybrid</strong> are the only layouts that
          consistently hold up through automated screening and recruiter eyes. Everything else is noise — and
          noise causes silent drop-offs.
        </p>
      </div>

      <div
        style={{
          marginTop: 18,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 20,
        }}
      >
        {TEMPLATES.map((tpl) => {
          const disabled = tpl.pro && !canUseHybrid;
          const href = disabled ? '/pricing' : buildCreateHref({ template: tpl.key });
          const previewSrc = TEMPLATE_PREVIEW_IMAGES[tpl.key];

          return (
            <div
              key={tpl.key}
              style={{
                border: '1px solid #eee',
                borderRadius: 16,
                padding: 20,
                position: 'relative',
              }}
            >
              {tpl.pro && tier !== 'pro' && (
                <div
                  style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    background: '#FFD700',
                    color: '#000',
                    fontSize: 10,
                    fontWeight: 900,
                    padding: '4px 8px',
                    borderRadius: 6,
                  }}
                >
                  PRO
                </div>
              )}
              <div style={{ fontWeight: 800, fontSize: 18 }}>{tpl.name}</div>
              <p style={{ color: '#607D8B', fontSize: 13, margin: '8px 0 8px' }}>{tpl.tagline}</p>
              {tpl.helper ? (
                <p style={{ color: '#90A4AE', fontSize: 12, margin: '0 0 14px' }}>{tpl.helper}</p>
              ) : (
                <div style={{ height: 14 }} />
              )}

              <div
                style={{
                  height: 140,
                  background: '#F5F5F5',
                  border: '2px dashed #CFD8DC',
                  borderRadius: 12,
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                {previewSrc ? (
                  <img
                    src={previewSrc}
                    alt={`${tpl.name} template preview`}
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
                  />
                ) : null}
              </div>

              <PrimaryButton href={href} disabled={disabled}>
                {tpl.pro && tier !== 'pro' ? 'Upgrade for Hybrid' : 'Use template'}
              </PrimaryButton>

              <button
                type="button"
                onClick={() => {
                  setPreviewTpl(tpl);
                  setPreviewOpen(true);
                }}
                style={{
                  marginTop: 8,
                  color: ORANGE,
                  fontWeight: 700,
                  background: 'none',
                  border: 0,
                  cursor: 'pointer',
                }}
              >
                Preview
              </button>
            </div>
          );
        })}
      </div>
    </Card>
  );

  // 🔸 Page-specific right-rail ad for resume/cover
  const RightRail = (
    <div className="grid gap-3">
      <ResumeRightRail savedResumes={savedResumes} usage={usage} tier={tier} />

      {/* Optional: quick list of covers */}
      {savedCovers?.length ? (
        <section
          style={{
            background: 'white',
            borderRadius: 10,
            padding: 12,
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
            border: '1px solid #eee',
          }}
        >
          <div style={{ fontWeight: 800, color: '#37474F', marginBottom: 6 }}>Saved cover letters</div>
          <div style={{ display: 'grid', gap: 6 }}>
            {savedCovers.slice(0, 5).map((c) => (
              <div key={c.id} style={{ fontSize: 13, color: '#607D8B' }}>
                {c.isPrimary ? '⭐ ' : ''}{c.name}
              </div>
            ))}
            <div style={{ marginTop: 4 }}>
              <SoftLink href={buildCoverCreateHref()}>Create a new cover letter</SoftLink>
            </div>
          </div>
        </section>
      ) : null}

      <section
        style={{
          background: 'white',
          borderRadius: 10,
          padding: 12,
          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
          border: '1px solid #eee',
        }}
      >
        <div style={{ fontWeight: 800, color: '#37474F', marginBottom: 4 }}>Resume Services Spotlight</div>
        <p style={{ margin: 0, color: '#607D8B', fontSize: 13 }}>
          Offer resume reviews, interview prep, or job search programs to ForgeTomorrow seekers. Email{' '}
          <a href="mailto:sales@forgetomorrow.com" style={{ color: '#FF7043', fontWeight: 600 }}>
            sales@forgetomorrow.com
          </a>{' '}
          to claim this slot.
        </p>
      </section>
    </div>
  );

  return (
    <SeekerLayout
      title="Resume & Cover | ForgeTomorrow"
      header={HeaderHero}
      right={RightRail}
      activeNav="resume-cover"
    >
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 16px' }}>
        {ATSContextBanner}
        {TemplatesRow}
      </div>

      {/* Primary resume + cover attach section */}
      <div style={{ maxWidth: 1080, margin: '32px auto', padding: '0 16px' }}>
        <div className="grid md:grid-cols-3 items-start gap-4">
          <div className="md:col-span-2 space-y-4">
            <ProfileResumeAttach withChrome={withChrome} />
            <ProfileCoverAttach withChrome={withChrome} />
          </div>

          <SectionHint
            title="Make it easy to say yes"
            bullets={[
              'Keep one primary resume linked to your profile.',
              'Save up to 4 alternates for different roles.',
              'Do the same with cover letters so recruiters instantly see your best fit.',
              'Manage all your resumes and cover letters in the builder — you can change your primaries anytime from there.',
            ]}
          />
        </div>
      </div>

      <TemplatePreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        tpl={previewTpl}
        buildCreateHref={buildCreateHref}
      />
    </SeekerLayout>
  );
}
