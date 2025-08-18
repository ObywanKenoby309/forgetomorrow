// components/seeker/SeekerHeader.js
import EnterpriseHeader from "@/components/layouts/EnterpriseHeader";
import { usePlan } from "@/context/PlanContext";

const navItems = [
  { href: "/seeker-dashboard", label: "Seeker Dashboard" },
  { href: "/roadmap", label: "Your Roadmap" },
  { href: "/resume-cover", label: "Open Creator" },
  { href: "/jobs", label: "To The Pipeline" },
  { href: "/seeker/the-hearth/", label: "Visit Your Hearth" },
];

export default function SeekerHeader() {
  const { isEnterprise } = usePlan(); // treat "paid" state as true -> Pro

  const planLabel = isEnterprise ? "Pro" : "Basic";

  return (
    <EnterpriseHeader
      brandHref="/seeker-dashboard"
      brandLabel="ForgeTomorrow"
      sectionLabel="Job Seeker"
      planLabel={planLabel}     // <-- forces "Pro"/"Basic" text on the badge
      navItems={navItems}
      showUpgrade={false}       // no upsell in seeker header
      alignWithGrid={true}      // aligns with left sidebar grid
      optionsHref="/seeker/options"
      supportHref="/support"
    />
  );
}
