// components/recruiter/RecruiterHeader.js
import EnterpriseHeader from "@/components/layouts/EnterpriseHeader";

// ✅ NEW
import { useEffect, useState } from "react";

const navItems = [
  { href: "/recruiter/dashboard", label: "Dashboard" },
  { href: "/recruiter/messaging", label: "Messaging" },
  { href: "/recruiter/candidate-center", label: "Candidate Center" },
  { href: "/recruiter/calendar", label: "Calendar" },
  { href: "/recruiter/job-postings", label: "Job Postings" },
  { href: "/recruiter/analytics", label: "Analytics" },
];

export default function RecruiterHeader() {
  // ✅ NEW: unread dot for Action Center (shown on Dashboard in header)
  const [hasActionUnread, setHasActionUnread] = useState(false);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const res = await fetch(
          "/api/notifications/unread-count?scope=RECRUITER",
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }
        );

        if (!res.ok) return;
        const data = await res.json();
        if (!alive) return;

        setHasActionUnread(!!data?.hasUnread);
      } catch {
        // swallow - no dot if API fails
      }
    };

    const onRefresh = () => load();

    load();
    const t = setInterval(load, 25000);

    if (typeof window !== "undefined") {
      window.addEventListener("ft-notifications-updated", onRefresh);
      window.addEventListener("focus", onRefresh);
      document.addEventListener("visibilitychange", onRefresh);
    }

    return () => {
      alive = false;
      clearInterval(t);

      if (typeof window !== "undefined") {
        window.removeEventListener("ft-notifications-updated", onRefresh);
        window.removeEventListener("focus", onRefresh);
        document.removeEventListener("visibilitychange", onRefresh);
      }
    };
  }, []);

  // ✅ NEW: add dot to Dashboard label
  const navItemsWithDot = navItems.map((item) => {
    const isDashboard = item.href === "/recruiter/dashboard";
    const label = isDashboard && hasActionUnread ? `${item.label} ●` : item.label;
    return { ...item, label };
  });

  return (
    <EnterpriseHeader
      brandHref="/recruiter/dashboard"
      brandLabel="ForgeTomorrow"
      sectionLabel="Recruiter Suite"
      navItems={navItemsWithDot}
      showUpgrade={true}
      alignWithGrid={true}
      // ✅ Universal Settings page
      optionsHref="/settings"
      // ✅ Support (EnterpriseHeader will add returnTo)
      supportHref="/support"
    />
  );
}