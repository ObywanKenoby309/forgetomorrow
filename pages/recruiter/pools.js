// pages/recruiter/pools.js
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import RecruiterLayout from "@/components/layouts/RecruiterLayout";

// component imports
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

  const [showCreate, setShowCreate] = useState(false);
  const [newPoolName, setNewPoolName] = useState("");
  const [newPoolPurpose, setNewPoolPurpose] = useState("");
  const [newPoolTags, setNewPoolTags] = useState("");

  const [showPicker, setShowPicker] = useState(false);
  const [loadingPicker, setLoadingPicker] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [pickerResults, setPickerResults] = useState([]);
  const [pickerSelectedIds, setPickerSelectedIds] = useState([]);
  const [pickerWhy, setPickerWhy] = useState("");
  const [pickerFit, setPickerFit] = useState("");
  const [pickerStatus, setPickerStatus] = useState("Warm");

  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [modalEntry, setModalEntry] = useState(null);

  async function loadPools() {
    setLoadingPools(true);
    setError("");
    try {
      const res = await fetch("/api/recruiter/pools");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load pools.");
      setPools(data.pools || []);
      if (!selectedPoolId && data.pools?.[0]?.id) setSelectedPoolId(data.pools[0].id);
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoadingPools(false);
    }
  }

  async function loadEntries(poolId) {
    if (!poolId) return;
    setLoadingEntries(true);
    try {
      const res = await fetch(`/api/recruiter/pools/${poolId}/entries`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load entries.");
      setEntries(data.entries || []);
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoadingEntries(false);
    }
  }

  useEffect(() => {
    loadPools();
  }, []);

  useEffect(() => {
    if (selectedPoolId) loadEntries(selectedPoolId);
  }, [selectedPoolId]);

  const selectedPool = useMemo(
    () => pools.find((p) => p.id === selectedPoolId) || null,
    [pools, selectedPoolId]
  );

  const filteredEntries = useMemo(() => {
    const q = search.toLowerCase();
    return entries.filter((e) =>
      `${e.name} ${e.headline} ${e.fit}`.toLowerCase().includes(q)
    );
  }, [entries, search]);

  const selectedEntry = useMemo(() => {
    if (!filteredEntries.length) return null;
    return filteredEntries.find((e) => e.id === selectedEntryId) || filteredEntries[0];
  }, [filteredEntries, selectedEntryId]);

  useEffect(() => {
    if (selectedEntry && selectedEntry.id !== selectedEntryId) {
      setSelectedEntryId(selectedEntry.id);
    }
  }, [selectedEntry, selectedEntryId]);

  async function removeFromPool(entryId) {
    setSaving(true);
    try {
      await fetch(
        `/api/recruiter/pools/${selectedPoolId}/entries?entryId=${entryId}`,
        { method: "DELETE" }
      );
      await loadEntries(selectedPoolId);
    } finally {
      setSaving(false);
    }
  }

  function messageCandidate(entry) {
    if (!entry?.candidateUserId) {
      setError("Messaging is available for internal candidates only.");
      return;
    }
    router.push(`/recruiter/messaging?candidateUserId=${entry.candidateUserId}`);
  }

  function viewCandidate(entry) {
    setModalEntry(entry);
    setShowCandidateModal(true);
  }

  return (
    <RecruiterLayout title="ForgeTomorrow — Talent Pools" header={<HeaderBox />} right={<RightRail />} activeNav="candidate-center">
      <section style={panelStyle}>
        <SectionTitle
          title="Pools workspace"
          subtitle="Pick a pool, scan candidates, and take action without jumping between pages."
        />

        <CandidateDetailModal
          open={showCandidateModal}
          entry={modalEntry}
          saving={saving}
          onClose={() => setShowCandidateModal(false)}
          onMessage={() => messageCandidate(modalEntry)}
          onRemove={() => removeFromPool(modalEntry.id)}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(240px,280px) minmax(0,1fr) minmax(0,360px)",
            gap: 12,
          }}
        >
          <PoolsList
            panelStyle={panelStyle}
            loadingPools={loadingPools}
            pools={pools}
            selectedPoolId={selectedPoolId}
            onSelectPool={(id) => {
              setSelectedPoolId(id);
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
            onSelectEntry={setSelectedEntryId}
          />

          {/* RIGHT COLUMN — DETAILS */}
          <div style={{ ...panelStyle, padding: 12 }}>
            {!selectedEntry ? (
              <div style={{ color: "#607D8B" }}>Select a candidate</div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ fontWeight: 900, fontSize: 18 }}>{selectedEntry.name}</div>
                <div style={{ color: "#607D8B", fontSize: 13 }}>{selectedEntry.headline}</div>

                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <Pill tone="neutral">Fit: {selectedEntry.fit || "-"}</Pill>
                  <Pill tone="neutral">Last touch: {fmtShortDate(selectedEntry.lastTouch)}</Pill>
                </div>

                {Array.isArray(selectedEntry.reasons) && selectedEntry.reasons.length ? (
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 12 }}>Why saved</div>
                    <ul style={{ paddingLeft: 16, fontSize: 12 }}>
                      {selectedEntry.reasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <PrimaryButton onClick={() => messageCandidate(selectedEntry)} disabled={saving}>
                    Message
                  </PrimaryButton>
                  <SecondaryButton onClick={() => viewCandidate(selectedEntry)} disabled={saving}>
                    View
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
