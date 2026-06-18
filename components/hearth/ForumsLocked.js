export default function ForumsLocked() {
  const rows = [
    { title: 'How do I transition into project management?', tag: 'Career Pivots', replies: 12, age: '2h' },
    { title: 'What makes a recruiter respond?', tag: 'Networking', replies: 8, age: '5h' },
    { title: 'Resume feedback for operations leaders', tag: 'Resume Help', replies: 19, age: '1d' },
  ];

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.92)',
        border: '1px solid rgba(15,23,42,0.08)',
        borderRadius: 16,
        boxShadow: '0 6px 18px rgba(15,23,42,0.10)',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: 14, borderBottom: '1px solid rgba(15,23,42,0.08)' }}>
        <div style={{ fontSize: 18, fontWeight: 900, color: '#FF7043' }}>
          Discussion Forums
        </div>
        <p style={{ color: '#607D8B', margin: '6px 0 0', fontSize: 13, lineHeight: 1.5 }}>
          Coming soon: topic-based Q&A, peer help, and moderated professional discussion.
        </p>
      </div>
      {rows.map((row, index) => (
        <div
          key={row.title}
          style={{
            padding: '12px 14px',
            borderBottom: index < rows.length - 1 ? '1px solid rgba(15,23,42,0.08)' : 'none',
            background: 'rgba(255,255,255,0.72)',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 900, color: '#FF7043', marginBottom: 5 }}>{row.tag}</div>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#263238', lineHeight: 1.3 }}>{row.title}</div>
          <div style={{ marginTop: 5, fontSize: 12, color: '#607D8B', fontWeight: 700 }}>
            {row.replies} replies • {row.age}
          </div>
        </div>
      ))}
    </div>
  );
}
