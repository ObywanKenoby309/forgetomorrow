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
import FoundryMobileLayout from '@/components/foundry/FoundryMobileLayout';
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
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      // Stay in mobile layout if width < 1024 OR if it's a phone in landscape
      // (height < 500 is a strong signal of landscape phone)
      setIsMobile(w < 1024 || h < 500);
    };
    check();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, []);
  const [guestName, setGuestName] = useState('');
  const [guestToken, setGuestToken] = useState('');
  const [guestUserData, setGuestUserData] = useState(null);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(false);
  const [background, setBackground] = useState(() => {
    if (typeof window === 'undefined') return 'none';
    try { return sessionStorage.getItem('foundry_background') || 'none'; } catch { return 'none'; }
  });
  const [selectedBackground, setSelectedBackground] = useState(() => {
    if (typeof window === 'undefined') return 'none';
    try { return sessionStorage.getItem('foundry_background') || 'none'; } catch { return 'none'; }
  });
  const [callObject, setCallObject] = useState(null);
  const [guestAccessCode, setGuestAccessCode] = useState(guestCode || '');
  const [roomUrl, setRoomUrl] = useState('');
  const [error, setError] = useState(serverError || '');
  const [joining, setJoining] = useState(false);

  const [micMuted, setMicMuted] = useState(() => {
    if (typeof window === 'undefined') return true;
    try { return sessionStorage.getItem('foundry_mic_on') !== '1'; } catch { return true; }
  });
  const [camOff, setCamOff] = useState(() => {
    // Respect the camera preference set on the join page
    if (typeof window === 'undefined') return false;
    try { return sessionStorage.getItem('foundry_camera_on') === '0'; } catch { return false; }
  });
  const [isRecording] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const [activeView, setActiveView] = useState('grid');
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [compact, setCompact] = useState(false);
  const [activePanel, setActivePanel] = useState('People');
  const [showConversionBanner, setShowConversionBanner] = useState(false);

  const callRef = useRef(null);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [sessionDms, setSessionDms] = useState([]);
  const [unreadDms, setUnreadDms] = useState(0);
  const [selectedDmParticipant, setSelectedDmParticipant] = useState(null);
  const [sharedFiles, setSharedFiles] = useState([]);
  const [guestFileSharingAllowed, setGuestFileSharingAllowed] = useState(false);
  const startTimeRef = useRef(Date.now());

  const effectiveGuestCode =
    guestAccessCode ||
    guestCode ||
    (typeof router.query.code === 'string' ? router.query.code : '');

  const enterRoom = useCallback((name, token, url, userData = null) => {
    if (!name || !token || !url) return false;
    setGuestName(name);
    setGuestToken(token);
    setGuestUserData(userData || null);
    setRoomUrl(url);
    setReady(true);
    setError('');
    return true;
  }, []);

  useEffect(() => {
    if (!roomId) return;

    try {
      const routeCode = typeof router.query.code === 'string' ? router.query.code : '';
      const storedGuestCode = sessionStorage.getItem('foundry_guest_code') || '';
      const nextGuestCode = guestCode || routeCode || storedGuestCode || '';

      if (nextGuestCode) {
        setGuestAccessCode(nextGuestCode);
        sessionStorage.setItem('foundry_guest_code', nextGuestCode);
      }

      const storedName = sessionStorage.getItem('foundry_guest_name') || '';
      const storedToken = sessionStorage.getItem('foundry_guest_token') || '';
      const storedUrl = sessionStorage.getItem('foundry_guest_room_url') || '';
      const storedRoomId = sessionStorage.getItem('foundry_guest_room_id') || '';

      if ((!storedRoomId || storedRoomId === roomId) && enterRoom(storedName, storedToken, storedUrl)) {
        return;
      }

      if (storedName && nextGuestCode && !serverError) {
        setGuestName(storedName);
      }
    } catch {}
  }, [roomId, guestCode, router.query.code, serverError, enterRoom]);

  // foundry room status watcher — external guest self-ejects when host ends room
  useEffect(() => {
    if (!ready || !roomId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/foundry/room-status/${roomId}`);
        const data = await res.json().catch(() => ({}));

        if (data.status === 'ENDED') {
          clearInterval(interval);

          if (callRef.current) {
            await callRef.current.leave().catch(() => {});
          }

          setShowConversionBanner(true);
        }
      } catch {}
    }, 5000);

    return () => clearInterval(interval);
  }, [ready, roomId]);

  const effectiveGuestCodeRef = useRef(effectiveGuestCode);
  useEffect(() => { effectiveGuestCodeRef.current = effectiveGuestCode; }, [effectiveGuestCode]);

  useEffect(() => {
    if (!ready || !roomId) return;

    const loadFiles = async () => {
      const code = effectiveGuestCodeRef.current;
      try {
        const res = await fetch(`/api/foundry/room/${roomId}/share-file${code ? `?guestCode=${encodeURIComponent(code)}` : ''}`);
        const data = await res.json();
        if (Array.isArray(data.files)) {
          setSharedFiles(data.files);
        }
      } catch {}
    };

    loadFiles();
    const interval = setInterval(loadFiles, 5000);
    return () => clearInterval(interval);
  }, [ready, roomId]);

  const requestGuestToken = async () => {
    const name = guestName.trim();
    const codeToUse = effectiveGuestCode;

    if (!codeToUse) {
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
        body: JSON.stringify({ roomId, guestCode: codeToUse, guestName: name }),
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
		sessionStorage.setItem('foundry_camera_on', cameraOn ? '1' : '0');
		sessionStorage.setItem('foundry_mic_on', micOn ? '1' : '0');
		sessionStorage.setItem('foundry_background', background);
        sessionStorage.setItem('foundry_guest_code', codeToUse);
      } catch {}

      setGuestAccessCode(codeToUse);
      setSelectedBackground(background || 'none');
      enterRoom(name, data.token, data.roomUrl, data.userData || null);
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

  const handleScreenShareChange = useCallback((sharing) => {
    setIsScreenSharing(sharing);
  }, []);

  const handleRoomEmpty = useCallback(() => {
    setShowConversionBanner(true);
  }, []);

  const handleCallReady = useCallback((call) => {
  callRef.current = call;
  setCallObject(call);

    call.on('app-message', ({ data }) => {
  if (data?.type === 'FOUNDRY_FILES_UPDATED') {
    fetch(`/api/foundry/room/${roomId}/share-file${effectiveGuestCodeRef.current ? `?guestCode=${encodeURIComponent(effectiveGuestCodeRef.current)}` : ''}`)
      .then((res) => res.json())
      .then((payload) => {
        if (Array.isArray(payload.files)) {
          setSharedFiles(payload.files);
        }
      })
      .catch(() => {});
  }

  if (data?.type === 'FOUNDRY_GUEST_FILE_SHARING') {
    setGuestFileSharingAllowed(!!data.allowed);
  }

  if (data?.type === 'FOUNDRY_DM') {
    const local = call.participants()?.local;
    const localSessionId = local?.session_id;

    if (!localSessionId) return;
    if (data.toSessionId !== localSessionId && data.fromSessionId !== localSessionId) return;

    setSessionDms(prev => {
      if (prev.some(m => m.id === data.id)) return prev;
      setUnreadDms(n => n + 1);
      return [...prev, data];
    });
  }

  if (data?.type === 'MEETING_CHAT') {
    const fallbackTime = new Date().toISOString();

    setMessages(prev => [...prev, {
      sender: data.senderName || 'Participant',
      text: data.text,
      time: data.time || data.createdAt || fallbackTime,
      createdAt: data.createdAt || data.time || fallbackTime,
      color: data.color || '#5C6BC0',
      avatarUrl: data.avatarUrl || null,
    }]);
  }
});
  }, [roomId]);

  const handleParticipantsChange = useCallback((list) => {
    setParticipants(
      list.map((p) => {
        const audioState = p.tracks?.audio?.state || null;
        const videoState = p.tracks?.video?.state || null;
        const screenState = p.tracks?.screenVideo?.state || null;

        const micMuted =
          p.audio === false ||
          !p.tracks?.audio ||
          audioState === 'off' ||
          audioState === 'blocked' ||
          audioState === 'interrupted';

        const videoOff =
          p.video === false ||
          !p.tracks?.video ||
          videoState === 'off' ||
          videoState === 'blocked' ||
          videoState === 'interrupted';

        const isScreenSharing =
          p.screen === true ||
          (
            !!p.tracks?.screenVideo?.persistentTrack &&
            screenState !== 'off' &&
            screenState !== 'blocked' &&
            screenState !== 'interrupted'
          );

        return {
          id: p.session_id,
          name: p.user_name || 'Guest',
          isHost: !!p.owner,
          micMuted,
          videoOff,
          isScreenSharing,
          local: p.local,
          isGuest: !p.owner,
        };
      })
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

const handleUpload = useCallback(async (file) => {
  if (!file || !roomId || !guestFileSharingAllowed) return;

  if (file.size > 10 * 1024 * 1024) {
    alert('Maximum file size is 10MB.');
    return;
  }

  try {
    const fileBase64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Could not read file'));
      reader.readAsDataURL(file);
    });

    const uploadRes = await fetch('/api/files/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        fileBase64,
        mimeType: file.type || 'application/octet-stream',
        context: 'foundry',
        roomId,
        guestCode: effectiveGuestCodeRef.current,
      }),
    });

    const uploadData = await uploadRes.json().catch(() => ({}));
    if (!uploadRes.ok) throw new Error(uploadData.error || 'Could not upload file');

    const shareRes = await fetch(`/api/foundry/room/${roomId}/share-file`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: uploadData.fileName || file.name,
        storagePath: uploadData.storagePath,
        source: 'COMPUTER',
        guestCode: effectiveGuestCodeRef.current,
      }),
    });

    const shareData = await shareRes.json().catch(() => ({}));
    if (!shareRes.ok) throw new Error(shareData.error || 'Could not share file');

    if (shareData.file) {
      setSharedFiles(prev => {
        if (prev.find(f => f.id === shareData.file.id)) return prev;
        return [shareData.file, ...prev];
      });
    }

    try {
      callRef.current?.sendAppMessage({ type: 'FOUNDRY_FILES_UPDATED' }, '*');
    } catch {}
  } catch (err) {
    alert(String(err?.message || err || 'Could not upload file'));
  }
}, [roomId, guestFileSharingAllowed]);

const handleSendDm = useCallback((target, text) => {
  if (!callRef.current || !target?.id || !text?.trim()) return;

  const local = callRef.current.participants()?.local;
  if (!local?.session_id) return;

  const now = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const msg = {
    id: `dm_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    type: 'FOUNDRY_DM',
    fromSessionId: local.session_id,
    toSessionId: target.id,
    fromName: local.user_name || guestName || 'Guest',
    toName: target.name || 'Participant',
    text: text.trim(),
    time: now,
    color: '#888',
  };

  setSessionDms(prev => [...prev, msg]);

  try {
    callRef.current.sendAppMessage(msg, '*');
  } catch {}
}, [guestName]);

  const togglePanel = (tab) => {
    if (sidebarHidden) setSidebarHidden(false);
    setActivePanel(tab);
  };

  const goBackToInvite = () => {
    if (effectiveGuestCode) {
      router.replace(`/foundry/join/${roomId}?code=${encodeURIComponent(effectiveGuestCode)}`);
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

const openInChrome = () => {
  if (typeof window === 'undefined') return;
  const currentUrl = window.location.href;
  const url = new URL(currentUrl);
  const chromeIntent =
    `intent://${url.host}${url.pathname}${url.search}${url.hash}` +
    `#Intent;scheme=https;package=com.android.chrome;` +
    `S.browser_fallback_url=${encodeURIComponent(currentUrl)};end`;
  window.location.href = chromeIntent;
};

  // Detect restricted browser environments using multiple signals.
  // User agent sniffing alone is unreliable — Gmail Android often reports Chrome UA.
  // We use a combination of UA signals + API availability checks.
  const isInAppBrowser = typeof navigator !== 'undefined' && (() => {
    const ua = navigator.userAgent || '';
    // Gmail iOS
    if (/GSA[\/\s]/.test(ua)) return true;
    // Facebook in-app
    if (/FBAN|FBAV/.test(ua)) return true;
    // Instagram in-app
    if (/Instagram/.test(ua)) return true;
    // Android WebView (includes Gmail Android) — wv flag + no Chrome version in specific position
    if (/Android/.test(ua) && /wv/.test(ua)) return true;
    // Android Gmail without wv flag — check for missing Chrome features
    if (/Android/.test(ua) && typeof navigator.mediaDevices === 'undefined') return true;
    // iOS in-app browser (not Safari or Chrome)
    if (/iPhone|iPad/.test(ua) && !/Safari\//.test(ua) && !/CriOS/.test(ua)) return true;
    return false;
  })();

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

            {isInAppBrowser && (
              <div style={{ background: 'rgba(255,112,67,0.08)', border: '1px solid rgba(255,112,67,0.2)', borderRadius: 8, padding: '10px 12px', marginBottom: 12, fontSize: 11, color: '#FF7043', lineHeight: 1.6 }}>
                ⚠️ You're viewing this in an in-app browser. For the best experience — including file downloads and camera access — open this Foundry in Chrome for camera, microphone, screen sharing and file access.
                <br />
                <button
  type="button"
  onClick={openInChrome}
  style={{
    marginTop: 8,
    width: '100%',
    background: ORANGE,
    border: 'none',
    color: '#fff',
    borderRadius: 8,
    padding: '10px 12px',
    fontSize: 12,
    fontWeight: 800,
    cursor: 'pointer',
    fontFamily: 'inherit',
  }}
>
  Open in Chrome
</button>
              </div>
            )}
            {!serverError && effectiveGuestCode ? (
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
				<label style={S.label}>Camera</label>
<select
  style={S.input}
  value={cameraOn ? 'on' : 'off'}
  onChange={(e) => setCameraOn(e.target.value === 'on')}
>
  <option value="on">On</option>
  <option value="off">Off</option>
</select>

<label style={S.label}>Microphone</label>
<select
  style={S.input}
  value={micOn ? 'on' : 'off'}
  onChange={(e) => setMicOn(e.target.value === 'on')}
>
  <option value="off">Muted</option>
  <option value="on">On</option>
</select>

<label style={S.label}>Background</label>
<select
  style={S.input}
  value={background}
  onChange={(e) => setBackground(e.target.value)}
>
  <option value="none">None</option>
  <option value="blur">Blur</option>
  <option value="forge-office">Forge Office</option>
  <option value="coaching-library">Coaching Library</option>
  <option value="strategy-wall">Strategy Wall</option>
  <option value="neutral-professional">Neutral Professional</option>
</select>
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

  if (ready && isMobile) {
    return (
      <FoundryMobileLayout
        sessionTitle={title || `Foundry · ${roomId}`}
        startTime={startTimeRef.current}
        isRecording={false}
        roomId={roomId}
        micMuted={micMuted}
        camOff={camOff}
		isScreenSharing={isScreenSharing}
		callObject={callObject}
		selectedBackground={selectedBackground}
		onBackgroundChange={setSelectedBackground}
		isFounder={false}
        onMicToggle={() => setMicMuted(v => !v)}
        onCamToggle={() => setCamOff(v => !v)}
        onShareScreen={async () => {
          if (!callRef.current) return;
          try {
            if (isScreenSharing) { await callRef.current.stopScreenShare(); }
            else { await callRef.current.startScreenShare(); }
          } catch {}
        }}
        onRecordToggle={null}
        participants={participants}
        messages={messages}
		sessionDms={sessionDms}
		selectedDmParticipant={selectedDmParticipant}
		onSelectDmParticipant={setSelectedDmParticipant}
		onSendDm={handleSendDm}
        onSend={handleSend}
        onEnd={handleEnd}
        isHost={false}
        isGuest={true}
        guestCode={effectiveGuestCode}
        sharedFiles={sharedFiles}
forgeFiles={[]}
onShare={() => {}}
onUpload={handleUpload}
onRemoveFile={null}
guestFileSharingAllowed={guestFileSharingAllowed}

notes=""
onNotesChange={null}
      >
        <FoundryVideoGrid
          roomId={roomId}
          compact={true}
		  activeView={activeView}
          micMuted={micMuted}
          camOff={camOff}
          onCallReady={handleCallReady}
          onRemoteMute={() => setMicMuted(true)}
          onRemoteStopCamera={() => setCamOff(true)}
          onParticipantsChange={handleParticipantsChange}
          onScreenShareChange={handleScreenShareChange}
          onInvite={() => {}}
          onHostEnded={() => setShowConversionBanner(true)}
          onRoomEmpty={handleRoomEmpty}
          guestToken={guestToken}
          guestRoomUrl={roomUrl}
          guestUserData={guestUserData}
          initialBackground={selectedBackground}
        />
      </FoundryMobileLayout>
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
		callObject={callObject}
		selectedBackground={selectedBackground}
		onBackgroundChange={setSelectedBackground}
		isFounder={false}
      />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <FoundryVideoGrid
          roomId={roomId}
          compact={compact}
          activeView={activeView}
          micMuted={micMuted}
          camOff={camOff}
          onCallReady={handleCallReady}
          onRemoteMute={() => setMicMuted(true)}
          onRemoteStopCamera={() => setCamOff(true)}
          onParticipantsChange={handleParticipantsChange}
          onInvite={() => {}}
          onHostEnded={() => setShowConversionBanner(true)}
          onScreenShareChange={handleScreenShareChange}
          onRoomEmpty={handleRoomEmpty}
          guestToken={guestToken}
          guestRoomUrl={roomUrl}
          guestUserData={guestUserData}
		  initialBackground={selectedBackground}
        />

        {!sidebarHidden && (
          <FoundryRightPanel
            participants={participants}
            messages={messages}
            dms={[]}
			sessionDms={sessionDms}
			selectedDmParticipant={selectedDmParticipant}
			onSelectDmParticipant={setSelectedDmParticipant}
			onSendDm={handleSendDm}
            sharedFiles={sharedFiles}
            forgeFiles={[]}
            notes=""
            onNotesChange={() => {}}
            onSend={handleSend}
            onDm={() => {}}
            onDmOpen={() => {}}
            onShare={() => {}}
onUpload={handleUpload}
isHost={false}
isGuest={true}
guestCode={effectiveGuestCode}
guestFileSharingAllowed={guestFileSharingAllowed}
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
        onShareScreen={async () => {
          if (!callRef.current) return;
          try {
            if (isScreenSharing) { await callRef.current.stopScreenShare(); }
            else { await callRef.current.startScreenShare(); }
          } catch {}
        }}
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