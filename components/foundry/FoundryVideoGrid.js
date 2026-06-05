// components/foundry/FoundryVideoGrid.js
// Handles both authenticated users (fetches token from API)
// and guests (receives token directly as props).
// FT users: renders their profile avatar when camera is off.
// Guests: renders initials circle.
// Auto-ends the Foundry when all participants have left.
// Screen share: renders in main tile, toggle on/off, supports takeover.

import { useState, useEffect, useRef, useCallback } from 'react';
import DailyIframe from '@daily-co/daily-js';

const S = {
  area: {
    flex: 1, display: 'flex', flexDirection: 'column',
    padding: 10, gap: 8, minWidth: 0,
    justifyContent: 'center', // center tiles vertically when there's extra space
  },
  mainTile: {
    width: '100%',
    aspectRatio: '16 / 9',       // industry standard camera ratio
    borderRadius: 10, position: 'relative', overflow: 'hidden',
    background: '#070910', border: '1px solid rgba(255,255,255,0.06)',
    flexShrink: 0,
  },
  inner: {
    width: '100%', height: '100%', display: 'flex',
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  ambient: {
    position: 'absolute', inset: 0,
    background: 'radial-gradient(ellipse 60% 50% at 50% 60%, rgba(255,112,67,0.045) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  floor: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%',
    background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)',
    pointerEvents: 'none',
  },
  frameLine: {
    position: 'absolute', top: 0, left: '18%', right: '18%', height: 1,
    background: 'linear-gradient(90deg, transparent, rgba(255,112,67,0.22), transparent)',
    pointerEvents: 'none',
  },
  nameTag: {
    position: 'absolute', bottom: 10, left: 10,
    background: 'rgba(0,0,0,0.55)', borderRadius: 5, padding: '4px 10px',
    fontSize: 11, color: '#ddd', display: 'flex', alignItems: 'center', gap: 6, zIndex: 3,
  },
  hostBadge: {
    background: 'rgba(255,112,67,0.2)', color: '#FF7043',
    fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 3,
  },
  guestBadge: {
    background: 'rgba(255,255,255,0.1)', color: '#aaa',
    fontSize: 9, fontWeight: 600, padding: '2px 5px', borderRadius: 3,
  },
  screenBadge: {
    background: 'rgba(76,175,80,0.2)', color: '#66bb6a',
    fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 3,
  },
  initialsCircle: {
    width: 80, height: 80, borderRadius: '50%',
    background: 'linear-gradient(135deg,#BF360C,#FF7043)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 30, fontWeight: 700, color: '#fff', position: 'relative', zIndex: 1,
  },
  avatarImg: {
    width: 80, height: 80, borderRadius: '50%',
    objectFit: 'cover', position: 'relative', zIndex: 1,
    border: '2px solid rgba(255,255,255,0.1)',
  },
  pipAvatarImg: { width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' },
  pipInitialsCircle: {
    width: 32, height: 32, borderRadius: '50%', background: '#5C6BC0',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11, fontWeight: 600, color: '#fff',
  },
  videoEl: {
    width: '100%', height: '100%', objectFit: 'cover',
    position: 'absolute', inset: 0, borderRadius: 10,
  },
  screenEl: {
    width: '100%', height: '100%', objectFit: 'contain',
    position: 'absolute', inset: 0, borderRadius: 10, background: '#000',
  },
  pipRow: { display: 'flex', gap: 7, flexShrink: 0, alignItems: 'flex-start' },
  pip: {
    width: 140,                  // fixed width
    aspectRatio: '16 / 9',       // always 16:9
    flexShrink: 0,
    borderRadius: 8, background: '#0a0c10',
    border: '1px solid rgba(255,255,255,0.06)',
    position: 'relative', overflow: 'hidden',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', transition: 'border-color 0.15s',
  },
  pipName: {
    position: 'absolute', bottom: 4, left: 5, fontSize: 9,
    color: 'rgba(255,255,255,0.7)', background: 'rgba(0,0,0,0.45)',
    borderRadius: 3, padding: '1px 5px', zIndex: 2,
  },
  pipMute: { position: 'absolute', top: 4, right: 4, fontSize: 10, color: '#ef5350', zIndex: 2 },
  pipAdd: {
    border: '1px dashed rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.01)',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: 3, color: 'rgba(255,255,255,0.2)', fontSize: 9,
  },
  stateMsg: {
    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
    justifyContent: 'center', color: '#555', fontSize: 13,
    fontFamily: "'DM Sans', sans-serif", flexDirection: 'column', gap: 8,
  },
  errorMsg: {
    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
    justifyContent: 'center', color: '#ef5350', fontSize: 12,
    fontFamily: "'DM Sans', sans-serif", textAlign: 'center', padding: 20,
  },
};


const BACKGROUND_IMAGES = {
  'forge-office': '/backgrounds/foundry/forge-office.jpg',
  'coaching-library': '/backgrounds/foundry/coaching-library.jpg',
  'coaching-strategy-room': '/backgrounds/foundry/coaching-strategy-room.jpg',
  'forge-floor': '/backgrounds/foundry/forge-floor.jpg',
  'neutral-professional': '/backgrounds/foundry/neutral-professional.jpg',
  'founder-office': '/backgrounds/foundry/founder-office.jpg',
};

function backgroundSource(path) {
  if (!path) return '';
  if (typeof window === 'undefined') return path;
  return `${window.location.origin}${path}`;
}

async function applyFoundryBackground(callObject, background) {
  if (!callObject?.updateInputSettings) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('foundry-bg-error', {
        detail: { message: 'Background effects are not supported on this device.' }
      }));
    }
    return;
  }

  const safeBackground = background || 'none';

  if (safeBackground === 'blur') {
    await callObject.updateInputSettings({
      video: {
        processor: {
          type: 'background-blur',
          config: { strength: 1 },
        },
      },
    });
    return;
  }

  if (safeBackground !== 'none' && BACKGROUND_IMAGES[safeBackground]) {
    await callObject.updateInputSettings({
      video: {
        processor: {
          type: 'background-image',
          config: { source: backgroundSource(BACKGROUND_IMAGES[safeBackground]) },
        },
      },
    });
    return;
  }

  await callObject.updateInputSettings({
    video: {
      processor: { type: 'none' },
    },
  });
}

function initials(name) {
  return (name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
}

function getTrack(participant, kind) {
  const trackObj = participant?.tracks?.[kind];
  if (trackObj?.persistentTrack) return trackObj.persistentTrack;

  if (kind === 'video' && participant?.videoTrack) return participant.videoTrack;
  if (kind === 'audio' && participant?.audioTrack) return participant.audioTrack;
  if (kind === 'screenVideo' && participant?.screenVideoTrack) return participant.screenVideoTrack;

  return null;
}

function isTrackOff(participant, kind) {
  const trackObj = participant?.tracks?.[kind];
  const state = trackObj?.state;

  if (state === 'off' || state === 'blocked' || state === 'interrupted') return true;

  if (kind === 'audio' && participant?.audio === false) return true;
  if (kind === 'video' && participant?.video === false) return true;
  if (kind === 'screenVideo' && participant?.screen === false) return true;

  return false;
}

async function applyLocalControl(callObject, action) {
  if (!callObject) return;

  const safeCall = (fn) => {
    try {
      const result = fn();
      if (result && typeof result.then === 'function') {
        return result.catch(() => {});
      }
      return result;
    } catch {
      return null;
    }
  };

  if (action === 'MUTE' || action === 'MUTE_ALL') {
    safeCall(() => callObject.updateParticipant?.('local', { setAudio: false }));
    safeCall(() => callObject.setLocalAudio?.(false));
  }

  if (action === 'STOP_CAMERA') {
    safeCall(() => callObject.updateParticipant?.('local', { setVideo: false }));
    safeCall(() => callObject.setLocalVideo?.(false));
  }

  if (action === 'STOP_SCREEN_SHARE') {
    safeCall(() => callObject.updateParticipant?.('local', { setScreenShare: false }));
    safeCall(() => callObject.stopScreenShare?.());
  }
}


function ScreenShareTile({ track, sharerName, isLocal, onStopShare }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !track) return;
    el.srcObject = new MediaStream([track]);
    el.play().catch(() => {});
  }, [track]);

  return (
    <div style={{ ...S.mainTile, aspectRatio: '16 / 9' }}>
      <div style={S.inner}>
        <video ref={videoRef} style={S.screenEl} autoPlay muted playsInline />
        <div style={S.nameTag}>
          <span style={{ color: '#66bb6a', fontSize: 12 }}>🖥</span>
          {isLocal ? 'You are sharing' : `${sharerName} is sharing`}
          <span style={S.screenBadge}>Screen</span>
        </div>
        {isLocal && (
          <button
            onClick={onStopShare}
            style={{
              position: 'absolute', top: 10, right: 10,
              background: '#c62828', border: 'none', color: '#fff',
              borderRadius: 6, padding: '5px 12px', fontSize: 11, fontWeight: 600,
              cursor: 'pointer', zIndex: 3, fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Stop sharing
          </button>
        )}
      </div>
    </div>
  );
}

function VideoTile({ participant, isMain = false }) {
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  const videoTrack = getTrack(participant, 'video');
  const audioTrack = getTrack(participant, 'audio');

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (videoTrack) {
      el.srcObject = new MediaStream([videoTrack]);
      el.play().catch(() => {});
    } else {
      el.srcObject = null;
    }
  }, [videoTrack]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el || participant?.local) return;
    if (audioTrack) {
      el.srcObject = new MediaStream([audioTrack]);
      el.play().catch(() => {});
    } else {
      el.srcObject = null;
    }
  }, [audioTrack, participant?.local]);

  const name = participant?.user_name || 'Guest';
  const avatarUrl = participant?.userData?.avatarUrl || null;
  const isGuest = !avatarUrl;
  const videoState = participant?.tracks?.video?.state;
  const videoOff = isTrackOff(participant, 'video') || !videoTrack;
  const audioState = participant?.tracks?.audio?.state;
  const micMuted = isTrackOff(participant, 'audio');

  if (isMain) {
    return (
      <div style={S.mainTile}>
        <div style={S.inner}>
          <div style={S.ambient} />
          <div style={S.floor} />
          <div style={S.frameLine} />
          <video
            ref={videoRef}
            style={{
              ...S.videoEl,
              objectFit: typeof window !== 'undefined' && window.innerWidth < 768 ? 'contain' : 'cover',
            }}
            autoPlay
            muted
            playsInline
          />
          {videoOff && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              background: '#070910', zIndex: 1,
            }}>
              {avatarUrl
                ? <img src={avatarUrl} alt={name} style={S.avatarImg} />
                : <div style={S.initialsCircle}>{initials(name)}</div>
              }
            </div>
          )}
          <audio ref={audioRef} autoPlay playsInline style={{ display: 'none' }} />
          <div style={S.nameTag}>
            <span style={{ color: micMuted ? '#ef5350' : '#4caf50', fontSize: 12 }}>
              {micMuted ? '🔇' : '🎤'}
            </span>
            {name}
            {participant?.owner && <span style={S.hostBadge}>Host</span>}
            {isGuest && !participant?.owner && <span style={S.guestBadge}>Guest</span>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={S.pip}>
      <video
        ref={videoRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: typeof window !== 'undefined' && window.innerWidth < 768 ? 'contain' : 'cover',
        }}
        autoPlay muted playsInline
      />
      {videoOff && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: '#0a0c10', zIndex: 1,
        }}>
          {avatarUrl
            ? <img src={avatarUrl} alt={name} style={S.pipAvatarImg} />
            : <div style={S.pipInitialsCircle}>{initials(name)}</div>
          }
        </div>
      )}
      <audio ref={audioRef} autoPlay playsInline style={{ display: 'none' }} />
      <div style={S.pipName}>{name.split(' ')[0]}</div>
      {micMuted && <span style={S.pipMute}>🔇</span>}
    </div>
  );
}

export default function FoundryVideoGrid({
  roomId, compact = false, onInvite,
  micMuted, camOff,
  activeView = 'grid',
  onCallReady, onParticipantsChange,
  onScreenShareChange,
  onRoomEmpty,
  onHostEnded = null,
  onScheduledEnd = null,
  guestToken = null,
  guestRoomUrl = null,
  guestUserData = null,
  initialBackground = 'none',
  onRemoteMute = null,
  onRemoteStopCamera = null,
}) {
  const callRef = useRef(null);
  const localUserDataRef = useRef(guestUserData || null);
  const [participants, setParticipants] = useState({});
  const [joinState, setJoinState] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const roomEndedRef = useRef(false);

  const [screenTrack, setScreenTrack] = useState(null);
  const [remoteScreenTrack, setRemoteScreenTrack] = useState(null);
  const [remoteScreenSharer, setRemoteScreenSharer] = useState('');
  const [isLocalSharing, setIsLocalSharing] = useState(false);

  // Parent callbacks can change identity every render.
  // Keep them in refs so the Daily join effect does not tear down/rejoin the room.
  const onCallReadyRef = useRef(onCallReady);
  const onParticipantsChangeRef = useRef(onParticipantsChange);
  const onScreenShareChangeRef = useRef(onScreenShareChange);
  const onRoomEmptyRef = useRef(onRoomEmpty);
  const onHostEndedRef = useRef(onHostEnded);
  const onScheduledEndRef = useRef(onScheduledEnd);
  const onRemoteMuteRef = useRef(onRemoteMute);
  const onRemoteStopCameraRef = useRef(onRemoteStopCamera);

  useEffect(() => {
    onCallReadyRef.current = onCallReady;
    onParticipantsChangeRef.current = onParticipantsChange;
    onScreenShareChangeRef.current = onScreenShareChange;
    onRoomEmptyRef.current = onRoomEmpty;
    onHostEndedRef.current = onHostEnded;
    onScheduledEndRef.current = onScheduledEnd;
    onRemoteMuteRef.current = onRemoteMute;
    onRemoteStopCameraRef.current = onRemoteStopCamera;
  }, [
    onCallReady,
    onParticipantsChange,
    onScreenShareChange,
    onRoomEmpty,
    onHostEnded,
    onScheduledEnd,
    onRemoteMute,
    onRemoteStopCamera,
  ]);

  const syncScreenShareState = useCallback((current) => {
    const local = current?.local;

    const localScreen =
      !isTrackOff(local, 'screenVideo')
        ? getTrack(local, 'screenVideo')
        : null;

    if (localScreen) {
      setScreenTrack(localScreen);
      setIsLocalSharing(true);
      onScreenShareChangeRef.current?.(true);
    } else {
      setScreenTrack(null);
      setIsLocalSharing(false);
    }

    const remoteSharer = Object.values(current || {}).find((p) => (
      !p.local &&
      getTrack(p, 'screenVideo') && !isTrackOff(p, 'screenVideo')
    ));

    if (remoteSharer) {
      setRemoteScreenTrack(getTrack(remoteSharer, 'screenVideo'));
      setRemoteScreenSharer(remoteSharer.user_name || 'Participant');
    } else {
      setRemoteScreenTrack(null);
      setRemoteScreenSharer('');
    }
  }, []);

  const updateParticipants = useCallback(() => {
    if (!callRef.current) return;
    const current = callRef.current.participants();
    setParticipants({ ...current });
    syncScreenShareState(current);
    return current;
  }, [syncScreenShareState]);

const checkRoomEmpty = useCallback((current) => {
  if (roomEndedRef.current) return;

  const totalCount = Object.values(current || {}).length;

  if (totalCount === 0) {
    setTimeout(() => {
      if (!callRef.current || roomEndedRef.current) return;

      const fresh = callRef.current.participants();
      const stillEmpty = Object.values(fresh || {}).length === 0;

      if (stillEmpty) {
        roomEndedRef.current = true;
        onRoomEmptyRef.current?.();
      }
    }, 3000);
  }
}, []);

  useEffect(() => {
    if (!roomId) return;
    let call;
    let destroyed = false;

    async function join() {
      try {
        setJoinState('fetching');
        let token, roomUrl, localUserData = guestUserData || null;

        if (guestToken && guestRoomUrl) {
          token = guestToken;
          roomUrl = guestRoomUrl;
        } else {
          const res = await fetch(`/api/foundry/room/${roomId}/token`);
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Could not get meeting token');
          token = data.token;
          roomUrl = data.roomUrl;
          localUserData = data.userData || null;
          if (data.scheduledEndAt) {
            onScheduledEndRef.current?.(data.scheduledEndAt, !!data.isOwner);
          }
        }

        if (destroyed) return;
        localUserDataRef.current = localUserData;
        setJoinState('joining');

        call = DailyIframe.createCallObject({
          audioSource: true,
          videoSource: true,
        });
        callRef.current = call;

        const refresh = () => { if (!destroyed) updateParticipants(); };
        const refreshDebounced = () => {
          if (destroyed) return;
          // Fire immediately for UI, then again after track state propagates
          updateParticipants();
          setTimeout(() => { if (!destroyed) updateParticipants(); }, 150);
          setTimeout(() => { if (!destroyed) updateParticipants(); }, 500);
        };
        call.on('participant-joined', refreshDebounced);
        call.on('participant-updated', refreshDebounced);
        call.on('track-started', refreshDebounced);
        call.on('track-stopped', refreshDebounced);

        call.on('participant-left', () => {
          if (destroyed) return;
          const current = callRef.current?.participants() || {};
          setParticipants({ ...current });
          checkRoomEmpty(current);
        });

        call.on('local-screen-share-started', () => {
          if (destroyed) return;

          const sync = () => {
            if (destroyed || !callRef.current) return;
            const current = callRef.current.participants();
            setParticipants({ ...current });
            syncScreenShareState(current);
          };

          sync();
          setTimeout(sync, 150);
          setTimeout(sync, 500);
        });

        call.on('local-screen-share-stopped', () => {
          if (destroyed) return;

          setScreenTrack(null);
          setIsLocalSharing(false);
          onScreenShareChangeRef.current?.(false);

          const current = callRef.current?.participants() || {};
          setParticipants({ ...current });
          syncScreenShareState(current);
        });

        call.on('joined-meeting', () => {
          if (!destroyed) {
            setJoinState('joined');
            updateParticipants();
            onCallReadyRef.current?.(call);
            applyFoundryBackground(call, sessionStorage.getItem('foundry_background') || initialBackground).catch((err) => {
              console.error('[foundry] initial background failed:', err);
            });
            // Explicitly sync camera/mic state after join — Daily may start video off
            // regardless of startVideoOff, so we re-apply the preference with a delay
            // to ensure the call is fully negotiated before we toggle
            setTimeout(() => {
              if (destroyed || !call) return;
              try {
                const camPref = sessionStorage.getItem('foundry_camera_on');
                const micPref = sessionStorage.getItem('foundry_mic_on');
                if (camPref !== null) call.setLocalVideo(camPref !== '0');
                if (micPref !== null) call.setLocalAudio(micPref === '1');
              } catch {}
            }, 1200);
          }
        });

        call.on('error', (e) => {
          if (!destroyed) {
            setJoinState('error');
            setErrorMsg(e?.errorMsg || 'Connection error');
          }
        });

        // Fired on all participants when the room owner ends the meeting
        call.on('meeting-ended', () => {
          if (!destroyed) {
            setJoinState('idle');
            onHostEndedRef.current?.();
          }
        });

        // Foundry host/co-host control messages.
        // Daily owners may also apply direct updateParticipant controls from the parent.
        // This listener is the fallback path and the primary path for co-host controls.
        call.on('app-message', async ({ data }) => {
          if (destroyed || data?.type !== 'FOUNDRY_CONTROL') return;

          const localParticipant = callRef.current?.participants()?.local;
          const localIsOwner = !!localParticipant?.owner;
          const localSessionId = localParticipant?.session_id;
          const localUserId = localParticipant?.userData?.userId || localParticipant?.user_id || null;
          const targetSessionId = data?.targetSessionId || '*';
          const targetUserId = data?.targetUserId || null;
          const isTargetedAtMe =
            targetSessionId === '*' ||
            targetSessionId === localSessionId ||
            (!!targetUserId && targetUserId === localUserId);

          try {
            if (data.action === 'MUTE' && isTargetedAtMe) {
              await applyLocalControl(callRef.current, 'MUTE');
              onRemoteMuteRef.current?.();
              setTimeout(updateParticipants, 100);
              setTimeout(updateParticipants, 500);
            }

            if (data.action === 'MUTE_ALL' && !localIsOwner) {
              await applyLocalControl(callRef.current, 'MUTE_ALL');
              onRemoteMuteRef.current?.();
              setTimeout(updateParticipants, 100);
              setTimeout(updateParticipants, 500);
            }

            if (data.action === 'STOP_CAMERA' && isTargetedAtMe) {
              await applyLocalControl(callRef.current, 'STOP_CAMERA');
              onRemoteStopCameraRef.current?.();
              setTimeout(updateParticipants, 100);
              setTimeout(updateParticipants, 500);
            }

            if (data.action === 'STOP_SCREEN_SHARE' && isTargetedAtMe) {
              await applyLocalControl(callRef.current, 'STOP_SCREEN_SHARE');
              setScreenTrack(null);
              setIsLocalSharing(false);
              onScreenShareChangeRef.current?.(false);
              setTimeout(updateParticipants, 100);
              setTimeout(updateParticipants, 500);
            }

            if ((data.action === 'KICK' || data.action === 'BAN') && isTargetedAtMe) {
              roomEndedRef.current = true;
              await callRef.current?.leave().catch(() => {});
              await callRef.current?.destroy().catch(() => {});
              callRef.current = null;
              setJoinState('idle');
              onHostEndedRef.current?.();
            }
          } catch (err) {
            console.error('[foundry] control message failed:', err);
          }
        });

        call.on('left-meeting', () => { if (!destroyed) setJoinState('idle'); });

        // On mobile, forcing camera on immediately causes permission denial and black tiles.
        // Always start with camera off — user toggles it on themselves.

        const cameraOn =
  sessionStorage.getItem('foundry_camera_on') !== '0';

const micOn =
  sessionStorage.getItem('foundry_mic_on') === '1';

await call.join({
  url: roomUrl,
  token,
  startVideoOff: !cameraOn,
  startAudioOff: !micOn,
});

const selectedBackground =
  sessionStorage.getItem('foundry_background') || initialBackground || 'none';

if (selectedBackground) {
  try {
    await applyFoundryBackground(callRef.current, selectedBackground);
  } catch {}
}

      } catch (err) {
        if (!destroyed) {
          setJoinState('error');
          setErrorMsg(err.message || 'Could not join Foundry');
        }
      }
    }

    join();

    return () => {
      destroyed = true;
      if (call) { call.leave().catch(() => {}); call.destroy().catch(() => {}); }
      callRef.current = null;
    };
  }, [roomId, guestToken, guestRoomUrl]);

  useEffect(() => {
    if (!callRef.current || joinState !== 'joined') return;
    callRef.current.setLocalAudio(!micMuted);
  }, [micMuted, joinState]);

  useEffect(() => {
    if (!callRef.current || joinState !== 'joined') return;
    callRef.current.setLocalVideo(!camOff);
  }, [camOff, joinState]);

  useEffect(() => {
    if (!callRef.current || joinState !== 'joined') return;
    applyFoundryBackground(callRef.current, initialBackground).catch((err) => {
      console.error('[foundry] background update failed:', err);
    });
  }, [initialBackground, joinState]);

  useEffect(() => {
    onParticipantsChangeRef.current?.(Object.values(participants));
  }, [participants]);

  const handleStopShare = useCallback(async () => {
    if (!callRef.current) return;
    try { await callRef.current.stopScreenShare(); } catch {}
    setScreenTrack(null);
    setIsLocalSharing(false);
    onScreenShareChangeRef.current?.(false);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleMobileDeviceSettings = async (event) => {
      if (!callRef.current) return;

      const detail = event?.detail || {};
      const cameraId = detail.cameraId || '';
      const micId = detail.micId || '';
      const speakerId = detail.speakerId || '';
      const background = detail.background || 'none';

      try {
        if (callRef.current.setInputDevicesAsync) {
          await callRef.current.setInputDevicesAsync({
            audioDeviceId: micId || undefined,
            videoDeviceId: cameraId || undefined,
          });
        } else if (callRef.current.setInputDevices) {
          await callRef.current.setInputDevices({
            audioDeviceId: micId || undefined,
            videoDeviceId: cameraId || undefined,
          });
        }

        if (speakerId && speakerId !== 'default') {
          const outputDevices = await navigator.mediaDevices.enumerateDevices();
          const validOutputDevice = outputDevices.some(
            (device) => device.kind === 'audiooutput' && device.deviceId === speakerId
          );

          if (validOutputDevice && callRef.current.setOutputDeviceAsync) {
            await callRef.current.setOutputDeviceAsync(speakerId);
          } else if (validOutputDevice && callRef.current.setOutputDevice) {
            await callRef.current.setOutputDevice(speakerId);
          }
        }

        await applyFoundryBackground(callRef.current, background);
      } catch (err) {
        console.error('[foundry] mobile settings apply failed:', err);
      }
    };

    window.addEventListener('foundry-mobile-device-settings', handleMobileDeviceSettings);
    return () => window.removeEventListener('foundry-mobile-device-settings', handleMobileDeviceSettings);
  }, []);

  const participantList = Object.values(participants);
  const local = participantList.find(p => p.local);
  const remote = participantList.filter(p => !p.local);
  const mainParticipant = remote[0] || local;
  const pipParticipants = remote[0] ? [local, ...remote.slice(1)].filter(Boolean) : [];

  const showLocalScreen = isLocalSharing && screenTrack;
  const showRemoteScreen = !isLocalSharing && remoteScreenTrack;
  const showScreen = showLocalScreen || showRemoteScreen;

  // ── Resolve effective view ──────────────────────────────────────────────────
  // Screen share always forces presentation-style regardless of activeView
  const effectiveView = showScreen ? 'presentation' : activeView;

  // ── State/error tiles ────────────────────────────────────────────────────────
  const stateTile = (
    <>
      {(joinState === 'idle' || joinState === 'fetching') && (
        <div style={{ ...S.mainTile, flex: 1 }}>
          <div style={S.stateMsg}><span>Connecting…</span></div>
        </div>
      )}
      {joinState === 'joining' && (
        <div style={{ ...S.mainTile, flex: 1 }}>
          <div style={S.stateMsg}><span>Joining Foundry…</span></div>
        </div>
      )}
      {joinState === 'error' && (
        <div style={{ ...S.mainTile, flex: 1 }}>
          <div style={S.errorMsg}>{errorMsg}</div>
        </div>
      )}
    </>
  );

  const waitingTile = (
    <div style={{ ...S.mainTile, flex: 1 }}>
      <div style={S.stateMsg}>
        <span style={{ fontSize: 22 }}>🔨</span>
        <span>Waiting for others to join…</span>
      </div>
    </div>
  );

  // ── GRID VIEW — everyone equal size in a responsive grid ─────────────────
  if (effectiveView === 'grid' && joinState === 'joined') {
    const allParticipants = [local, ...remote].filter(Boolean);
    const count = allParticipants.length;
    const cols = count <= 1 ? 1 : count <= 4 ? 2 : count <= 9 ? 3 : 4;
    return (
      <div style={{ ...S.area, overflowY: 'auto' }}>
        {allParticipants.length === 0 ? waitingTile : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: 8, flex: 1, minHeight: 0,
          }}>
            {allParticipants.map(p => (
              <div key={p.session_id} style={{ position: 'relative', aspectRatio: '16/9', borderRadius: 10, overflow: 'hidden', background: '#070910', border: '1px solid rgba(255,255,255,0.06)' }}>
                <VideoTile participant={p} isMain />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── FOCUS VIEW — active speaker fills everything, no pip strip ───────────
  if (effectiveView === 'focus' && joinState === 'joined') {
    return (
      <div style={{ ...S.area, overflowY: 'auto' }}>
        <div style={{ flex: 1, position: 'relative', display: 'flex', minHeight: 0 }}>
          {mainParticipant ? <VideoTile participant={mainParticipant} isMain /> : waitingTile}
        </div>
        {/* Self-view pip in focus mode */}
        {local && mainParticipant?.session_id !== local?.session_id && (
          <div style={{
            position: 'absolute', bottom: 16, right: 16,
            width: 140, aspectRatio: '16/9',
            zIndex: 5, borderRadius: 8, overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
          }}>
            <VideoTile participant={local} />
          </div>
        )}
      </div>
    );
  }

  // ── PRESENTATION VIEW — screen share fills center, participants on right ──
  if (effectiveView === 'presentation' && joinState === 'joined') {
    const screenContent = showScreen ? (
      <ScreenShareTile
        track={showLocalScreen ? screenTrack : remoteScreenTrack}
        sharerName={showLocalScreen ? 'You' : remoteScreenSharer}
        isLocal={!!showLocalScreen}
        onStopShare={handleStopShare}
      />
    ) : (mainParticipant ? <VideoTile participant={mainParticipant} isMain /> : waitingTile);

    const sideParticipants = showScreen
      ? participantList.filter(Boolean)
      : pipParticipants;

    return (
      <div style={{ ...S.area, flexDirection: 'row', overflow: 'hidden' }}>
        {/* Main content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {screenContent}
        </div>
        {/* Participant strip on right */}
        {sideParticipants.length > 0 && (
          <div style={{
            width: 160, display: 'flex', flexDirection: 'column',
            gap: 6, overflowY: 'auto', flexShrink: 0, padding: '0 0 0 8px',
          }}>
            {sideParticipants.map(p => (
              <div key={p.session_id} style={{ aspectRatio: '16/9', borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                <VideoTile participant={p} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── SPEAKER VIEW (default) — active speaker large, others in pip strip ───
  return (
    <div style={{ ...S.area, overflowY: 'auto' }}>
      {stateTile}
      <div style={{ flex: 1, position: 'relative', display: 'flex', minHeight: 0 }}>
        {joinState === 'joined' && showScreen && (
          <ScreenShareTile
            track={showLocalScreen ? screenTrack : remoteScreenTrack}
            sharerName={showLocalScreen ? 'You' : remoteScreenSharer}
            isLocal={!!showLocalScreen}
            onStopShare={handleStopShare}
          />
        )}
        {joinState === 'joined' && !showScreen && mainParticipant && (
          <VideoTile participant={mainParticipant} isMain />
        )}
        {joinState === 'joined' && !showScreen && !mainParticipant && waitingTile}
      </div>

      {!compact && joinState === 'joined' && (
        <div style={S.pipRow}>
          {showScreen && mainParticipant && (
            <VideoTile key={mainParticipant.session_id} participant={mainParticipant} />
          )}
          {!showScreen && pipParticipants.map(p => (
            <VideoTile key={p.session_id} participant={p} />
          ))}
          {!guestToken && (
            <div
              style={{ ...S.pip, ...S.pipAdd }}
              onClick={onInvite}
              tabIndex={0}
              role="button"
              aria-label="Invite participant"
            >
              <span style={{ fontSize: 16 }}>+</span>
              <span>Invite</span>
            </div>
          )}
        </div>
      )}

      {/* Self-view overlay for compact/mobile mode */}
      {compact && joinState === 'joined' && local && mainParticipant?.session_id !== local?.session_id && (
        <div style={{
          position: 'absolute', bottom: 80, right: 10,
          width: 90, aspectRatio: '9/16',
          zIndex: 5, borderRadius: 8, overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.2)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
        }}>
          <VideoTile participant={local} />
        </div>
      )}
    </div>
  );
}