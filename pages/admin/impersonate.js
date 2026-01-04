// pages/admin/impersonate.js
import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";

import InternalLayout from "@/components/layouts/InternalLayout";

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

  if (!chromeReady || status === "loading") {
    return (
      <InternalLayout forceChrome={chrome || "recruiter-smb"}>
        <main style={{ padding: 24, fontFamily: "system-ui" }}>Loading…</main>
      </InternalLayout>
    );
  }

  if (!session?.user) {
    return (
      <InternalLayout forceChrome={chrome}>
        <main style={{ padding: 24, fontFamily: "system-ui" }}>You must be signed in.</main>
      </InternalLayout>
    );
  }

  if (!isPlatformAdmin) {
    return (
      <InternalLayout forceChrome={chrome}>
        <main style={{ padding: 24, fontFamily: "system-ui" }}>Forbidden.</main>
      </InternalLayout>
    );
  }

  return (
    <InternalLayout forceChrome={chrome}>
      <Head>
        <title>Impersonate – ForgeTomorrow</title>
      </Head>

      <main style={{ padding: 24, fontFamily: "system-ui" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div
            style={{
              borderRadius: 18,
              border: "1px solid rgba(148, 163, 184, 0.35)",
              background: "rgba(255,255,255,0.78)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.10)",
              padding: 18,
            }}
          >
            <h1 style={{ marginTop: 0, marginBottom: 6 }}>Impersonation</h1>

            <p style={{ color: "#475569", lineHeight: 1.5, marginTop: 0 }}>
              Platform Admin only. Use this to support a customer account after a formal request exists.
              Actions are written to AuditLog.
            </p>

            {msg ? (
              <div
                style={{
                  marginTop: 12,
                  padding: 12,
                  borderRadius: 12,
                  background: "rgba(15, 23, 42, 0.06)",
                  color: "#0f172a",
                }}
              >
                {msg}
              </div>
            ) : null}

            <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
              <div>
                <div style={{ fontSize: 13, color: "#334155", marginBottom: 6, fontWeight: 600 }}>
                  Customer email
                </div>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="customer@email.com"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(148, 163, 184, 0.55)",
                    background: "rgba(255,255,255,0.9)",
                  }}
                  disabled={busy || active}
                />
              </div>

              <div>
                <div style={{ fontSize: 13, color: "#334155", marginBottom: 6, fontWeight: 600 }}>
                  Ticket number (required) or No-Ticket
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <input
                    value={ticketNumber}
                    onChange={(e) => setTicketNumber(e.target.value)}
                    placeholder="e.g. cmjyyujjl002mkz04gn9gvufq"
                    style={{
                      flex: "1 1 360px",
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid rgba(148, 163, 184, 0.55)",
                      background: noTicket ? "rgba(241,245,249,0.9)" : "rgba(255,255,255,0.9)",
                    }}
                    disabled={busy || active || noTicket}
                  />

                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 13,
                      color: "#334155",
                      userSelect: "none",
                    }}
                  >
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
                  <div style={{ marginTop: 6, fontSize: 12, color: "#b91c1c" }}>
                    Ticket number format looks invalid. Paste the ticket ID exactly.
                  </div>
                ) : null}

                {noTicket ? (
                  <div
                    style={{
                      marginTop: 10,
                      padding: 12,
                      borderRadius: 14,
                      background: "rgba(255, 247, 237, 0.85)",
                      border: "1px solid rgba(251, 146, 60, 0.35)",
                      color: "#7c2d12",
                      fontSize: 13,
                      lineHeight: 1.45,
                    }}
                  >
                    <div style={{ fontWeight: 800, marginBottom: 6 }}>
                      No-Ticket procedure (do this immediately after the action)
                    </div>
                    <ol style={{ margin: 0, paddingLeft: 18 }}>
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
                      padding: "10px 14px",
                      borderRadius: 12,
                      border: "1px solid #111827",
                      background: "#111827",
                      color: "white",
                      cursor: busy || !email.trim() || !reasonOk ? "not-allowed" : "pointer",
                      opacity: busy || !email.trim() || !reasonOk ? 0.6 : 1,
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
                      padding: "10px 14px",
                      borderRadius: 12,
                      border: "1px solid #b91c1c",
                      background: "#b91c1c",
                      color: "white",
                      cursor: busy ? "not-allowed" : "pointer",
                      opacity: busy ? 0.6 : 1,
                      minWidth: 120,
                    }}
                  >
                    {busy ? "Working…" : "Stop"}
                  </button>
                )}

                <div style={{ fontSize: 13, color: "#64748b" }}>
                  Return target: <code>{returnTo}</code>
                </div>
              </div>

              <div style={{ marginTop: 2, color: "#64748b", fontSize: 13 }}>
                API required: <code>/api/admin/impersonation/start</code> and <code>/api/admin/impersonation/stop</code>
              </div>
            </div>
          </div>
        </div>
      </main>
    </InternalLayout>
  );
}
