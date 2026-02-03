// pages/coaching/messaging.js
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { PlanProvider } from "@/context/PlanContext";
import CoachingLayout from "@/components/layouts/CoachingLayout";
import MessageThread from "@/components/recruiter/MessageThread";
import SavedReplies from "@/components/recruiter/SavedReplies";
import BulkMessageModal from "@/components/recruiter/BulkMessageModal";
import { SecondaryButton } from "@/components/ui/Buttons";
import { getClientSession } from "@/lib/auth-client";

/* ---------------------------------------------
   HEADER CARD WRAPPER
---------------------------------------------- */
function HeaderCard({ children }) {
  return (
    <section
      style={{
        background: "white",
        border: "1px solid #eee",
        borderRadius: 12,
        padding: 16,
        boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
        textAlign: "center",
      }}
    >
      {children}
    </section>
  );
}

/* ---------------------------------------------
   HEADER BAR
---------------------------------------------- */
function HeaderBar({ onOpenBulk }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-3">
      <div className="hidden md:block" />
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[#FF7043]">Messaging</h1>
        <p className="text-sm text-slate-600 mt-1 max-w-xl mx-auto">
          Communicate with your clients and seekers in one place. Send one-to-one
          messages or group updates to support the people you’re actively coaching.
        </p>
      </div>
      <div className="justify-self-center md:justify-self-end">
        <SecondaryButton onClick={onOpenBulk}>Group Message</SecondaryButton>
      </div>
    </div>
  );
}

/* ---------------------------------------------
   RIGHT SIDEBAR
---------------------------------------------- */
function RightToolsCard() {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="font-medium mb-2">Tips</div>
      <div className="text-sm text-slate-600 space-y-2">
        <p>Group messages work best for updates, reminders, and shared guidance.</p>
        <p>Saved replies can help with common check-ins — personal notes still matter.</p>
      </div>
    </div>
  );
}

function RightRail() {
  return (
    <div className="space-y-4">
      <RightToolsCard />

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
  recipients,
  bulkOpen,
  setBulkOpen,
  initialThreadId,
  prefillText,
  onBulkSendDb,
}) {
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
          Start conversations from a client or seeker profile by clicking{" "}
          <span className="font-semibold">Message</span>. You can also send group
          updates for newsletters, reminders, or shared guidance. All replies stay
          organized here so you can focus on coaching.
        </p>
      </div>

      <MessageThread
        threads={threads}
        initialThreadId={initialThreadId || threads[0]?.id}
        onSend={onSend}
        inboxTitle="Coach Inbox"
        inboxBlurb={
          <p className="mt-1 text-[11px] text-slate-500 leading-snug">
            Conversations you start as a <span className="font-semibold">Coach</span>{" "}
            will show here. Personal DMs live in{" "}
            <span className="font-semibold">The Signal</span>.
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
              <span className="font-semibold">The Signal</span>.
            </p>
          </>
        }
      />

      <SavedReplies
        persona="coach"
        title="Saved Replies (Coach)"
        onInsert={(text) => {
          const el = document.querySelector('input[placeholder="Type a message…"]');
          if (el) {
            el.value = el.value ? `${el.value} ${text}` : text;
            el.dispatchEvent(new Event("input", { bubbles: true }));
            el.focus();
          }
        }}
      />

      <BulkMessageModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        candidates={recipients}
        onSend={onBulkSendDb}
        title="Group Message"
        recipientLabelPlural="clients"
        emptyRecipientsText="No clients available yet."
        messagePlaceholder="Write your message once — it will be sent to all selected clients."
      />
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

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        const session = await getClientSession();
        if (!session) return;

        if (!session.user?.id) {
          if (!cancelled) await router.replace("/auth/signin");
          return;
        }

        if (!cancelled) setCurrentUserId(session.user.id);
      } catch (err) {
        console.error("Failed to load session for coach messaging:", err);
        if (!cancelled) await router.replace("/auth/signin");
      } finally {
        if (!cancelled) setLoadingUser(false);
      }
    }

    loadUser();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function fetchJson(url, options = {}) {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        ...(currentUserId ? { "x-user-id": currentUserId } : {}),
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Request failed (${res.status}): ${text}`);
    }

    return res.json();
  }

  useEffect(() => {
    if (loadingUser) return; // ✅ minimal: wait for session resolution, not currentUserId
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
                from: m.senderId === currentUserId ? "recruiter" : "candidate",
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
  }, [queryConversationId, currentUserId, loadingUser]);

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

  if (loadingUser) {
    return (
      <PlanProvider>
        <CoachingLayout
          title="Messaging — ForgeTomorrow"
          header={
            <HeaderCard>
              <HeaderBar onOpenBulk={() => {}} />
            </HeaderCard>
          }
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

  return (
    <PlanProvider>
      <CoachingLayout
        title="Messaging — ForgeTomorrow"
        header={
          <HeaderCard>
            <HeaderBar onOpenBulk={() => setBulkOpen(true)} />
          </HeaderCard>
        }
        right={<RightRail />}
        activeNav="coach-messages"
        footer={null}
      >
        <Body
          threads={threads}
          onSend={onSend}
          recipients={recipients}
          bulkOpen={bulkOpen}
          setBulkOpen={setBulkOpen}
          initialThreadId={initialThreadId}
          prefillText={prefillText}
          onBulkSendDb={onBulkSendDb}
        />
      </CoachingLayout>
    </PlanProvider>
  );
}
