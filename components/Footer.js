import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#2a2a2a] text-gray-300 py-8">
      <nav className="max-w-7xl mx-auto flex flex-wrap justify-center space-x-6">
        <Link href="/about" className="hover:text-[#FF7043] transition">
          About
        </Link>
        <Link href="/jobs" className="hover:text-[#FF7043] transition">
          Jobs
        </Link>
        <Link href="/contacts" className="hover:text-[#FF7043] transition">
          Contacts
        </Link>
        <Link href="/profile" className="hover:text-[#FF7043] transition">
          Profile
        </Link>
        <Link href="/login" className="hover:text-[#FF7043] transition">
          Login
        </Link>
      </nav>
      <p className="mt-6 text-center text-gray-400 text-sm">
        &copy; {new Date().getFullYear()} ForgeTomorrow. All rights reserved.
      </p>
    </footer>
  );
}
