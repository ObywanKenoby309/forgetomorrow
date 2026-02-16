// components/coaching/CoachingHeader.js
import EnterpriseHeader from "@/components/layouts/EnterpriseHeader";

// ✅ NEW
import { useEffect, useState } from "react";

// Coaching uses NO plan badge (handled inside EnterpriseHeader when sectionLabel === "Coaching Suite")
const navItems = [
  { href: "/coaching-dashboard", label: "Dashboard" },
  { href: "/coaching/messaging", label: "Messaging" },
  { href: "/dashboard/coaching/client-hub", label: "Client Hub" },
  { href: "/dashboard/coaching/sessions/calendar", label: "Calendar" },
  { href: "/dashboard/coaching/resources", label: "Resources" },
  { href: "/dashboard/coaching/feedback", label: "Feedback" },
];

export default function CoachingHeader() {
  // ✅ NEW: unread dot for Action Center (shown on Dashboard in header)
  const [hasActionUnread, setHasActionUnread] = useState(false);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const res = await fetch("/api/notifications/unread-count?scope=COACH", {
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

  // ✅ NEW: add dot to Dashboard label
  const navItemsWithDot = navItems.map((item) => {
    const isDashboard = item.href === "/coaching-dashboard";
    const label = isDashboard && hasActionUnread ? `${item.label} ●` : item.label;
    return { ...item, label };
  });

  return (
    <EnterpriseHeader
      brandHref="/coaching-dashboard"
      brandLabel="ForgeTomorrow"
      sectionLabel="Coaching Suite" // triggers badge suppression
      navItems={navItemsWithDot}
      showUpgrade={false}
      alignWithGrid={true}
      // ✅ Universal Settings page
      optionsHref="/settings"
      // ✅ Support (EnterpriseHeader will add returnTo)
      supportHref="/support"
    />
  );
}
