// components/jobs/MobileJobDetail.js
// ForgeTomorrow — full-screen mobile job detail view.
// Animates in as a full-screen push (position:fixed, inset:0).
//
// What's new vs prior version:
//   - onBack is wired and works (was accepted but never called by the page)
//   - onImproveResume is wired (was missing from the page call)
//   - Right-edge "⚡ Align" pull tab — same pattern as the profile Signals drawer
//     Shows CheckMyFit scoped to this job, slides in from the right,
//     doesn't cover the full screen (width: min(88vw, 380px))
//   - Dark glassmorphism shell matching FT design system
//   - Action bar sits above the MobileBottomBar (bottom: 68px)

import React, { useEffect, useState } from 'react';
import PinnedJobToggleButton from './PinnedJobToggleButton';
import CheckMyFit from './CheckMyFit';

const ORANGE = '#FF7043';
const NAVY   = '#0D1B2A';

function inferLocationType(location) {
  if (!location) return '';
  const lower = location.toLowerCase();
  if (lower.includes('remote')) return 'Remote';
  if (lower.includes('hybrid')) return 'Hybrid';
  return 'On-site';
}

export default function MobileJobDetail({
  job,
  onBack,
  getJobStatus,
  isInternalJob,
  getJobTier,
  isJobPinned,
  hasApplied,
  isPaidUser,
  onApply,
  onResumeAlign,
  onImproveResume,
  profileSignal,
  showSearchRelevance = false,
}) {
  // Align drawer state — right-edge pull tab (same pattern as profile Signals)
  const [alignOpen,    setAlignOpen]    = useState(false);
  const [alignMounted, setAlignMounted] = useState(false);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Close align drawer on job change
  useEffect(() => {
    setAlignOpen(false);
    setAlignMounted(false);
  }, [job?.id]);

  if (!job) return null;

  const status       = getJobStatus(job);
  const internal     = isInternalJob(job);
  const tier         = getJobTier ? getJobTier(job) : 'external';
  const isFtOfficial = tier === 'ft-official';
  const isPartner    = tier === 'partner';
  const isDark       = isFtOfficial || isPartner;

  const sourceLabel = internal ? 'Forge recruiter' : 'External';
  const chipLabel   = isFtOfficial
    ? 'ForgeTomorrow official posting'
    : internal ? 'ForgeTomorrow recruiter posting' : null;

  const headerBg    = isFtOfficial
    ? `linear-gradient(135deg, ${ORANGE}, #FF5722)`
    : isPartner
    ? `linear-gradient(135deg, ${NAVY}, #162236)`
    : 'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,247,243,0.96))';

  const titleColor  = isDark ? '#FFFFFF' : '#112033';
  const subtleColor = isDark ? 'rgba(255,255,255,0.70)' : '#607D8B';

  const raw        = (job.description || '').replace(/<[^>]*>/g, '');
  const paragraphs = raw.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);

  // Align score from job data (pre-fetched) or profileSignal
  const alignScore = typeof job?.jdProfileSignal?.score === 'number'
    ? Math.round(job.jdProfileSignal.score)
    : typeof profileSignal?.score === 'number'
    ? Math.round(profileSignal.score)
    : null;

  const DRAWER_WIDTH = 'min(88vw, 380px)';

  return (
    <>
      {/* ── Main detail pane ── */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 60,
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(180deg, #FFF7F2 0%, #F4F6F8 34%, #EEF2F5 100%)',
        }}
      >
        {/* ── Sticky header ── */}
        <div
          style={{
            flexShrink: 0,
            background: headerBg,
            backdropFilter: !isDark ? 'blur(12px)' : 'none',
            WebkitBackdropFilter: !isDark ? 'blur(12px)' : 'none',
            borderBottom: isDark
              ? '1px solid rgba(255,255,255,0.08)'
              : '1px solid rgba(0,0,0,0.07)',
            boxShadow: '0 10px 28px rgba(15,23,42,0.08)',
            padding: '12px 16px 16px',
          }}
        >
          {/* Back button */}
          <button
            type="button"
            onClick={onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.05)',
              border: 'none',
              borderRadius: 999,
              padding: '6px 12px 6px 8px',
              color: isDark ? 'rgba(255,255,255,0.85)' : '#546E7A',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              marginBottom: 12,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>←</span>
            Back to jobs
          </button>

          {/* FT chip */}
          {chipLabel && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 10px',
              borderRadius: 999,
              marginBottom: 8,
              border: '1px solid rgba(255,255,255,0.18)',
              background: 'rgba(13,27,42,0.85)',
              fontSize: 11,
              color: '#FFCC80',
              fontWeight: 700,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: 999, background: ORANGE, flexShrink: 0 }} />
              {chipLabel}
            </div>
          )}

          {/* Title */}
          <h1 style={{
            margin: '0 0 4px',
            fontWeight: 900,
            fontSize: 20,
            color: titleColor,
            lineHeight: 1.25,
            letterSpacing: '-0.3px',
          }}>
            {job.title}
          </h1>

          <div style={{ fontSize: 13, color: subtleColor, fontWeight: 500, marginBottom: 10 }}>
            {job.company}{job.location ? ` — ${job.location}` : ''}
          </div>

          {/* Chip row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            {inferLocationType(job.location || '') && (
              <span style={{
                fontSize: 11, padding: '3px 9px', borderRadius: 999,
                border: '1px solid rgba(207,216,220,0.5)',
                background: isDark ? 'rgba(38,50,56,0.70)' : 'rgba(0,0,0,0.06)',
                color: isDark ? '#ECEFF1' : '#546E7A', fontWeight: 600,
              }}>
                {inferLocationType(job.location || '')}
              </span>
            )}
            <span style={{
              fontSize: 11, padding: '3px 9px', borderRadius: 999,
              border: '1px solid rgba(207,216,220,0.5)',
              background: isDark ? 'rgba(38,50,56,0.70)' : 'rgba(0,0,0,0.06)',
              color: isDark ? '#ECEFF1' : '#546E7A', fontWeight: 600,
            }}>
              {sourceLabel}
            </span>

            {status && status !== 'Open' && (
              <span style={{
                fontSize: 11, padding: '3px 9px', borderRadius: 999,
                border: '1px solid #FFCC80',
                background: status === 'Reviewing' ? '#FFF3E0' : '#ECEFF1',
                color: status === 'Reviewing' ? '#E65100' : '#607D8B', fontWeight: 700,
              }}>
                {status === 'Reviewing' ? 'Reviewing applicants' : status}
              </span>
            )}

            {/* Inline score pills */}
            {showSearchRelevance && typeof job?.match === 'number' && (
              <span style={{
                fontSize: 11, padding: '3px 9px', borderRadius: 999,
                background: 'rgba(100,116,139,0.08)', border: '1px solid rgba(100,116,139,0.20)',
                color: isDark ? '#ECEFF1' : '#64748B', fontWeight: 700,
              }}>
                Search {Math.round(job.match)}%
              </span>
            )}

            {alignScore !== null && (
              <span style={{
                fontSize: 11, padding: '3px 9px', borderRadius: 999,
                background: 'rgba(255,112,67,0.10)', border: '1px solid rgba(255,112,67,0.25)',
                color: isDark ? '#FFCC80' : ORANGE, fontWeight: 700,
              }}>
                ⚡ Align {alignScore}%
              </span>
            )}
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            paddingTop: 20,
            paddingLeft: 16,
            paddingRight: alignOpen ? `calc(${DRAWER_WIDTH} + 16px)` : 16,
            paddingBottom: 220,
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            transition: 'padding-right 0.3s ease',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <section
            aria-label="Job description"
            style={{
              background: 'rgba(255,255,255,0.92)',
              border: '1px solid rgba(15,23,42,0.08)',
              borderRadius: 22,
              boxShadow: '0 10px 28px rgba(15,23,42,0.08)',
              padding: '18px 18px 20px',
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 12,
            }}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: 999,
                background: 'rgba(255,112,67,0.12)',
                color: ORANGE,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: 13,
                flexShrink: 0,
              }}>
                JD
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#112033', letterSpacing: '-0.2px' }}>
                  Role Overview
                </div>
                <div style={{ fontSize: 11, color: '#78909C', fontWeight: 650, marginTop: 1 }}>
                  Full posting details
                </div>
              </div>
            </div>

            {paragraphs.length === 0 ? (
              <p style={{ margin: 0, color: '#607D8B', fontSize: 14, lineHeight: 1.7, fontStyle: 'italic' }}>
                No description provided.
              </p>
            ) : (
              paragraphs.map((para, idx) => (
                <p key={idx} style={{
                  margin: idx === 0 ? 0 : '14px 0 0',
                  color: '#37474F',
                  fontSize: 14,
                  lineHeight: 1.78,
                }}>
                  {para}
                </p>
              ))
            )}
          </section>

          {status === 'Reviewing' && (
            <div style={{
              padding: '12px 14px', borderRadius: 12,
              border: '1px solid #FFCC80', background: '#FFF3E0',
              fontSize: 13, color: '#E65100',
            }}>
              <p style={{ margin: 0, fontWeight: 700 }}>
                {hasApplied ? 'Thank you for applying.' : 'Reviewing applicants now.'}
              </p>
              <p style={{ margin: '4px 0 0', lineHeight: 1.5 }}>
                {hasApplied
                  ? "This employer is reviewing applicants. You'll hear directly if selected."
                  : 'New applications are paused.'}
              </p>
            </div>
          )}

          {status === 'Closed' && (
            <div style={{
              padding: '12px 14px', borderRadius: 12,
              border: '1px solid #CFD8DC', background: '#ECEFF1',
              fontSize: 13, color: '#546E7A',
            }}>
              <p style={{ margin: 0, fontWeight: 700 }}>
                {hasApplied ? 'Thank you for applying.' : 'This posting is now closed.'}
              </p>
              <p style={{ margin: '4px 0 0', lineHeight: 1.5 }}>
                {hasApplied
                  ? 'If selected for next steps, the employer will reach out directly.'
                  : 'Stay tuned for future opportunities.'}
              </p>
            </div>
          )}
        </div>

        {/* ── Fixed action bar above MobileBottomBar (bottom: 68px) ── */}
        {status === 'Open' && (
          <div style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 68,
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderTop: '1px solid rgba(255,255,255,0.65)',
            boxShadow: '0 -12px 34px rgba(15,23,42,0.14)',
            padding: '10px 12px',
            zIndex: 61,
            display: 'flex',
            justifyContent: 'center',
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isPaidUser ? '1.05fr 1.2fr 58px' : '1fr 58px',
              gap: 9,
              width: '100%',
              maxWidth: 560,
              alignItems: 'center',
            }}>
              <button
                type="button"
                onClick={() => onApply(job)}
                style={{
                  width: '100%',
                  padding: '14px 12px',
                  background: 'linear-gradient(135deg, #FF7043, #FF5722)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 14,
                  fontWeight: 800,
                  fontSize: 14,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(255,112,67,0.32)',
                  letterSpacing: '-0.1px',
                  whiteSpace: 'nowrap',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                Apply
              </button>

              {isPaidUser && (
                <button
                  type="button"
                  onClick={() => onResumeAlign(job)}
                  style={{
                    width: '100%',
                    padding: '14px 12px',
                    background: 'rgba(255,112,67,0.08)',
                    color: ORANGE,
                    border: `1.5px solid ${ORANGE}`,
                    borderRadius: 14,
                    fontWeight: 800,
                    fontSize: 14,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  Resume Align
                </button>
              )}

              <div style={{ width: 58, height: 54, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 14 }}>
                <div style={{ transform: 'scale(1.05)', transformOrigin: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', maxWidth: 56, overflow: 'hidden' }}>
                  <PinnedJobToggleButton
                    jobId={job.id}
                    initiallyPinned={isJobPinned(job)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Right-edge Align pull tab + slide-in drawer ── */}
      {/* Same pattern as the profile Signals drawer.        */}
      {/* Appears only when status is Open (actionable job). */}
      {status === 'Open' && isPaidUser && (
        <button
          type="button"
          onClick={() => { setAlignMounted(true); setAlignOpen(v => !v); }}
          aria-label="Toggle Alignment Analysis"
          style={{
            position: 'fixed',
            right: alignOpen ? DRAWER_WIDTH : 0,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 65,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 88,
            padding: 0,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            transition: 'right 0.3s cubic-bezier(0.32,0.72,0,1)',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <img
            src="/icons/align.png"
            alt="Align"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </button>
      )}

      {/* Backdrop */}
      {alignOpen && (
        <div
          onClick={() => setAlignOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 63,
            background: 'rgba(0,0,0,0.40)',
            backdropFilter: 'blur(3px)',
            WebkitBackdropFilter: 'blur(3px)',
          }}
        />
      )}

      {/* Align slide-in panel */}
      {alignMounted && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            zIndex: 64,
            width: DRAWER_WIDTH,
            maxWidth: '100vw',
            background: 'rgba(10,18,30,0.98)',
            borderLeft: '1px solid rgba(255,255,255,0.10)',
            boxShadow: '-12px 0 40px rgba(0,0,0,0.45)',
            display: 'flex',
            flexDirection: 'column',
            paddingTop: 'env(safe-area-inset-top, 14px)',
            paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 80px)',
            transform: alignOpen ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.3s cubic-bezier(0.32,0.72,0,1)',
          }}
        >
          {/* Drawer header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px 10px',
            flexShrink: 0,
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', letterSpacing: '0.02em' }}>
                ⚡ Alignment Analysis
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                Resume vs this role
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAlignOpen(false)}
              style={{
                background: 'rgba(255,255,255,0.10)',
                border: 'none',
                color: 'rgba(255,255,255,0.60)',
                width: 28,
                height: 28,
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'inherit',
              }}
            >
              ✕
            </button>
          </div>

          {/* Align score summary — instant (pre-computed from jdProfileSignal) */}
          {alignScore !== null && (
            <div style={{
              margin: '12px 16px 0',
              padding: '12px 14px',
              borderRadius: 12,
              background: alignScore >= 75
                ? 'rgba(22,163,74,0.12)'
                : alignScore >= 50
                ? 'rgba(255,112,67,0.10)'
                : 'rgba(220,38,38,0.10)',
              border: `1px solid ${
                alignScore >= 75 ? 'rgba(22,163,74,0.28)'
                : alignScore >= 50 ? 'rgba(255,112,67,0.28)'
                : 'rgba(220,38,38,0.28)'
              }`,
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: 'rgba(0,0,0,0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span style={{
                    fontSize: 16,
                    fontWeight: 900,
                    color: alignScore >= 75 ? '#4ade80' : alignScore >= 50 ? '#fb923c' : '#f87171',
                    lineHeight: 1,
                  }}>
                    {alignScore}%
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>
                    Profile vs Role
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)', marginTop: 2, lineHeight: 1.4 }}>
                    {alignScore >= 75 ? 'Strong alignment' : alignScore >= 50 ? 'Partial alignment' : 'Alignment gap detected'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CheckMyFit — on-demand deep analysis */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 16px 24px',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
          }}>
            <div style={{
              fontSize: 10,
              fontWeight: 900,
              color: 'rgba(255,255,255,0.35)',
              textTransform: 'uppercase',
              letterSpacing: '0.10em',
              marginBottom: 10,
            }}>
              Deep Analysis
            </div>
            <CheckMyFit
              job={job}
              onImproveResume={onImproveResume}
              profileSignal={profileSignal}
            />
          </div>
        </div>
      )}
    </>
  );
}