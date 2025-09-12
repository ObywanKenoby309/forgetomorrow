// components/profile/ProfileAbout.js
import React from "react";
import Collapsible from "@/components/ui/Collapsible";

export default function ProfileAbout({ about, setAbout }) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(about || "");

  // keep local draft in sync if parent value changes (e.g., load from storage)
  React.useEffect(() => {
    setDraft(about || "");
  }, [about]);

  const onSave = () => {
    const val = (draft || "").trim();
    setAbout?.(val);
    setIsEditing(false);
  };

  const onCancel = () => {
    setDraft(about || "");
    setIsEditing(false);
  };

  return (
    <Collapsible title="About Me" defaultOpen>
      {/* Outer card */}
      <section
        style={{
          background: "#FFFFFF",
          border: "1px solid #e6e9ef",
          borderRadius: 12,
          padding: 16,
          boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
          position: "relative",
        }}
      >
        {/* View mode */}
        {!isEditing && (
          <div style={{ position: "relative" }}>
            {/* Give the text some right padding so the button never feels cramped */}
            <div
              style={{
                color: "#263238",
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
                paddingRight: 84, // room for the button
              }}
            >
              {about?.trim() ? (
                about
              ) : (
                <span style={{ color: "#90A4AE" }}>
                  Add a short summary about yourself…
                </span>
              )}
            </div>

            {/* Edit button floats at top-right of the card */}
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                background: "#fff",
                color: "#FF7043",
                border: "1px solid #FF7043",
                borderRadius: 10,
                padding: "8px 14px",
                fontWeight: 700,
                cursor: "pointer",
              }}
              aria-label="Edit About Me"
              title="Edit"
            >
              Edit
            </button>
          </div>
        )}

        {/* Edit mode */}
        {isEditing && (
          <div style={{ display: "grid", gap: 12 }}>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={6}
              autoFocus
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") onSave();
                if (e.key === "Escape") onCancel();
              }}
              style={{
                width: "100%",
                border: "1px solid #ddd",
                borderRadius: 10,
                padding: "12px 14px",
                outline: "none",
                resize: "vertical",
                font: "inherit",
                lineHeight: 1.6,
              }}
              placeholder="Write a concise, human summary about yourself…"
            />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div style={{ color: "#90A4AE", fontSize: 13 }}>
                Tip: Use <strong>Cmd/Ctrl+Enter</strong> to save •{" "}
                <strong>Esc</strong> to cancel
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  onClick={onCancel}
                  style={{
                    background: "#fff",
                    color: "#455A64",
                    border: "1px solid #CFD8DC",
                    borderRadius: 10,
                    padding: "8px 14px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onSave}
                  style={{
                    background: "#FF7043",
                    color: "#fff",
                    border: "1px solid #FF7043",
                    borderRadius: 10,
                    padding: "8px 14px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </Collapsible>
  );
}
