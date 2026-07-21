// components/coaching/ClientNotes.js

import { useEffect, useState } from "react";

export default function ClientNotes({ client }) {
	const [note, setNote] = useState("");
	useEffect(() => {
  console.log("NOTES:", notes);
}, [notes]);
	const [savedNote, setSavedNote] = useState("");
	const [notes, setNotes] = useState([]);
	const [selectedNoteId, setSelectedNoteId] = useState(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [isSaving, setIsSaving] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [message, setMessage] = useState("");

useEffect(() => {
  if (!client?.coachingNotes) return;

  const sorted = [...client.coachingNotes].sort(
    (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
  );

  setNotes(sorted);

  if (sorted.length > 0) {
    setSelectedNoteId(sorted[0].id);
    setNote(sorted[0].body || "");
    setSavedNote(sorted[0].body || "");
  } else {
    setSelectedNoteId(null);
    setNote("");
    setSavedNote("");
  }
}, [client]);

const hasUnsavedChanges = note !== savedNote;

const handleNewNote = () => {
  setSelectedNoteId(null);
  setNote("");
  setSavedNote("");
  setMessage("");
};

const handleCancel = () => {
  setNote(savedNote);
  setMessage("");
};

const handleSave = async () => {
  if (!note.trim()) return;

  setIsSaving(true);
  setMessage("");

  try {

const isEditing = !!selectedNoteId;

const res = await fetch(
  `/api/coaching/clients/${encodeURIComponent(client.id)}/notes`,
  {
    method: isEditing ? "PUT" : "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(
      isEditing
        ? {
            noteId: selectedNoteId,
            body: note,
          }
        : {
            body: note,
          }
    ),
  }
);

if (!res.ok) {
  throw new Error("Save failed.");
}

const { note: saved } = await res.json();

const updatedNotes = isEditing
  ? notes.map((item) => (item.id === saved.id ? saved : item))
  : [saved, ...notes];

updatedNotes.sort(
  (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
);

setNotes(updatedNotes);

setSelectedNoteId(saved.id);

setNote(saved.body || "");
setSavedNote(saved.body || "");

setMessage("Note saved.");

  } catch (err) {
    console.error(err);
    setMessage("Unable to save note.");
  } finally {
    setIsSaving(false);
  }
};

  return (
    <div className="space-y-4">

      {/* Toolbar */}

      <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">

        <div className="flex flex-wrap items-center gap-3">

          <button
  onClick={handleNewNote}
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

      <div className="grid grid-cols-[280px_minmax(0,1fr)] gap-4">

        {/* LEFT */}

        <div>

          <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">

            <h3 className="mb-4 font-black text-[#FF7043]">
              Notes
            </h3>

            <div className="space-y-2">

              {notes.map((item) => (

                <button
                  key={item.id}
                  onClick={() => {
  setSelectedNoteId(item.id);
  setNote(item.body || "");
  setSavedNote(item.body || "");
  setMessage("");
}}
                  className={`block w-full rounded-xl px-3 py-3 text-left text-sm transition ${
                    selectedNoteId === item.id
                      ? "bg-[rgba(255,112,67,0.12)] text-[#FF7043] font-semibold"
                      : "hover:bg-slate-100"
                  }`}
                >
                  <div className="truncate">
                    {(item.body || "Untitled Note").slice(0, 50)}
                  </div>

                  <div className="mt-1 text-[11px] text-slate-400">
                    {new Date(item.updatedAt).toLocaleDateString()}
                  </div>

                </button>

              ))}

            </div>

          </div>

        </div>

        {/* RIGHT */}

        <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">

          <div className="mb-5 flex items-center justify-between">

            <h2 className="text-lg font-black text-slate-800">
              Coaching Notes
            </h2>

            <div className="text-xs text-slate-500">
              Unsaved Changes
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
  onClick={handleCancel}
  disabled={!hasUnsavedChanges}
  className="rounded-xl border border-slate-200 bg-white px-5 py-2 font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
>
  Cancel
</button>

            <button
  onClick={handleSave}
  disabled={isSaving || !note.trim() || !hasUnsavedChanges}
  className="rounded-xl bg-[#FF7043] px-5 py-2 font-semibold text-white hover:opacity-90 transition disabled:opacity-50"
>
  {isSaving ? "Saving..." : "Save Notes"}
</button>

           </div>

        </div>

      </div>

    </div>
  );
}