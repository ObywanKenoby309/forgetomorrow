// components/foundry/GuestConversionBanner.js
// Shown to external guests when a Foundry session ends.
// Prompts them to create a free ForgeTomorrow account.

const ORANGE = '#FF7043';

const S = {
  card: {
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14, padding: '40px 36px', maxWidth: 440, width: '100%',
    fontFamily: "'DM Sans', sans-serif", textAlign: 'center',
  },
  icon: { fontSize: 40, marginBottom: 16, display: 'block' },
  heading: { fontSize: 20, fontWeight: 700, color: '#f0f0f0', marginBottom: 8 },
  sub: { fontSize: 13, color: '#666', marginBottom: 28, lineHeight: 1.7 },
  benefits: {
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 10, padding: '16px 20px', marginBottom: 24, textAlign: 'left',
  },
  benefit: {
    display: 'flex', alignItems: 'flex-start', gap: 10,
    marginBottom: 10, fontSize: 12, color: '#aaa', lineHeight: 1.5,
  },
  benefitIcon: { color: ORANGE, flexShrink: 0, marginTop: 1 },
  primaryBtn: {
    display: 'block', width: '100%', background: ORANGE, border: 'none', color: '#fff',
    borderRadius: 8, padding: '12px 14px', fontSize: 14, fontWeight: 700,
    cursor: 'pointer', textDecoration: 'none', marginBottom: 10,
    fontFamily: "'DM Sans', sans-serif", transition: 'background 0.15s',
    boxSizing: 'border-box',
  },
  secondaryBtn: {
    display: 'block', width: '100%', background: 'none',
    border: '1px solid rgba(255,255,255,0.1)', color: '#666',
    borderRadius: 8, padding: '11px 14px', fontSize: 13, fontWeight: 500,
    cursor: 'pointer', textDecoration: 'none', fontFamily: "'DM Sans', sans-serif",
    boxSizing: 'border-box',
  },
};

const BENEFITS = [
  { icon: '📋', text: 'Keep your resume and documents in one place' },
  { icon: '📅', text: 'Track interviews, meetings, and coaching sessions' },
  { icon: '💬', text: 'Continue conversations via Signal messaging' },
  { icon: '🎯', text: 'Get matched with jobs and coaches — free forever' },
];

export default function GuestConversionBanner({ guestName }) {
  const firstName = guestName?.split(' ')[0] || 'there';

  return (
    <div style={S.card}>
      <span style={S.icon}>🔨</span>
      <h1 style={S.heading}>Your Foundry session has ended</h1>
      <p style={S.sub}>
        {`Nice to meet you, ${firstName}. Everything you need for your professional journey is right here on ForgeTomorrow — and it's free to get started.`}
      </p>

      <div style={S.benefits}>
        {BENEFITS.map((b, i) => (
          <div key={i} style={{ ...S.benefit, marginBottom: i < BENEFITS.length - 1 ? 10 : 0 }}>
            <span style={S.benefitIcon}>{b.icon}</span>
            <span>{b.text}</span>
          </div>
        ))}
      </div>

      <a href="/signup" style={S.primaryBtn}>
        Create your free account
      </a>
      <a href="/" style={S.secondaryBtn}>
        Maybe later
      </a>
    </div>
  );
}
