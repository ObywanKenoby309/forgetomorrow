const fs = require('fs');

const file = 'components/foundry/FoundryVideoGrid.js';
let s = fs.readFileSync(file, 'utf8');

if (!s.includes('onHostEnded = null')) {
  s = s.replace(
`  onScreenShareChange,
  onRoomEmpty,
  guestToken = null,
  guestRoomUrl = null,
}) {`,
`  onScreenShareChange,
  onRoomEmpty,
  onHostEnded = null,
  onScheduledEnd = null,
  guestToken = null,
  guestRoomUrl = null,
}) {`
  );
}

if (!s.includes('data.scheduledEndAt')) {
  s = s.replace(
`          token = data.token;
          roomUrl = data.roomUrl;
        }`,
`          token = data.token;
          roomUrl = data.roomUrl;
          if (data.scheduledEndAt) {
            onScheduledEnd?.(data.scheduledEndAt, !!data.isOwner);
          }
        }`
  );
}

if (!s.includes("data?.type !== 'FOUNDRY_CONTROL'")) {
  s = s.replace(
`        call.on('error', (e) => {
          if (!destroyed) {
            setJoinState('error');
            setErrorMsg(e?.errorMsg || 'Connection error');
          }
        });

        call.on('left-meeting', () => { if (!destroyed) setJoinState('idle'); });`,
`        call.on('error', (e) => {
          if (!destroyed) {
            setJoinState('error');
            setErrorMsg(e?.errorMsg || 'Connection error');
          }
        });

        call.on('meeting-ended', () => {
          if (!destroyed) {
            setJoinState('idle');
            onHostEnded?.();
          }
        });

        call.on('app-message', async ({ data }) => {
          if (destroyed || data?.type !== 'FOUNDRY_CONTROL') return;

          const localParticipant = callRef.current?.participants()?.local;
          const localIsOwner = !!localParticipant?.owner;

          try {
            if (data.action === 'MUTE') {
              await callRef.current?.setLocalAudio(false);
            }

            if (data.action === 'MUTE_ALL' && !localIsOwner) {
              await callRef.current?.setLocalAudio(false);
            }

            if (data.action === 'STOP_SCREEN_SHARE') {
              await callRef.current?.stopScreenShare?.();
              setScreenTrack(null);
              setIsLocalSharing(false);
              onScreenShareChange?.(false);
            }

            if (data.action === 'KICK' || data.action === 'BAN') {
              roomEndedRef.current = true;
              await callRef.current?.leave().catch(() => {});
              await callRef.current?.destroy().catch(() => {});
              callRef.current = null;
              setJoinState('idle');
              onHostEnded?.();
            }
          } catch (err) {
            console.error('[foundry] control message failed:', err);
          }
        });

        call.on('left-meeting', () => { if (!destroyed) setJoinState('idle'); });`
  );
}

s = s.replace(
`  }, [roomId, guestToken, guestRoomUrl, updateParticipants, checkRoomEmpty, syncScreenShareState, onCallReady, onScreenShareChange]);`,
`  }, [roomId, guestToken, guestRoomUrl, updateParticipants, checkRoomEmpty, syncScreenShareState, onCallReady, onScreenShareChange, onHostEnded, onScheduledEnd]);`
);

fs.writeFileSync(file, s);
console.log('Patched FoundryVideoGrid.js without replacing layout/styling.');