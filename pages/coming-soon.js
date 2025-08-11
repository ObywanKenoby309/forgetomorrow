export default function ComingSoon() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: '#000',
      color: '#fff',
      fontFamily: 'sans-serif',
      textAlign: 'center',
      padding: '1rem'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚀 Coming Soon</h1>
      <p style={{ fontSize: '1.25rem', maxWidth: '600px' }}>
        ForgeTomorrow is almost here — we’re building something amazing.
      </p>
    </div>
  );
}
