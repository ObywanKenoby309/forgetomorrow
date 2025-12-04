// pages/resume-cover.js — Resume + cover landing with ATS context
import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import ResumeRightRail from '@/components/resume/ResumeRightRail';
import { getClientSession } from '@/lib/auth-client';
import ProfileResumeAttach from '@/components/profile/ProfileResumeAttach';
import ProfileCoverAttach from '@/components/profile/ProfileCoverAttach';
import SectionHint from '@/components/SectionHint';

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
    tagline: 'Safest for ATS: clear roles, companies, dates, and results.',
  },
  {
    key: 'hybrid',
    name: 'Hybrid (Combination)',
    tagline: 'Skills & highlights up top, then full reverse-chronological history.',
    pro: true,
  },
];

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
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }}
      />
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
          <PrimaryButton href={href}>
            Use {tpl.name}
          </PrimaryButton>
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
  const [tier, setTier] = useState('basic');              // 'basic' | 'pro'
  const [usage, setUsage] = useState({ used: 0, limit: 3 }); // AI generations
  const [savedResumes, setSavedResumes] = useState([]);   // [] until DB wiring

  // Context: ATS pack + job params from jobs page
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
        } else {
          // Rely on global auth / middleware instead of forcing /login here
          console.warn('[resume-cover] No session user found on client init');
        }

        // TODO: Replace these placeholders with real DB-driven values
        setTier((prev) => prev);          // keep 'basic' for now
        setUsage((prev) => prev);        // { used: 0, limit: 3 } for now
        setSavedResumes((prev) => prev); // empty until wired
      } catch (err) {
        console.error('[resume-cover] Failed to init session/usage', err);
      }
    }
    init();
  }, [router]);

  // Read ATS pack + jobId/copyJD from query/localStorage
  useEffect(() => {
    if (!router.isReady) return;

    const { from, jobId, copyJD } = router.query || {};

    // Job context from jobs page "Check Resume Alignment" / "Apply" flows
    if (jobId) {
      setJobContext({
        jobId: String(jobId),
        copyJD: String(copyJD || '').toLowerCase() === 'true',
      });
    }

    // ATS pack from floating panel "Improve my resume with Grok + OpenAI →"
    if (String(from || '').toLowerCase() === 'ats') {
      if (typeof window !== 'undefined') {
        try {
          const raw = window.localStorage.getItem('forge-ats-pack');
          if (raw) {
            const parsed = JSON.parse(raw);
            setAtsPack(parsed);
            setAtsSource('ats');
          }
        } catch (err) {
          console.error('[resume-cover] Failed to load ATS pack from localStorage', err);
        }
      }
    }
  }, [router.isReady, router.query]);

  // Helper: builder route that carries ATS + job context
  const buildCreateHref = (options = {}) => {
    const params = new URLSearchParams();

    // Template or upload flags
    if (options.template) {
      params.set('template', options.template);
    }
    if (options.uploaded) {
      params.set('uploaded', '1');
    }

    // Job context from jobs page
    if (jobContext?.jobId) {
      params.set('jobId', jobContext.jobId);
      if (jobContext.copyJD) {
        params.set('copyJD', 'true');
      }
    }

    // ATS source flag so /resume/create knows to look at localStorage
    if (atsSource === 'ats') {
      params.set('from', 'ats');
    }

    const qs = params.toString();
    return `/resume/create${qs ? `?${qs}` : ''}`;
  };

  const onUploadClick = () => fileRef.current?.click();

  const onFilePicked = () => {
    // Imported resume → still honor ATS + job context
    router.push(buildCreateHref({ uploaded: true }));
  };

  const canUseHybrid = tier === 'pro' || usage.used < usage.limit;

  // ─────────────────────────────────────────────────────────────
  // Header hero
  // ─────────────────────────────────────────────────────────────
  const HeaderHero = (
    <Card
      style={{
        textAlign: 'center',
      }}
      aria-label="Resume and cover letter builder overview"
    >
      <h1 style={{ color: ORANGE, fontSize: 32, fontWeight: 800, margin: 0 }}>
        Build your resume
      </h1>
      <p
        style={{
          color: SLATE,
          margin: '12px 0 24px',
          fontSize: 17,
        }}
      >
        Start with a template or upload an existing file. You can add a cover letter
        later.
      </p>
      <div
        style={{
          display: 'flex',
          gap: 20,
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        <PrimaryButton href={buildCreateHref({ template: 'reverse' })}>
          Build a Resume
        </PrimaryButton>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <SoftLink onClick={onUploadClick}>Upload a resume</SoftLink>
          <span style={{ width: 1, height: 24, background: '#E0E0E0' }} />
          <SoftLink href={withChrome('/cover/create')}>
            Create a cover letter
          </SoftLink>
        </div>
      </div>
      {tier === 'basic' && usage && typeof usage.used === 'number' && (
        <div style={{ marginTop: 16, color: '#666', fontSize: 14 }}>
          Free tier:{' '}
          {usage.used}/{usage.limit === Infinity ? '∞' : usage.limit} AI generations used
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

  // ─────────────────────────────────────────────────────────────
  // ATS context banner (when coming from ATSResultPanel)
  // ─────────────────────────────────────────────────────────────
  const ATSContextBanner =
    atsPack && atsPack.job ? (
      <Card
        style={{
          marginTop: 16,
          borderColor: '#1A4B8F',
          borderWidth: 1,
        }}
      >
        <div
          style={{
            fontWeight: 800,
            fontSize: 16,
            color: '#1A4B8F',
            marginBottom: 4,
          }}
        >
          We’ve loaded ATS insights for this job
        </div>
        <p style={{ margin: '4px 0', fontSize: 14, color: '#37474F' }}>
          <strong>{atsPack.job.title}</strong> at{' '}
          <strong>{atsPack.job.company}</strong>
          {atsPack.job.location ? ` — ${atsPack.job.location}` : ''}
        </p>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#607D8B' }}>
          When you open the builder, we’ll surface these recommendations so you can tune
          your resume before you export or apply.
        </p>
      </Card>
    ) : null;

  const ATSWhyBanner = (
    <Card>
      <div style={{ fontWeight: 800, fontSize: 18 }}>Why only two resume formats?</div>
      <p style={{ color: '#607D8B', lineHeight: 1.5 }}>
        Because <strong>Reverse-Chronological</strong> and <strong>Hybrid</strong> are the only
        layouts that consistently pass ATS scans and recruiter eyes. Everything else is
        noise. We removed 9,998 templates so you don’t fail silently.
      </p>
    </Card>
  );

  const TemplatesRow = (
    <Card>
      <div style={{ fontWeight: 800, fontSize: 18 }}>Quick-start templates</div>
      <p style={{ color: '#90A4AE', fontSize: 14, marginTop: 4 }}>
        ATS-friendly by default. Switch any time.
      </p>
      <div
        style={{
          marginTop: 20,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 20,
        }}
      >
        {TEMPLATES.map((tpl) => {
          const disabled = tpl.pro && !canUseHybrid;
          const href = disabled ? '/pricing' : buildCreateHref({ template: tpl.key });

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
              <p
                style={{
                  color: '#607D8B',
                  fontSize: 13,
                  margin: '8px 0 16px',
                }}
              >
                {tpl.tagline}
              </p>
              <div
                style={{
                  height: 140,
                  background: '#F5F5F5',
                  border: '2px dashed #CFD8DC',
                  borderRadius: 12,
                  marginBottom: 16,
                }}
              />
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

  return (
    <SeekerLayout
      title="Resume & Cover | ForgeTomorrow"
      header={HeaderHero}
      right={
        <ResumeRightRail
          savedResumes={savedResumes}
          usage={usage}
          tier={tier}
        />
      }
      activeNav="resume-cover"
    >
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 16px' }}>
        {ATSContextBanner}
        {ATSWhyBanner}
        {TemplatesRow}
      </div>

      {/* Primary resume + cover attach section */}
      <div
        style={{
          maxWidth: 1080,
          margin: '32px auto',
          padding: '0 16px',
        }}
      >
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
