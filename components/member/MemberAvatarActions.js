// components/member/MemberAvatarActions.js
// ─────────────────────────────────────────────────────────────────────────────
// Unified avatar action system. One component, used on every page.
// Derives all context from router.pathname — no manual surface prop needed.
// Status fetch is lazy: only fires when the dropdown opens, eliminating the
// loading flash and wasted API calls on pages with many avatars.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useProfileViewLogger } from '../actions/useProfileViewLogger';

// ─── Page → capability map ────────────────────────────────────────────────────
// Defines which actions are suppressed on which pages.
// "profile"  — already viewing this person's profile, hide "View profile"
// "signal"   — already in messaging, hide "Message"
// "contacts" — already in contact center, hide "Connect" / accept / decline
const PAGE_RULES = {
  '/u/[slug]':                  { hideProfile: true },
  '/profile/[slug]':            { hideProfile: true },
  '/profile/view/[slug]':       { hideProfile: true },
  '/seeker/messages':           { hideMessage: true, hideConnect: true },
  '/recruiter/messages':        { hideMessage: true, hideConnect: true },
  '/signal':                    { hideMessage: true, hideConnect: true },
  '/seeker/contacts':           { hideConnect: true },
  '/contact-center':            { hideConnect: true },
  '/recruiter/contact-center':  { hideConnect: true },
  '/contacts':                  { hideConnect: true },
};

export default function MemberAvatarActions({
  children,
  targetUserId,
  targetUserSlug,
  targetName = 'Member',
  // Override props — only use these when you genuinely need to force a value.
  // Under normal circumstances leave them undefined and let the router decide.
  forceHideProfile,
  forceHideMessage,
  forceHideConnect,
  profilePath,       // override the destination path if needed
  stopPropagation = true,
}) {
  const router  = useRouter();
  const chrome  = String(router.query.chrome || '').toLowerCase();
  const { logView } = useProfileViewLogger();
  const containerRef = useRef(null);

  const [open,      setOpen]      = useState(false);
  const [status,    setStatus]    = useState('idle'); // idle | loading | none | outgoing | incoming | connected
  const [requestId, setRequestId] = useState(null);
  const [actioning, setActioning] = useState(false);

  // ── Derive page rules from router ─────────────────────────────────────────
  const rules       = PAGE_RULES[router.pathname] || {};
  const hideProfile = forceHideProfile ?? rules.hideProfile ?? false;
  const hideMessage = forceHideMessage ?? rules.hideMessage ?? false;
  const hideConnect = forceHideConnect ?? rules.hideConnect ?? false;

  // ── Resolved paths ────────────────────────────────────────────────────────
  const withChrome = (path) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

  // Internal pages always go to the internal portfolio view.
  // External links (og:url, share sheet) still use /u/[slug].
  const resolvedProfilePath =
    profilePath || (targetUserSlug ? `/profile/view/${targetUserSlug}` : '');

  // ── Lazy status fetch — only when dropdown opens ──────────────────────────
  const fetchStatus = useCallback(async () => {
    if (!targetUserId || status !== 'idle') return;
    setStatus('loading');
    try {
      const res  = await fetch(`/api/contacts/status?userId=${targetUserId}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setStatus(data.status || 'none');
      setRequestId(data.requestId || null);
    } catch (err) {
      console.error('[MemberAvatarActions] status fetch error:', err);
      setStatus('none');
    }
  }, [targetUserId, status]);

  const toggle = (e) => {
    if (stopPropagation) { e?.preventDefault(); e?.stopPropagation(); }
    if (!targetUserId) return;
    if (!open) fetchStatus(); // lazy load on first open
    setOpen(v => !v);
  };

  const close = () => setOpen(false);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [open]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const viewProfile = async () => {
    if (!resolvedProfilePath) return;
    try { await logView(targetUserId, 'avatar-actions'); } catch { /* non-blocking */ }
    close();
    router.push(withChrome(resolvedProfilePath));
  };

  const messageUser = async () => {
    if (actioning) return;
    if (status === 'loading') {
      alert('Still checking your connection status. Try again in a moment.');
      return;
    }
    if (status === 'none') {
      alert('Connect with this member first. Once connected you can message them from The Signal.');
      close(); return;
    }
    if (status === 'outgoing') {
      alert('Your connection request is pending. You can message them once they accept.');
      close(); return;
    }
    if (status === 'incoming') {
      alert('This member sent you a connection request. Accept it in your Contact Center, then you can message them.');
      close(); return;
    }
    if (status !== 'connected') { close(); return; }

    setActioning(true);
    try {
      const res = await fetch('/api/signal/start-or-get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId: targetUserId }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        const msg = payload?.message;
        const role = payload?.role;
        alert(
          msg || (role === 'COACH'
            ? 'Send a connection request or explore their mentorship offerings before messaging.'
            : role === 'RECRUITER'
            ? 'Connect with this recruiter before messaging.'
            : 'You need additional permission to message this member.')
        );
        close(); return;
      }
      const params = new URLSearchParams({ toId: targetUserId, toName: targetName });
      close();
      router.push(withChrome(`/seeker/messages?${params}`));
    } catch (err) {
      console.error('[MemberAvatarActions] messageUser error:', err);
      alert('Could not open this conversation. Please try again.');
    } finally {
      setActioning(false);
    }
  };

  const sendConnect = async () => {
    if (actioning || status !== 'none') return;
    setActioning(true);
    try {
      const res  = await fetch('/api/contacts/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId: targetUserId }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      if (data.alreadyConnected) {
        setStatus('connected'); setRequestId(null);
        alert('You are already connected with this member.');
      } else if (data.status === 'PENDING') {
        setStatus('outgoing'); setRequestId(data.requestId || null);
        alert(data.reopened ? 'Connection request re-sent.' : 'Connection request sent.');
      } else {
        alert('Could not send your connection request. Please try again.');
      }
    } catch (err) {
      console.error('[MemberAvatarActions] sendConnect error:', err);
      alert('Could not send your connection request. Please try again.');
    } finally {
      setActioning(false);
      close();
    }
  };

  const acceptInvite = async () => {
    if (!requestId || actioning) return;
    setActioning(true);
    try {
      const res = await fetch('/api/contacts/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action: 'accept' }),
      });
      if (!res.ok) throw new Error(await res.text());
      setStatus('connected'); setRequestId(null);
    } catch (err) {
      console.error('[MemberAvatarActions] acceptInvite error:', err);
      alert('Could not accept this invitation.');
    } finally {
      setActioning(false);
    }
  };

  const declineInvite = async () => {
    if (!requestId || actioning) return;
    setActioning(true);
    try {
      await fetch('/api/contacts/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action: 'decline' }),
      });
      setStatus('none'); setRequestId(null);
    } catch (err) {
      console.error('[MemberAvatarActions] declineInvite error:', err);
    } finally {
      setActioning(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (!targetUserId) return children;

  const Btn = ({ children, onClick, disabled, muted }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || actioning}
      style={{
        display: 'block', width: '100%', textAlign: 'left',
        padding: '8px 14px', border: 'none', background: 'transparent',
        fontSize: 13, fontWeight: 600, cursor: disabled || actioning ? 'default' : 'pointer',
        color: muted ? '#9ca3af' : '#111827',
        opacity: actioning ? 0.6 : 1,
        fontFamily: 'inherit',
        borderRadius: 6,
        transition: 'background 0.12s',
      }}
      onMouseEnter={e => { if (!disabled && !actioning) e.currentTarget.style.background = '#f9fafb'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >
      {children}
    </button>
  );

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <div onClick={toggle} style={{ cursor: 'pointer' }}>{children}</div>

      {open && (
        <div style={{
          position: 'absolute', zIndex: 200, top: 'calc(100% + 6px)', left: 0,
          minWidth: 188, background: 'white', borderRadius: 10,
          border: '1px solid #e5e7eb', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '10px 14px 8px', borderBottom: '1px solid #f3f4f6',
            fontSize: 13, fontWeight: 700, color: '#111827',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {targetName}
          </div>

          {/* Actions */}
          <div style={{ padding: '4px 0' }}>
            {!hideProfile && resolvedProfilePath && (
              <Btn onClick={viewProfile}>View portfolio</Btn>
            )}

            {!hideMessage && (
              status === 'loading'
                ? <Btn muted disabled>Checking status…</Btn>
                : status === 'connected'
                ? <Btn onClick={messageUser}>Message</Btn>
                : null
            )}

            {!hideConnect && (
              <>
                {status === 'none'     && <Btn onClick={sendConnect}>Connect</Btn>}
                {status === 'outgoing' && <Btn muted disabled>Request sent</Btn>}
                {status === 'incoming' && (
                  <>
                    <Btn onClick={acceptInvite}>Accept invite</Btn>
                    <Btn onClick={declineInvite}>Decline</Btn>
                  </>
                )}
              </>
            )}

            {status === 'connected' && !hideConnect && (
              <Btn muted disabled>Connected</Btn>
            )}
          </div>
        </div>
      )}
    </div>
  );
}