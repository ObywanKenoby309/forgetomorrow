// components/recruiter/pools/PoolsList.js
import React from "react";
import { Pill } from "./Pills";
import { fmtUpdatedAt } from "./utils";

export default function PoolsList({
  panelStyle,
  loadingPools,
  pools,
  selectedPoolId,
  onSelectPool,
}) {
  return (
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
                  onClick={() => onSelectPool(p.id)}
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
                    <div style={{ color: "#607D8B", fontSize: 12, marginTop: 4, lineHeight: 1.35 }}>{p.purpose}</div>
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
          <strong>ForgeTomorrow advantage:</strong> every saved candidate carries a “why saved” snapshot so you keep signal, not just names.
        </div>
      </div>
    </div>
  );
}
