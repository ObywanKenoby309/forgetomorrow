import Link from 'next/link';
import { useRouter } from 'next/router';

const GLASS = {
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.72)',
  boxShadow: '0 8px 20px rgba(15,23,42,0.10)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  boxSizing: 'border-box',
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
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        maxWidth: '100%',
      }}
    >
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          style={{
            flexShrink: 0,
            padding: '8px 12px',
            borderRadius: 999,
            fontWeight: 800,
            fontSize: 13,
            textDecoration: 'none',
            border: '1px solid rgba(0,0,0,0.08)',
            color: isActive(t.href) ? 'white' : '#37474F',
            background: isActive(t.href)
              ? 'linear-gradient(135deg, #FF6F43, #FF8E53)'
              : 'rgba(255,255,255,0.86)',
            boxShadow: isActive(t.href)
              ? '0 5px 14px rgba(255,112,67,0.22)'
              : 'none',
          }}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
