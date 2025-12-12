// components/member/MemberActions.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function MemberActions({
  targetUserId,
  targetName = 'Member',
  layout = 'menu', // menu | inline
  onClose,
}) {
  const router = useRouter();
  const chrome = String(router.query.chrome || '').toLowerCase();

  const withChrome = (path) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

  const [status, setStatus] = useState('loading');
  // loading | none | outgoing | incoming | connected

  const [requestId, setRequestId] = useState(null);

  // NOTE:
  // We intentionally do not try to infer "self" here.
  // Backend already blocks self-connect and self-message.
  const isSelf = false;

  // ── Load relationship status ────────────────────────────
  useEffect(() => {
    if (!targetUserId) return;

    async function loadStatus() {
      try {
        const res = await fetch(
          `/api/contacts/status?userId=${targetUserId}`
        );
        if (!res.ok) throw new Error(await res.text());

        const data = await res.json();
        setStatus(data.status || 'none');
        setRequestId(data.requestId || null);
      } catch (err) {
        console.error('MemberActions status error:', err);
        setStatus('none');
      }
    }

    loadStatus();
  }, [targetUserId]);

  // ── Actions ──────────────────────────────────────────────

  const viewProfile = async () => {
    if (!targetUserId) return;
    onClose?.();
    router.push(withChrome(`/member-profile?userId=${targetUserId}`));
  };

  const messageUser = () => {
    if (!targetUserId || isSelf) return;
    onClose?.();

    const params = new URLSearchParams();
    params.set('toId', targetUserId);
    params.set('toName', targetName);

    router.push(withChrome(`/seeker/messages?${params.toString()}`));
  };

  const sendConnect = async () => {
    if (!targetUserId || status !== 'none') return;

    try {
      const res = await fetch('/api/contacts/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId: targetUserId }),
      });

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      setStatus('outgoing');
      setRequestId(data.requestId || null);
    } catch (err) {
      console.error('connect error:', err);
      alert('We could not send your connection request. Please try again.');
    } finally {
      onClose?.();
    }
  };

  const acceptInvite = async () => {
    if (!requestId) return;

    try {
      const res = await fetch('/api/contacts/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action: 'accept' }),
      });

      if (!res.ok) throw new Error(await res.text());
      setStatus('connected');
    } catch (err) {
      console.error('accept error:', err);
      alert('We could not accept this invitation.');
    }
  };

  const declineInvite = async () => {
    if (!requestId) return;

    try {
      await fetch('/api/contacts/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action: 'decline' }),
      });
      setStatus('none');
    } catch (err) {
      console.error('decline error:', err);
    }
  };

  // ── Render helpers ──────────────────────────────────────

  const Button = ({ children, onClick, disabled }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left px-3 py-2 text-sm ${
        disabled
          ? 'text-gray-400 cursor-default'
          : 'hover:bg-gray-50'
      }`}
    >
      {children}
    </button>
  );

  // ── UI ──────────────────────────────────────────────────

  return (
    <>
      <Button onClick={viewProfile}>View profile</Button>

      {/* ✅ Message is now always available for non-self users */}
      {!isSelf && (
        <Button onClick={messageUser}>Message</Button>
      )}

      {status === 'none' && (
        <Button onClick={sendConnect}>Connect</Button>
      )}

      {status === 'outgoing' && (
        <Button disabled>Requested</Button>
      )}

      {status === 'incoming' && (
        <>
          <Button onClick={acceptInvite}>Accept</Button>
          <Button onClick={declineInvite}>Decline</Button>
        </>
      )}
    </>
  );
}
