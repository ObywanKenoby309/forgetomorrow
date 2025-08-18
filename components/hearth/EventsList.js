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
        background: 'white',
        border: '1px solid #eee',
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        display: 'grid',
        gap: 10,
      }}
    >
      {data.map((e) => (
        <div
          key={e.id}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            alignItems: 'center',
            gap: 8,
            border: '1px solid #eee',
            borderRadius: 10,
            padding: 12,
            background: '#FAFAFA',
          }}
        >
          <div>
            <div style={{ fontWeight: 800, color: '#263238' }}>{e.name}</div>
            <div style={{ color: '#607D8B', fontSize: 13 }}>
              {e.date} {e.tz} • Seats: {e.seats}
            </div>
          </div>
          <button
            type="button"
            onClick={() => alert('Registered (demo)')}
            style={{
              background: '#FF7043',
              color: 'white',
              padding: '8px 12px',
              borderRadius: 10,
              border: '1px solid rgba(0,0,0,0.06)',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Register
          </button>
        </div>
      ))}
    </div>
  );
}
