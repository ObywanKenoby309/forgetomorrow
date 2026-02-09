// components/recruiter/pools/PoolEntriesList.js
import React from "react";
import { Pill } from "./Pills";
import { fmtShortDate } from "./utils";

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
                onClick={() => onSelectEntry(c.id)}
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
  );
}
