// components/layouts/EnterpriseHeader.js
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { usePlan } from "@/context/PlanContext";

/**
 * EnterpriseHeader
 * Props:
 * - brandHref: string (where logo/title links)
 * - brandLabel: string (e.g., "ForgeTomorrow")
 * - sectionLabel: string (e.g., "Recruiter Suite", "Job Seeker", "Coaching Suite")
 * - navItems: [{ href, label }]
 * - showUpgrade?: boolean (default true — hidden if Enterprise)
 * - supportHref?: string (defaults to "/support")
 * - optionsHref?: string (defaults to "/recruiter/options")
 * - alignWithGrid?: boolean (true = full-width bar aligned to page padding)
 * - planLabel?: string (optional override for the plan badge text, e.g., "Pro", "Basic")
 *
 * Behavior:
 * - If sectionLabel === "Coaching Suite": NO plan badge (per coaching requirement).
 * - Else if planLabel provided: use it (e.g., Seeker "Pro"/"Basic").
 * - Else fallback to business logic: Enterprise / Small Business.
 */
export default function EnterpriseHeader({
  brandHref = "/",
  brandLabel = "ForgeTomorrow",
  sectionLabel = "",
  navItems = [],
  showUpgrade = true,
  supportHref = "/support",
  optionsHref = "/recruiter/options",
  alignWithGrid = true,
  planLabel, // optional override
}) {
  const router = useRouter();
  const { isEnterprise, togglePlan } = usePlan();
  const [openMobile, setOpenMobile] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
  const profileRef = useRef(null);

  const isActive = (href) => router.pathname === href;

  useEffect(() => {
    function onDocClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setOpenProfile(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Coaching: suppress plan badge entirely
  const suppressBadge = sectionLabel === "Coaching Suite";

  // Badge text: prefer explicit override (Seeker), else business fallback (Recruiter)
  const badgeText =
    typeof planLabel === "string" && planLabel.length > 0
      ? planLabel
      : isEnterprise
      ? "Enterprise"
      : "Small Business";

  return (
    <header className="bg-[#2a2a2a] text-gray-300 shadow-md sticky top-0 left-0 right-0 z-[9999]">
      <nav
        className={`${alignWithGrid ? "w-full px-5 md:px-6" : "max-w-7xl mx-auto px-4 md:px-6"} h-14 grid items-center gap-4`}
        style={{ gridTemplateColumns: "auto 1fr auto" }}
      >
        {/* LEFT — brand */}
        <div className="flex items-center gap-3 md:gap-4 min-w-0 pr-4 md:pr-6">
          <Link href={brandHref} className="flex items-center gap-2">
            <img src="/favicon-32x32.png" alt={brandLabel} className="h-[22px] w-[22px] md:h-6 md:w-6 rounded" />
            <span className="text-[#FF7043] font-bold text-xl tracking-wide hover:text-[#F4511E] transition whitespace-nowrap leading-none">
              {brandLabel}
            </span>
          </Link>

          {sectionLabel && (
            <span className="text-sm text-gray-400 whitespace-nowrap leading-none">{sectionLabel}</span>
          )}

          {!suppressBadge && (
            <span
              className={`text-[10px] uppercase tracking-wide px-2 py-[3px] rounded-md border whitespace-nowrap leading-none ${
                isEnterprise ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-700 border-slate-300"
              }`}
              title="Current plan"
            >
              {badgeText}
            </span>
          )}
        </div>

        {/* MIDDLE — nav */}
        <div className="hidden md:flex items-center justify-center gap-7 md:gap-8 font-semibold">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-1 transition whitespace-nowrap leading-none ${
                isActive(item.href) ? "text-[#FF7043]" : "hover:text-[#FF7043] text-gray-300"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* RIGHT — actions/profile */}
        <div className="hidden md:flex items-center justify-end gap-3 pl-4 md:pl-6">
          {!isEnterprise && showUpgrade && (
            <Link
              href="/recruiter/upgrade"
              className="bg-[#FF7043] hover:bg-[#F4511E] text-white px-3 py-2 rounded-lg transition text-sm whitespace-nowrap leading-none"
              title="Unlock Enterprise features"
            >
              Upgrade to Enterprise
            </Link>
          )}

          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setOpenProfile((v) => !v)}
              className="inline-flex items-center gap-2 px-2 py-1 rounded-md hover:bg-[#333] focus:outline-none"
              aria-haspopup="menu"
              aria-expanded={openProfile}
            >
              <span className="h-8 w-8 rounded-full bg-gradient-to-br from-[#FF7043] to-[#F4511E] flex items-center justify-center text-white text-xs font-bold">
                FT
              </span>
              <svg className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
              </svg>
            </button>

            {openProfile && (
              <div role="menu" className="absolute right-0 mt-2 w-44 rounded-md border border-[#3a3a3a] bg-[#2f2f2f] shadow-lg overflow-hidden">
                <Link href={optionsHref} className="block px-3 py-2 text-sm hover:bg-[#333] hover:text-white" role="menuitem">
                  Options
                </Link>
                <Link href={supportHref} className="block px-3 py-2 text-sm hover:bg-[#333] hover:text-white" role="menuitem">
                  Support
                </Link>
                <button
                  className="w-full text-left px-3 py-2 text-sm hover:bg-[#333] hover:text-white"
                  role="menuitem"
                  onClick={() => console.log("Logging out…")}
                >
                  Log Out
                </button>

                {process.env.NODE_ENV !== "production" && (
                  <button onClick={togglePlan} className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-[#333]" title="Dev: toggle plan">
                    Toggle Plan (Dev)
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile hamburger */}
        <div className="md:hidden flex justify-end">
          <button
            className="inline-flex items-center justify-center h-10 w-10 rounded-md hover:bg-[#333] focus:outline-none"
            onClick={() => setOpenMobile((v) => !v)}
            aria-label="Open menu"
          >
            <svg className="h-6 w-6 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {openMobile ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <MobileDrawer
        open={openMobile}
        onClose={() => setOpenMobile(false)}
        navItems={navItems}
        isEnterprise={isEnterprise}
        brandLabel={brandLabel}
        sectionLabel={sectionLabel}
        brandHref={brandHref}
        // Only pass a plan label to mobile if not coaching
        planLabel={suppressBadge ? undefined : badgeText}
      />
    </header>
  );
}

function MobileDrawer({ open, onClose, navItems, isEnterprise, brandLabel, sectionLabel, brandHref, planLabel }) {
  if (!open) return null;
  const showBadge = typeof planLabel === "string" && planLabel.length > 0;
  return (
    <div className="md:hidden border-t border-[#3a3a3a] bg-[#2a2a2a]">
      <div className="max-w-7xl mx-auto px-4 py-3 space-y-3">
        {/* Brand row */}
        <Link href={brandHref} onClick={onClose} className="flex items-center gap-2">
          <img src="/favicon-32x32.png" alt={brandLabel} className="h-5 w-5 rounded" />
          <span className="text-[#FF7043] font-semibold">{brandLabel}</span>
          {sectionLabel && <span className="text-xs text-gray-400">{sectionLabel}</span>}
          {showBadge && (
            <span
              className={`ml-auto text-[10px] uppercase tracking-wide px-2 py-[3px] rounded-md border ${
                isEnterprise ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-700 border-slate-300"
              }`}
            >
              {planLabel}
            </span>
          )}
        </Link>

        {/* Nav links */}
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className={`block px-2 py-2 rounded ${
              location.pathname === item.href ? "bg-[#333] text-[#FF7043]" : "hover:bg-[#333] hover:text-[#FF7043] text-gray-300"
            }`}
          >
            {item.label}
          </Link>
        ))}

        {!isEnterprise && (
          <Link
            href="/recruiter/upgrade"
            onClick={onClose}
            className="block bg-[#FF7043] hover:bg-[#F4511E] text-white px-3 py-2 rounded-lg transition text-sm text-center"
          >
            Upgrade to Enterprise
          </Link>
        )}
      </div>
    </div>
  );
}
