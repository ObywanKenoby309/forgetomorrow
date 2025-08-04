import Link from 'next/link';

export default function LandingHeader() {
  return (
    <header className="bg-[#1a1a1a] text-gray-300 py-4 shadow-md fixed top-0 left-0 right-0 z-50">
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-6">
        <Link
          href="/"
          className="text-[#FF7043] font-bold text-2xl tracking-wide hover:text-[#F4511E] transition"
        >
          ForgeTomorrow
        </Link>

        <div className="space-x-6 hidden md:flex font-semibold">
          <Link href="/" className="hover:text-[#FF7043] transition">
            Home
          </Link>
          <Link href="/about" className="hover:text-[#FF7043] transition">
            About
          </Link>
          <Link href="/signup" className="hover:text-[#FF7043] transition">
            Sign Up
          </Link>
          <Link href="/login" className="bg-[#FF7043] hover:bg-[#F4511E] text-white px-4 py-2 rounded-lg transition">
            Login
          </Link>
        </div>

        {/* Mobile menu placeholder */}
        <div className="md:hidden">{/* TODO: add mobile menu here if needed */}</div>
      </nav>
    </header>
  );
}
