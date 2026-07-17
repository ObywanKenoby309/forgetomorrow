// components/coaching/CoachInbox.js
import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/router";
import MessageThread from "@/components/recruiter/MessageThread";
import BulkMessageModal from "@/components/recruiter/BulkMessageModal";
import SavedReplies from "@/components/recruiter/SavedReplies";
import { SecondaryButton } from "@/components/ui/Buttons";

/* ---------------------------------------------
   VISUAL SYSTEM
---------------------------------------------- */
const GLASS = {
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.22)",
  background: "rgba(255,255,255,0.68)",
  boxShadow: "0 10px 28px rgba(15,23,42,0.12)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
};

const GLASS_OVERLAY = {
  position: "relative",
  overflow: "hidden",
};

const WHITE_CARD = {
  background: "rgba(255,255,255,0.97)",
  border: "1px solid rgba(255,255,255,0.60)",
  borderRadius: 14,
  boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
  boxSizing: "border-box",
  position: "relative",
  zIndex: 1,
};

const ORANGE = "#FF7043";
const MUTED = "#64748B";
const ORANGE_HEADING_LIFT = {
  textShadow: "0 2px 4px rgba(15,23,42,0.65), 0 1px 2px rgba(0,0,0,0.4)",
  fontWeight: 900,
  position: "relative",
  zIndex: 1,
};

/* ---------------------------------------------
   CLIENT SESSION (DIRECT)
---------------------------------------------- */
async function getSessionDirect(timeoutMs = 4000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch("/api/auth/session", {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    });

    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

/* ---------------------------------------------
   BODY CONTENT
---------------------------------------------- */
function CoachInbox({
  threads,
  threadRef,
  onSend,
  recipients,
  bulkOpen,
  setBulkOpen,
  savedRepliesOpen,
  setSavedRepliesOpen,
  initialThreadId,
  prefillText,
  onBulkSendDb,
  onActiveThreadChange,
  isBlocked,
  onDelete,
  onReport,
  onBlock,
  onSetHome,
  activeHomeLocation,
  movingHome,
}) {
  useEffect(() => {
    if (!initialThreadId) return;
    if (!prefillText || !prefillText.trim()) return;

    if (threadRef?.current?.insertText) {
      threadRef.current.insertText(prefillText);
      return;
    }

    const el = document.querySelector('input[placeholder="Type a message…"]');
    if (el && !el.value) {
      el.value = prefillText;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.focus();
    }
  }, [initialThreadId, prefillText, threadRef]);

  return (
    <main style={{ display: "grid", gap: 16 }}>

      <section style={{ ...GLASS, ...GLASS_OVERLAY, padding: 16 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
            gap: 12,
          }}
        >
          <h2
            style={{
              fontSize: 18,
              fontWeight: 900,
              color: ORANGE,
              lineHeight: 1.25,
              letterSpacing: "-0.01em",
              margin: 0,
              ...ORANGE_HEADING_LIFT,
            }}
          >
            Conversations
          </h2>
          <button
            type="button"
            onClick={() => setBulkOpen(true)}
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: ORANGE,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              ...ORANGE_HEADING_LIFT,
            }}
          >
            Group Message →
          </button>
        </div>

        <div style={{ ...WHITE_CARD, padding: 12 }}>
          <MessageThread
            ref={threadRef}
            threads={threads}
            initialThreadId={initialThreadId || threads[0]?.id}
            onSend={onSend}
            persona="coach"
            personaLabel="Coach"
            otherLabel="client"
            inboxTitle="Coach Inbox"
            showInboxToolButtons={true}
            onOpenSavedReplies={() => setSavedRepliesOpen(true)}
            savedRepliesLabel="Saved Replies"
            inboxDescription={
              <p className="mt-1 text-[11px] text-slate-500 leading-snug">
                Conversations you start as a <span className="font-semibold">Coach</span>{" "}
                will show here. Personal DMs live in{" "}
                <span className="font-semibold">The Spark</span>.
              </p>
            }
            emptyTitle="No coach conversations yet"
            emptyBody={
              <>
                <p className="max-w-md text-xs text-slate-500">
                  This inbox is for conversations you start as{" "}
                  <span className="font-semibold">Coach</span>. To begin, open a client
                  profile and click Message. When they reply, the full thread will appear here.
                </p>
                <p className="max-w-md text-[11px] text-slate-400">
                  Personal one-to-one messages still flow through{" "}
                  <span className="font-semibold">The Spark</span>.
                </p>
              </>
            }
            onActiveThreadChange={onActiveThreadChange}
            isBlocked={isBlocked}
            showHeaderActions={true}
            onDelete={onDelete}
            onReport={onReport}
            onBlock={onBlock}
            onSetHome={onSetHome}
            activeHomeLocation={activeHomeLocation}
            movingHome={movingHome}
            headerActionsLabel={{
              delete: "Delete",
              report: "Report",
              block: "Block",
              blocked: "Blocked",
            }}
          />
        </div>
      </section>

      <BulkMessageModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        persona="coach"
        clients={recipients.map((r) => ({
          id: r.id,
          name: r.name,
          status: r.role || "Active",
        }))}
        onSend={onBulkSendDb}
      />

      <SavedReplies
        open={savedRepliesOpen}
        onClose={() => setSavedRepliesOpen(false)}
        persona="coach"
        title="Saved Replies (Coach)"
        onInsert={(text) => {
          if (threadRef?.current?.insertText) {
            threadRef.current.insertText(text);
          }
          setSavedRepliesOpen(false);
        }}
      />
    </main>
  );
}




function CoachInboxContainer() {
  const router = useRouter();
  const [threads, setThreads] = useState([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [savedRepliesOpen, setSavedRepliesOpen] = useState(false);
  const [initialThreadId, setInitialThreadId] = useState(null);

  const [currentUserId, setCurrentUserId] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [slowSession, setSlowSession] = useState(false);
  const [sessionError, setSessionError] = useState("");

  const [activeThread, setActiveThread] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [activeHomeLocation, setActiveHomeLocation] = useState('coach');
  const [movingHome, setMovingHome] = useState(false);

  const threadRef = useRef(null);

  const queryConversationId =
    (router.query.c && String(router.query.c)) ||
    (router.query.conversationId && String(router.query.conversationId)) ||
    null;

  const prefillText =
    typeof router.query.prefill === "string" ? router.query.prefill : "";

  useEffect(() => {
    let cancelled = false;

    const slowTimer = setTimeout(() => {
      if (!cancelled) setSlowSession(true);
    }, 2000);

    async function loadUser() {
      try {
        setSessionError("");
        const session = await getSessionDirect(4000);

        if (!session?.user?.id) {
          if (!cancelled) {
            setLoadingUser(false);
            await router.replace("/auth/signin");
          }
          return;
        }

        if (!cancelled) {
          setCurrentUserId(session.user.id);
          setLoadingUser(false);
        }
      } catch (err) {
        console.error("Failed to load session for coach messaging:", err);
        if (!cancelled) {
          setSessionError("Session did not load from /api/auth/session.");
          setLoadingUser(false);
        }
      }
    }

    loadUser();
    return () => {
      cancelled = true;
      clearTimeout(slowTimer);
    };
  }, [router]);

  async function fetchJson(url, options = {}) {
    if (!currentUserId) throw new Error("No current user id resolved yet");

    const res = await fetch(url, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Request failed (${res.status}): ${text}`);
    }

    return res.json();
  }

  useEffect(() => {
    if (!currentUserId) return;
    let cancelled = false;

    async function loadThreads() {
      try {
        const data = await fetchJson("/api/messages?channel=coach");
        const conversations = Array.isArray(data.conversations) ? data.conversations : [];

        const threadsWithMessages = await Promise.all(
          conversations.map(async (conv) => {
            try {
              const msgData = await fetchJson(
                `/api/messages?conversationId=${encodeURIComponent(conv.id)}&channel=coach`
              );
              const msgs = Array.isArray(msgData.messages) ? msgData.messages : [];

              const mappedMessages = msgs.map((m) => ({
                id: m.id,
                from: m.senderId === currentUserId ? "coach" : "client",
                text: m.text,
                ts: m.timeIso || new Date().toISOString(),
                status: "read",
              }));

              const lastMsg = mappedMessages[mappedMessages.length - 1] || null;

              return {
                id: conv.id,
                candidate: conv.name || "Conversation",
                snippet: conv.lastMessage || lastMsg?.text || "",
                unread: typeof conv.unread === "number" ? conv.unread : 0,
                messages: mappedMessages,
                otherUserId: conv.otherUserId || null,
                otherAvatarUrl: conv.otherAvatarUrl || null,
              };
            } catch (err) {
              console.error("Failed to load messages for", conv.id, err);
              return {
                id: conv.id,
                candidate: conv.name || "Conversation",
                snippet: conv.lastMessage || "",
                unread: typeof conv.unread === "number" ? conv.unread : 0,
                messages: [],
                otherUserId: conv.otherUserId || null,
                otherAvatarUrl: conv.otherAvatarUrl || null,
              };
            }
          })
        );

        if (cancelled) return;

        setThreads(threadsWithMessages);

        const fallbackId = threadsWithMessages[0]?.id || null;

        if (queryConversationId) {
          const match = threadsWithMessages.find(
            (t) => String(t.id) === String(queryConversationId)
          );
          setInitialThreadId(match ? match.id : fallbackId);
        } else {
          setInitialThreadId(fallbackId);
        }
      } catch (err) {
        console.error("Failed to load coach threads:", err);
      }
    }

    loadThreads();
    return () => {
      cancelled = true;
    };
  }, [queryConversationId, currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;
    if (!activeThread?.id) return;

    let cancelled = false;

    const tick = async () => {
      try {
        const msgData = await fetchJson(
          `/api/messages?conversationId=${encodeURIComponent(activeThread.id)}&channel=coach`
        );
        const msgs = Array.isArray(msgData.messages) ? msgData.messages : [];

        const mapped = msgs.map((m) => ({
          id: m.id,
          from: m.senderId === currentUserId ? "coach" : "client",
          text: m.text,
          ts: m.timeIso || new Date().toISOString(),
          status: "read",
        }));

        if (cancelled) return;

        setThreads((prev) =>
          prev.map((t) =>
            t.id !== activeThread.id
              ? t
              : {
                  ...t,
                  messages: mapped,
                  snippet: mapped[mapped.length - 1]?.text || t.snippet || "",
                }
          )
        );
      } catch {}
    };

    const initial = setTimeout(() => tick(), 800);
    const interval = setInterval(() => tick(), 4000);

    return () => {
      cancelled = true;
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [activeThread?.id, currentUserId]);

  const recipients = useMemo(() => {
    return (threads || [])
      .filter((t) => !!t.otherUserId)
      .map((t) => ({
        id: t.otherUserId,
        name: t.candidate,
        role: "Client",
        location: "",
      }));
  }, [threads]);

  const onSend = async (threadId, text) => {
    if (!text || !String(text).trim()) return;
    const trimmed = text.trim();

    try {
      const data = await fetchJson("/api/messages", {
        method: "POST",
        body: JSON.stringify({
          conversationId: threadId,
          content: trimmed,
          channel: "coach",
        }),
      });

      const msg = data?.message;

      const newMsg = {
        id: msg?.id ?? `m-${Date.now()}`,
        from: "coach",
        text: msg?.text ?? trimmed,
        ts: msg?.timeIso || new Date().toISOString(),
        status: "sent",
      };

      setThreads((prev) =>
        prev.map((t) =>
          t.id !== threadId
            ? t
            : {
                ...t,
                snippet: trimmed,
                messages: [...t.messages, newMsg],
              }
        )
      );
    } catch (err) {
      console.error("Failed to send coach message:", err);
    }
  };

  const onBulkSendDb = async (ids, text) => {
    const cleanText = typeof text === "string" ? text.trim() : "";
    const cleanIds = Array.isArray(ids) ? ids.filter(Boolean) : [];
    if (!cleanIds.length || !cleanText) return;

    try {
      await fetchJson("/api/messages/bulk", {
        method: "POST",
        body: JSON.stringify({
          recipientIds: cleanIds,
          content: cleanText,
          channel: "coach",
        }),
      });

      setBulkOpen(false);
      router.replace(router.asPath);
    } catch (err) {
      console.error("Failed bulk send (coach):", err);
      setBulkOpen(false);
    }
  };

  const handleSetHome = async (newHomeLocation) => {
    if (!activeThread?.id || movingHome || newHomeLocation === activeHomeLocation) return;
    setMovingHome(true);
    try {
      const res = await fetch('/api/signal/set-home', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ conversationId: activeThread.id, homeLocation: newHomeLocation }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setActiveHomeLocation(data.homeLocation);
    } catch (err) {
      console.error('setHome error:', err);
      alert('Could not move conversation. Please try again.');
    } finally {
      setMovingHome(false);
    }
  };

  const handleDelete = async () => {
    if (!activeThread?.id) return;
    const confirmed = window.confirm(
      "Delete this conversation for both participants? This cannot be undone."
    );
    if (!confirmed) return;

    try {
      const res = await fetch("/api/signal/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ conversationId: activeThread.id }),
      });
      if (!res.ok) {
        console.error("delete failed:", await res.text());
        alert("Could not delete conversation. Please try again.");
        return;
      }

      setThreads((prev) => prev.filter((t) => t.id !== activeThread.id));
      setActiveThread(null);
      setIsBlocked(false);
    } catch (err) {
      console.error("delete error:", err);
      alert("Could not delete conversation. Please try again.");
    }
  };

  const handleReport = async () => {
    if (!activeThread?.id || !activeThread?.otherUserId) return;

    const reason = window.prompt(
      "Tell us briefly what happened. This will go to the ForgeTomorrow support team."
    );
    if (reason === null) return;

    try {
      const res = await fetch("/api/signal/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          conversationId: activeThread.id,
          targetUserId: activeThread.otherUserId,
          reason: String(reason || "").trim(),
        }),
      });

      if (!res.ok) {
        console.error("report failed:", await res.text());
        alert("Could not submit report. Please try again.");
        return;
      }

      alert("Thank you. Your report has been submitted to our team.");
    } catch (err) {
      console.error("report error:", err);
      alert("Could not submit report. Please try again.");
    }
  };

  const handleBlock = async () => {
    if (!activeThread?.otherUserId) return;

    const reason = window.prompt(
      "Optional: Why are you blocking this member? (This helps moderation)"
    );
    const confirmed = window.confirm(
      "Are you sure you want to block this member? They will no longer be able to message you, and you will not see new messages from them."
    );
    if (!confirmed) return;

    try {
      const res = await fetch("/api/signal/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          targetUserId: activeThread.otherUserId,
          reason: reason?.trim() || null,
        }),
      });

      if (!res.ok) {
        console.error("block failed:", await res.text());
        alert("Could not block member. Please try again.");
        return;
      }

      setIsBlocked(true);
      setThreads((prev) =>
        prev.filter((t) => t.otherUserId !== activeThread.otherUserId)
      );
    } catch (err) {
      console.error("block error:", err);
      alert("Could not block member. Please try again.");
    }
  };

  if (loadingUser) {
    return <div>Loading...</div>;
  }

  if (!currentUserId) {
    return <div>Session failed to load.</div>;
  }

  return (
    <CoachInbox
      threads={threads}
      threadRef={threadRef}
      onSend={onSend}
      recipients={recipients}
      bulkOpen={bulkOpen}
      setBulkOpen={setBulkOpen}
      savedRepliesOpen={savedRepliesOpen}
      setSavedRepliesOpen={setSavedRepliesOpen}
      initialThreadId={initialThreadId}
      prefillText={prefillText}
      onBulkSendDb={onBulkSendDb}
      onActiveThreadChange={(t) => {
        setActiveThread(t);
        setIsBlocked(false);
        setActiveHomeLocation(t?.homeLocation || "coach");
      }}
      isBlocked={isBlocked}
      onDelete={handleDelete}
      onReport={handleReport}
      onBlock={handleBlock}
      onSetHome={handleSetHome}
      activeHomeLocation={activeHomeLocation}
      movingHome={movingHome}
    />
  );
}
export default CoachInboxContainer;
