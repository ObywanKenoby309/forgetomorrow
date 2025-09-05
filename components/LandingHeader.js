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
      sectionLabel=""             // no subtitle
      navItems={navItems}
      showUpgrade={false}
      alignWithGrid={false}
      optionsHref="/help"
      supportHref="/support"
      showPlanBadge={false}       // hide plan badge on public
      publicVariant={true}        // public spacing preset
      showUserMenu={false}        // NEW: hide FT circle/avatar on public pages
    />
  );
}
