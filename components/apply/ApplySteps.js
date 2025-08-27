// components/apply/ApplySteps.js
export default function ApplySteps({ current = 1 }) {
  const steps = ['Resume', 'Cover letter', 'Export / Apply'];
  return (
    <nav style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${steps.length}, 1fr)`,
      gap: 8,
      marginBottom: 12,
    }}>
      {steps.map((label, i) => {
        const n = i + 1;
        const active = n === current;
        return (
          <div key={label}
            style={{
              background: active ? '#FF7043' : 'white',
              color: active ? 'white' : '#37474F',
              border: `1px solid ${active ? 'rgba(0,0,0,0.06)' : '#E0E0E0'}`,
              borderRadius: 10,
              padding: '8px 10px',
              textAlign: 'center',
              fontWeight: 800,
            }}
          >
            {n}. {label}
          </div>
        );
      })}
    </nav>
  );
}
