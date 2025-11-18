// pages/pricing.js
import Head from "next/head";
import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";

// THIS LINE KILLS THE PRERENDER ERROR FOREVER
export const dynamic = "force-dynamic";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const plans = {
  "job-seeker-free": { key: "job-seeker-free", name: "Job Seeker (Free)", price: "$0", button: "Get Started" },
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

  const handleClick = async (planKey) => {
    setLoading(planKey);

    if (planKey === "job-seeker-free") {
      // Route to your existing free signup page
      window.location.href = "/signup-free";
      return setLoading(null);
    }

    if (planKey === "enterprise-recruiter") {
      // Open mail client to contact sales
      window.location.href = "mailto:sales@forgetomorrow.com";
      return setLoading(null);
    }

    try {
      const stripe = await stripePromise;
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey }),
      });

      if (!res.ok) {
        console.error("Checkout session failed", await res.text());
        setLoading(null);
        return;
      }

      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (err) {
      console.error("Stripe checkout error", err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <Head>
        <title>ForgeTomorrow — Choose Your Plan</title>
      </Head>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 40, padding: "40px 20px", alignItems: "start" }}>
        <main
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
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
                <h2 style={{ fontSize: "1.25rem", marginBottom: 6, color: "#111", fontWeight: 700 }}>{plan.name}</h2>
                <p style={{ fontSize: "1.6rem", fontWeight: 700, margin: "8px 0 18px", color: "#111" }}>{plan.price}</p>

                <div style={{ fontSize: "0.95rem", lineHeight: "1.5", color: "#222", marginBottom: 18 }}>
                  {/* Short teaser bullets on the card — keep concise */}
                  {key === "job-seeker-free" && (
                    <>
                      <p style={{ margin: "6px 0" }}>• 1x1 Unlimited messaging (Direct Contacts)</p>
                      <p style={{ margin: "6px 0" }}>• View verified job listings</p>
                      <p style={{ margin: "6px 0" }}>• Resume & cover letter builder (limited)</p>
                    </>
                  )}

                  {key === "job-seeker-pro" && (
                    <>
                      <p style={{ margin: "6px 0" }}>• Profile analytics & insights</p>
                      <p style={{ margin: "6px 0" }}>• Unlimited AI resume & cover letters</p>
                      <p style={{ margin: "6px 0" }}>• Priority listings & search filters</p>
                    </>
                  )}

                  {key === "coach-mentor" && (
                    <>
                      <p style={{ margin: "6px 0" }}>• Mentee tracking & analytics</p>
                      <p style={{ margin: "6px 0" }}>• Client organizer and templates</p>
                      <p style={{ margin: "6px 0" }}>• Daily agenda & newsletter tools</p>
                    </>
                  )}

                  {key === "recruiter-smb" && (
                    <>
                      <p style={{ margin: "6px 0" }}>• Limited seats for recruiters</p>
                      <p style={{ margin: "6px 0" }}>• Job posting board & candidate tracker</p>
                      <p style={{ margin: "6px 0" }}>• Group messaging & team calendar</p>
                    </>
                  )}

                  {key === "enterprise-recruiter" && (
                    <>
                      <p style={{ margin: "6px 0" }}>• Tailored seats for your business</p>
                      <p style={{ margin: "6px 0" }}>• Advanced candidate filtering & ATS match</p>
                      <p style={{ margin: "6px 0" }}>• Job posting analytics & account management</p>
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

                {/* Secondary link for Enterprise: explicit mailto (also shows below) */}
                {key === "enterprise-recruiter" && (
                  <a
                    href="mailto:sales@forgetomorrow.com"
                    style={{ display: "block", marginTop: 12, textAlign: "center", color: "#111", textDecoration: "underline" }}
                  >
                    Or email sales@forgetomorrow.com
                  </a>
                )}
              </div>
            </div>
          ))}
        </main>

        <aside
          style={{
            backgroundColor: "#0b0b0b",
            borderRadius: 12,
            padding: 24,
            color: "white",
            height: "fit-content",
          }}
        >
          <h3 style={{ fontSize: "1.25rem", marginBottom: 12 }}>Need Help?</h3>
          <p style={{ marginBottom: 16, fontSize: "0.95rem", color: "#ddd" }}>
            Our team is here to guide you in choosing the right plan.
          </p>
          <button
            onClick={() => (window.location.href = "/support")}
            style={{ width: "100%", padding: "12px", background: "#FF7043", color: "white", border: "none", borderRadius: 8, fontWeight: 700 }}
          >
            Contact Support
          </button>

          <div style={{ marginTop: 18, fontSize: "0.85rem", color: "#bbb" }}>
            <p style={{ marginBottom: 6 }}>
              After purchase you'll be guided through account setup and onboarding.
            </p>
            <p>
              Free plan users will be routed to a basic signup flow (no payment required).
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
