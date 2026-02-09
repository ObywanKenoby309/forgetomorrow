// components/recruiter/pools/AddCandidatesPicker.js
import React from "react";
import { Pill, PrimaryButton, SecondaryButton } from "./Pills";

export default function AddCandidatesPicker({
  panelStyle,
  selectedPool,
  saving,
  loadingPicker,
  pickerQuery,
  setPickerQuery,
  pickerResults,
  pickerSelectedIds,
  pickerStatus,
  setPickerStatus,
  pickerFit,
  setPickerFit,
  pickerWhy,
  setPickerWhy,

  onClose,
  onSearch,
  onToggleSelect,
  onAddSelected,
  onClearSelected,
}) {
  return (
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
        <SecondaryButton onClick={onClose} disabled={saving}>
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
            <PrimaryButton onClick={onSearch} disabled={loadingPicker || saving}>
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
                    onClick={() => onToggleSelect(id)}
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
                    <div style={{ color: "#90A4AE", fontSize: 11, fontWeight: 800 }}>{String(c?.location || "").trim()}</div>
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
            <PrimaryButton onClick={onAddSelected} disabled={saving || !pickerSelectedIds.length}>
              {saving ? "Saving..." : `Add (${pickerSelectedIds.length || 0})`}
            </PrimaryButton>
            <SecondaryButton onClick={onClearSelected} disabled={saving || !pickerSelectedIds.length}>
              Clear
            </SecondaryButton>
          </div>

          <div style={{ color: "#90A4AE", fontSize: 11, lineHeight: 1.35, marginTop: 10 }}>
            Adds are written to <strong>TalentPoolEntry</strong> (DB-first). No localStorage.
          </div>
        </div>
      </div>
    </div>
  );
}
