// pages/action-center.js
import React, { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

import SeekerLayout from "@/components/layouts/SeekerLayout";
import CoachingLayout from "@/components/layouts/CoachingLayout";
import RecruiterLayout from "@/components/layouts/RecruiterLayout";

/* -----------------------------
   UI: Frosted glass helpers
------------------------------ */
function FrostPanel({ className = "", children }) {
  return (
    <div
      className={[
        "rounded-2xl border shadow-xl",
        "bg-white/70 backdrop-blur-[10px]",
        "border-white/30",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function Dot({ show }) {
  if (!show) return null;
  return (
    <span
      className="inline-block w-2 h-2 rounded-full bg-[#FF7043]"
      aria-label="Unread"
      title="Unread"
    />
  );
}

/* -----------------------------
   Scope + routing helpers
------------------------------ */
function resolveScope({ pathname, chrome }) {
  const c = String(chrome || "").toLowerCase();

  if (c === "coach") return "COACH";
  if (c.startsWith("recruiter")) return "RECRUITER";

  if (String(pathname || "").startsWith("/recruiter")) return "RECRUITER";
  if (
    String(pathname || "").startsWith("/coach") ||
    String(pathname || "").startsWith("/dashboard/coaching") ||
    String(pathname || "") === "/coaching-dashboard"
  )
    return "COACH";

  return "SEEKER";
}

function scopeLabel(scope) {
  if (scope === "RECRUITER") return "Recruiter Action Center";
  if (scope === "COACH") return "Coach Action Center";
  return "Your Action Center";
}

function withChrome(href, chrome) {
  const c = String(chrome || "").toLowerCase();
  if (!c) return href;
  return href.includes("?") ? `${href}&chrome=${c}` : `${href}?chrome=${c}`;
}

function actionHrefForNotification(n, scope, chrome) {
  // Messaging notifications -> open the correct messaging page and target the conversation
  if (
    n?.category === "MESSAGING" &&
    n?.entityType === "CONVERSATION" &&
    n?.entityId
  ) {
    const convoId = String(n.entityId);

    // ✅ Use the suite's messaging pages (consistent with your routing)
    if (scope === "RECRUITER") {
      return withChrome(
        `/recruiter/messaging?c=${encodeURIComponent(convoId)}`,
        chrome || "recruiter-smb"
      );
    }
    if (scope === "COACH") {
      return withChrome(
        `/coaching/messaging?c=${encodeURIComponent(convoId)}`,
        chrome || "coach"
      );
    }

    // SEEKER
    return withChrome(
      `/seeker/messages?c=${encodeURIComponent(convoId)}`,
      chrome
    );
  }

  // Fallback by scope
  if (scope === "RECRUITER") return withChrome("/recruiter/dashboard", chrome);
  if (scope === "COACH") return withChrome("/coaching-dashboard", chrome);
  return withChrome("/seeker-dashboard", chrome);
}

/* -----------------------------
   Page
------------------------------ */
export default function ActionCenterPage() {
  const router = useRouter();
  const chrome = String(router.query.chrome || "").toLowerCase();
  const scopeFromQuery = String(router.query.scope || "").toUpperCase();

  const scope = useMemo(() => {
    if (
      scopeFromQuery === "SEEKER" ||
      scopeFromQuery === "COACH" ||
      scopeFromQuery === "RECRUITER"
    ) {
      return scopeFromQuery;
    }
    return resolveScope({ pathname: router.pathname, chrome });
  }, [router.pathname, chrome, scopeFromQuery]);

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [includeRead, setIncludeRead] = useState(false);
  const [error, setError] = useState("");

  const load = async (opts = {}) => {
    const nextIncludeRead =
      typeof opts.includeRead === "boolean" ? opts.includeRead : includeRead;

    setError("");
    setLoading(true);

    try {
      const url = `/api/notifications/list?scope=${encodeURIComponent(
        scope
      )}&limit=50&includeRead=${nextIncludeRead ? "1" : "0"}`;

      const res = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (res.status === 401) {
        router.push("/auth/signin");
        return;
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `Failed: ${res.status}`);

      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (e) {
      console.error("action-center load error:", e);
      setItems([]);
      setError("Unable to load Action Center right now.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Viewing the Action Center clears the unread dot (mark all as seen/read)
  useEffect(() => {
    const markAllReadOnOpen = async () => {
      try {
        const res = await fetch("/api/notifications/mark-all-read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ scope }),
        });

        if (!res.ok) return;

        if (typeof window !== "undefined") {
  // fire now
  window.dispatchEvent(new Event("ft-notifications-updated"));

  // fire again next tick to beat listener-attach races on fresh mounts
  setTimeout(() => {
    window.dispatchEvent(new Event("ft-notifications-updated"));
  }, 50);
}
      } catch {
        // swallow
      }
    };

    if (scope) markAllReadOnOpen();
  }, [scope]);

  useEffect(() => {
    load({ includeRead });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, includeRead]);

  const markRead = async (id) => {
    if (!id) return;

    try {
      const res = await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id }),
      });

      if (!res.ok) return;

      // Optimistic update
      const nowIso = new Date().toISOString();
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: nowIso } : n))
      );

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("ft-notifications-updated"));
      }
    } catch {
      // no-op
    }
  };

  const Header = (
    <FrostPanel className="p-6 text-center">
      <h1 className="text-2xl md:text-3xl font-bold text-orange-600">
        {scopeLabel(scope)}
      </h1>
      <p className="text-sm md:text-base text-slate-700 mt-2 max-w-3xl mx-auto">
        Updates that need your attention. Click an item to go straight to where
        you take action.
      </p>

      <div className="mt-4 flex flex-wrap gap-2 justify-center">
        <button
          type="button"
          onClick={() => setIncludeRead(false)}
          className={[
            "px-3 py-1.5 rounded-full text-xs font-semibold border transition",
            !includeRead
              ? "bg-orange-50 text-orange-700 border-orange-200"
              : "bg-white/60 hover:bg-white/80 text-slate-700 border-white/40",
          ].join(" ")}
        >
          Unread only
        </button>

        <button
          type="button"
          onClick={() => setIncludeRead(true)}
          className={[
            "px-3 py-1.5 rounded-full text-xs font-semibold border transition",
            includeRead
              ? "bg-orange-50 text-orange-700 border-orange-200"
              : "bg-white/60 hover:bg-white/80 text-slate-700 border-white/40",
          ].join(" ")}
        >
          Include read
        </button>

        <button
          type="button"
          onClick={() => load({ includeRead })}
          className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/60 hover:bg-white/80 text-slate-800 border border-white/40 transition"
        >
          Refresh
        </button>
      </div>
    </FrostPanel>
  );

  const Content = (
    <div className="grid gap-4">
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <FrostPanel className="p-4">
        {loading ? (
          <div className="text-slate-600">Loading Action Center…</div>
        ) : items.length === 0 ? (
          <div className="text-slate-600">No items right now.</div>
        ) : (
          <div className="grid gap-2">
            {items.map((n) => {
              const isUnread = !n.readAt;
              const href = actionHrefForNotification(n, scope, chrome);

              return (
                <div
                  key={n.id}
                  className="border border-white/30 bg-white/60 hover:bg-white/75 transition rounded-2xl p-3 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-slate-900 truncate">
                        {n.title || "Notification"}
                      </div>
                      <Dot show={isUnread} />
                    </div>

                    {n.body ? (
                      <div className="text-sm text-slate-700 mt-1 break-words">
                        {n.body}
                      </div>
                    ) : null}

                    <div className="text-[11px] text-slate-500 mt-1">
                      {n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 items-end shrink-0">
                    <Link
                      href={href}
                      onClick={() => {
                        // mark read when you click through
                        markRead(n.id);
                      }}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-100"
                    >
                      Open
                    </Link>

                    {isUnread ? (
                      <button
                        type="button"
                        onClick={() => markRead(n.id)}
                        className="text-[11px] text-slate-700 hover:underline"
                      >
                        Mark read
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </FrostPanel>
    </div>
  );

  // Wrap in the correct suite chrome/layout
  if (scope === "RECRUITER") {
    return (
      <>
        <Head>
          <title>Action Center | ForgeTomorrow</title>
        </Head>
        <RecruiterLayout title="Action Center | ForgeTomorrow" header={Header}>
          {Content}
        </RecruiterLayout>
      </>
    );
  }

  if (scope === "COACH") {
    return (
      <>
        <Head>
          <title>Action Center | ForgeTomorrow</title>
        </Head>
        <CoachingLayout
          title="Action Center | ForgeTomorrow"
          activeNav="overview"
          headerDescription="Updates that need your attention."
          headerExtra={Header}
        >
          {Content}
        </CoachingLayout>
      </>
    );
  }

  // Default: seeker
  return (
    <>
      <Head>
        <title>Action Center | ForgeTomorrow</title>
      </Head>
      <SeekerLayout
        title="Action Center | ForgeTomorrow"
        header={Header}
        activeNav="dashboard"
      >
        {Content}
      </SeekerLayout>
    </>
  );
}