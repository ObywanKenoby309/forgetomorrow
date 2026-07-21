// components/coaching/ClientNotes.js

import { useEffect, useState } from "react";

export default function ClientNotes({ client }) {
  const [selectedNotebook, setSelectedNotebook] = useState("Sessions");
  const [note, setNote] = useState("");

  const [notes, setNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState(null);

  useEffect(() => {
    if (!client?.coachingNotes) return;

    setNotes(client.coachingNotes);

    if (client.coachingNotes.length > 0) {
      setSelectedNoteId(client.coachingNotes[0].id);
      setNote(client.coachingNotes[0].body || "");
    }
  }, [client]);

  const notebooks = [
    "Sessions",
    "Career",
    "Private",
    "AI",
    "Shared",
  ];


  return (
    <div className="space-y-4">

      {/* Toolbar */}

      <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">

        <div className="flex flex-wrap items-center gap-3">

          <button
            className="rounded-xl bg-[#FF7043] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition"
          >
            + New Note
          </button>

          <input
            type="text"
            placeholder="Search notes..."
            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none"
          />

          <button
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Filter
          </button>

        </div>

      </div>

      {/* Workspace */}

      <div className="grid grid-cols-[220px_minmax(0,1fr)] gap-4">

        {/* LEFT */}

        <div className="space-y-4">

          <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">

            <h3 className="mb-4 font-black text-[#FF7043]">
              Notebooks
            </h3>

            <div className="space-y-2">

              {notebooks.map((folder) => (

                <button
                  key={folder}
                  onClick={() => setSelectedNotebook(folder)}
                  className={`w-full rounded-lg px-3 py-2 text-left transition ${
                    selectedNotebook === folder
                      ? "bg-[rgba(255,112,67,0.12)] font-semibold text-[#FF7043]"
                      : "hover:bg-slate-100"
                  }`}
                >
                  📁 {folder}
                </button>

              ))}

            </div>

          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">

            <h3 className="mb-4 font-black text-[#FF7043]">
              Recent Notes
            </h3>

            <div className="space-y-2">

              {notes.map((item) => (

  <button
    key={item.id}
    onClick={() => {
      setSelectedNoteId(item.id);
      setNote(item.body || "");
    }}
    className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
      selectedNoteId === item.id
        ? "bg-[rgba(255,112,67,0.12)] text-[#FF7043] font-semibold"
        : "hover:bg-slate-100"
    }`}
  >
    {(item.body || "Untitled Note").slice(0, 40)}
  </button>

))}

            </div>

          </div>

        </div>

        {/* RIGHT */}

        <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">

          <div className="mb-4 flex items-center justify-between">

            <h2 className="text-lg font-black text-slate-800">
              {selectedNotebook} Notes
            </h2>

            <div className="text-xs text-slate-500">
              Auto Saved (placeholder)
            </div>

          </div>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Write coaching notes..."
            className="min-h-[600px] w-full resize-none rounded-2xl border border-slate-200 bg-white p-4 text-sm outline-none"
          />

          <div className="mt-5 flex justify-end gap-3">

            <button
              className="rounded-xl border border-slate-200 bg-white px-5 py-2 font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>

            <button
              className="rounded-xl bg-[#FF7043] px-5 py-2 font-semibold text-white hover:opacity-90 transition"
            >
              Save Notes
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}