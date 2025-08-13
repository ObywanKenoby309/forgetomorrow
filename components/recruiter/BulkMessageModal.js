// components/recruiter/BulkMessageModal.js
import { useEffect, useState } from "react";

/**
 * props:
 * - open
 * - onClose
 * - candidates: [{id, name, role, location}]
 * - onSend: (ids[], text) => void
 */
export default function BulkMessageModal({ open, onClose, candidates = [], onSend }) {
  const [selected, setSelected] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    if (!open) {
      setSelected([]);
      setText("");
    }
  }, [open]);

  if (!open) return null;

  const toggle = (id) =>
    setSelected((arr) => (arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]));

  const allIds = candidates.map((c) => c.id);
  const allChecked = allIds.length > 0 && selected.length === allIds.length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-lg bg-white shadow-xl border">
        <div className="p-5 border-b">
          <h2 className="text-lg font-semibold">Bulk Message</h2>
        </div>

        <div className="p-5 space-y-4">
          <div className="text-sm text-slate-600">Select recipients:</div>

          <div className="rounded border max-h-48 overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b">
                  {/* Fixed width + centered to align with rows */}
                  <th className="w-[50px] text-center py-2">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      onChange={(e) => setSelected(e.target.checked ? allIds : [])}
                      aria-label="Select all"
                    />
                  </th>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">Role</th>
                  <th className="px-3 py-2 text-left">Location</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((c) => (
                  <tr key={c.id} className="border-b last:border-0">
                    {/* Match header: same width + centered */}
                    <td className="w-[50px] text-center py-2">
                      <input
                        type="checkbox"
                        checked={selected.includes(c.id)}
                        onChange={() => toggle(c.id)}
                        aria-label={`Select ${c.name}`}
                      />
                    </td>
                    <td className="px-3 py-2">{c.name}</td>
                    <td className="px-3 py-2">{c.role}</td>
                    <td className="px-3 py-2">{c.location}</td>
                  </tr>
                ))}
                {candidates.length === 0 && (
                  <tr>
                    <td className="px-3 py-4 text-slate-500 text-center" colSpan={4}>
                      No candidates available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div>
            <div className="text-sm text-slate-600 mb-1">Message</div>
            <textarea
              className="border rounded px-3 py-2 w-full min-h-[120px] text-sm"
              placeholder="Write your message once — it will be sent to all selected recipients."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
        </div>

        <div className="p-5 border-t flex items-center justify-between">
          <button onClick={onClose} className="px-4 py-2 rounded border text-sm hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={() => onSend?.(selected, text)}
            disabled={selected.length === 0 || !text.trim()}
            className={`px-4 py-2 rounded text-sm text-white ${
              selected.length && text.trim()
                ? "bg-[#FF7043] hover:bg-[#F4511E]"
                : "bg-slate-400 cursor-not-allowed"
            }`}
          >
            Send to {selected.length || 0}
          </button>
        </div>
      </div>
    </div>
  );
}
