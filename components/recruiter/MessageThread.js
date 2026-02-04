// components/recruiter/MessageThread.js
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

function tsFmt(ts) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "";
  }
}

function initials(name) {
  const s = String(name || "").trim();
  if (!s) return "?";
  const parts = s.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || "?";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return (a + b).toUpperCase();
}

function normId(v) {
  if (v === null || v === undefined) return null;
  return String(v);
}

/**
 * props:
 * - threads: [{id, candidate, snippet, messages:[{id, from:'recruiter'|'candidate'|..., text, ts, status?}], unread?: number, otherUserId?, otherAvatarUrl?}]
 * - initialThreadId?: number|string
 * - onSend?: (threadId, messageText) => void
 *
 * Existing optional props kept intact.
 *
 * NEW (non-breaking):
 * - onActiveThreadChange?: (thread) => void
 * - otherAvatarKey?: string (default "otherAvatarUrl")
 * - isBlocked?: boolean (default false)
 * - onDelete?: () => void
 * - onReport?: () => void
 * - onBlock?: () => void
 * - showHeaderActions?: boolean (default false)
 * - headerActionsLabel?: { delete?: string, report?: string, block?: string, blocked?: string }
 *
 * NEW (non-breaking via ref):
 * - ref exposes:
 *   - insertText(text, opts?: { mode?: 'append'|'replace', spacer?: string })
 *   - setDraftText(text)
 *   - focusComposer()
 */
const MessageThread = forwardRef(function MessageThread(
  {
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

    // ✅ new (safe)
    onActiveThreadChange,
    otherAvatarKey = "otherAvatarUrl",
    isBlocked = false,
    onDelete,
    onReport,
    onBlock,
    showHeaderActions = false,
    headerActionsLabel = {},
  },
  ref
) {
  // ✅ initial selection
  const [activeId, setActiveId] = useState(() => {
    const first = initialThreadId ?? threads[0]?.id ?? null;
    return normId(first);
  });

  // ✅ Track last initialThreadId so we only apply it when it actually changes
  const lastInitRef = useRef(normId(initialThreadId));

  const active = useMemo(() => {
    const a = normId(activeId);
    if (!a) return null;
    return threads.find((t) => normId(t.id) === a) || null;
  }, [threads, activeId]);

  const [draft, setDraft] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const hasThreads = threads.length > 0;
  const canCompose = hasThreads && !!active && !isBlocked;

  // ✅ expose safe imperative API for SavedReplies / prefill / etc.
  useImperativeHandle(
    ref,
    () => ({
      insertText: (text, opts = {}) => {
        const t = typeof text === "string" ? text : "";
        if (!t) return;

        const mode = opts.mode || "replace"; // default to replace to match expected "Insert"
        const spacer = typeof opts.spacer === "string" ? opts.spacer : " ";

        setDraft((prev) => {
          if (mode === "append") {
            const base = String(prev || "");
            if (!base.trim()) return t;
            return `${base}${spacer}${t}`;
          }
          // replace
          return t;
        });

        // focus after state update
        setTimeout(() => {
          try {
            inputRef.current?.focus?.();
          } catch {}
        }, 0);
      },
      setDraftText: (text) => {
        setDraft(typeof text === "string" ? text : "");
        setTimeout(() => {
          try {
            inputRef.current?.focus?.();
          } catch {}
        }, 0);
      },
      focusComposer: () => {
        try {
          inputRef.current?.focus?.();
        } catch {}
      },
    }),
    []
  );

  /**
   * 🔁 Sync rules (important):
   * - If initialThreadId changes (new deep-link), set active to it.
   * - Else, keep user-selected activeId as long as it still exists.
   * - If activeId is missing (e.g., after delete or refresh), fall back to first thread.
   */
  useEffect(() => {
    const initNorm = normId(initialThreadId);
    const lastInit = lastInitRef.current;

    const firstThreadId = normId(threads[0]?.id ?? null);

    // If initialThreadId changed, honor it exactly once
    if (initNorm && initNorm !== lastInit) {
      lastInitRef.current = initNorm;
      setActiveId(initNorm);
      return;
    }

    // If current activeId no longer exists, fall back
    const activeNorm = normId(activeId);
    const activeStillExists =
      activeNorm && threads.some((t) => normId(t.id) === activeNorm);

    if (!activeStillExists) {
      setActiveId(initNorm || firstThreadId || null);
    }
  }, [initialThreadId, threads, activeId]);

  // ✅ notify parent when active thread changes (for polling, actions, etc.)
  useEffect(() => {
    if (!onActiveThreadChange) return;
    if (!active) return;
    onActiveThreadChange(active);
  }, [activeId, active, onActiveThreadChange]);

  // Auto-scroll to bottom when switching threads or adding messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeId, active?.messages?.length]);

  // Reset fake “typing” when thread changes
  useEffect(() => {
    let t;
    if (activeId) t = setTimeout(() => setIsTyping(false), 0);
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
    ? isBlocked
      ? "You have blocked this member."
      : "Type a message…"
    : inputPlaceholderEmpty ||
      `Start from a ${otherLabel} card and choose ‘Send as ${personaLabel}’ to open a conversation.`;

  const deleteLabel = headerActionsLabel.delete || "Delete";
  const reportLabel = headerActionsLabel.report || "Report";
  const blockLabel = headerActionsLabel.block || "Block";
  const blockedLabel = headerActionsLabel.blocked || "Blocked";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Threads list */}
      <aside className="md:col-span-1 rounded-lg border bg-white divide-y">
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

        {threads.map((t) => {
          const avatarUrl = t?.[otherAvatarKey] || null;
          const name = t.candidate || "Conversation";
          const isActive = normId(t.id) === normId(activeId);

          return (
            <button
              key={normId(t.id) || t.id}
              onClick={() => setActiveId(normId(t.id))}
              className={`w-full text-left px-4 py-3 hover:bg-slate-50 focus:bg-slate-50 ${
                isActive ? "bg-slate-50" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={name}
                      className="w-9 h-9 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-slate-200 border border-slate-200 flex items-center justify-center text-[11px] font-bold text-slate-700">
                      {initials(name)}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium truncate">{name}</div>
                    {t.unread ? (
                      <span className="ml-2 text-[10px] px-1.5 py-[2px] rounded bg-emerald-100 text-emerald-700 border border-emerald-200">
                        {t.unread}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {t.snippet || "No messages yet."}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </aside>

      {/* Active thread + composer */}
      <section className="md:col-span-2 rounded-lg border bg-white p-4 flex flex-col">
        {!hasThreads ? (
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
            <div className="flex items-center justify-between mb-2 gap-2">
              <div className="font-medium truncate">
                Conversation with {active.candidate}
              </div>

              <div className="flex items-center gap-2">
                {showHeaderActions && (
                  <>
                    <button
                      type="button"
                      onClick={onDelete}
                      className="text-[11px] px-2 py-1 border border-slate-200 rounded-md text-slate-800 hover:bg-white"
                      disabled={!onDelete}
                    >
                      {deleteLabel}
                    </button>
                    <button
                      type="button"
                      onClick={onReport}
                      className="text-[11px] px-2 py-1 border border-slate-200 rounded-md text-slate-800 hover:bg-white"
                      disabled={!onReport}
                    >
                      {reportLabel}
                    </button>
                    <button
                      type="button"
                      onClick={onBlock}
                      className="text-[11px] px-2 py-1 border border-red-200 rounded-md text-red-700 hover:bg-red-50"
                      disabled={!onBlock || isBlocked}
                    >
                      {isBlocked ? blockedLabel : blockLabel}
                    </button>
                  </>
                )}

                <label className="text-xs text-slate-500 cursor-pointer whitespace-nowrap">
                  <input
                    type="checkbox"
                    className="mr-1 align-middle"
                    onChange={(e) => setIsTyping(e.target.checked)}
                  />
                  simulate typing
                </label>
              </div>
            </div>

            {isBlocked && (
              <div className="mb-2 text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                You have blocked this member. You will not be able to send new
                messages.
              </div>
            )}

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
                        className={`flex ${
                          isSelf ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`flex items-end gap-2 ${
                            isSelf ? "flex-row-reverse" : ""
                          }`}
                        >
                          {!isSelf && (
                            <div className="flex-shrink-0">
                              {active?.[otherAvatarKey] ? (
                                <img
                                  src={active[otherAvatarKey]}
                                  alt={active.candidate}
                                  className="w-7 h-7 rounded-full object-cover border border-slate-200"
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-slate-200 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700">
                                  {initials(active.candidate)}
                                </div>
                              )}
                            </div>
                          )}

                          <div
                            className={`px-3 py-2 rounded max-w-[80%] ${
                              isSelf
                                ? "bg-[#FF7043] text-white"
                                : "bg-white border"
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

        {/* Composer */}
        <div className="mt-3 flex items-center gap-2">
          <input
            ref={inputRef}
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
                : isBlocked
                ? "Blocked"
                : `Open a ${personaLabel.toLowerCase()} conversation to send`
            }
          >
            Send
          </button>
        </div>
      </section>
    </div>
  );
});

export default MessageThread;
