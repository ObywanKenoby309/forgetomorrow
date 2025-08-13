// components/recruiter/SavedReplies.js
import { useEffect, useState } from "react";

/**
 * A small manager for saved reply templates stored in localStorage.
 * Props:
 * - onInsert: (text) => void
 */
export default function SavedReplies({ onInsert }) {
  const KEY = "ft_saved_replies";
  const [items, setItems] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  const persist = (next) => {
    setItems(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  };

  const add = () => {
    const t = text.trim();
    if (!t) return;
    persist([{ id: Date.now(), text: t }, ...items]);
    setText("");
  };

  const remove = (id) => persist(items.filter(i => i.id !== id));

  return (
    <div className="rounded-lg border bg-white p-4 space-y-3">
      <div className="font-medium">Saved Replies</div>
      <div className="flex items-center gap-2">
        <input
          className="border rounded px-3 py-2 text-sm flex-1"
          placeholder="New reply text…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="rounded bg-black text-white text-sm px-3 py-2" onClick={add}>
          Save
        </button>
      </div>

      <ul className="divide-y">
        {items.length === 0 && (
          <li className="py-3 text-sm text-slate-500">No saved replies yet.</li>
        )}
        {items.map((i) => (
          <li key={i.id} className="py-2 flex items-center justify-between">
            <div className="text-sm text-slate-700 pr-4 truncate">{i.text}</div>
            <div className="flex items-center gap-2">
              <button className="text-sm underline" onClick={() => onInsert?.(i.text)}>Insert</button>
              <button className="text-sm text-rose-600 underline" onClick={() => remove(i.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
