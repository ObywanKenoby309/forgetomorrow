// components/seeker/SeekerHeader.js
import { useRouter } from "next/router";
import EnterpriseHeader from "@/components/layouts/EnterpriseHeader";
import { usePlan } from "@/context/PlanContext";

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

  const navItems = BASE_NAV_ITEMS.map((item) => ({
    ...item,
    href: withChrome(item.href),
  }));

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
