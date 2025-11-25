// components/UniversalHeader.js
import Link from "next/link";
import { useRouter } from "next/router";
import { usePlan } from "@/context/PlanContext";
import { useState, useRef, useEffect } from "react";
import { useCurrentUserAvatar } from "@/hooks/useCurrentUserAvatar";

export default function UniversalHeader() {
  const { role } = usePlan(); // 'seeker' | 'recruiter' | 'coach' | etc.
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const { avatarUrl, initials } = useCurrentUserAvatar();

  useEffect(() => {
    const onDoc = (e) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const backLinks = {
    recruiter: { href: "/recruiter", label: "Recruiter Dashboard" },
    seeker: { href: "/seeker-dashboard", label: "Seeker Dashboard" },
    coach: { href: "/coaching-dashboard", label: "Coaching Dashboard" },
  };
  const back = role ? backLinks[role] : null;

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-14"
      style={{ background: "#1e1f21", boxShadow: "0 1px 0 rgba(0,0,0,0.35)" }}
    >
      <div className="mx-auto max-w-[1200px] h-full px-4 flex items-center justify-between gap-4">
        {/* Left: Logo (always returns to /feed) */}
        <div className="flex items-center gap-3">
          <Link href="/feed" className="text-white font-extrabold text-lg">
            <span className="text-[#FF7043]">ForgeTomorrow</span>
          </Link>
          {back && (
            <Link
              href={back.href}
              className="hidden sm:inline-block text-sm text-gray-300 hover:text-[#FF8A65]"
              title={`Back to ${back.label}`}
            >
              ← {back.label}
            </Link>
          )}
        </div>

        {/* Center: Search */}
        <div className="flex-1 hidden md:flex">
          <input
            type="text"
            placeholder="Search ForgeTomorrow…"
            className="w-full rounded-md px-3 py-2 text-sm bg-white outline-none"
          />
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-3">
          {/* The Signal */}
          <Link
            href="/seeker/messages"
            className="relative text-sm text-gray-200 hover:text-white"
            title="Open The Signal"
          >
            The Signal
            <span
              className="ml-1 inline-flex items-center justify-center text-[10px] font-bold text-white rounded-full px-1.5 h-4"
              style={{ background: "#FF7043" }}
            >
              •
            </span>
          </Link>

          {/* Avatar + menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="w-8 h-8 rounded-full border border-black/30 outline-none overflow-hidden bg-gray-600 flex items-center justify-center text-xs font-bold text-white"
              title="Account"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={initials || "Profile"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{initials || "?"}</span>
              )}
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 mt-2 w-48 rounded-md shadow-lg overflow-hidden"
                style={{ background: "#2a2b2e", border: "1px solid #3a3b3f" }}
              >
                <Link
                  href="/settings"
                  className="block px-3 py-2 text-sm text-gray-200 hover:bg-[#FF7043] hover:text-white"
                  onClick={() => setMenuOpen(false)}
                >
                  Settings
                </Link>
                <Link
                  href="/the-hearth"
                  className="block px-3 py-2 text-sm text-gray-200 hover:bg-[#FF7043] hover:text-white"
                  onClick={() => setMenuOpen(false)}
                >
                  Support / The Hearth
                </Link>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    alert("Log out (wire your auth here)");
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-[#FF7043] hover:text-white"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
