// pages/pricing.js → save as .tsx (or .jsx if you prefer)
import Head from "next/head";
import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";

// ← THIS LINE FIXES THE PRERENDER ERROR FOREVER
export const dynamic = "force-dynamic";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

const plans = {
  free: { name: "Free", price: "$0", button: "Get Started" },
  "job-seeker-pro": {
    name: "Job Seeker Pro",
    price: "$9.99/month",
    priceId: "price_1SUQc00l9wtvF7U5Kfo04KZU",
    button: "Upgrade Now",
  },
  "coach-mentor": {
    name: "Coaches / Mentors",
    price: "$39.99/month",
    priceId: "price_1SUQcs0l9wtvF7U5aLqzGV2q",
    button: "Upgrade Now",
  },
  "recruiter-smb": {
    name: "Recruiter SMB",
    price: "$99.99/month",
    priceId: "price_1SUQdf0l9wtvF7U5nPY1bnLe",
    button: "Upgrade Now",
  },
} as const;

type PlanKey = keyof typeof plans;

export default function PricingPage() {
  const [loading, setLoading] = useState<PlanKey | null>(null);

  const handleClick = async (planKey: PlanKey) => {
    setLoading(planKey);

    if (planKey === "free") {
      window.location.href = "/signup-free";
    } else {
      if (!stripePromise) {
        alert("Stripe is not loaded yet. Try again in a moment.");
        setLoading(null);
        return;
      }

      try {
        const res = await fetch("/api/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: planKey }),
        });

        const { url } = await res.json();
        window.location.href = url;
      } catch (err) {
        console.error(err);
        alert("Something went wrong. Please try again.");
      }
    }
    setLoading(null);
  };

  return (
    <>
      <Head>
        <title>ForgeTomorrow — Choose Your Plan</title>
      </Head>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 300px",
          gap: 40,
          padding: "40px 20px",
          alignItems: "start",
        }}
      >
        {/* Main Pricing Grid */}
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
              style={{
                border: "2px solid #333",
                borderRadius: 16,
                padding: 24,
                textAlign: "center",
                background: key === "job-seeker-pro" ? "#FFF8F0" : "#111",
                color: "#fff",
              }}
            >
              <h2 style={{ fontSize: "1.5rem", marginBottom: 8 }}>{plan.name}</h2>
              <p style={{ fontSize: "2rem", fontWeight: "bold", margin: "16px 0" }}>
                {plan.price}
              </p>

              {/* ← Your real feature list goes here */}
              <div
                style={{
                  textAlign: "left",
                  margin: "20px 0",
                  fontSize: "0.95rem",
                  lineHeight: "1.6",
                }}
              >
                <p>✓ Unlimited Applications</p>
                <p>✓ AI Resume Builder</p>
                <p>✓ Premium Support</p>
                {/* Add more real features */}
              </div>

              <button
                onClick={() => handleClick(key as PlanKey)}
                disabled={!!loading}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: "#FF7043",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: "bold",
                  cursor: "pointer",
                  marginTop: 20,
                }}
              >
                {loading === key ? "Loading…" : plan.button}
              </button>
            </div>
          ))}
        </main>

        {/* Right Sidebar */}
        <aside
          style={{
            backgroundColor: "#000",
            borderRadius: 12,
            padding: 24,
            color: "white",
            height: "fit-content",
          }}
        >
          <h3 style={{ fontSize: "1.4rem", marginBottom: 16 }}>Need Help?</h3>
          <p style={{ marginBottom: 20, fontSize: "0.95rem" }}>
            Our team is here to guide you in choosing the right plan.
          </p>
          <button
            style={{
              width: "100%",
              padding: "12px",
              background: "#FF7043",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontWeight: "bold",
            }}
          >
            Contact Support
          </button>
        </aside>
      </div>
    </>
  );
}