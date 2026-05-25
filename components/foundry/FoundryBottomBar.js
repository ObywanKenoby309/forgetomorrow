// components/foundry/FoundryBottomBar.js
const ORANGE = '#FF7043';

const S = {
  bar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '8px 14px', background: 'rgba(255,255,255,0.02)',
    borderTop: '1px solid rgba(255,255,255,0.05)', flexShrink: 0,
    fontFamily: "'DM Sans', sans-serif",
  },
  group: { display: 'flex', alignItems: 'center', gap: 2 },
  sep: { width: 1, height: 24, background: 'rgba(255,255,255,0.06)', margin: '0 6px' },
  btn: (active, danger) => ({
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
    background: 'none', border: 'none',
    color: danger ? '#ef5350' : active ? ORANGE : '#888',
    cursor: 'pointer', padding: '4px 8px', borderRadius: 7,
    transition: 'all 0.15s', minWidth: 42, fontFamily: "'DM Sans', sans-serif",
  }),
  btnIcon: { fontSize: 17 },
  btnLabel: { fontSize: 8, whiteSpace: 'nowrap' },
  endBtn: {
    background: '#7f0000', border: 'none', color: '#ffcdd2',
    cursor: 'pointer', padding: '7px 14px', borderRadius: 7,
    fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
    fontFamily: "'DM Sans', sans-serif", transition: 'background 0.15s',
  },
};

export default function FoundryBottomBar({
  micMuted, camOff, isRecording, chatOpen, filesOpen, peopleOpen,
  onMicToggle, onCamToggle, onShareScreen, onChatToggle, onFilesToggle,
  onPeopleToggle, onRecordToggle, onMore, onEnd,
}) {
  return (
    <div style={S.bar}>
      {/* Group 1 — Communication (spacer clears cookie banner) */}
      <div style={S.group}>
        <div style={{ width: 52 }} />
        <button
          style={S.btn(micMuted, micMuted)}
          onClick={onMicToggle}
          aria-pressed={micMuted}
          aria-label={micMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          <span style={S.btnIcon}>{micMuted ? '🔇' : '🎤'}</span>
          <span style={S.btnLabel}>{micMuted ? 'Unmute' : 'Mute'}</span>
        </button>
        <button
          style={S.btn(camOff, camOff)}
          onClick={onCamToggle}
          aria-pressed={camOff}
          aria-label={camOff ? 'Start video' : 'Stop video'}
        >
          <span style={S.btnIcon}>{camOff ? '📵' : '📹'}</span>
          <span style={S.btnLabel}>{camOff ? 'Start Video' : 'Camera'}</span>
        </button>
      </div>

      <div style={S.sep} />

      {/* Group 2 — Collaboration */}
      <div style={S.group}>
        <button style={S.btn(false, false)} onClick={onShareScreen} aria-label="Share screen">
          <span style={S.btnIcon}>📺</span>
          <span style={S.btnLabel}>Share</span>
        </button>
        <button style={S.btn(chatOpen, false)} onClick={onChatToggle} aria-label="Toggle chat">
          <span style={S.btnIcon}>💬</span>
          <span style={S.btnLabel}>Chat</span>
        </button>
        <button style={S.btn(filesOpen, false)} onClick={onFilesToggle} aria-label="Toggle files">
          <span style={S.btnIcon}>📁</span>
          <span style={S.btnLabel}>Files</span>
        </button>
      </div>

      <div style={S.sep} />

      {/* Group 3 — Session */}
      <div style={S.group}>
        <button style={S.btn(peopleOpen, false)} onClick={onPeopleToggle} aria-label="Toggle people">
          <span style={S.btnIcon}>👥</span>
          <span style={S.btnLabel}>People</span>
        </button>
        <button style={S.btn(isRecording, isRecording)} onClick={onRecordToggle} aria-label="Toggle recording" aria-pressed={isRecording}>
          <span style={S.btnIcon}>{isRecording ? '⏹' : '⏺'}</span>
          <span style={S.btnLabel}>Record</span>
        </button>
        <button style={S.btn(false, false)} onClick={onMore} aria-label="More options">
          <span style={S.btnIcon}>•••</span>
          <span style={S.btnLabel}>More</span>
        </button>
      </div>

      <div style={S.sep} />

      {/* Danger */}
      <button style={S.endBtn} onClick={onEnd} aria-label="End Foundry session">
        📵 End Foundry
      </button>
    </div>
  );
}