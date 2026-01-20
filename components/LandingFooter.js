// components/LandingFooter.js
import Link from 'next/link';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Twitter, Facebook, Youtube, ChevronLeft, ChevronRight } from 'lucide-react';

export default function LandingFooter() {
  const year = new Date().getFullYear();

  // Mobile keeps richer navigation
  const sections = useMemo(
    () => [
      {
        id: 'company',
        title: 'Company',
        links: [
          { href: '/company', label: 'Company Hub' },
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
          { href: '/product', label: 'Product Hub' },
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
          { href: '/legal', label: 'Legal Hub' },
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
        {/* Desktop / Tablet: hub-first, shorter, less "link dump" */}
        <div className="hidden md:grid grid-cols-4 gap-7 py-6 items-start">
          {/* Company */}
          <div>
            <Link
              href="/company"
              className="inline-flex items-center gap-2 text-white font-semibold text-[15px] mb-2 hover:text-[#FF7043] focus:text-[#FF7043] transition"
            >
              Company <span className="text-[#FF7043]">→</span>
            </Link>
            <ul className="space-y-1 text-sm">
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
              <li className="pt-2">
                <Link
                  href="/company"
                  className="text-[12px] text-gray-500 hover:text-[#FF7043] focus:text-[#FF7043] transition"
                >
                  View all company links →
                </Link>
              </li>
            </ul>
          </div>

          {/* Product */}
          <div>
            <Link
              href="/product"
              className="inline-flex items-center gap-2 text-white font-semibold text-[15px] mb-2 hover:text-[#FF7043] focus:text-[#FF7043] transition"
            >
              Product <span className="text-[#FF7043]">→</span>
            </Link>
            <ul className="space-y-1 text-sm">
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

              {/* ✅ Persistent trust signal (always visible) */}
              <li className="pt-2">
                <Link
                  href="/status"
                  className="inline-flex items-center gap-2 text-[12px] text-gray-500 hover:text-[#FF7043] focus:text-[#FF7043] transition"
                >
                  Status <span className="text-[#FF7043]">→</span>
                </Link>
              </li>

              <li className="pt-2">
                <Link
                  href="/product"
                  className="text-[12px] text-gray-500 hover:text-[#FF7043] focus:text-[#FF7043] transition"
                >
                  View all product links →
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <Link
              href="/legal"
              className="inline-flex items-center gap-2 text-white font-semibold text-[15px] mb-2 hover:text-[#FF7043] focus:text-[#FF7043] transition"
            >
              Legal <span className="text-[#FF7043]">→</span>
            </Link>
            <ul className="space-y-1 text-sm">
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
              <li className="pt-2">
                <Link
                  href="/legal"
                  className="text-[12px] text-gray-500 hover:text-[#FF7043] focus:text-[#FF7043] transition"
                >
                  View all legal links →
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="text-white font-semibold text-[15px] mb-2">Connect</h3>
            <ul className="space-y-1 text-sm">
              <li>
                <Link href="/contact" className="hover:text-[#FF7043] focus:text-[#FF7043] transition">
                  Contact
                </Link>
              </li>
            </ul>

            {/* Social Icons */}
            <div className="flex gap-4 mt-4">
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

        {/* Mobile: compact + left/right sections (Contact + Status + Copyright never disappear) */}
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

              {/* Social icons: show when Connect is active */}
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

          {/* Persistent Contact + Status + Copyright (never disappear) */}
          <div className="mt-6 border-t border-gray-900 pt-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Link href="/contact" className="text-sm hover:text-[#FF7043] focus:text-[#FF7043] transition">
                  Contact
                </Link>
                <Link href="/status" className="text-sm hover:text-[#FF7043] focus:text-[#FF7043] transition">
                  Status
                </Link>
              </div>
              <span className="text-xs text-gray-500">© {year} Forge Tomorrow, Inc.</span>
            </div>
          </div>
        </div>

        {/* Bottom (shared): tighter + less vertical air */}
        <div className="border-t border-gray-900 py-4 text-center text-sm text-gray-500">
          <p className="text-[10.5px] text-gray-500 max-w-4xl mx-auto mb-1 leading-snug">
            ForgeTomorrow’s technologies - including its AI explainability engine, recruiter analytics systems,
            human-AI workflow orchestration models, and adaptive career-matching platform - are protected under
            multiple U.S. and international patent filings (pending). Unauthorized reproduction, reverse engineering,
            or replication of these systems is prohibited.
          </p>
          <p className="text-[12px]">© {year} Forge Tomorrow, Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
