// components/coaching/CoachingHeader.js
import EnterpriseHeader from "@/components/layouts/EnterpriseHeader";

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
  return (
    <EnterpriseHeader
      brandHref="/coaching-dashboard"
      brandLabel="ForgeTomorrow"
      sectionLabel="Coaching Suite" // triggers badge suppression
      navItems={navItems}
      showUpgrade={false}
      alignWithGrid={true}
      // ✅ Universal Settings page
      optionsHref="/settings"
      // ✅ Support (EnterpriseHeader will add returnTo)
      supportHref="/support"
    />
  );
}
