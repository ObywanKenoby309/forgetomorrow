// components/LandingFooter.tsx ← FINAL CLEAN VERSION WITHOUT "Get Early Access"
import Link from 'next/link';
import { Twitter, Facebook, Youtube } from 'lucide-react';

export default function LandingFooter() {
  return (
    <footer className="bg-[#0a0a0a] text-gray-400 py-16 border-t border-gray-900">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          {/* Company */}
          <div>
            <h3 className="text-white font-bold text-lg mb-5">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="hover:text-[#FF7043] focus:text-[#FF7043] transition">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/careers" className="hover:text-[#FF7043] focus:text-[#FF7043] transition">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/press" className="hover:text-[#FF7043] focus:text-[#FF7043] transition">
                  Press Kit
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-[#FF7043] focus:text-[#FF7043] transition">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-white font-bold text-lg mb-5">Product</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/features" className="hover:text-[#FF7043] focus:text-[#FF7043] transition">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-[#FF7043] focus:text-[#FF7043] transition">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-[#FF7043] focus:text-[#FF7043] transition">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-bold text-lg mb-5">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/privacy" className="hover:text-[#FF7043] focus:text-[#FF7043] transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[#FF7043] focus:text-[#FF7043] transition">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/community-guildelines"
                  className="hover:text-[#FF7043] focus:text-[#FF7043] transition"
                >
                  Community Guidelines
                </Link>
              </li>
              <li>
                <Link href="/security" className="hover:text-[#FF7043] focus:text-[#FF7043] transition">
                  Security
                </Link>
              </li>
              <li>
                <Link href="/accessibility" className="hover:text-[#FF7043] focus:text-[#FF7043] transition">
                  Accessibility
                </Link>
              </li>
              <li>
                <Link href="/tracking-policy" className="hover:text-[#FF7043] focus:text-[#FF7043] transition">
                  Tracking & Cookies Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="text-white font-bold text-lg mb-5">Connect</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/contact" className="hover:text-[#FF7043] focus:text-[#FF7043] transition">
                  Contact
                </Link>
              </li>
            </ul>

            {/* Social Icons */}
            <div className="flex gap-5 mt-8">
              <a
                href="https://x.com/ForgeTomorrowHQ"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow Forge Tomorrow on X"
                className="hover:text-[#FF7043] focus:text-[#FF7043] transition"
              >
                <Twitter className="h-6 w-6" />
              </a>
              <a
                href="https://facebook.com/profile.php?id=61579627354284"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow Forge Tomorrow on Facebook"
                className="hover:text-[#FF7043] focus:text-[#FF7043] transition"
              >
                <Facebook className="h-6 w-6" />
              </a>
              <a
                href="https://youtube.com/@ForgeTomorrow-h2z"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Subscribe on YouTube"
                className="hover:text-[#FF7043] focus:text-[#FF7043] transition"
              >
                <Youtube className="h-6 w-6" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
          {/* Patent Notice (Option B placement) */}
          <p className="text-xs text-gray-500 max-w-3xl mx-auto mb-3 leading-relaxed">
            ForgeTomorrow’s technologies — including its AI explainability engine, recruiter analytics systems,
            human–AI workflow orchestration models, and adaptive career-matching platform — are protected under
            multiple U.S. and international patent filings (pending). Unauthorized reproduction, reverse engineering,
            or replication of these systems is prohibited.
          </p>

          <p>© {new Date().getFullYear()} Forge Tomorrow, Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
