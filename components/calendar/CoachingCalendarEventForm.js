// components/calendar/CoachingCalendarEventForm.js
import React, { useEffect, useRef, useState } from "react";

export default function CoachingCalendarEventForm({
  mode = "add",
  initial = null,
  onClose,
  onSave,
  onDelete,
  saving = false,
}) {
  const firstRef = useRef(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [form, setForm] = useState(() => ({
    clientType: initial?.clientType || "external",
    clientUserId: initial?.clientUserId || null,
    clientName: initial?.clientName || initial?.title || "",
    date: initial?.date || new Date().toISOString().slice(0, 10),
    time: initial?.time || "09:00",
    type: initial?.type || "Strategy",
    status: initial?.status || "Scheduled",
    notes: initial?.notes || "",
  }));

  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (form.clientType === "internal" && search.trim()) {
      let alive = true;
      setSearching(true);
      fetch(`/api/contacts/search?q=${encodeURIComponent(search)}`)
        .then((r) => r.json())
        .then((d) => {
          if (!alive) return;
          setResults(d.contacts || d.results || []);
        })
        .catch(() => {})
        .finally(() => alive && setSearching(false));
      return () => {
        alive = false;
      };
    } else {
      setResults([]);
    }
  }, [search, form.clientType]);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.date || !form.time) return alert("Date and time required.");
    if (form.clientType === "external" && !form.clientName.trim())
      return alert("Enter a client name.");
    onSave(form);
  };

  const label = {
    fontSize: 12,
    color: "#607D8B",
    marginBottom: 4,
    display: "block",
  };
  const input = {
    border: "1px solid #DADCE0",
    borderRadius: 8,
    padding: "8px 10px",
    width: "100%",
    fontSize: 14,
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "grid",
        placeItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 16,
          width: "100%",
          maxWidth: 520,
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "14px 18px",
            borderBottom: "1px solid #eee",
          }}
        >
          <h3 style={{ margin: 0, fontSize: 18, color: "#263238" }}>
            {mode === "edit" ? "Edit Session" : "Add Session"}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              fontSize: 22,
              color: "#999",
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: "grid", gap: 12, padding: 18 }}
        >
          {/* Client type */}
          <div>
            <label style={label}>Client Type</label>
            <div style={{ display: "flex", gap: 20, fontSize: 13 }}>
              <label>
                <input
                  type="radio"
                  checked={form.clientType === "internal"}
                  onChange={() => update("clientType", "internal")}
                  style={{ marginRight: 6 }}
                />
                Forge user
              </label>
              <label>
                <input
                  type="radio"
                  checked={form.clientType === "external"}
                  onChange={() => update("clientType", "external")}
                  style={{ marginRight: 6 }}
                />
                External client
              </label>
            </div>
          </div>

          {form.clientType === "internal" ? (
            <div>
              <label style={label}>Search Contacts</label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={input}
                placeholder="Search name or email…"
              />
              {searching && (
                <div style={{ fontSize: 12, color: "#999" }}>Searching…</div>
              )}
              {results.length > 0 && (
                <ul
                  style={{
                    listStyle: "none",
                    margin: "4px 0 0",
                    padding: 0,
                    border: "1px solid #eee",
                    borderRadius: 8,
                    maxHeight: 150,
                    overflowY: "auto",
                  }}
                >
                  {results.map((r) => (
                    <li
                      key={r.id}
                      onClick={() => {
                        update("clientUserId", r.id);
                        update("clientName", r.name || r.email);
                        setSearch("");
                        setResults([]);
                      }}
                      style={{
                        padding: "6px 8px",
                        fontSize: 13,
                        cursor: "pointer",
                        borderBottom: "1px solid #f0f0f0",
                      }}
                    >
                      <strong>{r.name}</strong>
                      <div style={{ fontSize: 12, color: "#607D8B" }}>
                        {r.email}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div>
              <label style={label}>Client Name</label>
              <input
                value={form.clientName}
                onChange={(e) => update("clientName", e.target.value)}
                style={input}
                placeholder="Jane Doe (Acme Corp)"
              />
            </div>
          )}

          {/* Date + Time */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={label}>Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => update("date", e.target.value)}
                style={input}
              />
            </div>
            <div>
              <label style={label}>Time</label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => update("time", e.target.value)}
                style={input}
              />
            </div>
          </div>

          {/* Type + Status */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={label}>Type</label>
              <select
                value={form.type}
                onChange={(e) => update("type", e.target.value)}
                style={input}
              >
                <option value="Strategy">Strategy</option>
                <option value="Resume">Resume</option>
                <option value="Interview">Interview</option>
              </select>
            </div>
            <div>
              <label style={label}>Status</label>
              <select
                value={form.status}
                onChange={(e) => update("status", e.target.value)}
                style={input}
              >
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
                <option value="No-show">No-show</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={label}>Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              rows={3}
              style={{ ...input, resize: "vertical" }}
            />
          </div>

          {/* Footer */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            {mode === "edit" && !confirmingDelete && (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                style={{
                  background: "white",
                  color: "#B71C1C",
                  border: "1px solid #F5C6CB",
                  padding: "6px 10px",
                  borderRadius: 999,
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                Delete
              </button>
            )}
            {confirmingDelete && (
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  style={{
                    background: "white",
                    border: "1px solid #ccc",
                    padding: "6px 10px",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => onDelete?.(form)}
                  style={{
                    background: "#E53935",
                    color: "white",
                    border: "none",
                    padding: "6px 12px",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  Confirm Delete
                </button>
              </div>
            )}

            {!confirmingDelete && (
              <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    background: "white",
                    border: "1px solid #ccc",
                    padding: "8px 12px",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    background: "#FF7043",
                    color: "white",
                    border: "none",
                    padding: "8px 12px",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontWeight: 700,
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
