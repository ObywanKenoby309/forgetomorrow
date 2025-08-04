import Link from 'next/link';

export default function LandingFooter() {
  return (
    <footer className="bg-[#1a1a1a] text-gray-300 py-8">
      <nav className="max-w-7xl mx-auto flex flex-wrap justify-center space-x-8">
        <Link href="/" className="hover:text-[#FF7043] transition">
          Home
        </Link>
        <Link href="/about" className="hover:text-[#FF7043] transition">
          About
        </Link>
        <Link href="/signup" className="hover:text-[#FF7043] transition">
          Sign Up
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
