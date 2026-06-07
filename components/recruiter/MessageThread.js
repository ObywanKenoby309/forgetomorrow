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

/* ─── Kebab menu for moderation actions ─────────────────────────────────── */
function KebabMenu({ onDelete, onReport, onBlock, isBlocked, labels = {} }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          border: "1px solid rgba(15,23,42,0.10)",
          background: "white",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
          color: "#64748B",
          flexShrink: 0,
        }}
        title="More actions"
      >
        ⋮
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            zIndex: 50,
            background: "white",
            border: "1px solid rgba(15,23,42,0.10)",
            borderRadius: 10,
            boxShadow: "0 8px 24px rgba(15,23,42,0.14)",
            minWidth: 140,
            overflow: "hidden",
          }}
        >
          {onDelete && (
            <button
              type="button"
              onClick={() => { setOpen(false); onDelete(); }}
              style={{
                display: "block", width: "100%", textAlign: "left",
                padding: "9px 14px", fontSize: 13, color: "#334155",
                background: "none", border: "none", cursor: "pointer",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#F8FAFC"}
              onMouseLeave={(e) => e.currentTarget.style.background = "none"}
            >
              {labels.delete || "Delete"}
            </button>
          )}
          {onReport && (
            <button
              type="button"
              onClick={() => { setOpen(false); onReport(); }}
              style={{
                display: "block", width: "100%", textAlign: "left",
                padding: "9px 14px", fontSize: 13, color: "#334155",
                background: "none", border: "none", cursor: "pointer",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#F8FAFC"}
              onMouseLeave={(e) => e.currentTarget.style.background = "none"}
            >
              {labels.report || "Report"}
            </button>
          )}
          {onBlock && (
            <button
              type="button"
              onClick={() => { setOpen(false); onBlock(); }}
              disabled={isBlocked}
              style={{
                display: "block", width: "100%", textAlign: "left",
                padding: "9px 14px", fontSize: 13,
                color: isBlocked ? "#94A3B8" : "#DC2626",
                background: "none", border: "none",
                cursor: isBlocked ? "default" : "pointer",
                borderTop: "1px solid rgba(15,23,42,0.06)",
              }}
              onMouseEnter={(e) => { if (!isBlocked) e.currentTarget.style.background = "#FEF2F2"; }}
              onMouseLeave={(e) => e.currentTarget.style.background = "none"}
            >
              {isBlocked ? (labels.blocked || "Blocked") : (labels.block || "Block")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Props — all original props preserved, layout restructured.
 *
 * threads: [{id, candidate, snippet, messages:[{id, from, text, ts, status?}], unread?, otherUserId?, otherAvatarUrl?}]
 * initialThreadId?: number|string
 * onSend?: (threadId, messageText) => void
 * onActiveThreadChange?: (thread) => void
 * otherAvatarKey?: string (default "otherAvatarUrl")
 * isBlocked?: boolean
 * onDelete?: () => void
 * onReport?: () => void
 * onBlock?: () => void
 * showHeaderActions?: boolean
 * headerActionsLabel?: { delete?, report?, block?, blocked? }
 * onSetHome?: (homeLocation: string) => void
 * activeHomeLocation?: string
 * movingHome?: boolean
 * inboxAction?: ReactNode
 * hideInboxDescription?: boolean
 * hideThreadSnippets?: boolean
 * onOpenSavedReplies?: () => void
 * showInboxToolButtons?: boolean
 * savedRepliesLabel?: string
 * ref exposes: insertText(), setDraftText(), focusComposer()
 */
const MessageThread = forwardRef(function MessageThread(
  {
    threads = [],
    initialThreadId,
    onSend,

    persona = "recruiter",
    personaLabel = "Recruiter",
    otherLabel = "candidate",
    inboxTitle = "Recruiter Inbox",
    inboxDescription,
    emptyTitle,
    emptyBody,
    emptyFootnote,
    inputPlaceholderEmpty,

    onActiveThreadChange,
    otherAvatarKey = "otherAvatarUrl",
    isBlocked = false,
    onDelete,
    onReport,
    onBlock,
    showHeaderActions = false,
    headerActionsLabel = {},
    onSetHome,
    activeHomeLocation,
    movingHome = false,

    inboxAction = null,
    hideInboxDescription = false,
    hideThreadSnippets = false,
    onOpenSavedReplies,
    showInboxToolButtons = false,
    savedRepliesLabel = "Saved Replies",
  },
  ref
) {
  const [activeId, setActiveId] = useState(() => {
    const first = initialThreadId ?? threads[0]?.id ?? null;
    return normId(first);
  });

  const lastInitRef = useRef(normId(initialThreadId));

  const active = useMemo(() => {
    const a = normId(activeId);
    if (!a) return null;
    return threads.find((t) => normId(t.id) === a) || null;
  }, [threads, activeId]);

  const [draft, setDraft] = useState("");
  const [typingUsers, setTypingUsers] = useState([]);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const lastTypingSentRef = useRef(0);
  const typingStopTimerRef = useRef(null);

  const hasThreads = threads.length > 0;
  const canCompose = hasThreads && !!active && !isBlocked;

  const professionalHomeLocation = persona === "coach"
    ? "coach"
    : persona === "recruiter"
    ? "recruiter"
    : null;

  const professionalHomeLabel = persona === "coach"
    ? "Coach Inbox"
    : persona === "recruiter"
    ? "Recruiter Inbox"
    : "Professional Inbox";

  useImperativeHandle(ref, () => ({
    insertText: (text, opts = {}) => {
      const t = typeof text === "string" ? text : "";
      if (!t) return;
      const mode = opts.mode || "replace";
      const spacer = typeof opts.spacer === "string" ? opts.spacer : " ";
      setDraft((prev) => {
        if (mode === "append") {
          const base = String(prev || "");
          if (!base.trim()) return t;
          return `${base}${spacer}${t}`;
        }
        return t;
      });
      setTimeout(() => { try { inputRef.current?.focus?.(); } catch {} }, 0);
    },
    setDraftText: (text) => {
      setDraft(typeof text === "string" ? text : "");
      setTimeout(() => { try { inputRef.current?.focus?.(); } catch {} }, 0);
    },
    focusComposer: () => { try { inputRef.current?.focus?.(); } catch {} },
  }), []);

  useEffect(() => {
    const initNorm = normId(initialThreadId);
    const lastInit = lastInitRef.current;
    const firstThreadId = normId(threads[0]?.id ?? null);
    if (initNorm && initNorm !== lastInit) {
      lastInitRef.current = initNorm;
      setActiveId(initNorm);
      return;
    }
    const activeNorm = normId(activeId);
    const activeStillExists = activeNorm && threads.some((t) => normId(t.id) === activeNorm);
    if (!activeStillExists) setActiveId(initNorm || firstThreadId || null);
  }, [initialThreadId, threads, activeId]);

  useEffect(() => {
    if (!onActiveThreadChange || !active) return;
    onActiveThreadChange(active);
  }, [activeId, active, onActiveThreadChange]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeId, active?.messages?.length]);

  const clearTypingState = useMemo(() => {
    return async (conversationId) => {
      if (!conversationId) return;
      try {
        await fetch("/api/signal/typing", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId }),
        });
      } catch {
        // Typing state is non-critical; never block messaging UI.
      }
    };
  }, []);

  const sendTypingHeartbeat = useMemo(() => {
    return async (conversationId) => {
      if (!conversationId) return;
      const now = Date.now();
      if (now - lastTypingSentRef.current < 1500) return;
      lastTypingSentRef.current = now;

      try {
        await fetch("/api/signal/typing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId }),
        });
      } catch {
        // Typing state is non-critical; never block composer input.
      }
    };
  }, []);

  const handleDraftChange = (value) => {
    setDraft(value);

    if (!active?.id || !canCompose) return;

    if (!String(value || "").trim()) {
      if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);
      typingStopTimerRef.current = null;
      clearTypingState(active.id);
      return;
    }

    sendTypingHeartbeat(active.id);

    if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);
    typingStopTimerRef.current = setTimeout(() => {
      clearTypingState(active.id);
    }, 3500);
  };

  // Poll typing status for the active conversation.
  useEffect(() => {
    if (!active?.id) {
      setTypingUsers([]);
      return;
    }

    let cancelled = false;

    const fetchTypingUsers = async () => {
      try {
        const res = await fetch(`/api/signal/typing?conversationId=${encodeURIComponent(active.id)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setTypingUsers(Array.isArray(data.typingUsers) ? data.typingUsers : []);
        }
      } catch {
        if (!cancelled) setTypingUsers([]);
      }
    };

    fetchTypingUsers();
    const interval = setInterval(fetchTypingUsers, 1500);

    return () => {
      cancelled = true;
      clearInterval(interval);
      setTypingUsers([]);
    };
  }, [active?.id]);

  // Clear local typing state when switching threads or unmounting.
  useEffect(() => {
    return () => {
      if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);
      if (active?.id) clearTypingState(active.id);
    };
  }, [active?.id, clearTypingState]);

  const handleSend = () => {
    const text = draft.trim();
    if (!text || !canCompose) return;
    if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);
    typingStopTimerRef.current = null;
    clearTypingState(active.id);
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
      : "Write a message… (Enter to send, Shift+Enter for new line)"
    : inputPlaceholderEmpty ||
      `Start from a ${otherLabel} card and choose 'Send as ${personaLabel}' to open a conversation.`;

  const inboxToolButtonStyle =
    "inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

      {/* ── Left: Thread list ── */}
      <aside className="md:col-span-1 rounded-lg border bg-white divide-y overflow-hidden">
        <div className="px-4 py-3 border-b bg-slate-50">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-semibold tracking-wide text-slate-600 uppercase whitespace-nowrap">
              {inboxTitle}
            </div>
            <div className="flex items-center gap-2 justify-end">
              {!!inboxAction && inboxAction}
              {showInboxToolButtons && !!onOpenSavedReplies && (
                <button type="button" onClick={onOpenSavedReplies} className={inboxToolButtonStyle}>
                  {savedRepliesLabel}
                </button>
              )}
            </div>
          </div>
          {!hideInboxDescription && (
            <p className="mt-1 text-[11px] text-slate-500 leading-snug">
              {inboxDescription || defaultInboxDescription}
            </p>
          )}
        </div>

        {!hasThreads && (
          <div className="px-4 py-6 text-sm text-slate-500">
            No conversations yet. Messages you send as{" "}
            <span className="font-semibold">{personaLabel}</span> will show up here.
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
              className={`w-full text-left px-4 py-3 hover:bg-slate-50 focus:bg-slate-50 ${isActive ? "bg-slate-50" : ""}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={name} className="w-9 h-9 rounded-full object-cover border border-slate-200" />
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
                  {!hideThreadSnippets && (
                    <div className="text-xs text-slate-500 truncate">
                      {t.snippet || "No messages yet."}
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </aside>

      {/* ── Right: Active thread ── */}
      <section className="md:col-span-2 rounded-lg border bg-white flex flex-col overflow-hidden">
        {!hasThreads ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-sm text-slate-500 space-y-2 p-6">
            <div className="text-base font-semibold text-slate-700">
              {emptyTitle || defaultEmptyTitle}
            </div>
            <p className="max-w-md text-xs text-slate-500">{emptyBody || defaultEmptyBody}</p>
            <p className="max-w-md text-[11px] text-slate-400">{emptyFootnote || defaultEmptyFootnote}</p>
          </div>
        ) : !active ? (
          <div className="flex-1 flex items-center justify-center text-sm text-slate-500 p-6">
            Select a conversation from the list to view messages.
          </div>
        ) : (
          <>
            {/* ── Thread header: avatar + name left, move control + kebab right ── */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 16px",
                borderBottom: "1px solid rgba(15,23,42,0.08)",
                flexShrink: 0,
              }}
            >
              {/* Avatar */}
              {active[otherAvatarKey] ? (
                <img
                  src={active[otherAvatarKey]}
                  alt={active.candidate}
                  style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", border: "1.5px solid rgba(255,255,255,0.7)", flexShrink: 0 }}
                />
              ) : (
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: "linear-gradient(135deg, #FF7043 0%, #FF8A65 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 800, color: "white", flexShrink: 0,
                }}>
                  {initials(active.candidate)}
                </div>
              )}

              {/* Name */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {active.candidate}
                </div>
              </div>

              {/* Right controls: move pills + kebab */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                {/* Move control */}
                {onSetHome && (
                  <>
                    <button
                      type="button"
                      disabled={movingHome || activeHomeLocation === "seeker"}
                      onClick={() => onSetHome("seeker")}
                      style={{
                        fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 8,
                        border: `1px solid ${activeHomeLocation === "seeker" ? "#FF7043" : "rgba(15,23,42,0.12)"}`,
                        background: activeHomeLocation === "seeker" ? "rgba(255,112,67,0.08)" : "white",
                        color: activeHomeLocation === "seeker" ? "#FF7043" : "#64748B",
                        cursor: activeHomeLocation === "seeker" ? "default" : "pointer",
                        opacity: movingHome ? 0.5 : 1,
                        transition: "all 0.15s",
                      }}
                    >
                      Spark{activeHomeLocation === "seeker" ? " ✓" : ""}
                    </button>
                    {professionalHomeLocation && (
                      <button
                        type="button"
                        disabled={movingHome || activeHomeLocation === professionalHomeLocation}
                        onClick={() => onSetHome(professionalHomeLocation)}
                        style={{
                          fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 8,
                          border: `1px solid ${activeHomeLocation === professionalHomeLocation ? "#FF7043" : "rgba(15,23,42,0.12)"}`,
                          background: activeHomeLocation === professionalHomeLocation ? "rgba(255,112,67,0.08)" : "white",
                          color: activeHomeLocation === professionalHomeLocation ? "#FF7043" : "#64748B",
                          cursor: activeHomeLocation === professionalHomeLocation ? "default" : "pointer",
                          opacity: movingHome ? 0.5 : 1,
                          transition: "all 0.15s",
                        }}
                      >
                        {professionalHomeLabel}{activeHomeLocation === professionalHomeLocation ? " ✓" : ""}
                      </button>
                    )}
                  </>
                )}

                {/* Kebab */}
                {showHeaderActions && (
                  <KebabMenu
                    onDelete={onDelete}
                    onReport={onReport}
                    onBlock={onBlock}
                    isBlocked={isBlocked}
                    labels={headerActionsLabel}
                  />
                )}
              </div>
            </div>

            {isBlocked && (
              <div className="mx-4 mt-3 text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                You have blocked this member. You will not be able to send new messages.
              </div>
            )}

            {/* ── Messages ── */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4"
              style={{ minHeight: 280, maxHeight: 460 }}
            >
              {active.messages?.length ? (
                <ul className="space-y-3">
                  {active.messages.map((m) => {
                    const isSelf = m.from === persona;
                    return (
                      <li key={m.id} className={`flex ${isSelf ? "justify-end" : "justify-start"}`}>
                        <div className={`flex items-end gap-2 ${isSelf ? "flex-row-reverse" : ""}`}>
                          {!isSelf && (
                            <div className="flex-shrink-0">
                              {active?.[otherAvatarKey] ? (
                                <img src={active[otherAvatarKey]} alt={active.candidate} className="w-7 h-7 rounded-full object-cover border border-slate-200" />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-slate-200 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700">
                                  {initials(active.candidate)}
                                </div>
                              )}
                            </div>
                          )}
                          <div
                            className={`px-3 py-2 rounded-2xl max-w-[80%] text-sm ${isSelf ? "text-white" : "bg-white border border-slate-100 text-slate-800"}`}
                            style={isSelf ? { background: "linear-gradient(135deg, #FF7043 0%, #FF8A65 100%)", boxShadow: "0 2px 8px rgba(255,112,67,0.25)" } : { boxShadow: "0 1px 4px rgba(15,23,42,0.07)" }}
                            title={tsFmt(m.ts)}
                          >
                            <div>{m.text}</div>
                            {isSelf && (
                              <div className="mt-1 text-[10px] opacity-75 text-right">
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
                <div className="text-sm text-slate-400 text-center mt-8">
                  No messages yet. Start by saying hello.
                </div>
              )}

              {typingUsers.length > 0 && (
                <div className="mt-3 flex justify-start">
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 11px",
                      borderRadius: 999,
                      background: "rgba(248,250,252,0.95)",
                      border: "1px solid rgba(226,232,240,0.95)",
                      color: "#64748B",
                      fontSize: 12,
                      fontWeight: 600,
                      boxShadow: "0 1px 4px rgba(15,23,42,0.06)",
                    }}
                  >
                    <span>
                      {typingUsers.length === 1
                        ? `${typingUsers[0]?.name || active.candidate || "They"} is typing`
                        : "Multiple people are typing"}
                    </span>
                    <span className="typing-dots" aria-hidden="true">
                      <span></span>
                      <span></span>
                      <span></span>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* ── Composer ── */}
            <div style={{ padding: "12px 16px 14px", borderTop: "1px solid rgba(15,23,42,0.07)", flexShrink: 0 }}>
              <div
                style={{
                  border: "1.5px solid rgba(15,23,42,0.12)",
                  borderRadius: 14,
                  background: "white",
                  boxShadow: "0 2px 12px rgba(15,23,42,0.07)",
                  overflow: "hidden",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                }}
                onFocusCapture={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,112,67,0.5)";
                  e.currentTarget.style.boxShadow = "0 2px 16px rgba(255,112,67,0.12)";
                }}
                onBlurCapture={(e) => {
                  e.currentTarget.style.borderColor = "rgba(15,23,42,0.12)";
                  e.currentTarget.style.boxShadow = "0 2px 12px rgba(15,23,42,0.07)";
                }}
              >
                <textarea
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => handleDraftChange(e.target.value)}
                  placeholder={inputPlaceholder}
                  disabled={!canCompose}
                  onInput={(e) => {
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 180) + "px";
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  style={{
                    width: "100%",
                    resize: "none",
                    border: "none",
                    outline: "none",
                    padding: "12px 14px 8px",
                    fontSize: 13,
                    fontFamily: "inherit",
                    color: "#334155",
                    background: "transparent",
                    lineHeight: 1.55,
                    minHeight: 72,
                    maxHeight: 180,
                    overflowY: "auto",
                    boxSizing: "border-box",
                    display: "block",
                  }}
                />
                {/* Composer footer */}
                <div style={{
                  display: "flex", alignItems: "center",
                  justifyContent: "space-between",
                  padding: "6px 10px 8px",
                  borderTop: "1px solid rgba(15,23,42,0.06)",
                }}>
                  <span style={{ fontSize: 11, color: "#64748B", fontWeight: 500 }}>
                    Typing indicator sends automatically
                  </span>
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!canCompose || !draft.trim()}
                    style={{
                      background: canCompose && draft.trim()
                        ? "linear-gradient(135deg, #FF7043 0%, #FF8A65 100%)"
                        : "rgba(15,23,42,0.08)",
                      color: canCompose && draft.trim() ? "white" : "#94A3B8",
                      border: "none",
                      borderRadius: 10,
                      padding: "7px 20px",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: canCompose && draft.trim() ? "pointer" : "not-allowed",
                      transition: "all 0.15s",
                      boxShadow: canCompose && draft.trim() ? "0 2px 8px rgba(255,112,67,0.3)" : "none",
                    }}
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
        <style jsx>{`
          .typing-dots {
            display: inline-flex;
            gap: 3px;
            align-items: center;
          }
          .typing-dots span {
            width: 4px;
            height: 4px;
            border-radius: 999px;
            background: #94A3B8;
            animation: typing-dot 1.1s infinite ease-in-out;
          }
          .typing-dots span:nth-child(2) {
            animation-delay: 0.16s;
          }
          .typing-dots span:nth-child(3) {
            animation-delay: 0.32s;
          }
          @keyframes typing-dot {
            0%, 80%, 100% { opacity: 0.35; transform: translateY(0); }
            40% { opacity: 1; transform: translateY(-2px); }
          }
        `}</style>
      </section>
    </div>
  );
});

export default MessageThread;