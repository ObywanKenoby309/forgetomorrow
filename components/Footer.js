// components/Footer.js
import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#1a1a1a] text-gray-300 py-5">
      <div className="max-w-7xl mx-auto px-4 space-y-4">
        {/* Top row: utility/help */}
        <nav
          aria-label="Internal utilities"
          className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs md:text-sm"
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
        <div className="border-t border-gray-700" />

        {/* Middle row: legal links + resume stat (pulled higher for support button) */}
        <div className="flex flex-col items-center gap-2 md:flex-row md:justify-between">
          <nav
            aria-label="Legal"
            className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] md:text-xs"
          >
            <Link href="/privacy" className="hover:text-[#FF7043] transition">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-[#FF7043] transition">
              Terms
            </Link>
            <Link
              href="/community-guidelines"
              className="hover:text-[#FF7043] transition"
            >
              Community Guidelines
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

          {/* Resume stat – centered, small, above the floating support button */}
          <p className="text-[10px] text-gray-400 max-w-xl text-center md:text-right leading-snug">
            *87% of job seekers using role-aligned, job-ready resumes receive at
            least one interview within 7 days of applying.{" "}
            <em>Source: Jobscan 2024 Applicant Study (n=1,200)</em>. Results vary.
          </p>
        </div>

        {/* Bottom row: patent + copyright (compact) */}
        <div className="flex flex-col items-center gap-1 md:flex-row md:justify-between">
          <p className="text-[10px] text-gray-500 max-w-2xl text-center md:text-left leading-snug md:pl-3">
  ForgeTomorrow’s technologies — including its AI explainability
  engine, recruiter analytics systems, human–AI workflow orchestration
  models, and adaptive career-matching platform — are protected under
  multiple U.S. and international patent filings (pending).
  Unauthorized reproduction, reverse engineering, or replication of
  these systems is prohibited.
</p>
          <p className="text-xs text-gray-400 mt-1 md:mt-0">
            © {year} ForgeTomorrow • v0.1.0
          </p>
        </div>
      </div>
    </footer>
  );
}
