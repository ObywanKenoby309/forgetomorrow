// components/recruiter/CandidateActionsMenu.js
// Shared actions menu for Report, Block, Archive (mine / org).
// Used in both CandidateList and RecruiterMessageCenter.
// Floats above all other content via fixed positioning.

import { useState, useEffect, useRef, useCallback } from "react";

const ORANGE = "#FF7043";
const SLATE = "#334155";
const MUTED = "#64748B";
const DANGER = "#DC2626";

/* ─────────────────────────────────────────────────────────────
   REASON MODAL
   Blocks the action until a reason is provided.
───────────────────────────────────────────────────────────── */
function ReasonModal({ title, description, placeholder, onConfirm, onCancel, confirmLabel = "Confirm", confirmDanger = false }) {
  const [reason, setReason] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleConfirm = () => {
    const trimmed = reason.trim();
    if (!trimmed) {
      inputRef.current?.focus();
      return;
    }
    onConfirm(trimmed);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && e.metaKey) handleConfirm();
    if (e.key === "Escape") onCancel();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(15,23,42,0.55)",
        backdropFilter: "blur(4px)",
        padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        style={{
          background: "rgba(255,255,255,0.98)",
          borderRadius: 16,
          padding: "24px 24px 20px",
          width: "100%",
          maxWidth: 420,
          boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: SLATE }}>{title}</div>
          {description && (
            <div style={{ fontSize: 13, color: MUTED, marginTop: 4, lineHeight: 1.5 }}>{description}</div>
          )}
        </div>

        <textarea
          ref={inputRef}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Enter reason..."}
          rows={3}
          style={{
            width: "100%",
            border: "1px solid rgba(15,23,42,0.14)",
            borderRadius: 10,
            padding: "10px 12px",
            fontSize: 13,
            fontFamily: "inherit",
            color: SLATE,
            outline: "none",
            resize: "none",
            background: "rgba(248,250,252,0.9)",
            lineHeight: 1.5,
            boxSizing: "border-box",
          }}
        />

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "9px 16px",
              borderRadius: 9,
              border: "1px solid rgba(15,23,42,0.14)",
              background: "white",
              fontSize: 13,
              fontWeight: 600,
              color: MUTED,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!reason.trim()}
            style={{
              padding: "9px 16px",
              borderRadius: 9,
              border: "none",
              background: !reason.trim()
                ? "rgba(15,23,42,0.12)"
                : confirmDanger
                ? DANGER
                : "linear-gradient(135deg, #FF7043, #FF8A65)",
              fontSize: 13,
              fontWeight: 700,
              color: !reason.trim() ? MUTED : "white",
              cursor: !reason.trim() ? "not-allowed" : "pointer",
              boxShadow: reason.trim() ? "0 2px 8px rgba(255,112,67,0.3)" : "none",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   CONFIRM MODAL
   Simple yes/no confirmation without a reason field.
───────────────────────────────────────────────────────────── */
function ConfirmModal({ title, description, onConfirm, onCancel, confirmLabel = "Confirm", confirmDanger = false }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onCancel]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(15,23,42,0.55)",
        backdropFilter: "blur(4px)",
        padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        style={{
          background: "rgba(255,255,255,0.98)",
          borderRadius: 16,
          padding: "24px 24px 20px",
          width: "100%",
          maxWidth: 380,
          boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: SLATE }}>{title}</div>
          {description && (
            <div style={{ fontSize: 13, color: MUTED, marginTop: 6, lineHeight: 1.55 }}>{description}</div>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "9px 16px",
              borderRadius: 9,
              border: "1px solid rgba(15,23,42,0.14)",
              background: "white",
              fontSize: 13,
              fontWeight: 600,
              color: MUTED,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: "9px 16px",
              borderRadius: 9,
              border: "none",
              background: confirmDanger ? DANGER : "linear-gradient(135deg, #FF7043, #FF8A65)",
              fontSize: 13,
              fontWeight: 700,
              color: "white",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(255,112,67,0.3)",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   DROPDOWN MENU ITEM
───────────────────────────────────────────────────────────── */
function MenuItem({ label, sublabel, onClick, danger = false, disabled = false }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        width: "100%",
        padding: "9px 14px",
        background: hovered
          ? danger
            ? "rgba(220,38,38,0.06)"
            : "rgba(255,112,67,0.06)"
          : "transparent",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        textAlign: "left",
        opacity: disabled ? 0.45 : 1,
        transition: "background 0.12s",
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 600, color: danger ? DANGER : SLATE, lineHeight: 1.3 }}>
        {label}
      </span>
      {sublabel && (
        <span style={{ fontSize: 11, color: MUTED, marginTop: 2, lineHeight: 1.4 }}>
          {sublabel}
        </span>
      )}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN EXPORT
───────────────────────────────────────────────────────────── */
export default function CandidateActionsMenu({
  candidate,
  conversationId = null,
  context = "candidates", // 'candidates' | 'messaging'
  onArchiveMine,
  onArchiveOrg,
  buttonStyle = {},
}) {
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState(null); // null | 'report' | 'block' | 'archive-org' | 'archive-mine-confirm'
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  const candidateName = candidate?.name || "this member";

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        buttonRef.current && !buttonRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  // Position the dropdown relative to the button
  const handleToggle = useCallback(() => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 220;
      const left = Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8);
      setMenuPos({
        top: rect.bottom + 6,
        left: Math.max(8, left),
      });
    }
    setOpen((v) => !v);
  }, [open]);

  const showToast = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Report ──────────────────────────────────────────────────
  const handleReport = async (reason) => {
    setModal(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/signal/report", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: conversationId || undefined,
          targetUserId: candidate?.userId || candidate?.id,
          reason,
        }),
      });
      if (!res.ok) throw new Error("Report failed");
      showToast("Report submitted. Our team will review this.");
    } catch {
      showToast("Could not submit report. Please try again.", true);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Block ───────────────────────────────────────────────────
  const handleBlock = async (reason) => {
    setModal(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/signal/block", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: candidate?.userId || candidate?.id,
          reason,
        }),
      });
      if (!res.ok) throw new Error("Block failed");
      showToast(`${candidateName} has been blocked and reported to our team.`);
    } catch {
      showToast("Could not block member. Please try again.", true);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Archive mine ────────────────────────────────────────────
  const handleArchiveMine = () => {
    setModal(null);
    if (typeof onArchiveMine === "function") {
      onArchiveMine(candidate);
    }
    showToast("Removed from your view.");
  };

  // ── Archive org ─────────────────────────────────────────────
  const handleArchiveOrg = async (reason) => {
    setModal(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/recruiter/archive-candidate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateUserId: candidate?.userId || candidate?.id,
          reason,
        }),
      });
      if (!res.ok) throw new Error("Archive failed");
      if (typeof onArchiveOrg === "function") onArchiveOrg(candidate);
      showToast("Removed from your org's view. Reason logged.");
    } catch {
      showToast("Could not archive for org. Please try again.", true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Trigger button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        disabled={submitting}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 32,
          height: 32,
          borderRadius: 8,
          border: "1px solid rgba(15,23,42,0.12)",
          background: open ? "rgba(255,112,67,0.08)" : "rgba(255,255,255,0.80)",
          cursor: submitting ? "not-allowed" : "pointer",
          color: open ? ORANGE : MUTED,
          flexShrink: 0,
          transition: "background 0.15s, color 0.15s",
          ...buttonStyle,
        }}
        title="Actions"
        aria-label="Candidate actions"
        aria-expanded={open}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="8" cy="3" r="1.5"/>
          <circle cx="8" cy="8" r="1.5"/>
          <circle cx="8" cy="13" r="1.5"/>
        </svg>
      </button>

      {/* Floating dropdown — fixed position so it never clips */}
      {open && (
        <div
          ref={menuRef}
          style={{
            position: "fixed",
            top: menuPos.top,
            left: menuPos.left,
            width: 220,
            zIndex: 9998,
            background: "rgba(255,255,255,0.98)",
            borderRadius: 12,
            border: "1px solid rgba(15,23,42,0.10)",
            boxShadow: "0 12px 40px rgba(15,23,42,0.18)",
            overflow: "hidden",
            backdropFilter: "blur(12px)",
          }}
        >
          {/* Archive section */}
          <div style={{ padding: "6px 0 4px" }}>
            <div style={{ padding: "2px 14px 6px", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#94A3B8" }}>
              Archive
            </div>
            <MenuItem
              label="Remove from my view"
              sublabel="Only affects your inbox"
              onClick={() => { setOpen(false); setModal("archive-mine-confirm"); }}
            />
            <MenuItem
              label="Remove from org view"
              sublabel="Affects all team members — reason required"
              onClick={() => { setOpen(false); setModal("archive-org"); }}
            />
          </div>

          <div style={{ height: 1, background: "rgba(15,23,42,0.07)", margin: "0 12px" }} />

          {/* Safety section */}
          <div style={{ padding: "4px 0 6px" }}>
            <div style={{ padding: "4px 14px 6px", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#94A3B8" }}>
              Safety
            </div>
            <MenuItem
              label="Report"
              sublabel="Flag for ForgeTomorrow review"
              onClick={() => { setOpen(false); setModal("report"); }}
            />
            <MenuItem
              label="Block"
              sublabel="Block + report — reason required"
              danger
              onClick={() => { setOpen(false); setModal("block"); }}
            />
          </div>
        </div>
      )}

      {/* Modals */}
      {modal === "archive-mine-confirm" && (
        <ConfirmModal
          title="Remove from your view?"
          description={`${candidateName} will be removed from your inbox and candidate list. This only affects you — your team can still see them.`}
          confirmLabel="Remove"
          onConfirm={handleArchiveMine}
          onCancel={() => setModal(null)}
        />
      )}

      {modal === "archive-org" && (
        <ReasonModal
          title="Remove from org view"
          description={`${candidateName} will be removed from all team members' views. Please provide a reason — this is logged for compliance.`}
          placeholder="e.g. Position filled, candidate withdrew, not a fit..."
          confirmLabel="Remove for org"
          onConfirm={handleArchiveOrg}
          onCancel={() => setModal(null)}
        />
      )}

      {modal === "report" && (
        <ReasonModal
          title={`Report ${candidateName}`}
          description="Describe what happened. This goes directly to the ForgeTomorrow team for review."
          placeholder="e.g. Inappropriate messages, misrepresentation..."
          confirmLabel="Submit Report"
          onConfirm={handleReport}
          onCancel={() => setModal(null)}
        />
      )}

      {modal === "block" && (
        <ReasonModal
          title={`Block ${candidateName}`}
          description="This will block this member and report them to ForgeTomorrow. A reason is required. Our team reviews all blocks."
          placeholder="Reason for blocking..."
          confirmLabel="Block & Report"
          confirmDanger
          onConfirm={handleBlock}
          onCancel={() => setModal(null)}
        />
      )}

      {/* Toast notification */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 99999,
            background: toast.isError ? DANGER : "#0F172A",
            color: "white",
            padding: "11px 20px",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
            whiteSpace: "nowrap",
            pointerEvents: "none",
          }}
        >
          {toast.msg}
        </div>
      )}
    </>
  );
}