// pages/coach/messaging.js
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { PlanProvider, usePlan } from "@/context/PlanContext";
import CoachingLayout from "@/components/layouts/CoachingLayout";
import MessageThread from "@/components/recruiter/MessageThread";
import SavedReplies from "@/components/recruiter/SavedReplies";
import BulkMessageModal from "@/components/recruiter/BulkMessageModal";
import { SecondaryButton } from "@/components/ui/Buttons";
import { getClientSession } from "@/lib/auth-client";

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
          View and reply to conversations with seekers and clients. Bulk
          messaging is available on Enterprise.
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
   RIGHT SIDEBAR CARD + AD SLOT
---------------------------------------------- */
function RightToolsCard() {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="font-medium mb-2">Tips</div>
      <div className="text-sm text-slate-600 space-y-2">
        <p>Keep bulk messages short and human.</p>
        <p>Use saved replies for common touchpoints, then personalize.</p>
      </div>
    </div>
  );
}

function RightRail() {
  return (
    <div className="space-y-4">
      <RightToolsCard />

      {/* Advertisement slot */}
      <div className="rounded-lg border bg-white p-4">
        <div className="font-medium mb-2">Sponsored</div>
        <div className="text-sm text-slate-600">
          Your advertisement could be here.
          <br />
          Contact{" "}
          <a
            href="mailto:sales@forgetomorrow.com"
            className="text-[#FF7043] underline"
          >
            sales@forgetomorrow.com
          </a>
          .
        </div>
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
}) {
  const { isEnterprise } = usePlan();

  const onBulkSend = (ids, text) => {
    console.log("COACH BULK SEND", { ids, text });
    setBulkOpen(false);
  };

  // Prefill logic when arriving from Coach → Clients → Message seeker
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
      {/* Explainer: how to start new threads */}
      <div className="mb-2 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-700">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          How messaging works
        </p>
        <p className="mt-1">
          To start a new conversation, open your{" "}
          <span className="font-semibold">Clients</span> (or Seekers) view and
          click <span className="font-mono text-[11px]">Message</span> on any
          card. We&apos;ll ask whether to use your{" "}
          <span className="font-semibold">Coach inbox</span> or your{" "}
          <span className="font-semibold">Signal (personal)</span> inbox, and
          that thread will appear here.
        </p>
      </div>

      <MessageThread
        threads={threads}
        initialThreadId={initialThreadId || threads[0]?.id}
        onSend={onSend}
      />

      <SavedReplies
        onInsert={(text) => {
          const el = document.querySelector(
            'input[placeholder="Type a message…"]'
          );
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
export default function CoachMessagingPage() {
  const router = useRouter();
  const [threads, setThreads] = useState([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [initialThreadId, setInitialThreadId] = useState(null);

  const [currentUserId, setCurrentUserId] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const queryConversationId =
    (router.query.c && String(router.query.c)) ||
    (router.query.conversationId && String(router.query.conversationId)) ||
    null;

  const prefillText =
    typeof router.query.prefill === "string" ? router.query.prefill : "";

  /* ---------------------------------------------
     1) LOAD USER — avoid false redirects
  ---------------------------------------------- */
  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        const session = await getClientSession();

        // Hydration delay: don't redirect yet if session is temporarily null
        if (!session) return;

        if (!session.user?.id) {
          if (!cancelled) {
            await router.replace("/auth/signin");
          }
          return;
        }

        if (!cancelled) {
          setCurrentUserId(session.user.id);
        }
      } catch (err) {
        console.error("Failed to load session for coach messaging:", err);
        if (!cancelled) {
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

  /* ---------------------------------------------
     2) fetchJson helper
  ---------------------------------------------- */
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

  /* ---------------------------------------------
     3) LOAD THREADS  (channel=coach)
  ---------------------------------------------- */
  useEffect(() => {
    if (!currentUserId) return;
    let cancelled = false;

    async function loadThreads() {
      try {
        const data = await fetchJson("/api/messages?channel=coach");
        const conversations = Array.isArray(data.conversations)
          ? data.conversations
          : [];

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
                from: m.senderId === currentUserId ? "coach" : "seeker",
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
              };
            } catch (err) {
              console.error("Failed to load messages for", conv.id, err);
              return {
                id: conv.id,
                candidate: conv.name || "Conversation",
                snippet: conv.lastMessage || "",
                unread: typeof conv.unread === "number" ? conv.unread : 0,
                messages: [],
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

  /* ---------------------------------------------
     4) SEND MESSAGES  (channel=coach)
  ---------------------------------------------- */
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

  /* ---------------------------------------------
     LOADING STATE (only while session resolves)
  ---------------------------------------------- */
  if (loadingUser) {
    return (
      <PlanProvider>
        <CoachingLayout
          title="Messaging — ForgeTomorrow"
          header={<HeaderBar onOpenBulk={() => {}} />}
          right={<RightRail />}
          activeNav="coach-messages"
          footer={null}
        >
          <div className="h-64 flex items-center justify-center text-slate-500">
            Loading…
          </div>
        </CoachingLayout>
      </PlanProvider>
    );
  }

  /* ---------------------------------------------
     RENDER PAGE (even if threads = [])
  ---------------------------------------------- */
  return (
    <PlanProvider>
      <CoachingLayout
        title="Messaging — ForgeTomorrow"
        header={<HeaderBar onOpenBulk={() => setBulkOpen(true)} />}
        right={<RightRail />}
        activeNav="coach-messages"
        footer={null}
      >
        <Body
          threads={threads}
          onSend={onSend}
          candidatesFlat={[]} // no fake placeholder clients
          bulkOpen={bulkOpen}
          setBulkOpen={setBulkOpen}
          initialThreadId={initialThreadId}
          prefillText={prefillText}
        />
      </CoachingLayout>
    </PlanProvider>
  );
}
