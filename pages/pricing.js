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
  background: "rgba(255,255,255,.055)",
  border: "1px solid rgba(255,255,255,.10)",
  borderRadius: 18,
  padding: 24,
  color: "#fff",
  height: "fit-content",
  marginTop: isMobile ? 24 : 0,
  boxShadow: "0 20px 70px rgba(0,0,0,.28)",
  backdropFilter: "blur(18px)",
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

    <main
      style={{
        minHeight: "100vh",
        background: "#070B12",
        color: "#ffffff",
      }}
    >
      {/* HERO */}
      <section
        className="relative overflow-hidden"
        style={{ marginTop: "-40px", marginBottom: "64px" }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "url('/images/forge-bg-bw.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
			backgroundRepeat: "no-repeat",
			opacity: 1,
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,.65)",
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 50% 20%, rgba(255,112,67,.12), transparent 60%)",
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,.20), rgba(0,0,0,.45), #070B12)",
          }}
        />

        <div
          style={{
            position: "relative",
            maxWidth: 1280,
            minHeight: "60vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto",
            padding: "96px 24px",
            textAlign: "center",
          }}
        >
          <div style={{ maxWidth: 900 }}>
            <h1
              style={{
                fontSize: "clamp(64px,8vw,120px)",
                fontWeight: 900,
                lineHeight: ".95",
                margin: 0,
              }}
            >
              Pricing
            </h1>

            <p
              style={{
                marginTop: 32,
                fontSize: "clamp(20px,2vw,36px)",
                color: "#FF7043",
                fontWeight: 700,
              }}
            >
              Simple, transparent pricing.
            </p>

            <p
              style={{
                margin: "22px auto 0",
                maxWidth: 620,
                fontSize: "clamp(16px,2vw,20px)",
                lineHeight: 1.6,
                color: "rgba(255,255,255,.75)",
              }}
            >
              No hidden fees. No surprise upgrades.
            </p>
          </div>
        </div>
      </section>

      <div style={containerStyle}>
<div
  style={{
    display: "block",
  }}
>
          {groups.map((group, idx) => {
            const isTwoCol = !isMobile && group.keys.length === 2;

            return (
              <section key={idx} style={{ marginBottom: 56 }}>
                <div
  style={{
    fontSize: "0.95rem",
    fontWeight: 700,
color: "#FFB199",
marginBottom: 18,
textAlign: "center",
textTransform: "uppercase",
letterSpacing: ".20em",
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
  border: "1px solid rgba(255,255,255,.10)",
  borderRadius: 18,
  padding: 24,
  textAlign: "left",
  background: "rgba(255,255,255,.055)",
  color: "#fff",
  boxShadow: "0 20px 70px rgba(0,0,0,.28)",
  backdropFilter: "blur(18px)",
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
    color: "#ffffff",
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
    color: "#ffffff",
  }}
>
                            {plan.price}
                          </p>

                          <div
  style={{
    fontSize: "0.95rem",
    lineHeight: "1.5",
    color: "#CBD5E1",
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
                                color: "#FFB199",
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
                                color: "#FFB199",
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
        </div>

        <aside style={asideStyle}>
          <h3 style={{ fontSize: "1.25rem", marginBottom: 12 }}>Need Help?</h3>
          <p
            style={{
              marginBottom: 16,
              fontSize: "0.95rem",
              color: "#CBD5E1",
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
              color: "#CBD5E1",
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
	  </main>
    </>
  );
}
