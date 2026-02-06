// pages/recruiter/pools.js
import { useMemo, useState } from "react";
import RecruiterLayout from "@/components/layouts/RecruiterLayout";

const ORANGE = "#FF7043";

function HeaderBox() {
  return (
    <section
      style={{
        background: "white",
        border: "1px solid #eee",
        borderRadius: 12,
        padding: 16,
        boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
        textAlign: "center",
      }}
    >
      <h1
        style={{
          color: ORANGE,
          fontSize: 28,
          fontWeight: 800,
          margin: 0,
        }}
      >
        Talent Pools
      </h1>
      <p
        style={{
          marginTop: 8,
          color: "#546E7A",
          fontSize: 14,
          marginBottom: 0,
        }}
      >
        Save, group, and reuse strong candidates for future roles - with clear “why saved” evidence and fast outreach.
      </p>
    </section>
  );
}

function RightRail() {
  // You said this should be ads later - keeping it clean/minimal tonight.
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div
        style={{
          background: "white",
          borderRadius: 10,
          padding: 12,
          boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
          border: "1px solid #eee",
        }}
      >
        <div style={{ fontWeight: 900, color: "#37474F", marginBottom: 6 }}>
          Placeholder
        </div>
        <p style={{ margin: 0, color: "#607D8B", fontSize: 13, lineHeight: 1.45 }}>
          Right rail will become ad placements. Tonight we focus on the Talent Pools working surface.
        </p>
      </div>
    </div>
  );
}

function Pill({ children, tone = "neutral" }) {
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

function SectionTitle({ title, subtitle, right }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 900, color: "#37474F", fontSize: 14 }}>{title}</div>
        {subtitle ? (
          <div style={{ color: "#607D8B", fontSize: 12, marginTop: 2, lineHeight: 1.35 }}>{subtitle}</div>
        ) : null}
      </div>
      {right ? <div style={{ flex: "0 0 auto" }}>{right}</div> : null}
    </div>
  );
}

function PrimaryButton({ children, onClick, disabled = false }) {
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

function SecondaryButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: "1px solid rgba(38,50,56,0.18)",
        background: "white",
        color: "#37474F",
        borderRadius: 10,
        padding: "10px 12px",
        fontWeight: 900,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

function TextButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: "none",
        background: "transparent",
        color: ORANGE,
        fontWeight: 900,
        cursor: "pointer",
        padding: 0,
        textAlign: "left",
      }}
    >
      {children}
    </button>
  );
}

export default function RecruiterPools() {
  // Mock data: tonight is UI/format only
  const mockPools = useMemo(
    () => [
      {
        id: "pool-1",
        name: "Silver Medalists",
        purpose: "Strong finalists worth re-engaging fast when a similar role opens.",
        tags: ["closing-ready", "fast-follow"],
        updatedAt: "Today",
      },
      {
        id: "pool-2",
        name: "Customer Success Leaders",
        purpose: "Leadership-level CS candidates for remote/hybrid roles.",
        tags: ["cs", "leadership"],
        updatedAt: "Yesterday",
      },
      {
        id: "pool-3",
        name: "Nashville Pipeline",
        purpose: "Local/regional talent for TN/KY hiring pushes.",
        tags: ["nashville", "regional"],
        updatedAt: "3 days ago",
      },
    ],
    []
  );

  const mockCandidatesByPool = useMemo(
    () => ({
      "pool-1": [
        {
          id: "c-1",
          name: "Jordan Miles",
          headline: "Client Success Manager | SaaS | Enterprise Accounts",
          source: "Internal",
          status: "Hot",
          fit: "CSM / AM",
          lastTouch: "2 days ago",
          reasons: ["Led renewals at 92% retention", "Scaled onboarding playbooks", "Strong exec presence"],
          notes: "Great communicator. Would re-engage for any CSM Lead role.",
        },
        {
          id: "c-2",
          name: "Avery Chen",
          headline: "Support Ops Lead | ServiceNow | Knowledge + QA",
          source: "External",
          status: "Warm",
          fit: "Support Ops",
          lastTouch: "1 week ago",
          reasons: ["Built KB + deflection strategy", "Improved SLA compliance", "Strong metrics mindset"],
          notes: "Needs comp alignment. Good fit for ops-heavy orgs.",
        },
      ],
      "pool-2": [
        {
          id: "c-3",
          name: "Riley Hart",
          headline: "Director, Customer Success | B2B | Expansion Strategy",
          source: "External",
          status: "Warm",
          fit: "CS Director",
          lastTouch: "4 days ago",
          reasons: ["Owned expansion motion", "Cross-functional leadership", "Scaled teams to 25+"],
          notes: "Very strong. Keep warm for Director/Head roles.",
        },
        {
          id: "c-4",
          name: "Samira Patel",
          headline: "CS Lead | HealthTech | High-touch enterprise",
          source: "Internal",
          status: "Hold",
          fit: "CS Lead",
          lastTouch: "2 weeks ago",
          reasons: ["Deep domain knowledge", "Strong stakeholder mgmt", "Process builder"],
          notes: "Pause until Q2 headcount opens.",
        },
      ],
      "pool-3": [
        {
          id: "c-5",
          name: "Taylor Brooks",
          headline: "Recruiting Coordinator → Sourcer | High-volume + scheduling",
          source: "External",
          status: "Warm",
          fit: "Recruiting Ops",
          lastTouch: "6 days ago",
          reasons: ["Fast scheduling + follow-up", "Great candidate experience", "Organized + reliable"],
          notes: "Local. Great for ops support on growing team.",
        },
      ],
    }),
    []
  );

  const [selectedPoolId, setSelectedPoolId] = useState(mockPools[0]?.id || "");
  const [search, setSearch] = useState("");
  const [selectedCandidateId, setSelectedCandidateId] = useState("");

  const selectedPool = mockPools.find((p) => p.id === selectedPoolId) || null;
  const candidates = selectedPoolId ? mockCandidatesByPool[selectedPoolId] || [] : [];

  const filteredCandidates = candidates.filter((c) => {
    const q = String(search || "").toLowerCase().trim();
    if (!q) return true;
    const hay = `${c.name} ${c.headline} ${c.fit} ${c.source} ${c.status}`.toLowerCase();
    return hay.includes(q);
  });

  const selectedCandidate =
    filteredCandidates.find((c) => c.id === selectedCandidateId) ||
    (filteredCandidates[0] || null);

  // Keep selection stable when pool/search changes
  if (selectedCandidate && selectedCandidateId !== selectedCandidate.id) {
    // This is safe in render because it only moves toward a stable value.
    // eslint-disable-next-line react/no-direct-mutation-state
    // We can’t call setState unconditionally; use a guard with microtask.
    Promise.resolve().then(() => setSelectedCandidateId(selectedCandidate.id));
  }

  const panelStyle = {
    background: "white",
    border: "1px solid #eee",
    borderRadius: 14,
    padding: 16,
    boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
  };

  return (
    <RecruiterLayout
      title="ForgeTomorrow — Talent Pools"
      header={<HeaderBox />}
      right={<RightRail />}
      // This page is under Candidate Center tools; if you later add a "pools" key, we can set it then.
      activeNav="candidate-center"
    >
      <section style={panelStyle} aria-label="Talent Pools working surface">
        <SectionTitle
          title="Pools workspace"
          subtitle="Pick a pool, scan candidates, and take action without jumping between pages."
          right={
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <SecondaryButton
                onClick={() => {
                  // UI-only tonight
                  alert("UI-only tonight: Create Pool will be wired to DB tomorrow.");
                }}
              >
                New pool
              </SecondaryButton>
              <PrimaryButton
                onClick={() => {
                  // UI-only tonight
                  alert("UI-only tonight: Add Candidates will be wired from Candidate Center tomorrow.");
                }}
              >
                Add candidates
              </PrimaryButton>
            </div>
          }
        />

        <div style={{ height: 12 }} />

        {/* 3-column surface: Pools | Candidates | Candidate detail */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "280px 1fr 360px",
            gap: 12,
            alignItems: "start",
          }}
        >
          {/* Left: Pool list */}
          <div style={{ ...panelStyle, padding: 12 }}>
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ fontWeight: 900, color: "#37474F" }}>Your pools</div>

              <div style={{ display: "grid", gap: 8 }}>
                {mockPools.map((p) => {
                  const active = p.id === selectedPoolId;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedPoolId(p.id);
                        setSearch("");
                        setSelectedCandidateId("");
                      }}
                      style={{
                        textAlign: "left",
                        border: active ? `1px solid rgba(255,112,67,0.45)` : "1px solid rgba(38,50,56,0.12)",
                        background: active ? "rgba(255,112,67,0.08)" : "white",
                        borderRadius: 12,
                        padding: 10,
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                        <div style={{ fontWeight: 900, color: "#263238", fontSize: 13 }}>{p.name}</div>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 900,
                            color: "#37474F",
                            background: "rgba(96,125,139,0.12)",
                            padding: "3px 8px",
                            borderRadius: 999,
                          }}
                        >
                          {(mockCandidatesByPool[p.id] || []).length}
                        </span>
                      </div>
                      <div style={{ color: "#607D8B", fontSize: 12, marginTop: 4, lineHeight: 1.35 }}>
                        {p.purpose}
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                        {p.tags.map((t) => (
                          <Pill key={t} tone="neutral">
                            {t}
                          </Pill>
                        ))}
                      </div>
                      <div style={{ color: "#90A4AE", fontSize: 11, marginTop: 8 }}>Updated: {p.updatedAt}</div>
                    </button>
                  );
                })}
              </div>

              <div style={{ marginTop: 4, color: "#607D8B", fontSize: 12, lineHeight: 1.35 }}>
                <strong>ForgeTomorrow advantage:</strong> every saved candidate carries a “why saved” snapshot so you keep signal, not just names.
              </div>
            </div>
          </div>

          {/* Middle: Candidate list */}
          <div style={{ ...panelStyle, padding: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 900, color: "#37474F" }}>
                  {selectedPool ? selectedPool.name : "Candidates"}
                </div>
                <div style={{ color: "#607D8B", fontSize: 12, marginTop: 2 }}>
                  {filteredCandidates.length} candidate{filteredCandidates.length === 1 ? "" : "s"} shown
                </div>
              </div>

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search candidates in this pool..."
                aria-label="Search candidates"
                style={{
                  flex: "1 1 260px",
                  maxWidth: 420,
                  border: "1px solid rgba(38,50,56,0.18)",
                  borderRadius: 10,
                  padding: "10px 12px",
                  fontWeight: 700,
                  outline: "none",
                }}
              />
            </div>

            <div style={{ height: 12 }} />

            {filteredCandidates.length === 0 ? (
              <div
                style={{
                  border: "1px dashed rgba(38,50,56,0.22)",
                  borderRadius: 12,
                  padding: 14,
                  color: "#607D8B",
                  fontSize: 13,
                  lineHeight: 1.45,
                }}
              >
                No candidates match your search.
              </div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {filteredCandidates.map((c) => {
                  const active = selectedCandidate && selectedCandidate.id === c.id;
                  const statusTone =
                    String(c.status || "").toLowerCase() === "hot"
                      ? "hot"
                      : String(c.status || "").toLowerCase() === "warm"
                      ? "warm"
                      : "hold";

                  const sourceTone = String(c.source || "").toLowerCase() === "internal" ? "internal" : "external";

                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCandidateId(c.id)}
                      style={{
                        textAlign: "left",
                        border: active ? `1px solid rgba(255,112,67,0.45)` : "1px solid rgba(38,50,56,0.12)",
                        background: active ? "rgba(255,112,67,0.06)" : "white",
                        borderRadius: 12,
                        padding: 12,
                        cursor: "pointer",
                        display: "grid",
                        gap: 6,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                        <div style={{ fontWeight: 900, color: "#263238", fontSize: 14 }}>{c.name}</div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                          <Pill tone={sourceTone}>{c.source}</Pill>
                          <Pill tone={statusTone}>{c.status}</Pill>
                        </div>
                      </div>

                      <div style={{ color: "#607D8B", fontSize: 12, lineHeight: 1.35 }}>{c.headline}</div>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                        <div style={{ color: "#455A64", fontSize: 12, fontWeight: 800 }}>
                          Fit: <span style={{ color: "#37474F" }}>{c.fit}</span>
                        </div>
                        <div style={{ color: "#90A4AE", fontSize: 11, fontWeight: 800 }}>Last touch: {c.lastTouch}</div>
                      </div>

                      <div style={{ display: "grid", gap: 4, marginTop: 6 }}>
                        <div style={{ color: "#37474F", fontSize: 12, fontWeight: 900 }}>Why saved</div>
                        <ul style={{ margin: 0, paddingLeft: 18, color: "#546E7A", fontSize: 12, lineHeight: 1.35 }}>
                          {c.reasons.slice(0, 2).map((r, idx) => (
                            <li key={`${c.id}-r-${idx}`}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Candidate detail panel */}
          <div style={{ ...panelStyle, padding: 12 }}>
            {!selectedCandidate ? (
              <div style={{ color: "#607D8B", fontSize: 13, lineHeight: 1.45 }}>
                Select a candidate to view details.
              </div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 900, color: "#263238", fontSize: 16 }}>{selectedCandidate.name}</div>
                    <div style={{ color: "#607D8B", fontSize: 12, marginTop: 4, lineHeight: 1.35 }}>
                      {selectedCandidate.headline}
                    </div>
                  </div>
                  <div style={{ display: "grid", gap: 8, justifyItems: "end" }}>
                    <Pill tone={String(selectedCandidate.source).toLowerCase() === "internal" ? "internal" : "external"}>
                      {selectedCandidate.source}
                    </Pill>
                    <Pill
                      tone={
                        String(selectedCandidate.status).toLowerCase() === "hot"
                          ? "hot"
                          : String(selectedCandidate.status).toLowerCase() === "warm"
                          ? "warm"
                          : "hold"
                      }
                    >
                      {selectedCandidate.status}
                    </Pill>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Pill tone="neutral">Fit: {selectedCandidate.fit}</Pill>
                  <Pill tone="neutral">Last touch: {selectedCandidate.lastTouch}</Pill>
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
                  <ul style={{ margin: 0, paddingLeft: 18, color: "#546E7A", fontSize: 12, lineHeight: 1.45 }}>
                    {selectedCandidate.reasons.map((r, idx) => (
                      <li key={`${selectedCandidate.id}-rr-${idx}`}>{r}</li>
                    ))}
                  </ul>

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
                    {selectedCandidate.notes}
                  </div>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
                    <PrimaryButton
                      onClick={() => alert("UI-only tonight: Messaging will connect to The Signal tomorrow.")}
                    >
                      Message
                    </PrimaryButton>
                    <SecondaryButton
                      onClick={() => alert("UI-only tonight: View Candidate will route to candidate drawer/profile tomorrow.")}
                    >
                      View candidate
                    </SecondaryButton>
                    <TextButton
                      onClick={() => alert("UI-only tonight: Remove from pool will be wired tomorrow.")}
                    >
                      Remove from pool
                    </TextButton>
                  </div>

                  <div style={{ color: "#90A4AE", fontSize: 11, lineHeight: 1.35, marginTop: 4 }}>
                    This panel is the efficiency win: no tab-jumping. Pools become a working surface, not a storage bin.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </RecruiterLayout>
  );
}
