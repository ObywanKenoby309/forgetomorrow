// components/layouts/EnterpriseHeader.js ← with real plan from session
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { usePlan } from "@/context/PlanContext";
import Avatar from "@/components/common/Avatar";
import { useCurrentUserAvatar } from "@/hooks/useCurrentUserAvatar";
import { useSession } from "next-auth/react";

export default function EnterpriseHeader({
  brandHref = "/",
  brandLabel = "ForgeTomorrow",
  sectionLabel = "",
  navItems = [],
  showUpgrade = true,
  supportHref = "/support",
  optionsHref = "/recruiter/options",
  alignWithGrid = true,
  planLabel,
  showPlanBadge = true,
  publicVariant = false,
  showUserMenu = true,
  gridGapClass: gridGapClassProp,
  centerJustifyClass = "justify-center",
  containerClass,
  leftClass,
  rightClass,
  navGapClass,
  heightClass,
}) {
  const router = useRouter();

  // 🔸 Plan context (dev toggle etc.)
  const { isEnterprise: planIsEnterprise, togglePlan } = usePlan();

  // 🔸 Real plan from NextAuth session
  const { data: session } = useSession();
  const rawPlan = (session?.user && session.user.plan) || null;
  const normalizedPlan =
    typeof rawPlan === "string" ? rawPlan.toUpperCase() : null;

  // Recruiter Enterprise = true when DB says ENTERPRISE
  const isRecruiterEnterprise =
    normalizedPlan === "ENTERPRISE" ||
    normalizedPlan === "RECRUITER_ENTERPRISE";

  // Final flag used everywhere in this header
  const isEnterprise = planIsEnterprise || isRecruiterEnterprise;

  const [openMobile, setOpenMobile] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
  const profileRef = useRef(null);
  const isActive = (href) => router.pathname === href;

  // 🔗 Pull avatar image + initials from current user
  const { avatarUrl, initials } = useCurrentUserAvatar();

  useEffect(() => {
    const handleClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setOpenProfile(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && openMobile) {
        setOpenMobile(false);
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [openMobile]);

  const defaultHeight = "h-14";
  const resolvedHeight = heightClass || defaultHeight;
  const defaultContainer = alignWithGrid
    ? "w-full px-5 md:px-6"
    : "max-w-7xl mx-auto px-4 md:px-6";
  const defaultLeft =
    "flex items-center gap-3 md:gap-4 min-w-0 pr-4 md:pr-6";
  const defaultNavGap = "gap-7 md:gap-8";
  const defaultRight =
    "hidden md:flex items-center justify-end gap-3 pl-4 md:pl-6";

  const publicContainer = "max-w-7xl mx-auto px-8 md:px-10";
  const publicLeft =
    "flex items-center min-w-0 gap-4 md:gap-6 pr-6 md:pr-8";
  const publicRight =
    "hidden md:flex items-center justify-end gap-4 md:gap-6 pl-6 md:pl-8";

  const resolvedContainer =
    containerClass || (publicVariant ? publicContainer : defaultContainer);
  const resolvedLeft = leftClass || (publicVariant ? publicLeft : defaultLeft);
  const resolvedRight =
    rightClass || (publicVariant ? publicRight : defaultRight);
  const resolvedNavGap = navGapClass || defaultNavGap;
  const gridGapClass =
    gridGapClassProp || (publicVariant ? "gap-12 md:gap-20" : "gap-4");

  const suppressBadge =
    sectionLabel === "Coaching Suite" || showPlanBadge === false;

  const badgeText =
    typeof planLabel === "string" && planLabel.length > 0
      ? planLabel
      : isEnterprise
      ? "Enterprise"
      : "Small Business";

  const navInRight = publicVariant && !showUserMenu;

  return (
    <>
      <header className="bg-[#2a2a2a] text-gray-300 shadow-md sticky top-0 z-50 w-full">
        <nav
          className={`${resolvedContainer} ${resolvedHeight} grid items-center ${gridGapClass}`}
          style={{
            gridTemplateColumns: "auto 1fr auto",
            ...(publicVariant ? { gap: "3rem" } : null),
          }}
        >
          {/* LEFT — Brand */}
          <div className={resolvedLeft}>
            <Link href={brandHref} className="flex items-center gap-2 min-w-0">
              <img
                src="/favicon-32x32.png"
                alt={brandLabel}
                className="h-[22px] w-[22px] md:h-6 md:w-6 rounded flex-shrink-0"
              />
              <span className="text-[#FF7043] font-bold text-lg sm:text-xl tracking-wide hover:text-[#F4511E] transition truncate max-w-[140px] sm:max-w-[200px]">
                {brandLabel}
              </span>
            </Link>
            {sectionLabel && (
              <span className="text-sm text-gray-400 ml-3 truncate">
                {sectionLabel}
              </span>
            )}
            {!suppressBadge && (
              <span
                className={`ml-3 text-[10px] uppercase tracking-widest px-2 py-1 rounded border ${
                  isEnterprise
                    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                    : "bg-slate-100 text-slate-700 border-slate-300"
                }`}
              >
                {badgeText}
              </span>
            )}
          </div>

          {/* MIDDLE — Desktop Nav */}
          {navInRight ? (
            <div className="hidden md:flex" />
          ) : (
            <div
              className={`hidden md:flex items-center ${centerJustifyClass} ${resolvedNavGap} font-semibold`}
            >
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md transition ${
                    isActive(item.href)
                      ? "text-[#FF7043]"
                      : "hover:text-[#FF7043] focus-visible:ring-2 focus-visible:ring-orange-500"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}

          {/* RIGHT — Actions or Nav */}
          <div className={resolvedRight}>
            {navInRight ? (
              <div
                className={`hidden md:flex items-center ${resolvedNavGap} font-semibold`}
              >
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 rounded-md transition ${
                      isActive(item.href)
                        ? "text-[#FF7043]"
                        : "hover:text-[#FF7043] focus-visible:ring-2 focus-visible:ring-orange-500"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            ) : (
              <>
                {!isEnterprise && showUpgrade && (
                  <Link
                    href="/recruiter/upgrade"
                    className="bg-[#FF7043] hover:bg-[#F4511E] text-white px-5 py-2 rounded-lg font-medium transition"
                  >
                    Upgrade
                  </Link>
                )}
                {showUserMenu && (
                  <div className="relative" ref={profileRef}>
                    <button
                      onClick={() => setOpenProfile((v) => !v)}
                      className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#333] focus-visible:ring-2 focus-visible:ring-orange-500"
                      aria-haspopup="true"
                      aria-expanded={openProfile}
                    >
                      <Avatar avatarUrl={avatarUrl} initials={initials} size="md" />
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>

                    {openProfile && (
                      <div
                        role="menu"
                        className="absolute right-0 mt-2 w-48 bg-[#2f2f2f] border border-[#3a3a3a] rounded-md shadow-xl"
                      >
                        <Link
                          href={optionsHref}
                          className="block px-4 py-3 text-sm hover:bg-[#333]"
                          role="menuitem"
                        >
                          Options
                        </Link>
                        <Link
                          href={supportHref}
                          className="block px-4 py-3 text-sm hover:bg-[#333]"
                          role="menuitem"
                        >
                          Support
                        </Link>
                        <button
                          className="w-full text-left px-4 py-3 text-sm hover:bg-[#333]"
                          role="menuitem"
                          onClick={() => {
                            setOpenProfile(false);
                            router.push("/logout");
                          }}
                        >
                          Log Out
                        </button>
                        {process.env.NODE_ENV !== "production" && (
                          <button
                            onClick={togglePlan}
                            className="w-full text-left px-4 py-3 text-xs text-gray-400 hover:bg-[#333]"
                          >
                            Toggle Plan (Dev)
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Mobile Hamburger */}
          <div className="md:hidden flex justify-end">
            <button
              onClick={() => setOpenMobile((v) => !v)}
              aria-label="Toggle menu"
              aria-expanded={openMobile}
              className="p-3 rounded-md hover:bg-[#333] focus-visible:ring-2 focus-visible:ring-orange-500"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {openMobile ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </nav>
      </header>

      {openMobile && (
        <div className="fixed inset-0 z-[99999] bg-[#2a2a2a] overflow-y-auto">
          <div className="px-8 py-12 min-h-screen flex flex-col">
            <button
              onClick={() => setOpenMobile(false)}
              className="self-end p-4 mb-12 focus-visible:ring-4 focus-visible:ring-orange-500 rounded-full"
              aria-label="Close menu"
            >
              <svg
                className="h-12 w-12 text-gray-400 hover:text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <Link
              href={brandHref}
              onClick={() => setOpenMobile(false)}
              className="flex items-center gap-4 mb-12"
            >
              <img
                src="/favicon-32x32.png"
                alt={brandLabel}
                className="h-12 w-12 rounded"
              />
              <div className="text-[#FF7043] font-black text-3xl sm:text-4xl md:text-5xl leading-tight break-words">
                {brandLabel}
              </div>
            </Link>

            <nav className="flex flex-col gap-8 flex-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpenMobile(false)}
                  className="text-2xl sm:text-3xl font-medium text-gray-300 hover:text-[#FF7043] focus:text-[#FF7043] focus:outline-none focus:ring-4 focus:ring-orange-500 rounded-2xl py-4 transition"
                >
                  {item.label}
                </Link>
              ))}

              <Link
                href="/pricing"
                onClick={() => setOpenMobile(false)}
                className="bg-[#FF7043] text-white text-2xl sm:text-3xl font-bold text-center py-6 sm:py-8 rounded-2xl hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-300 transition shadow-2xl"
              >
                Get Started
              </Link>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
