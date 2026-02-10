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
  compact = false,
}) {
  return (
    <div
      style={{
        ...panelStyle,
        padding: 12,
        width: "100%",
        maxWidth: "100%",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: compact ? "flex-start" : "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "nowrap",
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <div style={{ minWidth: 0, overflow: "hidden" }}>
          <div
            style={{
              fontWeight: 900,
              color: "#37474F",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={selectedPool ? selectedPool.name : "Candidates"}
          >
            {selectedPool ? selectedPool.name : "Candidates"}
          </div>

          {!compact ? (
            <div style={{ color: "#607D8B", fontSize: 12, marginTop: 2 }}>
              {loadingEntries
                ? "Loading..."
                : `${filteredEntries.length} candidate${
                    filteredEntries.length === 1 ? "" : "s"
                  } shown`}
            </div>
          ) : null}
        </div>

        <div
          style={{
            flex: "1 1 auto",
            minWidth: compact ? 90 : 240,
            maxWidth: compact ? 120 : 380,
            overflow: "hidden",
          }}
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={compact ? "Search" : "Search candidates..."}
            aria-label="Search candidates"
            style={{
              width: "100%",
              maxWidth: "100%",
              minWidth: 0,
              boxSizing: "border-box",
              border: "1px solid rgba(38,50,56,0.18)",
              borderRadius: 10,
              padding: compact ? "8px 10px" : "10px 12px",
              fontWeight: 700,
              outline: "none",
            }}
          />
        </div>
      </div>

      <div style={{ height: 12 }} />

      {loadingEntries ? (
        <div style={{ color: "#607D8B", fontSize: 13, overflow: "hidden" }}>
          Loading candidates...
        </div>
      ) : filteredEntries.length === 0 ? (
        <div
          style={{
            border: "1px dashed rgba(38,50,56,0.22)",
            borderRadius: 12,
            padding: compact ? 10 : 14,
            color: "#607D8B",
            fontSize: 13,
            lineHeight: 1.45,
            overflow: "hidden",
          }}
        >
          {compact ? (
            <span style={{ display: "block", overflow: "hidden" }}>No candidates.</span>
          ) : (
            <>
              No candidates yet. Use <strong>Add candidates</strong> to pull from Candidate Center.
            </>
          )}
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
                  padding: compact ? "8px 10px" : "10px 12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  minWidth: 0,
                  overflow: "hidden",
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
                  title={c.name}
                >
                  {c.name}
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    flexWrap: "nowrap",
                    justifyContent: "flex-end",
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
