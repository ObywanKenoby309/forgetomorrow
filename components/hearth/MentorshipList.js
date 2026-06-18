export default function MentorshipList({ items = [] }) {
  const data = items.length
    ? items
    : [
        { id: 1, name: 'Alex T.', title: 'Customer Success Lead', focus: 'CSM career growth', spots: 2 },
        { id: 2, name: 'Priya N.', title: 'Solutions Architect',   focus: 'Tech interviews',   spots: 3 },
        { id: 3, name: 'M. Rivera', title: 'Operations Manager',    focus: 'Ops leadership',    spots: 1 },
      ];

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.92)',
        border: '1px solid rgba(15,23,42,0.08)',
        borderRadius: 16,
        padding: 12,
        boxShadow: '0 6px 18px rgba(15,23,42,0.10)',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        {data.map((m) => (
          <div
            key={m.id}
            style={{
              border: '1px solid rgba(15,23,42,0.08)',
              borderRadius: 14,
              padding: 12,
              background: 'rgba(248,250,252,0.92)',
              display: 'grid',
              gap: 7,
              minWidth: 0,
            }}
          >
            <div style={{ fontWeight: 900, color: '#263238' }}>{m.name}</div>
            <div style={{ color: '#607D8B', fontSize: 13 }}>{m.title}</div>
            <div style={{ fontSize: 13, color: '#37474F', lineHeight: 1.45 }}>
              <span style={{ color: '#FF7043', fontWeight: 900 }}>Focus:</span> {m.focus}
            </div>
            <div style={{ fontSize: 12, color: '#455A64' }}>Spots available: {m.spots}</div>
            <button
              type="button"
              onClick={() => alert('Request sent (demo)')}
              style={{
                marginTop: 4,
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
              Request Mentorship
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
