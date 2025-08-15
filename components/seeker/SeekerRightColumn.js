// components/seeker/SeekerRightColumn.js
import Link from 'next/link';

export default function SeekerRightColumn({ variant = 'default' }) {
  const groups = {
    default: [
      { label: 'Pinned Jobs', href: '/pinned-jobs' },
      { label: 'Applications', href: '/applications' },
      { label: 'Open Creator', href: '/resume-cover' },
    ],
    jobs: [
      { label: 'Applications', href: '/applications' },
      { label: 'Pinned Jobs', href: '/pinned-jobs' },
      { label: 'Your Roadmap', href: '/roadmap' },
    ],
    applications: [
      { label: 'Pinned Jobs', href: '/pinned-jobs' },
      { label: 'Open Creator', href: '/resume-cover' },
      { label: 'Your Roadmap', href: '/roadmap' },
    ],
    pinned: [
      { label: 'Applications', href: '/applications' },
      { label: 'Jobs', href: '/jobs' },
      { label: 'Open Creator', href: '/resume-cover' },
    ],
    creator: [
      { label: 'Applications', href: '/applications' },
      { label: 'Pinned Jobs', href: '/pinned-jobs' },
      { label: 'Jobs', href: '/jobs' },
    ],
    hearth: [
      { label: 'Jobs', href: '/jobs' },
      { label: 'Applications', href: '/applications' },
      { label: 'Your Roadmap', href: '/roadmap' },
    ],
  };

  const items = groups[variant] || groups.default;

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div style={{ color: 'white', fontWeight: 700, marginBottom: 4 }}>Shortcuts</div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
        {items.map((it) => (
          <li key={it.href}>
            <Link href={it.href} style={{ color: '#FF7043', fontWeight: 600 }}>
              {it.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
