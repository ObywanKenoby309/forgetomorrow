// components/recruiter/SavedReplies.js
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

const ORANGE = "#FF7043";
const SLATE = "#334155";
const MUTED = "#64748B";
const LIGHT_MUTED = "#94A3B8";
const BORDER = "rgba(15,23,42,0.08)";
const DANGER = "#DC2626";

const GLASS = {
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.22)",
  background: "rgba(255,255,255,0.92)",
  boxShadow: "0 24px 60px rgba(15,23,42,0.22)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
};

const WHITE_CARD = {
  background: "rgba(255,255,255,0.97)",
  border: `1px solid ${BORDER}`,
  borderRadius: 12,
  boxSizing: "border-box",
};

export default function SavedReplies({
  open = true,
  onClose,
  onInsert,
  title = "Saved Replies",
  persona = "recruiter",
}) {
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState("");
  const [description, setDescription] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  const selectedItem = useMemo(
    () => items.find((i) => String(i.id) === String(selectedId)) || null,
    [items, selectedId]
  );

  const showToast = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/saved-replies?persona=${encodeURIComponent(persona)}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      if (!res.ok) { setItems([]); return; }
      const json = await res.json();
      const incoming = Array.isArray(json.items) ? json.items : [];
      setItems(incoming);
      if (incoming.length > 0) {
        const first = incoming[0];
        setSelectedId(first.id);
        setMessage(first.text || "");
        setDescription(first.description || "");
      } else {
        setSelectedId(null); setMessage(""); setDescription("");
      }
    } catch {
      setItems([]); setSelectedId(null); setMessage(""); setDescription("");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    load();
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
          body: JSON.stringify({ text: textValue, description: descriptionValue, persona }),
        });
        if (!res.ok) { showToast("Could not save. Please try again.", true); return; }
        const json = await res.json().catch(() => ({}));
        const updated = json?.item;
        if (updated?.id) {
          setItems((prev) => prev.map((i) => String(i.id) === String(updated.id) ? { ...i, ...updated } : i));
          setSelectedId(updated.id);
          setMessage(updated.text || "");
          setDescription(updated.description || "");
        } else { await load(); }
        showToast("Reply saved.");
      } else {
        const res = await fetch(`/api/saved-replies?persona=${encodeURIComponent(persona)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: textValue, description: descriptionValue, persona }),
        });
        if (!res.ok) { showToast("Could not create. Please try again.", true); return; }
        const json = await res.json().catch(() => ({}));
        const created = json?.item;
        if (created?.id) {
          setItems((prev) => [created, ...prev]);
          setSelectedId(created.id);
          setMessage(created.text || "");
          setDescription(created.description || "");
        } else { await load(); }
        showToast("Reply created.");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id) => {
    if (!id) return;
    const confirmed = window.confirm("Delete this saved reply? This cannot be undone.");
    if (!confirmed) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/saved-replies/${id}`, { method: "DELETE" });
      if (!res.ok) { showToast("Could not delete. Please try again.", true); return; }
      const next = items.filter((i) => String(i.id) !== String(id));
      setItems(next);
      if (String(selectedId) === String(id)) {
        if (next.length > 0) {
          setSelectedId(next[0].id); setMessage(next[0].text || ""); setDescription(next[0].description || "");
        } else { setSelectedId(null); setMessage(""); setDescription(""); }
      }
      showToast("Reply deleted.");
    } finally {
      setBusy(false);
    }
  };

  const handleInsert = (item) => {
    if (!item?.text) return;
    onInsert?.(item.text);
    onClose?.();
  };

  const sampleFor = (item) => {
    const text = String(item?.text || "").trim();
    if (!text) return "—";
    return text.length > 80 ? `${text.slice(0, 80)}…` : text;
  };

  const canSave = String(message || "").trim().length > 0;

  if (!open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed", inset: 0, zIndex: 99999,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24, background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)",
      }}
      onClick={() => { if (!busy) onClose?.(); }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          ...GLASS,
          width: "min(720px, 96vw)",
          maxHeight: "90vh",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* ── Header ── */}
        <div style={{
          padding: "18px 20px 14px", borderBottom: `1px solid ${BORDER}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: ORANGE,
              textShadow: "0 2px 4px rgba(15,23,42,0.65)", letterSpacing: "-0.01em" }}>
              {title}
            </h2>
            <div style={{ fontSize: 12, color: MUTED, marginTop: 3 }}>
              Save messages you send often — insert them in one click.
            </div>
          </div>
          <button type="button" onClick={() => onClose?.()}
            style={{ background: "none", border: "none", cursor: "pointer",
              fontSize: 22, lineHeight: 1, color: LIGHT_MUTED, padding: 4 }}>
            ×
          </button>
        </div>

        {/* ── Reply list ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 20px 0" }}>
          {/* List */}
          <div style={{ ...WHITE_CARD, overflow: "hidden", marginBottom: 16 }}>
            {loading ? (
              <div style={{ padding: "20px 16px", color: LIGHT_MUTED, fontSize: 13 }}>
                Loading saved replies…
              </div>
            ) : items.length === 0 ? (
              <div style={{ padding: "20px 16px", color: LIGHT_MUTED, fontSize: 13, fontStyle: "italic" }}>
                No saved replies yet — write one below and hit Save.
              </div>
            ) : items.map((item) => {
              const isSelected = String(selectedId) === String(item.id);
              return (
                <div key={item.id} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 14px",
                  borderBottom: `1px solid ${BORDER}`,
                  background: isSelected ? "rgba(255,112,67,0.04)" : "transparent",
                  transition: "background 0.1s",
                }}>
                  {/* Select indicator */}
                  <div style={{
                    width: 4, alignSelf: "stretch", borderRadius: 999, flexShrink: 0,
                    background: isSelected ? ORANGE : "transparent",
                  }} />

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
                    onClick={() => handleSelect(item)}>
                    <div style={{ fontSize: 13, fontWeight: 700,
                      color: isSelected ? ORANGE : SLATE,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.description || "Untitled reply"}
                    </div>
                    <div style={{ fontSize: 11, color: MUTED, marginTop: 2,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {sampleFor(item)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    <button type="button" onClick={() => handleInsert(item)} disabled={busy}
                      style={{
                        padding: "5px 10px", borderRadius: 8, border: "none",
                        background: "rgba(34,197,94,0.12)", color: "#16A34A",
                        fontSize: 11, fontWeight: 800, cursor: busy ? "not-allowed" : "pointer",
                      }}>
                      Insert
                    </button>
                    <button type="button" onClick={() => handleSelect(item)} disabled={busy}
                      style={{
                        padding: "5px 10px", borderRadius: 8,
                        border: `1px solid ${BORDER}`, background: "white",
                        color: MUTED, fontSize: 11, fontWeight: 700,
                        cursor: busy ? "not-allowed" : "pointer",
                      }}>
                      Edit
                    </button>
                    <button type="button" onClick={() => handleDelete(item.id)} disabled={busy}
                      style={{
                        padding: "5px 10px", borderRadius: 8, border: "none",
                        background: "rgba(220,38,38,0.08)", color: DANGER,
                        fontSize: 11, fontWeight: 800, cursor: busy ? "not-allowed" : "pointer",
                      }}>
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Editor ── */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase",
              letterSpacing: "0.07em", color: LIGHT_MUTED, marginBottom: 8 }}>
              {selectedId ? "Editing reply" : "New reply"}
            </div>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={busy}
              placeholder="Name this reply (e.g. Interview invite, Follow-up)"
              style={{
                width: "100%", boxSizing: "border-box",
                border: `1px solid ${BORDER}`, borderRadius: 10,
                padding: "9px 12px", fontSize: 13, fontFamily: "inherit",
                color: SLATE, outline: "none",
                background: "rgba(248,250,252,0.9)",
                marginBottom: 8,
              }}
            />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={busy}
              placeholder="Write your message template here…"
              rows={5}
              style={{
                width: "100%", boxSizing: "border-box",
                border: `1px solid ${BORDER}`, borderRadius: 10,
                padding: "10px 12px", fontSize: 13, fontFamily: "inherit",
                color: SLATE, outline: "none", resize: "vertical",
                background: "rgba(248,250,252,0.9)", lineHeight: 1.6,
              }}
            />
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: "12px 20px 18px", borderTop: `1px solid ${BORDER}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={() => onClose?.()} disabled={busy}
              style={{
                padding: "9px 18px", borderRadius: 10,
                border: `1px solid ${BORDER}`, background: "white",
                fontSize: 13, fontWeight: 600, color: MUTED,
                cursor: busy ? "not-allowed" : "pointer",
              }}>
              Close
            </button>
            <button type="button" onClick={handleCreateNew} disabled={busy}
              style={{
                padding: "9px 18px", borderRadius: 10,
                border: `1px solid ${BORDER}`, background: "white",
                fontSize: 13, fontWeight: 600, color: SLATE,
                cursor: busy ? "not-allowed" : "pointer",
              }}>
              + New
            </button>
          </div>

          <button type="button" onClick={handleSave} disabled={busy || !canSave}
            style={{
              padding: "9px 22px", borderRadius: 10, border: "none",
              background: canSave && !busy
                ? "linear-gradient(135deg, #FF7043 0%, #FF8A65 100%)"
                : "rgba(15,23,42,0.15)",
              color: canSave && !busy ? "white" : MUTED,
              fontSize: 13, fontWeight: 700,
              cursor: canSave && !busy ? "pointer" : "not-allowed",
              boxShadow: canSave && !busy ? "0 4px 14px rgba(255,112,67,0.35)" : "none",
              transition: "all 0.15s",
            }}>
            {busy ? "Saving…" : selectedId ? "Save changes" : "Save reply"}
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && createPortal(
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          zIndex: 999999, background: toast.isError ? DANGER : "#0F172A",
          color: "white", padding: "11px 20px", borderRadius: 10,
          fontSize: 13, fontWeight: 600, boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
          whiteSpace: "nowrap", pointerEvents: "none",
        }}>
          {toast.msg}
        </div>,
        document.body
      )}
    </div>,
    document.body
  );
}