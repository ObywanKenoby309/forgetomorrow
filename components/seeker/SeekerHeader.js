// components/seeker/SeekerHeader.js
import { useRouter } from "next/router";
import EnterpriseHeader from "@/components/layouts/EnterpriseHeader";
import { usePlan } from "@/context/PlanContext";

// Base nav items (seeker-space routes)
const BASE_NAV_ITEMS = [
  { href: "/seeker-dashboard", label: "Seeker Dashboard" },
  { href: "/feed", label: "Community Feed" },
  { href: "/seeker/messages", label: "The Signal" },
  { href: "/jobs", label: "The Pipeline" },
  // 🔧 Go through /seeker/the-hearth so chrome can be preserved and redirect to shared Hearth
  { href: "/seeker/the-hearth", label: "Your Hearth" },
];

export default function SeekerHeader() {
  const router = useRouter();
  const { isEnterprise } = usePlan(); // treat "paid" state as true -> Pro

  // If we came in from recruiter/coach chrome, keep that on all links
  const chrome = String(router.query.chrome || "").toLowerCase();

  const withChrome = (href) => {
    if (!chrome) return href;
    return href.includes("?")
      ? `${href}&chrome=${chrome}`
      : `${href}?chrome=${chrome}`;
  };

  const navItems = BASE_NAV_ITEMS.map((item) => ({
    ...item,
    href: withChrome(item.href),
  }));

  const planLabel = isEnterprise ? "Pro" : "Basic";

  return (
    <EnterpriseHeader
      brandHref={withChrome("/seeker-dashboard")}
      brandLabel="ForgeTomorrow"
      sectionLabel="Job Seeker"
      planLabel={planLabel}
      navItems={navItems}
      showUpgrade={false}
      alignWithGrid={true}
      // ✅ Settings preserves chrome
      optionsHref={withChrome("/settings")}
      // ✅ Support also preserves chrome; EnterpriseHeader adds returnTo
      supportHref={withChrome("/support")}
    />
  );
}
