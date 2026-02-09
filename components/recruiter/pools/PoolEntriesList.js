// components/recruiter/pools/PoolEntriesList.js
import React from "react";
import { Pill } from "./Pills";

export default function PoolEntriesList({
  panelStyle,
  selectedPool,
  loadingEntries,
  filteredEntries,
  search,
  setSearch,
  selectedEntry,
  onSelectEntry,
}) {
  return (
    <div style={{ ...panelStyle, padding: 12 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 900, color: "#37474F" }}>
            {selectedPool ? selectedPool.name : "Candidates"}
          </div>
          <div style={{ color: "#607D8B", fontSize: 12, marginTop: 2 }}>
            {loadingEntries
              ? "Loading..."
              : `${filteredEntries.length} candidate${
                  filteredEntries.length === 1 ? "" : "s"
                } shown`}
          </div>
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search candidates..."
          aria-label="Search candidates"
          style={{
            flex: "1 1 240px",
            maxWidth: 380,
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
        <div style={{ color: "#607D8B", fontSize: 13 }}>Loading candidates...</div>
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
          No candidates yet. Use <strong>Add candidates</strong> to pull from Candidate Center.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {filteredEntries.map((c) => {
            const active = selectedEntry && selectedEntry.id === c.id;

            const statusTone =
              String(c.status || "").toLowerCase() === "hot"
                ? "hot"
                : String(c.status || "").toLowerCase() === "warm"
                ? "warm"
                : "hold";

            const sourceTone =
              String(c.source || "").toLowerCase() === "internal"
                ? "internal"
                : "external";

            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelectEntry(c.id)}
                style={{
                  textAlign: "left",
                  border: active
                    ? "1px solid rgba(255,112,67,0.45)"
                    : "1px solid rgba(38,50,56,0.12)",
                  background: active ? "rgba(255,112,67,0.06)" : "white",
                  borderRadius: 12,
                  padding: "10px 12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    fontWeight: 900,
                    color: "#263238",
                    fontSize: 13,
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {c.name}
                </div>

                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <Pill tone={sourceTone}>{c.source || "External"}</Pill>
                  <Pill tone={statusTone}>{c.status || "Warm"}</Pill>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
