// components/member/MemberActions.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useProfileViewLogger } from '../actions/useProfileViewLogger';

export default function MemberActions({
  targetUserId,
  targetName = 'Member',
  layout = 'menu', // menu | inline (future)
  onClose,
}) {
  const router = useRouter();
  const chrome = String(router.query.chrome || '').toLowerCase();
  const { logView } = useProfileViewLogger();

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
        const res = await fetch(`/api/contacts/status?userId=${targetUserId}`);
        if (!res.ok) throw new Error(await res.text());

        const data = await res.json();
        setStatus(data.status || 'none');
        setRequestId(data.requestId || null);
      } catch (err) {
        console.error('MemberActions status error:', err);
        setStatus('none');
        setRequestId(null);
      }
    }

    loadStatus();
  }, [targetUserId]);

  // ── Actions ──────────────────────────────────────────────

  const viewProfile = async () => {
    if (!targetUserId) return;

    // log profile view for analytics
    try {
      await logView(targetUserId, 'member-actions');
    } catch (err) {
      console.error('logView error in MemberActions:', err);
    }

    onClose?.();
    router.push(withChrome(`/member-profile?userId=${targetUserId}`));
  };

  const messageUser = async () => {
    if (!targetUserId || isSelf) return;

    // 🔹 FRONT-END GATE: require connection before DM
    if (status === 'loading') {
      alert(
        'We are still checking your relationship with this member. Please try again in a moment.'
      );
      onClose?.();
      return;
    }

    if (status === 'none') {
      alert(
        'To keep DMs respectful, please send a connection request first. Once you are connected, you can open a private conversation from The Signal.'
      );
      onClose?.();
      return;
    }

    if (status === 'outgoing') {
      alert(
        'You already have a pending connection request with this member. Once they accept, you can message them from The Signal.'
      );
      onClose?.();
      return;
    }

    if (status === 'incoming') {
      alert(
        'This member has already sent you an invitation. Visit your Contact Center → Invites to accept it. After you accept, you can message them from The Signal.'
      );
      onClose?.();
      return;
    }

    // 🔹 Only CONNECTED can actually open / start a DM
    if (status !== 'connected') {
      // Fallback safety — should not hit, but just in case.
      alert(
        'You need to be connected with this member before opening a private conversation.'
      );
      onClose?.();
      return;
    }

    // From here, we’re connected → safe to ask the backend to start/get convo
    try {
      const res = await fetch('/api/signal/start-or-get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId: targetUserId }),
      });

      if (!res.ok) {
        if (res.status === 403) {
          let payload = null;
          try {
            payload = await res.json();
          } catch {
            // ignore parse issues; use generic text
          }

          const role = payload?.role;
          const msg = payload?.message;

          if (role === 'COACH') {
            alert(
              msg ||
                'To respect the privacy of coaches, please send a connection request or explore their mentorship offerings before messaging.'
            );
          } else if (role === 'RECRUITER') {
            alert(
              msg ||
                'To respect the privacy of recruiters, please send a connection request before opening a private conversation.'
            );
          } else {
            alert(
              msg ||
                'You need additional permission to message this member at this time.'
            );
          }

          onClose?.();
          return;
        }

        const text = await res.text();
        console.error('signal/start-or-get error (MemberActions):', text);
        alert('We could not open this conversation. Please try again.');
        onClose?.();
        return;
      }

      // Allowed: we can safely route into The Signal.
      const params = new URLSearchParams();
      params.set('toId', targetUserId);
      if (targetName) params.set('toName', targetName);

      onClose?.();
      router.push(withChrome(`/seeker/messages?${params.toString()}`));
    } catch (err) {
      console.error('messageUser error (MemberActions):', err);
      alert('We could not open this conversation. Please try again.');
      onClose?.();
    }
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

      if (data.alreadyConnected) {
        // Backend says they are already contacts
        setStatus('connected');
        setRequestId(null);
        alert('You are already connected with this member.');
      } else if (data.alreadyRequested && data.status === 'PENDING') {
        // There is an existing pending request in either direction
        setStatus('outgoing');
        setRequestId(data.requestId || null);
        alert(
          'You already have a pending connection request with this member.'
        );
      } else if (data.status === 'PENDING') {
        // Fresh or reopened request
        setStatus('outgoing');
        setRequestId(data.requestId || null);
        alert(
          data.reopened
            ? 'Connection request re-sent.'
            : 'Connection request sent.'
        );
      } else {
        // Fallback; should not normally hit
        console.warn('Unexpected contacts/request payload:', data);
        alert('We could not send your connection request. Please try again.');
      }
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
      setRequestId(null);
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
        disabled ? 'text-gray-400 cursor-default' : 'hover:bg-gray-50'
      }`}
    >
      {children}
    </button>
  );

  // ── UI ──────────────────────────────────────────────────

  return (
    <>
      <Button onClick={viewProfile}>View profile</Button>

      {/* Message is always visible, but front-end gated by status */}
      {!isSelf && <Button onClick={messageUser}>Message</Button>}

      {status === 'none' && <Button onClick={sendConnect}>Connect</Button>}

      {status === 'outgoing' && <Button disabled>Requested</Button>}

      {status === 'incoming' && (
        <>
          <Button onClick={acceptInvite}>Accept</Button>
          <Button onClick={declineInvite}>Decline</Button>
        </>
      )}
    </>
  );
}
