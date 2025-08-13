// components/recruiter/FeatureLock.js
import { useState } from "react";
import { usePlan } from "../../context/PlanContext";
import UpgradeModal from "./UpgradeModal";

/**
 * Wrap any Enterprise-only block:
 * <FeatureLock label="AI Job Description Optimizer"><YourContent/></FeatureLock>
 */
export default function FeatureLock({ children, label = "This feature" }) {
  const { isEnterprise } = usePlan();
  const [open, setOpen] = useState(false);

  if (isEnterprise) return children;

  return (
    <div className="relative">
      {/* Dimmed content preview */}
      <div className="pointer-events-none opacity-60">{children}</div>

      {/* Overlay CTA */}
      <div className="absolute inset-0 flex items-center justify-center">
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-md border bg-white/90 backdrop-blur px-3 py-2 text-sm shadow hover:bg-white"
          title="Unlock with Enterprise"
        >
          <span>🔒</span>
          <span>Upgrade to use {label}</span>
        </button>
      </div>

      {/* Modal */}
      <UpgradeModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
