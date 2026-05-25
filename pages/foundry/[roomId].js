// pages/foundry/[roomId].js
// The live Foundry meeting room.
// Uses FoundryLayout — bypasses SeekerLayout entirely.
// getLayout pattern ensures _app.js renders nothing around this page.

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import FoundryLayout from '@/components/foundry/FoundryLayout';
import FoundryTopBar from '@/components/foundry/FoundryTopBar';
import FoundryVideoGrid from '@/components/foundry/FoundryVideoGrid';
import FoundryRightPanel from '@/components/foundry/FoundryRightPanel';
import FoundryBottomBar from '@/components/foundry/FoundryBottomBar';

// ── Seed data (replaced by real API/socket data in production) ──
const SEED_PARTICIPANTS = [
  { id: 'p1', name: 'Coach Rivera', role: 'Coach', isHost: true, micMuted: false, videoOff: false, color: '#FF7043' },
  { id: 'p2', name: 'Marcus Holt', role: 'Seeker', isHost: false, micMuted: true, videoOff: false, color: '#5C6BC0' },
  { id: 'p3', name: 'Taylor M.', role: 'Observer', isHost: false, micMuted: false, videoOff: true, color: '#26A69A' },
];

const SEED_MESSAGES = [
  { sender: 'Coach Rivera', text: 'Marcus — open Files. Sharing your Q3 resume review now.', time: '24:01', color: '#FF7043' },
  { sender: 'Marcus Holt', text: 'Got it. Should I share my updated version from Forge?', time: '24:08', color: '#5C6BC0' },
  { sender: 'Coach Rivera', text: 'Yes — Files → Your Forge → add to Shared.', time: '24:13', color: '#FF7043' },
];

const SEED_DMS = [
  { name: 'Marcus Holt', preview: 'Sent you the LinkedIn link privately', color: '#5C6BC0', unread: 2, conversationId: null },
  { name: 'Taylor M.', preview: 'Thanks for the intro earlier', color: '#26A69A', unread: 0, conversationId: null },
];

const SEED_FORGE_FILES = [
  { name: 'Marcus_Holt_Resume_v4.pdf', type: 'Resume', ago: '3 days ago' },
  { name: 'Negotiation Packet — FAANG.pdf', type: 'Coaching doc', ago: '1 week ago' },
  { name: 'ATS Signal Report — Oct 2025.pdf', type: 'ATS report', ago: '5 days ago' },
];

export default function FoundryRoom() {
  const router = useRouter();
  const { roomId } = router.query;
  const { data: session, status } = useSession();

  // Room state
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // Data state (will come from API/socket)
  const [participants, setParticipants] = useState(SEED_PARTICIPANTS);
  const [messages, setMessages] = useState(SEED_MESSAGES);
  const [dms] = useState(SEED_DMS);
  const [sharedFiles, setSharedFiles] = useState([
    { name: 'Q3 Resume Review — Rivera.pdf', sharedBy: 'Coach Rivera', ago: '2 min ago' },
  ]);
  const [forgeFiles] = useState(SEED_FORGE_FILES);
  const [notes, setNotes] = useState(
    '— Targeting FAANG product roles Q1 2026\n— Resume gap at 2022 needs framing\n— Homework: rewrite impact bullets for Stripe role'
  );

  const startTimeRef = useRef(Date.now() - 24 * 60 * 1000); // seed: 24min in

  // ── Load room ──────────────────────────────────────────────
  useEffect(() => {
    if (!roomId || status === 'loading') return;
    if (status === 'unauthenticated') { router.replace('/login'); return; }

    fetch(`/api/foundry/room/${roomId}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); }
        else { setRoom(data.room); startTimeRef.current = new Date(data.room.startedAt).getTime(); }
        setLoading(false);
      })
      .catch(() => {
        // Graceful fallback — room still renders with seed data
        setRoom({ title: 'Career Strategy Session — Marcus & Coach Rivera', status: 'ACTIVE' });
        setLoading(false);
      });
  }, [roomId, status, router]);

  // ── Notes auto-save ────────────────────────────────────────
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

  // ── Chat send ──────────────────────────────────────────────
  const handleSend = useCallback((text) => {
    const me = session?.user;
    setMessages(prev => [...prev, {
      sender: me?.name || 'You',
      text,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      color: '#FF7043',
    }]);
    // TODO: emit via WebSocket / POST to /api/foundry/room/[roomId]/chat
  }, [session]);

  // ── File share ─────────────────────────────────────────────
  const handleShare = useCallback((file) => {
    if (!file) return;
    setSharedFiles(prev => {
      if (prev.find(f => f.name === file.name)) return prev;
      return [...prev, { name: file.name, sharedBy: session?.user?.name || 'You', ago: 'Just now' }];
    });
  }, [session]);

  // ── End session ────────────────────────────────────────────
  const handleEnd = useCallback(async () => {
    if (!confirm('End this Foundry session?')) return;
    try {
      await fetch(`/api/foundry/room/${roomId}/end`, { method: 'POST' });
    } catch {}
    router.push('/seeker-dashboard');
  }, [roomId, router]);

  // ── Bottom bar panel toggles ───────────────────────────────
  const togglePanel = (tab) => {
    if (sidebarHidden) setSidebarHidden(false);
    setActivePanel(tab);
  };

  if (loading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>
      Joining Foundry…
    </div>
  );

  if (error) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef5350', fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>
      {error}
    </div>
  );

  const sessionTitle = room?.title || `Foundry · ${roomId}`;

  return (
    <>
      <FoundryTopBar
        sessionTitle={sessionTitle}
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
          participants={participants}
          compact={compact}
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
            onDm={(p) => { setActivePanel('Chat'); }}
            onDmOpen={(dm) => { setActivePanel('Chat'); }}
            onShare={handleShare}
            onUpload={() => { /* trigger file input */ }}
            isHost={true}
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
        onShareScreen={() => {}}
        onChatToggle={() => togglePanel('Chat')}
        onFilesToggle={() => togglePanel('Files')}
        onPeopleToggle={() => togglePanel('People')}
        onRecordToggle={() => setIsRecording(v => !v)}
        onMore={() => {}}
        onEnd={handleEnd}
      />
    </>
  );
}

// ── Layout bypass ──────────────────────────────────────────────
// _app.js reads this and wraps page content with FoundryLayout
// instead of the normal public/internal chrome.
FoundryRoom.getLayout = function getLayout(page) {
  return <FoundryLayout title="Foundry">{page}</FoundryLayout>;
};
