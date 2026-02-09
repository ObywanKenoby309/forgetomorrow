// components/recruiter/pools/CreatePoolPanel.js
import React from "react";
import { PrimaryButton, SecondaryButton } from "./Pills";

export default function CreatePoolPanel({
  panelStyle,
  saving,
  newPoolName,
  setNewPoolName,
  newPoolPurpose,
  setNewPoolPurpose,
  newPoolTags,
  setNewPoolTags,
  onCreate,
  onCancel,
}) {
  return (
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
          <PrimaryButton onClick={onCreate} disabled={saving}>
            {saving ? "Saving..." : "Create pool"}
          </PrimaryButton>
          <SecondaryButton onClick={onCancel} disabled={saving}>
            Cancel
          </SecondaryButton>
        </div>
      </div>
    </div>
  );
}
