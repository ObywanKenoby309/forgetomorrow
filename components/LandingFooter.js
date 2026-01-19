// components/LandingFooter.js
import Link from 'next/link';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Twitter, Facebook, Youtube, ChevronLeft, ChevronRight } from 'lucide-react';

export default function LandingFooter() {
  const year = new Date().getFullYear();

  const sections = useMemo(
    () => [
      {
        id: 'company',
        title: 'Company',
        links: [
          { href: '/about', label: 'About Us' },
          { href: '/careers', label: 'Careers' },
          { href: '/press', label: 'Press Kit' },
          { href: '/blog', label: 'Blog' },
        ],
      },
      {
        id: 'product',
        title: 'Product',
        links: [
          { href: '/features', label: 'Features' },
          { href: '/pricing', label: 'Pricing' },
          { href: '/help', label: 'Help Center' },
          { href: '/status', label: 'Status' },
        ],
      },
      {
        id: 'legal',
        title: 'Legal',
        links: [
          { href: '/privacy', label: 'Privacy Policy' },
          { href: '/terms', label: 'Terms of Service' },
          { href: '/community-guidelines', label: 'Community Guidelines' },
          { href: '/security', label: 'Security' },
          { href: '/accessibility', label: 'Accessibility' },
          { href: '/tracking-policy', label: 'Tracking & Cookies Policy' },
        ],
      },
      {
        id: 'connect',
        title: 'Connect',
        links: [{ href: '/contact', label: 'Contact' }],
      },
    ],
    []
  );

  const [activeIdx, setActiveIdx] = useState(0);
  const mobileRailRef = useRef(null);

  const goPrev = () => setActiveIdx((i) => (i - 1 + sections.length) % sections.length);
  const goNext = () => setActiveIdx((i) => (i + 1) % sections.length);

  useEffect(() => {
    const el = mobileRailRef.current;
    if (!el) return;
    el.focus();
  }, []);

  const onMobileKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goPrev();
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      goNext();
    }
  };

  return (
    <footer className="bg-[#0a0a0a] text-gray-400 border-t border-gray-900">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Desktop / Tablet: denser grid */}
        <div className="hidden md:grid grid-cols-4 gap-8 py-10">
          {/* Company */}
          <div>
            <h3 className="text-white font-semibold text-base mb-3">Company</h3>
            <ul className="space-y-2 text-sm">
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
            <h3 className="text-white font-semibold text-base mb-3">Product</h3>
            <ul className="space-y-2 text-sm">
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
              <li>
                <Link href="/status" className="hover:text-[#FF7043] focus:text-[#FF7043] transition">
                  Status
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold text-base mb-3">Legal</h3>
            <ul className="space-y-2 text-sm">
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
                  href="/community-guidelines"
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
                <Link
                  href="/accessibility"
                  className="hover:text-[#FF7043] focus:text-[#FF7043] transition"
                >
                  Accessibility
                </Link>
              </li>
              <li>
                <Link
                  href="/tracking-policy"
                  className="hover:text-[#FF7043] focus:text-[#FF7043] transition"
                >
                  Tracking & Cookies Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="text-white font-semibold text-base mb-3">Connect</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/contact" className="hover:text-[#FF7043] focus:text-[#FF7043] transition">
                  Contact
                </Link>
              </li>
            </ul>

            {/* Social Icons */}
            <div className="flex gap-4 mt-5">
              <a
                href="https://x.com/ForgeTomorrowHQ"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow Forge Tomorrow on X"
                className="hover:text-[#FF7043] focus:text-[#FF7043] transition"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://facebook.com/profile.php?id=61579627354284"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow Forge Tomorrow on Facebook"
                className="hover:text-[#FF7043] focus:text-[#FF7043] transition"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://youtube.com/@ForgeTomorrow-h2z"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Subscribe on YouTube"
                className="hover:text-[#FF7043] focus:text-[#FF7043] transition"
              >
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Mobile: compact + left/right sections (Contact + Copyright never disappear) */}
        <div className="md:hidden pt-8 pb-6">
          <div
            ref={mobileRailRef}
            tabIndex={0}
            onKeyDown={onMobileKeyDown}
            role="region"
            aria-label="Footer navigation sections"
            className="outline-none"
          >
            <p className="sr-only">
              Use the left and right arrow keys to switch footer sections. Swipe is optional.
            </p>

            {/* Section header + controls */}
            <div className="flex items-center justify-between gap-3 mb-3">
              <button
                type="button"
                onClick={goPrev}
                aria-label="Previous footer section"
                className="inline-flex items-center justify-center h-10 w-10 rounded-lg border border-gray-800 text-gray-300 hover:text-[#FF7043] hover:border-gray-700 transition"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="min-w-0 text-center">
                <div className="text-white font-semibold text-base leading-tight">
                  {sections[activeIdx]?.title}
                </div>
                <div className="text-xs text-gray-500">
                  {activeIdx + 1} / {sections.length}
                </div>
              </div>

              <button
                type="button"
                onClick={goNext}
                aria-label="Next footer section"
                className="inline-flex items-center justify-center h-10 w-10 rounded-lg border border-gray-800 text-gray-300 hover:text-[#FF7043] hover:border-gray-700 transition"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Active section links */}
            <div className="rounded-xl border border-gray-900 bg-[#0b0b0b] px-4 py-4">
              <ul className="space-y-3 text-sm">
                {sections[activeIdx]?.links.map((l) => (
                  <li key={`${sections[activeIdx].id}-${l.href}`}>
                    <Link href={l.href} className="hover:text-[#FF7043] focus:text-[#FF7043] transition">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Social icons: show when Connect is active (but Contact link is always visible below) */}
              {sections[activeIdx]?.id === 'connect' && (
                <div className="flex gap-5 mt-5">
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
              )}
            </div>
          </div>

          {/* Persistent Contact + Copyright (never disappear) */}
          <div className="mt-6 border-t border-gray-900 pt-4">
            <div className="flex items-center justify-between gap-4">
              <Link href="/contact" className="text-sm hover:text-[#FF7043] focus:text-[#FF7043] transition">
                Contact
              </Link>
              <span className="text-xs text-gray-500">© {year} Forge Tomorrow, Inc.</span>
            </div>
          </div>
        </div>

        {/* Bottom (shared): tightened */}
        <div className="border-t border-gray-800 py-6 text-center text-sm text-gray-500">
          <p className="text-[11px] text-gray-500 max-w-3xl mx-auto mb-2 leading-relaxed">
            ForgeTomorrow’s technologies — including its AI explainability engine, recruiter analytics systems,
            human–AI workflow orchestration models, and adaptive career-matching platform — are protected under
            multiple U.S. and international patent filings (pending). Unauthorized reproduction, reverse engineering,
            or replication of these systems is prohibited.
          </p>
          <p>© {year} Forge Tomorrow, Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
