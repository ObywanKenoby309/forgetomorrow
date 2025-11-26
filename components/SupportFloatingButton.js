// components/SupportFloatingButton.js
import { useRouter } from 'next/router';

export default function SupportFloatingButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push('/support')}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        backgroundColor: '#ff5722', // bright orange
        color: '#ffffff',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '30px',
        fontWeight: 'bold',
        boxShadow: '0 6px 18px rgba(0,0,0,0.5)',
        zIndex: 99999,
        cursor: 'pointer',
      }}
      aria-label="Support"
    >
      ?
    </button>
  );
}
