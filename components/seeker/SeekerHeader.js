// components/seeker/SeekerHeader.js
import { useRouter } from "next/router";
import EnterpriseHeader from "@/components/layouts/EnterpriseHeader";
import { usePlan } from "@/context/PlanContext";

// ✅ NEW
import { useEffect, useState } from "react";

// Seeker header should be "clean + hub-like":
// Dashboard | The Signal | Community Feed | Calendar | Job Postings
const BASE_NAV_ITEMS = [
  { href: "/seeker-dashboard", label: "Dashboard" },
  { href: "/seeker/messages", label: "The Signal" },
  { href: "/feed", label: "Community Feed" },
  { href: "/seeker/calendar", label: "Calendar" },
  { href: "/jobs", label: "Job Postings" },
];

export default function SeekerHeader() {
  const router = useRouter();
  const { isProTier } = usePlan();

  // Preserve chrome when seeker pages are being viewed in coach/recruiter chrome
  const chrome = String(router.query.chrome || "").toLowerCase();

  const withChrome = (href) => {
    if (!chrome) return href;
    return href.includes("?") ? `${href}&chrome=${chrome}` : `${href}?chrome=${chrome}`;
  };

  // ✅ NEW: unread dot for Action Center (shown on Dashboard in header)
  const [hasActionUnread, setHasActionUnread] = useState(false);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const res = await fetch("/api/notifications/unread-count?scope=SEEKER", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        if (!res.ok) return;
        const data = await res.json();
        if (!alive) return;

        setHasActionUnread(!!data?.hasUnread);
      } catch {
        // swallow - no dot if API fails
      }
    };

    load();
    const t = setInterval(load, 25000);

    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const navItems = BASE_NAV_ITEMS.map((item) => {
    // ✅ NEW: show dot beside Dashboard if Action Center has unread items
    const isDashboard = item.href === "/seeker-dashboard";
    const label = isDashboard && hasActionUnread ? `${item.label} ●` : item.label;

    return {
      ...item,
      label,
      href: withChrome(item.href),
    };
  });

  const planLabel = isProTier ? "Seeker Pro" : "Seeker Free";

  return (
    <EnterpriseHeader
      brandHref={withChrome("/seeker-dashboard")}
      brandLabel="ForgeTomorrow"
      sectionLabel="Job Seeker"
      planLabel={planLabel}
      navItems={navItems}
      showUpgrade={false}
      alignWithGrid={true}
      optionsHref={withChrome("/settings")}
      supportHref={withChrome("/support")}
    />
  );
}
