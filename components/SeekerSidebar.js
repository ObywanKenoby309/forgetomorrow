// components/SeekerSidebar.js
import Link from "next/link";

export default function SeekerSidebar() {
  const navItems = [
    { label: "Seeker Dashboard", href: "/seeker-dashboard" },
    { label: "Your Roadmap", href: "/roadmap" },
    { label: "Open Creator", href: "/resume-cover" },
    { label: "To The Pipeline", href: "/jobs" },
    { label: "Visit Your Hearth", href: "/the-hearth" },
  ];

  return (
    <aside
      style={{
        backgroundColor: "white",
        padding: "20px 15px",
        borderRadius: "12px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        width: "100%",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      }}
    >
      {navItems.map((item, index) => (
        <Link key={index} href={item.href} legacyBehavior>
          <button
            style={{
              display: "block",
              padding: "12px 16px",
              borderRadius: "8px",
              fontWeight: "600",
              fontSize: "0.95rem",
              textAlign: "center",
              background: "#FF7043",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              transition: "all 0.2s ease-in-out",
              boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
              width: "100%",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#F4511E";
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 6px 12px rgba(0,0,0,0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#FF7043";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 2px 6px rgba(0,0,0,0.06)";
            }}
          >
            {item.label}
          </button>
        </Link>
      ))}
    </aside>
  );
}
