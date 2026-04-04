// pages/recruiter/messaging.js
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { PlanProvider } from "@/context/PlanContext";
import RecruiterLayout from "@/components/layouts/RecruiterLayout";
import RecruiterTitleCard from "@/components/recruiter/RecruiterTitleCard";
import RecruiterMessageCenter from "@/components/recruiter/RecruiterMessageCenter";
import RightRailPlacementManager from "@/components/ads/RightRailPlacementManager";
import { getTimeGreeting } from "@/lib/dashboardGreeting";

/* ─────────────────────────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────────────────────────── */
const GLASS = {
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.22)",
  background: "rgba(255,255,255,0.68)",
  boxShadow: "0 10px 28px rgba(15,23,42,0.12)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
};

const WHITE_CARD = {
  background: "rgba(255,255,255,0.97)",
  border: "1px solid rgba(255,255,255,0.60)",
  borderRadius: 14,
  boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
  boxSizing: "border-box",
};

const ORANGE = "#FF7043";
const MUTED = "#64748B";

/* ─────────────────────────────────────────────────────────────
   SESSION (direct fetch — avoids next-auth hook lag)
───────────────────────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────────────────────
   RIGHT RAIL
───────────────────────────────────────────────────────────── */
function RightToolsCard() {
  return <RightRailPlacementManager slot="right_rail_1" />;
}

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────── */
export default function MessagingPage() {
  const router = useRouter();

  const [currentUserId, setCurrentUserId] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [sessionError, setSessionError] = useState("");

  const [jobGroups, setJobGroups] = useState([]);
  const [talentPoolGroups, setTalentPoolGroups] = useState([]);

  // ── Load session ──────────────────────────────────────────────────────────
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
    return () => { cancelled = true; };
  }, [router]);

  // ── Load candidate groups + talent pool groups ────────────────────────────
  useEffect(() => {
    if (!currentUserId) return;
    let cancelled = false;

    async function loadGroups() {
      try {
        const res = await fetch("/api/recruiter/pipeline", {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) return;

        const data = await res.json();
        if (cancelled) return;

        setJobGroups(Array.isArray(data?.jobGroups) ? data.jobGroups : []);
        setTalentPoolGroups(
          Array.isArray(data?.talentPoolGroups) ? data.talentPoolGroups : []
        );
      } catch (err) {
        console.error("[MessagingPage] loadGroups error:", err);
      }
    }

    loadGroups();
    return () => { cancelled = true; };
  }, [currentUserId]);

  // ── API helpers passed into RecruiterMessageCenter ────────────────────────

  async function createConversation(recipientId) {
    const res = await fetch("/api/conversations", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientId: String(recipientId), channel: "recruiter" }),
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      console.error("[MessagingPage] createConversation error:", res.status, payload);
      return null;
    }

    const json = await res.json().catch(() => ({}));
    return json?.conversation || null;
  }

  async function fetchMessages(conversationId) {
    const res = await fetch(
      `/api/messages?conversationId=${encodeURIComponent(conversationId)}&channel=recruiter`,
      { credentials: "include", headers: { "Content-Type": "application/json" } }
    );

    if (!res.ok) return [];

    const data = await res.json().catch(() => ({}));
    const msgs = Array.isArray(data.messages) ? data.messages : [];

    return msgs.map((m) => ({
      id: m.id,
      from: m.senderId === currentUserId ? "recruiter" : "candidate",
      senderId: m.senderId,
      text: m.text,
      ts: m.timeIso || new Date().toISOString(),
      status: "read",
    }));
  }

  async function sendMessage(conversationId, text) {
    const res = await fetch("/api/messages", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId,
        content: text,
        channel: "recruiter",
      }),
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      console.error("[MessagingPage] sendMessage error:", res.status, payload);
      return null;
    }

    const data = await res.json().catch(() => ({}));
    return data?.message || null;
  }

  // ── Layout shared pieces ──────────────────────────────────────────────────
  const greeting = getTimeGreeting();

  const HeaderBox = (
    <RecruiterTitleCard
      greeting={greeting}
      title="Recruiter Messaging"
      subtitle="Manage recruiter conversations, saved replies, and outreach in one place."
      compact
    />
  );

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loadingUser) {
    return (
      <PlanProvider>
        <RecruiterLayout
          title="Messaging - ForgeTomorrow"
          header={HeaderBox}
		  headerCard={false}
		  right={<RightToolsCard />}
		  rightBare
		  activeNav="messaging"
		>
          <section style={{ ...GLASS, overflow: "hidden", padding: 16 }}>
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

  // ── Session error state ───────────────────────────────────────────────────
  if (!currentUserId) {
    return (
      <PlanProvider>
        <RecruiterLayout
		title="Messaging - ForgeTomorrow"
		header={HeaderBox}
		headerCard={false}
		right={<RightToolsCard />}
		rightBare
		activeNav="messaging"
	  >
          <section style={{ ...GLASS, overflow: "hidden", padding: 16 }}>
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

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <PlanProvider>
      <RecruiterLayout
		title="Messaging — ForgeTomorrow"
		header={HeaderBox}
		headerCard={false}
		right={<RightToolsCard />}
		rightBare
		activeNav="messaging"
	  >
        <RecruiterMessageCenter
          currentUserId={currentUserId}
          jobGroups={jobGroups}
          talentPoolGroups={talentPoolGroups}
          onCreateConversation={createConversation}
          fetchMessages={fetchMessages}
          onSendMessage={sendMessage}
        />
      </RecruiterLayout>
    </PlanProvider>
  );
}