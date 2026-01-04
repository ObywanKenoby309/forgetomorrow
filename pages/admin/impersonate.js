// pages/admin/impersonate.js
import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";

import SeekerLayout from "@/components/layouts/SeekerLayout";

const UI = {
  CARD_PAD: 14,
  // If header still sits too low/high vs sidebars, adjust ONLY this:
  // Examples: 0, -6, -10
  HEADER_OFFSET: -8,
};

const GLASS = {
  border: "1px solid rgba(255,255,255,0.22)",
  background: "rgba(255,255,255,0.58)",
  boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
};

function readCookie(name) {
  try {
    const raw = document.cookie || "";
    const parts = raw.split(";").map((p) => p.trim());
    for (const p of parts) {
      if (p.startsWith(name + "=")) return decodeURIComponent(p.slice(name.length + 1));
    }
    return "";
  } catch {
    return "";
  }
}

async function safeReadJson(res) {
  try {
    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// Example: cmjyyujjl002mkz04gn9gvufq
function isValidTicketNumber(v) {
  const s = String(v || "").trim();
  if (!s) return false;
  return /^c[a-z0-9]{20,}$/.test(s);
}

function extractChromeFromAsPath(asPath) {
  try {
    const s = String(asPath || "");
    if (!s.includes("chrome=")) return "";
    const qIndex = s.indexOf("?");
    if (qIndex === -1) return "";
    const query = s.slice(qIndex + 1);
    const params = new URLSearchParams(query);
    return String(params.get("chrome") || "").toLowerCase().trim();
  } catch {
    return "";
  }
}

function inferChromeFromSession(session) {
  // Your saved chrome gates: seeker | coach | recruiter-smb | recruiter-ent
  const role = String(session?.user?.role || "").toUpperCase();
  const plan = String(session?.user?.plan || "").toUpperCase();

  if (role === "COACH") return "coach";
  if (role === "RECRUITER" || role === "ADMIN") {
    if (plan.includes("ENTERPRISE")) return "recruiter-ent";
    return "recruiter-smb";
  }
  return "seeker";
}

function ImpersonateHeaderBox() {
  return (
    <section className="px-4">
      <div
        className="max-w-4xl mx-auto"
        style={{
          marginTop: UI.HEADER_OFFSET,
          borderRadius: 14,
          padding: UI.CARD_PAD,
          textAlign: "center",
          ...GLASS,
        }}
        aria-label="Impersonation overview"
      >
        <h1 style={{ margin: 0, color: "#FF7043", fontSize: 22, fontWeight: 900 }}>
          Impersonation
        </h1>
        <p style={{ margin: "6px auto 0", color: "#455A64", maxWidth: 760, fontWeight: 600 }}>
          Platform Admin only. Use this to support a customer account after a formal request exists.
          Actions are written to AuditLog.
        </p>
      </div>
    </section>
  );
}

function ImpersonationPolicyRightCard() {
  return (
    <aside className="p-4 md:p-6 space-y-4">
      <div
        style={{
          borderRadius: 14,
          padding: UI.CARD_PAD,
          border: GLASS.border,
          background: GLASS.background,
          boxShadow: GLASS.boxShadow,
          backdropFilter: GLASS.backdropFilter,
          WebkitBackdropFilter: GLASS.WebkitBackdropFilter,
        }}
        aria-label="Impersonation policy"
      >
        <div style={{ fontSize: 14, fontWeight: 900, color: "#1F2937" }}>
          Staff Policy Reminder
        </div>

        <p style={{ marginTop: 8, fontSize: 12, color: "#455A64", fontWeight: 600, lineHeight: 1.45 }}>
          This tool grants the ability to act as a customer. Use only for customer support scenarios.
          Every start/stop is audited.
        </p>

        <div
          style={{
            marginTop: 12,
            borderRadius: 12,
            padding: 12,
            border: "1px solid rgba(0,0,0,0.08)",
            background: "rgba(255,255,255,0.60)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 900, color: "#1F2937" }}>
            Required before Start
          </div>
          <ul style={{ marginTop: 8, paddingLeft: 18, fontSize: 12, color: "#334155", fontWeight: 600 }}>
            <li>Provide a valid Support Ticket ID (preferred)</li>
            <li>
              If no ticket exists: select <strong>No ticket (emergency)</strong> and create a ticket immediately after
              the action
            </li>
            <li>Perform the minimum necessary action only</li>
          </ul>
        </div>

        <div
          style={{
            marginTop: 12,
            borderRadius: 12,
            padding: 12,
            border: "1px solid rgba(255,112,67,0.35)",
            background: "rgba(255,255,255,0.62)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 900, color: "#7C2D12" }}>
            No-Ticket rule
          </div>
          <p style={{ marginTop: 8, fontSize: 12, color: "#7C2D12", fontWeight: 700, lineHeight: 1.45 }}>
            If you start with <strong>No-Ticket</strong>, you must open a Support Desk ticket right after completing
            the emergency action and include the details.
          </p>
        </div>

        <div style={{ marginTop: 12, fontSize: 11, color: "#64748B", fontWeight: 700 }}>
          Ticket format example: <code style={{ color: "#334155" }}>cmjyyujjl002mkz04gn9gvufq</code>
        </div>
      </div>
    </aside>
  );
}

export default function AdminImpersonatePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [email, setEmail] = useState("");
  const [ticketNumber, setTicketNumber] = useState("");
  const [noTicket, setNoTicket] = useState(false);

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [active, setActive] = useState(false);

  const [chrome, setChrome] = useState("");
  const [chromeReady, setChromeReady] = useState(false);

  const isPlatformAdmin = !!session?.user?.isPlatformAdmin;

  useEffect(() => {
    setActive(readCookie("ft_imp_active") === "1");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let next = "";

    const q = String(router?.query?.chrome || "").toLowerCase().trim();
    if (q) next = q;

    if (!next) next = extractChromeFromAsPath(router?.asPath);

    if (!next) {
      try {
        const params = new URLSearchParams(window.location.search || "");
        next = String(params.get("chrome") || "").toLowerCase().trim();
      } catch {}
    }

    if (!next) {
      try {
        const lastRoute = sessionStorage.getItem("lastRoute") || "";
        if (lastRoute.startsWith("/recruiter")) {
          next = inferChromeFromSession(session);
        } else if (lastRoute.startsWith("/coach") || lastRoute.startsWith("/dashboard/coaching")) {
          next = "coach";
        } else if (lastRoute.startsWith("/seeker") || lastRoute.startsWith("/hearth")) {
          next = "seeker";
        }
      } catch {}
    }

    if (!next) next = inferChromeFromSession(session);

    setChrome(next);
    setChromeReady(true);
  }, [router?.asPath, router?.query?.chrome, session]);

  const returnTo = useMemo(() => {
    const r = String(router.query.returnTo || "");
    return r || "/recruiter/dashboard";
  }, [router.query.returnTo]);

  const reasonValue = useMemo(() => {
    if (noTicket) return "NO-TICKET";
    return String(ticketNumber || "").trim();
  }, [noTicket, ticketNumber]);

  const reasonOk = useMemo(() => {
    if (noTicket) return true;
    return isValidTicketNumber(ticketNumber);
  }, [noTicket, ticketNumber]);

  async function start() {
    setMsg("");

    if (!email.trim()) {
      setMsg("Email is required.");
      return;
    }
    if (!reasonOk) {
      setMsg("Ticket Number is required (valid) OR select No-Ticket.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/admin/impersonation/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, reason: reasonValue }),
      });

      const data = await safeReadJson(res);

      if (!res.ok) {
        const apiErr = data?.error || data?.message;
        if (res.status === 404) throw new Error("Missing API route: /api/admin/impersonation/start");
        throw new Error(apiErr || `Failed to start impersonation (HTTP ${res.status})`);
      }

      setActive(true);
      setMsg(`Impersonation started for ${data?.target?.email || email}`);
      setTimeout(() => router.push(returnTo), 400);
    } catch (e) {
      setMsg(e?.message || "Failed to start impersonation");
    } finally {
      setBusy(false);
    }
  }

  async function stop() {
    setMsg("");
    setBusy(true);
    try {
      const res = await fetch("/api/admin/impersonation/stop", { method: "POST" });
      const data = await safeReadJson(res);

      if (!res.ok) {
        const apiErr = data?.error || data?.message;
        if (res.status === 404) throw new Error("Missing API route: /api/admin/impersonation/stop");
        throw new Error(apiErr || `Failed to stop impersonation (HTTP ${res.status})`);
      }

      setActive(false);
      setMsg("Impersonation stopped.");
      setTimeout(() => router.push(returnTo), 400);
    } catch (e) {
      setMsg(e?.message || "Failed to stop impersonation");
    } finally {
      setBusy(false);
    }
  }

  const pageTitle = "ForgeTomorrow – Impersonate";

  if (!chromeReady || status === "loading") {
    return (
      <SeekerLayout title={pageTitle} header={<ImpersonateHeaderBox />} right={<ImpersonationPolicyRightCard />} activeNav="support">
        <div className="max-w-4xl mx-auto p-6">
          <p className="text-sm text-slate-500">Loading…</p>
        </div>
      </SeekerLayout>
    );
  }

  if (!session?.user) {
    return (
      <SeekerLayout title={pageTitle} header={<ImpersonateHeaderBox />} right={<ImpersonationPolicyRightCard />} activeNav="support">
        <div className="max-w-4xl mx-auto p-6">
          <div
            style={{
              borderRadius: 14,
              padding: UI.CARD_PAD,
              ...GLASS,
            }}
          >
            <p className="text-sm text-slate-700">You must be signed in.</p>
          </div>
        </div>
      </SeekerLayout>
    );
  }

  if (!isPlatformAdmin) {
    return (
      <SeekerLayout title={pageTitle} header={<ImpersonateHeaderBox />} right={<ImpersonationPolicyRightCard />} activeNav="support">
        <div className="max-w-4xl mx-auto p-6">
          <div
            style={{
              borderRadius: 14,
              padding: UI.CARD_PAD,
              ...GLASS,
            }}
          >
            <p className="text-sm text-slate-700">Forbidden.</p>
          </div>
        </div>
      </SeekerLayout>
    );
  }

  return (
    <SeekerLayout title={pageTitle} header={<ImpersonateHeaderBox />} right={<ImpersonationPolicyRightCard />} activeNav="support">
      <Head>
        <title>Impersonate – ForgeTomorrow</title>
      </Head>

      <div className="max-w-4xl mx-auto p-6 space-y-10">
        <section
          style={{
            borderRadius: 14,
            padding: UI.CARD_PAD,
            ...GLASS,
          }}
        >
          {msg ? (
            <div
              style={{
                marginBottom: 12,
                borderRadius: 12,
                padding: 12,
                border: "1px solid rgba(0,0,0,0.08)",
                background: "rgba(255,255,255,0.60)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                color: "#0f172a",
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              {msg}
            </div>
          ) : null}

          <div style={{ display: "grid", gap: 14 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 900, color: "#334155", marginBottom: 8 }}>
                Customer email
              </div>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@email.com"
                disabled={busy || active}
                style={{
                  width: "100%",
                  borderRadius: 12,
                  padding: "10px 12px",
                  border: "1px solid rgba(0,0,0,0.12)",
                  background: "rgba(255,255,255,0.75)",
                  outline: "none",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              />
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 900, color: "#334155", marginBottom: 8 }}>
                Ticket number (required) or No-Ticket
              </div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <input
                  value={ticketNumber}
                  onChange={(e) => setTicketNumber(e.target.value)}
                  placeholder="e.g. cmjyyujjl002mkz04gn9gvufq"
                  disabled={busy || active || noTicket}
                  style={{
                    flex: "1 1 320px",
                    borderRadius: 12,
                    padding: "10px 12px",
                    border: "1px solid rgba(0,0,0,0.12)",
                    background: noTicket ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.75)",
                    outline: "none",
                    fontSize: 14,
                    fontWeight: 700,
                    color: noTicket ? "rgba(15,23,42,0.45)" : "#0f172a",
                  }}
                />

                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 800, color: "#334155" }}>
                  <input
                    type="checkbox"
                    checked={noTicket}
                    onChange={(e) => {
                      const checked = !!e.target.checked;
                      setNoTicket(checked);
                      if (checked) setTicketNumber("");
                    }}
                    disabled={busy || active}
                  />
                  No ticket (emergency)
                </label>
              </div>

              {!active && !noTicket && ticketNumber.trim() && !isValidTicketNumber(ticketNumber) ? (
                <div style={{ marginTop: 8, fontSize: 12, fontWeight: 800, color: "#b91c1c" }}>
                  Ticket number format looks invalid. Paste the ticket ID exactly.
                </div>
              ) : null}

              {noTicket ? (
                <div
                  style={{
                    marginTop: 12,
                    borderRadius: 12,
                    padding: 12,
                    border: "1px solid rgba(255,112,67,0.35)",
                    background: "rgba(255,255,255,0.62)",
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                    color: "#7C2D12",
                  }}
                >
                  <div style={{ fontWeight: 900, marginBottom: 6, fontSize: 13 }}>
                    No-Ticket procedure (do this immediately after the action)
                  </div>
                  <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12, fontWeight: 700, lineHeight: 1.5 }}>
                    <li>Complete the emergency action for the customer (minimum necessary).</li>
                    <li>
                      Open a Support Desk ticket right away and include: who requested it, what action was taken,
                      what account it impacted, and who performed it.
                    </li>
                    <li>Add any supporting email/message details into the ticket.</li>
                  </ol>
                </div>
              ) : null}
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              {!active ? (
                <button
                  onClick={start}
                  disabled={busy || !email.trim() || !reasonOk}
                  style={{
                    borderRadius: 12,
                    padding: "10px 14px",
                    border: "1px solid rgba(15,23,42,0.85)",
                    background: busy || !email.trim() || !reasonOk ? "rgba(15,23,42,0.35)" : "rgba(15,23,42,0.92)",
                    color: "white",
                    fontWeight: 900,
                    cursor: busy || !email.trim() || !reasonOk ? "not-allowed" : "pointer",
                    minWidth: 120,
                  }}
                >
                  {busy ? "Working…" : "Start"}
                </button>
              ) : (
                <button
                  onClick={stop}
                  disabled={busy}
                  style={{
                    borderRadius: 12,
                    padding: "10px 14px",
                    border: "1px solid rgba(185,28,28,0.85)",
                    background: busy ? "rgba(185,28,28,0.35)" : "rgba(185,28,28,0.92)",
                    color: "white",
                    fontWeight: 900,
                    cursor: busy ? "not-allowed" : "pointer",
                    minWidth: 120,
                  }}
                >
                  {busy ? "Working…" : "Stop"}
                </button>
              )}

              <div style={{ fontSize: 12, color: "#64748B", fontWeight: 800 }}>
                Return target: <code style={{ color: "#334155" }}>{returnTo}</code>
              </div>
            </div>

            <div style={{ fontSize: 11, color: "#64748B", fontWeight: 800 }}>
              API required: <code style={{ color: "#334155" }}>/api/admin/impersonation/start</code> and{" "}
              <code style={{ color: "#334155" }}>/api/admin/impersonation/stop</code>
            </div>

            {chrome ? (
              <div style={{ fontSize: 11, color: "rgba(100,116,139,0.85)", fontWeight: 800 }}>
                Chrome: <code>{chrome}</code>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </SeekerLayout>
  );
}
