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

  // AV state
  const [micMuted, setMicMuted] = useState(true);
  const [camOff, setCamOff] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // View state
  const [activeView, setActiveView] = useState('grid');
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [compact, setCompact] = useState(false);

  // Panel state
  const [activePanel, setActivePanel] = useState('People');

  // Daily call object
  const callRef = useRef(null);

  // Live data — all starts empty, populated from API or real events
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [dms] = useState([]);
  const [sharedFiles, setSharedFiles] = useState([]);
  const [forgeFiles, setForgeFiles] = useState([]);
  const [notes, setNotes] = useState('');

  const startTimeRef = useRef(Date.now());

  // Load room + user's Forge files
  useEffect(() => {
    if (!roomId || status === 'loading') return;
    if (status === 'unauthenticated') { router.replace('/login'); return; }

    // Load room
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

    // Load user's resumes for Your Forge section
    fetch('/api/resumes')
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
  }, []);

  const handleParticipantsChange = useCallback((list) => {
    setParticipants(list.map(p => ({
      id: p.session_id,
      name: p.user_name || 'Guest',
      isHost: !!p.owner,
      micMuted: !p.tracks?.audio || p.tracks.audio.state === 'off',
      videoOff: !p.tracks?.video || p.tracks.video.state === 'off',
      local: p.local,
    })));
  }, []);

  // Notes auto-save
  const saveTimer = useRef(null);
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

  // Chat send
  const handleSend = useCallback((text) => {
    setMessages(prev => [...prev, {
      sender: session?.user?.name || 'You',
      text,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      color: '#FF7043',
    }]);
  }, [session]);

  // Share a Forge file into the session
  const handleShare = useCallback((file) => {
    if (!file) return;
    setSharedFiles(prev => {
      if (prev.find(f => f.name === file.name)) return prev;
      return [...prev, {
        name: file.name,
        sharedBy: session?.user?.name || 'You',
        ago: 'Just now',
      }];
    });
    fetch(`/api/foundry/room/${roomId}/share-file`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: file.name, source: 'FORGE' }),
    }).catch(() => {});
  }, [roomId, session]);

  // Screen share
  const handleShareScreen = useCallback(async () => {
    if (!callRef.current) return;
    try {
      await callRef.current.startScreenShare();
    } catch (err) {
      console.error('[foundry] screen share:', err);
    }
  }, []);

  // Recording
  const handleRecordToggle = useCallback(async () => {
    if (!callRef.current) return;
    if (isRecording) {
      await callRef.current.stopRecording().catch(() => {});
      setIsRecording(false);
    } else {
      await callRef.current.startRecording().catch(() => {});
      setIsRecording(true);
    }
  }, [isRecording]);

  // End session
  const handleEnd = useCallback(async () => {
    if (!confirm('End this Foundry session for everyone?')) return;
    if (callRef.current) {
      await callRef.current.leave().catch(() => {});
    }
    try {
      await fetch(`/api/foundry/room/${roomId}/end`, { method: 'POST' });
    } catch {}
    router.push('/seeker-dashboard');
  }, [roomId, router]);

  const togglePanel = (tab) => {
    if (sidebarHidden) setSidebarHidden(false);
    setActivePanel(tab);
  };

  if (loading) return (
    <div style={{
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#555', fontFamily: "'DM Sans', sans-serif", fontSize: 13,
    }}>
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
        />

        {!sidebarHidden && (
          <FoundryRightPanel
            participants={participants}
            messages={messages}
            dms={dms}
            sharedFiles={sharedFiles}
            forgeFiles={forgeFiles}
            notes={notes}
            onNotesChange={handleNotesChange}
            onSend={handleSend}
            onDm={() => setActivePanel('Chat')}
            onDmOpen={() => setActivePanel('Chat')}
            onShare={handleShare}
            onUpload={() => {}}
            isHost={room?.hostId === session?.user?.id}
            initialTab={activePanel}
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