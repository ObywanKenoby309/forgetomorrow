// pages/foundry/guest/[roomId].js
// The Foundry room experience for external guests.
// No ForgeTomorrow auth required. Uses guest invite code + Daily guest token only.

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import FoundryLayout from '@/components/foundry/FoundryLayout';
import FoundryTopBar from '@/components/foundry/FoundryTopBar';
import FoundryVideoGrid from '@/components/foundry/FoundryVideoGrid';
import FoundryRightPanel from '@/components/foundry/FoundryRightPanel';
import FoundryBottomBar from '@/components/foundry/FoundryBottomBar';
import GuestConversionBanner from '@/components/foundry/GuestConversionBanner';

const ORANGE = '#FF7043';

const S = {
  page: {
    minHeight: '100vh',
    background: '#0b0d11',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'DM Sans', sans-serif",
    padding: 20,
    color: '#e5e7eb',
  },
  card: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: '32px 30px',
    maxWidth: 420,
    width: '100%',
    boxSizing: 'border-box',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: 'rgba(255,112,67,0.15)',
    border: '1px solid rgba(255,112,67,0.3)',
    color: ORANGE,
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: '0.06em',
    padding: '3px 9px',
    borderRadius: 5,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  heading: { fontSize: 20, fontWeight: 800, color: '#f0f0f0', margin: '0 0 8px' },
  sub: { fontSize: 12, color: '#9ca3af', margin: '0 0 22px', lineHeight: 1.6 },
  label: { fontSize: 11, color: '#9ca3af', marginBottom: 5, display: 'block', fontWeight: 700 },
  input: {
    width: '100%',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: '10px 12px',
    color: '#e0e0e0',
    fontSize: 13,
    outline: 'none',
    marginBottom: 10,
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  btn: {
    width: '100%',
    background: ORANGE,
    border: 'none',
    color: '#fff',
    borderRadius: 8,
    padding: '11px 14px',
    fontSize: 13,
    fontWeight: 800,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  error: {
    color: '#ef5350',
    fontSize: 12,
    lineHeight: 1.5,
    marginBottom: 12,
  },
};

export async function getServerSideProps({ params, query }) {
  const { roomId } = params;
  const code = typeof query.code === 'string' ? query.code : '';

  let title = 'Foundry session';
  let hostName = 'Your host';
  let scheduledAt = null;
  let timezone = 'America/New_York';
  let serverError = '';

  if (code) {
    try {
      const { prisma } = await import('@/lib/prisma');
      const room = await prisma.foundryRoom.findUnique({
        where: { roomId },
        select: {
          roomId: true,
          title: true,
          status: true,
          guestToken: true,
          scheduledAt: true,
          timezone: true,
          host: { select: { firstName: true, lastName: true } },
        },
      });

      if (!room) serverError = 'Foundry not found.';
      else if (room.status === 'ENDED') serverError = 'This Foundry has already ended.';
      else if (room.guestToken !== code) serverError = 'Invalid or expired invite link.';
      else {
        title = room.title || title;
        hostName = [room.host?.firstName, room.host?.lastName].filter(Boolean).join(' ') || hostName;
        scheduledAt = room.scheduledAt?.toISOString() || null;
        timezone = room.timezone || timezone;
      }
    } catch (err) {
      console.error('[foundry/guest/[roomId]]', err);
      serverError = 'Something went wrong. Please try again.';
    }
  }

  return {
    props: {
      roomId,
      guestCode: code,
      title,
      hostName,
      scheduledAt,
      timezone,
      serverError,
    },
  };
}

export default function GuestFoundryRoom({
  roomId,
  guestCode,
  title,
  hostName,
  scheduledAt,
  timezone,
  serverError,
}) {
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestToken, setGuestToken] = useState('');
  const [roomUrl, setRoomUrl] = useState('');
  const [error, setError] = useState(serverError || '');
  const [joining, setJoining] = useState(false);

  const [micMuted, setMicMuted] = useState(true);
  const [camOff, setCamOff] = useState(false);
  const [isRecording] = useState(false);

  const [activeView, setActiveView] = useState('grid');
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [compact, setCompact] = useState(false);
  const [activePanel, setActivePanel] = useState('People');
  const [showConversionBanner, setShowConversionBanner] = useState(false);

  const callRef = useRef(null);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const startTimeRef = useRef(Date.now());

  const enterRoom = useCallback((name, token, url) => {
    if (!name || !token || !url) return false;
    setGuestName(name);
    setGuestToken(token);
    setRoomUrl(url);
    setReady(true);
    setError('');
    return true;
  }, []);

  useEffect(() => {
    if (!roomId) return;

    try {
      const storedName = sessionStorage.getItem('foundry_guest_name') || '';
      const storedToken = sessionStorage.getItem('foundry_guest_token') || '';
      const storedUrl = sessionStorage.getItem('foundry_guest_room_url') || '';
      const storedRoomId = sessionStorage.getItem('foundry_guest_room_id') || '';

      if ((!storedRoomId || storedRoomId === roomId) && enterRoom(storedName, storedToken, storedUrl)) {
        return;
      }

      if (storedName && guestCode && !serverError) {
        setGuestName(storedName);
      }
    } catch {}
  }, [roomId, guestCode, serverError, enterRoom]);

  const requestGuestToken = async () => {
    const name = guestName.trim();

    if (!guestCode) {
      setError('Invalid guest session. Please use your invite link again.');
      return;
    }

    if (!name) {
      setError('Please enter your name.');
      return;
    }

    try {
      setJoining(true);
      setError('');

      const res = await fetch('/api/foundry/guest-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, guestCode, guestName: name }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || 'Could not join Foundry.');
        setJoining(false);
        return;
      }

      try {
        sessionStorage.setItem('foundry_guest_name', name);
        sessionStorage.setItem('foundry_guest_token', data.token);
        sessionStorage.setItem('foundry_guest_room_url', data.roomUrl);
        sessionStorage.setItem('foundry_guest_room_id', roomId);
      } catch {}

      enterRoom(name, data.token, data.roomUrl);
    } catch (err) {
      console.error('[foundry guest room] token request failed:', err);
      setError('Network error. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  const handleEnd = useCallback(() => {
    if (callRef.current) {
      callRef.current.leave().catch(() => {});
    }
    setShowConversionBanner(true);
  }, []);

  const handleCallReady = useCallback((call) => {
    callRef.current = call;
  }, []);

  const handleParticipantsChange = useCallback((list) => {
    setParticipants(
      list.map((p) => ({
        id: p.session_id,
        name: p.user_name || 'Guest',
        isHost: !!p.owner,
        micMuted: !p.tracks?.audio || p.tracks.audio.state === 'off',
        videoOff: !p.tracks?.video || p.tracks.video.state === 'off',
        local: p.local,
      }))
    );
  }, []);

  const handleSend = useCallback((text) => {
    const now = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    setMessages((prev) => [
      ...prev,
      {
        sender: guestName || 'You',
        text,
        time: now,
        color: '#888',
      },
    ]);

    if (callRef.current) {
      try {
        callRef.current.sendAppMessage(
          {
            type: 'MEETING_CHAT',
            senderName: guestName || 'Guest',
            text,
            time: now,
            color: '#888',
            avatarUrl: null,
          },
          '*'
        );
      } catch {}
    }
  }, [guestName]);

  const togglePanel = (tab) => {
    if (sidebarHidden) setSidebarHidden(false);
    setActivePanel(tab);
  };

  const goBackToInvite = () => {
    if (guestCode) {
      router.replace(`/foundry/join/${roomId}?code=${encodeURIComponent(guestCode)}`);
      return;
    }
    router.replace('/foundry');
  };

  const dateStr = scheduledAt
    ? new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
      }).format(new Date(scheduledAt))
    : null;

  if (showConversionBanner) {
    return (
      <div style={S.page}>
        <GuestConversionBanner guestName={guestName} />
      </div>
    );
  }

  if (!ready) {
    return (
      <>
        <Head>
          <title>{title} · ForgeTomorrow Foundry</title>
        </Head>
        <div style={S.page}>
          <div style={S.card}>
            <div style={S.badge}>🔨 Foundry</div>
            <h1 style={S.heading}>{error ? 'Unable to join' : 'Enter Foundry'}</h1>
            <p style={S.sub}>
              {hostName} invited you to join {title ? <strong style={{ color: '#e5e7eb' }}>{title}</strong> : 'a Foundry session'}.
              {dateStr ? <><br />{dateStr}</> : null}
            </p>

            {error && <div style={S.error}>{error}</div>}

            {!serverError && guestCode ? (
              <>
                <label style={S.label}>Your name</label>
                <input
                  style={S.input}
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && requestGuestToken()}
                  placeholder="Enter your full name"
                  autoFocus
                />
                <button
                  type="button"
                  style={{ ...S.btn, opacity: joining ? 0.7 : 1 }}
                  onClick={requestGuestToken}
                  disabled={joining}
                >
                  {joining ? 'Joining Foundry…' : 'Join Foundry'}
                </button>
              </>
            ) : (
              <button type="button" style={S.btn} onClick={goBackToInvite}>
                Return to invite
              </button>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <FoundryTopBar
        sessionTitle={title || `Foundry · ${roomId}`}
        isRecording={isRecording}
        startTime={startTimeRef.current}
        activeView={activeView}
        onViewChange={setActiveView}
        sidebarHidden={sidebarHidden}
        onToggleSidebar={() => setSidebarHidden((v) => !v)}
        compact={compact}
        onToggleCompact={() => setCompact((v) => !v)}
      />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <FoundryVideoGrid
          roomId={roomId}
          compact={compact}
          micMuted={micMuted}
          camOff={camOff}
          onCallReady={handleCallReady}
          onParticipantsChange={handleParticipantsChange}
          onInvite={() => {}}
          guestToken={guestToken}
          guestRoomUrl={roomUrl}
        />

        {!sidebarHidden && (
          <FoundryRightPanel
            participants={participants}
            messages={messages}
            dms={[]}
            sharedFiles={[]}
            forgeFiles={[]}
            notes=""
            onNotesChange={() => {}}
            onSend={handleSend}
            onDm={() => {}}
            onDmOpen={() => {}}
            onShare={() => {}}
            onUpload={() => {}}
            isHost={false}
            initialTab={activePanel}
          />
        )}
      </div>

      <FoundryBottomBar
        micMuted={micMuted}
        camOff={camOff}
        isRecording={false}
        chatOpen={activePanel === 'Chat' && !sidebarHidden}
        filesOpen={activePanel === 'Files' && !sidebarHidden}
        peopleOpen={activePanel === 'People' && !sidebarHidden}
        onMicToggle={() => setMicMuted((v) => !v)}
        onCamToggle={() => setCamOff((v) => !v)}
        onShareScreen={() => {}}
        onChatToggle={() => togglePanel('Chat')}
        onFilesToggle={() => togglePanel('Files')}
        onPeopleToggle={() => togglePanel('People')}
        onRecordToggle={() => {}}
        onMore={() => {}}
        onEnd={handleEnd}
      />
    </>
  );
}

GuestFoundryRoom.getLayout = function getLayout(page) {
  return <FoundryLayout title="Foundry">{page}</FoundryLayout>;
};
