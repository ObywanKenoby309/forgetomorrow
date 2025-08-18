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
        background: 'white',
        border: '1px solid #eee',
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
      }}
    >
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        {data.map((m) => (
          <div
            key={m.id}
            style={{
              border: '1px solid #eee',
              borderRadius: 10,
              padding: 12,
              background: '#FAFAFA',
              display: 'grid',
              gap: 6,
            }}
          >
            <div style={{ fontWeight: 800, color: '#263238' }}>{m.name}</div>
            <div style={{ color: '#607D8B', fontSize: 13 }}>{m.title}</div>
            <div style={{ fontSize: 13 }}>
              <span style={{ color: '#FF7043', fontWeight: 700 }}>Focus:</span> {m.focus}
            </div>
            <div style={{ fontSize: 12, color: '#455A64' }}>Spots available: {m.spots}</div>
            <div style={{ marginTop: 6 }}>
              <button
                type="button"
                onClick={() => alert('Request sent (demo)')}
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
                Request Mentorship
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
