// components/Header.js
import Link from 'next/link';

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 bg-[#1a1a1a] text-gray-300 shadow-md z-50">
      <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-[#FF7043] hover:text-[#F4511E] transition">
          ForgeTomorrow
        </Link>

        <ul className="hidden md:flex space-x-8 font-semibold">
          <li>
            <Link href="/about" className="hover:text-[#FF7043] transition">
              About
            </Link>
          </li>
          <li>
            <Link href="/jobs" className="hover:text-[#FF7043] transition">
              Jobs
            </Link>
          </li>
          <li>
            <Link href="/contacts" className="hover:text-[#FF7043] transition">
              Contacts
            </Link>
          </li>
          <li>
            <Link href="/profile" className="hover:text-[#FF7043] transition">
              Profile
            </Link>
          </li>
          <li>
            <Link
              href="/login"
              className="bg-[#FF7043] hover:bg-[#F4511E] text-white px-4 py-2 rounded-lg transition"
            >
              Login
            </Link>
          </li>
        </ul>

        <div className="md:hidden">{/* Mobile menu placeholder */}</div>
      </nav>
    </header>
  );
}
