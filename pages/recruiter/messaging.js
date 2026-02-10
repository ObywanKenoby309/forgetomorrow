// pages/recruiter/messaging.js
// updated to fix loading issue
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { PlanProvider, usePlan } from "@/context/PlanContext";
import RecruiterLayout from "@/components/layouts/RecruiterLayout";
import MessageThread from "@/components/recruiter/MessageThread";
import SavedReplies from "@/components/recruiter/SavedReplies";
import BulkMessageModal from "@/components/recruiter/BulkMessageModal";
import { SecondaryButton } from "@/components/ui/Buttons";

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
   HEADER BAR
---------------------------------------------- */
function HeaderBar({ onOpenBulk }) {
  const { isEnterprise } = usePlan();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-3">
      <div className="hidden md:block" />
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[#FF7043]">Messaging</h1>
        <p className="text-sm text-slate-600 mt-1 max-w-xl mx-auto">
          View and reply to candidate conversations, or send bulk messages with
          Enterprise.
        </p>
      </div>
      <div className="justify-self-center md:justify-self-end">
        {isEnterprise ? (
          <SecondaryButton onClick={onOpenBulk}>Bulk Message</SecondaryButton>
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
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------
   RIGHT SIDEBAR CARD
---------------------------------------------- */
function RightToolsCard() {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="font-medium mb-2">Tips</div>
      <div className="text-sm text-slate-600 space-y-2">
        <p>Keep bulk messages short and personalized.</p>
        <p>Use saved replies to speed up responses.</p>
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
}) {
  const { isEnterprise } = usePlan();

  const onBulkSend = (ids, text) => {
    console.log("BULK SEND", { ids, text });
    setBulkOpen(false);
  };

  useEffect(() => {
    if (!initialThreadId) return;
    if (!prefillText || !prefillText.trim()) return;

    const el = document.querySelector('input[placeholder="Type a message…"]');
    if (el && !el.value) {
      el.value = prefillText;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.focus();
    }
  }, [initialThreadId, prefillText]);

  return (
    <main className="space-y-6">
      <div className="mb-2 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-700">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          How messaging works
        </p>
        <p className="mt-1">
          To start a new conversation, open your{" "}
          <span className="font-semibold">Candidates</span> view and click{" "}
          <span className="font-mono text-[11px]">Message</span> on any card.
          We&apos;ll ask whether to use your{" "}
          <span className="font-semibold">Recruiter inbox</span> or your{" "}
          <span className="font-semibold">Signal (personal)</span> inbox, and
          that thread will appear here.
        </p>
      </div>

      <MessageThread
        threads={threads}
        initialThreadId={initialThreadId || threads[0]?.id}
        onSend={onSend}
        persona="recruiter"
        personaLabel="Recruiter"
        otherLabel="candidate"
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
      />

      <SavedReplies
        onInsert={(text) => {
          const el = document.querySelector('input[placeholder="Type a message…"]');
          if (el) {
            el.value = el.value ? `${el.value} ${text}` : text;
            el.dispatchEvent(new Event("input", { bubbles: true }));
            el.focus();
          }
        }}
      />

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
  const [bulkOpen, setBulkOpen] = useState(false);
  const [initialThreadId, setInitialThreadId] = useState(null);

  const [currentUserId, setCurrentUserId] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [sessionError, setSessionError] = useState("");

  const [activeThread, setActiveThread] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);

  const queryConversationId =
    (router.query.c && String(router.query.c)) ||
    (router.query.conversationId && String(router.query.conversationId)) ||
    null;

  const prefillText =
    typeof router.query.prefill === "string" ? router.query.prefill : "";

  // NEW: allow candidates (or pools) to link by candidate user id (auto-open if exists)
  const candidateUserIdFromQuery =
    typeof router.query.candidateUserId === "string"
      ? router.query.candidateUserId
      : null;

  // ✅ NEW: prevent repeated "create conversation" loops
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
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        "x-user-id": currentUserId,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Request failed (${res.status}): ${text}`);
    }

    return res.json();
  }

  // ✅ NEW: helper to create or get a conversation for recruiter channel
  async function createConversationForCandidateUserId(recipientId) {
    const rid = String(recipientId || "").trim();
    if (!rid) return null;

    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": currentUserId,
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
                // ✅ minimal: support either shape so candidateUserId matching works reliably
                otherUserId: conv.otherUserId || conv.otherUser?.id || null,
                otherAvatarUrl:
                  conv.otherAvatarUrl || conv.otherUser?.avatarUrl || null,
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
              };
            }
          })
        );

        if (cancelled) return;

        setThreads(threadsWithMessages);

        const fallbackId = threadsWithMessages[0]?.id || null;

        // 1) If explicit conversation id is present, honor it
        if (queryConversationId) {
          const match = threadsWithMessages.find(
            (t) => String(t.id) === String(queryConversationId)
          );
          setInitialThreadId(match ? match.id : fallbackId);
          return;
        }

        // 2) If candidateUserId is provided, try to auto-open existing thread by otherUserId
        if (candidateUserIdFromQuery) {
          const match = threadsWithMessages.find(
            (t) =>
              String(t.otherUserId || "") === String(candidateUserIdFromQuery)
          );

          // ✅ If thread exists, open it
          if (match) {
            setInitialThreadId(match.id);
            return;
          }

          // ✅ If no thread exists yet, create one once and open it
          if (!didAutoCreateConversation) {
            setDidAutoCreateConversation(true);

            const conv = await createConversationForCandidateUserId(
              candidateUserIdFromQuery
            );
            if (conv?.id) {
              setInitialThreadId(conv.id);
              // next run of polling/refresh will pull messages; keep UI consistent now
              setThreads((prev) => {
                const exists = prev.some(
                  (t) => String(t.id) === String(conv.id)
                );
                if (exists) return prev;
                return [
                  {
                    id: conv.id,
                    candidate: conv.name || "Conversation",
                    snippet: "",
                    unread: 0,
                    messages: [],
                    otherUserId:
                      conv.otherUserId ||
                      conv.otherUser?.id ||
                      candidateUserIdFromQuery,
                    otherAvatarUrl:
                      conv.otherAvatarUrl || conv.otherUser?.avatarUrl || null,
                  },
                  ...prev,
                ];
              });
              return;
            }
          }

          // fallback
          setInitialThreadId(fallbackId);
          return;
        }

        // 3) Default
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
  ]);

  // ✅ Poll messages for the active conversation
  useEffect(() => {
    if (!currentUserId) return;
    if (!activeThread?.id) return;

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
      } catch {
        // keep quiet
      }
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

    try {
      const data = await fetchJson("/api/messages", {
        method: "POST",
        body: JSON.stringify({
          conversationId: threadId,
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
      console.error("Failed to send recruiter message:", err);
    }
  };

  // ✅ actions (parity with Signal)
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
    return (
      <PlanProvider>
        <RecruiterLayout
          title="Messaging — ForgeTomorrow"
          header={<HeaderBar onOpenBulk={() => {}} />}
          right={<RightToolsCard />}
          activeNav="messaging"
        >
          <div className="h-64 flex items-center justify-center text-slate-500">
            Loading…
          </div>
        </RecruiterLayout>
      </PlanProvider>
    );
  }

  if (!currentUserId) {
    return (
      <PlanProvider>
        <RecruiterLayout
          title="Messaging — ForgeTomorrow"
          header={<HeaderBar onOpenBulk={() => {}} />}
          right={<RightToolsCard />}
          activeNav="messaging"
        >
          <div className="rounded-lg border bg-white p-4">
            <div className="font-semibold text-slate-800">
              Session failed to load
            </div>
            <p className="mt-1 text-sm text-slate-600">
              {sessionError || "We could not resolve your session."}
            </p>
            <div className="mt-3 flex gap-2">
              <button
                className="rounded-md bg-black text-white px-3 py-2 text-sm"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
              <button
                className="rounded-md border px-3 py-2 text-sm"
                onClick={() => router.push("/auth/signin")}
              >
                Sign in
              </button>
            </div>
          </div>
        </RecruiterLayout>
      </PlanProvider>
    );
  }

  return (
    <PlanProvider>
      <RecruiterLayout
        title="Messaging — ForgeTomorrow"
        header={<HeaderBar onOpenBulk={() => setBulkOpen(true)} />}
        right={<RightToolsCard />}
        activeNav="messaging"
      >
        <Body
          threads={threads}
          onSend={onSend}
          candidatesFlat={[]} // unchanged
          bulkOpen={bulkOpen}
          setBulkOpen={setBulkOpen}
          initialThreadId={initialThreadId}
          prefillText={prefillText}
          onActiveThreadChange={(t) => {
            setActiveThread(t);
            setIsBlocked(false);
          }}
          isBlocked={isBlocked}
          onDelete={handleDelete}
          onReport={handleReport}
          onBlock={handleBlock}
        />
      </RecruiterLayout>
    </PlanProvider>
  );
}
