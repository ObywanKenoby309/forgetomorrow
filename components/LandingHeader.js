import EnterpriseHeader from "@/components/layouts/EnterpriseHeader";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/signup", label: "Sign Up" },
  { href: "/login", label: "Login" },
];

export default function LandingHeader() {
  return (
    <EnterpriseHeader
      brandHref="/"
      brandLabel="ForgeTomorrow"
      sectionLabel=""               // no "Public" label
      navItems={navItems}
      showUpgrade={false}
      alignWithGrid={false}
      optionsHref="/help"
      supportHref="/support"
      showPlanBadge={false}         // hide plan badge on public

      // 🔧 Spacing overrides (left/right only)
      containerClass="max-w-7xl mx-auto px-8"          // wider outer padding on public
      leftClass="gap-4 md:gap-6 pr-6 md:pr-8"          // more space between logo/label/badge area
      rightClass="gap-4 md:gap-6 pl-6 md:pl-8"         // more space around actions/profile
      // navGapClass not touched (center looked correct)
      // heightClass not touched (inherits h-14)
    />
  );
}
