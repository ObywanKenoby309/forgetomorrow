// components/project-promotion/ProjectPromotionEngine.js

import { useMemo, useState } from "react";

const ORANGE = "#FF7043";
const SLATE = "#334155";
const DARK = "#1E293B";

const GLASS = {
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.22)",
  background: "rgba(255,255,255,0.58)",
  boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
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
              EXAMPLE PROJECTS
            </div>
            <BulletList items={move?.exampleProjects} />
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 900, color: "#64748B", marginBottom: 5 }}>
              SUCCESS METRICS
            </div>
            <BulletList items={move?.successMetrics} />
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

export default function ProjectPromotionEngine() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

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
      const res = await fetch("/api/anvil/project-promotion/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentRole: form.currentRole,
          currentCompany: form.currentCompany,
          additionalContext: [
            form.completedProjects ? `Completed projects:\n${form.completedProjects}` : "",
            form.currentProjects ? `Current projects:\n${form.currentProjects}` : "",
            form.problemsObserved ? `Problems observed:\n${form.problemsObserved}` : "",
            form.promotionGoal ? `Promotion/review goal:\n${form.promotionGoal}` : "",
          ].filter(Boolean).join("\n\n"),
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

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <style>{`
        @keyframes pulseDot {
          0%,100% { opacity: .35; transform: scale(.8); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(280px, 0.92fr) minmax(360px, 1.08fr)", gap: 12 }}>
        {/* LEFT PANEL */}
        <div style={{ ...WHITE_CARD, overflow: "hidden" }}>
          <div style={SECTION_HDR}>🎯 PROJECT & PROMOTION INTELLIGENCE</div>

          <div style={{ padding: 14, display: "grid", gap: 13 }}>
            <div
              style={{
                padding: "9px 12px",
                borderRadius: 10,
                background: "rgba(22,163,74,0.10)",
                border: "1px solid rgba(22,163,74,0.25)",
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
              }}
            >
              <span>✅</span>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#15803D", lineHeight: 1.45 }}>
                Uses your current resume, profile, and portfolio as the evidence base. Add current-role context below so the system can identify what wins next.
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <Field label="Current role">
                <input
                  name="currentRole"
                  value={form.currentRole}
                  onChange={updateForm}
                  placeholder="e.g. Client Success Manager"
                  style={INPUT}
                />
              </Field>

              <Field label="Current company">
                <input
                  name="currentCompany"
                  value={form.currentCompany}
                  onChange={updateForm}
                  placeholder="Company or department"
                  style={INPUT}
                />
              </Field>
            </div>

            <Field label="Completed projects / recent wins">
              <textarea
                name="completedProjects"
                value={form.completedProjects}
                onChange={updateForm}
                rows={4}
                placeholder="List recent wins, systems built, metrics improved, training created, reporting fixed, risks reduced..."
                style={{ ...INPUT, resize: "vertical", lineHeight: 1.5 }}
              />
            </Field>

            <Field label="Current projects in progress">
              <textarea
                name="currentProjects"
                value={form.currentProjects}
                onChange={updateForm}
                rows={3}
                placeholder="What are you already working on right now?"
                style={{ ...INPUT, resize: "vertical", lineHeight: 1.5 }}
              />
            </Field>

            <Field label="Problems you see at work">
              <textarea
                name="problemsObserved"
                value={form.problemsObserved}
                onChange={updateForm}
                rows={3}
                placeholder="Broken workflows, missed handoffs, slow reporting, quality gaps, customer pain, team friction..."
                style={{ ...INPUT, resize: "vertical", lineHeight: 1.5 }}
              />
            </Field>

            <Field label="Promotion or review goal optional">
              <input
                name="promotionGoal"
                value={form.promotionGoal}
                onChange={updateForm}
                placeholder="e.g. promotion, bigger scope, leadership visibility, stronger review"
                style={INPUT}
              />
            </Field>

            <button
              type="button"
              onClick={handleRun}
              disabled={loading}
              style={{
                marginTop: 2,
                padding: "11px 16px",
                borderRadius: 10,
                border: "none",
                background: loading ? "rgba(255,112,67,0.62)" : ORANGE,
                color: "white",
                fontSize: 13,
                fontWeight: 900,
                cursor: loading ? "not-allowed" : "pointer",
                width: "fit-content",
                boxShadow: "0 8px 18px rgba(255,112,67,0.25)",
              }}
            >
              {loading ? "Finding your next win..." : "Find My Next Win"}
            </button>

            {error && (
              <div
                style={{
                  padding: "9px 12px",
                  borderRadius: 10,
                  background: "rgba(220,38,38,0.10)",
                  border: "1px solid rgba(220,38,38,0.25)",
                  color: "#B91C1C",
                  fontSize: 11,
                  fontWeight: 800,
                  lineHeight: 1.45,
                }}
              >
                {error}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{ display: "grid", gap: 10, minHeight: 0 }}>
          {!loading && !plan && (
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
                    "The recommended move and first step this week",
                    "A manager-ready review narrative and future resume bullet",
                    "A Forge Coach bridge for execution support",
                  ]}
                />
              </div>
            </>
          )}

          {loading && (
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
          )}

          {!loading && plan && (
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {result?.resumeConnected && <StatusPill tone="green">Resume connected</StatusPill>}
                {result?.profileConnected && <StatusPill tone="green">Profile connected</StatusPill>}
                {result?.evidenceConnected && <StatusPill tone="orange">Evidence engine active</StatusPill>}
              </div>

              <div
                style={{
                  borderRadius: 14,
                  overflow: "hidden",
                  boxShadow: "0 8px 24px rgba(255,112,67,0.20)",
                }}
              >
                <div
                  style={{
                    padding: "14px 16px",
                    background: "linear-gradient(135deg, rgba(255,112,67,0.95), rgba(234,88,12,0.90))",
                    color: "white",
                  }}
                >
                  <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: 0.6, opacity: 0.85, marginBottom: 3 }}>
                    PERFORMANCE READ
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.55 }}>
                    {plan.performanceRead || "No performance read returned."}
                  </div>
                </div>

                <div style={{ background: "rgba(255,255,255,0.96)", padding: 13, display: "grid", gap: 8 }}>
                  {plan.leverageGap && (
                    <div style={{ fontSize: 12, color: SLATE, lineHeight: 1.5 }}>
                      <strong>What is holding you back:</strong> {plan.leverageGap}
                    </div>
                  )}
                  {plan.underLeveragingSignal && (
                    <div
                      style={{
                        padding: 9,
                        borderRadius: 10,
                        background: "rgba(254,243,199,0.88)",
                        border: "1px solid rgba(245,158,11,0.25)",
                        color: "#78350F",
                        fontSize: 11,
                        lineHeight: 1.45,
                        fontWeight: 700,
                      }}
                    >
                      {plan.underLeveragingSignal}
                    </div>
                  )}
                </div>
              </div>

              {moves.map((move) => (
                <MoveCard
                  key={`${move?.rank || ""}-${move?.title || ""}`}
                  move={move}
                  recommended={Number(move?.rank) === recommendedRank}
                />
              ))}

              {plan.recommendedMove && (
                <div style={{ ...WHITE_CARD, overflow: "hidden" }}>
                  <div style={SECTION_HDR}>🚀 RECOMMENDED MOVE</div>
                  <div style={{ padding: 13, display: "grid", gap: 8 }}>
                    {plan.recommendedMove.decision && (
                      <div style={{ fontSize: 13, fontWeight: 900, color: DARK, lineHeight: 1.45 }}>
                        {plan.recommendedMove.decision}
                      </div>
                    )}
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

              {plan.reviewNarrative && (
                <div style={{ ...WHITE_CARD, overflow: "hidden" }}>
                  <div style={SECTION_HDR}>📌 REVIEW NARRATIVE</div>
                  <div style={{ padding: 13, display: "grid", gap: 8 }}>
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
                          padding: 9,
                          borderRadius: 10,
                          background: "rgba(22,163,74,0.08)",
                          border: "1px solid rgba(22,163,74,0.20)",
                          color: "#166534",
                          fontSize: 11,
                          lineHeight: 1.45,
                          fontWeight: 700,
                        }}
                      >
                        Future resume bullet: {plan.reviewNarrative.resumeFutureBullet}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {plan.coachBridge && (
                <div style={{ ...GLASS, padding: 13, borderLeft: `3px solid ${ORANGE}` }}>
                  <div style={{ fontWeight: 900, fontSize: 12, color: ORANGE, marginBottom: 5 }}>
                    🤝 Bring in a Forge Coach
                  </div>
                  <div style={{ fontSize: 11, color: SLATE, lineHeight: 1.55, marginBottom: 8 }}>
                    {plan.coachBridge.whyCoachHelps || "A coach can help you turn this into a project your leadership will understand and value."}
                  </div>
                  {plan.coachBridge.whatToBring && (
                    <div style={{ fontSize: 11, color: SLATE, lineHeight: 1.55, marginBottom: 9 }}>
                      <strong>Bring:</strong> {plan.coachBridge.whatToBring}
                    </div>
                  )}
                  <a
                    href="/the-hearth?module=mentorship"
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
                    {plan.coachBridge.cta || "Work with a Forge Coach"}
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}