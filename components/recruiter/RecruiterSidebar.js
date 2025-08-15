// components/recruiter/RecruiterSidebar.js
import React from "react";
import Link from "next/link";

export default function RecruiterSidebar() {
  const navItems = [
    { label: "Dashboard", href: "/recruiter/dashboard" },
    { label: "Candidates", href: "/recruiter/candidates" },
    { label: "Job Postings", href: "/recruiter/job-postings" },
    { label: "Messaging", href: "/recruiter/messaging" },
  ];

  return (
    <div
      style={{
        background: "#fff",
        padding: "20px",
        borderRadius: "12px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      {navItems.map((item, idx) => (
        <div key={idx}>
          <div
            style={{
              fontSize: "14px",
              fontWeight: "500",
              marginBottom: "6px",
              color: "#FF7043",
            }}
          >
            {item.label}
          </div>
          <Link
            href={item.href}
            style={{
              display: "block",
              background: "linear-gradient(135deg, #FF6F43, #FF8E53)",
              padding: "10px 14px",
              borderRadius: "30px",
              fontWeight: "bold",
              color: "#fff",
              textAlign: "center",
              textDecoration: "none",
              boxShadow: "0 3px 6px rgba(255,112,67,0.4)",
              transition: "all 0.25s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.05)";
              e.currentTarget.style.boxShadow =
                "0 4px 12px rgba(255,112,67,0.6)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow =
                "0 3px 6px rgba(255,112,67,0.4)";
            }}
          >
            {item.label}
          </Link>
        </div>
      ))}
    </div>
  );
}
