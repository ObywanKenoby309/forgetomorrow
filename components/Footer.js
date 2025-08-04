import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#FF7043] text-white py-6">
      <nav className="max-w-7xl mx-auto flex flex-wrap justify-center space-x-6">
        <Link href="/about" className="hover:underline">
          About
        </Link>
        <Link href="/jobs" className="hover:underline">
          Jobs
        </Link>
        <Link href="/contacts" className="hover:underline">
          Contacts
        </Link>
        <Link href="/profile" className="hover:underline">
          Profile
        </Link>
        <Link href="/login" className="hover:underline">
          Login
        </Link>
      </nav>
      <p className="mt-4 text-center text-white text-sm">
        &copy; {new Date().getFullYear()} ForgeTomorrow. All rights reserved.
      </p>
    </footer>
  );
}
