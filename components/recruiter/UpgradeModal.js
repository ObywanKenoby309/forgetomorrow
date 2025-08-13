// components/recruiter/UpgradeModal.js
import { useEffect } from "react";
import Link from "next/link";
import { usePlan } from "../../context/PlanContext";

export default function UpgradeModal({ open, onClose }) {
  const { isEnterprise } = usePlan();

  // Close on ESC
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || isEnterprise) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-lg bg-white shadow-xl border">
        <div className="p-5 border-b">
          <h2 className="text-lg font-semibold">Upgrade to Enterprise — Power Up Your Hiring</h2>
        </div>

        <div className="p-5 space-y-4 text-sm">
          <ul className="list-disc pl-5 space-y-1">
            <li>Unlimited job postings</li>
            <li>AI‑powered candidate matching & ranking</li>
            <li>Full ATS workflow with automation & bulk actions</li>
            <li>Advanced analytics & source tracking</li>
            <li>Access to the Forge Talent Pool</li>
            <li>Up to 10 recruiter/admin seats</li>
          </ul>
          <div className="rounded-md bg-slate-50 border p-3">
            <div className="text-slate-600">
              Annual saves more. Activation is instant — your team gets features immediately.
            </div>
          </div>
        </div>

        <div className="p-5 border-t flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded border text-sm hover:bg-slate-50"
          >
            Maybe later
          </button>
          <Link
            href="/recruiter/upgrade"
            className="px-4 py-2 rounded bg-[#FF7043] hover:bg-[#F4511E] text-white text-sm"
          >
            Upgrade to Enterprise
          </Link>
        </div>
      </div>
    </div>
  );
}
