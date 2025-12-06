// components/common/ManageBillingButton.js
import { useState } from "react";

export default function ManageBillingButton() {
  const [loading, setLoading] = useState(false);

  async function openPortal() {
    try {
      setLoading(true);
      const res = await fetch("/api/billing/portal", {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Failed to create billing portal session");
      }

      const json = await res.json();

      if (json.url) {
        window.location.href = json.url; // Redirect to Stripe portal
      } else {
        throw new Error("Portal URL missing");
      }
    } catch (err) {
      console.error("[BillingPortal] Error:", err);
      alert("Unable to open billing portal. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={openPortal}
      disabled={loading}
      className="inline-flex items-center justify-center px-4 py-2 rounded-full text-sm font-semibold bg-[#FF7043] text-white hover:bg-[#F4511E] transition disabled:opacity-60"
    >
      {loading ? "Loading…" : "Manage Billing"}
    </button>
  );
}
