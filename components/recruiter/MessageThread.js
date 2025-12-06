// components/recruiter/MessageThread.js
import { useEffect, useMemo, useRef, useState } from "react";

function tsFmt(ts) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "";
  }
}

/**
 * props:
 * - threads: [{id, candidate, snippet, messages:[{id, from:'recruiter'|'candidate', text, ts, status?:'sent'|'read'}], unread?: number}]
 * - initialThreadId?: number|string
 * - onSend?: (threadId, messageText) => void
 * - onInsertSavedReply?: (setDraft) => void   // called by SavedReplies to insert text
 */
export default function MessageThread({
  threads = [],
  initialThreadId,
  onSend,
  onInsertSavedReply,
}) {
  const [activeId, setActiveId] = useState(
    initialThreadId ?? threads[0]?.id ?? null
  );
  const active = useMemo(
    () => threads.find((t) => t.id === activeId) || null,
    [threads, activeId]
  );
  const [draft, setDraft] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  // 🔁 Keep activeId in sync with initialThreadId / threads when they change
  useEffect(() => {
    const next = initialThreadId ?? threads[0]?.id ?? null;
    setActiveId((prev) => {
      // If we already have a valid activeId that still exists, keep it
      if (prev && threads.some((t) => t.id === prev)) {
        // But if initialThreadId is explicitly set and different, respect that
        if (initialThreadId && prev !== initialThreadId) {
          return initialThreadId;
        }
        return prev;
      }
      return next;
    });
  }, [initialThreadId, threads]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeId, active?.messages?.length]);

  useEffect(() => {
    // fake “candidate is typing” when you toggle the checkbox
    let t;
    if (activeId) {
      t = setTimeout(() => setIsTyping(false), 0);
    }
    return () => clearTimeout(t);
  }, [activeId]);

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
          <div className="px-4 py-6 text-sm text-slate-500">
            No conversations yet. Messages you send as{" "}
            <span className="font-medium">Recruiter</span> will show up here.
          </div>
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
            <div className="text-xs text-slate-500 truncate">
              {t.snippet || "—"}
            </div>
          </button>
        ))}
      </aside>

      {/* Active thread */}
      <section className="md:col-span-2 rounded-lg border bg-white p-4 flex flex-col">
        {!active ? (
          <div className="text-sm text-slate-500">
            Select a conversation to view messages.
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium">
                Conversation with {active.candidate}
              </div>
              <label className="text-xs text-slate-500 cursor-pointer">
                <input
                  type="checkbox"
                  className="mr-1 align-middle"
                  onChange={(e) => setIsTyping(e.target.checked)}
                />
                simulate typing
              </label>
            </div>

            <div
              ref={scrollRef}
              className="flex-1 border rounded p-3 text-sm text-slate-800 bg-slate-50 overflow-y-auto"
              style={{ minHeight: 280, maxHeight: 460 }}
            >
              {active.messages?.length ? (
                <ul className="space-y-2">
                  {active.messages.map((m) => (
                    <li
                      key={m.id}
                      className={`flex ${
                        m.from === "recruiter"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`px-3 py-2 rounded max-w-[80%] ${
                          m.from === "recruiter"
                            ? "bg-[#FF7043] text-white"
                            : "bg-white border"
                        }`}
                        title={tsFmt(m.ts)}
                      >
                        <div>{m.text}</div>
                        {m.from === "recruiter" && (
                          <div className="mt-1 text-[10px] opacity-80">
                            {m.status === "read" ? "Read" : "Sent"}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-slate-500">
                  No messages yet. Say hello!
                </div>
              )}
              {isTyping && (
                <div className="mt-2 flex justify-start">
                  <div className="px-3 py-2 rounded bg-white border text-slate-500 text-[13px]">
                    {active.candidate} is typing…
                  </div>
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center gap-2">
              <input
                className="flex-1 border rounded px-3 py-2 text-sm"
                placeholder="Type a message…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter")
                    handleSend();
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
              <button
                className="rounded border text-sm px-3 py-2"
                onClick={() => onInsertSavedReply?.(setDraft)}
                title="Insert saved reply"
              >
                Saved Replies
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
