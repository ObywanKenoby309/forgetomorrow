// components/GenericSidebar.js
import Link from 'next/link';
import { useState } from 'react';

export default function GenericSidebar({ top = 80 }) {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Profile', href: '/profile' },
    { name: 'Pipeline', href: '/pipeline' },
    { name: 'Resume Tracker', href: '/resume-tracker' },
    { name: 'Roadmap', href: '/roadmap' },
    { name: 'Hearth', href: '/hearth' },
  ];

  return (
    <>
      {/* Mobile toggle (not critical for now) */}
      <div className="md:hidden bg-[#FF7043] text-white p-4 flex justify-between items-center sticky top-0 z-50">
        <span className="font-bold">Menu</span>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-white text-[#FF7043] px-3 py-1 rounded font-semibold"
        >
          {isOpen ? 'Close' : 'Open'}
        </button>
      </div>

      <aside
        className={`bg-white border-r border-gray-200 p-6 w-64 min-h-screen fixed left-0 z-40 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transition-transform duration-200 ease-in-out`}
        style={{ top }}
      >
        <div className="text-2xl font-bold text-[#FF7043] mb-8">ForgeTomorrow</div>
        <nav className="space-y-4">
          {menuItems.map((item) => (
            <Link key={item.name} href={item.href} className="block">
              <span className="block text-gray-700 hover:text-[#FF7043] font-medium cursor-pointer">
                {item.name}
              </span>
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
