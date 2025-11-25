// components/recruiter/RecruiterHeader.js
import EnterpriseHeader from "@/components/layouts/EnterpriseHeader";

const navItems = [
  { href: "/recruiter/dashboard", label: "Dashboard" },
  { href: "/recruiter/job-postings", label: "Job Postings" },
  { href: "/recruiter/candidates", label: "Candidates" },
  { href: "/recruiter/messaging", label: "Messaging" },
  { href: "/recruiter/analytics", label: "Analytics" },
];

export default function RecruiterHeader() {
  return (
    <EnterpriseHeader
      brandHref="/recruiter/dashboard"
      brandLabel="ForgeTomorrow"
      sectionLabel="Recruiter Suite"
      navItems={navItems}
      showUpgrade={true}          // ✅ recruiters still see upgrade
      alignWithGrid={true}        // ✅ keep layout aligned
      optionsHref="/recruiter/options" // ✅ settings page for recruiters
      supportHref="/support"           // ✅ consistent support link
    />
  );
}
