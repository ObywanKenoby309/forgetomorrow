// components/Footer.js
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#1a1a1a] text-gray-300 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Top row: utility/help */}
        <nav
          aria-label="Internal utilities"
          className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm"
        >
          <Link href="/help" className="hover:text-[#FF7043] transition">
            Help Center
          </Link>
          <Link href="/status" className="hover:text-[#FF7043] transition">
            Status
          </Link>
          <Link href="/changelog" className="hover:text-[#FF7043] transition">
            Changelog
          </Link>
          <Link href="/shortcuts" className="hover:text-[#FF7043] transition">
            Keyboard Shortcuts
          </Link>
          <Link href="/settings" className="hover:text-[#FF7043] transition">
            Settings
          </Link>
        </nav>

        {/* Divider */}
        <div className="my-4 border-t border-gray-700" />

        {/* Bottom row: legal + copyright */}
        <div className="flex flex-col items-center gap-2 text-xs md:flex-row md:justify-between text-gray-400">
          <nav
            aria-label="Legal"
            className="flex flex-wrap justify-center gap-x-4 gap-y-2"
          >
            <Link href="/privacy" className="hover:text-[#FF7043] transition">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-[#FF7043] transition">
              Terms
            </Link>
            <Link href="/security" className="hover:text-[#FF7043] transition">
              Security
            </Link>
            <Link
              href="/accessibility"
              className="hover:text-[#FF7043] transition"
            >
              Accessibility
            </Link>
            <Link href="/cookies" className="hover:text-[#FF7043] transition">
              Cookies
            </Link>
          </nav>

          <p className="text-xs">
            © {new Date().getFullYear()} ForgeTomorrow • v0.1.0
          </p>
        </div>
      </div>
    </footer>
  );
}
