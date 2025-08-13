// components/recruiter/UpgradeModal.js
import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePlan } from "../../context/PlanContext";

export default function UpgradeModal({ open, onClose }) {
  const { isEnterprise } = usePlan();
  const closeBtnRef = useRef(null);
  const ctaRef = useRef(null);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Focus the primary CTA when opened (simple focus mgmt)
  useEffect(() => {
    if (open && ctaRef.current) ctaRef.current.focus();
  }, [open]);

  if (!open || isEnterprise) return null;

  const benefits = [
    "Unlimited job postings",
    "AI‑powered candidate matching & ranking",
    "Full ATS workflow with automation & bulk actions",
    "Advanced analytics & source tracking",
    "Access to the Forge Talent Pool",
    "Up to 10 recruiter/admin seats",
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-title"
      aria-describedby="upgrade-desc"
    >
      {/* Backdrop */}
      <button
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-label="Close upgrade dialog"
      />
      {/* Dialog */}
      <div className="relative w-full max-w-lg rounded-lg bg-white shadow-xl border focus:outline-none">
        <div className="p-5 border-b flex items-start justify-between">
          <h2 id="upgrade-title" className="text-lg font-semibold">Upgrade to Enterprise</h2>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            className="rounded border px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        <div className="p-5 space-y-4 text-sm" id="upgrade-desc">
          <div className="rounded-md bg-slate-50 border p-3">
            Enterprise unlocks the full recruiting suite so your team can hire faster and smarter.
          </div>

          <ul className="list-disc pl-5 space-y-1">
            {benefits.map((b) => <li key={b}>{b}</li>)}
          </ul>

          {/* Optional price row (placeholder-friendly) */}
          <div className="flex items-center justify-between rounded border p-3">
            <div className="text-slate-600">
              <div className="font-medium">Enterprise Plan</div>
              <div className="text-xs">Instant activation • Seat management • Priority support</div>
            </div>
            <div className="text-right">
              <div className="text-xl font-semibold">Contact Sales</div>
              <div className="text-xs text-slate-500">Flexible tiers available</div>
            </div>
          </div>
        </div>

        <div className="p-5 border-t flex items-center justify-between gap-3">
          <Link href="/recruiter/upgrade" className="text-sm underline">
            Compare plans
          </Link>
          <Link
            href="/billing/checkout?plan=enterprise"
            ref={ctaRef}
            className="px-4 py-2 rounded bg-[#FF7043] hover:bg-[#F4511E] text-white text-sm focus:outline-none"
          >
            Continue to Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
