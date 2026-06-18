// components/project-promotion/ProjectPromotionEngine.js

import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";

const ORANGE = "#FF7043";
const SLATE = "#334155";
const DARK = "#1E293B";

const GLASS = {
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.42)",
  background: "rgba(255,255,255,0.88)",
  boxShadow: "0 8px 20px rgba(15,23,42,0.10)",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
};

const WHITE_CARD = {
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,0.08)",
  background: "rgba(255,255,255,0.92)",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
};

const INPUT = {
  width: "100%",
  padding: "9px 11px",
  border: "1px solid rgba(0,0,0,0.12)",
  borderRadius: 9,
  fontSize: 12,
  color: DARK,
  background: "rgba(255,255,255,0.92)",
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const LABEL = {
  display: "block",
  fontWeight: 800,
  fontSize: 11,
  color: "#475569",
  marginBottom: 4,
};

const SECTION_HDR = {
  padding: "9px 14px",
  background: "linear-gradient(180deg, rgba(38,50,56,0.92), rgba(38,50,56,0.70))",
  color: "white",
  fontWeight: 900,
  fontSize: 12,
  letterSpacing: 0.4,
  borderRadius: "12px 12px 0 0",
};

const INITIAL_FORM = {
  currentRole: "",
  currentCompany: "",
  currentProjects: "",
  completedProjects: "",
  problemsObserved: "",
  promotionGoal: "",
};

const RESULT_TABS = [
  { id: "decision", label: "Decision" },
  { id: "moves", label: "Moves" },
  { id: "execution", label: "Execution" },
  { id: "review", label: "Review" },
  { id: "coach", label: "Spotlights" },
];

function Field({ label, children }) {
  return (
    <div>
      {label && <label style={LABEL}>{label}</label>}
      {children}
    </div>
  );
}

function BulletList({ items }) {
  const arr = Array.isArray(items) ? items.filter(Boolean) : [];

  if (!arr.length) {
    return (
      <div style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.45 }}>
        No items returned.
      </div>
    );
  }

  return (
    <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 5 }}>
      {arr.map((item, i) => (
        <li
          key={i}
          style={{
            display: "flex",
            gap: 7,
            alignItems: "flex-start",
            fontSize: 11,
            color: SLATE,
            lineHeight: 1.45,
          }}
        >
          <span style={{ color: ORANGE, fontWeight: 900, flexShrink: 0 }}>•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function StatusPill({ children, tone = "neutral" }) {
  const colors = {
    green: {
      bg: "rgba(22,163,74,0.10)",
      border: "rgba(22,163,74,0.25)",
      color: "#15803D",
    },
    orange: {
      bg: "rgba(255,112,67,0.10)",
      border: "rgba(255,112,67,0.25)",
      color: ORANGE,
    },
    neutral: {
      bg: "rgba(255,255,255,0.75)",
      border: "rgba(0,0,0,0.08)",
      color: SLATE,
    },
  };

  const c = colors[tone] || colors.neutral;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "5px 9px",
        borderRadius: 999,
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: c.color,
        fontSize: 10,
        fontWeight: 900,
      }}
    >
      {children}
    </span>
  );
}

function TabBar({ activeTab, setActiveTab }) {
  return (
    <div style={{ display: "flex", gap: 2, marginBottom: 12, background: "rgba(0,0,0,0.06)", borderRadius: 10, padding: 3 }}>
      {RESULT_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => setActiveTab(tab.id)}
          style={{
            flex: 1,
            padding: "7px 8px",
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 900,
            cursor: "pointer",
            border: "none",
            background: activeTab === tab.id ? "white" : "transparent",
            color: activeTab === tab.id ? ORANGE : "#64748B",
            boxShadow: activeTab === tab.id ? "0 2px 6px rgba(0,0,0,0.10)" : "none",
            transition: "all 0.15s",
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function SignalBar({ label, level = 2 }) {
  const safeLevel = Math.max(1, Math.min(4, Number(level) || 2));
  return (
    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 6, alignItems: "center" }}>
      <div style={{ fontSize: 9, fontWeight: 900, color: "#64748B", letterSpacing: 0.25, whiteSpace: "nowrap" }}>{label}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 3 }}>
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            style={{
              height: 7,
              borderRadius: 999,
              background: n <= safeLevel ? ORANGE : "rgba(0,0,0,0.09)",
              opacity: n <= safeLevel ? 0.95 : 1,
            }}
          />
        ))}
      </div>
      <div style={{ fontSize: 9, fontWeight: 900, color: safeLevel >= 3 ? ORANGE : "#94A3B8", minWidth: 16, textAlign: "right" }}>
        {safeLevel}/4
      </div>
    </div>
  );
}

function getSignalLevels(move = {}) {
  const text = [
    move.title,
    move.whatToDo,
    move.whyThisWins,
    move.promotionSignal,
    move.proofArtifact,
    ...(Array.isArray(move.successMetrics) ? move.successMetrics : []),
  ].join(" ").toLowerCase();

  const visibility = /executive|leadership|stakeholder|cross-functional|cross functional|manager|director|decision|visibility/.test(text) ? 4 : 2;
  const scope = /cross-functional|cross functional|multiple teams|department|enterprise|organization|systemic|workflow/.test(text) ? 4 : 2;
  const measurable = /metric|kpi|sla|reduce|increase|improve|dashboard|before-and-after|before and after|tracked/.test(text) ? 4 : 2;
  const leadership = /own|lead|train|framework|initiative|program|accountability|governance/.test(text) ? 4 : 2;

  return { visibility, scope, measurable, leadership };
}

function buildBriefText(plan, moves, recommendedMove) {
  if (!plan) return "";

  const lines = [];
  lines.push("ForgeTomorrow Project & Promotion Intelligence Brief");
  lines.push("");
  lines.push("PERFORMANCE READ");
  lines.push(plan.performanceRead || "N/A");
  lines.push("");
  lines.push("WHAT IS HOLDING YOU BACK");
  lines.push(plan.leverageGap || "N/A");
  if (plan.underLeveragingSignal) {
    lines.push("");
    lines.push("UNDER-LEVERAGING SIGNAL");
    lines.push(plan.underLeveragingSignal);
  }

  lines.push("");
  lines.push("RECOMMENDED MOVE");
  lines.push(plan.recommendedMove?.decision || "N/A");
  if (recommendedMove?.title) lines.push(`Primary path: #${recommendedMove.rank} ${recommendedMove.title}`);
  if (plan.recommendedMove?.firstStepThisWeek) lines.push(`First step this week: ${plan.recommendedMove.firstStepThisWeek}`);
  if (plan.recommendedMove?.whoToAlignWith) lines.push(`Who to align with: ${plan.recommendedMove.whoToAlignWith}`);
  if (plan.recommendedMove?.howToPitchIt) lines.push(`How to pitch it: ${plan.recommendedMove.howToPitchIt}`);

  lines.push("");
  lines.push("TOP 3 WAYS TO WIN NEXT");
  moves.forEach((move) => {
    lines.push("");
    lines.push(`#${move?.rank || ""} ${move?.title || "Untitled move"}`);
    if (move?.whatToDo) lines.push(`What to do: ${move.whatToDo}`);
    if (move?.whyThisWins) lines.push(`Why this wins: ${move.whyThisWins}`);
    if (move?.evidenceBasis) lines.push(`Evidence: ${move.evidenceBasis}`);
    if (Array.isArray(move?.successMetrics) && move.successMetrics.length) {
      lines.push("Success metrics:");
      move.successMetrics.forEach((item) => lines.push(`- ${item}`));
    }
    if (move?.proofArtifact) lines.push(`Proof artifact: ${move.proofArtifact}`);
    if (move?.promotionSignal) lines.push(`Promotion signal: ${move.promotionSignal}`);
    if (move?.riskIfIgnored) lines.push(`Risk if ignored: ${move.riskIfIgnored}`);
  });

  if (plan.reviewNarrative) {
    lines.push("");
    lines.push("REVIEW NARRATIVE");
    if (plan.reviewNarrative.managerSummary) lines.push(`Manager summary: ${plan.reviewNarrative.managerSummary}`);
    if (plan.reviewNarrative.promotionCaseAngle) lines.push(`Promotion case: ${plan.reviewNarrative.promotionCaseAngle}`);
    if (plan.reviewNarrative.resumeFutureBullet) lines.push(`Future resume bullet: ${plan.reviewNarrative.resumeFutureBullet}`);
  }

  lines.push("");
  lines.push("SHARPEN THIS BEFORE YOU TAKE IT TO LEADERSHIP");
  lines.push(plan.coachBridge?.whyCoachHelps || "Get another set of eyes before taking this to leadership.");
  if (plan.coachBridge?.whatToBring) lines.push(`Bring: ${plan.coachBridge.whatToBring}`);

  return lines.join("\n");
}

function downloadFile(filename, content, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function downloadBriefPdf(plan, moves, recommendedMove) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const margin = 44;
  const maxW = 524;
  let y = margin;

  const write = (text, size = 10, bold = false, color = [30, 41, 59]) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(...color);
    const chunks = doc.splitTextToSize(String(text || ""), maxW);
    chunks.forEach((line) => {
      if (y > 750) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += size * 1.45;
    });
  };

  const gap = (n = 8) => { y += n; };

  write("ForgeTomorrow Project & Promotion Brief", 18, true, [255, 112, 67]);
  write(new Date().toLocaleDateString(), 9, false, [100, 116, 139]);
  gap(14);

  write("PERFORMANCE READ", 10, true, [255, 112, 67]);
  write(plan?.performanceRead || "N/A", 10);
  gap(8);

  write("WHAT IS HOLDING YOU BACK", 10, true, [255, 112, 67]);
  write(plan?.leverageGap || "N/A", 10);
  if (plan?.underLeveragingSignal) write(plan.underLeveragingSignal, 10, true, [120, 53, 15]);
  gap(8);

  write("RECOMMENDED MOVE", 10, true, [255, 112, 67]);
  write(plan?.recommendedMove?.decision || "N/A", 12, true);
  if (recommendedMove?.title) write(`Primary path: #${recommendedMove.rank} ${recommendedMove.title}`, 10);
  if (plan?.recommendedMove?.firstStepThisWeek) write(`First step this week: ${plan.recommendedMove.firstStepThisWeek}`, 10);
  if (plan?.recommendedMove?.whoToAlignWith) write(`Who to align with: ${plan.recommendedMove.whoToAlignWith}`, 10);
  if (plan?.recommendedMove?.howToPitchIt) write(`How to pitch it: ${plan.recommendedMove.howToPitchIt}`, 10);
  gap(10);

  write("TOP 3 WAYS TO WIN NEXT", 10, true, [255, 112, 67]);
  moves.forEach((move) => {
    gap(4);
    write(`#${move?.rank || ""} ${move?.title || "Untitled move"}`, 11, true);
    if (move?.whatToDo) write(`What to do: ${move.whatToDo}`, 10);
    if (move?.whyThisWins) write(`Why this wins: ${move.whyThisWins}`, 10);
    if (move?.proofArtifact) write(`Proof artifact: ${move.proofArtifact}`, 10);
  });
  gap(8);

  if (plan?.reviewNarrative) {
    write("REVIEW NARRATIVE", 10, true, [255, 112, 67]);
    if (plan.reviewNarrative.managerSummary) write(`Manager summary: ${plan.reviewNarrative.managerSummary}`, 10);
    if (plan.reviewNarrative.promotionCaseAngle) write(`Promotion case: ${plan.reviewNarrative.promotionCaseAngle}`, 10);
    if (plan.reviewNarrative.resumeFutureBullet) write(`Future resume bullet: ${plan.reviewNarrative.resumeFutureBullet}`, 10, true, [22, 101, 52]);
  }

  gap(12);
  write("ForgeTomorrow — Strategic guidance only. Validate internally before execution.", 8, false, [148, 163, 184]);
  doc.save("ForgeTomorrow-Project-Promotion-Brief.pdf");
}

function MoveCard({ move, recommended }) {
  const rank = move?.rank || "";
  return (
    <div
      style={{
        ...WHITE_CARD,
        overflow: "hidden",
        border: recommended ? `2px solid ${ORANGE}` : WHITE_CARD.border,
        boxShadow: recommended
          ? "0 8px 22px rgba(255,112,67,0.22)"
          : WHITE_CARD.boxShadow,
      }}
    >
      <div
        style={{
          padding: "10px 12px",
          background: recommended
            ? "linear-gradient(135deg, rgba(255,112,67,0.95), rgba(234,88,12,0.90))"
            : "rgba(30,41,59,0.88)",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div>
          <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: 0.5, opacity: 0.8 }}>
            RANK #{rank}
          </div>
          <div style={{ fontSize: 14, fontWeight: 900, lineHeight: 1.25 }}>
            {move?.title || "Untitled move"}
          </div>
        </div>
        {recommended && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 900,
              padding: "3px 7px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.22)",
              whiteSpace: "nowrap",
            }}
          >
            RECOMMENDED
          </span>
        )}
      </div>

      <div style={{ padding: 12, display: "grid", gap: 10 }}>
        {move?.whatToDo && (
          <div>
            <div style={{ fontSize: 9, fontWeight: 900, color: ORANGE, marginBottom: 3 }}>
              WHAT TO DO
            </div>
            <div style={{ fontSize: 12, color: SLATE, lineHeight: 1.5, fontWeight: 600 }}>
              {move.whatToDo}
            </div>
          </div>
        )}

        {move?.whyThisWins && (
          <div>
            <div style={{ fontSize: 9, fontWeight: 900, color: ORANGE, marginBottom: 3 }}>
              WHY THIS WINS
            </div>
            <div style={{ fontSize: 12, color: SLATE, lineHeight: 1.5 }}>
              {move.whyThisWins}
            </div>
          </div>
        )}

        {move?.evidenceBasis && (
          <div
            style={{
              padding: 9,
              borderRadius: 10,
              background: "rgba(255,112,67,0.07)",
              border: "1px solid rgba(255,112,67,0.18)",
              fontSize: 11,
              color: "#9A3412",
              lineHeight: 1.45,
              fontWeight: 700,
            }}
          >
            <strong>Evidence:</strong> {move.evidenceBasis}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 900, color: "#64748B", marginBottom: 5 }}>
              SUCCESS METRICS
            </div>
            <BulletList items={move?.successMetrics} />
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 900, color: "#64748B", marginBottom: 5 }}>
              EXAMPLE PROJECTS
            </div>
            <BulletList items={move?.exampleProjects} />
          </div>
        </div>

        {(move?.proofArtifact || move?.promotionSignal || move?.riskIfIgnored) && (
          <div style={{ display: "grid", gap: 6 }}>
            {move?.proofArtifact && (
              <div style={{ fontSize: 11, color: SLATE, lineHeight: 1.45 }}>
                <strong>Proof artifact:</strong> {move.proofArtifact}
              </div>
            )}
            {move?.promotionSignal && (
              <div style={{ fontSize: 11, color: SLATE, lineHeight: 1.45 }}>
                <strong>Promotion signal:</strong> {move.promotionSignal}
              </div>
            )}
            {move?.riskIfIgnored && (
              <div style={{ fontSize: 11, color: "#92400E", lineHeight: 1.45 }}>
                <strong>Risk if ignored:</strong> {move.riskIfIgnored}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MoveSignalMap({ moves, recommendedRank, activeMoveRank, onSelect }) {
  if (!moves.length) return null;

  return (
    <div style={{ ...WHITE_CARD, overflow: "hidden" }}>
      <div style={SECTION_HDR}>PROMOTION SIGNAL MAP — select a move to explore</div>
      <div style={{ padding: 12, display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 8 }}>
        {moves.map((move) => {
          const levels = getSignalLevels(move);
          const recommended = Number(move?.rank) === recommendedRank;
          const isActive = Number(move?.rank) === Number(activeMoveRank);
          return (
            <button
              key={`${move?.rank || ""}-${move?.title || ""}-signal`}
              type="button"
              onClick={() => onSelect && onSelect(Number(move?.rank))}
              style={{
                padding: 10,
                borderRadius: 10,
                background: isActive ? "rgba(255,112,67,0.10)" : recommended ? "rgba(255,112,67,0.04)" : "rgba(248,250,252,0.92)",
                border: isActive ? `2px solid ${ORANGE}` : recommended ? "1px solid rgba(255,112,67,0.22)" : "1px solid rgba(0,0,0,0.06)",
                display: "grid",
                gap: 7,
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                <div style={{ fontSize: 10, fontWeight: 900, color: isActive ? ORANGE : DARK, lineHeight: 1.3 }}>
                  #{move?.rank} {move?.title || "Move"}
                </div>
                {recommended && <StatusPill tone="orange">Recommended</StatusPill>}
              </div>
              <SignalBar label="Visibility" level={levels.visibility} />
              <SignalBar label="Scope" level={levels.scope} />
              <SignalBar label="Measurable" level={levels.measurable} />
              <SignalBar label="Leadership" level={levels.leadership} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <>
      <div
        style={{
          borderRadius: 14,
          padding: 18,
          background: "rgba(30,41,59,0.88)",
          color: "white",
          boxShadow: "0 10px 24px rgba(0,0,0,0.18)",
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 900, color: ORANGE, marginBottom: 6 }}>
          🧠 STRATEGIC OPERATOR ADVISOR
        </div>
        <div style={{ fontSize: 20, fontWeight: 900, lineHeight: 1.2, marginBottom: 6 }}>
          This is for winning where you are now.
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.78)", lineHeight: 1.55 }}>
          The system reads your evidence, then identifies the projects and ownership plays most likely to increase visibility, promotion strength, and long-term value.
        </div>
      </div>

      <div style={{ ...WHITE_CARD, padding: 14 }}>
        <div style={{ fontWeight: 900, fontSize: 11, color: DARK, marginBottom: 8 }}>
          YOUR OUTPUT WILL INCLUDE
        </div>
        <BulletList
          items={[
            "A direct performance read based on your actual proof",
            "The leverage gap holding back promotion-level visibility",
            "Three ranked project moves with success metrics",
            "A tabbed decision cockpit instead of one long report",
            "A manager-ready review narrative and future resume bullet",
            "A Coach Spotlights path for another set of eyes",
          ]}
        />
      </div>
    </>
  );
}

function LoadingState() {
  return (
    <div style={{ ...GLASS, padding: "36px 18px", textAlign: "center" }}>
      <div style={{ fontSize: 28, marginBottom: 10 }}>🔥</div>
      <div style={{ fontWeight: 900, fontSize: 15, color: ORANGE, marginBottom: 5 }}>
        Finding your next win...
      </div>
      <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.6, marginBottom: 18 }}>
        Reading your resume, profile, portfolio, and current work context.
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: ORANGE,
              animation: `pulseDot 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function ResultCockpit({ result, plan, moves, recommendedRank, mobileTab, onMobileTabChange, form }) {
  const [_activeTab, _setActiveTab] = useState("decision");
  const activeTab = mobileTab || _activeTab;
  const setActiveTab = onMobileTabChange || _setActiveTab;
  const [activeMoveRank, setActiveMoveRank] = useState(recommendedRank || 1);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const recommendedMove = moves.find((move) => Number(move?.rank) === recommendedRank) || moves[0] || null;
  const selectedMove =
    moves.find((move) => Number(move?.rank) === Number(activeMoveRank)) ||
    recommendedMove ||
    moves[0] ||
    null;

  const handleCopySummary = async () => {
    const brief = buildBriefText(plan, moves, recommendedMove);
    try {
      await navigator.clipboard.writeText(brief);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      console.error("[ProjectPromotionEngine] copy failed", err);
    }
  };

  const handleExportText = () => {
    downloadFile("ForgeTomorrow-Project-Promotion-Brief.txt", buildBriefText(plan, moves, recommendedMove));
  };

  const handleSaveSnapshot = () => {
    downloadFile(
      "ForgeTomorrow-Project-Promotion-Snapshot.json",
      JSON.stringify({ savedAt: new Date().toISOString(), result }, null, 2),
      "application/json"
    );
  };

  const handleExportPdf = () => {
    downloadBriefPdf(plan, moves, recommendedMove);
  };

  const handleSaveToVault = async () => {
    if (saving || savedId) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch('/api/anvil/project-promotion/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ formInput: form, result }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setSavedId(data.result?.id);
    } catch (err) {
      setSaveError(err.message || 'Could not save to Vault');
    } finally {
      setSaving(false);
    }
  };

  const DecisionTab = () => (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {result?.resumeConnected && <StatusPill tone="green">Resume connected</StatusPill>}
        {result?.profileConnected && <StatusPill tone="green">Profile connected</StatusPill>}
        {result?.evidenceConnected && <StatusPill tone="orange">Evidence engine active</StatusPill>}
      </div>

      <div style={{ borderRadius: 14, overflow: "hidden", boxShadow: "0 8px 24px rgba(255,112,67,0.20)" }}>
        <div
          style={{
            padding: "18px 20px",
            background: "linear-gradient(135deg, rgba(255,112,67,0.95), rgba(234,88,12,0.90))",
            color: "white",
          }}
        >
          <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: 0.6, opacity: 0.85, marginBottom: 5 }}>
            PERFORMANCE READ
          </div>
          <div style={{ fontSize: 14, fontWeight: 850, lineHeight: 1.55 }}>
            {plan.performanceRead || "No performance read returned."}
          </div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.96)", padding: 14, display: "grid", gap: 9 }}>
          {plan.leverageGap && (
            <div style={{ fontSize: 12, color: SLATE, lineHeight: 1.5 }}>
              <strong>What is holding you back:</strong> {plan.leverageGap}
            </div>
          )}
          {plan.underLeveragingSignal && (
            <div
              style={{
                padding: 10,
                borderRadius: 10,
                background: "rgba(254,243,199,0.88)",
                border: "1px solid rgba(245,158,11,0.25)",
                color: "#78350F",
                fontSize: 11,
                lineHeight: 1.45,
                fontWeight: 750,
              }}
            >
              {plan.underLeveragingSignal}
            </div>
          )}
        </div>
      </div>

      {plan.recommendedMove && (
        <div style={{ ...WHITE_CARD, overflow: "hidden" }}>
          <div style={SECTION_HDR}>🚀 RECOMMENDED MOVE</div>
          <div style={{ padding: 13, display: "grid", gap: 8 }}>
            {plan.recommendedMove.decision && (
              <div style={{ fontSize: 13, fontWeight: 900, color: DARK, lineHeight: 1.45 }}>
                {plan.recommendedMove.decision}
              </div>
            )}
            {recommendedMove?.title && (
              <div style={{ fontSize: 12, color: SLATE, lineHeight: 1.5 }}>
                <strong>Primary path:</strong> #{recommendedMove.rank} {recommendedMove.title}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const MovesTab = () => (
    <div style={{ display: "grid", gap: 10 }}>
      {/* Signal map IS the selector — click a card to select a move */}
      <MoveSignalMap
        moves={moves}
        recommendedRank={recommendedRank}
        activeMoveRank={activeMoveRank}
        onSelect={setActiveMoveRank}
      />

      {/* Selected move detail — recommended pre-selected, updates on map click */}
      {selectedMove && (
        <MoveCard
          key={`${selectedMove?.rank || ""}-${selectedMove?.title || ""}`}
          move={selectedMove}
          recommended={Number(selectedMove?.rank) === recommendedRank}
        />
      )}
    </div>
  );

  const ExecutionTab = () => (
    <div style={{ display: "grid", gap: 10 }}>
      {plan.recommendedMove && (
        <div style={{ ...WHITE_CARD, overflow: "hidden" }}>
          <div style={SECTION_HDR}>EXECUTION PLAN</div>
          <div style={{ padding: 13, display: "grid", gap: 9 }}>
            {plan.recommendedMove.firstStepThisWeek && (
              <div style={{ fontSize: 12, color: SLATE, lineHeight: 1.5 }}>
                <strong>First step this week:</strong> {plan.recommendedMove.firstStepThisWeek}
              </div>
            )}
            {plan.recommendedMove.whoToAlignWith && (
              <div style={{ fontSize: 12, color: SLATE, lineHeight: 1.5 }}>
                <strong>Who to align with:</strong> {plan.recommendedMove.whoToAlignWith}
              </div>
            )}
            {plan.recommendedMove.howToPitchIt && (
              <div style={{ fontSize: 12, color: SLATE, lineHeight: 1.5 }}>
                <strong>How to pitch it:</strong> {plan.recommendedMove.howToPitchIt}
              </div>
            )}
          </div>
        </div>
      )}

      {recommendedMove && (
        <div style={{ ...WHITE_CARD, overflow: "hidden" }}>
          <div style={SECTION_HDR}>PROOF TARGETS</div>
          <div style={{ padding: 13, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 900, color: "#64748B", marginBottom: 6 }}>
                SUCCESS METRICS
              </div>
              <BulletList items={recommendedMove.successMetrics} />
            </div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 900, color: "#64748B", marginBottom: 6 }}>
                EXAMPLE PROJECTS
              </div>
              <BulletList items={recommendedMove.exampleProjects} />
            </div>
          </div>
          <div style={{ padding: "0 13px 13px", display: "grid", gap: 7 }}>
            {recommendedMove.proofArtifact && (
              <div style={{ fontSize: 11, color: SLATE, lineHeight: 1.45 }}>
                <strong>Proof artifact:</strong> {recommendedMove.proofArtifact}
              </div>
            )}
            {recommendedMove.promotionSignal && (
              <div style={{ fontSize: 11, color: SLATE, lineHeight: 1.45 }}>
                <strong>Promotion signal:</strong> {recommendedMove.promotionSignal}
              </div>
            )}
            {recommendedMove.riskIfIgnored && (
              <div style={{ fontSize: 11, color: "#92400E", lineHeight: 1.45 }}>
                <strong>Risk if ignored:</strong> {recommendedMove.riskIfIgnored}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const ReviewTab = () => (
    <div style={{ display: "grid", gap: 10 }}>
      {plan.reviewNarrative && (
        <div style={{ ...WHITE_CARD, overflow: "hidden" }}>
          <div style={SECTION_HDR}>📌 REVIEW NARRATIVE</div>
          <div style={{ padding: 13, display: "grid", gap: 9 }}>
            {plan.reviewNarrative.managerSummary && (
              <div style={{ fontSize: 12, color: SLATE, lineHeight: 1.5 }}>
                <strong>Manager summary:</strong> {plan.reviewNarrative.managerSummary}
              </div>
            )}
            {plan.reviewNarrative.promotionCaseAngle && (
              <div style={{ fontSize: 12, color: SLATE, lineHeight: 1.5 }}>
                <strong>Promotion case:</strong> {plan.reviewNarrative.promotionCaseAngle}
              </div>
            )}
            {plan.reviewNarrative.resumeFutureBullet && (
              <div
                style={{
                  padding: 10,
                  borderRadius: 10,
                  background: "rgba(22,163,74,0.08)",
                  border: "1px solid rgba(22,163,74,0.20)",
                  color: "#166534",
                  fontSize: 11,
                  lineHeight: 1.45,
                  fontWeight: 750,
                }}
              >
                <strong>Future resume bullet:</strong> {plan.reviewNarrative.resumeFutureBullet}
              </div>
            )}
          </div>
        </div>
      )}

      {Array.isArray(plan.reasoning) && plan.reasoning.length > 0 && (
        <div style={{ ...WHITE_CARD, overflow: "hidden" }}>
          <div style={SECTION_HDR}>WHY THE SYSTEM CHOSE THIS</div>
          <div style={{ padding: 13 }}>
            <BulletList items={plan.reasoning} />
          </div>
        </div>
      )}
    </div>
  );

  const CoachTab = () => (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ ...GLASS, padding: 13, borderLeft: `3px solid ${ORANGE}` }}>
        <div style={{ fontWeight: 900, fontSize: 12, color: ORANGE, marginBottom: 5 }}>
          🔥 Sharpen this before you take it to leadership
        </div>
        <div style={{ fontSize: 11, color: SLATE, lineHeight: 1.55, marginBottom: 8 }}>
          {"You have a strong direction. Before you pitch it, use Coach Spotlights to find professionals who may be able to pressure-test the approach, stakeholder alignment, and business value."}
        </div>
        {plan.coachBridge?.whatToBring && (
          <div style={{ fontSize: 11, color: SLATE, lineHeight: 1.55, marginBottom: 9 }}>
            <strong>Bring:</strong> Your selected move, current operational data, and a rough pitch or plan.
          </div>
        )}
        <a
          href="/the-hearth?module=spotlights"
          style={{
            display: "inline-block",
            padding: "7px 14px",
            background: ORANGE,
            color: "white",
            borderRadius: 8,
            fontWeight: 900,
            fontSize: 11,
            textDecoration: "none",
          }}
        >
          🔥 View Coach Spotlights
        </a>
      </div>

      <div style={{ ...WHITE_CARD, padding: 13 }}>
        <div style={{ fontWeight: 900, fontSize: 11, color: DARK, marginBottom: 8 }}>
          SHARPEN THIS BEFORE YOU TAKE IT TO LEADERSHIP
        </div>
        <BulletList
          items={[
            "Pressure-test the recommended project against real workplace politics",
            "Build the pitch so leadership sees measurable business value",
            "Define the proof artifact before the work starts",
            "Turn the outcome into review, promotion, and resume evidence",
          ]}
        />
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 6, marginBottom: 10 }}>
        <button type="button" onClick={handleSaveToVault} disabled={saving || !!savedId}
          style={{ padding: "7px 8px", borderRadius: 999, fontSize: 10, fontWeight: 900,
            cursor: saving || savedId ? "default" : "pointer",
            background: savedId ? "#16A34A" : saving ? "rgba(255,112,67,0.15)" : ORANGE,
            color: "white", border: "none", whiteSpace: "nowrap" }}>
          {savedId ? "✓ Saved" : saving ? "Saving…" : "🗄️ Vault"}
        </button>
        <button type="button" onClick={handleExportPdf}
          style={{ padding: "7px 8px", borderRadius: 999, fontSize: 10, fontWeight: 900, cursor: "pointer", background: "rgba(255,255,255,0.86)", color: SLATE, border: "1px solid rgba(0,0,0,0.12)", whiteSpace: "nowrap" }}>
          📄 PDF
        </button>
        <button type="button" onClick={handleExportText}
          style={{ padding: "7px 8px", borderRadius: 999, fontSize: 10, fontWeight: 900, cursor: "pointer", background: "rgba(255,255,255,0.86)", color: SLATE, border: "1px solid rgba(0,0,0,0.12)", whiteSpace: "nowrap" }}>
          📝 Text
        </button>
        <button type="button" onClick={handleSaveSnapshot}
          style={{ padding: "7px 8px", borderRadius: 999, fontSize: 10, fontWeight: 900, cursor: "pointer", background: "rgba(255,255,255,0.86)", color: SLATE, border: "1px solid rgba(0,0,0,0.12)", whiteSpace: "nowrap" }}>
          💾 JSON
        </button>
        <button type="button" onClick={handleCopySummary}
          style={{ padding: "7px 8px", borderRadius: 999, fontSize: 10, fontWeight: 900, cursor: "pointer", background: copied ? "#16A34A" : "rgba(255,255,255,0.86)", color: copied ? "white" : SLATE, border: "1px solid rgba(0,0,0,0.12)", whiteSpace: "nowrap" }}>
          {copied ? "✓" : "📋"}
        </button>
      </div>
      {saveError && (
        <div style={{ fontSize: 10, color: "#E53935", marginBottom: 6, fontWeight: 600 }}>{saveError}</div>
      )}
      <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div style={{ overflowY: "auto", flex: 1, minHeight: 0, paddingRight: 2 }}>
        {activeTab === "decision" && <DecisionTab />}
        {activeTab === "moves" && <MovesTab />}
        {activeTab === "execution" && <ExecutionTab />}
        {activeTab === "review" && <ReviewTab />}
        {activeTab === "coach" && <CoachTab />}
      </div>
    </div>
  );
}

// ─── Input form — lifted outside default export to prevent cursor/focus reset ──
function InputForm({ form, updateForm, handleRun, loading, error }) {
  return (
    <div style={{ ...GLASS, overflow: "hidden" }}>
      <div style={{ ...SECTION_HDR, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span>🎯 PROJECT & PROMOTION INTELLIGENCE</span>
      </div>
      <div style={{ padding: 14, display: "grid", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "9px 12px", borderRadius: 10,
          background: "rgba(22,163,74,0.10)", border: "1px solid rgba(22,163,74,0.25)" }}>
          <span>✅</span>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#15803D", lineHeight: 1.45 }}>
            Uses your current resume, profile, and portfolio as the evidence base. Add current-role context below.
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <Field label="Current role">
            <input name="currentRole" value={form.currentRole} onChange={updateForm}
              placeholder="e.g. Client Success Manager" style={INPUT} />
          </Field>
          <Field label="Current company">
            <input name="currentCompany" value={form.currentCompany} onChange={updateForm}
              placeholder="Company or department" style={INPUT} />
          </Field>
        </div>

        <Field label="Completed projects / recent wins">
          <textarea name="completedProjects" value={form.completedProjects} onChange={updateForm} rows={3}
            placeholder="Recent wins, systems built, metrics improved, training created, reporting fixed..."
            style={{ ...INPUT, resize: "vertical", lineHeight: 1.5 }} />
        </Field>

        <Field label="Current projects in progress">
          <textarea name="currentProjects" value={form.currentProjects} onChange={updateForm} rows={2}
            placeholder="What are you already working on right now?"
            style={{ ...INPUT, resize: "vertical", lineHeight: 1.5 }} />
        </Field>

        <Field label="Problems you see at work">
          <textarea name="problemsObserved" value={form.problemsObserved} onChange={updateForm} rows={2}
            placeholder="Broken workflows, missed handoffs, slow reporting, quality gaps, customer pain..."
            style={{ ...INPUT, resize: "vertical", lineHeight: 1.5 }} />
        </Field>

        <Field label="Promotion or review goal optional">
          <input name="promotionGoal" value={form.promotionGoal} onChange={updateForm}
            placeholder="e.g. promotion, bigger scope, leadership visibility, stronger review" style={INPUT} />
        </Field>

        <button type="button" onClick={handleRun} disabled={loading}
          style={{ padding: "11px 16px", borderRadius: 10, border: "none",
            background: loading ? "rgba(255,112,67,0.62)" : ORANGE, color: "white",
            fontSize: 13, fontWeight: 900, cursor: loading ? "not-allowed" : "pointer",
            width: "100%", boxShadow: loading ? "none" : "0 4px 14px rgba(255,112,67,0.35)" }}>
          {loading ? "Finding your next win…" : "Find My Next Win"}
        </button>

        {error && (
          <div style={{ padding: "9px 12px", borderRadius: 10, background: "rgba(220,38,38,0.10)",
            border: "1px solid rgba(220,38,38,0.25)", color: "#B91C1C", fontSize: 11, fontWeight: 800 }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Input summary — lifted outside default export to prevent cursor/focus reset ─
function InputSummary({ form, onEdit }) {
  return (
    <div style={{ ...GLASS, overflow: "hidden", height: "100%" }}>
      <div style={SECTION_HDR}>📋 YOUR INPUTS</div>
      <div style={{ padding: "12px 14px", display: "grid", gap: 8 }}>
        {[
          ["Role", form.currentRole],
          ["Company", form.currentCompany],
          ["Recent wins", form.completedProjects?.slice(0, 80) + (form.completedProjects?.length > 80 ? "…" : "")],
          ["In progress", form.currentProjects?.slice(0, 60) + (form.currentProjects?.length > 60 ? "…" : "")],
          ["Problems seen", form.problemsObserved?.slice(0, 60) + (form.problemsObserved?.length > 60 ? "…" : "")],
          ["Goal", form.promotionGoal],
        ].filter(([, v]) => v).map(([k, v]) => (
          <div key={k} style={{ display: "grid", gridTemplateColumns: "90px 1fr", gap: 6,
            borderBottom: "1px solid rgba(0,0,0,0.05)", paddingBottom: 7 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", paddingTop: 1, letterSpacing: 0.3 }}>
              {String(k).toUpperCase()}
            </div>
            <div style={{ fontSize: 11, color: SLATE, fontWeight: 600, lineHeight: 1.4 }}>{v}</div>
          </div>
        ))}
        <button type="button" onClick={onEdit}
          style={{ marginTop: 4, padding: "7px 14px", borderRadius: 999, fontSize: 11, fontWeight: 800,
            cursor: "pointer", background: "rgba(255,112,67,0.08)", color: ORANGE,
            border: "1px solid rgba(255,112,67,0.25)" }}>
          ✏️ Edit Inputs
        </button>
      </div>
    </div>
  );
}

export default function ProjectPromotionEngine() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [mobileTab, setMobileTab] = useState("decision");

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const plan = result?.plan || null;

  const moves = useMemo(() => {
    return Array.isArray(plan?.rankedMoves) ? plan.rankedMoves : [];
  }, [plan]);

  const recommendedRank = Number(plan?.recommendedMove?.rank || 1);

  const updateForm = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRun = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      // ── Fetch unified career context (Stage 3 — enhances, does not replace inputs) ──
      let careerContext = null;
      try {
        const ctxRes = await fetch("/api/intelligence/context");
        if (ctxRes.ok) {
          const ctxData = await ctxRes.json().catch(() => null);
          careerContext = ctxData?.context ?? null;
        } else {
          console.warn("[ProjectPromotionEngine] context fetch non-OK:", ctxRes.status);
        }
      } catch (ctxErr) {
        console.warn("[ProjectPromotionEngine] context fetch failed — continuing without context:", ctxErr?.message);
      }

      // ── Build merged payload ──────────────────────────────────────────────────
      // User inputs always take precedence. Context enriches, never overwrites.
      const res = await fetch("/api/anvil/project-promotion/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // User-entered fields — unchanged, always sent
          currentRole:    form.currentRole,
          currentCompany: form.currentCompany,
          additionalContext: [
            form.completedProjects ? `Completed projects:\n${form.completedProjects}` : "",
            form.currentProjects   ? `Current projects:\n${form.currentProjects}`     : "",
            form.problemsObserved  ? `Problems observed:\n${form.problemsObserved}`   : "",
            form.promotionGoal     ? `Promotion/review goal:\n${form.promotionGoal}`  : "",
          ].filter(Boolean).join("\n\n"),

          // Unified career context — enhances intelligence, does not replace inputs
          context: careerContext,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || `Project analysis failed (${res.status})`);
      }

      setResult(data);
    } catch (err) {
      console.error("[ProjectPromotionEngine] error", err);
      setError(err?.message || "Project & Promotion Intelligence could not run.");
    } finally {
      setLoading(false);
    }
  };



  // ─── MOBILE LAYOUT ─────────────────────────────────────────────────────────
  if (isMobile) {
    const MOBILE_TABS = [
      { id: "decision", emoji: "⚡", label: "Decision" },
      { id: "moves", emoji: "🏆", label: "Moves" },
      { id: "execution", emoji: "🚀", label: "Execute" },
      { id: "review", emoji: "📌", label: "Review" },
      { id: "coach", emoji: "🔥", label: "Coach" },
    ];

    if (plan) {
      return (
        <div style={{ display: "flex", flexDirection: "column", width: "100%", gap: 8 }}>
          <style>{`@keyframes pulseDot{0%,100%{opacity:.35;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}`}</style>
          <details style={{ marginBottom: 4 }}>
            <summary style={{ ...GLASS, padding: "10px 14px", borderRadius: 12, cursor: "pointer",
              listStyle: "none", display: "flex", alignItems: "center", justifyContent: "space-between",
              fontWeight: 800, fontSize: 12, color: SLATE }}>
              <span>📋 View your inputs</span>
              <span style={{ fontSize: 10, color: "#94A3B8" }}>tap to expand</span>
            </summary>
            <div style={{ marginTop: 6 }}><InputSummary form={form} onEdit={() => setResult(null)} /></div>
          </details>
          <div style={{ flex: 1, overflowY: "auto", paddingBottom: 80 }}>
            <ResultCockpit result={result} plan={plan} moves={moves} recommendedRank={recommendedRank}
              mobileTab={mobileTab} onMobileTabChange={setMobileTab} form={form} />
          </div>
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
            background: "rgba(255,255,255,0.95)", borderTop: "1px solid rgba(0,0,0,0.10)",
            backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
            display: "flex", padding: "8px 16px 12px" }}>
            {MOBILE_TABS.map(t => (
              <button key={t.id} type="button" onClick={() => setMobileTab(t.id)}
                style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                  padding: "6px 4px", border: "none", background: "transparent", cursor: "pointer" }}>
                <span style={{ fontSize: 16 }}>{t.emoji}</span>
                <span style={{ fontSize: 9, fontWeight: 800, color: mobileTab === t.id ? ORANGE : "#94A3B8" }}>
                  {t.label}
                </span>
                {mobileTab === t.id && <div style={{ width: 16, height: 2, borderRadius: 1, background: ORANGE }} />}
              </button>
            ))}
          </div>
        </div>
      );
    }
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
        <style>{`@keyframes pulseDot{0%,100%{opacity:.35;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}`}</style>
        <InputForm form={form} updateForm={updateForm} handleRun={handleRun} loading={loading} error={error} />
        {loading && <LoadingState />}
      </div>
    );
  }

  // ─── DESKTOP LAYOUT ────────────────────────────────────────────────────────
  return (
    <div style={{ width: "100%" }}>
      <style>{`@keyframes pulseDot{0%,100%{opacity:.35;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}`}</style>

      {/* Results view — input summary left, cockpit right */}
      {(plan || loading) ? (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,280px) minmax(0,1fr)", gap: 12,
          alignItems: "stretch", width: "100%", gridAutoRows: "1fr" }}>
          <div style={{ position: "sticky", top: 16, alignSelf: "start" }}>
            {loading ? (
              <div style={{ ...GLASS, padding: "32px 16px", textAlign: "center" }}>
                <LoadingState />
              </div>
            ) : (
              <InputSummary form={form} onEdit={() => setResult(null)} />
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
            {!loading && plan && (
              <ResultCockpit result={result} plan={plan} moves={moves} recommendedRank={recommendedRank} form={form} />
            )}
          </div>
        </div>
      ) : (
        /* Input view — form left, preview right */
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,340px)", gap: 12, alignItems: "start" }}>
          <InputForm form={form} updateForm={updateForm} handleRun={handleRun} loading={loading} error={error} />
          {/* Right preview */}
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ ...GLASS, padding: "16px 14px", background: "rgba(30,41,59,0.88)",
              backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.12)" }}>
              <div style={{ fontWeight: 900, fontSize: 14, color: ORANGE, marginBottom: 6 }}>
                🎯 Project & Promotion Intelligence
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.60)", lineHeight: 1.6 }}>
                Powered by Human-Centered Career Intelligence. Your resume and profile evidence drives the plan — not generic advice.
              </div>
            </div>
            <div style={{ ...WHITE_CARD, padding: "10px 12px" }}>
              <div style={{ fontWeight: 800, fontSize: 10, color: SLATE, marginBottom: 8, letterSpacing: 0.3 }}>
                YOUR PLAN INCLUDES
              </div>
              {[
                "⚡ Performance read — what leadership actually sees",
                "🏆 Top 3 high-impact project moves, ranked",
                "🚀 Execution plan — first step, who to align, how to pitch",
                "📌 Review narrative — what to say in your performance review",
                "📄 PDF brief — ready to bring to leadership",
                "🔥 Coach Spotlights — pressure-test before you pitch",
              ].map((item, i) => (
                <div key={i} style={{ fontSize: 10, color: "#64748B", padding: "3px 0",
                  borderBottom: i < 5 ? "1px solid rgba(0,0,0,0.05)" : "none" }}>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}