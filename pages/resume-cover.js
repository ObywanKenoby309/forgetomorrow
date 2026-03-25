// pages/resume-cover.js — Resume + cover landing with job insights context
import React, { useRef, useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';
import { getClientSession } from '@/lib/auth-client';
import { extractTextFromFile } from '@/lib/jd/ingest';

const ORANGE = '#FF7043';
const SLATE = '#455A64';

const GLASS = {
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.58)',
  boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};

function Card({ children, style }) {
  return (
    <section
      style={{
        ...GLASS,
        padding: 18,
        ...style,
      }}
    >
      {children}
    </section>
  );
}

function PrimaryButton({ href, onClick, children, disabled, style }) {
  const base = {
    background: disabled ? '#999' : ORANGE,
    border: '1px solid rgba(0,0,0,0.06)',
    color: 'white',
    fontWeight: 800,
    padding: '12px 20px',
    borderRadius: 10,
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none',
    opacity: disabled ? 0.7 : 1,
    ...style,
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

function SoftLink({ href, onClick, children, style }) {
  const linkStyle = {
    color: ORANGE,
    fontWeight: 700,
    textDecoration: 'none',
    background: 'transparent',
    border: 0,
    cursor: 'pointer',
    ...style,
  };

  if (href) {
    return (
      <Link href={href} style={linkStyle}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} style={linkStyle}>
      {children}
    </button>
  );
}

const TEMPLATES = [
  {
    key: 'reverse',
    name: 'Reverse Chronological',
    tagline: 'Clean roles, companies, dates, and impact.',
    helper: 'The gold standard for most roles.',
  },
  {
    key: 'hybrid',
    name: 'Hybrid',
    tagline: 'Key highlights up top, full history below.',
    helper: 'Great for career pivots.',
    pro: true,
  },
];

const TEMPLATE_PREVIEW_IMAGES = {
  reverse: '/images/resume-templates/reverse-preview.png',
  hybrid: '/images/resume-templates/hybrid-preview.png',
};

function TemplatePreviewModal({ open, onClose, tpl, buildCreateHref }) {
  if (!open || !tpl) return null;

  const href = buildCreateHref
    ? buildCreateHref({ template: tpl.key })
    : `/resume/create?template=${tpl.key}`;

  const previewSrc = TEMPLATE_PREVIEW_IMAGES[tpl.key];

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
          width: 'min(560px, 96vw)',
          background: 'white',
          borderRadius: 18,
          boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
          padding: 24,
        }}
      >
        <div style={{ fontWeight: 800, fontSize: 22, color: '#263238' }}>{tpl.name} — Preview</div>
        <p style={{ color: SLATE, margin: '8px 0 16px' }}>{tpl.tagline}</p>

        <div
          style={{
            minHeight: 280,
            background: '#F7F7F7',
            border: '1px solid #E6E6E6',
            borderRadius: 14,
            display: 'grid',
            placeItems: 'center',
            overflow: 'hidden',
          }}
        >
          {previewSrc ? (
            <img
              src={previewSrc}
              alt={`${tpl.name} template preview`}
              style={{ maxWidth: '100%', maxHeight: 420, objectFit: 'contain', display: 'block' }}
            />
          ) : (
            <div
              style={{
                color: '#90A4AE',
                border: '2px dashed #CFD8DC',
                borderRadius: 12,
                width: '90%',
                minHeight: 220,
                display: 'grid',
                placeItems: 'center',
              }}
            >
              Full preview coming soon
            </div>
          )}
        </div>

        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: '1px solid #E0E0E0',
              background: 'white',
              color: '#455A64',
              borderRadius: 10,
              padding: '12px 16px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Close
          </button>

          <PrimaryButton href={href}>Use this format</PrimaryButton>
        </div>
      </div>
    </div>
  );
}

function formatDate(value) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

function getItemTitle(item, fallback) {
  return item?.name || item?.title || item?.resumeName || item?.coverName || item?.label || fallback;
}

function getUpdatedLabel(item) {
  const raw = item?.updatedAt || item?.createdAt || item?.date || item?.lastUpdated;
  const formatted = formatDate(raw);
  return formatted ? `Updated ${formatted}` : 'Saved document';
}

function buildResumeOpenHref(buildCreateHref, item) {
  if (!item?.id) return buildCreateHref({ template: 'reverse' });
  return buildCreateHref({ resumeId: item.id });
}

function buildCoverOpenHref(buildCoverCreateHref, item) {
  if (!item?.id) return buildCoverCreateHref();
  return buildCoverCreateHref({ coverId: item.id });
}

function ContinueCard({ type, title, subtitle, href, primary }) {
  return (
    <div
      style={{
        background: primary ? 'rgba(255,247,243,0.94)' : 'rgba(255,255,255,0.72)',
        border: primary ? '1px solid rgba(255,112,67,0.34)' : '1px solid rgba(0,0,0,0.08)',
        borderRadius: 12,
        padding: 12,
        display: 'grid',
        gap: 10,
      }}
    >
      <div>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '4px 8px',
            borderRadius: 999,
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: 0.4,
            color: primary ? ORANGE : '#455A64',
            background: primary ? '#FFF1EB' : 'rgba(69,90,100,0.10)',
            border: primary ? '1px solid rgba(255,112,67,0.25)' : '1px solid rgba(0,0,0,0.05)',
          }}
        >
          {type}
        </span>
      </div>

      <div style={{ fontSize: 14, fontWeight: 800, color: '#263238', lineHeight: 1.4 }}>
        {title}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ fontSize: 12, color: '#546E7A', lineHeight: 1.5, fontWeight: 600 }}>
          {subtitle}
        </div>

        <SoftLink href={href} style={{ fontSize: 13, fontWeight: 800 }}>
          Open
        </SoftLink>
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

  const [tier, setTier] = useState('basic');
  const [usage, setUsage] = useState({ used: 0, limit: 3 });

  const [savedResumes, setSavedResumes] = useState([]);
  const [savedCovers, setSavedCovers] = useState([]);

  const [uploadState, setUploadState] = useState({
    status: 'idle',
    message: '',
  });

  const [atsPack, setAtsPack] = useState(null);
  const [atsSource, setAtsSource] = useState(null);
  const [jobContext, setJobContext] = useState(null);
  const [activeDocPane, setActiveDocPane] = useState('resume');

  useEffect(() => {
    async function init() {
      try {
        const session = await getClientSession();

        if (session?.user) {
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

        setTier((prev) => prev);
        setUsage((prev) => prev);
      } catch (err) {
        console.error('[resume-cover] Failed to init session/usage', err);
      }
    }
    init();
  }, [router]);

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

  const buildCreateHref = (options = {}) => {
    const params = new URLSearchParams();

    if (options.template) params.set('template', options.template);
    if (options.uploaded) params.set('uploaded', '1');
    if (options.resumeId) params.set('resumeId', String(options.resumeId));

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

    if (opts.resumeId) params.set('resumeId', String(opts.resumeId));
    if (opts.coverId) params.set('coverId', String(opts.coverId));

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

  const onFilePicked = async (event) => {
    const file = event?.target?.files?.[0] || fileRef.current?.files?.[0];
    if (!file) {
      setUploadState({ status: 'idle', message: '' });
      return;
    }

    setUploadState({ status: 'uploading', message: 'Uploading your resume…' });

    let uploadPayload = null;

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
        message: 'Something went wrong while uploading your resume. You can still continue to the builder.',
      });
    }

    try {
      const raw = await extractTextFromFile(file);
      const clean = raw ? raw.trim() : '';

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

    setUploadState({ status: 'uploaded', message: 'Resume uploaded. Opening the builder…' });
    router.push(buildCreateHref({ uploaded: true }));
  };

  const canUseHybrid = tier === 'pro' || usage.used < usage.limit;

  const sortedResumes = useMemo(() => {
    return [...savedResumes].sort((a, b) => {
      if (a?.isPrimary && !b?.isPrimary) return -1;
      if (!a?.isPrimary && b?.isPrimary) return 1;
      return new Date(b?.updatedAt || b?.createdAt || 0) - new Date(a?.updatedAt || a?.createdAt || 0);
    });
  }, [savedResumes]);

  const sortedCovers = useMemo(() => {
    return [...savedCovers].sort((a, b) => {
      if (a?.isPrimary && !b?.isPrimary) return -1;
      if (!a?.isPrimary && b?.isPrimary) return 1;
      return new Date(b?.updatedAt || b?.createdAt || 0) - new Date(a?.updatedAt || a?.createdAt || 0);
    });
  }, [savedCovers]);

  const continueItems = useMemo(() => {
    const resumes = sortedResumes.slice(0, 2).map((item, index) => ({
      id: `resume-${item?.id || index}`,
      type: 'RESUME',
      title: getItemTitle(item, `Resume ${index + 1}`),
      subtitle: getUpdatedLabel(item),
      href: buildResumeOpenHref(buildCreateHref, item),
      primary: !!item?.isPrimary,
      updatedAt: item?.updatedAt || item?.createdAt || item?.date || item?.lastUpdated || '',
    }));

    const covers = sortedCovers.slice(0, 2).map((item, index) => ({
      id: `cover-${item?.id || index}`,
      type: 'COVER',
      title: getItemTitle(item, `Cover Letter ${index + 1}`),
      subtitle: getUpdatedLabel(item),
      href: buildCoverOpenHref(buildCoverCreateHref, item),
      primary: !!item?.isPrimary,
      updatedAt: item?.updatedAt || item?.createdAt || item?.date || item?.lastUpdated || '',
    }));

    return [...resumes, ...covers]
      .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
      .slice(0, 4);
  }, [sortedResumes, sortedCovers]);

  const HeaderHero = (
    <Card
      style={{
        textAlign: 'center',
        padding: '20px 18px 16px',
        background: 'rgba(255,255,255,0.60)',
        border: '1px solid rgba(255,255,255,0.22)',
        boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
      }}
      aria-label="Resume builder overview"
    >
      <h1
        style={{
          color: '#263238',
          fontSize: 24,
          lineHeight: 1.15,
          fontWeight: 800,
          margin: 0,
        }}
      >
        Resume Builder
      </h1>

      <p
        style={{
          color: '#37474F',
          margin: '10px auto 0',
          fontSize: 15,
          lineHeight: 1.5,
          maxWidth: 820,
          fontWeight: 700,
        }}
      >
        2 templates. 1 goal: Get you the interview. Reverse Chronological for recruiters.
        System-optimized for automated screeners. No fluff. Only what works.
      </p>

      <div
        style={{
          display: 'flex',
          gap: 10,
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginTop: 16,
        }}
      >
        <PrimaryButton
          href={buildCreateHref({ template: 'reverse' })}
          style={{
            minWidth: 190,
            background: '#FFF7F3',
            color: ORANGE,
            border: '1px solid rgba(255,112,67,0.35)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          }}
        >
          ✦ Build a Resume
        </PrimaryButton>

        <PrimaryButton
          onClick={onUploadClick}
          style={{
            minWidth: 160,
            background: ORANGE,
            color: '#fff',
          }}
        >
          ↑ Upload existing
        </PrimaryButton>

        <PrimaryButton
          href={buildCoverCreateHref()}
          style={{
            minWidth: 150,
            background: '#FF8A65',
            color: '#fff',
          }}
        >
          ✉ Cover letter
        </PrimaryButton>
      </div>

      {uploadState.status !== 'idle' && (
        <div
          style={{
            marginTop: 12,
            fontSize: 14,
            color: uploadState.status === 'error' ? '#B71C1C' : '#1B5E20',
            fontWeight: 800,
          }}
        >
          {uploadState.message}
        </div>
      )}

      {tier === 'basic' && usage && typeof usage.used === 'number' && (
        <div style={{ marginTop: 12, color: '#455A64', fontSize: 13, fontWeight: 700 }}>
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
      <Card style={{ marginBottom: 16, borderColor: '#1A4B8F', borderWidth: 1 }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: '#1A4B8F', marginBottom: 4 }}>
          We’ve loaded screening insights for this job
        </div>
        <p style={{ margin: '4px 0', fontSize: 14, color: '#263238', fontWeight: 700 }}>
          <strong>{atsPack.job.title}</strong> at <strong>{atsPack.job.company}</strong>
          {atsPack.job.location ? ` — ${atsPack.job.location}` : ''}
        </p>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#455A64', lineHeight: 1.55, fontWeight: 600 }}>
          When you open the builder, we’ll surface these recommendations so you can tune your resume
          before you export or apply.
        </p>
      </Card>
    ) : null;

  const TemplatesSection = (
    <Card style={{ padding: 22 }}>
      <div style={{ fontWeight: 800, fontSize: 18, color: '#263238' }}>Choose a format</div>
      <p style={{ color: '#455A64', fontSize: 14, margin: '6px 0 18px', fontWeight: 700 }}>
        Both survive ATS screening and read great to humans.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
          gap: 18,
        }}
      >
        {TEMPLATES.map((tpl, index) => {
          const disabled = tpl.pro && !canUseHybrid;
          const href = disabled ? withChrome('/pricing') : buildCreateHref({ template: tpl.key });
          const previewSrc = TEMPLATE_PREVIEW_IMAGES[tpl.key];
          const selectedStyle =
            index === 0
              ? {
                  border: '2px solid rgba(255,112,67,0.85)',
                  background: 'rgba(255,249,246,0.94)',
                  boxShadow: '0 8px 20px rgba(255,112,67,0.08)',
                }
              : {
                  background: 'rgba(255,255,255,0.68)',
                };

          return (
            <div
              key={tpl.key}
              style={{
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: 18,
                padding: 18,
                position: 'relative',
                ...selectedStyle,
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
                    padding: '4px 9px',
                    borderRadius: 7,
                    letterSpacing: 0.4,
                  }}
                >
                  PRO
                </div>
              )}

              <div
                style={{
                  fontWeight: 900,
                  fontSize: 18,
                  lineHeight: 1.05,
                  color: '#263238',
                  maxWidth: 210,
                }}
              >
                {tpl.name}
              </div>

              <p style={{ color: '#37474F', fontSize: 13, margin: '10px 0 2px', lineHeight: 1.5, fontWeight: 700 }}>
                {tpl.tagline}
              </p>

              <p style={{ color: '#455A64', fontSize: 13, margin: '0 0 14px', lineHeight: 1.5, fontWeight: 600 }}>
                {tpl.helper}
              </p>

              <div
                style={{
                  height: 120,
                  background: 'rgba(255,255,255,0.82)',
                  borderRadius: 10,
                  border: '1px solid rgba(0,0,0,0.07)',
                  marginBottom: 14,
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {previewSrc ? (
                  <img
                    src={previewSrc}
                    alt={`${tpl.name} template preview`}
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '88%',
                      padding: 12,
                    }}
                  >
                    <div style={{ height: 6, width: '38%', borderRadius: 4, background: '#BDBDBD', marginBottom: 6 }} />
                    <div
                      style={{
                        height: 4,
                        width: '55%',
                        borderRadius: 4,
                        background: 'rgba(255,112,67,0.45)',
                        marginBottom: 8,
                      }}
                    />
                    <div style={{ height: 6, width: '62%', borderRadius: 4, background: '#E0E0E0', marginBottom: 6 }} />
                    <div style={{ height: 6, width: '100%', borderRadius: 4, background: '#E0E0E0', marginBottom: 6 }} />
                    <div style={{ height: 6, width: '100%', borderRadius: 4, background: '#E0E0E0', marginBottom: 6 }} />
                    <div style={{ height: 6, width: '46%', borderRadius: 4, background: '#E0E0E0', marginTop: 8 }} />
                  </div>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <PrimaryButton
                  href={href}
                  disabled={disabled}
                  style={{
                    flex: '1 1 180px',
                    minWidth: 160,
                    padding: '11px 16px',
                    borderRadius: 10,
                    background: tpl.pro && tier !== 'pro' ? '#90A4AE' : ORANGE,
                  }}
                >
                  {tpl.pro && tier !== 'pro' ? 'Upgrade to unlock' : 'Use this format'}
                </PrimaryButton>

                <button
                  type="button"
                  onClick={() => {
                    setPreviewTpl(tpl);
                    setPreviewOpen(true);
                  }}
                  style={{
                    color: ORANGE,
                    fontWeight: 800,
                    background: 'none',
                    border: 0,
                    cursor: 'pointer',
                    padding: 0,
                    fontSize: 14,
                  }}
                >
                  Preview
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 22,
          background: 'rgba(255,243,239,0.92)',
          border: '1px solid #FFE0D6',
          borderRadius: 14,
          padding: '14px 16px',
        }}
      >
        <div style={{ fontWeight: 800, color: ORANGE, marginBottom: 6 }}>Why only two formats?</div>
        <p style={{ margin: 0, color: '#5D4037', lineHeight: 1.6, fontSize: 14, fontWeight: 600 }}>
          Reverse-Chronological and Hybrid are the only layouts that consistently clear automated
          screening AND hold up to recruiter eyes. Functional resumes, infographic resumes, and creative
          layouts cause silent drop-offs. We don&apos;t offer them.
        </p>
      </div>
    </Card>
  );

  const isResumeOpen = activeDocPane === 'resume';
  const isCoverOpen = activeDocPane === 'cover';

  const documentsGridColumns = isResumeOpen
    ? 'minmax(0, 1.25fr) minmax(220px, 0.75fr)'
    : 'minmax(220px, 0.75fr) minmax(0, 1.25fr)';

  const DocumentsSection = (
    <Card style={{ padding: 22 }}>
      <div style={{ fontWeight: 800, fontSize: 18, color: '#263238' }}>Your documents</div>
      <p style={{ color: '#455A64', fontSize: 14, margin: '6px 0 18px', fontWeight: 700 }}>
        Choose your strongest approach to applications and your portfolio.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: documentsGridColumns,
          gap: 16,
          alignItems: 'stretch',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveDocPane('resume')}
          style={{
            background: isResumeOpen ? 'rgba(255,255,255,0.70)' : 'rgba(255,255,255,0.40)',
            border: isResumeOpen ? '1px solid rgba(255,112,67,0.45)' : '1px solid rgba(0,0,0,0.08)',
            borderRadius: 14,
            padding: 14,
            minWidth: 0,
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 180ms ease',
            display: 'grid',
            gridTemplateRows: '28px minmax(0, 1fr)',
            alignItems: 'start',
          }}
        >
          <div
            style={{
              height: 28,
              display: 'flex',
              alignItems: 'center',
              fontWeight: 800,
              color: isResumeOpen ? ORANGE : '#263238',
              marginBottom: 12,
            }}
          >
            Resumes
          </div>

          <div
            style={{
              maxHeight: 230,
              overflowY: 'auto',
              paddingRight: 6,
            }}
          >
            {sortedResumes.length ? (
              sortedResumes.map((resume, index) => (
                <div
                  key={resume.id || `resume-${index}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '12px 0',
                    borderBottom: index === sortedResumes.length - 1 ? 'none' : '1px solid rgba(0,0,0,0.08)',
                    flexWrap: 'wrap',
                    opacity: isResumeOpen ? 1 : 0.9,
                  }}
                >
                  <div style={{ minWidth: 0, flex: '1 1 220px' }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#263238' }}>
                      {getItemTitle(resume, `Resume ${index + 1}`)}
                    </div>

                    <div style={{ fontSize: 12, color: '#546E7A', marginTop: 4, fontWeight: 600 }}>
                      Resume · {getUpdatedLabel(resume)}
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      flexWrap: 'wrap',
                      justifyContent: 'flex-end',
                    }}
                  >
                    {resume?.isPrimary ? (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 900,
                          color: ORANGE,
                          border: '1px solid #FFD1C2',
                          background: '#FFF3EF',
                          borderRadius: 999,
                          padding: '5px 10px',
                          letterSpacing: 0.4,
                        }}
                      >
                        PRIMARY
                      </span>
                    ) : null}

                    <SoftLink
                      href={buildResumeOpenHref(buildCreateHref, resume)}
                      style={{ fontSize: 13, fontWeight: 800 }}
                    >
                      Open
                    </SoftLink>
                  </div>
                </div>
              ))
            ) : (
              <div
                style={{
                  minHeight: 180,
                  display: 'grid',
                  placeItems: 'center',
                  textAlign: 'center',
                  color: '#455A64',
                  fontSize: 14,
                  fontWeight: 600,
                  lineHeight: 1.6,
                  padding: '8px 16px',
                }}
              >
                <div>
                  You have not created a resume yet.
                  <br />
                  Start with Reverse Chronological to build your first version.
                </div>
              </div>
            )}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveDocPane('cover')}
          style={{
            background: isCoverOpen ? 'rgba(255,255,255,0.70)' : 'rgba(255,255,255,0.40)',
            border: isCoverOpen ? '1px solid rgba(255,112,67,0.45)' : '1px solid rgba(0,0,0,0.08)',
            borderRadius: 14,
            padding: 14,
            minWidth: 0,
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 180ms ease',
            display: 'grid',
            gridTemplateRows: '28px minmax(0, 1fr)',
            alignItems: 'start',
          }}
        >
          <div
            style={{
              height: 28,
              display: 'flex',
              alignItems: 'center',
              fontWeight: 800,
              color: isCoverOpen ? ORANGE : '#263238',
              marginBottom: 12,
            }}
          >
            Cover Letters
          </div>

          <div
            style={{
              maxHeight: 230,
              overflowY: 'auto',
              paddingRight: 6,
            }}
          >
            {sortedCovers.length ? (
              sortedCovers.map((cover, index) => (
                <div
                  key={cover.id || `cover-${index}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '12px 0',
                    borderBottom: index === sortedCovers.length - 1 ? 'none' : '1px solid rgba(0,0,0,0.08)',
                    flexWrap: 'wrap',
                    opacity: isCoverOpen ? 1 : 0.9,
                  }}
                >
                  <div style={{ minWidth: 0, flex: '1 1 180px' }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#263238' }}>
                      {getItemTitle(cover, `Cover Letter ${index + 1}`)}
                    </div>

                    <div style={{ fontSize: 12, color: '#546E7A', marginTop: 4, fontWeight: 600 }}>
                      Cover letter · {getUpdatedLabel(cover)}
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      flexWrap: 'wrap',
                      justifyContent: 'flex-end',
                    }}
                  >
                    {cover?.isPrimary ? (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 900,
                          color: ORANGE,
                          border: '1px solid #FFD1C2',
                          background: '#FFF3EF',
                          borderRadius: 999,
                          padding: '5px 10px',
                          letterSpacing: 0.4,
                        }}
                      >
                        PRIMARY
                      </span>
                    ) : null}

                    <SoftLink
                      href={buildCoverOpenHref(buildCoverCreateHref, cover)}
                      style={{ fontSize: 13, fontWeight: 800 }}
                    >
                      Open
                    </SoftLink>
                  </div>
                </div>
              ))
            ) : (
              <div
                style={{
                  minHeight: 180,
                  display: 'grid',
                  placeItems: 'center',
                  textAlign: 'center',
                  padding: '8px 16px',
                }}
              >
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#607D8B' }}>No cover letter yet</div>
                  <div style={{ fontSize: 13, color: '#546E7A', marginTop: 6, lineHeight: 1.5, fontWeight: 600 }}>
                    Add one to stand out on your application.
                  </div>

                  <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center' }}>
                    <PrimaryButton
                      href={buildCoverCreateHref()}
                      style={{
                        minWidth: 150,
                        padding: '10px 16px',
                      }}
                    >
                      + Create
                    </PrimaryButton>
                  </div>
                </div>
              </div>
            )}
          </div>
        </button>
      </div>
    </Card>
  );

  const RightRail = (
    <div style={{ display: 'grid', gap: 12, minWidth: 0 }}>
      <div
        style={{
          ...GLASS,
          padding: 14,
          minWidth: 0,
          overflow: 'hidden',
          minHeight: 250,
          display: 'grid',
          alignContent: 'start',
        }}
      >
        <div
          style={{
            fontWeight: 800,
            color: '#263238',
            marginBottom: 10,
            textAlign: 'center',
            fontSize: 15,
          }}
        >
          Right Rail Ad Manager
        </div>

        <div style={{ minWidth: 0 }}>
          <RightRailPlacementManager slot="right_rail_1" />
        </div>
      </div>

      <div
        style={{
          ...GLASS,
          padding: 14,
          minWidth: 0,
          display: 'grid',
          gap: 12,
        }}
      >
        <div style={{ fontWeight: 800, color: '#263238', fontSize: 16 }}>
          Continue Where You Left Off
        </div>

        {continueItems.length ? (
          continueItems.map((item) => (
            <ContinueCard
              key={item.id}
              type={item.type}
              title={item.title}
              subtitle={item.subtitle}
              href={item.href}
              primary={item.primary}
            />
          ))
        ) : (
          <div
            style={{
              background: 'rgba(255,255,255,0.72)',
              border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: 12,
              padding: 12,
              color: '#455A64',
              fontSize: 14,
              lineHeight: 1.55,
              fontWeight: 600,
            }}
          >
            No saved documents yet. Start with a resume or upload an existing one to continue here.
          </div>
        )}
      </div>
    </div>
  );

  return (
    <SeekerLayout
      title="Resume Builder | ForgeTomorrow"
      header={HeaderHero}
      headerCard={false}
      right={RightRail}
      rightVariant="light"
      activeNav="resume-cover"
    >
      <div style={{ width: '100%', padding: '0 16px', display: 'grid', gap: 20 }}>
        {ATSContextBanner}
        {TemplatesSection}
        {DocumentsSection}
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