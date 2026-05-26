// pages/foundry/guest/[roomId].js
// The Foundry room experience for external guests.
// Uses sessionStorage token set by the join page.
// No auth required. Uses FoundryLayout.

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import FoundryLayout from '@/components/foundry/FoundryLayout';
import FoundryTopBar from '@/components/foundry/FoundryTopBar';
import FoundryVideoGrid from '@/components/foundry/FoundryVideoGrid';
import FoundryRightPanel from '@/components/foundry/FoundryRightPanel';
import FoundryBottomBar from '@/components/foundry/FoundryBottomBar';
import GuestConversionBanner from '@/components/foundry/GuestConversionBanner';

export default function GuestFoundryRoom() {
  const router = useRouter();
  const { roomId } = router.query;

  const [ready, setReady] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestToken, setGuestToken] = useState('');
  const [roomUrl, setRoomUrl] = useState('');
  const [error, setError] = useState('');

  // AV state
  const [micMuted, setMicMuted] = useState(true);
  const [camOff, setCamOff] = useState(false);
  const [isRecording] = useState(false);

  // View
  const [activeView, setActiveView] = useState('grid');
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [compact, setCompact] = useState(false);
  const [activePanel, setActivePanel] = useState('People');
  const [showConversionBanner, setShowConversionBanner] = useState(false);

  const callRef = useRef(null);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const startTimeRef = useRef(Date.now());

  // Pick up token from sessionStorage (set by join page)
  useEffect(() => {
    if (!roomId) return;
    try {
      const name = sessionStorage.getItem('foundry_guest_name');
      const token = sessionStorage.getItem('foundry_guest_token');
      const url = sessionStorage.getItem('foundry_guest_room_url');
      if (!name || !token || !url) {
        setError('Invalid session. Please use your invite link to join.');
        return;
      }
      setGuestName(name);
      setGuestToken(token);
      setRoomUrl(url);
      setReady(true);
    } catch {
      setError('Could not load session. Please use your invite link.');
    }
  }, [roomId]);

  // Show conversion banner when session ends
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
    setParticipants(list.map(p => ({
      id: p.session_id,
      name: p.user_name || 'Guest',
      isHost: !!p.owner,
      micMuted: !p.tracks?.audio || p.tracks.audio.state === 'off',
      videoOff: !p.tracks?.video || p.tracks.video.state === 'off',
      local: p.local,
    })));
  }, []);

  const handleSend = useCallback((text) => {
    setMessages(prev => [...prev, {
      sender: guestName || 'You',
      text,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      color: '#888',
    }]);
  }, [guestName]);

  const togglePanel = (tab) => {
    if (sidebarHidden) setSidebarHidden(false);
    setActivePanel(tab);
  };

  if (showConversionBanner) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0b0d11', display: 'flex',
        alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif",
      }}>
        <GuestConversionBanner guestName={guestName} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#ef5350', fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: 20,
        textAlign: 'center',
      }}>
        {error}
      </div>
    );
  }

  if (!ready) {
    return (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#555', fontFamily: "'DM Sans', sans-serif", fontSize: 13,
      }}>
        Loading Foundry…
      </div>
    );
  }

  return (
    <>
      <FoundryTopBar
        sessionTitle={`Foundry · ${roomId}`}
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
        {/* Guest video grid uses token directly instead of fetching from API */}
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
        onMicToggle={() => setMicMuted(v => !v)}
        onCamToggle={() => setCamOff(v => !v)}
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
