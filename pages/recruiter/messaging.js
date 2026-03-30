// pages/recruiter/messaging.js
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { PlanProvider, usePlan } from "@/context/PlanContext";
import RecruiterLayout from "@/components/layouts/RecruiterLayout";
import RecruiterTitleCard from "@/components/recruiter/RecruiterTitleCard";
import MessageThread from "@/components/recruiter/MessageThread";
import SavedReplies from "@/components/recruiter/SavedReplies";
import BulkMessageModal from "@/components/recruiter/BulkMessageModal";
import RightRailPlacementManager from "@/components/ads/RightRailPlacementManager";
import { SecondaryButton } from "@/components/ui/Buttons";
import { getTimeGreeting } from "@/lib/dashboardGreeting";

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

function normId(v) {
  if (v === null || v === undefined) return null;
  return String(v);
}

function dedupeCandidatesFlat(list) {
  const out = [];
  const seen = new Set();

  for (const item of Array.isArray(list) ? list : []) {
    const key = normId(item?.userId || item?.id);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }

  return out;
}

function mergeThreadsWithGhostCandidates(threads, candidatesFlat) {
  const baseThreads = Array.isArray(threads) ? threads : [];
  const candidates = dedupeCandidatesFlat(candidatesFlat);

  const seenOtherUserIds = new Set(
    baseThreads
      .map((t) => normId(t?.otherUserId))
      .filter(Boolean)
  );

  const ghostThreads = candidates
    .filter((c) => {
      const userId = normId(c?.userId || c?.id);
      if (!userId) return false;
      if (c?.conversationId) return false;
      return !seenOtherUserIds.has(userId);
    })
    .map((c) => ({
      id: `ghost-${String(c.userId || c.id)}`,
      candidate: c.name || c.email || "Candidate",
      snippet: "",
      unread: 0,
      messages: [],
      otherUserId: String(c.userId || c.id),
      otherAvatarUrl: c.avatarUrl || null,
      isGhost: true,
      jobGroupName: c.jobGroupName || "",
      groupStatus: c.groupStatus || "active",
    }));

  return [...baseThreads, ...ghostThreads];
}

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
   RIGHT SIDEBAR CARD
---------------------------------------------- */
function RightToolsCard() {
  return (
    <div
      style={{
        ...GLASS,
        padding: 14,
        minHeight: 160,
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#94A3B8",
          marginBottom: 8,
        }}
      >
        Sponsored
      </div>
      <div style={{ ...WHITE_CARD, minHeight: 180, padding: 12 }}>
        <RightRailPlacementManager slot="right_rail_1" />
      </div>
    </div>
  );
}

/* ---------------------------------------------
   BODY CONTENT
---------------------------------------------- */
function Body({
  threads,
  onSend,
  candidatesFlat,
  bulkOpen,
  setBulkOpen,
  initialThreadId,
  prefillText,
  onActiveThreadChange,
  isBlocked,
  onDelete,
  onReport,
  onBlock,
  threadRef,
}) {
  const { isEnterprise } = usePlan();
  const [savedRepliesOpen, setSavedRepliesOpen] = useState(false);

  const onBulkSend = (ids, text) => {
    console.log("BULK SEND", { ids, text });
    setBulkOpen(false);
  };

  useEffect(() => {
    if (!initialThreadId) return;
    if (!prefillText || !prefillText.trim()) return;

    setTimeout(() => {
      try {
        threadRef?.current?.setDraftText(prefillText);
        threadRef?.current?.focusComposer();
      } catch {}
    }, 100);
  }, [initialThreadId, prefillText, threadRef]);

  const bulkCTA = isEnterprise ? (
    <SecondaryButton onClick={() => setBulkOpen(true)}>Bulk Message</SecondaryButton>
  ) : (
    <span className="relative inline-block align-middle group">
      <SecondaryButton onClick={(e) => e.preventDefault()}>
        Bulk Message
      </SecondaryButton>
      <span
        className="
          absolute -top-10 right-0 hidden group-hover:block
          whitespace-nowrap rounded-md border bg-white px-3 py-1 text-xs
          shadow-md text-slate-700
        "
        style={{ zIndex: 30 }}
      >
        🔒 Upgrade to use Bulk Messaging
      </span>
    </span>
  );

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
        </div>

        <div style={{ ...WHITE_CARD, padding: 12 }}>
          <MessageThread
            ref={threadRef}
            threads={threads}
            initialThreadId={initialThreadId || threads[0]?.id}
            onSend={onSend}
            persona="recruiter"
            personaLabel="Recruiter"
            otherLabel="candidate"
            inboxTitle="Recruiter Inbox"
            inboxAction={bulkCTA}
            hideInboxDescription={true}
            hideThreadSnippets={true}
            showHeaderActions={true}
            onDelete={onDelete}
            onReport={onReport}
            onBlock={onBlock}
            isBlocked={isBlocked}
            onActiveThreadChange={onActiveThreadChange}
            headerActionsLabel={{
              delete: "Delete",
              report: "Report",
              block: "Block",
              blocked: "Blocked",
            }}
            showInboxToolButtons={true}
            onOpenSavedReplies={() => setSavedRepliesOpen((v) => !v)}
            savedRepliesLabel="Saved Replies"
          />
        </div>

        {savedRepliesOpen && (
          <div
            style={{
              ...WHITE_CARD,
              marginTop: 10,
              padding: 12,
            }}
          >
            <SavedReplies
              onInsert={(text) => {
                try {
                  threadRef?.current?.insertText(text, { mode: "append", spacer: " " });
                  threadRef?.current?.focusComposer();
                } catch {}
                setSavedRepliesOpen(false);
              }}
            />
          </div>
        )}
      </section>

      {isEnterprise && (
        <BulkMessageModal
          open={bulkOpen}
          onClose={() => setBulkOpen(false)}
          candidates={candidatesFlat}
          onSend={onBulkSend}
        />
      )}
    </main>
  );
}

/* ---------------------------------------------
   MAIN PAGE COMPONENT
---------------------------------------------- */
export default function MessagingPage() {
  const router = useRouter();
  const [threads, setThreads] = useState([]);
  const [jobGroups, setJobGroups] = useState([]);
  const [candidatesFlat, setCandidatesFlat] = useState([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [initialThreadId, setInitialThreadId] = useState(null);
  const threadRef = useRef(null);

  const [currentUserId, setCurrentUserId] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [sessionError, setSessionError] = useState("");

  const [activeThread, setActiveThread] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);

  const creatingConversationForUserIdRef = useRef(null);

  const queryConversationId =
    (router.query.c && String(router.query.c)) ||
    (router.query.conversationId && String(router.query.conversationId)) ||
    null;

  const prefillText =
    typeof router.query.prefill === "string" ? router.query.prefill : "";

  const candidateUserIdFromQuery =
    typeof router.query.candidateUserId === "string"
      ? router.query.candidateUserId
      : null;

  const [didAutoCreateConversation, setDidAutoCreateConversation] = useState(false);

  useEffect(() => {
    let cancelled = false;

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
        console.error("Recruiter messaging session load failed:", err);
        if (!cancelled) {
          setSessionError("Session did not load from /api/auth/session.");
          setLoadingUser(false);
        }
      }
    }

    loadUser();
    return () => {
      cancelled = true;
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

  async function createConversationForCandidateUserId(recipientId) {
    const rid = String(recipientId || "").trim();
    if (!rid) return null;

    const res = await fetch("/api/conversations", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipientId: rid,
        channel: "recruiter",
      }),
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      console.error(
        "[Recruiter Messaging] createConversation error:",
        res.status,
        payload
      );
      return null;
    }

    const json = await res.json().catch(() => ({}));
    return json?.conversation || null;
  }

  useEffect(() => {
    if (!currentUserId) return;
    let cancelled = false;

    async function loadCandidateVisibility() {
      try {
        const data = await fetchJson("/api/recruiter/candidates");
        if (cancelled) return;

        setJobGroups(Array.isArray(data?.jobGroups) ? data.jobGroups : []);
        setCandidatesFlat(
          dedupeCandidatesFlat(Array.isArray(data?.candidatesFlat) ? data.candidatesFlat : [])
        );
      } catch (err) {
        console.error("Failed to load recruiter candidate visibility:", err);
        if (!cancelled) {
          setJobGroups([]);
          setCandidatesFlat([]);
        }
      }
    }

    loadCandidateVisibility();
    return () => {
      cancelled = true;
    };
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;
    let cancelled = false;

    async function loadThreads() {
      try {
        const data = await fetchJson("/api/messages?channel=recruiter");
        const conversations = Array.isArray(data.conversations)
          ? data.conversations
          : [];

        const threadsWithMessages = await Promise.all(
          conversations.map(async (conv) => {
            try {
              const msgData = await fetchJson(
                `/api/messages?conversationId=${encodeURIComponent(
                  conv.id
                )}&channel=recruiter`
              );
              const msgs = Array.isArray(msgData.messages)
                ? msgData.messages
                : [];

              const mappedMessages = msgs.map((m) => ({
                id: m.id,
                from: m.senderId === currentUserId ? "recruiter" : "candidate",
                text: m.text,
                ts: m.timeIso || new Date().toISOString(),
                status: "read",
              }));

              const lastMsg =
                mappedMessages[mappedMessages.length - 1] || null;

              return {
                id: conv.id,
                candidate: conv.name || "Conversation",
                snippet: conv.lastMessage || lastMsg?.text || "",
                unread: typeof conv.unread === "number" ? conv.unread : 0,
                messages: mappedMessages,
                otherUserId: conv.otherUserId || conv.otherUser?.id || null,
                otherAvatarUrl:
                  conv.otherAvatarUrl || conv.otherUser?.avatarUrl || null,
                isGhost: false,
              };
            } catch (err) {
              console.error("Failed to load messages for", conv.id, err);
              return {
                id: conv.id,
                candidate: conv.name || "Conversation",
                snippet: conv.lastMessage || "",
                unread: typeof conv.unread === "number" ? conv.unread : 0,
                messages: [],
                otherUserId: conv.otherUserId || conv.otherUser?.id || null,
                otherAvatarUrl:
                  conv.otherAvatarUrl || conv.otherUser?.avatarUrl || null,
                isGhost: false,
              };
            }
          })
        );

        if (cancelled) return;

        setThreads((prev) => {
          const merged = mergeThreadsWithGhostCandidates(
            threadsWithMessages,
            candidatesFlat.length ? candidatesFlat : prev.filter((t) => t.isGhost).map((t) => ({
              userId: t.otherUserId,
              id: t.otherUserId,
              name: t.candidate,
              avatarUrl: t.otherAvatarUrl,
              conversationId: null,
              groupStatus: t.groupStatus || "active",
              jobGroupName: t.jobGroupName || "",
            }))
          );
          return merged;
        });

        const mergedNow = mergeThreadsWithGhostCandidates(
          threadsWithMessages,
          candidatesFlat
        );

        const fallbackId = mergedNow[0]?.id || null;

        if (queryConversationId) {
          const match = mergedNow.find(
            (t) => String(t.id) === String(queryConversationId)
          );
          setInitialThreadId(match ? match.id : fallbackId);
          return;
        }

        if (candidateUserIdFromQuery) {
          const match = mergedNow.find(
            (t) =>
              String(t.otherUserId || "") === String(candidateUserIdFromQuery)
          );

          if (match) {
            setInitialThreadId(match.id);

            if (match.isGhost && !didAutoCreateConversation) {
              setDidAutoCreateConversation(true);
              const conv = await createConversationForCandidateUserId(
                candidateUserIdFromQuery
              );

              if (conv?.id) {
                const candidateMeta =
                  candidatesFlat.find(
                    (c) =>
                      String(c.userId || c.id || "") ===
                      String(candidateUserIdFromQuery)
                  ) || null;

                const newThread = {
                  id: conv.id,
                  candidate:
                    candidateMeta?.name ||
                    match.candidate ||
                    conv.name ||
                    "Conversation",
                  snippet: "",
                  unread: 0,
                  messages: [],
                  otherUserId:
                    conv.otherUserId ||
                    conv.otherUser?.id ||
                    candidateUserIdFromQuery,
                  otherAvatarUrl:
                    candidateMeta?.avatarUrl ||
                    conv.otherAvatarUrl ||
                    conv.otherUser?.avatarUrl ||
                    null,
                  isGhost: false,
                };

                setThreads((prev) => {
                  const withoutGhost = prev.filter(
                    (t) =>
                      String(t.otherUserId || "") !==
                      String(candidateUserIdFromQuery)
                  );
                  const exists = withoutGhost.some(
                    (t) => String(t.id) === String(conv.id)
                  );
                  if (exists) return withoutGhost;
                  return [newThread, ...withoutGhost];
                });

                setInitialThreadId(conv.id);
              }
            }

            return;
          }

          setInitialThreadId(fallbackId);
          return;
        }

        setInitialThreadId(fallbackId);
      } catch (err) {
        console.error("Failed to load recruiter threads:", err);
      }
    }

    loadThreads();
    return () => {
      cancelled = true;
    };
  }, [
    queryConversationId,
    candidateUserIdFromQuery,
    currentUserId,
    didAutoCreateConversation,
    candidatesFlat,
  ]);

  useEffect(() => {
    if (!currentUserId) return;
    if (!activeThread?.id) return;
    if (String(activeThread.id).startsWith("ghost-")) return;

    let cancelled = false;

    const tick = async () => {
      try {
        const msgData = await fetchJson(
          `/api/messages?conversationId=${encodeURIComponent(
            activeThread.id
          )}&channel=recruiter`
        );
        const msgs = Array.isArray(msgData.messages) ? msgData.messages : [];

        const mapped = msgs.map((m) => ({
          id: m.id,
          from: m.senderId === currentUserId ? "recruiter" : "candidate",
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

  const onSend = async (threadId, text) => {
    if (!text || !String(text).trim()) return;
    const trimmed = text.trim();

    const thread = threads.find((t) => String(t.id) === String(threadId)) || null;
    if (!thread) return;

    let effectiveThreadId = threadId;

    if (thread.isGhost && thread.otherUserId) {
      if (
        creatingConversationForUserIdRef.current &&
        String(creatingConversationForUserIdRef.current) ===
          String(thread.otherUserId)
      ) {
        return;
      }

      creatingConversationForUserIdRef.current = String(thread.otherUserId);

      try {
        const conv = await createConversationForCandidateUserId(thread.otherUserId);
        if (!conv?.id) return;

        effectiveThreadId = conv.id;

        const newThread = {
          id: conv.id,
          candidate: thread.candidate,
          snippet: "",
          unread: 0,
          messages: [],
          otherUserId: conv.otherUserId || conv.otherUser?.id || thread.otherUserId,
          otherAvatarUrl:
            conv.otherAvatarUrl || conv.otherUser?.avatarUrl || thread.otherAvatarUrl || null,
          isGhost: false,
        };

        setThreads((prev) => {
          const filtered = prev.filter(
            (t) => String(t.id) !== String(thread.id)
          );
          const exists = filtered.some((t) => String(t.id) === String(conv.id));
          if (exists) return filtered;
          return [newThread, ...filtered];
        });

        setInitialThreadId(conv.id);
      } finally {
        creatingConversationForUserIdRef.current = null;
      }
    }

    try {
      const data = await fetchJson("/api/messages", {
        method: "POST",
        body: JSON.stringify({
          conversationId: effectiveThreadId,
          content: trimmed,
          channel: "recruiter",
        }),
      });

      const msg = data?.message;

      const newMsg = {
        id: msg?.id ?? `m-${Date.now()}`,
        from: "recruiter",
        text: msg?.text ?? trimmed,
        ts: msg?.timeIso || new Date().toISOString(),
        status: "sent",
      };

      setThreads((prev) =>
        prev.map((t) =>
          String(t.id) !== String(effectiveThreadId)
            ? t
            : {
                ...t,
                snippet: trimmed,
                messages: [...(Array.isArray(t.messages) ? t.messages : []), newMsg],
                isGhost: false,
              }
        )
      );
    } catch (err) {
      console.error("Failed to send recruiter message:", err);
    }
  };

  const handleDelete = async () => {
    if (!activeThread?.id) return;
    if (String(activeThread.id).startsWith("ghost-")) {
      setThreads((prev) => prev.filter((t) => String(t.id) !== String(activeThread.id)));
      setActiveThread(null);
      setIsBlocked(false);
      return;
    }

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
    if (String(activeThread.id).startsWith("ghost-")) return;

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
    if (String(activeThread.id).startsWith("ghost-")) return;

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

  const greeting = getTimeGreeting();

  const HeaderBox = (
    <RecruiterTitleCard
      greeting={greeting}
      title="Recruiter Messaging"
      subtitle="Manage recruiter conversations, saved replies, and outreach in one place."
      compact
    />
  );

  const visibleThreads = mergeThreadsWithGhostCandidates(threads, candidatesFlat);

  if (loadingUser) {
    return (
      <PlanProvider>
        <RecruiterLayout
          title="Messaging — ForgeTomorrow"
          header={HeaderBox}
          headerCard={false}
          right={<RightToolsCard />}
          activeNav="messaging"
        >
          <section style={{ ...GLASS, ...GLASS_OVERLAY, padding: 16 }}>
            <div
              style={{
                ...WHITE_CARD,
                minHeight: 256,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: MUTED,
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Loading…
            </div>
          </section>
        </RecruiterLayout>
      </PlanProvider>
    );
  }

  if (!currentUserId) {
    return (
      <PlanProvider>
        <RecruiterLayout
          title="Messaging — ForgeTomorrow"
          header={HeaderBox}
          headerCard={false}
          right={<RightToolsCard />}
          activeNav="messaging"
        >
          <section style={{ ...GLASS, ...GLASS_OVERLAY, padding: 16 }}>
            <div style={{ ...WHITE_CARD, padding: 16 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#0F172A" }}>
                Session failed to load
              </div>
              <p style={{ marginTop: 6, fontSize: 13, color: MUTED, lineHeight: 1.55 }}>
                {sessionError || "We could not resolve your session."}
              </p>
              <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
                <button
                  style={{
                    borderRadius: 10,
                    background: "#0F172A",
                    color: "white",
                    padding: "10px 14px",
                    fontSize: 13,
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                  }}
                  onClick={() => window.location.reload()}
                >
                  Retry
                </button>
                <button
                  style={{
                    borderRadius: 10,
                    border: "1px solid rgba(0,0,0,0.12)",
                    background: "white",
                    color: "#0F172A",
                    padding: "10px 14px",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                  onClick={() => router.push("/auth/signin")}
                >
                  Sign in
                </button>
              </div>
            </div>
          </section>
        </RecruiterLayout>
      </PlanProvider>
    );
  }

  return (
    <PlanProvider>
      <RecruiterLayout
        title="Messaging — ForgeTomorrow"
        header={HeaderBox}
        headerCard={false}
        right={<RightToolsCard />}
        activeNav="messaging"
      >
        <Body
          threads={visibleThreads}
          onSend={onSend}
          candidatesFlat={candidatesFlat}
          bulkOpen={bulkOpen}
          setBulkOpen={setBulkOpen}
          initialThreadId={initialThreadId}
          prefillText={prefillText}
          onActiveThreadChange={async (t) => {
            setActiveThread(t);
            setIsBlocked(false);

            if (!t?.isGhost || !t?.otherUserId) return;
            if (
              creatingConversationForUserIdRef.current &&
              String(creatingConversationForUserIdRef.current) ===
                String(t.otherUserId)
            ) {
              return;
            }

            creatingConversationForUserIdRef.current = String(t.otherUserId);

            try {
              const conv = await createConversationForCandidateUserId(t.otherUserId);
              if (!conv?.id) return;

              const candidateMeta =
                candidatesFlat.find(
                  (c) => String(c.userId || c.id || "") === String(t.otherUserId)
                ) || null;

              const newThread = {
                id: conv.id,
                candidate:
                  candidateMeta?.name ||
                  t.candidate ||
                  conv.name ||
                  "Conversation",
                snippet: "",
                unread: 0,
                messages: [],
                otherUserId: conv.otherUserId || conv.otherUser?.id || t.otherUserId,
                otherAvatarUrl:
                  candidateMeta?.avatarUrl ||
                  conv.otherAvatarUrl ||
                  conv.otherUser?.avatarUrl ||
                  t.otherAvatarUrl ||
                  null,
                isGhost: false,
              };

              setThreads((prev) => {
                const filtered = prev.filter(
                  (row) => String(row.otherUserId || "") !== String(t.otherUserId)
                );
                const exists = filtered.some(
                  (row) => String(row.id) === String(conv.id)
                );
                if (exists) return filtered;
                return [newThread, ...filtered];
              });

              setInitialThreadId(conv.id);
              setActiveThread(newThread);
            } finally {
              creatingConversationForUserIdRef.current = null;
            }
          }}
          isBlocked={isBlocked}
          onDelete={handleDelete}
          onReport={handleReport}
          onBlock={handleBlock}
          threadRef={threadRef}
        />
      </RecruiterLayout>
    </PlanProvider>
  );
}