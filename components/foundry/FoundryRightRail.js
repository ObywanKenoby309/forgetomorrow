// components/foundry/FoundryRightRail.js

const ORANGE = '#FF7043';
const GREEN = '#16A34A';
const SLATE = '#334155';

const S = {
  card: {
    background: 'rgba(255,255,255,0.58)',
    border: '1px solid rgba(255,255,255,0.22)',
    borderRadius: 18,
    padding: 16,
    width: '100%',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    boxShadow: '0 14px 36px rgba(0,0,0,0.12)',
    boxSizing: 'border-box',
  },
  label: {
    fontSize: 11,
    color: SLATE,
    fontWeight: 800,
    letterSpacing: '0.01em',
    marginBottom: 10,
    display: 'block',
  },
  empty: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 1.5,
    fontWeight: 600,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '9px 0',
    borderBottom: '1px solid rgba(0,0,0,0.06)',
  },
  dot: (status) => ({
    width: 7,
    height: 7,
    borderRadius: '50%',
    flexShrink: 0,
    background: status === 'ACTIVE' ? GREEN : status === 'SCHEDULED' ? ORANGE : '#CBD5E1',
  }),
  name: {
    flex: 1,
    fontSize: 12,
    color: SLATE,
    fontWeight: 700,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  meta: {
    fontSize: 10,
    color: '#64748B',
    whiteSpace: 'nowrap',
    fontWeight: 700,
  },
  btn: {
    background: 'rgba(255,112,67,0.09)',
    border: '1px solid rgba(255,112,67,0.25)',
    color: ORANGE,
    fontSize: 10,
    fontWeight: 800,
    padding: '3px 8px',
    borderRadius: 5,
    cursor: 'pointer',
    fontFamily: 'inherit',
    flexShrink: 0,
  },
};

function formatFoundryTime(value) {
  if (!value) return 'Time not set';

  try {
    return new Date(value).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return 'Time not set';
  }
}

function recentMetaLabel(room) {
  if (room.status === 'ACTIVE') return 'Live now';
  if (room.status === 'SCHEDULED' && room.scheduledAt) return formatFoundryTime(room.scheduledAt);
  return 'Ended';
}

export default function FoundryRightRail({ recentRooms = [], canHost = false, onOpenRoom }) {
  if (!canHost) return null;

  return (
    <div style={S.card}>
      <span style={S.label}>Recent Foundries</span>

      {recentRooms.length === 0 ? (
        <div style={S.empty}>Recently created Foundries will appear here.</div>
      ) : (
        recentRooms.map((room) => (
          <div key={room.roomId} style={S.row}>
            <div style={S.dot(room.status)} />
            <span style={S.name}>{room.title}</span>
            <span style={S.meta}>{recentMetaLabel(room)}</span>

            {room.status !== 'ENDED' && (
              <button style={S.btn} onClick={() => onOpenRoom?.(room.roomId)}>
                {room.status === 'ACTIVE' ? 'Rejoin' : 'Open'}
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}
