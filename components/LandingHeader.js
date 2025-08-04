import Link from 'next/link';

export default function LandingHeader() {
  return (
    <header className="bg-black text-white shadow-md fixed top-0 left-0 right-0 z-50">
      <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="text-[#FF7043] font-bold text-xl tracking-wide">
          <span className="inline-block rotate-45">\\</span> ForgeTomorrow
        </div>
        <ul className="hidden md:flex space-x-8 font-semibold">
          <li><Link href="/"><a className="hover:underline">Home</a></Link></li>
          <li><Link href="/about"><a className="hover:underline">About</a></Link></li>
          <li><Link href="/pricing"><a className="hover:underline">Pricing</a></Link></li>
          <li><Link href="/login"><a className="bg-[#FF7043] hover:bg-[#F4511E] text-white px-4 py-2 rounded-xl">Login</a></Link></li>
          <li><Link href="/signup"><a className="bg-[#FF7043] hover:bg-[#F4511E] text-white px-4 py-2 rounded-xl">Sign Up</a></Link></li>
        </ul>
        <div className="md:hidden">{/* Mobile menu placeholder */}</div>
      </nav>
    </header>
  );
}
