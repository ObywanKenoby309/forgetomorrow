// pages/admin/impersonate.js
import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";

import SeekerLayout from "@/components/layouts/SeekerLayout";
import SeekerRightColumn from "@/components/seeker/SeekerRightColumn";

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
    <section className="px-4 pt-4 md:pt-6">
      <div className="max-w-4xl mx-auto rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-sm shadow-md px-5 py-4 md:px-8 md:py-6 text-center">
        <h1 className="m-0 text-2xl md:text-3xl font-extrabold tracking-tight text-[#FF7043]">
          Impersonation
        </h1>
        <p className="mt-2 text-sm md:text-base text-slate-600 max-w-2xl mx-auto">
          Platform Admin only. Use this to support a customer account after a formal request exists.
          Actions are written to AuditLog.
        </p>
      </div>
    </section>
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
      <SeekerLayout
        title={pageTitle}
        header={<ImpersonateHeaderBox />}
        right={<SeekerRightColumn variant="support" />}
        activeNav="support"
      >
        <div className="max-w-4xl mx-auto p-6">
          <p className="text-sm text-slate-500">Loading…</p>
        </div>
      </SeekerLayout>
    );
  }

  if (!session?.user) {
    return (
      <SeekerLayout
        title={pageTitle}
        header={<ImpersonateHeaderBox />}
        right={<SeekerRightColumn variant="support" />}
        activeNav="support"
      >
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white rounded-lg shadow p-6 md:p-8">
            <p className="text-sm text-slate-700">You must be signed in.</p>
          </div>
        </div>
      </SeekerLayout>
    );
  }

  if (!isPlatformAdmin) {
    return (
      <SeekerLayout
        title={pageTitle}
        header={<ImpersonateHeaderBox />}
        right={<SeekerRightColumn variant="support" />}
        activeNav="support"
      >
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white rounded-lg shadow p-6 md:p-8">
            <p className="text-sm text-slate-700">Forbidden.</p>
          </div>
        </div>
      </SeekerLayout>
    );
  }

  return (
    <SeekerLayout
      title={pageTitle}
      header={<ImpersonateHeaderBox />}
      right={<SeekerRightColumn variant="support" />}
      activeNav="support"
    >
      <Head>
        <title>Impersonate – ForgeTomorrow</title>
      </Head>

      <div className="max-w-4xl mx-auto p-6 space-y-10">
        <section className="bg-white rounded-lg shadow p-6 md:p-8 space-y-6">
          {msg ? (
            <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-800">
              {msg}
            </div>
          ) : null}

          <div className="space-y-5">
            <div>
              <div className="text-xs font-semibold text-slate-700 mb-2">Customer email</div>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@email.com"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#FF7043] focus:ring-offset-2"
                disabled={busy || active}
              />
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-700 mb-2">
                Ticket number (required) or No-Ticket
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <input
                  value={ticketNumber}
                  onChange={(e) => setTicketNumber(e.target.value)}
                  placeholder="e.g. cmjyyujjl002mkz04gn9gvufq"
                  className={`flex-1 min-w-[280px] rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#FF7043] focus:ring-offset-2 ${
                    noTicket ? "border-slate-200 bg-slate-50 text-slate-400" : "border-slate-300 bg-white"
                  }`}
                  disabled={busy || active || noTicket}
                />

                <label className="flex items-center gap-2 text-xs text-slate-700 select-none">
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
                <div className="mt-2 text-xs text-red-600">
                  Ticket number format looks invalid. Paste the ticket ID exactly.
                </div>
              ) : null}

              {noTicket ? (
                <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900">
                  <div className="font-bold mb-2">No-Ticket procedure (do this immediately after the action)</div>
                  <ol className="list-decimal pl-5 space-y-1">
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

            <div className="flex flex-wrap items-center gap-4">
              {!active ? (
                <button
                  onClick={start}
                  disabled={busy || !email.trim() || !reasonOk}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${
                    busy || !email.trim() || !reasonOk
                      ? "bg-slate-400 cursor-not-allowed"
                      : "bg-slate-900 hover:bg-slate-800"
                  }`}
                >
                  {busy ? "Working…" : "Start"}
                </button>
              ) : (
                <button
                  onClick={stop}
                  disabled={busy}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${
                    busy ? "bg-red-300 cursor-not-allowed" : "bg-red-700 hover:bg-red-600"
                  }`}
                >
                  {busy ? "Working…" : "Stop"}
                </button>
              )}

              <div className="text-xs text-slate-500">
                Return target: <code className="text-slate-700">{returnTo}</code>
              </div>
            </div>

            <div className="text-xs text-slate-500">
              API required: <code className="text-slate-700">/api/admin/impersonation/start</code> and{" "}
              <code className="text-slate-700">/api/admin/impersonation/stop</code>
            </div>

            {/* chrome is inferred but not required by SeekerLayout; kept for continuity */}
            {chrome ? (
              <div className="text-[11px] text-slate-400">
                Chrome: <code>{chrome}</code>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </SeekerLayout>
  );
}
