// components/recruiter/SavedReplies.js
import { useEffect, useMemo, useState } from "react";

/**
 * DB-backed Saved Replies (no localStorage).
 *
 * Props:
 * - open?: boolean
 * - onClose?: () => void
 * - onInsert?: (text) => void
 *
 * Optional:
 * - title?: string (default "Saved Message Template")
 * - persona?: string (default "recruiter")  // recruiter | coach | etc
 */
export default function SavedReplies({
  open = true,
  onClose,
  onInsert,
  title = "Saved Message Template",
  persona = "recruiter",
}) {
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState("");
  const [description, setDescription] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const selectedItem = useMemo(
    () => items.find((i) => String(i.id) === String(selectedId)) || null,
    [items, selectedId]
  );

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/saved-replies?persona=${encodeURIComponent(persona)}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        }
      );

      if (!res.ok) {
        setItems([]);
        return;
      }

      const json = await res.json();
      const incoming = Array.isArray(json.items) ? json.items : [];
      setItems(incoming);

      if (incoming.length > 0) {
        const first = incoming[0];
        setSelectedId(first.id);
        setMessage(first.text || "");
        setDescription(first.description || "");
      } else {
        setSelectedId(null);
        setMessage("");
        setDescription("");
      }
    } catch {
      setItems([]);
      setSelectedId(null);
      setMessage("");
      setDescription("");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persona, open]);

  const handleSelect = (item) => {
    setSelectedId(item.id);
    setMessage(item.text || "");
    setDescription(item.description || "");
  };

  const handleCreateNew = () => {
    setSelectedId(null);
    setDescription("");
    setMessage("");
  };

  const handleSave = async () => {
    const textValue = String(message || "").trim();
    const descriptionValue = String(description || "").trim();

    if (!textValue) return;

    setBusy(true);
    try {
      if (selectedId) {
        const res = await fetch(`/api/saved-replies/${selectedId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: textValue,
            description: descriptionValue,
            persona,
          }),
        });

        if (!res.ok) {
          return;
        }

        const json = await res.json().catch(() => ({}));
        const updated = json?.item;

        if (updated?.id) {
          setItems((prev) =>
            prev.map((i) =>
              String(i.id) === String(updated.id)
                ? {
                    ...i,
                    ...updated,
                  }
                : i
            )
          );
          setSelectedId(updated.id);
          setMessage(updated.text || "");
          setDescription(updated.description || "");
        } else {
          await load();
        }

        return;
      }

      const res = await fetch(
        `/api/saved-replies?persona=${encodeURIComponent(persona)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: textValue,
            description: descriptionValue,
            persona,
          }),
        }
      );

      if (!res.ok) {
        return;
      }

      const json = await res.json().catch(() => ({}));
      const created = json?.item;

      if (created?.id) {
        setItems((prev) => [created, ...prev]);
        setSelectedId(created.id);
        setMessage(created.text || "");
        setDescription(created.description || "");
      } else {
        await load();
      }
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id) => {
    if (!id) return;

    const confirmed = window.confirm(
      "Delete this saved reply? This cannot be undone."
    );
    if (!confirmed) return;

    setBusy(true);
    try {
      const res = await fetch(`/api/saved-replies/${id}`, { method: "DELETE" });
      if (!res.ok) return;

      const next = items.filter((i) => String(i.id) !== String(id));
      setItems(next);

      if (String(selectedId) === String(id)) {
        if (next.length > 0) {
          const first = next[0];
          setSelectedId(first.id);
          setMessage(first.text || "");
          setDescription(first.description || "");
        } else {
          setSelectedId(null);
          setMessage("");
          setDescription("");
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const handleInsert = (item) => {
    if (!item?.text) return;
    onInsert?.(item.text);
  };

  const sampleFor = (item) => {
    const text = String(item?.text || "").trim();
    if (!text) return "—";
    return text.length > 64 ? `${text.slice(0, 64)}…` : text;
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={() => {
        if (!busy) onClose?.();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.38)",
        zIndex: 1000,
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(1480px, 96vw)",
          maxHeight: "92vh",
          overflow: "auto",
          background: "#F8FAFC",
          border: "1px solid rgba(15,23,42,0.08)",
          borderRadius: 18,
          boxShadow: "0 24px 60px rgba(15,23,42,0.20)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "34px 36px 28px",
            borderBottom: "1px solid #D7DEE7",
            background: "#F8FAFC",
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: "#0F172A",
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: 36 }}>
          <div
            style={{
              fontSize: 18,
              fontWeight: 500,
              color: "#51627A",
              marginBottom: 28,
            }}
          >
            Select Template:
          </div>

          <div
            style={{
              border: "1px solid #D7DEE7",
              borderRadius: 10,
              overflow: "hidden",
              background: "white",
              marginBottom: 28,
            }}
          >
            {/* Table Header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "56px 1.2fr 1.6fr 220px",
                alignItems: "center",
                gap: 0,
                background: "#F8FAFC",
                borderBottom: "1px solid #D7DEE7",
                minHeight: 64,
                padding: "0 14px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "center" }}>
                <input
                  type="checkbox"
                  checked={false}
                  readOnly
                  style={{ width: 20, height: 20 }}
                />
              </div>

              <div
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: "#000",
                }}
              >
                Description
              </div>

              <div
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: "#000",
                }}
              >
                Sample
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: 18,
                  fontSize: 20,
                  fontWeight: 500,
                }}
              >
                <span style={{ color: "#16A34A" }}>Insert</span>
                <span style={{ color: "#EAB308" }}>Edit</span>
                <span style={{ color: "#EF4444" }}>Delete</span>
              </div>
            </div>

            {/* Table Rows */}
            {loading ? (
              <div
                style={{
                  padding: "22px 18px",
                  fontSize: 16,
                  color: "#64748B",
                }}
              >
                Loading saved replies…
              </div>
            ) : items.length === 0 ? (
              <div
                style={{
                  padding: "22px 18px",
                  fontSize: 16,
                  color: "#64748B",
                }}
              >
                No saved replies yet.
              </div>
            ) : (
              items.map((item) => {
                const isSelected = String(selectedId) === String(item.id);

                return (
                  <div
                    key={item.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "56px 1.2fr 1.6fr 220px",
                      alignItems: "center",
                      gap: 0,
                      minHeight: 72,
                      padding: "0 14px",
                      borderTop: "1px solid #E5EAF0",
                      background: isSelected ? "#F8FAFC" : "white",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelect(item)}
                        style={{ width: 20, height: 20 }}
                      />
                    </div>

                    <div
                      style={{
                        fontSize: 18,
                        color: "#475569",
                        paddingRight: 18,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={item.description || item.text || ""}
                    >
                      {item.description || item.text || "Untitled template"}
                    </div>

                    <div
                      style={{
                        fontSize: 18,
                        color: "#475569",
                        paddingRight: 18,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={item.text || ""}
                    >
                      {sampleFor(item)}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        gap: 36,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleInsert(item)}
                        disabled={busy}
                        title="Insert"
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 4,
                          border: "1px solid rgba(15,23,42,0.35)",
                          background: "#22C55E",
                          cursor: busy ? "not-allowed" : "pointer",
                          boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.25)",
                        }}
                      />

                      <button
                        type="button"
                        onClick={() => handleSelect(item)}
                        disabled={busy}
                        title="Edit"
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 4,
                          border: "1px solid rgba(15,23,42,0.35)",
                          background: "#FACC15",
                          cursor: busy ? "not-allowed" : "pointer",
                          boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.25)",
                        }}
                      />

                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        disabled={busy}
                        title="Delete"
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 4,
                          border: "1px solid rgba(15,23,42,0.35)",
                          background: "#EF4444",
                          cursor: busy ? "not-allowed" : "pointer",
                          boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.25)",
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div
            style={{
              fontSize: 18,
              fontWeight: 500,
              color: "#51627A",
              marginBottom: 12,
            }}
          >
            Message
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={busy}
            placeholder="Write or edit your saved message template here…"
            style={{
              width: "100%",
              minHeight: 216,
              resize: "vertical",
              border: "1px solid #D7DEE7",
              borderRadius: 10,
              background: "white",
              padding: 22,
              fontSize: 18,
              lineHeight: 1.45,
              color: "#475569",
              outline: "none",
              boxSizing: "border-box",
            }}
          />

          <div style={{ marginTop: 14 }}>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={busy}
              placeholder="Optional description (example: Job posting for Acme Co.)"
              style={{
                width: "100%",
                border: "1px solid #D7DEE7",
                borderRadius: 10,
                background: "white",
                padding: "14px 16px",
                fontSize: 16,
                color: "#475569",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            borderTop: "1px solid #D7DEE7",
            padding: "18px 36px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            background: "#F8FAFC",
          }}
        >
          <button
            type="button"
            onClick={() => onClose?.()}
            disabled={busy}
            style={{
              minWidth: 132,
              height: 66,
              borderRadius: 10,
              border: "1px solid #D7DEE7",
              background: "white",
              color: "#111827",
              fontSize: 18,
              fontWeight: 500,
              cursor: busy ? "not-allowed" : "pointer",
            }}
          >
            Cancel
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              type="button"
              onClick={handleCreateNew}
              disabled={busy}
              style={{
                minWidth: 150,
                height: 66,
                borderRadius: 10,
                border: "1px solid #D7DEE7",
                background: "white",
                color: "#334155",
                fontSize: 18,
                fontWeight: 600,
                cursor: busy ? "not-allowed" : "pointer",
              }}
            >
              New Template
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={busy || !String(message || "").trim()}
              style={{
                minWidth: 164,
                height: 66,
                borderRadius: 10,
                border: "none",
                background:
                  busy || !String(message || "").trim()
                    ? "#94A3B8"
                    : "#94A3B8",
                color: "white",
                fontSize: 18,
                fontWeight: 600,
                cursor:
                  busy || !String(message || "").trim()
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {busy ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}