// components/recruiter/pools/Pills.js
import React from "react";

export const ORANGE = "#FF7043";

export function Pill({ children, tone = "neutral" }) {
  const stylesByTone = {
    neutral: { background: "rgba(96,125,139,0.12)", color: "#455A64" },
    hot: { background: "rgba(255,112,67,0.16)", color: "#B23C17" },
    warm: { background: "rgba(255,193,7,0.18)", color: "#7A5A00" },
    hold: { background: "rgba(120,144,156,0.18)", color: "#37474F" },
    internal: { background: "rgba(76,175,80,0.14)", color: "#2E7D32" },
    external: { background: "rgba(33,150,243,0.14)", color: "#1565C0" },
  };

  const s = stylesByTone[tone] || stylesByTone.neutral;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 800,
        ...s,
      }}
    >
      {children}
    </span>
  );
}

export function PrimaryButton({ children, onClick, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        border: "none",
        background: disabled ? "rgba(255,112,67,0.45)" : ORANGE,
        color: "white",
        borderRadius: 10,
        padding: "10px 12px",
        fontWeight: 900,
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: "0 10px 18px rgba(0,0,0,0.10)",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, onClick, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        border: "1px solid rgba(38,50,56,0.18)",
        background: "white",
        color: "#37474F",
        borderRadius: 10,
        padding: "10px 12px",
        fontWeight: 900,
        cursor: disabled ? "not-allowed" : "pointer",
        whiteSpace: "nowrap",
        opacity: disabled ? 0.65 : 1,
      }}
    >
      {children}
    </button>
  );
}

export function normalizeReasonsText(input) {
  const raw = String(input || "").trim();
  if (!raw) return [];

  return raw
    .split(/\n+/g)
    .map((x) => String(x || "").trim())
    .filter(Boolean)
    .slice(0, 8);
}

export function TextButton({ children, onClick, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        border: "none",
        background: "transparent",
        color: ORANGE,
        fontWeight: 900,
        cursor: disabled ? "not-allowed" : "pointer",
        padding: 0,
        textAlign: "left",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
}
