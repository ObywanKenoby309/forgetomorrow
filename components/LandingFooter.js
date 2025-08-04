import Link from 'next/link';

export default function LandingFooter() {
  return (
    <footer className="bg-[#222] text-gray-300 py-6 mt-20">
      <nav className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
        <div>&copy; {new Date().getFullYear()} ForgeTomorrow</div>
        <ul className="flex space-x-6 font-semibold text-sm">
          <li><Link href="/about"><a className="hover:underline">About</a></Link></li>
          <li><Link href="/pricing"><a className="hover:underline">Pricing</a></Link></li>
          <li><Link href="/support"><a className="hover:underline">Support</a></Link></li>
          <li><Link href="/contact"><a className="hover:underline">Contact</a></Link></li>
        </ul>
      </nav>
    </footer>
  );
}
