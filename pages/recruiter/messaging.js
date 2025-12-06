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

/* ---------------------------------------------
   PERSONA WARNING MODAL
---------------------------------------------- */
function PersonaWarningModal({ open, onConfirm, onCancel }) {
  const [dontRemind, setDontRemind] = useState(false);

  useEffect(() => {
    if (!open) {
      setDontRemind(false);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-lg bg-white shadow-xl border p-6">
        <h2 className="text-lg font-semibold mb-2">
          You&apos;re switching to your Personal persona
        </h2>
        <p className="text-sm text-slate-600 mb-3">
          Messages sent as <strong>Personal</strong> will appear in{" "}
          <span className="font-medium">The Signal</span>, not your recruiter
          inbox. Recipients will see you as your personal identity, not your
          recruiter role.
        </p>
        <label className="flex items-center gap-2 text-sm text-slate-600 mb-4">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={dontRemind}
            onChange={(e) => setDontRemind(e.target.checked)}
          />
          <span>Don&apos;t remind me again</span>
        </label>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded border text-sm hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(dontRemind)}
            className="px-4 py-2 rounded text-sm text-white bg-[#FF7043] hover:bg-[#F4511E]"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------
   HEADER BAR
---------------------------------------------- */
function HeaderBar({ onOpenBulk, persona, onPersonaChange }) {
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
      <div className="justify-self-center md:justify-self-end flex flex-col items-center md:items-end gap-2">
        {/* Persona selector */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-wide text-slate-500">
            Send as
          </span>
          <select
            value={persona}
            onChange={(e) => onPersonaChange?.(e.target.value)}
            className="border rounded px-2 py-1 text-xs bg-white"
          >
            <option value="recruiter">Recruiter</option>
            <option value="personal">Personal</option>
          </select>
        </div>
        {/* Bulk button */}
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
}) {
  const { isEnterprise } = usePlan();

  const onBulkSend = (ids, text) => {
    console.log("BULK SEND", { ids, text });
    setBulkOpen(false);
  };

  // Prefill logic when arriving from Recruiter → Candidates → Message candidate
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
export default function MessagingPage() {
  const router = useRouter();
  const [threads, setThreads] = useState([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [initialThreadId, setInitialThreadId] = useState(null);

  const [currentUserId, setCurrentUserId] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // persona: "recruiter" | "personal"
  const [persona, setPersona] = useState("recruiter");
  const [personaWarningOpen, setPersonaWarningOpen] = useState(false);
  const [pendingPersona, setPendingPersona] = useState(null);
  const [personaWarningSuppressed, setPersonaWarningSuppressed] =
    useState(false);

  const queryConversationId =
    (router.query.c && String(router.query.c)) ||
    (router.query.conversationId && String(router.query.conversationId)) ||
    null;

  const prefillText =
    typeof router.query.prefill === "string" ? router.query.prefill : "";

  // ---------------------------------------------
  //  Load persona warning suppression from localStorage
  // ---------------------------------------------
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("ft_persona_warning_suppressed");
      if (raw === "true") {
        setPersonaWarningSuppressed(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const handlePersonaChange = (next) => {
    if (next === persona) return;

    if (next === "personal" && !personaWarningSuppressed) {
      setPendingPersona(next);
      setPersonaWarningOpen(true);
      return;
    }

    setPersona(next);
  };

  const handlePersonaConfirm = (dontRemind) => {
    setPersonaWarningOpen(false);
    if (pendingPersona) {
      setPersona(pendingPersona);
      setPendingPersona(null);
    }
    if (dontRemind && typeof window !== "undefined") {
      try {
        localStorage.setItem("ft_persona_warning_suppressed", "true");
      } catch {
        // ignore
      }
      setPersonaWarningSuppressed(true);
    }
  };

  const handlePersonaCancel = () => {
    setPersonaWarningOpen(false);
    setPendingPersona(null);
  };

  // ---------------------------------------------
  // 1) LOAD USER — avoid false redirect during hydration
  // ---------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        const session = await getClientSession();

        // Hydration delay — NextAuth may briefly return null
        if (!session) return;

        if (!session.user?.id) {
          if (!cancelled) await router.replace("/auth/signin");
          return;
        }

        if (!cancelled) setCurrentUserId(session.user.id);
      } catch (err) {
        console.error("Failed to load session for recruiter messaging:", err);
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

  // ---------------------------------------------
  // 2) fetchJson helper with x-user-id
  // ---------------------------------------------
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

  // ---------------------------------------------
  // 3) LOAD THREADS (Recruiter inbox only)
  // ---------------------------------------------
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
                `/api/messages?conversationId=${encodeURIComponent(conv.id)}`
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
        console.error("Failed to load recruiter threads:", err);
      }
    }

    loadThreads();
    return () => {
      cancelled = true;
    };
  }, [queryConversationId, currentUserId]);

  // ---------------------------------------------
  // 4) SEND MESSAGES — route by persona
  // ---------------------------------------------
  const onSend = async (threadId, text) => {
    if (!text || !String(text).trim()) return;

    const trimmed = text.trim();
    const channel = persona === "personal" ? "seeker" : "recruiter";

    try {
      const data = await fetchJson("/api/messages", {
        method: "POST",
        body: JSON.stringify({
          conversationId: threadId,
          content: trimmed,
          channel,
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

  // ---------------------------------------------
  //  LOADING STATE
  // ---------------------------------------------
  if (loadingUser || !currentUserId) {
    return (
      <PlanProvider>
        <RecruiterLayout
          title="Messaging — ForgeTomorrow"
          header={
            <HeaderBar
              onOpenBulk={() => {}}
              persona={persona}
              onPersonaChange={handlePersonaChange}
            />
          }
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

  // ---------------------------------------------
  //  RENDER PAGE
  // ---------------------------------------------
  return (
    <PlanProvider>
      <RecruiterLayout
        title="Messaging — ForgeTomorrow"
        header={
          <HeaderBar
            onOpenBulk={() => setBulkOpen(true)}
            persona={persona}
            onPersonaChange={handlePersonaChange}
          />
        }
        right={<RightToolsCard />}
        activeNav="messaging"
      >
        <Body
          threads={threads}
          onSend={onSend}
          // No fake candidates; Bulk modal will show "No candidates available."
          candidatesFlat={[]}
          bulkOpen={bulkOpen}
          setBulkOpen={setBulkOpen}
          initialThreadId={initialThreadId}
          prefillText={prefillText}
        />

        <PersonaWarningModal
          open={personaWarningOpen}
          onConfirm={handlePersonaConfirm}
          onCancel={handlePersonaCancel}
        />
      </RecruiterLayout>
    </PlanProvider>
  );
}
