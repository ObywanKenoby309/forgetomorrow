// pages/recruiter/candidates.js
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import { PlanProvider, usePlan } from "../../context/PlanContext";
import RecruiterLayout from "../../components/layouts/RecruiterLayout";
import CandidateList from "../../components/recruiter/CandidateList";
import CandidateProfileModal from "../../components/recruiter/CandidateProfileModal";
import FeatureLock from "../../components/recruiter/FeatureLock";
import WhyCandidateDrawer, {
  WhyCandidateCompareDrawer,
} from "../../components/recruiter/WhyCandidateDrawer";
import { getMockExplain } from "../../lib/recruiter/mockExplain";
import * as Analytics from "../../lib/analytics/instrumentation";
import WhyInfo from "../../components/recruiter/WhyInfo";
import PersonaChoiceModal from "../../components/common/PersonaChoiceModal";
import CandidateTargetingPanel from "../../components/recruiter/CandidateTargetingPanel";

const RECRUITER_DEV_USER_ID = "cmic534oy0000bv2gsjrl83al";

async function getSessionDirect(timeoutMs = 4000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch("/api/auth/session", {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

const mkWhySnapshot = (explain, mode) => ({
  score: explain?.score,
  mode,
  reasons: (explain?.reasons || [])
    .slice(0, mode === "full" ? 8 : 2)
    .map((r) => ({
      requirement: r.requirement,
      evidence: (r.evidence || [])
        .slice(0, mode === "full" ? 4 : 1)
        .map((e) => ({ text: e.text, source: e.source || null })),
    })),
  filters: explain?.filters_triggered || [],
});

const GlassPanel = ({ className = "", children, style = {} }) => (
  <section
    style={style}
    className={
      "rounded-2xl border border-white/30 bg-white/70 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.10)] " +
      className
    }
  >
    {children}
  </section>
);

// ─── TARGETING DRAWER ──────────────────────────────────────────────────────
// Slides in from the right on desktop. Bottom sheet on mobile.
// Keeps the targeting form completely OUT of the vertical scroll flow.
function TargetingDrawer({
  open,
  onClose,
  filters,
  setFilters,
  automation,
  onFindCandidates,
  onClearTargeting,
  manualSearching,
  isLoading,
  activeFilterCount,
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 40,
          background: open ? "rgba(10,12,18,0.50)" : "transparent",
          backdropFilter: open ? "blur(4px)" : "none",
          pointerEvents: open ? "auto" : "none",
          opacity: open ? 1 : 0,
          transition: "opacity 0.28s ease, backdrop-filter 0.28s ease",
        }}
      />

      {/* Drawer — right panel desktop, bottom sheet mobile */}
      <div
        style={{
          position: "fixed",
          top: 56,
          right: 0,
          bottom: 0,
          zIndex: 50,
          width: "min(580px, 100vw)",
          maxWidth: "100vw",
          display: "flex",
          flexDirection: "column",
          background: "rgba(252,252,253,0.97)",
          backdropFilter: "blur(24px)",
          borderLeft: "1px solid rgba(255,112,67,0.12)",
          boxShadow: "-24px 0 80px rgba(0,0,0,0.20)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.32s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/* Drawer header bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid rgba(0,0,0,0.07)",
            background: "rgba(255,255,255,0.80)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            {/* Target icon */}
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: "linear-gradient(135deg,#FF7043,#FF8A65)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6.5" stroke="white" strokeWidth="1.5"/>
                <circle cx="8" cy="8" r="3.5" stroke="white" strokeWidth="1.5"/>
                <circle cx="8" cy="8" r="1" fill="white"/>
                <line x1="8" y1="1" x2="8" y2="3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="8" y1="12.5" x2="8" y2="15" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="1" y1="8" x2="3.5" y2="8" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="12.5" y1="8" x2="15" y2="8" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>
                  Targeting & Automation
                </span>
                {activeFilterCount > 0 && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: 999,
                      background: "rgba(255,112,67,0.10)",
                      color: "#FF7043",
                      border: "1px solid rgba(255,112,67,0.22)",
                    }}
                  >
                    {activeFilterCount} active
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 1 }}>
                Profile-based precision filters
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "1px solid rgba(0,0,0,0.08)",
              background: "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#64748b",
              transition: "background 0.15s, color 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.05)"; e.currentTarget.style.color = "#0f172a"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#64748b"; }}
            aria-label="Close targeting panel"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M11 3L3 11M3 3l8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", WebkitOverflowScrolling: "touch", minWidth: 0 }}>
          <CandidateTargetingPanel
            filters={filters}
            setFilters={setFilters}
            automation={automation}
            onFindCandidates={() => {
              onFindCandidates();
              onClose();
            }}
            onClearTargeting={onClearTargeting}
            manualSearching={manualSearching}
            isLoading={isLoading}
            defaultExpanded={true}
          />
        </div>
      </div>
    </>
  );
}

// ─── MOBILE COMPARE SHEET ─────────────────────────────────────────────────
// [FIX 3] Replaces the side-by-side WHY compare drawer on narrow screens.
// Shows A and B as switchable tabs inside a bottom sheet.
function MobileCompareSheet({ open, onClose, left, right, onViewLeft, onViewRight, mode }) {
  const [tab, setTab] = useState("a");

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const activeCandidate = tab === "a" ? left?.candidate : right?.candidate;
  const activeExplain   = tab === "a" ? left?.explain   : right?.explain;
  const onViewActive    = tab === "a" ? onViewLeft       : onViewRight;

  const score = typeof activeExplain?.score === "number" ? activeExplain.score : null;
  const reasons = Array.isArray(activeExplain?.reasons) ? activeExplain.reasons : [];
  const scoreColor = score === null ? "#94a3b8" : score >= 80 ? "#16a34a" : score >= 60 ? "#d97706" : "#dc2626";

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 98, background: "rgba(10,12,18,0.55)", backdropFilter: "blur(4px)" }}
      />
      {/* Sheet */}
      <div
        style={{
          position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 99,
          width: "100%",
          maxWidth: "100vw",
          background: "rgba(252,252,253,0.98)",
          backdropFilter: "blur(24px)",
          borderTopLeftRadius: 20, borderTopRightRadius: 20,
          border: "1px solid rgba(255,255,255,0.40)",
          boxShadow: "0 -16px 60px rgba(0,0,0,0.22)",
          maxHeight: "94vh",
          minHeight: "72vh",
          display: "flex", flexDirection: "column",
          overflowX: "hidden",
        }}
      >
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 6px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(0,0,0,0.14)" }} />
        </div>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px 12px", minWidth: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Compare Candidates</span>
          <button
            onClick={onClose}
            style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid rgba(0,0,0,0.08)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", flexShrink: 0 }}
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M11 3L3 11M3 3l8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Candidate tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid rgba(0,0,0,0.07)", paddingLeft: 16, paddingRight: 16, gap: 4, minWidth: 0 }}>
          {[{ key: "a", candidate: left?.candidate }, { key: "b", candidate: right?.candidate }].map(({ key, candidate }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                flex: 1, minWidth: 0, padding: "12px 8px", fontSize: 13,
                fontWeight: tab === key ? 700 : 500,
                color: tab === key ? "#FF7043" : "#64748b",
                background: "transparent", border: "none",
                borderBottom: tab === key ? "2px solid #FF7043" : "2px solid transparent",
                cursor: "pointer", transition: "all 0.15s",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textAlign: "left",
              }}
            >
              {candidate?.name || `Candidate ${key.toUpperCase()}`}
            </button>
          ))}
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", WebkitOverflowScrolling: "touch", padding: "18px 16px 20px", minWidth: 0 }}>
          {/* Candidate header row */}
          {activeCandidate && (
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18, minWidth: 0 }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg,#FF7043,#FF8A65)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 18 }}>
                {(activeCandidate.name || "?")[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{activeCandidate.name}</div>
                <div style={{ fontSize: 13, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>{activeCandidate.title || activeCandidate.currentTitle || ""}</div>
                {activeCandidate.location && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 3 }}>📍 {activeCandidate.location}</div>}
              </div>
              {score !== null && (
                <div style={{ textAlign: "center", flexShrink: 0 }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{score}</div>
                  <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 3 }}>match</div>
                </div>
              )}
            </div>
          )}

          {/* WHY reasons */}
          {reasons.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
              {reasons.slice(0, mode === "full" ? 8 : 3).map((r, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.80)", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 12, padding: "14px 16px", minWidth: 0, overflowX: "hidden" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", marginBottom: 8, overflowWrap: "anywhere", wordBreak: "break-word" }}>{r.requirement}</div>
                  {Array.isArray(r.evidence) && r.evidence.slice(0, 3).map((ev, j) => (
                    <div key={j} style={{ fontSize: 11, color: "#475569", paddingLeft: 8, borderLeft: "2px solid rgba(255,112,67,0.25)", marginTop: 6, overflowWrap: "anywhere", wordBreak: "break-word", lineHeight: 1.5 }}>
                      {ev.text}{ev.source && <span style={{ color: "#94a3b8", marginLeft: 4 }}>· {ev.source}</span>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: "#94a3b8", textAlign: "center", paddingTop: 24 }}>No explainability data available.</div>
          )}

          {/* View full profile CTA */}
          {activeCandidate && (
            <button
              onClick={() => { onViewActive?.(); onClose(); }}
              style={{ marginTop: 22, width: "100%", maxWidth: "100%", padding: "14px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#FF7043,#FF8A65)", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", boxSizing: "border-box" }}
            >
              View {activeCandidate.name?.split(" ")[0] || "Profile"}'s Full Profile
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// ─── ACTIVE FILTER CHIPS ───────────────────────────────────────────────────
function FilterChip({ label, onRemove }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 11,
        fontWeight: 500,
        padding: "3px 8px 3px 10px",
        borderRadius: 999,
        background: "rgba(255,112,67,0.08)",
        color: "#c2410c",
        border: "1px solid rgba(255,112,67,0.20)",
        whiteSpace: "nowrap",
        maxWidth: "100%",
      }}
    >
      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 14,
            height: 14,
            borderRadius: "50%",
            border: "none",
            background: "rgba(194,65,12,0.15)",
            cursor: "pointer",
            color: "#c2410c",
            padding: 0,
            flexShrink: 0,
          }}
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M6 2L2 6M2 2l4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        </button>
      )}
    </span>
  );
}

// ─── COMMAND BAR ──────────────────────────────────────────────────────────
// [FIX 1] Mobile layout: row 1 = [name | Filters btn], row 2 = [location].
//         Advanced query hidden on mobile (Enterprise-only, not critical on narrow screens).
//         Desktop: original three-input + Targeting button inline.
function CommandBar({
  nameQuery, setNameQuery,
  locQuery, setLocQuery,
  boolQuery, setBoolQuery,
  isEnterprise,
  isLoading,
  candidateCount,
  compareSelectedIds,
  manualSearching,
  activeChips,
  onOpenTargeting,
  activeFilterCount,
  onClearSearch,
  onClearTargeting,
  onClearAll,
  onRemoveChip,
  isMobile,
}) {
  const hasSearch = nameQuery || locQuery || boolQuery;

  // Shared targeting button — used in both mobile row-1 and desktop single-row
  const TargetingBtn = () => (
    <button
      onClick={onOpenTargeting}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        padding: isMobile ? "9px 14px" : "8px 14px",
        borderRadius: 10,
        border: activeFilterCount > 0
          ? "1px solid rgba(255,112,67,0.35)"
          : "1px solid rgba(0,0,0,0.10)",
        background: activeFilterCount > 0
          ? "linear-gradient(135deg,rgba(255,112,67,0.10),rgba(255,138,101,0.06))"
          : "rgba(255,255,255,0.60)",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 600,
        color: activeFilterCount > 0 ? "#FF7043" : "#475569",
        whiteSpace: "nowrap",
        transition: "all 0.15s",
        flexShrink: 0,
        maxWidth: "100%",
        boxSizing: "border-box",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,112,67,0.08)"; e.currentTarget.style.borderColor = "rgba(255,112,67,0.30)"; e.currentTarget.style.color = "#FF7043"; }}
      onMouseLeave={(e) => {
        if (activeFilterCount > 0) {
          e.currentTarget.style.background = "linear-gradient(135deg,rgba(255,112,67,0.10),rgba(255,138,101,0.06))";
          e.currentTarget.style.borderColor = "rgba(255,112,67,0.35)";
          e.currentTarget.style.color = "#FF7043";
        } else {
          e.currentTarget.style.background = "rgba(255,255,255,0.60)";
          e.currentTarget.style.borderColor = "rgba(0,0,0,0.10)";
          e.currentTarget.style.color = "#475569";
        }
      }}
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="8" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="8" cy="8" r="1" fill="currentColor"/>
      </svg>
      {isMobile ? "Filters" : "Targeting"}
      {activeFilterCount > 0 && (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "#FF7043",
            color: "white",
            fontSize: 10,
            fontWeight: 700,
          }}
        >
          {activeFilterCount}
        </span>
      )}
    </button>
  );

  // Shared input focus/blur handlers
  const onFocus = (e) => { e.target.style.borderColor = "#FF7043"; e.target.style.boxShadow = "0 0 0 3px rgba(255,112,67,0.12)"; };
  const onBlur  = (e) => { e.target.style.borderColor = "rgba(0,0,0,0.08)"; e.target.style.boxShadow = "none"; };

  return (
    <div style={{ marginBottom: 16, width: "100%", maxWidth: "100%", minWidth: 0, overflowX: "hidden" }}>
      {/* Main bar */}
      <div
        style={{
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          overflowX: "hidden",
          boxSizing: "border-box",
          background: "rgba(255,255,255,0.80)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.50)",
          borderRadius: 16,
          padding: "10px 12px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        {isMobile ? (
          /* ── MOBILE: two-row layout ── */
          <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", maxWidth: "100%", minWidth: 0 }}>
            {/* Row 1: name/role + Filters button */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", maxWidth: "100%", minWidth: 0 }}>
              <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
                <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.6"/>
                    <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Name or role..."
                  value={nameQuery}
                  onChange={(e) => setNameQuery(e.target.value)}
                  style={{ width: "100%", maxWidth: "100%", paddingLeft: 32, paddingRight: 10, paddingTop: 9, paddingBottom: 9, border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, fontSize: 14, background: "rgba(255,255,255,0.70)", color: "#0f172a", outline: "none", boxSizing: "border-box", minWidth: 0 }}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>
              <TargetingBtn />
            </div>
            {/* Row 2: location */}
            <div style={{ position: "relative", width: "100%", maxWidth: "100%", minWidth: 0 }}>
              <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1.5C5.51 1.5 3.5 3.51 3.5 6c0 3.5 4.5 8.5 4.5 8.5s4.5-5 4.5-8.5c0-2.49-2.01-4.5-4.5-4.5z" stroke="currentColor" strokeWidth="1.5"/>
                  <circle cx="8" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.3"/>
                </svg>
              </div>
              <input
                type="text"
                placeholder="Location..."
                value={locQuery}
                onChange={(e) => setLocQuery(e.target.value)}
                style={{ width: "100%", maxWidth: "100%", paddingLeft: 30, paddingRight: 10, paddingTop: 9, paddingBottom: 9, border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, fontSize: 14, background: "rgba(255,255,255,0.70)", color: "#0f172a", outline: "none", boxSizing: "border-box", minWidth: 0 }}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>
          </div>
        ) : (
          /* ── DESKTOP: original single-row layout ── */
          <div style={{ display: "flex", alignItems: "stretch", gap: 8, flexWrap: "wrap", width: "100%", maxWidth: "100%", minWidth: 0 }}>
            {/* Search by name/role */}
            <div style={{ flex: "2 1 160px", minWidth: 0, position: "relative" }}>
              <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.6"/>
                  <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
              </div>
              <input
                type="text"
                placeholder="Name or role..."
                value={nameQuery}
                onChange={(e) => setNameQuery(e.target.value)}
                style={{ width: "100%", paddingLeft: 32, paddingRight: 10, paddingTop: 8, paddingBottom: 8, border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, fontSize: 13, background: "rgba(255,255,255,0.70)", color: "#0f172a", outline: "none", transition: "border-color 0.15s, box-shadow 0.15s", boxSizing: "border-box" }}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>

            {/* Location */}
            <div style={{ flex: "1.5 1 120px", minWidth: 0, position: "relative" }}>
              <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1.5C5.51 1.5 3.5 3.51 3.5 6c0 3.5 4.5 8.5 4.5 8.5s4.5-5 4.5-8.5c0-2.49-2.01-4.5-4.5-4.5z" stroke="currentColor" strokeWidth="1.5"/>
                  <circle cx="8" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.3"/>
                </svg>
              </div>
              <input
                type="text"
                placeholder="Location..."
                value={locQuery}
                onChange={(e) => setLocQuery(e.target.value)}
                style={{ width: "100%", paddingLeft: 30, paddingRight: 10, paddingTop: 8, paddingBottom: 8, border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, fontSize: 13, background: "rgba(255,255,255,0.70)", color: "#0f172a", outline: "none", transition: "border-color 0.15s, box-shadow 0.15s", boxSizing: "border-box" }}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>

            {/* Advanced / Enterprise query */}
            <div style={{ flex: "2 1 160px", minWidth: 0 }}>
              {isEnterprise ? (
                <input
                  type="text"
                  placeholder='Advanced: ("CSM" OR "CS Manager") AND SaaS'
                  value={boolQuery}
                  onChange={(e) => setBoolQuery(e.target.value)}
                  style={{ width: "100%", paddingLeft: 12, paddingRight: 10, paddingTop: 8, paddingBottom: 8, border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, fontSize: 12, background: "rgba(255,255,255,0.70)", color: "#0f172a", outline: "none", transition: "border-color 0.15s, box-shadow 0.15s", boxSizing: "border-box" }}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              ) : (
                <FeatureLock label="Advanced query">
                  <div
                    style={{ width: "100%", paddingLeft: 12, paddingRight: 10, paddingTop: 8, paddingBottom: 8, border: "1px dashed rgba(0,0,0,0.12)", borderRadius: 10, fontSize: 12, background: "rgba(0,0,0,0.03)", color: "#94a3b8", cursor: "not-allowed", boxSizing: "border-box" }}
                  >
                    Advanced query — Enterprise only
                  </div>
                </FeatureLock>
              )}
            </div>

            {/* Divider */}
            <div style={{ width: 1, background: "rgba(0,0,0,0.08)", margin: "2px 2px", flexShrink: 0 }} />

            <TargetingBtn />
          </div>
        )}
      </div>

      {/* Status bar + active chips */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 8,
          marginTop: 8,
          paddingLeft: 4,
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          overflowX: "hidden",
          boxSizing: "border-box",
        }}
      >
        {/* Result count */}
        <div
          style={{
            fontSize: 12,
            color: isLoading || manualSearching ? "#94a3b8" : "#475569",
            fontWeight: 500,
            flexShrink: 0,
            minWidth: 0,
            maxWidth: "100%",
          }}
        >
          {isLoading || manualSearching ? (
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 1s linear infinite" }}>
                <circle cx="12" cy="12" r="10" stroke="#94a3b8" strokeWidth="3" strokeDasharray="40 20"/>
              </svg>
              Searching...
            </span>
          ) : (
            <>
              <span style={{ color: "#0f172a", fontWeight: 700 }}>{candidateCount}</span>{" "}
              {candidateCount === 1 ? "candidate" : "candidates"}
              {compareSelectedIds.length > 0 && (
                <span style={{ color: "#FF7043" }}>
                  {" "}· {compareSelectedIds.length} selected
                </span>
              )}
            </>
          )}
        </div>

        {/* Active chips */}
        {activeChips.length > 0 && (
          <>
            <div style={{ width: 1, height: 14, background: "rgba(0,0,0,0.10)", flexShrink: 0 }} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center", minWidth: 0, maxWidth: "100%", overflow: "hidden" }}>
              {activeChips.slice(0, 8).map((chip) => (
                <FilterChip
                  key={chip.key}
                  label={chip.label}
                  onRemove={() => onRemoveChip(chip.key)}
                />
              ))}
              {activeChips.length > 8 && (
                <span style={{ fontSize: 11, color: "#94a3b8" }}>
                  +{activeChips.length - 8} more
                </span>
              )}
            </div>
          </>
        )}

        {/* Clear actions */}
        {(hasSearch || activeFilterCount > 0) && (
          <button
            onClick={onClearAll}
            style={{
              marginLeft: "auto",
              fontSize: 11,
              color: "#94a3b8",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "2px 6px",
              borderRadius: 6,
              transition: "color 0.15s",
              flexShrink: 0,
              maxWidth: "100%",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#FF7043"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#94a3b8"; }}
          >
            Clear all
          </button>
        )}
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 1023px) {
          .candidates-mobile-clamp,
          .candidates-mobile-clamp * {
            box-sizing: border-box;
          }

          .candidates-mobile-clamp {
            width: 100%;
            max-width: 100%;
            min-width: 0;
            overflow-x: hidden;
          }
        }
      `}</style>
    </div>
  );
}

// ─── HEADER (title card — preserving site uniformity) ──────────────────────
function HeaderOnly() {
  return (
    <div className="w-full">
      <GlassPanel className="px-5 py-4 sm:px-6">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-2xl font-bold text-[#FF7043]">Candidates</h1>
          <p className="mt-2 text-sm text-slate-500 max-w-lg leading-snug">
            Review and manage your active pipeline. Search by name or role,
            filter by location, and on Enterprise use advanced queries to dial in
            exactly who you need.
          </p>
        </div>
      </GlassPanel>
    </div>
  );
}

function RightToolsCard({ whyMode, creditsLeft = null }) {
  const { isEnterprise } = usePlan();
  const resolvedMode = whyMode || (isEnterprise ? "full" : "lite");
  const isFull = resolvedMode === "full";

  return (
    <GlassPanel className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-slate-900">Tips</div>
          <div className="mt-1 text-xs text-slate-600">Fast workflows, clean signal.</div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={
              "text-[11px] px-2 py-0.5 rounded-full border bg-white/60 " +
              (isFull
                ? "border-emerald-200 text-emerald-700"
                : "border-amber-200 text-amber-700")
            }
          >
            {isFull ? "WHY: Full" : "WHY: Lite"}
          </span>
          <WhyInfo />
        </div>
      </div>
      <div className="mt-3 text-sm text-slate-700 space-y-2">
        <p>Start with a short query, then refine. Enterprise teams can use advanced queries when the pool is large.</p>
        <p>Tag top candidates to build quick outreach lists and keep your pipeline clean.</p>
        <div className="pt-2">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1">
              <span className="font-semibold text-slate-800">Explainability</span>
              <span className="text-slate-500">shows evidence, not buzzwords.</span>
            </span>
            {creditsLeft != null && !isFull && (
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full border border-[#FF7043]/25 bg-[#FFEDE6]/70 text-[#FF7043]">
                {creditsLeft} left
              </span>
            )}
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}

// ─── BODY ─────────────────────────────────────────────────────────────────
function Body() {
  const { isEnterprise } = usePlan();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // [FIX 1 + FIX 3] Drives two-row command bar and mobile compare sheet
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const [recruiterUserId, setRecruiterUserId] = useState(null);
  useEffect(() => {
    let cancelled = false;
    async function loadUser() {
      try {
        const session = await getSessionDirect(4000);
        const uid = session?.user?.id || null;
        if (!cancelled) setRecruiterUserId(uid || null);
      } catch {
        if (!cancelled) setRecruiterUserId(null);
      }
    }
    loadUser();
    return () => { cancelled = true; };
  }, []);

  const candidateIdFromQuery =
    typeof router.query.candidateId === "string"
      ? router.query.candidateId
      : typeof router.query.id === "string"
      ? router.query.id
      : null;

  const [didAutoOpenFromQuery, setDidAutoOpenFromQuery] = useState(false);

  // Filters
  const [nameQuery, setNameQuery] = useState("");
  const [locQuery, setLocQuery] = useState("");
  const [boolQuery, setBoolQuery] = useState("");

  // Targeting filters
  const [summaryKeywords, setSummaryKeywords] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [workStatus, setWorkStatus] = useState("");
  const [preferredWorkType, setPreferredWorkType] = useState("");
  const [willingToRelocate, setWillingToRelocate] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [skills, setSkills] = useState("");
  const [languages, setLanguages] = useState("");
  const [education, setEducation] = useState("");

  // Automation state
  const [automationEnabled, setAutomationEnabled] = useState(false);
  const [automationName, setAutomationName] = useState("");
  const [automationSaving, setAutomationSaving] = useState(false);
  const [automationMessage, setAutomationMessage] = useState(null);

  // Targeting drawer
  const [targetingOpen, setTargetingOpen] = useState(false);

  // Data
  const [candidates, setCandidates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [manualSearching, setManualSearching] = useState(false);

  const hasWhyFull = isEnterprise;
  const hasWhyLite = true;
  const whyMode = hasWhyFull ? "full" : hasWhyLite ? "lite" : "off";
  const [whyCreditsLeft, setWhyCreditsLeft] = useState(hasWhyFull ? null : 100);

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const onView = (c) => { setSelected(c); setOpen(true); };

  const [personaOpen, setPersonaOpen] = useState(false);
  const [personaCandidate, setPersonaCandidate] = useState(null);

  const buildDemoCandidates = () => [
    {
      id: "demo-1",
      name: "Demo Candidate",
      title: "Senior Customer Success Manager",
      currentTitle: "Senior Customer Success Manager",
      location: "Remote (US)",
      match: 91,
      email: "demo@example.com",
      tags: [],
      notes: "",
    },
  ];

  const buildCandidateParams = useCallback(() => {
    const params = new URLSearchParams();

    if (nameQuery) params.set("q", nameQuery);

    const effectiveLocation = locQuery || locationFilter;
    if (effectiveLocation) params.set("location", effectiveLocation);

    if (boolQuery) params.set("bool", boolQuery);
    if (summaryKeywords) params.set("summaryKeywords", summaryKeywords);
    if (jobTitle) params.set("jobTitle", jobTitle);
    if (workStatus) params.set("workStatus", workStatus);
    if (preferredWorkType) params.set("preferredWorkType", preferredWorkType);
    if (willingToRelocate) params.set("willingToRelocate", willingToRelocate);
    if (skills) params.set("skills", skills);
    if (languages) params.set("languages", languages);
    if (education) params.set("education", education);

    return params;
  }, [
    nameQuery,
    locQuery,
    locationFilter,
    boolQuery,
    summaryKeywords,
    jobTitle,
    workStatus,
    preferredWorkType,
    willingToRelocate,
    skills,
    languages,
    education,
  ]);

  const activeFilterCount = useMemo(() => {
    return [
      summaryKeywords,
      jobTitle,
      workStatus,
      preferredWorkType,
      willingToRelocate,
      locationFilter,
      skills,
      languages,
      education,
    ].filter(Boolean).length;
  }, [
    summaryKeywords,
    jobTitle,
    workStatus,
    preferredWorkType,
    willingToRelocate,
    locationFilter,
    skills,
    languages,
    education,
  ]);

  const hasAnyTargeting = activeFilterCount > 0;

  const activeChips = useMemo(() => {
    const chips = [];
    if (nameQuery) chips.push({ key: "q", label: `"${nameQuery}"` });
    if (locQuery) chips.push({ key: "loc", label: `📍 ${locQuery}` });
    if (boolQuery) chips.push({ key: "bool", label: `Query: ${boolQuery.slice(0, 30)}${boolQuery.length > 30 ? "…" : ""}` });
    if (summaryKeywords) chips.push({ key: "summary", label: `Keywords: ${summaryKeywords}` });
    if (jobTitle) chips.push({ key: "title", label: `Role: ${jobTitle}` });
    if (workStatus) chips.push({ key: "status", label: `Status: ${workStatus}` });
    if (preferredWorkType) chips.push({ key: "worktype", label: `Work type: ${preferredWorkType}` });
    if (willingToRelocate) chips.push({ key: "relocate", label: `Relocate: ${willingToRelocate}` });
    if (locationFilter) chips.push({ key: "prefLoc", label: `Preferred location: ${locationFilter}` });
    if (skills) chips.push({ key: "skills", label: `Skills: ${skills}` });
    if (languages) chips.push({ key: "langs", label: `Languages: ${languages}` });
    if (education) chips.push({ key: "edu", label: `Education: ${education}` });
    return chips;
  }, [nameQuery, locQuery, boolQuery, summaryKeywords, jobTitle, workStatus, preferredWorkType, willingToRelocate, locationFilter, skills, languages, education]);

  const clearSearchFilters = () => { setNameQuery(""); setLocQuery(""); setBoolQuery(""); };
  const clearTargeting = () => {
    setSummaryKeywords("");
    setJobTitle("");
    setWorkStatus("");
    setPreferredWorkType("");
    setWillingToRelocate("");
    setLocationFilter("");
    setSkills("");
    setLanguages("");
    setEducation("");
  };
  const clearAll = () => { clearSearchFilters(); clearTargeting(); };

  const removeChipByKey = (key) => {
    const map = {
      q: () => setNameQuery(""),
      loc: () => setLocQuery(""),
      bool: () => setBoolQuery(""),
      summary: () => setSummaryKeywords(""),
      title: () => setJobTitle(""),
      status: () => setWorkStatus(""),
      worktype: () => setPreferredWorkType(""),
      relocate: () => setWillingToRelocate(""),
      prefLoc: () => setLocationFilter(""),
      skills: () => setSkills(""),
      langs: () => setLanguages(""),
      edu: () => setEducation(""),
    };
    map[key]?.();
  };

  const normalizeList = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val.filter(Boolean).map(String);
    if (typeof val === "string") return val.split(/[,|]/g).map((s) => s.trim()).filter(Boolean);
    return [];
  };
  const uniq = (arr) => Array.from(new Set((arr || []).filter(Boolean)));
  const pickFirstName = (fullName) => String(fullName || "").trim().split(" ")[0] || "";
  const containsAnyKeyword = (haystack, keywords) => {
    const h = String(haystack || "").toLowerCase();
    return (keywords || []).some((k) => h.includes(String(k || "").toLowerCase()));
  };
  const getCandidateSkills = (c) => uniq([].concat(normalizeList(c?.skills)).concat(normalizeList(c?.topSkills)).concat(normalizeList(c?.skillTags)).concat(normalizeList(c?.profile?.skills)).concat(normalizeList(c?.resume?.skills))).slice(0, 24);
  const getCandidateLanguages = (c) => uniq([].concat(normalizeList(c?.languages)).concat(normalizeList(c?.profile?.languages))).slice(0, 12);
  const getCandidateEducation = (c) => uniq([].concat(normalizeList(c?.education)).concat(normalizeList(c?.educationList)).concat(normalizeList(c?.degrees)).concat(normalizeList(c?.profile?.education)).concat(normalizeList(c?.resume?.education))).slice(0, 24);
  const getCandidateSummaryText = (c) => c?.summary || c?.headline || c?.about || c?.profile?.summary || c?.profile?.headline || "";
  const getCandidateTrajectory = (c) => {
    if (Array.isArray(c?.trajectory)) return c.trajectory;
    if (Array.isArray(c?.careerPath)) return c.careerPath;
    const wh = c?.workHistory || c?.experience || c?.profile?.workHistory || [];
    if (!Array.isArray(wh)) return [];
    return wh.filter(Boolean).slice(0, 6).map((t) => ({ title: t.title || t.role || "", company: t.company || t.employer || "", from: t.from || t.start || t.startDate || "", to: t.to || t.end || t.endDate || "" })).filter((t) => t.title || t.company);
  };

  const buildFiltersTriggered = () => {
    const filters = [];
    if (nameQuery) filters.push(`Name/role: ${nameQuery}`);
    if (locQuery || locationFilter) {
      filters.push(`Location: ${locQuery || locationFilter}`);
    }
    if (boolQuery) filters.push(`Advanced query: ${boolQuery}`);
    if (summaryKeywords) filters.push(`Summary keywords: ${summaryKeywords}`);
    if (jobTitle) filters.push(`Job title: ${jobTitle}`);
    if (workStatus) filters.push(`Work status: ${workStatus}`);
    if (preferredWorkType) filters.push(`Work type: ${preferredWorkType}`);
    if (willingToRelocate) filters.push(`Relocate: ${willingToRelocate}`);
    if (skills) filters.push(`Skills: ${skills}`);
    if (languages) filters.push(`Languages: ${languages}`);
    if (education) filters.push(`Education: ${education}`);
    return filters;
  };

  const personalizeWhyExplain = (candidate, baseExplain) => {
    const c = candidate || {};
    const ex = baseExplain && typeof baseExplain === "object" ? { ...baseExplain } : {};
    const firstName = pickFirstName(c?.name);
    const candidateTitle = c?.currentTitle || c?.title || c?.role || "";
    const candidateLocation = c?.location || c?.city || c?.region || "";
    if (typeof c?.match === "number") ex.score = c.match;
    else if (typeof ex?.score !== "number") ex.score = 0;
    ex.filters_triggered = buildFiltersTriggered();
    const filterSkills = normalizeList(skills);
    const candSkills = getCandidateSkills(c);
    const matched = filterSkills.length ? uniq(filterSkills.filter((s) => candSkills.map((x) => x.toLowerCase()).includes(s.toLowerCase()))) : candSkills.slice(0, 8);
    const gaps = filterSkills.length ? uniq(filterSkills.filter((s) => !candSkills.map((x) => x.toLowerCase()).includes(s.toLowerCase()))).slice(0, 10) : [];
    ex.skills = ex.skills && typeof ex.skills === "object" ? { ...ex.skills } : {};
    ex.skills.matched = (ex.skills.matched?.length ? ex.skills.matched : matched) || [];
    ex.skills.gaps = (ex.skills.gaps?.length ? ex.skills.gaps : gaps) || [];
    ex.skills.transferable = ex.skills.transferable || [];
    const traj = getCandidateTrajectory(c);
    if (!Array.isArray(ex.trajectory) || ex.trajectory.length === 0) ex.trajectory = traj;
    const baseSummary = String(ex.summary || "").trim();
    const needsBetterSummary = !baseSummary || baseSummary.toLowerCase().includes("candidate") || baseSummary.toLowerCase().includes("strong match") || baseSummary.toLowerCase().includes("recommended");
    if (needsBetterSummary) {
      const parts = [];
      if (candidateTitle) parts.push(`title alignment (${candidateTitle})`);
      if (candidateLocation) parts.push(`location fit (${candidateLocation})`);
      if (matched?.length) parts.push(`skills overlap (${matched.slice(0, 4).join(", ")})`);
      if (jobTitle) parts.push(`target role signal (${jobTitle})`);
      ex.summary = `${firstName || "Candidate"} recommended based on ${parts.length ? parts.join(", ") : "available profile signals"}.`;
    } else if (firstName && !baseSummary.startsWith(`${firstName}:`)) {
      ex.summary = `${firstName}: ${baseSummary}`;
    }
    const baseReasons = Array.isArray(ex.reasons) ? ex.reasons : [];
    const baseLooksEmpty = baseReasons.length === 0;
    const builtReasons = [];
    if (jobTitle || candidateTitle) {
      const req = jobTitle ? `Role alignment: ${jobTitle}` : `Role alignment`;
      const evidence = [];
      if (candidateTitle) evidence.push({ text: `Current title: ${candidateTitle}`, source: "Profile" });
      if (c?.title && c?.currentTitle && c?.title !== c?.currentTitle) evidence.push({ text: `Listed role: ${c.title}`, source: "Profile" });
      if (evidence.length) builtReasons.push({ requirement: req, evidence });
    }
    if (filterSkills.length || candSkills.length) {
      const req = filterSkills.length ? `Skills match: ${filterSkills.slice(0, 6).join(", ")}` : `Skills match`;
      const evidence = [];
      if (matched?.length) evidence.push({ text: `Matched skills: ${matched.slice(0, 6).join(", ")}`, source: "Skills" });
      if (gaps?.length) evidence.push({ text: `Gaps: ${gaps.slice(0, 4).join(", ")}`, source: "Skills" });
      if (!matched?.length && candSkills.length) evidence.push({ text: `Top skills listed: ${candSkills.slice(0, 6).join(", ")}`, source: "Profile" });
      if (evidence.length) builtReasons.push({ requirement: req, evidence });
    }
    const filterEdu = normalizeList(education);
    const candEdu = getCandidateEducation(c);
    if (filterEdu.length || candEdu.length) {
      const req = filterEdu.length ? `Education alignment: ${filterEdu.slice(0, 6).join(", ")}` : `Education alignment`;
      const evidence = [];
      if (candEdu.length) evidence.push({ text: `Education listed: ${candEdu.slice(0, 8).join(", ")}`, source: "Profile" });
      if (evidence.length) builtReasons.push({ requirement: req, evidence });
    }
    if (locQuery || candidateLocation || preferredWorkType) {
      const reqParts = [];
      if (locQuery) reqParts.push(`Location: ${locQuery}`);
      if (preferredWorkType) reqParts.push(`Work type: ${preferredWorkType}`);
      const req = reqParts.length ? `Logistics fit: ${reqParts.join(" • ")}` : `Logistics fit`;
      const evidence = [];
      if (candidateLocation) evidence.push({ text: `Candidate location: ${candidateLocation}`, source: "Profile" });
      if (c?.remotePreference) evidence.push({ text: `Work preference: ${c.remotePreference}`, source: "Profile" });
      if (c?.preferredWorkType) evidence.push({ text: `Work type: ${c.preferredWorkType}`, source: "Profile" });
      if (evidence.length) builtReasons.push({ requirement: req, evidence });
    }
    const kw = normalizeList(summaryKeywords);
    const summaryText = getCandidateSummaryText(c);
    if (kw.length && summaryText && containsAnyKeyword(summaryText, kw)) {
      builtReasons.push({ requirement: `Keyword alignment: ${kw.slice(0, 6).join(", ")}`, evidence: [{ text: "Keywords appear in candidate summary/headline.", source: "Profile" }] });
    }
    const filterLang = normalizeList(languages);
    const candLang = getCandidateLanguages(c);
    if (filterLang.length || candLang.length) {
      const req = filterLang.length ? `Language alignment: ${filterLang.slice(0, 6).join(", ")}` : `Language alignment`;
      const evidence = [];
      if (candLang.length) evidence.push({ text: `Languages listed: ${candLang.join(", ")}`, source: "Profile" });
      if (evidence.length) builtReasons.push({ requirement: req, evidence });
    }
    const looksGeneric = baseReasons.length && baseReasons.every((r) => { const req = String(r?.requirement || "").toLowerCase(); const ev = Array.isArray(r?.evidence) ? r.evidence : []; return !req || req.includes("requirement") || ev.length === 0; });
    if (baseLooksEmpty || looksGeneric) ex.reasons = builtReasons.slice(0, 10);
    else ex.reasons = baseReasons;
    return ex;
  };

  const runManualCandidateSearch = async () => {
    setActionError(null);
    setLoadError(null);
    try {
      setManualSearching(true);
      setIsLoading(true);
      const params = buildCandidateParams();
      const res = await fetch(`/api/recruiter/candidates${params.toString() ? `?${params.toString()}` : ""}`);
      if (!res.ok) {
        if (process.env.NEXT_PUBLIC_FAKE_CANDIDATES === "1") { setCandidates(buildDemoCandidates()); setLoadError(null); return; }
        throw new Error(`Failed to load candidates: ${res.status}`);
      }
      const json = await res.json();
      let list = Array.isArray(json.candidates) ? json.candidates : [];
      if (!list.length && process.env.NEXT_PUBLIC_FAKE_CANDIDATES === "1") list = buildDemoCandidates();
      setCandidates(list);
      setLoadError(null);
    } catch (err) {
      console.error("[Candidates] manual search error:", err);
      if (process.env.NEXT_PUBLIC_FAKE_CANDIDATES === "1") { setCandidates(buildDemoCandidates()); setLoadError(null); }
      else setLoadError("We had trouble loading candidates. Contact the Support Team if communication isn't provided in 30 minutes.");
    } finally {
      setIsLoading(false);
      setManualSearching(false);
    }
  };

  const startConversation = async (candidate, channel) => {
    if (!candidate) return;
    const resolvedRecruiterId = recruiterUserId || RECRUITER_DEV_USER_ID || null;
    if (!resolvedRecruiterId) { alert("We couldn't load your session yet. Please refresh and try again."); return; }
    try {
      const recipientId = candidate.userId || candidate.id;
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": resolvedRecruiterId },
        body: JSON.stringify({ recipientId, channel }),
      });
      if (!res.ok) { alert("We couldn't open a conversation yet. Please try again in a moment."); return; }
      const json = await res.json();
      const conv = json?.conversation;
      if (!conv || !conv.id) { alert("We couldn't open a conversation yet. Please try again in a moment."); return; }
      const destName = candidate.name || "";
      const firstName = destName.split(" ")[0] || "";
      const prefill = firstName
        ? `Hi ${firstName}, thanks for connecting - I'd love to chat about a role that looks like a strong match for your background.`
        : `Hi there, thanks for connecting - I'd love to chat about a role that looks like a strong match for your background.`;
      const candidateUserId = String(candidate.userId || candidate.id || "");
      const otherUserId = conv.otherUserId || conv.otherUser?.id || candidateUserId || "";
      if (channel === "recruiter") {
        router.push({ pathname: "/recruiter/messaging", query: { c: conv.id, candidateId: candidate.id, candidateUserId, toUserId: otherUserId, name: destName, role: candidate.role || candidate.title || "", prefill } });
      } else {
        router.push({ pathname: "/seeker/messages", query: { c: conv.id, toUserId: otherUserId, name: destName, role: candidate.role || candidate.title || "", prefill } });
      }
    } catch (err) {
      console.error("[Candidates] startConversation error:", err);
      alert("We couldn't open a conversation yet. Please try again in a moment.");
    }
  };

  const onMessage = (c) => { if (!c) return; setPersonaCandidate(c); setPersonaOpen(true); };

  // ✅ FIX: targeting fields removed from deps — only quick filters fire automatically
  useEffect(() => {
    let isMounted = true;
    async function fetchCandidates() {
      try {
        setIsLoading(true);
        setLoadError(null);
        const params = buildCandidateParams();
        const res = await fetch(`/api/recruiter/candidates${params.toString() ? `?${params.toString()}` : ""}`);
        if (!res.ok) {
          if (process.env.NEXT_PUBLIC_FAKE_CANDIDATES === "1") { if (!isMounted) return; setCandidates(buildDemoCandidates()); setLoadError(null); return; }
          throw new Error(`Failed to load candidates: ${res.status}`);
        }
        const json = await res.json();
        if (!isMounted) return;
        let list = Array.isArray(json.candidates) ? json.candidates : [];
        if (!list.length && process.env.NEXT_PUBLIC_FAKE_CANDIDATES === "1") list = buildDemoCandidates();
        setCandidates(list);
        setLoadError(null);
      } catch (err) {
        console.error("[Candidates] load error:", err);
        if (!isMounted) return;
        if (process.env.NEXT_PUBLIC_FAKE_CANDIDATES === "1") { setCandidates(buildDemoCandidates()); setLoadError(null); }
        else setLoadError("We had trouble loading candidates. Contact the Support Team if communication isn't provided in 30 minutes.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    fetchCandidates();
    return () => { isMounted = false; };
  }, [nameQuery, locQuery, boolQuery]);

  useEffect(() => {
    if (!candidateIdFromQuery || didAutoOpenFromQuery || isLoading || !candidates.length) return;
    const match = candidates.find((c) => String(c?.id || "") === String(candidateIdFromQuery)) || candidates.find((c) => String(c?.userId || "") === String(candidateIdFromQuery)) || null;
    if (!match) return;
    setSelected(match); setOpen(true); setDidAutoOpenFromQuery(true);
  }, [candidateIdFromQuery, didAutoOpenFromQuery, isLoading, candidates]);

  useEffect(() => {
    let isMounted = true;
    async function loadAutomation() {
      try {
        const res = await fetch("/api/recruiter/candidates/automation");
        if (!res.ok) return;
        const json = await res.json();
        if (!isMounted) return;
        const automation = json?.automation;
        if (!automation) return;
        setAutomationEnabled(Boolean(automation.enabled));
        setAutomationName(automation.name || "");
        const f = automation.filters || {};
        if (typeof f.summaryKeywords === "string") setSummaryKeywords(f.summaryKeywords);
        if (typeof f.jobTitle === "string") setJobTitle(f.jobTitle);
        if (typeof f.workStatus === "string") setWorkStatus(f.workStatus);
        if (typeof f.preferredWorkType === "string") setPreferredWorkType(f.preferredWorkType);
        if (typeof f.relocate === "string") setWillingToRelocate(f.relocate);
        if (typeof f.location === "string") setLocationFilter(f.location);
        if (typeof f.skills === "string") setSkills(f.skills);
        if (typeof f.languages === "string") setLanguages(f.languages);
        if (typeof f.education === "string") setEducation(f.education);
      } catch (err) { console.error("[Candidates] automation load error:", err); }
    }
    loadAutomation();
    return () => { isMounted = false; };
  }, []);

  const saveNotes = async (id, text) => {
    setActionError(null);
    setCandidates((prev) => prev.map((c) => (c.id === id ? { ...c, notes: text } : c)));
    try {
      const res = await fetch("/api/recruiter/candidates/notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ candidateId: id, notes: text }) });
      if (!res.ok) { const payload = await res.json().catch(() => ({})); throw new Error(payload?.error || `Failed to save candidate notes (status ${res.status}).`); }
    } catch (err) { console.error("[Candidates] saveNotes error:", err); setActionError("We couldn't save candidate notes. Your changes may not be stored yet."); }
  };

  const toggleTag = async (id, tag) => {
    setActionError(null);
    let updatedTags = null;
    setCandidates((prev) => prev.map((c) => {
      if (c.id !== id) return c;
      const currentTags = Array.isArray(c.tags) ? c.tags : [];
      const has = currentTags.includes(tag);
      const next = has ? currentTags.filter((t) => t !== tag) : [...currentTags, tag];
      updatedTags = next;
      return { ...c, tags: next };
    }));
    if (!updatedTags) return;
    try {
      const res = await fetch("/api/recruiter/candidates/tags", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ candidateId: id, tags: updatedTags }) });
      if (!res.ok) { const payload = await res.json().catch(() => ({})); throw new Error(payload?.error || `Failed to update candidate tags (status ${res.status}).`); }
    } catch (err) { console.error("[Candidates] toggleTag error:", err); setActionError("We couldn't update candidate tags. Your changes may not be stored yet."); }
  };

  const [whyOpen, setWhyOpen] = useState(false);
  const [whyData, setWhyData] = useState(null);
  const [whyCandidate, setWhyCandidate] = useState(null);

  const fetchWhyExplainForCandidate = async (c) => {
    if (!c) return getMockExplain();
    let ex;
    try {
      const res = await fetch("/api/recruiter/candidates/why", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId: c.id, jobId: null, filters: { q: nameQuery || null, location: (locQuery || locationFilter) || null, bool: boolQuery || null, summaryKeywords: summaryKeywords || null, jobTitle: jobTitle || null, workStatus: workStatus || null, preferredWorkType: preferredWorkType || null, relocate: willingToRelocate || null, skills: skills || null, languages: languages || null, education: education || null } }),
      });
      if (!res.ok) throw new Error(`WHY API failed (status ${res.status})`);
      ex = await res.json();
    } catch (err) { console.error("[Candidates] WHY API error:", err); ex = getMockExplain(); }
    return personalizeWhyExplain(c, ex);
  };

  const onWhy = async (c) => {
    if (whyMode === "off") return;
    if (!hasWhyFull && whyCreditsLeft === 0) return;
    const ex = await fetchWhyExplainForCandidate(c);
    setWhyCandidate(c); setWhyData(ex); setWhyOpen(true);
    const snapshot = mkWhySnapshot(ex, whyMode);
    const evt = { type: "why_opened", ts: new Date().toISOString(), orgId: null, jobId: null, candidateId: c.id, role: "recruiter", snapshot };
    if (typeof Analytics.logWhyOpened === "function") Analytics.logWhyOpened({ ...evt, score: ex.score, mode: whyMode, explain: ex });
    else if (typeof Analytics.logEvent === "function") Analytics.logEvent(evt);
    if (!hasWhyFull) setWhyCreditsLeft((n) => Math.max(0, (n || 0) - 1));
  };

  const [compareSelectedIds, setCompareSelectedIds] = useState([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareCandidates, setCompareCandidates] = useState({ a: null, b: null });
  const [compareExplains, setCompareExplains] = useState({ a: null, b: null });

  const resetCompare = () => { setCompareOpen(false); setCompareSelectedIds([]); setCompareCandidates({ a: null, b: null }); setCompareExplains({ a: null, b: null }); };

  const openCompareForTwo = async (aCandidate, bCandidate) => {
    if (!aCandidate || !bCandidate || whyMode === "off") return;
    if (!hasWhyFull && (whyCreditsLeft || 0) < 2) return;
    const [aExplain, bExplain] = await Promise.all([fetchWhyExplainForCandidate(aCandidate), fetchWhyExplainForCandidate(bCandidate)]);
    setCompareCandidates({ a: aCandidate, b: bCandidate }); setCompareExplains({ a: aExplain, b: bExplain }); setCompareOpen(true);
    if (!hasWhyFull) setWhyCreditsLeft((n) => Math.max(0, (n || 0) - 2));
  };

  const onToggleCompare = async (candidate) => {
    if (!candidate?.id) return;
    setActionError(null);
    setCompareSelectedIds((prev) => {
      const id = candidate.id;
      const has = prev.includes(id);
      if (has) { const next = prev.filter((x) => x !== id); if (compareOpen) setTimeout(() => resetCompare(), 0); return next; }
      if (prev.length === 0) return [id];
      const firstId = prev[0];
      const firstCandidate = candidates.find((c) => c.id === firstId) || null;
      setTimeout(() => { openCompareForTwo(firstCandidate, candidate); }, 0);
      return [firstId, id];
    });
  };

  const saveAutomationConfig = async () => {
    setAutomationMessage(null); setActionError(null);
    try {
      setAutomationSaving(true);
      const payload = { name: automationName || null, enabled: automationEnabled, filters: { q: nameQuery || null, location: (locQuery || locationFilter) || null, bool: boolQuery || null, summaryKeywords: summaryKeywords || null, jobTitle: jobTitle || null, workStatus: workStatus || null, preferredWorkType: preferredWorkType || null, relocate: willingToRelocate || null, skills: skills || null, languages: languages || null, education: education || null } };
      const res = await fetch("/api/recruiter/candidates/automation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(`Automation API failed (status ${res.status})`);
      setAutomationMessage("Automation settings saved for your daily candidate feed.");
    } catch (err) { console.error("[Candidates] automation save error:", err); setAutomationMessage("We couldn't save automation settings yet. This feature may not be fully wired on your account."); }
    finally { setAutomationSaving(false); }
  };

  const splitForColumns = (list) => {
    const src = Array.isArray(list) ? list : [];
    const left = [], right = [];
    for (let i = 0; i < src.length; i++) (i % 2 === 0 ? left : right).push(src[i]);
    return { left, right };
  };
  const { left: leftCandidates, right: rightCandidates } = splitForColumns(candidates);

  if (!mounted) {
    return (
      <GlassPanel className="px-5 py-8 sm:px-6">
        <div className="text-sm text-slate-700 font-medium">Loading candidates...</div>
        <div className="mt-2 text-xs text-slate-600">Pulling your latest pipeline and signals.</div>
      </GlassPanel>
    );
  }

  return (
    <div
      className="candidates-mobile-clamp"
      style={{
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        overflowX: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* ── ERROR BANNERS ─────────────────────────────────────────── */}
      {loadError && (
        <GlassPanel className="mb-3 px-5 py-3 sm:px-6 border-red-200/50 bg-red-50/60">
          <div className="text-xs text-red-700">{loadError}</div>
        </GlassPanel>
      )}
      {actionError && (
        <GlassPanel className="mb-3 px-5 py-3 sm:px-6 border-amber-200/50 bg-amber-50/60">
          <div className="text-xs text-amber-800">{actionError}</div>
        </GlassPanel>
      )}

      {/* ── COMMAND BAR ───────────────────────────────────────────── */}
      <CommandBar
        nameQuery={nameQuery} setNameQuery={setNameQuery}
        locQuery={locQuery} setLocQuery={setLocQuery}
        boolQuery={boolQuery} setBoolQuery={setBoolQuery}
        isEnterprise={isEnterprise}
        isLoading={isLoading}
        candidateCount={candidates.length}
        compareSelectedIds={compareSelectedIds}
        manualSearching={manualSearching}
        activeChips={activeChips}
        onOpenTargeting={() => setTargetingOpen(true)}
        activeFilterCount={activeFilterCount}
        onClearSearch={clearSearchFilters}
        onClearTargeting={clearTargeting}
        onClearAll={clearAll}
        onRemoveChip={removeChipByKey}
        isMobile={isMobile}
      />

      {/* ── TARGETING DRAWER ──────────────────────────────────────── */}
      <TargetingDrawer
        open={targetingOpen}
        onClose={() => setTargetingOpen(false)}
        filters={{ summaryKeywords, jobTitle, workStatus, preferredWorkType, willingToRelocate, locationFilter, skills, languages, education }}
        setFilters={{ setSummaryKeywords, setJobTitle, setWorkStatus, setPreferredWorkType, setWillingToRelocate, setLocationFilter, setSkills, setLanguages, setEducation }}
        automation={{ enabled: automationEnabled, setEnabled: setAutomationEnabled, name: automationName, setName: setAutomationName, saving: automationSaving, message: automationMessage, onSave: saveAutomationConfig }}
        onFindCandidates={runManualCandidateSearch}
        onClearTargeting={clearTargeting}
        manualSearching={manualSearching}
        isLoading={isLoading}
        activeFilterCount={activeFilterCount}
      />

      {/* ── CANDIDATE GRID ────────────────────────────────────────── */}
      {isLoading ? (
        <GlassPanel className="px-5 py-8 sm:px-6">
          <div className="text-sm text-slate-700 font-medium">Loading candidates...</div>
          <div className="mt-2 text-xs text-slate-600">Pulling your latest pipeline and signals.</div>
        </GlassPanel>
      ) : candidates.length === 0 ? (
        <GlassPanel className="px-5 py-10 sm:px-6">
          <div className="text-sm font-semibold text-slate-900">No candidates found</div>
          <div className="mt-1 text-xs text-slate-600 max-w-2xl">
            Try a broader query, remove a filter, or open Targeting to adjust your criteria.
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={clearAll}
              className="text-xs px-3 py-1.5 rounded-full border border-white/40 bg-white/60 text-slate-700 hover:bg-white/80"
            >
              Clear all filters
            </button>
            <button
              onClick={runManualCandidateSearch}
              className="text-xs px-3 py-1.5 rounded-full border border-[#FF7043]/25 bg-[#FFEDE6]/70 text-[#FF7043] hover:bg-[#FFEDE6]/90"
            >
              Run search
            </button>
            <button
              onClick={() => setTargetingOpen(true)}
              className="text-xs px-3 py-1.5 rounded-full border border-[#FF7043]/25 bg-[#FFEDE6]/70 text-[#FF7043] hover:bg-[#FFEDE6]/90"
            >
              Open Targeting
            </button>
          </div>
        </GlassPanel>
      ) : (
        <div className="pt-0" style={{ width: "100%", maxWidth: "100%", minWidth: 0, overflowX: "hidden" }}>
          <div className="block lg:hidden" style={{ width: "100%", maxWidth: "100%", minWidth: 0, overflowX: "hidden" }}>
            <CandidateList
              candidates={candidates}
              isEnterprise={isEnterprise}
              onView={onView}
              onMessage={onMessage}
              onWhy={onWhy}
              onToggleCompare={onToggleCompare}
              compareSelectedIds={compareSelectedIds}
              showFilters={false}
              showFilterBar={false}
              filtersVisible={false}
              query={nameQuery}
              locationFilter={locQuery}
              booleanQuery={boolQuery}
            />
          </div>
          <div className="hidden lg:grid lg:grid-cols-2 gap-4">
            <CandidateList
              candidates={leftCandidates}
              isEnterprise={isEnterprise}
              onView={onView}
              onMessage={onMessage}
              onWhy={onWhy}
              onToggleCompare={onToggleCompare}
              compareSelectedIds={compareSelectedIds}
              showFilters={false}
              showFilterBar={false}
              filtersVisible={false}
              query={nameQuery}
              locationFilter={locQuery}
              booleanQuery={boolQuery}
            />
            <CandidateList
              candidates={rightCandidates}
              isEnterprise={isEnterprise}
              onView={onView}
              onMessage={onMessage}
              onWhy={onWhy}
              onToggleCompare={onToggleCompare}
              compareSelectedIds={compareSelectedIds}
              showFilters={false}
              showFilterBar={false}
              filtersVisible={false}
              query={nameQuery}
              locationFilter={locQuery}
              booleanQuery={boolQuery}
            />
          </div>
        </div>
      )}

      {/* ── MODALS ────────────────────────────────────────────────── */}
      <CandidateProfileModal
        open={open}
        onClose={() => setOpen(false)}
        candidate={selected}
        onSaveNotes={saveNotes}
        onToggleTag={toggleTag}
      />
      <WhyCandidateDrawer
        open={whyOpen}
        onClose={() => setWhyOpen(false)}
        explain={whyData}
        mode={whyMode}
        onViewCandidate={() => { if (whyCandidate) { setSelected(whyCandidate); setOpen(true); } setWhyOpen(false); }}
      />

      {/* [FIX 3] Tabbed bottom sheet on mobile; side-by-side drawer on desktop */}
      {isMobile ? (
        <MobileCompareSheet
          open={compareOpen}
          onClose={resetCompare}
          mode={whyMode}
          left={{ candidate: compareCandidates?.a, explain: compareExplains?.a }}
          right={{ candidate: compareCandidates?.b, explain: compareExplains?.b }}
          onViewLeft={() => { if (compareCandidates?.a) { setSelected(compareCandidates.a); setOpen(true); } }}
          onViewRight={() => { if (compareCandidates?.b) { setSelected(compareCandidates.b); setOpen(true); } }}
        />
      ) : (
        <WhyCandidateCompareDrawer
          open={compareOpen}
          onClose={resetCompare}
          mode={whyMode}
          left={{ candidate: compareCandidates?.a, explain: compareExplains?.a }}
          right={{ candidate: compareCandidates?.b, explain: compareExplains?.b }}
          onViewLeft={() => { if (compareCandidates?.a) { setSelected(compareCandidates.a); setOpen(true); } }}
          onViewRight={() => { if (compareCandidates?.b) { setSelected(compareCandidates.b); setOpen(true); } }}
        />
      )}

      <PersonaChoiceModal
        open={personaOpen}
        targetName={personaCandidate?.name}
        description="Recruiter messages stay in your Recruiter Suite inbox. Personal messages go to your Signal inbox so you can network as yourself."
        primaryLabel="Use Recruiter inbox"
        secondaryLabel="Use Personal inbox (Signal)"
        onClose={() => { setPersonaOpen(false); setPersonaCandidate(null); }}
        onPrimary={async () => { const c = personaCandidate; setPersonaOpen(false); setPersonaCandidate(null); if (c) await startConversation(c, "recruiter"); }}
        onSecondary={async () => { const c = personaCandidate; setPersonaOpen(false); setPersonaCandidate(null); if (c) await startConversation(c, "personal"); }}
      />
    </div>
  );
}

export default function CandidatesPage() {
  const RightCard = (props) => <RightToolsCard {...props} />;
  return (
    <PlanProvider>
      <RecruiterLayout
        title="Candidates - ForgeTomorrow"
        header={<HeaderOnly />}
        right={<RightCard />}
        activeNav="candidates"
      >
        <Body />
      </RecruiterLayout>
    </PlanProvider>
  );
}