// components/recruiter/RecruiterHeader.js
import EnterpriseHeader from "@/components/layouts/EnterpriseHeader";

const navItems = [
  { href: "/recruiter/dashboard", label: "Dashboard" },
  { href: "/recruiter/messaging", label: "Messaging" },
  { href: "/recruiter/candidate-center", label: "Candidate Center" },
  { href: "/recruiter/calendar", label: "Calendar" },
  { href: "/recruiter/job-postings", label: "Job Postings" },
  { href: "/recruiter/analytics", label: "Analytics" },
];

export default function RecruiterHeader() {
  return (
    <EnterpriseHeader
      brandHref="/recruiter/dashboard"
      brandLabel="ForgeTomorrow"
      sectionLabel="Recruiter Suite"
      navItems={navItems}
      showUpgrade={true}
      alignWithGrid={true}
      // ✅ Universal Settings page
      optionsHref="/settings"
      // ✅ Support (EnterpriseHeader will add returnTo)
      supportHref="/support"
    />
  );
}
