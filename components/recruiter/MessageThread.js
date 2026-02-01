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
 * - threads: [{id, candidate, snippet, messages:[{id, from:'recruiter'|'candidate'|..., text, ts, status?:'sent'|'read'}], unread?: number}]
 * - initialThreadId?: number|string
 * - onSend?: (threadId, messageText) => void
 *
 * NEW (non-breaking defaults):
 * - persona?: string (default "recruiter")  // value used in messages[].from for "self"
 * - personaLabel?: string (default "Recruiter") // UI copy label
 * - otherLabel?: string (default "candidate")   // UI copy label (lowercase)
 * - inboxTitle?: string (default "Recruiter Inbox")
 * - inboxDescription?: ReactNode|string
 * - emptyTitle?: string
 * - emptyBody?: ReactNode|string
 * - emptyFootnote?: ReactNode|string
 * - inputPlaceholderEmpty?: string
 */
export default function MessageThread({
  threads = [],
  initialThreadId,
  onSend,

  // ✅ safe defaults keep recruiter behavior exactly as-is
  persona = "recruiter",
  personaLabel = "Recruiter",
  otherLabel = "candidate",
  inboxTitle = "Recruiter Inbox",
  inboxDescription,
  emptyTitle,
  emptyBody,
  emptyFootnote,
  inputPlaceholderEmpty,
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

  const hasThreads = threads.length > 0;
  const canCompose = hasThreads && !!active;

  // 🔁 Keep activeId in sync with initialThreadId / threads when they change
  useEffect(() => {
    const next = initialThreadId ?? threads[0]?.id ?? null;
    setActiveId((prev) => {
      // If we already have a valid activeId that still exists, keep it
      if (prev && threads.some((t) => t.id === prev)) {
        if (initialThreadId && prev !== initialThreadId) {
          return initialThreadId;
        }
        return prev;
      }
      return next;
    });
  }, [initialThreadId, threads]);

  // Auto-scroll to bottom when switching threads or adding messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeId, active?.messages?.length]);

  // Reset fake “typing” when thread changes
  useEffect(() => {
    let t;
    if (activeId) {
      t = setTimeout(() => setIsTyping(false), 0);
    }
    return () => clearTimeout(t);
  }, [activeId]);

  const handleSend = () => {
    const text = draft.trim();
    if (!text || !canCompose) return;
    onSend?.(active.id, text);
    setDraft("");
  };

  const defaultInboxDescription = (
    <>
      Conversations you start as a{" "}
      <span className="font-semibold">{personaLabel}</span> will show here.
      Personal DMs live in <span className="font-semibold">The Signal</span>.
    </>
  );

  const defaultEmptyTitle = `No ${persona.toLowerCase()} conversations yet`;

  const defaultEmptyBody = (
    <>
      This inbox is for conversations you start as{" "}
      <span className="font-semibold">{personaLabel}</span>. To begin, open a{" "}
      {otherLabel} card and choose to send a message as {personaLabel}. When{" "}
      {otherLabel}s reply, the full thread will appear here.
    </>
  );

  const defaultEmptyFootnote = (
    <>
      Personal one-to-one messages still flow through{" "}
      <span className="font-semibold">The Signal</span>. You pick your persona;
      the system routes each message to the right inbox.
    </>
  );

  const inputPlaceholder = hasThreads
    ? "Type a message…"
    : inputPlaceholderEmpty ||
      `Start from a ${otherLabel} card and choose ‘Send as ${personaLabel}’ to open a conversation.`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Threads list */}
      <aside className="md:col-span-1 rounded-lg border bg-white divide-y">
        {/* Header for clarity */}
        <div className="px-4 py-3 border-b bg-slate-50">
          <div className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
            {inboxTitle}
          </div>
          <p className="mt-1 text-[11px] text-slate-500 leading-snug">
            {inboxDescription || defaultInboxDescription}
          </p>
        </div>

        {!hasThreads && (
          <div className="px-4 py-6 text-sm text-slate-500">
            No conversations yet. Messages you send as{" "}
            <span className="font-semibold">{personaLabel}</span> will show up
            here.
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
              <div className="font-medium truncate">{t.candidate}</div>
              {t.unread ? (
                <span className="ml-2 text-[10px] px-1.5 py-[2px] rounded bg-emerald-100 text-emerald-700 border border-emerald-200">
                  {t.unread}
                </span>
              ) : null}
            </div>
            <div className="text-xs text-slate-500 truncate">
              {t.snippet || "No messages yet."}
            </div>
          </button>
        ))}
      </aside>

      {/* Active thread + composer */}
      <section className="md:col-span-2 rounded-lg border bg-white p-4 flex flex-col">
        {!hasThreads ? (
          // Global empty state when there are zero conversations
          <div className="flex-1 flex flex-col items-center justify-center text-center text-sm text-slate-500 space-y-2">
            <div className="text-base font-semibold text-slate-700">
              {emptyTitle || defaultEmptyTitle}
            </div>
            <p className="max-w-md text-xs text-slate-500">
              {emptyBody || defaultEmptyBody}
            </p>
            <p className="max-w-md text-[11px] text-slate-400">
              {emptyFootnote || defaultEmptyFootnote}
            </p>
          </div>
        ) : !active ? (
          <div className="flex-1 flex items-center justify-center text-sm text-slate-500">
            Select a conversation from the list to view messages.
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium">Conversation with {active.candidate}</div>
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
                  {active.messages.map((m) => {
                    const isSelf = m.from === persona;
                    return (
                      <li
                        key={m.id}
                        className={`flex ${isSelf ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`px-3 py-2 rounded max-w-[80%] ${
                            isSelf ? "bg-[#FF7043] text-white" : "bg-white border"
                          }`}
                          title={tsFmt(m.ts)}
                        >
                          <div>{m.text}</div>
                          {isSelf && (
                            <div className="mt-1 text-[10px] opacity-80">
                              {m.status === "read" ? "Read" : "Sent"}
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="text-slate-500">
                  No messages in this conversation yet. Start by saying hello.
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
          </>
        )}

        {/* Composer row — always visible, disabled when there is no active thread */}
        <div className="mt-3 flex items-center gap-2">
          <input
            className="flex-1 border rounded px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-400"
            placeholder={inputPlaceholder}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={!canCompose}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleSend();
            }}
          />
          <button
            className={`rounded text-sm px-3 py-2 ${
              canCompose
                ? "bg-black text-white"
                : "bg-slate-300 text-slate-600 cursor-not-allowed"
            }`}
            onClick={handleSend}
            disabled={!canCompose || !draft.trim()}
            title={
              canCompose
                ? "Ctrl/Cmd+Enter to send"
                : `Open a ${personaLabel.toLowerCase()} conversation to send`
            }
          >
            Send
          </button>
        </div>
      </section>
    </div>
  );
}
