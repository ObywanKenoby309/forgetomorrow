import Link from 'next/link';

export default function PublicSidebar() {
  const items = [
    { header: 'Explore', label: 'The Hearth', href: '/the-hearth' },
    { header: 'Guides', label: 'Getting Started', href: '/about' },
    { header: 'Support', label: 'Help Center', href: '/support' },
    { header: 'Account', label: 'Log in / Sign up', href: '/login' },
  ];

  return (
    <div
      style={{
        background: '#fff',
        padding: 20,
        borderRadius: 12,
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {items.map((it) => (
        <div key={it.href}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 500,
              marginBottom: 6,
              color: '#FF7043',
            }}
          >
            {it.header}
          </div>
          <Link
            href={it.href}
            style={{
              display: 'block',
              background: 'linear-gradient(135deg, #FF6F43, #FF8E53)',
              padding: '10px 14px',
              borderRadius: 30,
              fontWeight: 'bold',
              color: '#fff',
              textAlign: 'center',
              textDecoration: 'none',
              boxShadow: '0 3px 6px rgba(255,112,67,0.4)',
              transition: 'all 0.25s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(255,112,67,0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 3px 6px rgba(255,112,67,0.4)';
            }}
          >
            {it.label}
          </Link>
        </div>
      ))}
    </div>
  );
}
