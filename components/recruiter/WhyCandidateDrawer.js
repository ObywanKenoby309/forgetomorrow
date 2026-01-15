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
  // ✅ Prefer clean schema if present (falls back to legacy)
  // ---------------------------------------------------------------------------
  const matchedSignals = useMemo(() => {
    const arr = explain?.signals?.matched || explain?.matched || [];
    return Array.isArray(arr) ? arr : [];
  }, [explain]);

  const gapsSignals = useMemo(() => {
    const arr = explain?.signals?.gaps || [];
    return Array.isArray(arr) ? arr : [];
  }, [explain]);

  // Best-effort parse summary counts if present, otherwise infer hit counts
  const tierCountsFromSummary = useMemo(() => {
    const text = String(summary || "");
    const m = text.match(
      /Matched\s+(\d+)\s*\/\s*(\d+)\s+core\s+signals\s+\(Tier\s+A\)\s+and\s+(\d+)\s*\/\s*(\d+)\s+supporting\s+signals\s+\(Tier\s+B\)/i
    );
    if (!m) return null;
    return {
      tierAHit: Number(m[1]),
      tierATotal: Number(m[2]),
      tierBHit: Number(m[3]),
      tierBTotal: Number(m[4]),
    };
  }, [summary]);

  const inferredCounts = useMemo(() => {
    const tierAHit = matchedSignals.filter((m) => (m?.tier || "") === "A").length;
    const tierBHit = matchedSignals.filter((m) => (m?.tier || "") === "B").length;
    return { tierAHit, tierBHit, tierATotal: null, tierBTotal: null };
  }, [matchedSignals]);

  const tableStats = tierCountsFromSummary || inferredCounts;

  // ✅ NEW: Evidence lookups (row click)
  const reasonsByKey = useMemo(() => {
    const map = new Map();
    for (const r of Array.isArray(reasons) ? reasons : []) {
      const label = String(r?.requirement || "").trim().toLowerCase();
      if (!label) continue;
      map.set(label, Array.isArray(r?.evidence) ? r.evidence : []);
    }
    return map;
  }, [reasons]);

  const signalEvidenceByKey = useMemo(() => {
    const map = new Map();
    for (const m of matchedSignals) {
      const label = String(m?.label || m?.requirement || m?.signal_id || "")
        .trim()
        .toLowerCase();
      if (!label) continue;
      const ev = Array.isArray(m?.evidence) ? m.evidence : [];
      map.set(label, ev);
    }
    return map;
  }, [matchedSignals]);

  function normalizeKey(s) {
    return String(s || "").trim().toLowerCase();
  }

  function getEvidenceForRowLabel(label) {
    const key = normalizeKey(label);
    // Prefer clean-schema evidence first
    const ev1 = signalEvidenceByKey.get(key);
    if (Array.isArray(ev1) && ev1.length) return ev1;
    // Fall back to legacy reasons evidence
    const ev2 = reasonsByKey.get(key);
    if (Array.isArray(ev2) && ev2.length) return ev2;
    return [];
  }

  // Build scan-table rows from matched + gaps (Tier A/B only)
  const scanRows = useMemo(() => {
    const rows = [];
    const seen = new Set();

    function keyFor(tier, label) {
      return `${String(tier || "").toUpperCase()}::${String(label || "")
        .trim()
        .toLowerCase()}`;
    }

    // Matched first
    for (const m of matchedSignals) {
      const tier = m?.tier || "B";
      if (tier !== "A" && tier !== "B") continue;
      const label = m?.label || m?.requirement || m?.signal_id || "Requirement";
      const k = keyFor(tier, label);
      if (seen.has(k)) continue;
      seen.add(k);
      rows.push({ label, tier, matched: true });
    }

    // Then gaps (unchecked)
    for (const g of gapsSignals) {
      const tier = g?.tier || "B";
      if (tier !== "A" && tier !== "B") continue;
      const label = g?.label || g?.signal_id || "Requirement";
      const k = keyFor(tier, label);
      if (seen.has(k)) continue;
      seen.add(k);
      rows.push({ label, tier, matched: false });
    }

    rows.sort((a, b) => {
      const ta = a.tier === "A" ? 0 : 1;
      const tb = b.tier === "A" ? 0 : 1;
      if (ta !== tb) return ta - tb;
      if (a.matched !== b.matched) return a.matched ? -1 : 1;
      return String(a.label).localeCompare(String(b.label));
    });

    return isFull ? rows : rows.slice(0, 10);
  }, [matchedSignals, gapsSignals, isFull]);

  // ✅ NEW: row drill-down state (evidence opens per row)
  const [openRowKey, setOpenRowKey] = useState(null);

  useEffect(() => {
    // Reset open row when candidate/explain changes
    setOpenRowKey(null);
  }, [explain, mode, title]);

  // Skills: chips (scan)
  const matchedSkills = useMemo(() => {
    const list = Array.isArray(skills?.matched) ? skills.matched : [];
    return isFull ? list.slice(0, 20) : list.slice(0, 10);
  }, [skills, isFull]);

  const gapSkills = useMemo(() => {
    const list = Array.isArray(skills?.gaps) ? skills.gaps : [];
    // In Lite, keep gaps minimal (or hide if empty)
    return isFull ? list.slice(0, 20) : list.slice(0, 8);
  }, [skills, isFull]);

  const transferableSkills = useMemo(() => {
    const list = Array.isArray(skills?.transferable) ? skills.transferable : [];
    return isFull ? list.slice(0, 20) : list.slice(0, 8);
  }, [skills, isFull]);

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

  // Default: summary + requirements open (scan-first)
  const defaultOpen = useMemo(
    () => ({
      [SECTION_KEYS.summary]: true,
      [SECTION_KEYS.requirements]: true,
      [SECTION_KEYS.skills]: true, // ✅ chips are scan-friendly; open by default
      [SECTION_KEYS.career]: false,
      [SECTION_KEYS.filters]: false,
    }),
    [SECTION_KEYS]
  );

  const [openMap, setOpenMap] = useState(defaultOpen);

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

  const Chip = ({ children, tone = "neutral" }) => {
    const toneClass =
      tone === "good"
        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
        : tone === "bad"
        ? "border-rose-200 bg-rose-50 text-rose-800"
        : tone === "warn"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : "border-slate-200 bg-slate-50 text-slate-700";

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full border text-xs font-medium ${toneClass}`}
      >
        {children}
      </span>
    );
  };

  function rowKey(row) {
    return `${String(row?.tier || "")}::${String(row?.label || "").trim().toLowerCase()}`;
  }

  const maxEvidenceLite = 1;
  const maxEvidenceFull = 3;

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

        {/* Requirements (Scan-first + click row for evidence) */}
        <CollapsibleSection
          title="Key requirements (scan)"
          isOpen={Boolean(openMap[SECTION_KEYS.requirements])}
          onToggle={() => toggle(SECTION_KEYS.requirements)}
          right={
            <div className="text-xs text-slate-600 flex items-center gap-3">
              <span>
                Tier A{" "}
                <span className="font-semibold">
                  {typeof tableStats.tierAHit === "number" ? tableStats.tierAHit : 0}
                  {typeof tableStats.tierATotal === "number" ? `/${tableStats.tierATotal}` : ""}
                </span>
              </span>
              <span className="text-slate-300">•</span>
              <span>
                Tier B{" "}
                <span className="font-semibold">
                  {typeof tableStats.tierBHit === "number" ? tableStats.tierBHit : 0}
                  {typeof tableStats.tierBTotal === "number" ? `/${tableStats.tierBTotal}` : ""}
                </span>
              </span>
            </div>
          }
        >
          <div className="rounded border overflow-hidden bg-white">
            <div className="px-3 py-2 border-b bg-slate-50 flex items-center justify-between gap-3">
              <div className="text-xs font-semibold text-slate-700">Requirement</div>
              <div className="flex items-center gap-6">
                <div className="text-xs font-semibold text-slate-700 w-[78px] text-center">
                  Tier A
                </div>
                <div className="text-xs font-semibold text-slate-700 w-[78px] text-center">
                  Tier B
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
                  const rk = rowKey(row);
                  const isOpen = openRowKey === rk;

                  const ev = row.matched ? getEvidenceForRowLabel(row.label) : [];
                  const cap = isFull ? maxEvidenceFull : maxEvidenceLite;
                  const evToShow = (Array.isArray(ev) ? ev : []).slice(0, cap);

                  return (
                    <div key={`${row.tier}-${row.label}-${idx}`} className="px-3 py-0">
                      {/* Row */}
                      <button
                        type="button"
                        onClick={() => {
                          // Only open evidence if matched and we actually have evidence
                          if (!row.matched) return;
                          if (!ev || !ev.length) return;
                          setOpenRowKey((prev) => (prev === rk ? null : rk));
                        }}
                        className={`w-full py-2 flex items-center justify-between gap-3 text-left ${
                          row.matched && ev && ev.length
                            ? "hover:bg-slate-50"
                            : ""
                        }`}
                        title={
                          row.matched && ev && ev.length
                            ? "Click to view evidence"
                            : row.matched
                            ? "No evidence available"
                            : "Not matched"
                        }
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-slate-900 truncate">
                            {row.label}
                          </div>
                          {row.matched && ev && ev.length ? (
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Click to {isOpen ? "hide" : "view"} evidence
                            </div>
                          ) : null}
                        </div>

                        <div className="flex items-center gap-6 shrink-0">
                          <div className="w-[78px] flex items-center justify-center">
                            <Check on={isA && row.matched} />
                          </div>
                          <div className="w-[78px] flex items-center justify-center">
                            <Check on={isB && row.matched} />
                          </div>
                        </div>
                      </button>

                      {/* Evidence (inline drill-down) */}
                      {isOpen ? (
                        <div className="pb-3">
                          <div className="rounded-md border bg-white p-3">
                            <div className="text-xs font-semibold text-slate-700 mb-2">
                              Evidence
                            </div>

                            {evToShow.length ? (
                              <ul className="grid gap-2">
                                {evToShow.map((e, i) => (
                                  <li key={i} className="text-sm text-slate-700">
                                    — <span className="italic">{e?.text}</span>
                                    {e?.source ? (
                                      <span className="text-slate-400"> ({e.source})</span>
                                    ) : null}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <div className="text-sm text-slate-500">
                                No evidence available.
                              </div>
                            )}

                            {!isFull && ev.length > maxEvidenceLite ? (
                              <div className="text-xs text-slate-500 mt-2">
                                WHY Lite shows a preview. Upgrade for full evidence.
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>

            {!isFull ? (
              <div className="px-3 py-2 border-t bg-slate-50 text-xs text-slate-500">
                WHY Lite shows the top items for fast scan. Upgrade for full evidence.
              </div>
            ) : null}
          </div>
        </CollapsibleSection>

        {/* Skills (chips) */}
        <CollapsibleSection
          title="Skills alignment (scan)"
          isOpen={Boolean(openMap[SECTION_KEYS.skills])}
          onToggle={() => toggle(SECTION_KEYS.skills)}
        >
          <div className="grid gap-4">
            {/* Matched */}
            <div>
              <div className="text-xs font-semibold text-slate-700 mb-2">Matched</div>
              <div className="flex flex-wrap gap-2">
                {matchedSkills.length ? (
                  matchedSkills.map((s) => <Chip key={s} tone="good">{s}</Chip>)
                ) : (
                  <span className="text-sm text-slate-500">No matched skills detected.</span>
                )}
              </div>
            </div>

            {/* Gaps + Transferable (Full; Lite shows small preview only) */}
            {isFull ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="text-xs font-semibold text-slate-700 mb-2">Gaps</div>
                  <div className="flex flex-wrap gap-2">
                    {gapSkills.length ? (
                      gapSkills.map((s) => <Chip key={s} tone="bad">{s}</Chip>)
                    ) : (
                      <span className="text-sm text-slate-500">No gaps detected.</span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-700 mb-2">Transferable</div>
                  <div className="flex flex-wrap gap-2">
                    {transferableSkills.length ? (
                      transferableSkills.map((s) => <Chip key={s} tone="warn">{s}</Chip>)
                    ) : (
                      <span className="text-sm text-slate-500">None listed.</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              gapSkills.length ? (
                <div>
                  <div className="text-xs font-semibold text-slate-700 mb-2">Potential gaps (preview)</div>
                  <div className="flex flex-wrap gap-2">
                    {gapSkills.map((s) => <Chip key={s} tone="bad">{s}</Chip>)}
                  </div>
                  <div className="text-xs text-slate-500 mt-2">
                    Upgrade to see full gaps and transferable skills.
                  </div>
                </div>
              ) : null
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
                  <li key={`${t.title}-${t.company}-${i}`} className="grid gap-0.5">
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
        {!isFull && <SecondaryButton href="#upgrade">Upgrade WHY</SecondaryButton>}
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
