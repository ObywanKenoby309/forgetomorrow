import Link from 'next/link';
import { useRouter } from 'next/router';

const GLASS = {
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.58)',
  boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};

export default function Subnav() {
  const { pathname } = useRouter();
  const tabs = [
    { href: '/seeker/the-hearth/mentorship', label: 'Mentorship' },
    { href: '/seeker/the-hearth/events',     label: 'Events' },
    { href: '/seeker/the-hearth/forums',     label: 'Forums' },
    { href: '/seeker/the-hearth/resources',  label: 'Resources' },
  ];

  const isActive = (href) => pathname === href;

  return (
    <div
      style={{
        ...GLASS,
        padding: 8,
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
      }}
    >
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          style={{
            padding: '8px 12px',
            borderRadius: 999,
            fontWeight: 700,
            textDecoration: 'none',
            border: '1px solid rgba(0,0,0,0.08)',
            color: isActive(t.href) ? 'white' : '#37474F',
            background: isActive(t.href)
              ? 'linear-gradient(135deg, #FF6F43, #FF8E53)'
              : 'white',
            boxShadow: isActive(t.href)
              ? 'inset 0 0 0 2px rgba(255,255,255,0.6)'
              : '0 2px 4px rgba(0,0,0,0.05)',
          }}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}