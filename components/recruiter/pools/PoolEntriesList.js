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
          width: "100%",
          maxWidth: "100%",
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

        <div
          style={{
            flex: "1 1 240px",
            minWidth: 0,
            width: "100%",
            maxWidth: 380,
            overflow: "hidden",
          }}
        >
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
          No candidates yet. Use <strong>Add candidates</strong> to pull from Candidate Center.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {filteredEntries.map((c) => {
            const active = selectedEntry && selectedEntry.id === c.id;

            // NOTE: We intentionally DO NOT render pills in Column 2.
            // Column 2 must prioritize full candidate name visibility.

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
                  display: "block",
                }}
              >
                <div
                  style={{
                    fontWeight: 900,
                    color: "#263238",
                    fontSize: 13,

                    // ✅ CHANGED: do NOT kill the name
                    whiteSpace: "normal",
                    overflow: "visible",
                    textOverflow: "clip",
                    wordBreak: "break-word",
                    lineHeight: 1.25,
                  }}
                >
                  {c.name}
                </div>

                {/* ✅ OPTIONAL (kept off by default): if you ever want a tiny hint line
                    under the name without pills, uncomment this.
                    It will still not compete with the name. */}
                {/*
                <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <Pill tone={String(c.source || "").toLowerCase() === "internal" ? "internal" : "external"}>
                    {c.source || "External"}
                  </Pill>
                  <Pill
                    tone={
                      String(c.status || "").toLowerCase() === "hot"
                        ? "hot"
                        : String(c.status || "").toLowerCase() === "warm"
                        ? "warm"
                        : "hold"
                    }
                  >
                    {c.status || "Warm"}
                  </Pill>
                </div>
                */}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
