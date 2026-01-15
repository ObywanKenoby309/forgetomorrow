// components/recruiter/WhyCandidateDrawer.js
import React, { useEffect, useMemo, useState } from "react";
import { PrimaryButton, SecondaryButton } from "@/components/ui/Buttons";
import WhyInfo from "@/components/recruiter/WhyInfo";

/**
 * Default single drawer:
 * Props:
 * - open, onClose, explain, mode ("lite" | "full")
 * - onViewCandidate? : optional callback to open the candidate profile view
 *
 * explain shape:
 * {
 *   score, summary,
 *   reasons: [{ requirement, evidence: [{ text, source }] }],
 *   skills: { matched: [], gaps: [], transferable: [] },
 *   trajectory: [{ title, company, from, to }],
 *   filters_triggered = []
 * }
 */

function CollapsibleSection({
  title,
  isOpen,
  onToggle,
  children,
  right,
  dense = false,
}) {
  return (
    <div className="rounded-lg border bg-white">
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center justify-between gap-3 text-left ${
          dense ? "px-4 py-3" : "px-4 py-4"
        }`}
      >
        <div className="min-w-0 flex-1">
          <div className="font-medium">{title}</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {right ? right : null}
          <span className="text-xs font-semibold text-slate-500">
            {isOpen ? "Collapse" : "Expand"}
          </span>
        </div>
      </button>

      {isOpen ? <div className="px-4 pb-4">{children}</div> : null}
    </div>
  );
}

function WhyPanel({
  title = "Why this candidate",
  explain,
  mode = "lite",
  onClose,
  onViewCandidate,
  showClose = true,
  compactHeader = false,
}) {
  const isFull = mode === "full";
  const {
    score = 0,
    summary = "",
    reasons = [],
    skills = { matched: [], gaps: [], transferable: [] },
    trajectory = [],
    filters_triggered = [],
  } = explain || {};

  // ---------------------------------------------------------------------------
  // ✅ NEW: Prefer the new clean schema if present (falls back to legacy)
  // ---------------------------------------------------------------------------
  const matchedSignals = useMemo(() => {
    const arr =
      explain?.signals?.matched ||
      explain?.matched ||
      [];
    return Array.isArray(arr) ? arr : [];
  }, [explain]);

  // Tier totals: if API provides them, use them. Otherwise infer from matched signals.
  const inferredTotals = useMemo(() => {
    // If the API includes full config totals, use them. Otherwise infer from matched.
    // (Inference is best-effort; table still works even without totals.)
    const tierA = matchedSignals.filter((m) => (m?.tier || "") === "A").length;
    const tierB = matchedSignals.filter((m) => (m?.tier || "") === "B").length;
    return {
      tierAHit: tierA,
      tierBHit: tierB,
      tierATotal: null,
      tierBTotal: null,
    };
  }, [matchedSignals]);

  // Build the scan-table rows from matched signals + (optional) gaps
  const scanRows = useMemo(() => {
    // If your API returns gaps as { signal_id, label, tier }, we can include them as unchecked rows.
    const gapsArr = Array.isArray(explain?.signals?.gaps) ? explain.signals.gaps : [];

    const matchedMap = new Map();
    for (const m of matchedSignals) {
      const label = m?.label || m?.requirement || m?.signal_id || "Requirement";
      const tier = m?.tier || "B";
      const key = `${tier}::${label}`.toLowerCase();
      matchedMap.set(key, { label, tier, matched: true });
    }

    const gapRows = [];
    for (const g of gapsArr) {
      const tier = g?.tier || "B";
      if (tier !== "A" && tier !== "B") continue;
      const label = g?.label || g?.signal_id || "Requirement";
      const key = `${tier}::${label}`.toLowerCase();
      // Only add if not already matched
      if (!matchedMap.has(key)) {
        gapRows.push({ label, tier, matched: false });
      }
    }

    // Combine: show matched first, then gaps, Tier A above Tier B
    const combined = [
      ...Array.from(matchedMap.values()),
      ...gapRows,
    ];

    combined.sort((a, b) => {
      const ta = a.tier === "A" ? 0 : 1;
      const tb = b.tier === "A" ? 0 : 1;
      if (ta !== tb) return ta - tb;
      // Matched first
      if (a.matched !== b.matched) return a.matched ? -1 : 1;
      return String(a.label).localeCompare(String(b.label));
    });

    // Keep it scannable: cap rows in lite mode (full mode can show all)
    if (!isFull) return combined.slice(0, 10);
    return combined;
  }, [matchedSignals, explain, isFull]);

  const tierATotalFromSummary = useMemo(() => {
    // Optional: parse "Matched X/Y core signals (Tier A) and A/B supporting signals (Tier B)" if present.
    // Safe + best-effort. If parse fails, returns nulls.
    const text = String(summary || "");
    const m = text.match(/Matched\s+(\d+)\s*\/\s*(\d+)\s+core\s+signals\s+\(Tier\s+A\)\s+and\s+(\d+)\s*\/\s*(\d+)\s+supporting\s+signals\s+\(Tier\s+B\)/i);
    if (!m) return null;
    return {
      tierAHit: Number(m[1]),
      tierATotal: Number(m[2]),
      tierBHit: Number(m[3]),
      tierBTotal: Number(m[4]),
    };
  }, [summary]);

  const tableStats = tierATotalFromSummary || inferredTotals;

  const reasonsToShow = isFull ? reasons : reasons.slice(0, 2);
  const evidencePerReason = (r) =>
    isFull ? (r.evidence || []) : (r.evidence || []).slice(0, 1);

  const matchedSkills = isFull
    ? skills.matched || []
    : (skills.matched || []).slice(0, 3);

  // Section keys
  const SECTION_KEYS = useMemo(
    () => ({
      summary: "summary",
      requirements: "requirements",
      skills: "skills",
      career: "career",
      filters: "filters",
    }),
    []
  );

  // Default: summary open, everything else closed
  const defaultOpen = useMemo(
    () => ({
      [SECTION_KEYS.summary]: true,
      [SECTION_KEYS.requirements]: false,
      [SECTION_KEYS.skills]: false,
      [SECTION_KEYS.career]: false,
      [SECTION_KEYS.filters]: false,
    }),
    [SECTION_KEYS]
  );

  const [openMap, setOpenMap] = useState(defaultOpen);

  // Reset collapses when the panel content changes (candidate/explain changed)
  useEffect(() => {
    setOpenMap(defaultOpen);
  }, [defaultOpen, explain, mode, title]);

  const setAll = (open) => {
    setOpenMap({
      [SECTION_KEYS.summary]: open,
      [SECTION_KEYS.requirements]: open,
      [SECTION_KEYS.skills]: open,
      [SECTION_KEYS.career]: open,
      [SECTION_KEYS.filters]: open,
    });
  };

  const toggle = (key) => {
    setOpenMap((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const controls = (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setAll(true)}
        className="text-[11px] font-semibold text-slate-600 hover:text-slate-900"
      >
        Expand all
      </button>
      <span className="text-slate-300">•</span>
      <button
        type="button"
        onClick={() => setAll(false)}
        className="text-[11px] font-semibold text-slate-600 hover:text-slate-900"
      >
        Collapse all
      </button>
    </div>
  );

  // Tiny check icon (no extra deps)
  const Check = ({ on }) => (
    <span
      aria-hidden="true"
      className={`inline-flex h-4 w-4 items-center justify-center rounded ${
        on ? "bg-emerald-500" : "bg-slate-200"
      }`}
      title={on ? "Matched" : "Not matched"}
    >
      {on ? <span className="text-white text-[12px] leading-none">✓</span> : null}
    </span>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div
        className={`border-b flex items-center justify-between ${
          compactHeader ? "p-3" : "p-4"
        }`}
      >
        <div className="min-w-0">
          <div className="font-semibold truncate">{title}</div>
          <div className="mt-1">{controls}</div>
        </div>
        {showClose && <SecondaryButton onClick={onClose}>Close</SecondaryButton>}
      </div>

      {/* Body */}
      <div className="p-4 overflow-y-auto grid gap-4">
        {/* Match Summary */}
        <CollapsibleSection
          title="Match Summary"
          isOpen={Boolean(openMap[SECTION_KEYS.summary])}
          onToggle={() => toggle(SECTION_KEYS.summary)}
          right={
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-[#FF7043]">
                {typeof score === "number" ? `${score}%` : "—"}
              </div>
              <WhyInfo />
            </div>
          }
        >
          {!!summary && <p className="text-sm text-slate-600 mt-1">{summary}</p>}
          <p className="mt-2 text-xs text-slate-500">
            AI-assisted rationale; recruiters review and override all decisions.
          </p>
        </CollapsibleSection>

        {/* Requirements → Evidence */}
        <CollapsibleSection
          title={`Requirements matched — ${isFull ? "with evidence" : "top reasons"}`}
          isOpen={Boolean(openMap[SECTION_KEYS.requirements])}
          onToggle={() => toggle(SECTION_KEYS.requirements)}
        >
          {/* ✅ NEW: Scan table first (fast recruiter scan) */}
          <div className="rounded border overflow-hidden bg-white">
            <div className="px-3 py-2 border-b bg-slate-50 flex items-center justify-between gap-3">
              <div className="text-xs font-semibold text-slate-700">
                Requirement
              </div>
              <div className="flex items-center gap-6">
                <div className="text-xs font-semibold text-slate-700 w-[78px] text-center">
                  Matched A
                </div>
                <div className="text-xs font-semibold text-slate-700 w-[78px] text-center">
                  Matched B
                </div>
              </div>
            </div>

            <div className="divide-y">
              {scanRows.length === 0 ? (
                <div className="px-3 py-3 text-sm text-slate-500">
                  No requirement mappings available.
                </div>
              ) : (
                scanRows.map((row, idx) => {
                  const isA = row.tier === "A";
                  const isB = row.tier === "B";
                  return (
                    <div
                      key={`${row.tier}-${row.label}-${idx}`}
                      className="px-3 py-2 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-slate-900 truncate">
                          {row.label}
                        </div>
                      </div>

                      <div className="flex items-center gap-6 shrink-0">
                        <div className="w-[78px] flex items-center justify-center">
                          <Check on={isA && row.matched} />
                        </div>
                        <div className="w-[78px] flex items-center justify-center">
                          <Check on={isB && row.matched} />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer stats row */}
            <div className="px-3 py-2 border-t bg-slate-50 text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
              <span>
                Tier A:{" "}
                <span className="font-semibold">
                  {typeof tableStats.tierAHit === "number" ? tableStats.tierAHit : 0}
                  {typeof tableStats.tierATotal === "number"
                    ? `/${tableStats.tierATotal}`
                    : ""}
                </span>
              </span>
              <span>
                Tier B:{" "}
                <span className="font-semibold">
                  {typeof tableStats.tierBHit === "number" ? tableStats.tierBHit : 0}
                  {typeof tableStats.tierBTotal === "number"
                    ? `/${tableStats.tierBTotal}`
                    : ""}
                </span>
              </span>
              {!isFull ? (
                <span className="text-slate-500">
                  Showing top items. Expand for full view.
                </span>
              ) : null}
            </div>
          </div>

          {/* Existing evidence cards (keep for trust + auditability) */}
          <div className="grid gap-3 mt-4">
            {reasonsToShow.length === 0 ? (
              <div className="text-sm text-slate-500">
                No requirement mappings available.
              </div>
            ) : (
              reasonsToShow.map((r, idx) => (
                <div key={idx} className="rounded border p-3">
                  <div className="text-sm font-semibold">
                    Requirement: {r.requirement}
                  </div>
                  <ul className="text-sm mt-1 grid gap-1">
                    {evidencePerReason(r).map((ev, i) => (
                      <li key={i} className="text-slate-700">
                        — <span className="italic">{ev.text}</span>
                        {ev.source ? (
                          <span className="text-slate-400"> ({ev.source})</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>

          {!isFull && (
            <p className="text-xs text-slate-500 mt-3">
              You’re viewing WHY Lite. Add WHY Plus or upgrade to Enterprise for
              full evidence.
            </p>
          )}
        </CollapsibleSection>

        {/* Skills */}
        <CollapsibleSection
          title="Skills alignment"
          isOpen={Boolean(openMap[SECTION_KEYS.skills])}
          onToggle={() => toggle(SECTION_KEYS.skills)}
        >
          <div
            className={`grid ${
              isFull ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1"
            } gap-3 text-sm`}
          >
            <div>
              <div className="font-semibold mb-1">Matched</div>
              <ul className="grid gap-1">
                {(matchedSkills || []).map((s) => (
                  <li key={s}>• {s}</li>
                ))}
              </ul>
            </div>

            {isFull && (
              <>
                <div>
                  <div className="font-semibold mb-1">Gaps</div>
                  <ul className="grid gap-1">
                    {(skills.gaps || []).map((s) => (
                      <li key={s}>• {s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="font-semibold mb-1">Transferable</div>
                  <ul className="grid gap-1">
                    {(skills.transferable || []).map((s) => (
                      <li key={s}>• {s}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        </CollapsibleSection>

        {/* Career path (Full only) */}
        {isFull && (
          <CollapsibleSection
            title="Career path"
            isOpen={Boolean(openMap[SECTION_KEYS.career])}
            onToggle={() => toggle(SECTION_KEYS.career)}
          >
            <ol className="text-sm grid gap-2">
              {trajectory.length === 0 ? (
                <li className="text-slate-500">No work history found.</li>
              ) : (
                trajectory.map((t, i) => (
                  <li
                    key={`${t.title}-${t.company}-${i}`}
                    className="grid gap-0.5"
                  >
                    <div className="font-semibold">
                      {t.title} — {t.company}
                    </div>
                    <div className="text-slate-600">
                      {t.from} → {t.to || "Present"}
                    </div>
                  </li>
                ))
              )}
            </ol>
          </CollapsibleSection>
        )}

        {/* Filters that triggered */}
        <CollapsibleSection
          title="Matched your filters"
          isOpen={Boolean(openMap[SECTION_KEYS.filters])}
          onToggle={() => toggle(SECTION_KEYS.filters)}
        >
          <div className="flex flex-wrap gap-2">
            {(filters_triggered || []).length ? (
              (filters_triggered || []).map((f) => (
                <span
                  key={f}
                  className="text-xs px-2 py-1 rounded-full border bg-[#FFEDE6] text-[#FF7043]"
                >
                  {f}
                </span>
              ))
            ) : (
              <span className="text-sm text-slate-500">
                No filters triggered recorded.
              </span>
            )}
          </div>
        </CollapsibleSection>
      </div>

      {/* Footer */}
      <div className="p-4 border-t flex items-center justify-end gap-2">
        {!isFull && (
          <SecondaryButton href="#upgrade">Upgrade WHY</SecondaryButton>
        )}
        <SecondaryButton onClick={onClose}>Close</SecondaryButton>
        {onViewCandidate ? (
          <PrimaryButton onClick={onViewCandidate}>View full candidate</PrimaryButton>
        ) : (
          <PrimaryButton href="#view-candidate">View full candidate</PrimaryButton>
        )}
      </div>
    </div>
  );
}

export default function WhyCandidateDrawer({
  open,
  onClose,
  explain,
  mode = "lite",
  onViewCandidate,
}) {
  if (!open) return null;

  return (
    <div aria-live="polite">
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.35)",
          zIndex: 60,
        }}
      />

      {/* Right Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100vh",
          width: "min(560px, 100%)",
          background: "#fff",
          borderLeft: "1px solid #e5e7eb",
          boxShadow: "-8px 0 24px rgba(0,0,0,0.12)",
          zIndex: 61,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <WhyPanel
          title="Why this candidate"
          explain={explain}
          mode={mode}
          onClose={onClose}
          onViewCandidate={onViewCandidate}
        />
      </aside>
    </div>
  );
}

/**
 * Compare drawer (NEW):
 * - open, onClose, mode
 * - left: { candidate, explain }
 * - right: { candidate, explain }
 * - overlay click closes AND should reset compare state on the page
 * - renders TWO panels side-by-side, anchored from the RIGHT
 */
export function WhyCandidateCompareDrawer({
  open,
  onClose,
  mode = "lite",
  left,
  right,
  onViewLeft,
  onViewRight,
}) {
  if (!open) return null;

  const leftName = left?.candidate?.name || "Candidate A";
  const rightName = right?.candidate?.name || "Candidate B";

  return (
    <div aria-live="polite">
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.35)",
          zIndex: 70,
        }}
      />

      {/* Two panels: responsive */}
      <aside
        role="dialog"
        aria-modal="true"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100vh",
          width: "min(1120px, 100%)",
          zIndex: 71,
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        }}
        className="max-lg:grid-cols-1"
      >
        {/* Left */}
        <div
          className="hidden lg:flex"
          style={{
            height: "100%",
            background: "#fff",
            borderLeft: "1px solid #e5e7eb",
            boxShadow: "-8px 0 24px rgba(0,0,0,0.12)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <WhyPanel
            title={leftName}
            explain={left?.explain}
            mode={mode}
            onClose={onClose}
            onViewCandidate={onViewLeft}
            showClose={false}
            compactHeader
          />
        </div>

        {/* Right (always visible) */}
        <div
          style={{
            height: "100%",
            background: "#fff",
            borderLeft: "1px solid #e5e7eb",
            boxShadow: "-8px 0 24px rgba(0,0,0,0.12)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <WhyPanel
            title={rightName}
            explain={right?.explain}
            mode={mode}
            onClose={onClose}
            onViewCandidate={onViewRight}
            compactHeader
          />
        </div>

        {/* Mobile: show a single combined title using right panel already */}
        <div className="lg:hidden hidden" />
      </aside>
    </div>
  );
}
