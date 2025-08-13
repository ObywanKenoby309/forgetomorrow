// components/recruiter/MessageThread.js
import { useEffect, useMemo, useRef, useState } from "react";

/**
 * props:
 * - threads: [{id, candidate, snippet, messages:[{id, from:'recruiter'|'candidate', text, ts: ISO}], unread?: number}]
 * - initialThreadId?: number
 * - onSend?: (threadId, messageText) => void
 */
export default function MessageThread({ threads = [], initialThreadId, onSend }) {
  const [activeId, setActiveId] = useState(initialThreadId ?? threads[0]?.id ?? null);
  const active = useMemo(() => threads.find(t => t.id === activeId) || null, [threads, activeId]);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    // auto-scroll to bottom on thread change or new message
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeId, active?.messages?.length]);

  const handleSend = () => {
    const text = draft.trim();
    if (!text || !active) return;
    onSend?.(active.id, text);
    setDraft("");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Threads list */}
      <aside className="md:col-span-1 rounded-lg border bg-white divide-y">
        {threads.length === 0 && (
          <div className="px-4 py-6 text-sm text-slate-500">No conversations yet.</div>
        )}
        {threads.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveId(t.id)}
            className={`w-full text-left px-4 py-3 hover:bg-slate-50 focus:bg-slate-50 ${
              t.id === activeId ? "bg-slate-50" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="font-medium">{t.candidate}</div>
              {t.unread ? (
                <span className="ml-2 text-[10px] px-1.5 py-[2px] rounded bg-emerald-100 text-emerald-700 border border-emerald-200">
                  {t.unread}
                </span>
              ) : null}
            </div>
            <div className="text-xs text-slate-500 truncate">{t.snippet || "—"}</div>
          </button>
        ))}
      </aside>

      {/* Active thread */}
      <section className="md:col-span-2 rounded-lg border bg-white p-4 flex flex-col">
        {!active ? (
          <div className="text-sm text-slate-500">Select a conversation.</div>
        ) : (
          <>
            <div className="font-medium mb-2">Conversation with {active.candidate}</div>
            <div
              ref={scrollRef}
              className="flex-1 border rounded p-3 text-sm text-slate-800 bg-slate-50 overflow-y-auto"
              style={{ minHeight: 280, maxHeight: 460 }}
            >
              {active.messages?.length ? (
                <ul className="space-y-2">
                  {active.messages.map((m) => (
                    <li key={m.id} className={`flex ${m.from === "recruiter" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`px-3 py-2 rounded max-w-[80%] ${
                          m.from === "recruiter"
                            ? "bg-[#FF7043] text-white"
                            : "bg-white border"
                        }`}
                        title={new Date(m.ts).toLocaleString()}
                      >
                        {m.text}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-slate-500">No messages yet. Say hello!</div>
              )}
            </div>

            <div className="mt-3 flex items-center gap-2">
              <input
                className="flex-1 border rounded px-3 py-2 text-sm"
                placeholder="Type a message…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSend();
                }}
              />
              <button
                className="rounded bg-black text-white text-sm px-3 py-2"
                onClick={handleSend}
                disabled={!draft.trim() || !active}
                title="Ctrl/Cmd+Enter to send"
              >
                Send
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
