// components/recruiter/pools/CandidateDetailModal.js
import React, { useEffect, useState } from "react";
import { Pill, PrimaryButton, SecondaryButton } from "./Pills";
import { fmtShortDate } from "./utils";

export default function CandidateDetailModal({
  open,
  onClose,
  entry,
  saving,
  onMessage,
  onRemove,
  onOpenFullProfile,
}) {
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (!open) return;
    setLocalError("");
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const e = entry && typeof entry === "object" ? entry : null;

  const sourceTone = String(e?.source || "").toLowerCase() === "internal" ? "internal" : "external";
  const statusTone =
    String(e?.status || "").toLowerCase() === "hot"
      ? "hot"
      : String(e?.status || "").toLowerCase() === "warm"
      ? "warm"
      : "hold";

  const reasons = Array.isArray(e?.reasons) ? e.reasons : [];
  const candidateUserId = String(e?.candidateUserId || "").trim();
  const canOpen = Boolean(candidateUserId);

  function handleOpenFullProfile() {
    setLocalError("");
    if (!canOpen) {
      setLocalError(
        "This pool entry is missing an internal candidate ID, so ForgeTomorrow cannot open Candidate Center for this candidate yet."
      );
      return;
    }
    if (typeof onOpenFullProfile !== "function") {
      setLocalError("Open profile handler is not wired. (onOpenFullProfile missing)");
      return;
    }
    onOpenFullProfile(e);
  }

  function handleMessage() {
    setLocalError("");
    if (!canOpen) {
      setLocalError("Messaging is available for internal candidates only (this entry has no internal candidate ID).");
      return;
    }
    if (typeof onMessage === "function") onMessage();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Candidate details"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(0,0,0,0.45)",
        display: "grid",
        placeItems: "center",
        padding: 14,
      }}
      onMouseDown={(evt) => {
        if (evt.target === evt.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "min(860px, 96vw)",
          maxHeight: "90vh",
          overflow: "auto",
          background: "white",
          borderRadius: 14,
          border: "1px solid rgba(38,50,56,0.12)",
          boxShadow: "0 18px 40px rgba(0,0,0,0.25)",
          padding: 14,
          display: "grid",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 900, color: "#263238", fontSize: 18 }}>{e?.name || "Candidate"}</div>
            <div style={{ color: "#607D8B", fontSize: 12, marginTop: 4, lineHeight: 1.35 }}>{e?.headline || ""}</div>
            {e?.location ? (
              <div style={{ color: "#90A4AE", fontSize: 12, marginTop: 6, fontWeight: 800 }}>{e.location}</div>
            ) : null}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Pill tone={sourceTone}>{e?.source || "External"}</Pill>
            <Pill tone={statusTone}>{e?.status || "Warm"}</Pill>
            <SecondaryButton onClick={onClose} disabled={saving}>
              Close
            </SecondaryButton>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Pill tone="neutral">Fit: {e?.fit || "-"}</Pill>
          <Pill tone="neutral">Last updated: {fmtShortDate(e?.lastTouch)}</Pill>
        </div>

        <div
          style={{
            borderTop: "1px solid rgba(38,50,56,0.10)",
            paddingTop: 10,
            marginTop: 4,
            display: "grid",
            gap: 8,
          }}
        >
          <div style={{ fontWeight: 900, color: "#37474F", fontSize: 13 }}>Why saved (evidence snapshot)</div>

          {reasons.length ? (
            <ul style={{ margin: 0, paddingLeft: 18, color: "#546E7A", fontSize: 12, lineHeight: 1.45 }}>
              {reasons.map((r, idx) => (
                <li key={`${e?.id || "x"}-rr-${idx}`}>{r}</li>
              ))}
            </ul>
          ) : (
            <div style={{ color: "#90A4AE", fontSize: 12, lineHeight: 1.35 }}>No snapshot yet.</div>
          )}

          <div style={{ fontWeight: 900, color: "#37474F", fontSize: 13, marginTop: 6 }}>Notes</div>
          <div
            style={{
              border: "1px solid rgba(38,50,56,0.14)",
              borderRadius: 12,
              padding: 10,
              color: "#455A64",
              fontSize: 12,
              lineHeight: 1.45,
              background: "rgba(96,125,139,0.06)",
            }}
          >
            {e?.notes || "No notes."}
          </div>

          {canOpen ? (
            <div style={{ color: "#607D8B", fontSize: 12, lineHeight: 1.35 }}>
              Internal candidate detected. Use <strong>Open full profile</strong> to jump into Candidate Center.
            </div>
          ) : (
            <div style={{ color: "#607D8B", fontSize: 12, lineHeight: 1.35 }}>
              External candidate entry. Full profile and messaging are limited to internal users (for now).
            </div>
          )}

          {localError ? (
            <div
              style={{
                border: "1px solid rgba(255,112,67,0.35)",
                background: "rgba(255,112,67,0.08)",
                borderRadius: 12,
                padding: 10,
                color: "#B23C17",
                fontWeight: 800,
                fontSize: 12,
                lineHeight: 1.35,
              }}
            >
              {localError}
            </div>
          ) : null}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
            <PrimaryButton onClick={handleMessage} disabled={saving}>
              Message
            </PrimaryButton>

            <SecondaryButton onClick={handleOpenFullProfile} disabled={saving}>
              Open full profile
            </SecondaryButton>

            <SecondaryButton onClick={onRemove} disabled={saving}>
              Remove from pool
            </SecondaryButton>
          </div>

          <div style={{ color: "#90A4AE", fontSize: 11, lineHeight: 1.35, marginTop: 4 }}>
            Pools are a working surface: scan, decide, act. No tab-jumping.
          </div>
        </div>
      </div>
    </div>
  );
}
