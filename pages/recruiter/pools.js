// pages/recruiter/pools.js
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
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
      <h1 style={{ color: ORANGE, fontSize: 28, fontWeight: 800, margin: 0 }}>Talent Pools</h1>
      <p style={{ marginTop: 8, color: "#546E7A", fontSize: 14, marginBottom: 0 }}>
        Save, group, and reuse strong candidates for future roles - with clear “why saved” evidence and fast outreach.
      </p>
    </section>
  );
}

function RightRail() {
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
        <div style={{ fontWeight: 900, color: "#37474F", marginBottom: 6 }}>Placeholder</div>
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

function SecondaryButton({ children, onClick, disabled = false }) {
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

function TextButton({ children, onClick, disabled = false }) {
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

function fmtUpdatedAt(d) {
  try {
    const dt = new Date(d);
    if (!Number.isFinite(dt.getTime())) return "";
    return dt.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function fmtShortDate(v) {
  try {
    if (!v) return "-";
    const dt = new Date(v);
    if (!Number.isFinite(dt.getTime())) return "-";
    return dt.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "-";
  }
}

function normalizeReasonsText(s) {
  const raw = String(s || "").trim();
  if (!raw) return [];
  // allow newline or bullet separation
  return raw
    .split(/\n+/g)
    .map((x) => String(x || "").trim())
    .filter(Boolean)
    .slice(0, 8);
}

export default function RecruiterPools() {
  const router = useRouter();

  const panelStyle = useMemo(
    () => ({
      background: "white",
      border: "1px solid #eee",
      borderRadius: 14,
      padding: 16,
      boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
    }),
    []
  );

  const [loadingPools, setLoadingPools] = useState(true);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [pools, setPools] = useState([]);
  const [selectedPoolId, setSelectedPoolId] = useState("");
  const [entries, setEntries] = useState([]);

  const [search, setSearch] = useState("");
  const [selectedEntryId, setSelectedEntryId] = useState("");

  // Create Pool modal (simple, inline)
  const [showCreate, setShowCreate] = useState(false);
  const [newPoolName, setNewPoolName] = useState("");
  const [newPoolPurpose, setNewPoolPurpose] = useState("");
  const [newPoolTags, setNewPoolTags] = useState("");

  // ✅ Add Candidates picker (DB-backed)
  const [showPicker, setShowPicker] = useState(false);
  const [loadingPicker, setLoadingPicker] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [pickerResults, setPickerResults] = useState([]);
  const [pickerSelectedIds, setPickerSelectedIds] = useState([]);
  const [pickerWhy, setPickerWhy] = useState("");
  const [pickerFit, setPickerFit] = useState("");
  const [pickerStatus, setPickerStatus] = useState("Warm");

  async function loadPools() {
    setLoadingPools(true);
    setError("");
    try {
      const res = await fetch("/api/recruiter/pools", { method: "GET" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to load pools.");
      const list = Array.isArray(data?.pools) ? data.pools : [];
      setPools(list);

      if (!selectedPoolId && list[0]?.id) setSelectedPoolId(list[0].id);
      if (selectedPoolId && !list.some((p) => p.id === selectedPoolId)) {
        setSelectedPoolId(list[0]?.id || "");
      }
    } catch (e) {
      setError(String(e?.message || e || "Failed to load pools."));
    } finally {
      setLoadingPools(false);
    }
  }

  async function loadEntries(poolId) {
    const pid = String(poolId || "").trim(); // ✅ ensure no whitespace/empty ids
    if (!pid) {
      setEntries([]);
      return;
    }
    setLoadingEntries(true);
    setError("");
    try {
      const res = await fetch(`/api/recruiter/pools/${encodeURIComponent(pid)}/entries`, { method: "GET" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to load pool entries.");
      const list = Array.isArray(data?.entries) ? data.entries : [];
      setEntries(list);
    } catch (e) {
      setError(String(e?.message || e || "Failed to load pool entries."));
    } finally {
      setLoadingEntries(false);
    }
  }

  useEffect(() => {
    loadPools();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const pid = String(selectedPoolId || "").trim(); // ✅ keep consistent with loadEntries guard
    if (!pid) return;
    loadEntries(pid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPoolId]);

  const selectedPool = useMemo(
    () => pools.find((p) => p.id === selectedPoolId) || null,
    [pools, selectedPoolId]
  );

  const filteredEntries = useMemo(() => {
    const q = String(search || "").toLowerCase().trim();
    if (!q) return entries;
    return entries.filter((c) => {
      const hay = `${c.name || ""} ${c.headline || ""} ${c.fit || ""} ${c.source || ""} ${c.status || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [entries, search]);

  const selectedEntry = useMemo(() => {
    if (!filteredEntries.length) return null;
    const found = filteredEntries.find((c) => c.id === selectedEntryId);
    return found || filteredEntries[0];
  }, [filteredEntries, selectedEntryId]);

  // ✅ Fix the render-time setState landmine: keep selection stable via effect
  useEffect(() => {
    if (!selectedEntry) {
      if (selectedEntryId) setSelectedEntryId("");
      return;
    }
    if (selectedEntryId !== selectedEntry.id) setSelectedEntryId(selectedEntry.id);
  }, [selectedEntry, selectedEntryId]);

  async function createPool() {
    const name = String(newPoolName || "").trim();
    const purpose = String(newPoolPurpose || "").trim();
    const tags = String(newPoolTags || "")
      .split(",")
      .map((t) => String(t || "").trim())
      .filter(Boolean)
      .slice(0, 12);

    if (!name) {
      setError("Pool name is required.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/recruiter/pools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, purpose, tags }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to create pool.");

      // optimistic add
      const created = data?.pool || data;
      if (created?.id) {
        setPools((prev) => [created, ...prev]);
        setSelectedPoolId(created.id);
      } else {
        await loadPools();
      }

      setShowCreate(false);
      setNewPoolName("");
      setNewPoolPurpose("");
      setNewPoolTags("");
    } catch (e) {
      setError(String(e?.message || e || "Failed to create pool."));
    } finally {
      setSaving(false);
    }
  }

  async function removeFromPool(entryId) {
    if (!selectedPoolId || !entryId) return;

    setSaving(true);
    setError("");
    try {
      const res = await fetch(
        `/api/recruiter/pools/${encodeURIComponent(selectedPoolId)}/entries?entryId=${encodeURIComponent(entryId)}`,
        { method: "DELETE" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to remove from pool.");

      setEntries((prev) => prev.filter((x) => x.id !== entryId));
      setSelectedEntryId("");
      // refresh pool counts
      await loadPools();
    } catch (e) {
      setError(String(e?.message || e || "Failed to remove from pool."));
    } finally {
      setSaving(false);
    }
  }

  async function loadPickerCandidates(queryStr) {
    const q = String(queryStr || "").trim();
    setLoadingPicker(true);
    setError("");
    try {
      const url = `/api/recruiter/candidates?q=${encodeURIComponent(q)}`;
      const res = await fetch(url, { method: "GET" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to load candidates.");
      const list = Array.isArray(data?.candidates) ? data.candidates : [];
      setPickerResults(list);
    } catch (e) {
      setError(String(e?.message || e || "Failed to load candidates."));
      setPickerResults([]);
    } finally {
      setLoadingPicker(false);
    }
  }

  function openPicker() {
    if (!selectedPoolId) return;
    setShowPicker(true);
    setPickerQuery("");
    setPickerResults([]);
    setPickerSelectedIds([]);
    setPickerWhy("");
    setPickerFit("");
    setPickerStatus("Warm");
    // load initial (empty query returns latest 100)
    loadPickerCandidates("");
  }

  function togglePickerSelect(userId) {
    const id = String(userId || "").trim();
    if (!id) return;
    setPickerSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return [...prev, id].slice(0, 25);
    });
  }

  async function addSelectedToPool() {
    const poolId = String(selectedPoolId || "").trim();
    if (!poolId) return;

    const ids = Array.isArray(pickerSelectedIds) ? pickerSelectedIds : [];
    if (!ids.length) {
      setError("Select at least one candidate.");
      return;
    }

    const reasons = normalizeReasonsText(pickerWhy);
    const status = String(pickerStatus || "Warm").trim() || "Warm";
    const fit = String(pickerFit || "").trim();

    setSaving(true);
    setError("");
    try {
      // Build a quick map for candidate details (for snapshot fields)
      const byId = new Map();
      for (const c of Array.isArray(pickerResults) ? pickerResults : []) {
        if (c?.id) byId.set(String(c.id), c);
      }

      // Add sequentially (keeps API simple + readable logs)
      for (const candidateUserId of ids) {
        const c = byId.get(String(candidateUserId)) || null;

        const payload = {
          candidateUserId,
          name: String(c?.name || "").trim() || "Unnamed",
          headline: String(c?.title || c?.headline || "").trim(),
          location: String(c?.location || "").trim(),
          source: "Internal",
          status,
          fit: fit || String(c?.title || c?.headline || "").trim() || null,
          lastTouch: null,
          reasons: reasons.length ? reasons : [],
          notes: "",
        };

        const res = await fetch(`/api/recruiter/pools/${encodeURIComponent(poolId)}/entries`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.error || "Failed to add candidate to pool.");
        }
      }

      setShowPicker(false);
      setPickerSelectedIds([]);
      setPickerResults([]);
      setPickerQuery("");
      setPickerWhy("");
      setPickerFit("");
      setPickerStatus("Warm");

      await loadEntries(poolId);
      await loadPools();
    } catch (e) {
      setError(String(e?.message || e || "Failed to add candidates to pool."));
    } finally {
      setSaving(false);
    }
  }

  async function messageCandidate(entry) {
    const e = entry && typeof entry === "object" ? entry : null;
    const candidateUserId = String(e?.candidateUserId || "").trim();

    if (!candidateUserId) {
      setError("This is an external candidate. Messaging is available for internal candidates only (for now).");
      return;
    }

    setSaving(true);
    setError("");
    try {
      // best-effort: if your conversations API exists, use it; otherwise fail gracefully
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantUserIds: [candidateUserId], channel: "recruiter" }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || "Messaging endpoint not available yet.");
      }

      const conversationId = data?.conversation?.id || data?.id || data?.conversationId || null;
      if (!conversationId) {
        throw new Error("Conversation created but id not returned.");
      }

      router.push(`/recruiter/messaging?c=${encodeURIComponent(conversationId)}`);
    } catch (e2) {
      setError(String(e2?.message || e2 || "Failed to start conversation."));
    } finally {
      setSaving(false);
    }
  }

  function viewCandidate(entry) {
    const candidateUserId = String(entry?.candidateUserId || "").trim();
    if (!candidateUserId) {
      setError("This is an external candidate. View is available for internal candidates only (for now).");
      return;
    }
    // conservative: go to recruiter candidate center with an id hint (won’t break if ignored)
    router.push(`/recruiter/candidates?candidateId=${encodeURIComponent(candidateUserId)}`);
  }

  return (
    <RecruiterLayout title="ForgeTomorrow — Talent Pools" header={<HeaderBox />} right={<RightRail />} activeNav="candidate-center">
      <section style={panelStyle} aria-label="Talent Pools working surface">
        <SectionTitle
          title="Pools workspace"
          subtitle="Pick a pool, scan candidates, and take action without jumping between pages."
          right={
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <SecondaryButton onClick={() => setShowCreate(true)} disabled={saving}>
                New pool
              </SecondaryButton>
              <PrimaryButton onClick={openPicker} disabled={saving || !selectedPoolId}>
                Add candidates
              </PrimaryButton>
            </div>
          }
        />

        <div style={{ height: 12 }} />

        {error ? (
          <div
            style={{
              border: "1px solid rgba(255,112,67,0.35)",
              background: "rgba(255,112,67,0.08)",
              borderRadius: 12,
              padding: 12,
              color: "#B23C17",
              fontWeight: 800,
              fontSize: 13,
              lineHeight: 1.35,
              marginBottom: 12,
            }}
          >
            {error}
          </div>
        ) : null}

        {/* Create Pool (inline modal-ish) */}
        {showCreate ? (
          <div style={{ ...panelStyle, padding: 12, marginBottom: 12 }}>
            <div style={{ fontWeight: 900, color: "#37474F", marginBottom: 10 }}>Create a pool</div>

            <div style={{ display: "grid", gap: 10 }}>
              <input
                value={newPoolName}
                onChange={(e) => setNewPoolName(e.target.value)}
                placeholder="Pool name (e.g., Silver Medalists)"
                style={{
                  border: "1px solid rgba(38,50,56,0.18)",
                  borderRadius: 10,
                  padding: "10px 12px",
                  fontWeight: 700,
                  outline: "none",
                }}
              />

              <input
                value={newPoolPurpose}
                onChange={(e) => setNewPoolPurpose(e.target.value)}
                placeholder="Purpose (optional) - what is this pool for?"
                style={{
                  border: "1px solid rgba(38,50,56,0.18)",
                  borderRadius: 10,
                  padding: "10px 12px",
                  fontWeight: 700,
                  outline: "none",
                }}
              />

              <input
                value={newPoolTags}
                onChange={(e) => setNewPoolTags(e.target.value)}
                placeholder="Tags (optional, comma-separated) - e.g., cs, leadership"
                style={{
                  border: "1px solid rgba(38,50,56,0.18)",
                  borderRadius: 10,
                  padding: "10px 12px",
                  fontWeight: 700,
                  outline: "none",
                }}
              />

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <PrimaryButton onClick={createPool} disabled={saving}>
                  {saving ? "Saving..." : "Create pool"}
                </PrimaryButton>
                <SecondaryButton
                  onClick={() => {
                    setShowCreate(false);
                    setNewPoolName("");
                    setNewPoolPurpose("");
                    setNewPoolTags("");
                  }}
                  disabled={saving}
                >
                  Cancel
                </SecondaryButton>
              </div>
            </div>
          </div>
        ) : null}

        {/* Add Candidates Picker (inline modal-ish) */}
        {showPicker ? (
          <div style={{ ...panelStyle, padding: 12, marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 900, color: "#37474F" }}>
                  Add candidates to: <span style={{ color: "#263238" }}>{selectedPool?.name || "Pool"}</span>
                </div>
                <div style={{ color: "#607D8B", fontSize: 12, marginTop: 2, lineHeight: 1.35 }}>
                  This pulls LIVE candidates from <strong>User</strong> via <code>/api/recruiter/candidates</code>.
                </div>
              </div>
              <SecondaryButton
                onClick={() => {
                  setShowPicker(false);
                  setPickerQuery("");
                  setPickerResults([]);
                  setPickerSelectedIds([]);
                  setPickerWhy("");
                  setPickerFit("");
                  setPickerStatus("Warm");
                }}
                disabled={saving}
              >
                Close
              </SecondaryButton>
            </div>

            <div style={{ height: 10 }} />

            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 320px)", gap: 12, alignItems: "start" }}>
              {/* Results */}
              <div style={{ ...panelStyle, padding: 12 }}>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
                  <input
                    value={pickerQuery}
                    onChange={(e) => setPickerQuery(e.target.value)}
                    placeholder="Search candidates (name, headline, about)..."
                    aria-label="Search candidates"
                    style={{
                      flex: "1 1 260px",
                      border: "1px solid rgba(38,50,56,0.18)",
                      borderRadius: 10,
                      padding: "10px 12px",
                      fontWeight: 700,
                      outline: "none",
                    }}
                  />
                  <PrimaryButton onClick={() => loadPickerCandidates(pickerQuery)} disabled={loadingPicker || saving}>
                    {loadingPicker ? "Searching..." : "Search"}
                  </PrimaryButton>
                </div>

                <div style={{ height: 10 }} />

                <div style={{ color: "#607D8B", fontSize: 12, fontWeight: 800 }}>
                  {loadingPicker ? "Loading candidates..." : `${pickerResults.length} result${pickerResults.length === 1 ? "" : "s"}`}
                  {pickerSelectedIds.length ? ` - ${pickerSelectedIds.length} selected` : ""}
                </div>

                <div style={{ height: 10 }} />

                {loadingPicker ? (
                  <div style={{ color: "#607D8B", fontSize: 13, lineHeight: 1.45 }}>Loading...</div>
                ) : pickerResults.length === 0 ? (
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
                    No candidates found yet. Try a broader search, or leave blank and click <strong>Search</strong> to pull newest.
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 8, maxHeight: 340, overflow: "auto", paddingRight: 4 }}>
                    {pickerResults.map((c) => {
                      const id = String(c?.id || "").trim();
                      const selected = pickerSelectedIds.includes(id);
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => togglePickerSelect(id)}
                          style={{
                            textAlign: "left",
                            border: selected ? `1px solid rgba(255,112,67,0.55)` : "1px solid rgba(38,50,56,0.12)",
                            background: selected ? "rgba(255,112,67,0.08)" : "white",
                            borderRadius: 12,
                            padding: 10,
                            cursor: "pointer",
                            display: "grid",
                            gap: 6,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                            <div style={{ fontWeight: 900, color: "#263238", fontSize: 13 }}>{c?.name || "Unnamed"}</div>
                            {selected ? <Pill tone="hot">Selected</Pill> : <Pill tone="neutral">Pick</Pill>}
                          </div>
                          <div style={{ color: "#607D8B", fontSize: 12, lineHeight: 1.35 }}>
                            {String(c?.title || c?.headline || "").trim()}
                          </div>
                          <div style={{ color: "#90A4AE", fontSize: 11, fontWeight: 800 }}>
                            {String(c?.location || "").trim()}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Settings */}
              <div style={{ ...panelStyle, padding: 12 }}>
                <div style={{ fontWeight: 900, color: "#37474F", marginBottom: 10 }}>Snapshot for this add</div>

                <label style={{ display: "block", color: "#607D8B", fontSize: 12, fontWeight: 900, marginBottom: 6 }}>
                  Status (Hot / Warm / Hold)
                </label>
                <select
                  value={pickerStatus}
                  onChange={(e) => setPickerStatus(e.target.value)}
                  style={{
                    width: "100%",
                    border: "1px solid rgba(38,50,56,0.18)",
                    borderRadius: 10,
                    padding: "10px 12px",
                    fontWeight: 800,
                    outline: "none",
                    background: "white",
                    marginBottom: 10,
                  }}
                >
                  <option value="Hot">Hot</option>
                  <option value="Warm">Warm</option>
                  <option value="Hold">Hold</option>
                </select>

                <label style={{ display: "block", color: "#607D8B", fontSize: 12, fontWeight: 900, marginBottom: 6 }}>
                  Fit label (optional)
                </label>
                <input
                  value={pickerFit}
                  onChange={(e) => setPickerFit(e.target.value)}
                  placeholder="e.g., CSM / AM, Support Ops"
                  style={{
                    width: "100%",
                    border: "1px solid rgba(38,50,56,0.18)",
                    borderRadius: 10,
                    padding: "10px 12px",
                    fontWeight: 700,
                    outline: "none",
                    marginBottom: 10,
                  }}
                />

                <label style={{ display: "block", color: "#607D8B", fontSize: 12, fontWeight: 900, marginBottom: 6 }}>
                  Why saved (bullets, one per line)
                </label>
                <textarea
                  value={pickerWhy}
                  onChange={(e) => setPickerWhy(e.target.value)}
                  placeholder={"Example:\nStrong leadership signal\nRelevant domain experience\nClear operational ownership"}
                  rows={6}
                  style={{
                    width: "100%",
                    border: "1px solid rgba(38,50,56,0.18)",
                    borderRadius: 10,
                    padding: "10px 12px",
                    fontWeight: 700,
                    outline: "none",
                    resize: "vertical",
                    marginBottom: 12,
                  }}
                />

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <PrimaryButton onClick={addSelectedToPool} disabled={saving || !pickerSelectedIds.length}>
                    {saving ? "Saving..." : `Add (${pickerSelectedIds.length || 0})`}
                  </PrimaryButton>
                  <SecondaryButton
                    onClick={() => {
                      setPickerSelectedIds([]);
                    }}
                    disabled={saving || !pickerSelectedIds.length}
                  >
                    Clear
                  </SecondaryButton>
                </div>

                <div style={{ color: "#90A4AE", fontSize: 11, lineHeight: 1.35, marginTop: 10 }}>
                  Adds are written to <strong>TalentPoolEntry</strong> (DB-first). No localStorage.
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* 3-column surface: Pools | Candidates | Candidate detail */}
        <div
          style={{
            display: "grid",
            // ✅ 100% zoom safety: allow columns to shrink instead of clipping
            gridTemplateColumns: "minmax(240px, 280px) minmax(0, 1fr) minmax(0, 360px)",
            gap: 12,
            alignItems: "start",
          }}
        >
          {/* Left: Pool list */}
          <div style={{ ...panelStyle, padding: 12 }}>
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ fontWeight: 900, color: "#37474F" }}>Your pools</div>

              {loadingPools ? (
                <div style={{ color: "#607D8B", fontSize: 13, lineHeight: 1.4 }}>Loading pools...</div>
              ) : pools.length === 0 ? (
                <div style={{ color: "#607D8B", fontSize: 13, lineHeight: 1.4 }}>
                  No pools yet. Click <strong>New pool</strong> to create one.
                </div>
              ) : (
                <div style={{ display: "grid", gap: 8 }}>
                  {pools.map((p) => {
                    const active = p.id === selectedPoolId;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedPoolId(p.id);
                          setSearch("");
                          setSelectedEntryId("");
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
                            {Number.isFinite(p.count) ? p.count : 0}
                          </span>
                        </div>

                        {p.purpose ? (
                          <div style={{ color: "#607D8B", fontSize: 12, marginTop: 4, lineHeight: 1.35 }}>
                            {p.purpose}
                          </div>
                        ) : null}

                        {Array.isArray(p.tags) && p.tags.length ? (
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                            {p.tags.map((t) => (
                              <Pill key={`${p.id}-${t}`} tone="neutral">
                                {t}
                              </Pill>
                            ))}
                          </div>
                        ) : null}

                        <div style={{ color: "#90A4AE", fontSize: 11, marginTop: 8 }}>
                          Updated: {p.updatedAt ? fmtUpdatedAt(p.updatedAt) : ""}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <div style={{ marginTop: 4, color: "#607D8B", fontSize: 12, lineHeight: 1.35 }}>
                <strong>ForgeTomorrow advantage:</strong> every saved candidate carries a “why saved” snapshot so you keep
                signal, not just names.
              </div>
            </div>
          </div>

          {/* Middle: Candidate list */}
          <div style={{ ...panelStyle, padding: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 900, color: "#37474F" }}>{selectedPool ? selectedPool.name : "Candidates"}</div>
                <div style={{ color: "#607D8B", fontSize: 12, marginTop: 2 }}>
                  {loadingEntries ? "Loading..." : `${filteredEntries.length} candidate${filteredEntries.length === 1 ? "" : "s"} shown`}
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

            {loadingEntries ? (
              <div style={{ color: "#607D8B", fontSize: 13, lineHeight: 1.4 }}>Loading candidates...</div>
            ) : filteredEntries.length === 0 ? (
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
                No candidates yet. Click <strong>Add candidates</strong> to pull from Candidate Center and save here.
              </div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {filteredEntries.map((c) => {
                  const active = selectedEntry && selectedEntry.id === c.id;

                  const statusTone =
                    String(c.status || "").toLowerCase() === "hot"
                      ? "hot"
                      : String(c.status || "").toLowerCase() === "warm"
                      ? "warm"
                      : "hold";

                  const sourceTone = String(c.source || "").toLowerCase() === "internal" ? "internal" : "external";

                  const reasons = Array.isArray(c.reasons) ? c.reasons : [];

                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedEntryId(c.id)}
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
                          <Pill tone={sourceTone}>{c.source || "External"}</Pill>
                          <Pill tone={statusTone}>{c.status || "Warm"}</Pill>
                        </div>
                      </div>

                      <div style={{ color: "#607D8B", fontSize: 12, lineHeight: 1.35 }}>{c.headline || ""}</div>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                        <div style={{ color: "#455A64", fontSize: 12, fontWeight: 800 }}>
                          Fit: <span style={{ color: "#37474F" }}>{c.fit || "-"}</span>
                        </div>
                        <div style={{ color: "#90A4AE", fontSize: 11, fontWeight: 800 }}>
                          Last touch: {fmtShortDate(c.lastTouch)}
                        </div>
                      </div>

                      <div style={{ display: "grid", gap: 4, marginTop: 6 }}>
                        <div style={{ color: "#37474F", fontSize: 12, fontWeight: 900 }}>Why saved</div>
                        {reasons.length ? (
                          <ul style={{ margin: 0, paddingLeft: 18, color: "#546E7A", fontSize: 12, lineHeight: 1.35 }}>
                            {reasons.slice(0, 2).map((r, idx) => (
                              <li key={`${c.id}-r-${idx}`}>{r}</li>
                            ))}
                          </ul>
                        ) : (
                          <div style={{ color: "#90A4AE", fontSize: 12, lineHeight: 1.35 }}>No snapshot yet.</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Candidate detail panel */}
          <div style={{ ...panelStyle, padding: 12 }}>
            {!selectedEntry ? (
              <div style={{ color: "#607D8B", fontSize: 13, lineHeight: 1.45 }}>Select a candidate to view details.</div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 900, color: "#263238", fontSize: 16 }}>{selectedEntry.name}</div>
                    <div style={{ color: "#607D8B", fontSize: 12, marginTop: 4, lineHeight: 1.35 }}>
                      {selectedEntry.headline || ""}
                    </div>
                    {selectedEntry.location ? (
                      <div style={{ color: "#90A4AE", fontSize: 12, marginTop: 6, fontWeight: 800 }}>
                        {selectedEntry.location}
                      </div>
                    ) : null}
                  </div>

                  <div style={{ display: "grid", gap: 8, justifyItems: "end" }}>
                    <Pill tone={String(selectedEntry.source || "").toLowerCase() === "internal" ? "internal" : "external"}>
                      {selectedEntry.source || "External"}
                    </Pill>
                    <Pill
                      tone={
                        String(selectedEntry.status || "").toLowerCase() === "hot"
                          ? "hot"
                          : String(selectedEntry.status || "").toLowerCase() === "warm"
                          ? "warm"
                          : "hold"
                      }
                    >
                      {selectedEntry.status || "Warm"}
                    </Pill>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Pill tone="neutral">Fit: {selectedEntry.fit || "-"}</Pill>
                  <Pill tone="neutral">Last touch: {fmtShortDate(selectedEntry.lastTouch)}</Pill>
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

                  {Array.isArray(selectedEntry.reasons) && selectedEntry.reasons.length ? (
                    <ul style={{ margin: 0, paddingLeft: 18, color: "#546E7A", fontSize: 12, lineHeight: 1.45 }}>
                      {selectedEntry.reasons.map((r, idx) => (
                        <li key={`${selectedEntry.id}-rr-${idx}`}>{r}</li>
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
                    {selectedEntry.notes || "No notes."}
                  </div>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
                    <PrimaryButton onClick={() => messageCandidate(selectedEntry)} disabled={saving}>
                      Message
                    </PrimaryButton>
                    <SecondaryButton
                      onClick={() => viewCandidate(selectedEntry)}
                      disabled={saving || !String(selectedEntry?.candidateUserId || "").trim()}
                    >
                      View candidate
                    </SecondaryButton>
                    <TextButton onClick={() => removeFromPool(selectedEntry.id)} disabled={saving}>
                      Remove from pool
                    </TextButton>
                  </div>

                  <div style={{ color: "#90A4AE", fontSize: 11, lineHeight: 1.35, marginTop: 4 }}>
                    Pools are a working surface: scan, decide, act. No tab-jumping.
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
