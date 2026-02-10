// pages/recruiter/pools.js
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import RecruiterLayout from "@/components/layouts/RecruiterLayout";

// NEW component imports (additive)
import HeaderBox from "@/components/recruiter/pools/HeaderBox";
import RightRail from "@/components/recruiter/pools/RightRail";
import SectionTitle from "@/components/recruiter/pools/SectionTitle";
import PoolsList from "@/components/recruiter/pools/PoolsList";
import PoolEntriesList from "@/components/recruiter/pools/PoolEntriesList";
import CreatePoolPanel from "@/components/recruiter/pools/CreatePoolPanel";
import AddCandidatesPicker from "@/components/recruiter/pools/AddCandidatesPicker";
import CandidateDetailModal from "@/components/recruiter/pools/CandidateDetailModal";
import { PrimaryButton, SecondaryButton, TextButton, Pill } from "@/components/recruiter/pools/Pills";
import { normalizeReasonsText, fmtShortDate } from "@/components/recruiter/pools/utils";

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

  // Create Pool
  const [showCreate, setShowCreate] = useState(false);
  const [newPoolName, setNewPoolName] = useState("");
  const [newPoolPurpose, setNewPoolPurpose] = useState("");
  const [newPoolTags, setNewPoolTags] = useState("");

  // Add Candidates picker (DB-backed)
  const [showPicker, setShowPicker] = useState(false);
  const [loadingPicker, setLoadingPicker] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [pickerResults, setPickerResults] = useState([]);
  const [pickerSelectedIds, setPickerSelectedIds] = useState([]);
  const [pickerWhy, setPickerWhy] = useState("");
  const [pickerFit, setPickerFit] = useState("");
  const [pickerStatus, setPickerStatus] = useState("Warm");

  // ✅ NEW (bulk-applied snapshot fields)
  const [pickerLastRoleConsidered, setPickerLastRoleConsidered] = useState("");
  const [pickerNotes, setPickerNotes] = useState("");

  // Candidate modal (no navigation for View)
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [modalEntry, setModalEntry] = useState(null);

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
    const pid = String(poolId || "").trim();
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
    const pid = String(selectedPoolId || "").trim();
    if (!pid) return;
    loadEntries(pid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPoolId]);

  const selectedPool = useMemo(() => pools.find((p) => p.id === selectedPoolId) || null, [pools, selectedPoolId]);

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
    setPickerLastRoleConsidered("");
    setPickerNotes("");
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

    // ✅ NEW (bulk-applied)
    const lastRoleConsidered = String(pickerLastRoleConsidered || "").trim();
    const notes = String(pickerNotes || "").trim();

    setSaving(true);
    setError("");
    try {
      const byId = new Map();
      for (const c of Array.isArray(pickerResults) ? pickerResults : []) {
        if (c?.id) byId.set(String(c.id), c);
      }

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

          // ✅ Do NOT send lastTouch; “Last updated” is updatedAt

          reasons: reasons.length ? reasons : [],
          notes: notes || "",
          lastRoleConsidered: lastRoleConsidered || "",
        };

        const res = await fetch(`/api/recruiter/pools/${encodeURIComponent(poolId)}/entries`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Failed to add candidate to pool.");
      }

      setShowPicker(false);
      setPickerSelectedIds([]);
      setPickerResults([]);
      setPickerQuery("");
      setPickerWhy("");
      setPickerFit("");
      setPickerStatus("Warm");
      setPickerLastRoleConsidered("");
      setPickerNotes("");

      await loadEntries(poolId);
      await loadPools();
    } catch (e) {
      setError(String(e?.message || e || "Failed to add candidates to pool."));
    } finally {
      setSaving(false);
    }
  }

  // Message: open recruiter messaging, try to auto-open existing thread by otherUserId
  async function messageCandidate(entry) {
    const e = entry && typeof entry === "object" ? entry : null;
    const candidateUserId = String(e?.candidateUserId || "").trim();

    if (!candidateUserId) {
      setError("This is an external candidate. Messaging is available for internal candidates only (for now).");
      return;
    }

    router.push(`/recruiter/messaging?candidateUserId=${encodeURIComponent(candidateUserId)}`);
  }

  // View: open modal, do not navigate away
  function viewCandidate(entry) {
    const e = entry && typeof entry === "object" ? entry : null;
    setModalEntry(e);
    setShowCandidateModal(true);
  }

  // accept entry (preferred), fallback to modalEntry
  function openFullProfileFromModal(entryArg) {
    const e = entryArg && typeof entryArg === "object" ? entryArg : modalEntry;
    const candidateUserId = String(e?.candidateUserId || "").trim();

    if (!candidateUserId) {
      setError("This pool entry is missing an internal candidate ID. Cannot open Candidate Center.");
      return;
    }

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

        {showCreate ? (
          <CreatePoolPanel
            panelStyle={panelStyle}
            saving={saving}
            newPoolName={newPoolName}
            setNewPoolName={setNewPoolName}
            newPoolPurpose={newPoolPurpose}
            setNewPoolPurpose={setNewPoolPurpose}
            newPoolTags={newPoolTags}
            setNewPoolTags={setNewPoolTags}
            onCreate={createPool}
            onCancel={() => {
              setShowCreate(false);
              setNewPoolName("");
              setNewPoolPurpose("");
              setNewPoolTags("");
            }}
          />
        ) : null}

        {showPicker ? (
          <AddCandidatesPicker
            panelStyle={panelStyle}
            selectedPool={selectedPool}
            saving={saving}
            loadingPicker={loadingPicker}
            pickerQuery={pickerQuery}
            setPickerQuery={setPickerQuery}
            pickerResults={pickerResults}
            pickerSelectedIds={pickerSelectedIds}
            pickerStatus={pickerStatus}
            setPickerStatus={setPickerStatus}
            pickerFit={pickerFit}
            setPickerFit={setPickerFit}
            pickerWhy={pickerWhy}
            setPickerWhy={setPickerWhy}
            pickerLastRoleConsidered={pickerLastRoleConsidered}
            setPickerLastRoleConsidered={setPickerLastRoleConsidered}
            pickerNotes={pickerNotes}
            setPickerNotes={setPickerNotes}
            onClose={() => {
              setShowPicker(false);
              setPickerQuery("");
              setPickerResults([]);
              setPickerSelectedIds([]);
              setPickerWhy("");
              setPickerFit("");
              setPickerStatus("Warm");
              setPickerLastRoleConsidered("");
              setPickerNotes("");
            }}
            onSearch={() => loadPickerCandidates(pickerQuery)}
            onToggleSelect={togglePickerSelect}
            onAddSelected={addSelectedToPool}
            onClearSelected={() => setPickerSelectedIds([])}
          />
        ) : null}

        <CandidateDetailModal
          open={showCandidateModal}
          onClose={() => {
            setShowCandidateModal(false);
            setModalEntry(null);
          }}
          entry={modalEntry}
          saving={saving}
          onMessage={() => messageCandidate(modalEntry)}
          onRemove={() => {
            const id = String(modalEntry?.id || "").trim();
            if (!id) return;
            removeFromPool(id);
            setShowCandidateModal(false);
            setModalEntry(null);
          }}
          onOpenFullProfile={(e) => openFullProfileFromModal(e)}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(240px, 280px) minmax(0, 1fr) minmax(0, 360px)",
            gap: 12,
            alignItems: "start",
          }}
        >
          <PoolsList
            panelStyle={panelStyle}
            loadingPools={loadingPools}
            pools={pools}
            selectedPoolId={selectedPoolId}
            onSelectPool={(id) => {
              setSelectedPoolId(id);
              setSearch("");
              setSelectedEntryId("");
            }}
          />

          <PoolEntriesList
            panelStyle={panelStyle}
            selectedPool={selectedPool}
            loadingEntries={loadingEntries}
            filteredEntries={filteredEntries}
            search={search}
            setSearch={setSearch}
            selectedEntry={selectedEntry}
            onSelectEntry={(id) => setSelectedEntryId(id)}
          />

          {/* Right: At-a-glance decision surface (pool-context) */}
          <div style={{ ...panelStyle, padding: 12 }}>
            {!selectedEntry ? (
              <div style={{ color: "#607D8B", fontSize: 13, lineHeight: 1.45 }}>Select a candidate to take action.</div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ fontWeight: 900, color: "#FF7043", fontSize: 14 }}>At a glance...</div>

                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 900, color: "#263238", fontSize: 16 }}>{selectedEntry.name}</div>
                    {selectedEntry.headline ? (
                      <div style={{ color: "#607D8B", fontSize: 12, marginTop: 4, lineHeight: 1.35 }}>
                        {selectedEntry.headline}
                      </div>
                    ) : null}
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
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

                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ color: "#37474F", fontSize: 12, fontWeight: 900 }}>
                    Fit: <span style={{ color: "#607D8B", fontWeight: 800 }}>{selectedEntry.fit || "-"}</span>
                  </div>
                  <div style={{ color: "#90A4AE", fontSize: 12, fontWeight: 900 }}>
                    Last updated: <span style={{ fontWeight: 800 }}>{fmtShortDate(selectedEntry.lastTouch)}</span>
                  </div>
                </div>

                {selectedEntry.lastRoleConsidered ? (
                  <div style={{ color: "#37474F", fontSize: 12, fontWeight: 900 }}>
                    Last role considered:{" "}
                    <span style={{ color: "#607D8B", fontWeight: 800 }}>{selectedEntry.lastRoleConsidered}</span>
                  </div>
                ) : null}

                <div style={{ display: "grid", gap: 6 }}>
                  <div style={{ fontWeight: 900, color: "#37474F", fontSize: 12 }}>Why saved</div>
                  {Array.isArray(selectedEntry.reasons) && selectedEntry.reasons.length ? (
                    <div style={{ color: "#546E7A", fontSize: 12, lineHeight: 1.45 }}>{selectedEntry.reasons[0]}</div>
                  ) : (
                    <div style={{ color: "#90A4AE", fontSize: 12, lineHeight: 1.35 }}>No snapshot yet.</div>
                  )}
                </div>

                <div style={{ display: "grid", gap: 6 }}>
                  <div style={{ fontWeight: 900, color: "#37474F", fontSize: 12 }}>Notes</div>
                  <div
                    style={{
                      border: "1px solid rgba(38,50,56,0.14)",
                      borderRadius: 12,
                      padding: 10,
                      minHeight: 92,
                      color: "#455A64",
                      fontSize: 12,
                      lineHeight: 1.45,
                      background: "rgba(96,125,139,0.06)",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {selectedEntry.notes || "No notes."}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
                  <PrimaryButton onClick={() => messageCandidate(selectedEntry)} disabled={saving}>
                    Message
                  </PrimaryButton>

                  {/* THIS IS THE BUTTON YOU WANT TO WORK */}
                  <SecondaryButton onClick={() => openFullProfileFromModal(selectedEntry)} disabled={saving}>
                    View Full Details
                  </SecondaryButton>

                  <TextButton onClick={() => removeFromPool(selectedEntry.id)} disabled={saving}>
                    Remove
                  </TextButton>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </RecruiterLayout>
  );
}
