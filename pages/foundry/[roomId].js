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

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? (window.innerWidth < 1024 || window.innerHeight < 500) : false
  );
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024 || window.innerHeight < 500);
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
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

  // Background state
  const [callObject, setCallObject] = useState(null);
  const [selectedBackground, setSelectedBackground] = useState('none');
  const [isFounder, setIsFounder] = useState(false);

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
  const [sessionDms, setSessionDms] = useState([]);
  const [selectedDmParticipant, setSelectedDmParticipant] = useState(null);
  const [sharedFiles, setSharedFiles] = useState([]);
  const [forgeFiles, setForgeFiles] = useState([]);
  const [notes, setNotes] = useState('');

  const startTimeRef = useRef(Date.now());

  const loadSharedFiles = useCallback(async () => {
    if (!roomId) return;
    try {
      const res = await fetch(`/api/foundry/room/${roomId}/share-file`);
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.files)) {
        setSharedFiles(data.files);
      }
    } catch {}
  }, [roomId]);

  const broadcastFilesUpdated = useCallback(() => {
    if (!callRef.current) return;
    try {
      callRef.current.sendAppMessage({ type: 'FOUNDRY_FILES_UPDATED' }, '*');
    } catch {}
  }, []);


  const handleRoomEmpty = useCallback(async () => {
    if (callRef.current) await callRef.current.leave().catch(() => {});
    try { await fetch(`/api/foundry/room/${roomId}/destroy-daily`, { method: 'POST' }); } catch {}
    try { await fetch(`/api/foundry/room/${roomId}/end`, { method: 'POST' }); } catch {}
    router.push('/foundry');
  }, [roomId, router]);

  const handleEnd = useCallback(async () => {
    const isHost = room?.hostId === session?.user?.id;
    const msg = isHost ? 'End this Foundry for everyone?' : 'Leave this Foundry?';
    if (!confirm(msg)) return;
    clearTimeout(endTimerRef.current);
    clearTimeout(warnTimerRef.current);
    if (callRef.current) await callRef.current.leave().catch(() => {});
    if (isHost) {
      try { await fetch(`/api/foundry/room/${roomId}/destroy-daily`, { method: 'POST' }); } catch {}
      try { await fetch(`/api/foundry/room/${roomId}/end`, { method: 'POST' }); } catch {}
    }
    router.push('/foundry');
  }, [roomId, router, room, session]);

  // Auto-end: fired when scheduledEndAt is known
  const scheduleAutoEnd = useCallback((endIso, isHost) => {
    clearTimeout(endTimerRef.current);
    clearTimeout(warnTimerRef.current);

    const endMs = new Date(endIso).getTime();
    const now = Date.now();
    const msUntilEnd = endMs - now;
    if (msUntilEnd <= 0) return; // already past end

    // Warn 5 minutes before end
    const msUntilWarn = msUntilEnd - 5 * 60 * 1000;
    if (msUntilWarn > 0) {
      warnTimerRef.current = setTimeout(() => setShowEndWarning(true), msUntilWarn);
    } else {
      setShowEndWarning(true); // already within warning window
    }

    // Auto-end
    endTimerRef.current = setTimeout(async () => {
      setShowEndWarning(false);
      if (callRef.current) await callRef.current.leave().catch(() => {});
      // Only host calls end API — prevents duplicate calls
      if (isHost) {
        try { await fetch(`/api/foundry/room/${roomId}/end`, { method: 'POST' }); } catch {}
      }
      router.push('/foundry');
    }, msUntilEnd);
  }, [roomId, router]);

  // Load room — token API now returns scheduledEndAt
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
          setSelectedBackground(data.room.currentUserFoundryBackground || session?.user?.foundryBackground || 'none');
          setIsFounder(!!data.room.currentUserIsFounder);
          startTimeRef.current = new Date(data.room.startedAt || Date.now()).getTime();
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Load forge files from Vault — single source of truth
    Promise.all([
      fetch('/api/resume/list').then(r => r.json()).catch(() => ({})),
      fetch('/api/cover/list').then(r => r.json()).catch(() => ({})),
      fetch('/api/vault/documents').then(r => r.json()).catch(() => ({})),
      fetch('/api/anvil/onboarding-growth/list').then(r => r.json()).catch(() => ({})),
      fetch('/api/offer-negotiation/list').then(r => r.json()).catch(() => ({})),
      fetch('/api/apply/application-packets/list').then(r => r.json()).catch(() => ({})),
      fetch('/api/coaching/clients/strategy/list').then(r => r.json()).catch(() => ({})),
    ])
      .then(([resumeData, coverData, vaultData, roadmapData, negotiationData, packetData, strategyData]) => {
        const ago = (date) => date ? new Date(date).toLocaleDateString() : 'Unknown';

        const resumeItems = Array.isArray(resumeData.resumes)
          ? resumeData.resumes.map(r => ({
              id: r.id, name: r.name, type: 'Resume',
              docType: 'resume', ago: ago(r.updatedAt),
            })) : [];

        const coverItems = Array.isArray(coverData.covers)
          ? coverData.covers.map(c => ({
              id: c.id, name: c.name, type: 'Cover Letter',
              docType: 'cover', ago: ago(c.updatedAt || c.createdAt),
            })) : [];

        const profileItem = vaultData?.professionalProfile
          ? [{
              id: vaultData.professionalProfile.id,
              name: 'Professional Operating Profile',
              type: 'Professional Operating Profile',
              docType: 'profile',
              ago: ago(vaultData.professionalProfile.updatedAt),
            }] : [];

        const prepItems = Array.isArray(vaultData?.interviewPreps)
          ? vaultData.interviewPreps.map(p => ({
              id: p.id, name: p.name || `Interview Prep · App #${p.applicationId}`,
              type: 'Interview Prep', docType: 'interview',
              ago: ago(p.generatedAt),
            })) : [];

        const roadmapItems = Array.isArray(roadmapData.roadmaps)
          ? roadmapData.roadmaps.map(r => ({
              id: r.id, name: r.name || 'Growth & Pivot Roadmap',
              type: 'Growth & Pivot Roadmap', docType: 'roadmap',
              ago: ago(r.updatedAt || r.createdAt),
            })) : [];

        const negotiationItems = Array.isArray(negotiationData.negotiations)
          ? negotiationData.negotiations.map(n => ({
              id: n.id, name: n.name || 'Offer & Negotiation Brief',
              type: 'Offer & Negotiation Brief', docType: 'negotiation',
              ago: ago(n.updatedAt || n.createdAt),
            })) : [];

        const packetItems = Array.isArray(packetData.packets)
          ? packetData.packets.map(p => ({
              id: p.applicationId || p.id, name: p.name || 'Application Packet',
              type: 'Application Packet', docType: 'packet',
              ago: ago(p.updatedAt || p.submittedAt),
            })) : [];

        const strategyItems = Array.isArray(strategyData.strategies)
          ? strategyData.strategies.map(s => ({
              id: s.id, name: s.title || 'Target Strategy',
              type: 'Target Strategy', docType: 'strategy',
              ago: ago(s.updatedAt),
            })) : [];

        setForgeFiles([
          ...resumeItems,
          ...coverItems,
          ...profileItem,
          ...prepItems,
          ...roadmapItems,
          ...negotiationItems,
          ...packetItems,
          ...strategyItems,
        ]);
      })
      .catch(() => {});
  }, [roomId, status, router]);

  // Cleanup timers on unmount
  useEffect(() => () => {
    clearTimeout(endTimerRef.current);
    clearTimeout(warnTimerRef.current);
  }, []);

  // Poll shared files every 5 seconds so all participants stay in sync
  // regardless of whether Daily app-messages are received
  useEffect(() => {
    if (!roomId || loading) return;
    const interval = setInterval(loadSharedFiles, 5000);
    return () => clearInterval(interval);
  }, [roomId, loading, loadSharedFiles]);

const handleCallReady = useCallback((call) => {
  callRef.current = call;
  setCallObject(call);

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

    if (data?.type === 'FOUNDRY_DM') {
      const local = call.participants()?.local;
      const localSessionId = local?.session_id;

      if (!localSessionId) return;
      if (data.toSessionId !== localSessionId && data.fromSessionId !== localSessionId) return;

      setSessionDms(prev =>
        prev.some(m => m.id === data.id) ? prev : [...prev, data]
      );
    }

    if (data?.type === 'FOUNDRY_FILES_UPDATED') {
      loadSharedFiles();
    }
  });
}, [loadSharedFiles]);

  // Called by FoundryVideoGrid once it gets the token response (passes scheduledEndAt back)
  const handleScheduledEnd = useCallback((endIso, isHost) => {
    if (!endIso || scheduledEndAt) return; // only set once
    setScheduledEndAt(endIso);
    scheduleAutoEnd(endIso, isHost);
  }, [scheduledEndAt, scheduleAutoEnd]);

  const handleParticipantsChange = useCallback((list) => {
    setParticipants(list.map(p => {
      // Daily session_id controls live meeting actions.
      // Forge userId controls Signal/co-host eligibility.
      // External Daily guests can have a Daily user_id, so only treat user_id as
      // a Forge user id when it looks like our cuid/cuid2 ids. This prevents
      // guests from being routed into Signal while still recognizing FT members.
      const rawDailyUserId = p.user_id || null;
      const forgeUserId = p.userData?.userId || (String(rawDailyUserId || '').startsWith('cm') ? rawDailyUserId : null);

      return {
        id: p.session_id,
        userId: forgeUserId,
        dailyUserId: rawDailyUserId,
        name: p.user_name || 'Guest',
        role: p.userData?.role || '',
        isHost: !!p.owner,
        micMuted: !p.tracks?.audio || p.tracks.audio.state === 'off',
        videoOff: !p.tracks?.video || p.tracks.video.state === 'off',
        isScreenSharing: !!p.tracks?.screenVideo?.persistentTrack && p.tracks?.screenVideo?.state !== 'off' && p.tracks?.screenVideo?.state !== 'blocked',
        isGuest: !forgeUserId,
        local: p.local,
        avatarUrl: p.userData?.avatarUrl || null,
      };
    }));
  }, []);

  const handleScreenShareChange = useCallback((sharing) => {
    setIsScreenSharing(sharing);
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
      } catch (err) { console.error('[foundry] sendAppMessage error:', err); }
    }
  }, [session]);

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
    fromName: local.user_name || session?.user?.name || 'You',
    toName: target.name || 'Participant',
    text: text.trim(),
    time: now,
    color: '#FF7043',
  };

  setSessionDms(prev => [...prev, msg]);

  try {
    callRef.current.sendAppMessage(msg, '*');
  } catch {}
}, [session]);

const sendFoundryControl = useCallback((action, targetSessionId = '*', payload = {}) => {
  if (!callRef.current) return;

  const resolvedTargetSessionId = targetSessionId || '*';

  try {
    callRef.current.sendAppMessage(
      {
        type: 'FOUNDRY_CONTROL',
        action,
        targetSessionId: resolvedTargetSessionId,
        ...payload,
      },
      '*'
    );
  } catch (err) {
    console.error('[foundry] control send failed:', err);
  }
}, []);

  const handleMuteAll = useCallback(() => {
    sendFoundryControl('MUTE_ALL', '*');
  }, [sendFoundryControl]);

  const handleMuteParticipant = useCallback((participant) => {
    if (!participant?.id) return;
    sendFoundryControl('MUTE', participant.id, { targetUserId: participant.userId || null });
  }, [sendFoundryControl]);

  const handleStopParticipantShare = useCallback((participant) => {
    if (!participant?.id) return;
    sendFoundryControl('STOP_SCREEN_SHARE', participant.id, { targetUserId: participant.userId || null });
  }, [sendFoundryControl]);

  const handleStopParticipantCamera = useCallback((participant) => {
    if (!participant?.id) return;
    sendFoundryControl('STOP_CAMERA', participant.id, { targetUserId: participant.userId || null });
  }, [sendFoundryControl]);

  const handleKickParticipant = useCallback(async (participant) => {
    if (!participant?.id) return;
    if (!confirm(`Remove ${participant.name || 'this participant'} from this Foundry?`)) return;

    try {
      await fetch(`/api/foundry/room/${roomId}/participant-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'KICK',
          targetSessionId: participant.id,
          targetUserId: participant.userId || null,
          targetName: participant.name || null,
        }),
      });
    } catch {}

    sendFoundryControl('KICK', participant.id, {
      targetName: participant.name || null,
    });
  }, [roomId, sendFoundryControl]);

  const handleBanParticipant = useCallback(async (participant) => {
    if (!participant?.id) return;
    if (!confirm(`Ban ${participant.name || 'this participant'} from rejoining this Foundry?`)) return;

    try {
      await fetch(`/api/foundry/room/${roomId}/participant-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'BAN',
          targetSessionId: participant.id,
          targetUserId: participant.userId || null,
          targetName: participant.name || null,
        }),
      });
    } catch {}

    sendFoundryControl('BAN', participant.id, {
      targetName: participant.name || null,
    });
  }, [roomId, sendFoundryControl]);

  const handleLockRoom = useCallback(async () => {
    try {
      const res = await fetch(`/api/foundry/room/${roomId}/participant-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'LOCK' }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        // Update local room state so isLocked reflects immediately
        setRoom(prev => prev ? { ...prev, isLocked: data.isLocked } : prev);
        // Signal all participants of lock state change
        sendFoundryControl('ROOM_LOCKED', '*', { isLocked: data.isLocked });
      }
    } catch (err) {
      console.error('[foundry] lockRoom failed:', err);
    }
  }, [roomId, sendFoundryControl]);


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

  const handleShare = useCallback(async (file) => {
    if (!file || !roomId) return;

    // All forge docs go through vault/render-pdf — single pipeline, Vault is source of truth.
    // render-pdf renders using the sender's session, uploads to Supabase, returns a downloadUrl.
    // That URL is then registered in FoundrySharedFile so all room participants can access it.
    try {
      const docType = file.docType || null;
      const docId = file.id || null;

      if (docType && docId) {
        // Step 1: Render PDF via Vault
        const renderRes = await fetch('/api/vault/render-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ docType, docId: String(docId) }),
        });
        const renderData = await renderRes.json().catch(() => ({}));
        if (!renderRes.ok) throw new Error(renderData.error || 'Could not render document');

        const { downloadUrl, storagePath } = renderData;

        // Step 2: Register in Foundry shared files
        const shareRes = await fetch(`/api/foundry/room/${roomId}/share-file`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: `${file.name || 'Document'}.pdf`,
            fileUrl: downloadUrl,
            storagePath,
            source: 'FORGE',
          }),
        });
        const shareData = await shareRes.json().catch(() => ({}));
        if (!shareRes.ok) throw new Error(shareData.error || 'Could not share file');

        if (shareData.file) {
          setSharedFiles(prev => {
            if (prev.find(f => f.id === shareData.file.id || f.name === shareData.file.name)) return prev;
            return [shareData.file, ...prev];
          });
        } else {
          await loadSharedFiles();
        }

        broadcastFilesUpdated();
        return;
      }

      // Fallback: non-forge file with a direct URL (legacy or upload)
      const fileName = file.name || file.fileName || 'Shared file';
      const fileUrl = file.url || file.fileUrl || null;

      const res = await fetch(`/api/foundry/room/${roomId}/share-file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName, fileUrl, source: 'FORGE' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not share file');

      if (data.file) {
        setSharedFiles(prev => {
          if (prev.find(f => f.id === data.file.id || f.name === data.file.name)) return prev;
          return [data.file, ...prev];
        });
      } else {
        await loadSharedFiles();
      }

      broadcastFilesUpdated();
    } catch (err) {
      alert(String(err?.message || err || 'Could not share file'));
    }
  }, [roomId, loadSharedFiles, broadcastFilesUpdated]);

  const handleRemoveFile = useCallback(async (file) => {
    if (!file?.id || !roomId) return;
    try {
      const res = await fetch(`/api/foundry/room/${roomId}/share-file`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: file.id }),
      });
      if (!res.ok) return;
      setSharedFiles(prev => prev.filter(f => f.id !== file.id));
      broadcastFilesUpdated();
    } catch {}
  }, [roomId, broadcastFilesUpdated]);

  const handleUpload = useCallback(async (file) => {
    if (!file || !roomId) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('Maximum file size is 10MB.');
      return;
    }

    try {
      // Step 1: Read as base64 and upload to Supabase Storage
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
        }),
      });
      const uploadData = await uploadRes.json().catch(() => ({}));
      if (!uploadRes.ok) throw new Error(uploadData.error || 'Could not upload file');

      // Step 2: Register in Foundry shared files
      const shareRes = await fetch(`/api/foundry/room/${roomId}/share-file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: uploadData.fileName || file.name,
          storagePath: uploadData.storagePath,
          source: 'COMPUTER',
        }),
      });
      const shareData = await shareRes.json().catch(() => ({}));
      if (!shareRes.ok) throw new Error(shareData.error || 'Could not share file');

      if (shareData.file) {
        setSharedFiles(prev => {
          if (prev.find(f => f.id === shareData.file.id)) return prev;
          return [shareData.file, ...prev];
        });
      } else {
        await loadSharedFiles();
      }

      broadcastFilesUpdated();
    } catch (err) {
      alert(String(err?.message || err || 'Could not upload file'));
    }
  }, [roomId, loadSharedFiles, broadcastFilesUpdated]);

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

  // All hooks above — safe to early return here
  if (loading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>
      Opening Foundry…
    </div>
  );

  const isHost = room?.hostId === session?.user?.id;
  const isCoHost = room?.coHostUserId === session?.user?.id;
  const canManage = isHost || isCoHost;

  if (isMobile) {
    return (
      <FoundryMobileLayout
        sessionTitle={room?.title || `Foundry · ${roomId}`}
        startTime={startTimeRef.current}
        isRecording={isRecording}
        roomId={roomId}
        micMuted={micMuted}
        camOff={camOff}
        isScreenSharing={isScreenSharing}
        onMicToggle={() => setMicMuted(v => !v)}
        onCamToggle={() => setCamOff(v => !v)}
        onShareScreen={handleShareScreen}
        onRecordToggle={handleRecordToggle}
        participants={participants}
        messages={meetingMessages}
		sessionDms={sessionDms}
		selectedDmParticipant={selectedDmParticipant}
		onSelectDmParticipant={setSelectedDmParticipant}
		onSendDm={handleSendDm}
        onSend={handleSend}
        onEnd={handleEnd}
        isHost={canManage}
        onMuteAll={handleMuteAll}
        onMuteParticipant={handleMuteParticipant}
        onKickParticipant={handleKickParticipant}
        onBanParticipant={handleBanParticipant}
        onLockRoom={handleLockRoom}
        onStopParticipantShare={handleStopParticipantShare}
        onStopParticipantCamera={handleStopParticipantCamera}
        sharedFiles={sharedFiles}
        forgeFiles={forgeFiles}
        onShare={handleShare}
        onUpload={handleUpload}
        onRemoveFile={handleRemoveFile}
        notes={notes}
        onNotesChange={handleNotesChange}
        guestCode={null}
        isGuest={false}
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
          initialBackground={selectedBackground}
        />
      </FoundryMobileLayout>
    );
  }

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
        callObject={callObject}
        selectedBackground={selectedBackground}
        onBackgroundChange={setSelectedBackground}
        isFounder={isFounder}
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
          initialBackground={selectedBackground}
        />

        {!sidebarHidden && (
          <FoundryRightPanel
            roomId={roomId}
            guestToken={room?.guestToken || null}
            participants={participants}
            messages={meetingMessages}
			sessionDms={sessionDms}
			selectedDmParticipant={selectedDmParticipant}
			onSelectDmParticipant={setSelectedDmParticipant}
			onSendDm={handleSendDm}
            sharedFiles={sharedFiles}
            forgeFiles={forgeFiles}
            notes={notes}
            onNotesChange={handleNotesChange}
            onSend={handleSend}
            onShare={handleShare}
            onUpload={handleUpload}
            onRemoveFile={handleRemoveFile}
            isHost={canManage}
            isCoHost={isCoHost}
            initialTab={activePanel}
            currentUserId={session?.user?.id}
            currentUserRole={session?.user?.role}
            coHostUserId={room?.coHostUserId}
            coHostName={room?.coHost?.name}
            onCoHostAssigned={(data) => {
              setRoom(prev => ({
                ...prev,
                coHostUserId: data?.coHostUserId || null,
                coHost: data?.coHostName ? { ...(prev?.coHost || {}), name: data.coHostName } : null,
              }));
            }}
            isLocked={room?.isLocked || false}
            onMuteAll={handleMuteAll}
            onMuteParticipant={handleMuteParticipant}
            onKickParticipant={handleKickParticipant}
            onBanParticipant={handleBanParticipant}
            onStopParticipantShare={handleStopParticipantShare}
            onStopParticipantCamera={handleStopParticipantCamera}
            onLockRoom={handleLockRoom}
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