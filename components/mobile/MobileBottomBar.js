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

  // ✅ current live behavior: recruiter-ent temporarily routes as recruiter-smb for shared surfaces
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

function isAbsoluteUrl(href) {
  return /^https?:\/\//i.test(String(href || ''));
}

export default function MobileBottomBar({ chromeMode = 'seeker', onOpenTools, isMobile = false }) {
  const router = useRouter();

  // ✅ Prevent broken-image UI: if icon fails, fall back to emoji
  const [toolsIconOk, setToolsIconOk] = useState(true);
  const [dashIconOk, setDashIconOk] = useState(true);
  const [feedIconOk, setFeedIconOk] = useState(true);
  const [msgsIconOk, setMsgsIconOk] = useState(true);
  const [supportIconOk, setSupportIconOk] = useState(true);

  // ✅ Final icon paths (public/icons/*.png)
  const ICONS = {
    tools: '/icons/tools.png',
    dashboard: '/icons/dashboard.png',
    feed: '/icons/feed.png',
    messages: '/icons/messages.png',
    support: '/icons/support.png',
  };

  const routes = useMemo(() => {
    const map = {
      seeker: {
        dashboard: 'https://www.forgetomorrow.com/seeker-dashboard',
        feed: 'https://www.forgetomorrow.com/feed',
        messages: 'https://www.forgetomorrow.com/messages',
      },
      coach: {
        dashboard: 'https://www.forgetomorrow.com/coaching-dashboard',
        feed: 'https://www.forgetomorrow.com/feed',
        messages: 'https://www.forgetomorrow.com/messages',
      },
      recruiter: {
        dashboard: 'https://www.forgetomorrow.com/recruiter/dashboard',
        feed: 'https://www.forgetomorrow.com/feed',
        messages: 'https://www.forgetomorrow.com/messages',
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
      messages: buildHref(r.messages, chromeMode),
      support: buildSupportHref(chromeMode, router),
    };
  }, [chromeMode, router]);

  const pathname = String(router.pathname || '');

  const isActive = (href) => {
    try {
      const h = String(href || '');
      if (!h) return false;

      if (isAbsoluteUrl(h)) {
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
    left: 0,
    right: 0,
    transform: 'none',
    width: '100%',
    bottom: 0,
    zIndex: 99998,
    borderRadius: '18px 18px 0 0',
    border: '1px solid rgba(255,255,255,0.22)',
    background: 'rgba(255,255,255,0.78)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    boxShadow: '0 -10px 26px rgba(0,0,0,0.18)',
    paddingTop: 10,
    paddingLeft: 10,
    paddingRight: 10,
    paddingBottom: 'calc(10px + env(safe-area-inset-bottom))',
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
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

  // ✅ Link wrapper that avoids nested <a> and handles absolute URLs safely
  const NavLink = ({ href, active, ariaLabel, children }) => {
    const h = String(href || '');
    if (!h) return null;

    if (isAbsoluteUrl(h)) {
      return (
        <a href={h} style={itemStyle(active)} aria-label={ariaLabel}>
          {children}
        </a>
      );
    }

    return (
      <Link href={h} style={itemStyle(active)} aria-label={ariaLabel}>
        {children}
      </Link>
    );
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
            🔧
          </span>
        )}
        <span style={labelStyle}>Tools</span>
      </button>

      <NavLink href={routes.dashboard} active={isActive(routes.dashboard)} ariaLabel="Go to Dashboard">
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
      </NavLink>

      <NavLink href={routes.feed} active={isActive(routes.feed)} ariaLabel="Go to Feed">
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
      </NavLink>

      <NavLink href={routes.messages} active={isActive(routes.messages)} ariaLabel="Go to Messages">
        {msgsIconOk ? (
          <img
            src={ICONS.messages}
            alt=""
            aria-hidden="true"
            style={imgIconStyle}
            onError={() => setMsgsIconOk(false)}
          />
        ) : (
          <span style={iconStyle} aria-hidden="true">
            ✉️
          </span>
        )}
        <span style={labelStyle}>Msgs</span>
      </NavLink>

      <NavLink href={routes.support} active={isActive(routes.support)} ariaLabel="Open Support Center">
        {supportIconOk ? (
          <img
            src={ICONS.support}
            alt=""
            aria-hidden="true"
            style={imgIconStyle}
            onError={() => setSupportIconOk(false)}
          />
        ) : (
          <span style={iconStyle} aria-hidden="true">
            🛟
          </span>
        )}
        <span style={labelStyle}>Support</span>
      </NavLink>
    </nav>
  );
}