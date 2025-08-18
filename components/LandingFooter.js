// components/LandingFooter.js
import Link from "next/link";

export default function LandingFooter() {
  return (
    <footer className="bg-[#1a1a1a] text-gray-300 py-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid gap-8 md:grid-cols-4 text-sm">
          {/* Company */}
          <div>
            <h2 className="font-semibold text-gray-100 mb-3">Company</h2>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="hover:text-[#FF7043] transition">
                  About
                </Link>
              </li>
              <li>
                <Link href="/careers" className="hover:text-[#FF7043] transition">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/press" className="hover:text-[#FF7043] transition">
                  Press
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-[#FF7043] transition">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Product */}
          <div>
            <h2 className="font-semibold text-gray-100 mb-3">Product</h2>
            <ul className="space-y-2">
              <li>
                <Link href="/features" className="hover:text-[#FF7043] transition">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-[#FF7043] transition">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-[#FF7043] transition">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h2 className="font-semibold text-gray-100 mb-3">Legal</h2>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="hover:text-[#FF7043] transition">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[#FF7043] transition">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/security" className="hover:text-[#FF7043] transition">
                  Security
                </Link>
              </li>
              <li>
                <Link
                  href="/accessibility"
                  className="hover:text-[#FF7043] transition"
                >
                  Accessibility
                </Link>
              </li>
            </ul>
          </div>

          {/* Join / Auth */}
          <div>
            <h2 className="font-semibold text-gray-100 mb-3">Join</h2>
            <ul className="space-y-2">
              <li>
                <Link href="/signup" className="hover:text-[#FF7043] transition">
                  Sign Up
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-[#FF7043] transition">
                  Login
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <p className="mt-10 text-center text-gray-500 text-xs">
          &copy; {new Date().getFullYear()} ForgeTomorrow. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
