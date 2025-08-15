// pages/recruiter/messaging.js
import { useState } from "react";
import { PlanProvider, usePlan } from "@/context/PlanContext";
import RecruiterLayout from "@/components/layouts/RecruiterLayout";
import MessageThread from "@/components/recruiter/MessageThread";
import SavedReplies from "@/components/recruiter/SavedReplies";
import BulkMessageModal from "@/components/recruiter/BulkMessageModal";
import { SecondaryButton } from "@/components/ui/Buttons";

/** Header (centered title + action on right) */
function HeaderBar({ onOpenBulk }) {
  const { isEnterprise } = usePlan();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-3">
      <div className="hidden md:block" />
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[#FF7043]">Messaging</h1>
        <p className="text-sm text-slate-600 mt-1 max-w-xl mx-auto">
          View and reply to candidate conversations, or send bulk messages with Enterprise.
        </p>
      </div>
      <div className="justify-self-center md:justify-self-end">
        {isEnterprise ? (
          <SecondaryButton onClick={onOpenBulk}>Bulk Message</SecondaryButton>
        ) : (
          // Overlay tooltip in locked mode so layout/height doesn't change
          <span className="relative inline-block align-middle group">
            <SecondaryButton onClick={(e) => e.preventDefault()}>Bulk Message</SecondaryButton>
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

function Body({ threads, onSend, candidatesFlat, bulkOpen, setBulkOpen }) {
  const { isEnterprise } = usePlan();

  const onBulkSend = (ids, text) => {
    console.log("BULK SEND", { ids, text });
    setBulkOpen(false);
  };

  return (
    <main className="space-y-6">
      <MessageThread threads={threads} initialThreadId={101} onSend={onSend} />

      {/* Saved replies manager (available to all plans) */}
      <SavedReplies
        onInsert={(text) => {
          const el = document.querySelector('input[placeholder="Type a message…"]');
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
  const [threads, setThreads] = useState([
    {
      id: 101,
      candidate: "Jane Doe",
      snippet: "Thanks for the update…",
      unread: 0,
      messages: [
        { id: "m1", from: "candidate", text: "Hi! Thanks for reaching out.", ts: new Date().toISOString() },
        { id: "m2", from: "recruiter", text: "Great, let’s schedule a call.", ts: new Date().toISOString(), status: "read" },
      ],
    },
    {
      id: 102,
      candidate: "Omar Reed",
      snippet: "Available Thursday at 2pm…",
      unread: 1,
      messages: [{ id: "m3", from: "candidate", text: "Thursday 2pm works for me.", ts: new Date().toISOString() }],
    },
    {
      id: 103,
      candidate: "Priya Kumar",
      snippet: "Attaching my portfolio…",
      unread: 0,
      messages: [{ id: "m4", from: "candidate", text: "Here’s my portfolio link.", ts: new Date().toISOString() }],
    },
  ]);

  const [bulkOpen, setBulkOpen] = useState(false);

  const onSend = (threadId, text) => {
    setThreads((prev) =>
      prev.map((t) =>
        t.id !== threadId
          ? t
          : {
              ...t,
              snippet: text,
              messages: [
                ...t.messages,
                { id: `m-${Date.now()}`, from: "recruiter", text, ts: new Date().toISOString(), status: "sent" },
              ],
            }
      )
    );
    setTimeout(() => {
      setThreads((prev) =>
        prev.map((t) =>
          t.id !== threadId
            ? t
            : { ...t, messages: t.messages.map((m) => (m.id.startsWith("m-") ? { ...m, status: "read" } : m)) }
        )
      );
    }, 800);
  };

  const candidatesFlat = [
    { id: 1, name: "Jane Doe", role: "Client Success Lead", location: "Remote" },
    { id: 2, name: "Omar Reed", role: "Onboarding Specialist", location: "Nashville, TN" },
    { id: 3, name: "Priya Kumar", role: "Solutions Architect", location: "Austin, TX" },
  ];

  return (
    <PlanProvider>
      <RecruiterLayout
        title="Messaging — ForgeTomorrow"
        header={<HeaderBar onOpenBulk={() => setBulkOpen(true)} />}
        right={<RightToolsCard />}
      >
        <Body
          threads={threads}
          onSend={onSend}
          candidatesFlat={candidatesFlat}
          bulkOpen={bulkOpen}
          setBulkOpen={setBulkOpen}
        />
      </RecruiterLayout>
    </PlanProvider>
  );
}
