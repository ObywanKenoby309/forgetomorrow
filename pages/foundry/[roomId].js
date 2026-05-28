// pages/foundry/[roomId].js
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import FoundryLayout from '@/components/foundry/FoundryLayout';
import FoundryTopBar from '@/components/foundry/FoundryTopBar';
import FoundryVideoGrid from '@/components/foundry/FoundryVideoGrid';
import FoundryRightPanel from '@/components/foundry/FoundryRightPanel';
import FoundryBottomBar from '@/components/foundry/FoundryBottomBar';
import FoundryMobileLayout from '@/components/foundry/FoundryMobileLayout';

const ORANGE = '#FF7043';

// SSR-safe mobile detection
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

export default function FoundryRoom() {
  const router = useRouter();
  const { roomId } = router.query;
  const { data: session, status } = useSession();
  const isMobile = useIsMobile();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  // AV state
  const [micMuted, setMicMuted] = useState(true);
  const [camOff, setCamOff] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // View state
  const [activeView, setActiveView] = useState('grid');
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [compact, setCompact] = useState(false);
  const [activePanel, setActivePanel] = useState('People');

  // Edge recommendation toast
  const [showEdgeToast, setShowEdgeToast] = useState(false);
  const edgeToastShownRef = useRef(false);

  // Auto-end timer
  const [scheduledEndAt, setScheduledEndAt] = useState(null);
  const [showEndWarning, setShowEndWarning] = useState(false);
  const endTimerRef = useRef(null);
  const warnTimerRef = useRef(null);

  const callRef = useRef(null);
  const saveTimer = useRef(null);

  // Live data
  const [participants, setParticipants] = useState([]);
  const [meetingMessages, setMeetingMessages] = useState([]);
  const [sharedFiles, setSharedFiles] = useState([]);
  const [forgeFiles, setForgeFiles] = useState([]);
  const [notes, setNotes] = useState('');

  const startTimeRef = useRef(Date.now());

  // ── All hooks declared unconditionally above any early returns ─────────────

  const handleRoomEmpty = useCallback(async () => {
    if (callRef.current) await callRef.current.leave().catch(() => {});
    try { await fetch(`/api/foundry/room/${roomId}/destroy-daily`, { method: 'POST' }); } catch {}
    try { await fetch(`/api/foundry/room/${roomId}/end`, { method: 'POST' }); } catch {}
    router.push('/foundry');
  }, [roomId, router]);

  const handleEnd = useCallback(async () => {
    if (!confirm('End this Foundry session for everyone?')) return;
    clearTimeout(endTimerRef.current);
    clearTimeout(warnTimerRef.current);
    if (callRef.current) await callRef.current.leave().catch(() => {});
    // destroy-daily ejects all participants immediately
    try { await fetch(`/api/foundry/room/${roomId}/destroy-daily`, { method: 'POST' }); } catch {}
    try { await fetch(`/api/foundry/room/${roomId}/end`, { method: 'POST' }); } catch {}
    router.push('/foundry');
  }, [roomId, router]);

  const scheduleAutoEnd = useCallback((endIso, isHost) => {
    clearTimeout(endTimerRef.current);
    clearTimeout(warnTimerRef.current);

    const endMs = new Date(endIso).getTime();
    const now = Date.now();
    const msUntilEnd = endMs - now;
    if (msUntilEnd <= 0) return;

    const msUntilWarn = msUntilEnd - 5 * 60 * 1000;
    if (msUntilWarn > 0) {
      warnTimerRef.current = setTimeout(() => setShowEndWarning(true), msUntilWarn);
    } else {
      setShowEndWarning(true);
    }

    endTimerRef.current = setTimeout(async () => {
      setShowEndWarning(false);
      if (callRef.current) await callRef.current.leave().catch(() => {});
      if (isHost) {
        try { await fetch(`/api/foundry/room/${roomId}/destroy-daily`, { method: 'POST' }); } catch {}
        try { await fetch(`/api/foundry/room/${roomId}/end`, { method: 'POST' }); } catch {}
      }
      router.push('/foundry');
    }, msUntilEnd);
  }, [roomId, router]);

  // Load room
  useEffect(() => {
    if (!roomId || status === 'loading') return;
    if (status === 'unauthenticated') { router.replace('/login'); return; }

    fetch(`/api/foundry/room/${roomId}`)
      .then(r => r.json())
      .then(data => {
        if (!data.error) {
          setRoom(data.room);
          setNotes(data.room.notes || '');
          setSharedFiles(data.room.sharedFiles || []);
          startTimeRef.current = new Date(data.room.startedAt || Date.now()).getTime();
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch('/api/resume/list')
      .then(r => r.json())
      .then(data => {
        if (data.resumes) {
          setForgeFiles(data.resumes.map(r => ({
            name: r.name, type: 'Resume',
            ago: new Date(r.updatedAt).toLocaleDateString(),
          })));
        }
      })
      .catch(() => {});
  }, [roomId, status, router]);

  // Cleanup timers on unmount
  useEffect(() => () => {
    clearTimeout(endTimerRef.current);
    clearTimeout(warnTimerRef.current);
  }, []);

  // Room status watcher — kicks participants when host ends the room
  useEffect(() => {
    if (!roomId || loading) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/foundry/room-status/${roomId}`);
        const data = await res.json().catch(() => ({}));
        if (data.status === 'ENDED') {
          clearInterval(interval);
          if (callRef.current) await callRef.current.leave().catch(() => {});
          router.push('/foundry');
        }
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  }, [roomId, loading, router]);

  const handleCallReady = useCallback((call) => {
    callRef.current = call;
    call.on('app-message', ({ data }) => {
      if (data?.type === 'MEETING_CHAT') {
        setMeetingMessages(prev => [...prev, {
          sender: data.senderName, text: data.text, time: data.time,
          color: data.color || '#5C6BC0', avatarUrl: data.avatarUrl || null,
        }]);
      }
    });
  }, []);

  const handleScheduledEnd = useCallback((endIso, isHost) => {
    if (!endIso || scheduledEndAt) return;
    setScheduledEndAt(endIso);
    scheduleAutoEnd(endIso, isHost);
  }, [scheduledEndAt, scheduleAutoEnd]);

  const handleParticipantsChange = useCallback((list) => {
    setParticipants(list.map(p => ({
      id: p.session_id, name: p.user_name || 'Guest',
      isHost: !!p.owner,
      micMuted: !p.tracks?.audio || p.tracks.audio.state === 'off',
      videoOff: !p.tracks?.video || p.tracks.video.state === 'off',
      local: p.local, avatarUrl: p.userData?.avatarUrl || null,
    })));
  }, []);

  const handleScreenShareChange = useCallback((sharing) => setIsScreenSharing(sharing), []);

  const handleSend = useCallback((text) => {
    const me = session?.user;
    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    const msg = { sender: me?.name || 'You', text, time: now, color: '#FF7043', avatarUrl: me?.avatarUrl || null };
    setMeetingMessages(prev => [...prev, msg]);
    if (callRef.current) {
      try {
        callRef.current.sendAppMessage({
          type: 'MEETING_CHAT', senderName: me?.name || 'Host',
          text, time: now, color: '#FF7043', avatarUrl: me?.avatarUrl || null,
        }, '*');
      } catch (err) { console.error('[foundry] sendAppMessage error:', err); }
    }
  }, [session]);

  const handleNotesChange = useCallback((val) => {
    setNotes(val);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (!roomId) return;
      fetch(`/api/foundry/room/${roomId}/notes`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: val }),
      }).catch(() => {});
    }, 1500);
  }, [roomId]);

  const handleShare = useCallback((file) => {
    if (!file) return;
    setSharedFiles(prev => {
      if (prev.find(f => f.name === file.name)) return prev;
      return [...prev, { name: file.name, sharedBy: session?.user?.name || 'You', ago: 'Just now' }];
    });
    fetch(`/api/foundry/room/${roomId}/share-file`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: file.name, source: 'FORGE' }),
    }).catch(() => {});
  }, [roomId, session]);

  const handleShareScreen = useCallback(async () => {
    if (!callRef.current) return;
    if (isScreenSharing) {
      try { await callRef.current.stopScreenShare(); } catch {}
      setIsScreenSharing(false);
      return;
    }
    if (!edgeToastShownRef.current) {
      edgeToastShownRef.current = true;
      setShowEdgeToast(true);
      setTimeout(() => setShowEdgeToast(false), 6000);
    }
    try {
      await callRef.current.startScreenShare({
        displayMediaOptions: { video: true, audio: true },
      });
    } catch (err) {
      if (err.name !== 'AbortError' && err.message !== 'AbortError') {
        console.error('[foundry] screen share:', err);
      }
    }
  }, [isScreenSharing]);

  const handleRecordToggle = useCallback(async () => {
    if (!callRef.current) return;
    try {
      if (isRecording) {
        await callRef.current.stopRecording();
        setIsRecording(false);
      } else {
        await callRef.current.startRecording();
        setIsRecording(true);
      }
    } catch (err) { console.error('[foundry] recording:', err); }
  }, [isRecording]);

  const togglePanel = (tab) => {
    if (sidebarHidden) setSidebarHidden(false);
    setActivePanel(tab);
  };

  // ── All hooks above — safe to early return here ────────────────────────────
  if (loading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>
      Opening Foundry…
    </div>
  );

  const isHost = room?.hostId === session?.user?.id;

  // ── Mobile layout ──────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <FoundryMobileLayout
        sessionTitle={room?.title || `Foundry · ${roomId}`}
        startTime={startTimeRef.current}
        isRecording={isRecording}
        micMuted={micMuted}
        camOff={camOff}
        isScreenSharing={isScreenSharing}
        onMicToggle={() => setMicMuted(v => !v)}
        onCamToggle={() => setCamOff(v => !v)}
        onShareScreen={handleShareScreen}
        onRecordToggle={handleRecordToggle}
        participants={participants}
        messages={meetingMessages}
        onSend={handleSend}
        onEnd={handleEnd}
        isHost={isHost}
      >
        <FoundryVideoGrid
          roomId={roomId}
          compact={true}
          micMuted={micMuted}
          camOff={camOff}
          onCallReady={handleCallReady}
          onParticipantsChange={handleParticipantsChange}
          onScreenShareChange={handleScreenShareChange}
          onInvite={() => {}}
          onRoomEmpty={handleRoomEmpty}
          onScheduledEnd={handleScheduledEnd}
        />
      </FoundryMobileLayout>
    );
  }

  // ── Desktop layout ─────────────────────────────────────────────────────────
  return (
    <>
      <FoundryTopBar
        sessionTitle={room?.title || `Foundry · ${roomId}`}
        isRecording={isRecording}
        startTime={startTimeRef.current}
        activeView={activeView}
        onViewChange={setActiveView}
        sidebarHidden={sidebarHidden}
        onToggleSidebar={() => setSidebarHidden(v => !v)}
        compact={compact}
        onToggleCompact={() => setCompact(v => !v)}
      />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <FoundryVideoGrid
          roomId={roomId}
          compact={compact}
          micMuted={micMuted}
          camOff={camOff}
          onCallReady={handleCallReady}
          onParticipantsChange={handleParticipantsChange}
          onScreenShareChange={handleScreenShareChange}
          onInvite={() => togglePanel('People')}
          onRoomEmpty={handleRoomEmpty}
          onScheduledEnd={handleScheduledEnd}
        />

        {!sidebarHidden && (
          <FoundryRightPanel
            roomId={roomId}
            participants={participants}
            messages={meetingMessages}
            sharedFiles={sharedFiles}
            forgeFiles={forgeFiles}
            notes={notes}
            onNotesChange={handleNotesChange}
            onSend={handleSend}
            onShare={handleShare}
            onUpload={() => {}}
            isHost={isHost}
            initialTab={activePanel}
            currentUserId={session?.user?.id}
            currentUserRole={session?.user?.role}
            coHostUserId={room?.coHostUserId}
            coHostName={room?.coHost?.name}
            onCoHostAssigned={(data) => {
              setRoom((prev) => ({
                ...prev,
                coHostUserId: data?.coHostUserId || null,
                coHost: data?.coHostName
                  ? { ...(prev?.coHost || {}), name: data.coHostName }
                  : prev?.coHost,
              }));
            }}
          />
        )}
      </div>

      <FoundryBottomBar
        micMuted={micMuted}
        camOff={camOff}
        isRecording={isRecording}
        isScreenSharing={isScreenSharing}
        chatOpen={activePanel === 'Chat' && !sidebarHidden}
        filesOpen={activePanel === 'Files' && !sidebarHidden}
        peopleOpen={activePanel === 'People' && !sidebarHidden}
        onMicToggle={() => setMicMuted(v => !v)}
        onCamToggle={() => setCamOff(v => !v)}
        onShareScreen={handleShareScreen}
        onChatToggle={() => togglePanel('Chat')}
        onFilesToggle={() => togglePanel('Files')}
        onPeopleToggle={() => togglePanel('People')}
        onRecordToggle={handleRecordToggle}
        onMore={() => {}}
        onEnd={handleEnd}
      />

      {/* 5-minute end warning */}
      {showEndWarning && (
        <div style={{
          position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
          background: '#1a0a00', border: '1px solid rgba(255,112,67,0.4)',
          borderRadius: 10, padding: '12px 18px', zIndex: 9999,
          maxWidth: 340, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: ORANGE, marginBottom: 4 }}>
                ⏰ Foundry ending in 5 minutes
              </div>
              <div style={{ fontSize: 11, color: '#888', lineHeight: 1.6 }}>
                The scheduled session time is almost up. The room will close automatically.
              </div>
            </div>
            <button
              onClick={() => setShowEndWarning(false)}
              style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 16, flexShrink: 0, padding: 0 }}
            >×</button>
          </div>
        </div>
      )}

      {/* Edge toast */}
      {showEdgeToast && (
        <div style={{
          position: 'fixed', bottom: showEndWarning ? 160 : 80, left: '50%', transform: 'translateX(-50%)',
          background: '#141720', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 10, padding: '12px 18px', zIndex: 9998,
          maxWidth: 360, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#ddd', marginBottom: 4 }}>
                💡 For best audio sharing experience
              </div>
              <div style={{ fontSize: 11, color: '#888', lineHeight: 1.6 }}>
                PC users are recommended to use <strong style={{ color: ORANGE }}>Microsoft Edge</strong> for screen sharing. Edge supports system audio from all sources. In Chrome, audio sharing works for browser tabs only.
              </div>
            </div>
            <button
              onClick={() => setShowEdgeToast(false)}
              style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 16, flexShrink: 0, padding: 0 }}
            >×</button>
          </div>
        </div>
      )}
    </>
  );
}

FoundryRoom.getLayout = function getLayout(page) {
  return <FoundryLayout title="Foundry">{page}</FoundryLayout>;
};