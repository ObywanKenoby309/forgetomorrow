// pages/foundry/[roomId].js
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import FoundryLayout from '@/components/foundry/FoundryLayout';
import FoundryTopBar from '@/components/foundry/FoundryTopBar';
import FoundryVideoGrid from '@/components/foundry/FoundryVideoGrid';
import FoundryRightPanel from '@/components/foundry/FoundryRightPanel';
import FoundryBottomBar from '@/components/foundry/FoundryBottomBar';

export default function FoundryRoom() {
  const router = useRouter();
  const { roomId } = router.query;
  const { data: session, status } = useSession();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  const [micMuted, setMicMuted] = useState(true);
  const [camOff, setCamOff] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const [activeView, setActiveView] = useState('grid');
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [compact, setCompact] = useState(false);
  const [activePanel, setActivePanel] = useState('People');

  const callRef = useRef(null);

  const [participants, setParticipants] = useState([]);
  const [meetingMessages, setMeetingMessages] = useState([]);
  const [sharedFiles, setSharedFiles] = useState([]);
  const [forgeFiles, setForgeFiles] = useState([]);
  const [notes, setNotes] = useState('');

  const startTimeRef = useRef(Date.now());
  const saveTimer = useRef(null);

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
          startTimeRef.current = new Date(data.room.startedAt).getTime();
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch('/api/resume/list')
      .then(r => r.json())
      .then(data => {
        if (data.resumes) {
          setForgeFiles(data.resumes.map(r => ({
            name: r.name,
            type: 'Resume',
            ago: new Date(r.updatedAt).toLocaleDateString(),
          })));
        }
      })
      .catch(() => {});
  }, [roomId, status, router]);

  const handleCallReady = useCallback((call) => {
    callRef.current = call;
    call.on('app-message', ({ data }) => {
      if (data?.type === 'MEETING_CHAT') {
        setMeetingMessages(prev => [...prev, {
          sender: data.senderName,
          text: data.text,
          time: data.time,
          color: data.color || '#5C6BC0',
          avatarUrl: data.avatarUrl || null,
        }]);
      }
    });
  }, []);

  const handleParticipantsChange = useCallback((list) => {
    setParticipants(list.map(p => ({
      id: p.session_id,
      name: p.user_name || 'Guest',
      isHost: !!p.owner,
      micMuted: !p.tracks?.audio || p.tracks.audio.state === 'off',
      videoOff: !p.tracks?.video || p.tracks.video.state === 'off',
      local: p.local,
      avatarUrl: p.userData?.avatarUrl || null,
    })));
  }, []);

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
      } catch (err) {
        console.error('[foundry] sendAppMessage error:', err);
      }
    }
  }, [session]);

  const handleNotesChange = useCallback((val) => {
    setNotes(val);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (!roomId) return;
      fetch(`/api/foundry/room/${roomId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: file.name, source: 'FORGE' }),
    }).catch(() => {});
  }, [roomId, session]);

  const handleShareScreen = useCallback(async () => {
    if (!callRef.current) return;
    try {
      await callRef.current.startScreenShare();
    } catch (err) {
      if (err.message !== 'AbortError') console.error('[foundry] screen share:', err);
    }
  }, []);

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
    } catch (err) {
      console.error('[foundry] recording:', err);
    }
  }, [isRecording]);

  const handleEnd = useCallback(async () => {
    if (!confirm('End this Foundry session for everyone?')) return;
    if (callRef.current) await callRef.current.leave().catch(() => {});
    try { await fetch(`/api/foundry/room/${roomId}/end`, { method: 'POST' }); } catch {}
    router.push('/foundry');
  }, [roomId, router]);

  // ← FIXED: was after early return, now above it
  const handleRoomEmpty = useCallback(async () => {
    if (callRef.current) await callRef.current.leave().catch(() => {});
    try { await fetch(`/api/foundry/room/${roomId}/end`, { method: 'POST' }); } catch {}
    router.push('/foundry');
  }, [roomId, router]);

  const togglePanel = (tab) => {
    if (sidebarHidden) setSidebarHidden(false);
    setActivePanel(tab);
  };

  // Early return is safe here — all hooks are above this line
  if (loading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>
      Opening Foundry…
    </div>
  );

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
          onInvite={() => togglePanel('People')}
          onRoomEmpty={handleRoomEmpty}
        />

        {!sidebarHidden && (
          <FoundryRightPanel
            participants={participants}
            messages={meetingMessages}
            sharedFiles={sharedFiles}
            forgeFiles={forgeFiles}
            notes={notes}
            onNotesChange={handleNotesChange}
            onSend={handleSend}
            onShare={handleShare}
            onUpload={() => {}}
            isHost={room?.hostId === session?.user?.id}
            initialTab={activePanel}
            currentUserId={session?.user?.id}
            currentUserRole={session?.user?.role}
          />
        )}
      </div>

      <FoundryBottomBar
        micMuted={micMuted}
        camOff={camOff}
        isRecording={isRecording}
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
    </>
  );
}

FoundryRoom.getLayout = function getLayout(page) {
  return <FoundryLayout title="Foundry">{page}</FoundryLayout>;
};