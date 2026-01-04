// components/mobile/MobileBottomBar.js
import React, { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

function buildHref(basePath, chromeMode) {
  // Keep URLs consistent with your mapping
  // - seeker: no chrome param
  // - coach: chrome=coach for Feed/Jobs (Dashboard/Calendar already have their own paths)
  // - recruiter: use chrome=recruiter-smb for Feed/Jobs for now (matches current behavior)
  if (!basePath) return '/';

  const isAbsolute = /^https?:\/\//i.test(basePath);
  const url = isAbsolute ? new URL(basePath) : null;

  const isSeeker = chromeMode === 'seeker';
  const isCoach = chromeMode === 'coach';
  const isRecruiter = chromeMode === 'recruiter-smb' || chromeMode === 'recruiter-ent';

  const recruiterChromeParam = 'recruiter-smb'; // ✅ matches your current live behavior

  if (isAbsolute) {
    // Only add chrome param where needed (Feed/Jobs)
    if (!isSeeker && (isCoach || isRecruiter)) {
      const chrome =
        isCoach ? 'coach' : isRecruiter ? recruiterChromeParam : String(chromeMode || '');
      if (chrome) url.searchParams.set('chrome', chrome);
    }
    return url.toString();
  }

  // Relative path
  if (isSeeker) return basePath;

  if (isCoach || isRecruiter) {
    const chrome = isCoach ? 'coach' : isRecruiter ? recruiterChromeParam : String(chromeMode || '');
    if (!chrome) return basePath;
    const hasQ = basePath.includes('?');
    return `${basePath}${hasQ ? '&' : '?'}chrome=${encodeURIComponent(chrome)}`;
  }

  return basePath;
}

export default function MobileBottomBar({
  chromeMode = 'seeker',
  onOpenTools,
  isMobile = false,
}) {
  const router = useRouter();

  const routes = useMemo(() => {
    // ✅ Uses exactly the URLs you provided
    const map = {
      seeker: {
        dashboard: 'https://www.forgetomorrow.com/seeker-dashboard',
        feed: 'https://www.forgetomorrow.com/feed',
        jobs: 'https://www.forgetomorrow.com/jobs',
        calendar: 'https://www.forgetomorrow.com/seeker/calendar',
      },
      coach: {
        dashboard: 'https://www.forgetomorrow.com/coaching-dashboard',
        feed: 'https://www.forgetomorrow.com/feed', // chrome param added by buildHref
        jobs: 'https://www.forgetomorrow.com/jobs', // chrome param added by buildHref
        calendar: 'https://www.forgetomorrow.com/dashboard/coaching/sessions/calendar',
      },
      recruiter: {
        dashboard: 'https://www.forgetomorrow.com/recruiter/dashboard',
        feed: 'https://www.forgetomorrow.com/feed', // chrome param added by buildHref (recruiter-smb for now)
        jobs: 'https://www.forgetomorrow.com/jobs', // chrome param added by buildHref (recruiter-smb for now)
        // ⚠️ You didn’t provide recruiter calendar yet — safest guess:
        calendar: 'https://www.forgetomorrow.com/recruiter/calendar',
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
    };
  }, [chromeMode]);

  const pathname = String(router.pathname || '');

  // Minimal active hint (best-effort)
  const isActive = (href) => {
    try {
      const h = String(href || '');
      if (!h) return false;
      // If absolute, compare path
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
    left: '50%',
    transform: 'translateX(-50%)',
    bottom: 10,
    zIndex: 99998,
    width: 'min(760px, calc(100% - 20px))',
    borderRadius: 18,
    border: '1px solid rgba(255,255,255,0.22)',
    background: 'rgba(255,255,255,0.78)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    boxShadow: '0 10px 26px rgba(0,0,0,0.18)',
    padding: '10px 10px',
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: 6,
  };

  const itemStyle = (active) => ({
    textDecoration: 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: '8px 6px',
    borderRadius: 14,
    border: active ? '1px solid rgba(17,32,51,0.18)' : '1px solid transparent',
    background: active ? 'rgba(255,255,255,0.65)' : 'transparent',
    color: '#112033',
    cursor: 'pointer',
    userSelect: 'none',
  });

  const labelStyle = {
    fontSize: 11,
    fontWeight: 700,
    lineHeight: 1,
    opacity: 0.92,
  };

  const iconStyle = {
    fontSize: 18,
    lineHeight: 1,
  };

  return (
    <nav aria-label="Mobile bottom navigation" style={barStyle}>
      <button
        type="button"
        onClick={onOpenTools}
        style={{
          ...itemStyle(false),
          border: '1px solid rgba(255,255,255,0.18)',
        }}
        aria-label="Open Tools"
      >
        <span style={iconStyle}>🧰</span>
        <span style={labelStyle}>Tools</span>
      </button>

      <Link href={routes.dashboard} passHref>
        <a style={itemStyle(isActive(routes.dashboard))} aria-label="Go to Dashboard">
          <span style={iconStyle}>🏠</span>
          <span style={labelStyle}>Dashboard</span>
        </a>
      </Link>

      <Link href={routes.feed} passHref>
        <a style={itemStyle(isActive(routes.feed))} aria-label="Go to Feed">
          <span style={iconStyle}>🔥</span>
          <span style={labelStyle}>Feed</span>
        </a>
      </Link>

      <Link href={routes.jobs} passHref>
        <a style={itemStyle(isActive(routes.jobs))} aria-label="Go to Jobs">
          <span style={iconStyle}>💼</span>
          <span style={labelStyle}>Jobs</span>
        </a>
      </Link>

      <Link href={routes.calendar} passHref>
        <a style={itemStyle(isActive(routes.calendar))} aria-label="Go to Calendar">
          <span style={iconStyle}>📅</span>
          <span style={labelStyle}>Calendar</span>
        </a>
      </Link>
    </nav>
  );
}
