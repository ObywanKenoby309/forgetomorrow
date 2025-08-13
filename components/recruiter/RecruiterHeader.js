// components/recruiter/RecruiterHeader.js
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { usePlan } from "../../context/PlanContext";

const navItems = [
  { href: "/recruiter/dashboard", label: "Dashboard" },
  { href: "/recruiter/job-postings", label: "Job Postings" },
  { href: "/recruiter/candidates", label: "Candidates" },
  { href: "/recruiter/messaging", label: "Messaging" },
  { href: "/recruiter/analytics", label: "Analytics" },
];

export default function RecruiterHeader() {
  const router = useRouter();
  const { plan, isEnterprise, togglePlan } = usePlan();
  const [open, setOpen] = useState(false);

  const isActive = (href) => router.pathname === href;

  return (
    <header className="bg-[#2a2a2a] text-gray-300 py-3 shadow-md sticky top-0 left-0 right-0 z-50">
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-6">
        {/* Brand + Plan Badge */}
        <div className="flex items-center gap-3">
          <Link
            href="/recruiter/dashboard"
            className="text-[#FF7043] font-bold text-xl tracking-wide hover:text-[#F4511E] transition"
          >
            ForgeTomorrow
          </Link>
          <span className="text-sm text-gray-400">Recruiter Suite</span>
          <span
            className={`text-[10px] uppercase tracking-wide px-2 py-[3px] rounded-md border ${
              isEnterprise
                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                : "bg-slate-100 text-slate-700 border-slate-300"
            }`}
            title="Current plan"
          >
            {isEnterprise ? "Enterprise" : "Small Business"}
          </span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6 font-semibold">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`transition ${
                isActive(item.href)
                  ? "text-[#FF7043]"
                  : "hover:text-[#FF7043] text-gray-300"
              }`}
            >
              {item.label}
            </Link>
          ))}

          {/* Upgrade CTA for Small Business */}
          {!isEnterprise && (
            <Link
              href="/recruiter/upgrade"
              className="bg-[#FF7043] hover:bg-[#F4511E] text-white px-3 py-2 rounded-lg transition text-sm"
              title="Unlock Enterprise features"
            >
              Upgrade to Enterprise
            </Link>
          )}

          {/* Dev-only plan toggle (hidden in production) */}
          {process.env.NODE_ENV !== "production" && (
            <button
              onClick={togglePlan}
              className="ml-2 rounded-lg border border-gray-500/40 px-2 py-1 text-xs hover:bg-[#333]"
              title="Dev: toggle plan"
            >
              Toggle Plan
            </button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden inline-flex items-center justify-center rounded-md p-2 hover:bg-[#333] focus:outline-none"
          onClick={() => setOpen((v) => !v)}
          aria-label="Open menu"
        >
          <svg
            className="h-6 w-6 text-gray-300"
            xmlns="http://www.w3.org/2000/svg"
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile Drawer */}
      {open && (
        <div className="md:hidden border-t border-[#3a3a3a] bg-[#2a2a2a]">
          <div className="max-w-7xl mx-auto px-4 py-3 space-y-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`block px-2 py-2 rounded ${
                  isActive(item.href)
                    ? "bg-[#333] text-[#FF7043]"
                    : "hover:bg-[#333] hover:text-[#FF7043] text-gray-300"
                }`}
              >
                {item.label}
              </Link>
            ))}

            {!isEnterprise && (
              <Link
                href="/recruiter/upgrade"
                onClick={() => setOpen(false)}
                className="block bg-[#FF7043] hover:bg-[#F4511E] text-white px-3 py-2 rounded-lg transition text-sm text-center"
              >
                Upgrade to Enterprise
              </Link>
            )}

            {process.env.NODE_ENV !== "production" && (
              <button
                onClick={() => {
                  togglePlan();
                  setOpen(false);
                }}
                className="w-full border border-gray-500/40 px-3 py-2 text-xs rounded hover:bg-[#333]"
              >
                Toggle Plan (Dev)
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
