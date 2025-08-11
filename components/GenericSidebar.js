// components/GenericSidebar.js
import Link from 'next/link';
import { useState } from 'react';

export default function GenericSidebar({ top = 80 }) {
  // Keeping state in case we re-enable mobile later; sidebar is shown on desktop.
  const [isOpen] = useState(true);

  // Match SeekerSidebar structure/labels/routes
  const menu = [
    { title: 'Seeker Dashboard', href: '/seeker-dashboard' },
    { title: 'Your Roadmap', href: '/roadmap' },
    { title: 'Open Creator', href: '/resume-cover' },
    { title: 'To The Pipeline', href: '/jobs' },       // Seeker sidebar points Pipeline -> /jobs
    { title: 'Visit Your Hearth', href: '/the-hearth' }
  ];

  return (
    <aside
      className={`bg-white border border-gray-200 rounded-xl shadow-lg p-6 w-64 fixed left-0 z-40 transform ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 transition-transform duration-200 ease-in-out`}
      style={{ top }}
      aria-label="Navigation sidebar"
    >
      <div className="text-2xl font-bold text-[#FF7043] mb-6">ForgeTomorrow</div>

      <nav className="flex flex-col gap-8">
        {menu.map((item) => (
          <div key={item.title}>
            <h3 className="text-[#FF7043] mb-3 font-semibold text-lg">{item.title}</h3>
            <Link href={item.href} legacyBehavior>
              <a
                className="block bg-[#FF7043] hover:bg-[#F4511E] text-white px-5 py-3 rounded font-bold w-full transition-colors text-center"
                aria-label={item.title}
              >
                {item.title}
              </a>
            </Link>
          </div>
        ))}
      </nav>
    </aside>
  );
}
