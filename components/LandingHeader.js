import EnterpriseHeader from "@/components/layouts/EnterpriseHeader";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/pricing", label: "Sign Up" },   // ← FIXED: now goes to pricing first
  { href: "/login", label: "Login" },
];

export default function LandingHeader() {
  return (
    <EnterpriseHeader
      brandHref="/"
      brandLabel="ForgeTomorrow"
      sectionLabel=""
      navItems={navItems}
      showUpgrade={false}
      alignWithGrid={false}
      optionsHref="/help"
      supportHref="/support"
      showPlanBadge={false}
      publicVariant={true}
      showUserMenu={false}
      containerClass="max-w-7xl pl-6 pr-6 md:pr-10"
      leftClass="flex items-center min-w-0 gap-4 md:gap-6 pr-6 md:pr-8"
    />
  );
}