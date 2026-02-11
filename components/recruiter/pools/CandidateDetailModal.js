// components/recruiter/pools/CandidateDetailModal.js
import React, { useEffect, useMemo, useState } from "react";
import { Pill, PrimaryButton, SecondaryButton, TextButton } from "./Pills";
import { fmtShortDate } from "./utils";

export default function CandidateDetailModal({
  open,
  onClose,
  entry,
  saving,
  onMessage,
  onRemove,
  onOpenFullProfile,

  // ✅ NEW (additive)
  editable = false,
  onSave,
}) {
  const [localError, setLocalError] = useState("");

  // ✅ NEW local edit fields
  const [draftStatus, setDraftStatus] = useState("Warm");
  const [draftFit, setDraftFit] = useState("");
  const [draftLastRole, setDraftLastRole] = useState("");
  const [draftNotes, setDraftNotes] = useState("");
  const [draftWhy, setDraftWhy] = useState("");

  useEffect(() => {
    if (!open) return;
    setLocalError("");
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const e = entry && typeof entry === "object" ? entry : null;

  const sourceTone = String(e?.source || "").toLowerCase() === "internal" ? "internal" : "external";
  const statusTone =
    String(e?.status || "").toLowerCase() === "hot"
      ? "hot"
      : String(e?.status || "").toLowerCase() === "warm"
      ? "warm"
      : "hold";

  const reasons = Array.isArray(e?.reasons) ? e.reasons : [];
  const firstReason = reasons[0] || "";

  const candidateUserId = String(e?.candidateUserId || "").trim();
  const canOpen = Boolean(candidateUserId);

  const lastUpdated = e?.updatedAt || e?.lastTouch || null;

  const externalEmail = String(e?.externalEmail || "").trim();

  // ✅ initialize drafts when modal opens / entry changes
  useEffect(() => {
    if (!open) return;
    setDraftStatus(String(e?.status || "Warm").trim() || "Warm");
    setDraftFit(String(e?.fit || "").trim());
    setDraftLastRole(String(e?.lastRoleConsidered || "").trim());
    setDraftNotes(String(e?.notes || "").trim());
    setDraftWhy(String(firstReason || "").trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, e?.id]);

  if (!open) return null;

  function handleOpenFullProfile() {
    setLocalError("");
    if (!canOpen) {
      setLocalError(
        "This is an external candidate. Full profile view is available for internal candidates only (for now)."
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
      setLocalError("This is an external candidate. Messaging is available for internal candidates only (for now).");
      return;
    }
    if (typeof onMessage === "function") onMessage();
  }

  async function handleSave() {
    setLocalError("");
    if (!editable) return;
    if (!e?.id) {
      setLocalError("Missing entry id - cannot save.");
      return;
    }
    if (typeof onSave !== "function") {
      setLocalError("Save handler is not wired. (onSave missing)");
      return;
    }

    const newReasons = (() => {
      const trimmed = String(draftWhy || "").trim();
      if (!trimmed) return [];
      return [trimmed].concat(reasons.slice(1));
    })();

    await onSave({
      entryId: e.id,
      status: String(draftStatus || "Warm").trim() || "Warm",
      fit: String(draftFit || "").trim(),
      lastRoleConsidered: String(draftLastRole || "").trim(),
      notes: String(draftNotes || "").trim(),
      reasons: newReasons,
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={editable ? "Edit candidate" : "Candidate details"}
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
            <div style={{ fontWeight: 900, color: "#263238", fontSize: 18 }}>
              {e?.name || "Candidate"}
            </div>
            <div style={{ color: "#607D8B", fontSize: 12, marginTop: 4, lineHeight: 1.35 }}>
              {e?.headline || ""}
            </div>
            {e?.location ? (
              <div style={{ color: "#90A4AE", fontSize: 12, marginTop: 6, fontWeight: 800 }}>
                {e.location}
              </div>
            ) : null}

            {/* ✅ NEW: external email shown when present */}
            {externalEmail ? (
              <div style={{ color: "#607D8B", fontSize: 12, marginTop: 6, fontWeight: 900 }}>
                Email: <span style={{ fontWeight: 800 }}>{externalEmail}</span>
              </div>
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
          <Pill tone="neutral">Last updated: {fmtShortDate(lastUpdated)}</Pill>
        </div>

        <div
          style={{
            borderTop: "1px solid rgba(38,50,56,0.10)",
            paddingTop: 10,
            marginTop: 4,
            display: "grid",
            gap: 10,
          }}
        >
          {/* ✅ EDITABLE FIELDS */}
          {editable ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={{ display: "grid", gap: 6 }}>
                  <div style={{ fontWeight: 900, color: "#37474F", fontSize: 13 }}>Status</div>
                  <select
                    value={draftStatus}
                    onChange={(e) => setDraftStatus(e.target.value)}
                    style={{
                      border: "1px solid rgba(38,50,56,0.18)",
                      borderRadius: 10,
                      padding: "10px 12px",
                      fontWeight: 800,
                      outline: "none",
                      background: "white",
                    }}
                  >
                    <option value="Hot">Hot</option>
                    <option value="Warm">Warm</option>
                    <option value="Hold">Hold</option>
                  </select>
                </div>

                <div style={{ display: "grid", gap: 6 }}>
                  <div style={{ fontWeight: 900, color: "#37474F", fontSize: 13 }}>Fit</div>
                  <input
                    value={draftFit}
                    onChange={(e) => setDraftFit(e.target.value)}
                    placeholder="e.g., CEO/COO"
                    style={{
                      border: "1px solid rgba(38,50,56,0.18)",
                      borderRadius: 10,
                      padding: "10px 12px",
                      fontWeight: 800,
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <div style={{ fontWeight: 900, color: "#37474F", fontSize: 13 }}>
                  Last role considered
                </div>
                <input
                  value={draftLastRole}
                  onChange={(e) => setDraftLastRole(e.target.value)}
                  placeholder="e.g., NA Operations Manager"
                  style={{
                    border: "1px solid rgba(38,50,56,0.18)",
                    borderRadius: 10,
                    padding: "10px 12px",
                    fontWeight: 800,
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <div style={{ fontWeight: 900, color: "#37474F", fontSize: 13 }}>
                  Why saved (evidence snapshot)
                </div>
                <textarea
                  value={draftWhy}
                  onChange={(e) => setDraftWhy(e.target.value)}
                  placeholder="One clear reason - this becomes the top snapshot line."
                  rows={3}
                  style={{
                    border: "1px solid rgba(38,50,56,0.18)",
                    borderRadius: 12,
                    padding: "10px 12px",
                    fontWeight: 700,
                    outline: "none",
                    resize: "vertical",
                    lineHeight: 1.4,
                  }}
                />
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <div style={{ fontWeight: 900, color: "#37474F", fontSize: 13 }}>Notes</div>
                <textarea
                  value={draftNotes}
                  onChange={(e) => setDraftNotes(e.target.value)}
                  placeholder="Internal notes..."
                  rows={5}
                  style={{
                    border: "1px solid rgba(38,50,56,0.18)",
                    borderRadius: 12,
                    padding: "10px 12px",
                    fontWeight: 700,
                    outline: "none",
                    resize: "vertical",
                    lineHeight: 1.4,
                    background: "rgba(96,125,139,0.06)",
                  }}
                />
              </div>
            </>
          ) : (
            <>
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
            </>
          )}

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
            <PrimaryButton onClick={handleMessage} disabled={saving || !canOpen}>
              Message
            </PrimaryButton>

            <SecondaryButton onClick={handleOpenFullProfile} disabled={saving || !canOpen}>
              Open full profile
            </SecondaryButton>

            {editable ? (
              <>
                <PrimaryButton onClick={handleSave} disabled={saving}>
                  Save
                </PrimaryButton>

                {/* Keep destructive action inside Edit modal */}
                <SecondaryButton onClick={onRemove} disabled={saving}>
                  Remove from pool
                </SecondaryButton>
              </>
            ) : (
              <SecondaryButton onClick={onRemove} disabled={saving}>
                Remove from pool
              </SecondaryButton>
            )}
          </div>

          <div style={{ color: "#90A4AE", fontSize: 11, lineHeight: 1.35, marginTop: 4 }}>
            Pools are a working surface: scan, decide, act. No tab-jumping.
          </div>
        </div>
      </div>
    </div>
  );
}
