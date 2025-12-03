// pages/recruiter/messaging.js
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { PlanProvider, usePlan } from "@/context/PlanContext";
import RecruiterLayout from "@/components/layouts/RecruiterLayout";
import MessageThread from "@/components/recruiter/MessageThread";
import SavedReplies from "@/components/recruiter/SavedReplies";
import BulkMessageModal from "@/components/recruiter/BulkMessageModal";
import { SecondaryButton } from "@/components/ui/Buttons";
import { getClientSession } from "@/lib/auth-client";

/** Header (centered title + action on right) */
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
          // Overlay tooltip in locked mode so layout/height doesn't change
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

/** Optional right column card for tips */
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

function Body({
  threads,
  onSend,
  candidatesFlat,
  bulkOpen,
  setBulkOpen,
  initialThreadId,
  prefillText,
}) {
  const { isEnterprise } = usePlan();

  const onBulkSend = (ids, text) => {
    console.log("BULK SEND", { ids, text });
    setBulkOpen(false);
  };

  // When we arrive with a prefill (from candidates page), drop it
  // into the message input once the thread is ready and input exists.
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
      <MessageThread
        threads={threads}
        initialThreadId={initialThreadId || threads[0]?.id}
        onSend={onSend}
      />

      {/* Saved replies manager (available to all plans) */}
      <SavedReplies
        onInsert={(text) => {
          const el = document.querySelector(
            'input[placeholder="Type a message…"]'
          );
          if (el) {
            const curr = el.value || "";
            el.value = curr ? `${curr} ${text}` : text;
            el.dispatchEvent(new Event("input", { bubbles: true }));
            el.focus();
          }
        }}
      />

      {/* Bulk message modal only for Enterprise */}
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

export default function MessagingPage() {
  const router = useRouter();
  const [threads, setThreads] = useState([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [initialThreadId, setInitialThreadId] = useState(null);

  const [currentUserId, setCurrentUserId] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // From recruiter/candidates → onMessage()
  const queryConversationId =
    (router.query.c && String(router.query.c)) ||
    (router.query.conversationId && String(router.query.conversationId)) ||
    null;

  const prefillText =
    typeof router.query.prefill === "string" ? router.query.prefill : "";

  // For now, keep this static mock list for the bulk modal UI.
  const candidatesFlat = [
    {
      id: 1,
      name: "Jane Doe",
      role: "Client Success Lead",
      location: "Remote",
    },
    {
      id: 2,
      name: "Omar Reed",
      role: "Onboarding Specialist",
      location: "Nashville, TN",
    },
    {
      id: 3,
      name: "Priya Kumar",
      role: "Solutions Architect",
      location: "Austin, TX",
    },
  ];

  // 1) Resolve the REAL current user from session
  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        const session = await getClientSession();
        if (!session?.user?.id) {
          await router.replace("/auth/signin");
          return;
        }
        if (!cancelled) {
          setCurrentUserId(session.user.id);
        }
      } catch (err) {
        console.error("Failed to load session for recruiter messaging:", err);
        if (!cancelled) {
          // If session explodes, kick back to sign-in
          await router.replace("/auth/signin");
        }
      } finally {
        if (!cancelled) {
          setLoadingUser(false);
        }
      }
    }

    loadUser();
    return () => {
      cancelled = true;
    };
  }, [router]);

  // Small fetch helper that always sends x-user-id from the *real* user
  async function fetchJson(url, options = {}) {
    if (!currentUserId) {
      throw new Error("No current user id resolved yet");
    }

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

  // 2) Load recruiter-channel conversations from the API
  useEffect(() => {
    if (!currentUserId) return; // wait until we know who we are
    let cancelled = false;

    async function loadThreads() {
      try {
        // 1) Fetch conversations for the recruiter channel
        const data = await fetchJson("/api/messages?channel=recruiter");
        const conversations = Array.isArray(data.conversations)
          ? data.conversations
          : [];

        // 2) For each conversation, fetch its messages
        const threadsWithMessages = await Promise.all(
          conversations.map(async (conv) => {
            try {
              const msgData = await fetchJson(
                `/api/messages?conversationId=${encodeURIComponent(conv.id)}`
              );
              const msgs = Array.isArray(msgData.messages)
                ? msgData.messages
                : [];

              const mappedMessages = msgs.map((m) => ({
                id: m.id,
                from:
                  m.senderId === currentUserId ? "recruiter" : "candidate",
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
                unread:
                  typeof conv.unread === "number" ? conv.unread : 0,
                messages: mappedMessages,
              };
            } catch (err) {
              console.error(
                "Failed to load messages for conversation",
                conv.id,
                err
              );
              return {
                id: conv.id,
                candidate: conv.name || "Conversation",
                snippet: conv.lastMessage || "",
                unread:
                  typeof conv.unread === "number" ? conv.unread : 0,
                messages: [],
              };
            }
          })
        );

        if (cancelled) return;

        setThreads(threadsWithMessages);

        // Decide which thread to focus:
        // - If we came from a candidate card with ?c=..., use that
        // - Otherwise, fall back to the first thread
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
        console.error("Failed to load recruiter threads:", err);
      }
    }

    loadThreads();

    return () => {
      cancelled = true;
    };
    // Re-run if the conversation id in the URL changes or user changes
  }, [queryConversationId, currentUserId]);

  const onSend = async (threadId, text) => {
    if (!text || !String(text).trim()) return;
    const trimmed = String(text).trim();

    try {
      // Send message to the recruiter-channel conversation
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
      // TODO: surface this in UI later
    }
  };

  // Simple loading shell while we resolve the user
  if (loadingUser || !currentUserId) {
    return (
      <PlanProvider>
        <RecruiterLayout
          title="Messaging — ForgeTomorrow"
          header={<HeaderBar onOpenBulk={() => {}} />}
          right={<RightToolsCard />}
          activeNav="messaging"
        >
          <div className="h-64 flex items-center justify-center text-slate-500">
            Loading your messaging inbox…
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
          candidatesFlat={candidatesFlat}
          bulkOpen={bulkOpen}
          setBulkOpen={setBulkOpen}
          initialThreadId={initialThreadId}
          prefillText={prefillText}
        />
      </RecruiterLayout>
    </PlanProvider>
  );
}
