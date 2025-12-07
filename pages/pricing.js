// pages/pricing.js
import Head from "next/head";
import { useState, useEffect } from "react";

export const dynamic = "force-dynamic";

const plans = {
  "job-seeker-free": {
    key: "job-seeker-free",
    name: "Job Seeker (Free)",
    price: "$0",
    button: "Get Started",
  },
  "job-seeker-pro": {
    key: "job-seeker-pro",
    name: "Job Seeker (Pro)",
    price: "$9.99 / month",
    priceId: "price_1SUQc00l9wtvF7U5Kfo04KZU",
    button: "Upgrade Now",
  },
  "coach-mentor": {
    key: "coach-mentor",
    name: "Coaches / Mentors",
    price: "$39.99 / month",
    priceId: "price_1SUQcs0l9wtvF7U5aLqzGV2q",
    button: "Upgrade Now",
  },
  "recruiter-smb": {
    key: "recruiter-smb",
    name: "Recruiter SMB",
    price: "$99.99 / month",
    priceId: "price_1SUQdf0l9wtvF7U5nPY1bnLe",
    button: "Upgrade Now",
  },
  "enterprise-recruiter": {
    key: "enterprise-recruiter",
    name: "Enterprise Recruiter",
    price: "Contact Sales",
    button: "Contact Sales",
  },
};

export default function PricingPage() {
  const [loading, setLoading] = useState(null);

  // ✅ Mobile-first to avoid broken first paint on phones
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      if (typeof window === "undefined") return;
      setIsMobile(window.innerWidth < 768);
    };

    handleResize(); // run once on mount
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Single click handler — routes every plan
  const handleClick = (planKey) => {
    setLoading(planKey);

    if (planKey === "enterprise-recruiter") {
      window.location.href = "mailto:sales@forgetomorrow.com";
      setLoading(null);
      return;
    }

    // All other plans → staged registration page
    window.location.href = `/register/${planKey}`;
  };

  const containerStyle = {
    display: isMobile ? "block" : "grid",
    gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 2fr) 320px",
    gap: isMobile ? 24 : 40,
    padding: isMobile ? "24px 16px 40px" : "40px 20px 60px",
    alignItems: "start",
    maxWidth: 1200,
    margin: "0 auto",
    boxSizing: "border-box",
  };

  const asideStyle = {
    backgroundColor: "#0b0b0b",
    borderRadius: 12,
    padding: 24,
    color: "white",
    height: "fit-content",
    marginTop: isMobile ? 24 : 0,
  };

  return (
    <>
      <Head>
        <title>ForgeTomorrow — Choose Your Plan</title>
      </Head>

      <div style={containerStyle}>
        <main
          style={{
            display: "grid",
            // 🔹 MOBILE: 1 column list (scrolls)
            // 🔹 DESKTOP: fixed 3 columns → 3 cards on top row, 2 on second
            gridTemplateColumns: isMobile
              ? "1fr"
              : "repeat(3, minmax(0, 1fr))",
            gap: 24,
          }}
        >
          {Object.entries(plans).map(([key, plan]) => (
            <div
              key={key}
              tabIndex={0}
              role="region"
              aria-label={`${plan.name} plan`}
              style={{
                border: "2px solid #111",
                borderRadius: 12,
                padding: 24,
                textAlign: "left",
                background: "#ffffff",
                color: "#111",
                boxShadow: "0 6px 20px rgba(0,0,0,0.04)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: 260,
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: "1.25rem",
                    marginBottom: 6,
                    color: "#111",
                    fontWeight: 700,
                  }}
                >
                  {plan.name}
                </h2>
                <p
                  style={{
                    fontSize: "1.6rem",
                    fontWeight: 700,
                    margin: "8px 0 18px",
                    color: "#111",
                  }}
                >
                  {plan.price}
                </p>

                <div
                  style={{
                    fontSize: "0.95rem",
                    lineHeight: "1.5",
                    color: "#222",
                    marginBottom: 18,
                  }}
                >
                  {key === "job-seeker-free" && (
                    <>
                      <p style={{ margin: "6px 0" }}>
                        • 1x1 Unlimited messaging (Direct Contacts)
                      </p>
                      <p style={{ margin: "6px 0" }}>
                        • View verified job listings
                      </p>
                      <p style={{ margin: "6px 0" }}>
                        • Resume & cover letter builder (limited)
                      </p>
                    </>
                  )}
                  {key === "job-seeker-pro" && (
                    <>
                      <p style={{ margin: "6px 0" }}>
                        • Profile analytics & insights
                      </p>
                      <p style={{ margin: "6px 0" }}>
                        • Unlimited AI resume & cover letters
                      </p>
                      <p style={{ margin: "6px 0" }}>
                        • Priority listings & search filters
                      </p>
                    </>
                  )}
                  {key === "coach-mentor" && (
                    <>
                      <p style={{ margin: "6px 0" }}>
                        • Mentee tracking & analytics
                      </p>
                      <p style={{ margin: "6px 0" }}>
                        • Client organizer and templates
                      </p>
                      <p style={{ margin: "6px 0" }}>
                        • Daily agenda & newsletter tools
                      </p>
                    </>
                  )}
                  {key === "recruiter-smb" && (
                    <>
                      <p style={{ margin: "6px 0" }}>
                        • Limited seats for recruiters
                      </p>
                      <p style={{ margin: "6px 0" }}>
                        • Job posting board & candidate tracker
                      </p>
                      <p style={{ margin: "6px 0" }}>
                        • Group messaging & team calendar
                      </p>
                    </>
                  )}
                  {key === "enterprise-recruiter" && (
                    <>
                      <p style={{ margin: "6px 0" }}>
                        • Tailored seats for your business
                      </p>
                      <p style={{ margin: "6px 0" }}>
                        • Advanced candidate filtering & ATS match
                      </p>
                      <p style={{ margin: "6px 0" }}>
                        • Job posting analytics & account management
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div>
                <button
                  onClick={() => handleClick(key)}
                  disabled={loading === key}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    background: "#FF7043",
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {loading === key ? "Loading…" : plan.button}
                </button>

                {key === "enterprise-recruiter" && (
                  <a
                    href="mailto:sales@forgetomorrow.com"
                    style={{
                      display: "block",
                      marginTop: 12,
                      textAlign: "center",
                      color: "#111",
                      textDecoration: "underline",
                    }}
                  >
                    Or email sales@forgetomorrow.com
                  </a>
                )}
              </div>
            </div>
          ))}
        </main>

        <aside style={asideStyle}>
          <h3 style={{ fontSize: "1.25rem", marginBottom: 12 }}>Need Help?</h3>
          <p
            style={{
              marginBottom: 16,
              fontSize: "0.95rem",
              color: "#ddd",
            }}
          >
            Our team is here to guide you in choosing the right plan.
          </p>
          <button
            onClick={() => (window.location.href = "/support")}
            style={{
              width: "100%",
              padding: "12px",
              background: "#FF7043",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontWeight: 700,
            }}
          >
            Contact Support
          </button>
          <div
            style={{
              marginTop: 18,
              fontSize: "0.85rem",
              color: "#bbb",
            }}
          >
            <p style={{ marginBottom: 6 }}>
              After registration you’ll receive a verification email.
            </p>
            <p>
              Free accounts activate instantly. Paid plans proceed to secure
              checkout.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
