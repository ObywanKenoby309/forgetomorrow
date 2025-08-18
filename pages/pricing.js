// pages/pricing.js
import Head from "next/head";
import PricingPlans from "../components/PricingPlans";

export default function PricingPage() {
  return (
    <>
      <Head>
        <title>ForgeTomorrow — Pricing</title>
      </Head>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 300px", // main content + right sidebar only
          gap: 20,
          padding: "30px",
          alignItems: "start",
        }}
      >
        {/* Pricing Cards */}
        <main>
          <PricingPlans />
        </main>

        {/* Right Sidebar */}
        <aside
          style={{
            backgroundColor: "#000", // solid black
            borderRadius: 12,
            padding: 16,
            color: "white",
            minHeight: 120,
          }}
        >
          <h3 className="text-lg font-semibold mb-4">Need Help?</h3>
          <p className="text-sm mb-2">
            Our team is here to guide you in choosing the right plan.
          </p>
          <button className="w-full py-2 rounded bg-[#FF7043] hover:bg-[#F4511E] text-white font-semibold">
            Contact Support
          </button>
        </aside>
      </div>
    </>
  );
}
