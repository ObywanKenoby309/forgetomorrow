// components/recruiter/RecruiterMessageCenter.js
// Standalone recruiter messaging UI.
// Left panel: grouped tree (Candidates by job, Talent Pools).
// Right panel: conversation thread for the selected candidate.
// Conversation is only created when the recruiter sends the first message.

import { useState, useEffect, useRef, useCallback } from "react";
import CandidateActionsMenu from "./CandidateActionsMenu";
import BulkMessageModal from "./BulkMessageModal";
import SavedReplies from "./SavedReplies";

/* ─────────────────────────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────────────────────────── */
const ORANGE = "#FF7043";
const SLATE = "#334155";
const MUTED = "#64748B";
const LIGHT_MUTED = "#94A3B8";
const SURFACE = "rgba(255,255,255,0.97)";
const BORDER = "rgba(15,23,42,0.08)";
const SELECTED_BG = "rgba(255,112,67,0.08)";
const SELECTED_BORDER = "rgba(255,112,67,0.35)";
const ARCHIVED_BG = "rgba(100,116,139,0.06)";

const GLASS = {
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.22)",
  background: "rgba(255,255,255,0.68)",
  boxShadow: "0 10px 28px rgba(15,23,42,0.12)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
};

const WHITE_CARD = {
  background: SURFACE,
  border: `1px solid ${BORDER}`,
  borderRadius: 14,
  boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
  boxSizing: "border-box",
};

/* ─────────────────────────────────────────────────────────────
   AVATAR
───────────────────────────────────────────────────────────── */
function Avatar({ src, name, size = 34 }) {
  const initials = (name || "?")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
          border: "1.5px solid rgba(255,255,255,0.7)",
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #FF7043 0%, #FF8A65 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.36,
        fontWeight: 800,
        color: "white",
        flexShrink: 0,
        letterSpacing: "-0.02em",
      }}
    >
      {initials}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   SECTION HEADER (Candidates / Talent Pools)
───────────────────────────────────────────────────────────── */
function SectionHeader({ label, count, expanded, onToggle }) {
  return (
    <button type="button"
      onClick={onToggle}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        padding: "8px 12px",
        background: "none",
        border: "none",
        cursor: "pointer",
        borderRadius: 8,
        userSelect: "none",
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          color: SLATE,
        }}
      >
        {label}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {count > 0 && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "white",
              background: ORANGE,
              borderRadius: 99,
              padding: "1px 6px",
              lineHeight: 1.6,
            }}
          >
            {count}
          </span>
        )}
        <span style={{ fontSize: 10, color: LIGHT_MUTED, lineHeight: 1 }}>
          {expanded ? "▲" : "▼"}
        </span>
      </div>
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────
   GROUP ROW (job posting or talent pool name)
───────────────────────────────────────────────────────────── */
function GroupRow({ label, count, archived, expanded, onToggle }) {
  return (
    <button type="button"
      onClick={onToggle}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        padding: "6px 12px 6px 20px",
        background: archived ? ARCHIVED_BG : "none",
        border: "none",
        cursor: "pointer",
        borderRadius: 8,
        userSelect: "none",
        gap: 8,
      }}
    >
      <span
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: archived ? MUTED : SLATE,
          textAlign: "left",
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {label}
        {archived && (
          <span
            style={{
              marginLeft: 6,
              fontSize: 10,
              fontWeight: 600,
              color: LIGHT_MUTED,
              background: "rgba(100,116,139,0.12)",
              borderRadius: 4,
              padding: "1px 5px",
            }}
          >
            Archived
          </span>
        )}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        {count > 0 && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: archived ? MUTED : ORANGE,
              background: archived ? "rgba(100,116,139,0.1)" : "rgba(255,112,67,0.1)",
              borderRadius: 99,
              padding: "1px 6px",
              lineHeight: 1.6,
            }}
          >
            {count}
          </span>
        )}
        <span style={{ fontSize: 9, color: LIGHT_MUTED }}>
          {expanded ? "▲" : "▼"}
        </span>
      </div>
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────
   CANDIDATE ROW
───────────────────────────────────────────────────────────── */
function CandidateRow({ candidate, selected, onSelect }) {
  const hasUnread = (candidate.unread || 0) > 0;

  return (
    <button type="button"
      onClick={() => onSelect(candidate)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        padding: "7px 12px 7px 28px",
        background: selected ? SELECTED_BG : "none",
        border: "none",
        borderLeft: selected
          ? `3px solid ${ORANGE}`
          : "3px solid transparent",
        cursor: "pointer",
        borderRadius: "0 8px 8px 0",
        userSelect: "none",
        textAlign: "left",
        transition: "background 0.15s",
      }}
    >
      <Avatar src={candidate.avatarUrl} name={candidate.name} size={30} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: hasUnread ? 800 : 600,
            color: selected ? ORANGE : SLATE,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {candidate.name}
        </div>
        {candidate.headline && (
          <div
            style={{
              fontSize: 11,
              color: MUTED,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              marginTop: 1,
            }}
          >
            {candidate.headline}
          </div>
        )}
      </div>
      {hasUnread && (
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: "white",
            background: ORANGE,
            borderRadius: 99,
            padding: "1px 6px",
            flexShrink: 0,
          }}
        >
          {candidate.unread}
        </span>
      )}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────
   LEFT PANEL
───────────────────────────────────────────────────────────── */
function LeftPanel({ jobGroups, talentPoolGroups, selectedCandidate, onSelectCandidate, threadUnreadMap }) {
  const [candidatesExpanded, setCandidatesExpanded] = useState(true);
  const [poolsExpanded, setPoolsExpanded] = useState(true);

  // Track which groups are expanded — default all active open, archived closed
  const [expandedGroups, setExpandedGroups] = useState(() => {
    const init = {};
    for (const g of jobGroups || []) {
      init[g.id] = g.status === "active";
    }
    for (const p of talentPoolGroups || []) {
      init[p.id] = true;
    }
    return init;
  });

  const toggleGroup = (id) =>
    setExpandedGroups((prev) => ({ ...prev, [id]: !prev[id] }));

  const totalCandidates = (jobGroups || []).reduce(
    (sum, g) => sum + (g.candidateCount || 0),
    0
  );
  const totalPoolMembers = (talentPoolGroups || []).reduce(
    (sum, p) => sum + (p.memberCount || 0),
    0
  );

  return (
    <div
      style={{
        width: 260,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        borderRight: `1px solid ${BORDER}`,
        overflowY: "auto",
        paddingTop: 8,
        paddingBottom: 12,
      }}
    >
      {/* ── Candidates section ── */}
      <SectionHeader
        label="Candidates"
        count={totalCandidates}
        expanded={candidatesExpanded}
        onToggle={() => setCandidatesExpanded((v) => !v)}
      />

      {candidatesExpanded && (
        <div style={{ marginBottom: 4 }}>
          {(jobGroups || []).length === 0 && (
            <div style={{ padding: "6px 20px", fontSize: 12, color: LIGHT_MUTED }}>
              No job groups yet
            </div>
          )}
          {(jobGroups || []).map((group) => {
            const archived = group.status !== "active";
            const isExpanded = !!expandedGroups[group.id];

            return (
              <div key={group.id}>
                <GroupRow
                  label={group.name}
                  count={group.candidateCount || 0}
                  archived={archived}
                  expanded={isExpanded}
                  onToggle={() => toggleGroup(group.id)}
                />
                {isExpanded && (
                  <div>
                    {(group.candidates || []).length === 0 && (
                      <div
                        style={{
                          padding: "4px 28px",
                          fontSize: 11,
                          color: LIGHT_MUTED,
                        }}
                      >
                        No candidates yet
                      </div>
                    )}
                    {(group.candidates || []).map((candidate) => {
                      const unread = threadUnreadMap?.[String(candidate.userId)] || 0;
                      return (
                        <CandidateRow
                          key={candidate.userId}
                          candidate={{ ...candidate, unread }}
                          selected={
                            selectedCandidate?.userId === candidate.userId &&
                            selectedCandidate?.jobGroupId === candidate.jobGroupId
                          }
                          onSelect={onSelectCandidate}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Divider ── */}
      <div style={{ height: 1, background: BORDER, margin: "8px 12px" }} />

      {/* ── Talent Pools section ── */}
      <SectionHeader
        label="Talent Pools"
        count={totalPoolMembers}
        expanded={poolsExpanded}
        onToggle={() => setPoolsExpanded((v) => !v)}
      />

      {poolsExpanded && (
        <div style={{ marginBottom: 4 }}>
          {(talentPoolGroups || []).length === 0 && (
            <div style={{ padding: "6px 20px", fontSize: 12, color: LIGHT_MUTED }}>
              No talent pools yet
            </div>
          )}
          {(talentPoolGroups || []).map((pool) => {
            const isExpanded = !!expandedGroups[pool.id];

            return (
              <div key={pool.id}>
                <GroupRow
                  label={pool.name}
                  count={pool.memberCount || 0}
                  archived={false}
                  expanded={isExpanded}
                  onToggle={() => toggleGroup(pool.id)}
                />
                {isExpanded && (
                  <div>
                    {(pool.members || []).length === 0 && (
                      <div
                        style={{
                          padding: "4px 28px",
                          fontSize: 11,
                          color: LIGHT_MUTED,
                        }}
                      >
                        No members yet
                      </div>
                    )}
                    {(pool.members || []).map((member) => {
                      const unread = threadUnreadMap?.[String(member.userId)] || 0;
                      return (
                        <CandidateRow
                          key={member.userId}
                          candidate={{ ...member, unread }}
                          selected={
                            selectedCandidate?.userId === member.userId &&
                            selectedCandidate?.poolId === member.poolId
                          }
                          onSelect={onSelectCandidate}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MESSAGE BUBBLE
───────────────────────────────────────────────────────────── */
function MessageBubble({ message, isRecruiter }) {
  const time = message.ts
    ? new Date(message.ts).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })
    : "";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isRecruiter ? "flex-end" : "flex-start",
        marginBottom: 10,
      }}
    >
      <div style={{ maxWidth: "72%", display: "flex", flexDirection: "column", alignItems: isRecruiter ? "flex-end" : "flex-start" }}>
        <div
          style={{
            background: isRecruiter
              ? "linear-gradient(135deg, #FF7043 0%, #FF8A65 100%)"
              : "rgba(241,245,249,1)",
            color: isRecruiter ? "white" : SLATE,
            borderRadius: isRecruiter ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
            padding: "9px 13px",
            fontSize: 13,
            lineHeight: 1.5,
            boxShadow: isRecruiter
              ? "0 2px 8px rgba(255,112,67,0.25)"
              : "0 1px 4px rgba(15,23,42,0.07)",
          }}
        >
          {message.text}
        </div>
        <div style={{ fontSize: 10, color: LIGHT_MUTED, marginTop: 3 }}>{time}</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   RIGHT PANEL
───────────────────────────────────────────────────────────── */
function RightPanel({ candidate, messages, onSend, sending, isArchived, currentUserId, activeConversationId, onArchiveMine, onArchiveOrg }) {
  const [draft, setDraft] = useState("");
  const [showTyping, setShowTyping] = useState(false);
  const [savedRepliesOpen, setSavedRepliesOpen] = useState(false);
  const messagesContainerRef = useRef(null);
  const textareaRef = useRef(null);
  useEffect(() => {
  if (messagesContainerRef.current) {
    messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
  }
}, [messages]);

  // Reset draft when candidate changes
  useEffect(() => {
    setDraft("");
  }, [candidate?.userId]);

  const handleSend = () => {
    const trimmed = draft.trim();
    if (!trimmed || sending || isArchived) return;
    onSend(trimmed);
    setDraft("");
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Empty state
  if (!candidate) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 10,
          color: LIGHT_MUTED,
        }}
      >
        <div style={{ fontSize: 36 }}>💬</div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>
          Select a candidate to start a conversation
        </div>
        <div style={{ fontSize: 12 }}>
          Choose from Candidates or Talent Pools on the left
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        minHeight: 0,
      }}
    >
      {/* ── Thread header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 16px",
          borderBottom: `1px solid ${BORDER}`,
          flexShrink: 0,
        }}
      >
        <Avatar src={candidate.avatarUrl} name={candidate.name} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: SLATE,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {candidate.name}
          </div>
          <div style={{ fontSize: 11, color: MUTED, marginTop: 1 }}>
            {candidate.jobGroupName || candidate.poolName || ""}
            {isArchived && (
              <span
                style={{
                  marginLeft: 8,
                  fontSize: 10,
                  fontWeight: 600,
                  color: LIGHT_MUTED,
                  background: "rgba(100,116,139,0.12)",
                  borderRadius: 4,
                  padding: "1px 5px",
                }}
              >
                Archived posting
              </span>
            )}
          </div>
        </div>
        <CandidateActionsMenu
          candidate={candidate}
          conversationId={activeConversationId}
          context="messaging"
          onArchiveMine={onArchiveMine}
          onArchiveOrg={onArchiveOrg}
          buttonStyle={{ marginRight: 0 }}
        />
      </div>

      {/* ── Messages ── */}
      <div
	    ref={messagesContainerRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {messages.length === 0 && !isArchived && (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: 8,
              color: LIGHT_MUTED,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600 }}>
              No messages yet
            </div>
            <div style={{ fontSize: 12 }}>
              Send a message to start the conversation
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <MessageBubble
            key={msg.id || i}
            message={msg}
            isRecruiter={msg.from === "recruiter" || msg.senderId === currentUserId}
          />
        ))}
      </div>

      {/* ── Composer or archived notice ── */}
      {isArchived ? (
        <div
          style={{
            padding: "14px 16px",
            borderTop: `1px solid ${BORDER}`,
            background: ARCHIVED_BG,
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 14 }}>🔒</span>
          <span style={{ fontSize: 13, color: MUTED, fontWeight: 600 }}>
            This posting is closed. Conversations are read-only.
          </span>
        </div>
      ) : (
        <div
          style={{
            padding: "12px 16px",
            borderTop: `1px solid ${BORDER}`,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            flexShrink: 0,
          }}
        >
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", width: "fit-content" }}>
            <input
              type="checkbox"
              checked={showTyping}
              onChange={(e) => setShowTyping(e.target.checked)}
              style={{ accentColor: ORANGE, cursor: "pointer" }}
            />
            <span style={{ fontSize: 11, color: MUTED, fontWeight: 600 }}>Show recipient you are typing</span>
          </label>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            style={{
              flex: 1,
              resize: "none",
              border: `1px solid rgba(15,23,42,0.14)`,
              borderRadius: 10,
              padding: "9px 12px",
              fontSize: 13,
              fontFamily: "inherit",
              color: SLATE,
              outline: "none",
              background: "rgba(248,250,252,0.9)",
              lineHeight: 1.5,
              maxHeight: 120,
              overflowY: "auto",
            }}
            onInput={(e) => {
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
          />
          <button type="button"
            onClick={handleSend}
            disabled={!draft.trim() || sending}
            style={{
              background: !draft.trim() || sending
                ? "rgba(15,23,42,0.15)"
                : "linear-gradient(135deg, #FF7043 0%, #FF8A65 100%)",
              color: "white",
              border: "none",
              borderRadius: 10,
              padding: "9px 18px",
              fontSize: 13,
              fontWeight: 700,
              cursor: !draft.trim() || sending ? "not-allowed" : "pointer",
              flexShrink: 0,
              transition: "background 0.15s",
              boxShadow: !draft.trim() || sending
                ? "none"
                : "0 2px 8px rgba(255,112,67,0.3)",
            }}
          >
            {sending ? "..." : "Send"}
          </button>
          </div>

          <SavedReplies
            open={savedRepliesOpen}
            onClose={() => setSavedRepliesOpen(false)}
            persona="recruiter"
            title="Saved Replies"
            onInsert={(text) => {
              setDraft(text);
              setSavedRepliesOpen(false);
              textareaRef.current?.focus();
            }}
          />
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN EXPORT
───────────────────────────────────────────────────────────── */
export default function RecruiterMessageCenter({
  currentUserId,
  jobGroups,
  talentPoolGroups,
  onCreateConversation,
  fetchMessages,
  onSendMessage,
  onBulkSend,
}) {
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);

  // conversationId for the selected candidate (null = ghost, no convo yet)
  const [activeConversationId, setActiveConversationId] = useState(null);

  // Map of userId -> unread count, populated from thread data
  const [threadUnreadMap, setThreadUnreadMap] = useState({});

  const pollingRef = useRef(null);
  const creatingRef = useRef(false);

  const isArchived =
    selectedCandidate?.groupStatus &&
    selectedCandidate.groupStatus !== "active" &&
    !selectedCandidate.poolId;

  // ── Load messages when candidate or conversationId changes ───────────────
  const loadMessages = useCallback(
    async (conversationId) => {
      if (!conversationId) {
        setMessages([]);
        return;
      }

      try {
        const msgs = await fetchMessages(conversationId);
        setMessages(Array.isArray(msgs) ? msgs : []);
      } catch (err) {
        console.error("[RecruiterMessageCenter] loadMessages error:", err);
      }
    },
    [fetchMessages]
  );

  // ── Poll active conversation ──────────────────────────────────────────────
  useEffect(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    if (!activeConversationId) return;

    const tick = () => loadMessages(activeConversationId);
    tick();

    pollingRef.current = setInterval(tick, 4000);

    return () => {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    };
  }, [activeConversationId, loadMessages]);

  // ── Select a candidate ────────────────────────────────────────────────────
  const handleSelectCandidate = useCallback(
    async (candidate) => {
      setSelectedCandidate(candidate);
      setMessages([]);

      const existingConvId = candidate.conversationId
        ? String(candidate.conversationId)
        : null;

      setActiveConversationId(existingConvId);

      if (existingConvId) {
        setLoadingMessages(true);
        try {
          await loadMessages(existingConvId);
        } finally {
          setLoadingMessages(false);
        }
      }
    },
    [loadMessages]
  );

  // ── Send a message ────────────────────────────────────────────────────────
  const handleSend = useCallback(
    async (text) => {
      if (!selectedCandidate || sending) return;

      setSending(true);

      try {
        let conversationId = activeConversationId;

        // Ghost — create conversation on first send
        if (!conversationId) {
          if (creatingRef.current) return;
          creatingRef.current = true;

          try {
            const conv = await onCreateConversation(selectedCandidate.userId);
            if (!conv?.id) return;

            conversationId = conv.id;
            setActiveConversationId(conversationId);

            // Update the candidate's conversationId in the selected ref
            setSelectedCandidate((prev) =>
              prev ? { ...prev, conversationId } : prev
            );
          } finally {
            creatingRef.current = false;
          }
        }

        if (!conversationId) return;

        const msg = await onSendMessage(conversationId, text);

        const newMsg = {
          id: msg?.id ?? `m-${Date.now()}`,
          from: "recruiter",
          senderId: currentUserId,
          text: msg?.text ?? text,
          ts: msg?.timeIso || new Date().toISOString(),
          status: "sent",
        };

        setMessages((prev) => [...prev, newMsg]);
      } catch (err) {
        console.error("[RecruiterMessageCenter] send error:", err);
      } finally {
        setSending(false);
      }
    },
    [
      selectedCandidate,
      activeConversationId,
      sending,
      currentUserId,
      onCreateConversation,
      onSendMessage,
    ]
  );

  return (
    <div
      style={{
        ...GLASS,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Title bar ── */}
      <div
        style={{
          padding: "14px 16px 10px",
          borderBottom: `1px solid ${BORDER}`,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
          zIndex: 2,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 900,
            color: ORANGE,
            textShadow: "0 2px 4px rgba(15,23,42,0.65), 0 1px 2px rgba(0,0,0,0.4)",
            letterSpacing: "-0.01em",
          }}
        >
          Conversations
        </h2>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <button
            type="button"
            onClick={() => setSavedRepliesOpen(true)}
            style={{
              fontSize: 13, fontWeight: 800, color: ORANGE,
              background: "none", border: "none", cursor: "pointer", padding: 0,
              textShadow: "0 2px 4px rgba(15,23,42,0.65), 0 1px 2px rgba(0,0,0,0.4)",
            }}
          >
            Saved Replies →
          </button>
          <button
            type="button"
            onClick={() => setBulkOpen(true)}
            style={{
              fontSize: 13, fontWeight: 800, color: ORANGE,
              background: "none", border: "none", cursor: "pointer", padding: 0,
              textShadow: "0 2px 4px rgba(15,23,42,0.65), 0 1px 2px rgba(0,0,0,0.4)",
            }}
          >
            Group Message →
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div
        style={{
          ...WHITE_CARD,
          margin: 12,
          flex: 1,
          display: "flex",
          overflow: "hidden",
          minHeight: 480,
        }}
      >
        <LeftPanel
          jobGroups={jobGroups}
          talentPoolGroups={talentPoolGroups}
          selectedCandidate={selectedCandidate}
          onSelectCandidate={handleSelectCandidate}
          threadUnreadMap={threadUnreadMap}
        />
        <RightPanel
          candidate={selectedCandidate}
          messages={messages}
          onSend={handleSend}
          sending={sending}
          isArchived={!!isArchived}
          currentUserId={currentUserId}
          activeConversationId={activeConversationId}
          onArchiveMine={(c) => {
            setSelectedCandidate(null);
            setMessages([]);
            setActiveConversationId(null);
          }}
          onArchiveOrg={(c) => {
            setSelectedCandidate(null);
            setMessages([]);
            setActiveConversationId(null);
          }}
        />
      </div>

      <BulkMessageModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        persona="recruiter"
        jobGroups={jobGroups}
        talentPoolGroups={talentPoolGroups}
        onSend={async (ids, text) => {
          if (typeof onBulkSend === "function") await onBulkSend(ids, text);
          setBulkOpen(false);
        }}
      />
    </div>
  );
}