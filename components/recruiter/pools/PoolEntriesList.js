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
    <div style={{ ...panelStyle, padding: 12, minWidth: 0, overflow: "hidden" }}>
      {/* Header */}
      <div
        style={{
          display: "grid",
          gap: 8,
          // ✅ identity-first: pool name always gets its own full line
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontWeight: 900,
              color: "#37474F",
              // ✅ do NOT let flex/grid layout ever force horizontal overflow
              minWidth: 0,
              maxWidth: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={selectedPool ? selectedPool.name : "Candidates"}
          >
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

        {/* ✅ Search: subordinate + constrained, never pushes outside column */}
        <div style={{ minWidth: 0, width: "100%" }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidates..."
            aria-label="Search candidates"
            style={{
              width: "100%",
              maxWidth: "100%",
              minWidth: 0,
              boxSizing: "border-box",

              border: "1px solid rgba(38,50,56,0.18)",
              borderRadius: 10,
              padding: "10px 12px",
              fontWeight: 700,
              outline: "none",
            }}
          />
        </div>
      </div>

      <div style={{ height: 12 }} />

      {loadingEntries ? (
        <div style={{ color: "#607D8B", fontSize: 13 }}>
          Loading candidates...
        </div>
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
          No candidates yet. Use <strong>Add candidates</strong> to pull from
          Candidate Center.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 8, minWidth: 0 }}>
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

                  // ✅ allow name + pills to behave inside narrow widths
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  minWidth: 0,
                  maxWidth: "100%",
                  overflow: "hidden",
                }}
              >
                {/* Name */}
                <div
                  style={{
                    fontWeight: 900,
                    color: "#263238",
                    fontSize: 13,
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    flex: "1 1 auto",
                  }}
                  title={c.name}
                >
                  {c.name}
                </div>

                {/* Pills (stack under each other when the column is narrow) */}
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    justifyContent: "flex-end",
                    flex: "0 0 auto",

                    // ✅ when middle column collapses, pills should become a vertical stack,
                    // instead of forcing width or wrapping weirdly across the card
                    flexWrap: "wrap",
                    maxWidth: 140,
                    minWidth: 0,
                  }}
                >
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
