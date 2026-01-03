// pages/admin/impersonate.js
import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";

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

export default function AdminImpersonatePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [active, setActive] = useState(false);

  const isPlatformAdmin = !!session?.user?.isPlatformAdmin;

  useEffect(() => {
    // UI flag cookie
    setActive(readCookie("ft_imp_active") === "1");
  }, []);

  const returnTo = useMemo(() => {
    const r = String(router.query.returnTo || "");
    return r || "/recruiter/dashboard";
  }, [router.query.returnTo]);

  if (status === "loading") {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui" }}>
        Loading…
      </main>
    );
  }

  if (!session?.user) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui" }}>
        You must be signed in.
      </main>
    );
  }

  if (!isPlatformAdmin) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui" }}>
        Forbidden.
      </main>
    );
  }

  async function start() {
    setMsg("");
    setBusy(true);
    try {
      const res = await fetch("/api/admin/impersonation/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");

      setActive(true);
      setMsg(`Impersonation started for ${data?.target?.email || email}`);
      // go back to where support came from
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
      const res = await fetch("/api/admin/impersonation/stop", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");

      setActive(false);
      setMsg("Impersonation stopped.");
      setTimeout(() => router.push(returnTo), 400);
    } catch (e) {
      setMsg(e?.message || "Failed to stop impersonation");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Head>
        <title>Impersonate – ForgeTomorrow</title>
      </Head>

      <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 720, margin: "0 auto" }}>
        <h1 style={{ marginTop: 0 }}>Impersonation</h1>

        <p style={{ color: "#555", lineHeight: 1.5 }}>
          Platform Admin only. Use this to support a customer account after a formal request exists.
          Actions are written to AuditLog.
        </p>

        {msg ? (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: "#f3f4f6" }}>
            {msg}
          </div>
        ) : null}

        <div style={{ marginTop: 16, padding: 16, borderRadius: 12, border: "1px solid #e5e7eb" }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@email.com"
              style={{
                flex: "1 1 320px",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #d1d5db",
              }}
              disabled={busy || active}
            />
            {!active ? (
              <button
                onClick={start}
                disabled={busy || !email.trim()}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid #111827",
                  background: "#111827",
                  color: "white",
                  cursor: "pointer",
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
                  borderRadius: 10,
                  border: "1px solid #b91c1c",
                  background: "#b91c1c",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                {busy ? "Working…" : "Stop"}
              </button>
            )}
          </div>

          <div style={{ marginTop: 10, color: "#6b7280", fontSize: 13 }}>
            Return target: <code>{returnTo}</code>
          </div>
        </div>
      </main>
    </>
  );
}
