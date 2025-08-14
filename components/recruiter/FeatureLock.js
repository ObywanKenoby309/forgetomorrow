// components/recruiter/FeatureLock.js
import { useState } from "react";
import { usePlan } from "../../context/PlanContext";
import UpgradeModal from "./UpgradeModal";

/**
 * Wrap any Enterprise-only block:
 * <FeatureLock label="Full Analytics"><YourContent/></FeatureLock>
 */
export default function FeatureLock({
  children,
  label = "This feature",
  blurPx = 6,                  // tweak blur strength if needed
}) {
  const { isEnterprise } = usePlan();
  const [open, setOpen] = useState(false);

  if (isEnterprise) return children;

  return (
    <div
      className="relative border rounded-xl overflow-hidden bg-white"
      style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.06)" }}
      aria-label={`${label} (locked)`}
    >
      {/* Blurred/disabled content (not interactive, not selectable) */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none"
        style={{
          filter: `blur(${blurPx}px)`,
          userSelect: "none",
        }}
      >
        {children}
      </div>

      {/* Soft veil over blurred content to prevent OCR-like readability */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(255,255,255,0.55), rgba(255,255,255,0.85))",
        }}
        aria-hidden="true"
      />

      {/* Centered CTA overlay */}
      <div className="absolute inset-0 flex items-center justify-center p-6">
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
