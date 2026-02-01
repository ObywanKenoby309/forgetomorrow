// components/recruiter/SavedReplies.js
import { useEffect, useState } from "react";

/**
 * DB-backed Saved Replies (no localStorage).
 *
 * Props:
 * - onInsert: (text) => void
 *
 * Optional:
 * - title?: string (default "Saved Replies")
 * - persona?: string (default "recruiter")  // recruiter | coach | etc
 */
export default function SavedReplies({
  onInsert,
  title = "Saved Replies",
  persona = "recruiter",
}) {
  const [items, setItems] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/saved-replies?persona=${encodeURIComponent(persona)}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      if (!res.ok) {
        setItems([]);
        return;
      }

      const json = await res.json();
      setItems(Array.isArray(json.items) ? json.items : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persona]);

  const add = async () => {
    const t = (text || "").trim();
    if (!t) return;

    setBusy(true);
    try {
      const res = await fetch("/api/saved-replies?persona=" + encodeURIComponent(persona), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: t, persona }),
      });

      if (!res.ok) return;

      const json = await res.json();
      const created = json?.item;
      if (created?.id) {
        setItems((prev) => [created, ...prev]);
        setText("");
      } else {
        await load();
        setText("");
      }
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/saved-replies/${id}`, { method: "DELETE" });
      if (!res.ok) return;
      setItems((prev) => prev.filter((i) => i.id !== id));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg border bg-white p-4 space-y-3">
      <div className="font-medium">{title}</div>

      <div className="flex items-center gap-2">
        <input
          className="border rounded px-3 py-2 text-sm flex-1"
          placeholder="New reply text…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={busy}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") add();
          }}
        />
        <button
          className={`rounded text-white text-sm px-3 py-2 ${
            busy ? "bg-slate-400 cursor-not-allowed" : "bg-black"
          }`}
          onClick={add}
          disabled={busy || !text.trim()}
          title="Ctrl/Cmd+Enter to save"
        >
          Save
        </button>
      </div>

      <ul className="divide-y">
        {loading && (
          <li className="py-3 text-sm text-slate-500">Loading saved replies…</li>
        )}

        {!loading && items.length === 0 && (
          <li className="py-3 text-sm text-slate-500">No saved replies yet.</li>
        )}

        {items.map((i) => (
          <li key={i.id} className="py-2 flex items-center justify-between">
            <div className="text-sm text-slate-700 pr-4 truncate">{i.text}</div>
            <div className="flex items-center gap-2">
              <button
                className="text-sm underline"
                onClick={() => onInsert?.(i.text)}
              >
                Insert
              </button>
              <button
                className="text-sm text-rose-600 underline"
                onClick={() => remove(i.id)}
                disabled={busy}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
