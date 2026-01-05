// components/mobile/MobileBottomBar.js
import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

function buildHref(basePath, chromeMode) {
  if (!basePath) return '/';

  const isAbsolute = /^https?:\/\//i.test(basePath);
  const url = isAbsolute ? new URL(basePath) : null;

  const isSeeker = chromeMode === 'seeker';
  const isCoach = chromeMode === 'coach';
  const isRecruiter = chromeMode === 'recruiter-smb' || chromeMode === 'recruiter-ent';

  // ✅ matches your current live behavior (until we fix recruiter-ent resolution globally)
  const recruiterChromeParam = chromeMode === 'recruiter-ent' ? 'recruiter-ent' : 'recruiter-smb';

  if (isAbsolute) {
    if (!isSeeker && (isCoach || isRecruiter)) {
      const chrome = isCoach ? 'coach' : isRecruiter ? recruiterChromeParam : String(chromeMode || '');
      if (chrome) url.searchParams.set('chrome', chrome);
    }
    return url.toString();
  }

  if (isSeeker) return basePath;

  if (isCoach || isRecruiter) {
    const chrome = isCoach ? 'coach' : isRecruiter ? recruiterChromeParam : String(chromeMode || '');
    if (!chrome) return basePath;
    const hasQ = basePath.includes('?');
    return `${basePath}${hasQ ? '&' : '?'}chrome=${encodeURIComponent(chrome)}`;
  }

  return basePath;
}

function buildSupportHref(chromeMode, router) {
  // Mirror SupportFloatingButton’s intent without touching that component.
  const queryChrome = String(router?.query?.chrome || '').toLowerCase();
  let chrome = queryChrome;

  if (!chrome) {
    if (chromeMode === 'recruiter-ent') chrome = 'recruiter-ent';
    else if (chromeMode === 'recruiter-smb') chrome = 'recruiter-smb';
    else if (chromeMode === 'coach') chrome = 'coach';
    else chrome = 'seeker';
  }

  return chrome ? `/support?chrome=${encodeURIComponent(chrome)}` : '/support';
}

export default function MobileBottomBar({ chromeMode = 'seeker', onOpenTools, isMobile = false }) {
  const router = useRouter();

  // ✅ Prevent broken-image UI: if SVG fails, fall back to emoji
  const [toolsIconOk, setToolsIconOk] = useState(true);
  const [dashIconOk, setDashIconOk] = useState(true);
  const [feedIconOk, setFeedIconOk] = useState(true);
  const [jobsIconOk, setJobsIconOk] = useState(true);
  const [calIconOk, setCalIconOk] = useState(true);

  // ✅ Final icon paths (public/icons/*.svg)
  const ICONS = {
    tools: '/icons/Tools.svg',
    dashboard: '/icons/Dashboard.svg',
    feed: '/icons/Feed.svg',
    jobs: '/icons/Jobs.svg',
    calendar: '/icons/Calendar.svg',
  };

  const routes = useMemo(() => {
    const map = {
      seeker: {
        dashboard: 'https://www.forgetomorrow.com/seeker-dashboard',
        feed: 'https://www.forgetomorrow.com/feed',
        jobs: 'https://www.forgetomorrow.com/jobs',
        calendar: 'https://www.forgetomorrow.com/seeker/calendar',
      },
      coach: {
        dashboard: 'https://www.forgetomorrow.com/coaching-dashboard',
        feed: 'https://www.forgetomorrow.com/feed', // chrome added by buildHref
        jobs: 'https://www.forgetomorrow.com/jobs', // chrome added by buildHref
        calendar: 'https://www.forgetomorrow.com/dashboard/coaching/sessions/calendar',
      },
      recruiter: {
        dashboard: 'https://www.forgetomorrow.com/recruiter/dashboard',
        feed: 'https://www.forgetomorrow.com/feed', // chrome added by buildHref (recruiter-smb for now)
        jobs: 'https://www.forgetomorrow.com/jobs', // chrome added by buildHref (recruiter-smb for now)
        calendar: 'https://www.forgetomorrow.com/recruiter/calendar', // ✅ confirmed
      },
    };

    const key =
      chromeMode === 'coach'
        ? 'coach'
        : chromeMode === 'recruiter-smb' || chromeMode === 'recruiter-ent'
        ? 'recruiter'
        : 'seeker';

    const r = map[key];
    return {
      dashboard: buildHref(r.dashboard, chromeMode),
      feed: buildHref(r.feed, chromeMode),
      jobs: buildHref(r.jobs, chromeMode),
      calendar: buildHref(r.calendar, chromeMode),
      support: buildSupportHref(chromeMode, router),
    };
  }, [chromeMode, router]);

  const pathname = String(router.pathname || '');

  const isActive = (href) => {
    try {
      const h = String(href || '');
      if (!h) return false;
      if (h.startsWith('http')) {
        const u = new URL(h);
        return pathname === u.pathname;
      }
      return pathname === h;
    } catch {
      return false;
    }
  };

  if (!isMobile) return null;

  const barStyle = {
    position: 'fixed',

    // ✅ full-width (no side cut)
    left: 0,
    right: 0,
    transform: 'none',
    width: '100%',

    // ✅ flush to phone nav (no gap)
    bottom: 0,

    zIndex: 99998,

    // ✅ rounded top corners, flat bottom edge
    borderRadius: '18px 18px 0 0',

    border: '1px solid rgba(255,255,255,0.22)',
    background: 'rgba(255,255,255,0.78)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',

    // ✅ shadow goes upward now that it's flush
    boxShadow: '0 -10px 26px rgba(0,0,0,0.18)',

    // ✅ safe-area aware padding
    paddingTop: 10,
    paddingLeft: 10,
    paddingRight: 10,
    paddingBottom: 'calc(10px + env(safe-area-inset-bottom))',

    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)', // 6 icons
    gap: 6,

    boxSizing: 'border-box',
  };

  const itemStyle = (active) => ({
    textDecoration: 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: '8px 4px',
    borderRadius: 14,
    border: active ? '1px solid rgba(17,32,51,0.18)' : '1px solid transparent',
    background: active ? 'rgba(255,255,255,0.65)' : 'transparent',
    color: '#112033',
    cursor: 'pointer',
    userSelect: 'none',
    minWidth: 0,
  });

  const labelStyle = {
    fontSize: 10.5,
    fontWeight: 800,
    lineHeight: 1,
    opacity: 0.92,
    whiteSpace: 'nowrap',
  };

  const iconStyle = {
    fontSize: 18,
    lineHeight: 1,
  };

  const imgIconStyle = {
    width: 22,
    height: 22,
    display: 'block',
    objectFit: 'contain',
  };

  return (
    <nav aria-label="Mobile bottom navigation" style={barStyle}>
      <button
        type="button"
        onClick={onOpenTools}
        style={{ ...itemStyle(false), border: '1px solid rgba(255,255,255,0.18)' }}
        aria-label="Open Tools"
      >
        {toolsIconOk ? (
          <img
            src={ICONS.tools}
            alt=""
            aria-hidden="true"
            style={imgIconStyle}
            onError={() => setToolsIconOk(false)}
          />
        ) : (
          <span style={iconStyle} aria-hidden="true">
            🧰
          </span>
        )}
        <span style={labelStyle}>Tools</span>
      </button>

      <Link href={routes.dashboard} passHref>
        <a style={itemStyle(isActive(routes.dashboard))} aria-label="Go to Dashboard">
          {dashIconOk ? (
            <img
              src={ICONS.dashboard}
              alt=""
              aria-hidden="true"
              style={imgIconStyle}
              onError={() => setDashIconOk(false)}
            />
          ) : (
            <span style={iconStyle} aria-hidden="true">
              🏠
            </span>
          )}
          <span style={labelStyle}>Dash</span>
        </a>
      </Link>

      <Link href={routes.feed} passHref>
        <a style={itemStyle(isActive(routes.feed))} aria-label="Go to Feed">
          {feedIconOk ? (
            <img
              src={ICONS.feed}
              alt=""
              aria-hidden="true"
              style={imgIconStyle}
              onError={() => setFeedIconOk(false)}
            />
          ) : (
            <span style={iconStyle} aria-hidden="true">
              🔥
            </span>
          )}
          <span style={labelStyle}>Feed</span>
        </a>
      </Link>

      <Link href={routes.jobs} passHref>
        <a style={itemStyle(isActive(routes.jobs))} aria-label="Go to Jobs">
          {jobsIconOk ? (
            <img
              src={ICONS.jobs}
              alt=""
              aria-hidden="true"
              style={imgIconStyle}
              onError={() => setJobsIconOk(false)}
            />
          ) : (
            <span style={iconStyle} aria-hidden="true">
              💼
            </span>
          )}
          <span style={labelStyle}>Jobs</span>
        </a>
      </Link>

      <Link href={routes.calendar} passHref>
        <a style={itemStyle(isActive(routes.calendar))} aria-label="Go to Calendar">
          {calIconOk ? (
            <img
              src={ICONS.calendar}
              alt=""
              aria-hidden="true"
              style={imgIconStyle}
              onError={() => setCalIconOk(false)}
            />
          ) : (
            <span style={iconStyle} aria-hidden="true">
              📅
            </span>
          )}
          <span style={labelStyle}>Cal</span>
        </a>
      </Link>

      <Link href={routes.support} passHref>
        <a style={itemStyle(isActive(routes.support))} aria-label="Open Support Center">
          <span style={iconStyle} aria-hidden="true">
            💬
          </span>
          <span style={labelStyle}>Support</span>
        </a>
      </Link>
    </nav>
  );
}
