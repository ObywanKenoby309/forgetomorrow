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

  // ✅ One-time paid diagnostic
  "hiring-diagnostic": {
    key: "hiring-diagnostic",
    name: "Hiring Diagnostic (48 Hours)",
    price: "$99 (one-time)",
    button: "Buy Diagnostic",
  },

  // ✅ NEW: One-time internal review
  "internal-hiring-review": {
    key: "internal-hiring-review",
    name: "Internal Hiring Process Review",
    price: "$249 (one-time)",
    button: "Buy Internal Review",
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

    // ✅ Hiring Diagnostic → Stripe checkout
    if (planKey === "hiring-diagnostic") {
      window.location.href = "https://buy.stripe.com/3cI00bgJZ1gqbRBbC73Nm00";
      setLoading(null);
      return;
    }

    // ✅ Internal Hiring Review → Stripe checkout (NEW LINK)
    if (planKey === "internal-hiring-review") {
      window.location.href = "https://buy.stripe.com/9B6cMXeBR3oycVF7lR3Nm01";
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

  // ✅ Group definitions (3 / 2 / 2)
  const groups = [
    {
      title: "Individuals",
      keys: ["job-seeker-free", "job-seeker-pro", "coach-mentor"],
    },
    {
      title: "Recruiters",
      keys: ["recruiter-smb", "enterprise-recruiter"],
    },
    {
      title: "One-time packages",
      keys: ["hiring-diagnostic", "internal-hiring-review"],
    },
  ];

  return (
    <>
      <Head>
        <title>ForgeTomorrow — Choose Your Plan</title>
      </Head>

      <div style={containerStyle}>
        <main
          style={{
            display: "block",
          }}
        >
          {groups.map((group, idx) => {
            const isTwoCol = !isMobile && group.keys.length === 2;

            return (
              <section key={idx} style={{ marginBottom: 28 }}>
                <div
  style={{
    fontSize: "0.95rem",
    fontWeight: 700,
    color: "#222",
    marginBottom: 12,
    textAlign: "center", // ✅ always centered
  }}
>
  {group.title}
</div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile
                      ? "1fr"
                      : `repeat(${group.keys.length}, minmax(0, 1fr))`,
                    gap: 24,

                    // ✅ Center 2-card rows on desktop
                    ...(isTwoCol
                      ? {
                          maxWidth: 820,
                          marginLeft: "auto",
                          marginRight: "auto",
                        }
                      : {}),
                  }}
                >
                  {group.keys.map((key) => {
                    const plan = plans[key];

                    return (
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

                            {key === "hiring-diagnostic" && (
                              <>
                                <p style={{ margin: "6px 0" }}>
                                  • 48-hour hiring workflow diagnostic
                                </p>
                                <p style={{ margin: "6px 0" }}>
                                  • Written report + Loom walkthrough
                                </p>
                                <p style={{ margin: "6px 0" }}>
                                  • One-time purchase (no subscription)
                                </p>
                              </>
                            )}

                            {key === "internal-hiring-review" && (
                              <>
                                <p style={{ margin: "6px 0" }}>
                                  • Leadership-focused internal review
                                </p>
                                <p style={{ margin: "6px 0" }}>
                                  • Consistency & risk assessment
                                </p>
                                <p style={{ margin: "6px 0" }}>
                                  • Report + Loom walkthrough (48 hours)
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

                                maxWidth: "100%",
                                overflowWrap: "anywhere",
                                wordBreak: "break-word",
                                lineHeight: 1.35,
                              }}
                            >
                              Or email sales@forgetomorrow.com
                            </a>
                          )}

                          {key === "hiring-diagnostic" && (
                            <a
                              href="https://buy.stripe.com/3cI00bgJZ1gqbRBbC73Nm00"
                              style={{
                                display: "block",
                                marginTop: 12,
                                textAlign: "center",
                                color: "#111",
                                textDecoration: "underline",
                                maxWidth: "100%",
                                overflowWrap: "anywhere",
                                wordBreak: "break-word",
                                lineHeight: 1.35,
                              }}
                            >
                              Or open Stripe checkout
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
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
