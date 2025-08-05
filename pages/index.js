export default function TestBackground() {
  return (
    <div
      style={{
        backgroundImage: "url('/images/forge-bg-bw.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        height: '100vh',
        width: '100%',
      }}
    >
      <h1 style={{ color: 'white', textAlign: 'center', paddingTop: '40vh' }}>
        Background Test
      </h1>
    </div>
  );
}
