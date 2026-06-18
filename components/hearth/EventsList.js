export default function EventsList({ events = [] }) {
  const data = events.length
    ? events
    : [
        { id: 1, name: 'Resume Clinic (Live)', date: 'Aug 28, 1:00 PM', tz: 'ET', seats: 50 },
        { id: 2, name: 'Interview Masterclass', date: 'Sep 3, 5:30 PM', tz: 'ET', seats: 100 },
        { id: 3, name: 'Networking for Introverts', date: 'Sep 10, 12:00 PM', tz: 'ET', seats: 80 },
      ];

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.92)',
        border: '1px solid rgba(15,23,42,0.08)',
        borderRadius: 16,
        padding: 12,
        boxShadow: '0 6px 18px rgba(15,23,42,0.10)',
        display: 'grid',
        gap: 10,
        boxSizing: 'border-box',
      }}
    >
      {data.map((e) => (
        <div
          key={e.id}
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0,1fr)',
            alignItems: 'start',
            gap: 10,
            border: '1px solid rgba(15,23,42,0.08)',
            borderRadius: 14,
            padding: 12,
            background: 'rgba(248,250,252,0.92)',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 900, color: '#263238', lineHeight: 1.25 }}>{e.name}</div>
            <div style={{ color: '#607D8B', fontSize: 13, marginTop: 4 }}>
              {e.date} {e.tz} • Seats: {e.seats}
            </div>
          </div>
          <button
            type="button"
            onClick={() => alert('Registered (demo)')}
            style={{
              background: '#FF7043',
              color: 'white',
              padding: '9px 12px',
              borderRadius: 999,
              border: '1px solid rgba(0,0,0,0.06)',
              fontWeight: 900,
              cursor: 'pointer',
              justifySelf: 'start',
            }}
          >
            Register
          </button>
        </div>
      ))}
    </div>
  );
}
