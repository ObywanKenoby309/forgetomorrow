// components/foundry/FoundryVideoGrid.js
// Handles both authenticated users (fetches token from API)
// and guests (receives token directly as props).
// FT users: renders their profile avatar when camera is off.
// Guests: renders initials circle.
// Auto-ends the Foundry when all participants have left.

import { useState, useEffect, useRef, useCallback } from 'react';
import DailyIframe from '@daily-co/daily-js';

const S = {
  area: { flex: 1, display: 'flex', flexDirection: 'column', padding: 10, gap: 8, minWidth: 0 },
  mainTile: {
    flex: 1, borderRadius: 10, position: 'relative', overflow: 'hidden',
    background: '#070910', border: '1px solid rgba(255,255,255,0.06)',
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
    fontSize: 11, color: '#ddd', display: 'flex', alignItems: 'center', gap: 6, zIndex: 2,
  },
  hostBadge: {
    background: 'rgba(255,112,67,0.2)', color: '#FF7043',
    fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 3,
  },
  guestBadge: {
    background: 'rgba(255,255,255,0.1)', color: '#aaa',
    fontSize: 9, fontWeight: 600, padding: '2px 5px', borderRadius: 3,
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
  pipAvatarImg: {
    width: 32, height: 32, borderRadius: '50%', objectFit: 'cover',
  },
  pipInitialsCircle: {
    width: 32, height: 32, borderRadius: '50%', background: '#5C6BC0',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11, fontWeight: 600, color: '#fff',
  },
  videoEl: {
    width: '100%', height: '100%', objectFit: 'cover',
    position: 'absolute', inset: 0, borderRadius: 10,
  },
  pipRow: { display: 'flex', gap: 7, height: 82, flexShrink: 0 },
  pip: {
    flex: 1, borderRadius: 8, background: '#0a0c10',
    border: '1px solid rgba(255,255,255,0.06)',
    position: 'relative', overflow: 'hidden',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', transition: 'border-color 0.15s',
  },
  pipName: {
    position: 'absolute', bottom: 4, left: 5, fontSize: 9,
    color: 'rgba(255,255,255,0.7)', background: 'rgba(0,0,0,0.45)',
    borderRadius: 3, padding: '1px 5px',
  },
  pipMute: { position: 'absolute', top: 4, right: 4, fontSize: 10, color: '#ef5350' },
  pipOff: {
    position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 2,
    color: 'rgba(255,255,255,0.2)', fontSize: 9,
  },
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

function initials(name) {
  return (name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
}

function VideoTile({ participant, isMain = false }) {
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  const videoTrack = participant?.tracks?.video?.persistentTrack;
  const audioTrack = participant?.tracks?.audio?.persistentTrack;

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
  const videoOff = videoState === 'off' || videoState === 'blocked' || !videoTrack;

  const audioState = participant?.tracks?.audio?.state;
  const micMuted = audioState === 'off' || audioState === 'blocked';

  if (isMain) {
    return (
      <div style={S.mainTile}>
        <div style={S.inner}>
          <div style={S.ambient} />
          <div style={S.floor} />
          <div style={S.frameLine} />

          {/* Video element is ALWAYS rendered and visible — never display:none */}
          <video
            ref={videoRef}
            style={S.videoEl}
            autoPlay
            muted
            playsInline
          />

          {/* Avatar overlays on top when video is off */}
          {videoOff && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#070910',
                zIndex: 1,
              }}
            >
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
      {/* Video always rendered */}
      <video
        ref={videoRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
        autoPlay
        muted
        playsInline
      />

      {/* Avatar overlay when video off */}
      {videoOff && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0a0c10',
            zIndex: 1,
          }}
        >
          {avatarUrl
            ? <img src={avatarUrl} alt={name} style={S.pipAvatarImg} />
            : <div style={S.pipInitialsCircle}>{initials(name)}</div>
          }
        </div>
      )}

      <audio ref={audioRef} autoPlay playsInline style={{ display: 'none' }} />
      <div style={{ ...S.pipName, zIndex: 2 }}>{name.split(' ')[0]}</div>
      {micMuted && <span style={{ ...S.pipMute, zIndex: 2 }}>🔇</span>}
    </div>
  );
}

export default function FoundryVideoGrid({
  roomId, compact = false, onInvite,
  micMuted, camOff,
  onCallReady, onParticipantsChange,
  onRoomEmpty, // called when all participants have left
  guestToken = null,
  guestRoomUrl = null,
}) {
  const callRef = useRef(null);
  const [participants, setParticipants] = useState({});
  const [joinState, setJoinState] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // Track whether we've already fired onRoomEmpty to avoid double-firing
  const roomEndedRef = useRef(false);

  const updateParticipants = useCallback(() => {
    if (!callRef.current) return;
    const current = callRef.current.participants();
    setParticipants({ ...current });
    return current;
  }, []);

  // Check if room is empty (no remote participants, only local or nobody)
  const checkRoomEmpty = useCallback((current) => {
    if (roomEndedRef.current) return;
    const all = Object.values(current || {});
    const remoteCount = all.filter(p => !p.local).length;
    if (remoteCount === 0 && all.length > 0) {
      // Only local participant remains — room is effectively empty
      // Give it a 3-second grace period in case someone is reconnecting
      setTimeout(() => {
        if (!callRef.current || roomEndedRef.current) return;
        const fresh = callRef.current.participants();
        const stillEmpty = Object.values(fresh).filter(p => !p.local).length === 0;
        if (stillEmpty) {
          roomEndedRef.current = true;
          onRoomEmpty?.();
        }
      }, 3000);
    }
  }, [onRoomEmpty]);

  useEffect(() => {
    if (!roomId) return;

    let call;
    let destroyed = false;

    async function join() {
      try {
        setJoinState('fetching');

        let token, roomUrl;

        if (guestToken && guestRoomUrl) {
          token = guestToken;
          roomUrl = guestRoomUrl;
        } else {
          const res = await fetch(`/api/foundry/room/${roomId}/token`);
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Could not get meeting token');
          token = data.token;
          roomUrl = data.roomUrl;
        }

        if (destroyed) return;
        setJoinState('joining');

        call = DailyIframe.createCallObject({
          audioSource: true,
          videoSource: true,
          dailyConfig: { experimentalChromeVideoMuteLightOff: true },
        });

        callRef.current = call;

        const refresh = () => {
          if (destroyed) return;
          const current = updateParticipants();
          return current;
        };

        call.on('participant-joined', refresh);
        call.on('participant-updated', refresh);

        // On participant-left: update state AND check if room is now empty
        call.on('participant-left', () => {
          if (destroyed) return;
          const current = callRef.current?.participants() || {};
          setParticipants({ ...current });
          checkRoomEmpty(current);
        });

        call.on('joined-meeting', () => {
          if (!destroyed) {
            setJoinState('joined');
            updateParticipants();
            onCallReady?.(call);
          }
        });

        call.on('error', (e) => {
          if (!destroyed) {
            setJoinState('error');
            setErrorMsg(e?.errorMsg || 'Connection error');
          }
        });

        call.on('left-meeting', () => {
          if (!destroyed) setJoinState('idle');
        });

        await call.join({ url: roomUrl, token, startVideoOff: false, startAudioOff: true });

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
    onParticipantsChange?.(Object.values(participants));
  }, [participants]);

  const participantList = Object.values(participants);
  const local = participantList.find(p => p.local);
  const remote = participantList.filter(p => !p.local);
  const mainParticipant = remote[0] || local;
  const pipParticipants = remote[0] ? [local, ...remote.slice(1)].filter(Boolean) : [];

  return (
    <div style={S.area}>
      <div style={{ ...S.mainTile, position: 'relative' }}>
        {(joinState === 'idle' || joinState === 'fetching') && (
          <div style={S.stateMsg}><span>Connecting…</span></div>
        )}
        {joinState === 'joining' && (
          <div style={S.stateMsg}><span>Joining Foundry…</span></div>
        )}
        {joinState === 'error' && (
          <div style={S.errorMsg}>{errorMsg}</div>
        )}
        {joinState === 'joined' && mainParticipant && (
          <VideoTile participant={mainParticipant} isMain />
        )}
        {joinState === 'joined' && !mainParticipant && (
          <div style={S.stateMsg}>
            <span style={{ fontSize: 22 }}>🔨</span>
            <span>Waiting for others to join…</span>
          </div>
        )}
      </div>

      {!compact && joinState === 'joined' && (
        <div style={S.pipRow}>
          {pipParticipants.map(p => (
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
    </div>
  );
}