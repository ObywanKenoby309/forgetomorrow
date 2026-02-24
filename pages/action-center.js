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
    return withChrome(`/seeker/messages?c=${encodeURIComponent(convoId)}`, chrome);
  }

  // Fallback by scope
  if (scope === "RECRUITER") return withChrome("/recruiter/dashboard", chrome);
  if (scope === "COACH") return withChrome("/coaching-dashboard", chrome);
  return withChrome("/seeker-dashboard", chrome);
}

/* -----------------------------
   Recruiter Tabs (below header)
------------------------------ */
const RECRUITER_TABS = [
  { key: "ALL", label: "All" },
  { key: "STALLED", label: "Stalled" },
  { key: "AWAITING_FEEDBACK", label: "Awaiting Feedback" },
  { key: "UNREAD_REPLIES", label: "Unread Replies" },
  { key: "UPCOMING", label: "Upcoming" },
];

function safeText(v) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function norm(s) {
  return safeText(s).toLowerCase();
}

function recruiterTabMatches(n, tabKey) {
  if (!n) return false;
  if (tabKey === "ALL") return true;

  const category = safeText(n.category).toUpperCase();
  const entityType = safeText(n.entityType).toUpperCase();

  const meta = n?.metadata || {};
  const metaBucket = safeText(
    meta.bucket || meta.tab || meta.queue || meta.type || meta.kind || meta.event
  ).toUpperCase();

  // ✅ DB-first matching (preferred)
  if (tabKey === "STALLED") {
    if (metaBucket.includes("STALLED")) return true;
    if (category.includes("STALLED")) return true;
    if (category.includes("PIPELINE") && metaBucket.includes("STALE")) return true;
  }

  if (tabKey === "AWAITING_FEEDBACK") {
    if (metaBucket.includes("AWAITING_FEEDBACK")) return true;
    if (metaBucket.includes("HIRING_MANAGER") && metaBucket.includes("FEEDBACK"))
      return true;
    if (category.includes("FEEDBACK")) return true;
    if (category.includes("HIRING") && metaBucket.includes("FEEDBACK")) return true;
  }

  if (tabKey === "UNREAD_REPLIES") {
    if (metaBucket.includes("UNREAD_REPLIES") || metaBucket.includes("UNREAD_REPLY"))
      return true;
    if (category === "MESSAGING") return true;
    if (entityType === "MESSAGE" || entityType === "CONVERSATION") return true;
  }

  if (tabKey === "UPCOMING") {
    if (metaBucket.includes("UPCOMING")) return true;
    if (metaBucket.includes("INTERVIEW")) return true;
    if (metaBucket.includes("CONFLICT")) return true;
    if (category.includes("INTERVIEW")) return true;
    if (category.includes("CALENDAR")) return true;
  }

  // ✅ Fallback keyword matching
  const text = `${norm(n.title)} ${norm(n.body)} ${norm(metaBucket)}`;

  if (tabKey === "STALLED") {
    return (
      text.includes("stalled") ||
      text.includes("stale") ||
      text.includes("no movement") ||
      text.includes("stuck") ||
      text.includes("aging")
    );
  }

  if (tabKey === "AWAITING_FEEDBACK") {
    return (
      text.includes("awaiting") ||
      text.includes("feedback") ||
      text.includes("hiring mgr") ||
      text.includes("hiring manager")
    );
  }

  if (tabKey === "UNREAD_REPLIES") {
    return (
      text.includes("unread") ||
      text.includes("reply") ||
      text.includes("replies") ||
      text.includes("message") ||
      text.includes("inbox")
    );
  }

  if (tabKey === "UPCOMING") {
    return (
      text.includes("upcoming") ||
      text.includes("interview") ||
      text.includes("conflict") ||
      text.includes("schedule") ||
      text.includes("invite")
    );
  }

  return false;
}

function byCreatedDesc(a, b) {
  const ta = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
  const tb = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
  return tb - ta;
}

/* -----------------------------
   Recruiter Right Rail (Ad + helper)
------------------------------ */
function RecruiterRightRail() {
  return (
    <div className="grid gap-3">
      <div
        style={{
          background: "white",
          borderRadius: 12,
          padding: 14,
          boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
          border: "1px solid #eee",
          minHeight: 110,
          display: "grid",
          placeItems: "center",
          textAlign: "center",
        }}
      >
        <div style={{ fontWeight: 900, color: "#37474F" }}>AD SLOT</div>
        <div style={{ marginTop: 6, fontSize: 12, color: "#607D8B" }}>
          Top-right placement
        </div>
      </div>

      <div
        style={{
          background: "white",
          borderRadius: 12,
          padding: 14,
          boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
          border: "1px solid #eee",
        }}
      >
        <div style={{ fontWeight: 900, color: "#37474F", marginBottom: 6 }}>
          Need help?
        </div>
        <p style={{ margin: 0, color: "#607D8B", fontSize: 13, lineHeight: 1.45 }}>
          Use the orange “Need help? Chat with Support” button at the bottom-right of
          the screen.
        </p>
      </div>
    </div>
  );
}

/* -----------------------------
   Page
------------------------------ */
export default function ActionCenterPage() {
  const router = useRouter();
  const chrome = String(router.query.chrome || "").toLowerCase();
  const scopeFromQuery = String(router.query.scope || "").toUpperCase();
  const tabFromQueryRaw = String(router.query.tab || "").toUpperCase();

  const scope = useMemo(() => {
    if (scopeFromQuery === "SEEKER" || scopeFromQuery === "COACH" || scopeFromQuery === "RECRUITER") {
      return scopeFromQuery;
    }
    return resolveScope({ pathname: router.pathname, chrome });
  }, [router.pathname, chrome, scopeFromQuery]);

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [includeRead, setIncludeRead] = useState(true); // ✅ history default
  const [error, setError] = useState("");

  // ✅ recruiter active tab (supports deep linking)
  const [activeRecruiterTab, setActiveRecruiterTab] = useState("ALL");

  // ✅ Sync tab from URL when recruiter scope
  useEffect(() => {
    if (scope !== "RECRUITER") return;
    const valid = new Set(RECRUITER_TABS.map((t) => t.key));
    const next = valid.has(tabFromQueryRaw) ? tabFromQueryRaw : "ALL";
    if (next !== activeRecruiterTab) setActiveRecruiterTab(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, tabFromQueryRaw]);

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

  // ✅ Viewing the Action Center clears the unread dot (mark all as seen/read)
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
          window.dispatchEvent(new Event("ft-notifications-updated"));
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
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: nowIso } : n)));

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("ft-notifications-updated"));
      }
    } catch {
      // no-op
    }
  };

  const recruiterTabCounts = useMemo(() => {
    if (scope !== "RECRUITER") return {};
    const counts = {};
    for (const t of RECRUITER_TABS) counts[t.key] = 0;

    for (const n of Array.isArray(items) ? items : []) {
      for (const t of RECRUITER_TABS) {
        if (recruiterTabMatches(n, t.key)) counts[t.key] = (counts[t.key] || 0) + 1;
      }
    }
    return counts;
  }, [scope, items]);

  const filteredByTab = useMemo(() => {
    if (scope !== "RECRUITER") return items;
    const tab = String(activeRecruiterTab || "ALL").toUpperCase();
    return (Array.isArray(items) ? items : []).filter((n) => recruiterTabMatches(n, tab));
  }, [scope, items, activeRecruiterTab]);

  // ✅ Needs Attention = unread only + chronological
  const needsAttention = useMemo(() => {
    const base = Array.isArray(filteredByTab) ? filteredByTab : [];
    return base.filter((n) => !n.readAt).sort(byCreatedDesc);
  }, [filteredByTab]);

  // ✅ History = whatever we loaded (usually includeRead true) + chronological
  const historyItems = useMemo(() => {
    const base = Array.isArray(filteredByTab) ? filteredByTab : [];
    return base.slice().sort(byCreatedDesc);
  }, [filteredByTab]);

  /* -----------------------------
     Header: clean, no tabs
  ------------------------------ */
  const Header = (
    <FrostPanel className="p-6 text-left">
      <h1 className="text-2xl md:text-3xl font-bold text-orange-600">
        {scopeLabel(scope)}
      </h1>
      <p className="text-sm md:text-base text-slate-700 mt-2 max-w-3xl">
        This is your review surface. Items that need attention are on the left. History for
        this category is on the right.
      </p>
    </FrostPanel>
  );

  /* -----------------------------
     Reusable list row
  ------------------------------ */
  function NotificationRow({ n }) {
    const isUnread = !n.readAt;
    const href = actionHrefForNotification(n, scope, chrome);

    return (
      <div className="border border-white/30 bg-white/60 hover:bg-white/75 transition rounded-2xl p-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="font-semibold text-slate-900 truncate">
              {n.title || "Notification"}
            </div>
            <Dot show={isUnread} />
          </div>

          {n.body ? (
            <div className="text-sm text-slate-700 mt-1 break-words">{n.body}</div>
          ) : null}

          <div className="text-[11px] text-slate-500 mt-1">
            {n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
          </div>
        </div>

        <div className="flex flex-col gap-2 items-end shrink-0">
          <Link
            href={href}
            onClick={() => {
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
  }

  /* -----------------------------
     Content
     - Recruiter: 2-column needs vs history (respects right rail)
     - Others: keep stacked
  ------------------------------ */
  const Content = (
    <div className="grid gap-4">
      {/* Recruiter Tabs (below header) */}
      {scope === "RECRUITER" ? (
        <FrostPanel className="p-3">
          <div className="flex flex-wrap gap-2 justify-start">
            {RECRUITER_TABS.map((t) => {
              const isActive = activeRecruiterTab === t.key;
              const count = Number(recruiterTabCounts?.[t.key] || 0);

              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => {
                    setActiveRecruiterTab(t.key);
                    const nextHref = `/action-center?scope=RECRUITER&tab=${encodeURIComponent(
                      t.key
                    )}${chrome ? `&chrome=${encodeURIComponent(chrome)}` : ""}`;
                    router.replace(nextHref, undefined, { shallow: true });
                  }}
                  className={[
                    "px-3 py-1.5 rounded-full text-xs font-semibold border transition flex items-center gap-2",
                    isActive
                      ? "bg-orange-50 text-orange-700 border-orange-200"
                      : "bg-white/60 hover:bg-white/80 text-slate-700 border-white/40",
                  ].join(" ")}
                  aria-pressed={isActive}
                >
                  <span>{t.label}</span>
                  <span
                    className={[
                      "min-w-[22px] px-2 py-0.5 rounded-full text-[11px] border",
                      isActive
                        ? "bg-white/70 border-orange-200 text-orange-700"
                        : "bg-white/70 border-white/40 text-slate-700",
                    ].join(" ")}
                    title={`${count} item(s)`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </FrostPanel>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {/* Recruiter: true two-column */}
      {scope === "RECRUITER" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Needs Attention */}
          <FrostPanel className="p-4 bg-white/80">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">Needs Attention</div>
                <div className="text-[12px] text-slate-600 mt-0.5">
                  Unread items, newest first. Click to go take action.
                </div>
              </div>

              <button
                type="button"
                onClick={() => load({ includeRead })}
                className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/60 hover:bg-white/80 text-slate-800 border border-white/40 transition"
              >
                Refresh
              </button>
            </div>

            <div className="mt-3">
              {loading ? (
                <div className="text-slate-600">Loading…</div>
              ) : needsAttention.length === 0 ? (
                <div className="text-slate-600">No items needing action right now.</div>
              ) : (
                <div className="grid gap-2 max-h-[520px] overflow-auto pr-1">
                  {needsAttention.map((n) => (
                    <NotificationRow key={n.id} n={n} />
                  ))}
                </div>
              )}
            </div>
          </FrostPanel>

          {/* History */}
          <FrostPanel className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">History</div>
                <div className="text-[12px] text-slate-600 mt-0.5">
                  A chronological log for this category. Take action from the linked destination.
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
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
                  onClick={() => load({ includeRead })}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/60 hover:bg-white/80 text-slate-800 border border-white/40 transition"
                >
                  Refresh
                </button>
              </div>
            </div>

            <div className="mt-3">
              {loading ? (
                <div className="text-slate-600">Loading…</div>
              ) : historyItems.length === 0 ? (
                <div className="text-slate-600">No history items right now.</div>
              ) : (
                <div className="grid gap-2 max-h-[520px] overflow-auto pr-1">
                  {historyItems.map((n) => (
                    <NotificationRow key={n.id} n={n} />
                  ))}
                </div>
              )}
            </div>
          </FrostPanel>
        </div>
      ) : (
        /* Seeker/Coach: keep stacked (unchanged behavior) */
        <div className="grid gap-4">
          <FrostPanel className="p-4 bg-white/80">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">Needs Attention</div>
                <div className="text-[12px] text-slate-600 mt-0.5">
                  Unread items, newest first. Click to go take action.
                </div>
              </div>

              <button
                type="button"
                onClick={() => load({ includeRead })}
                className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/60 hover:bg-white/80 text-slate-800 border border-white/40 transition"
              >
                Refresh
              </button>
            </div>

            <div className="mt-3">
              {loading ? (
                <div className="text-slate-600">Loading…</div>
              ) : needsAttention.length === 0 ? (
                <div className="text-slate-600">No items needing action right now.</div>
              ) : (
                <div className="grid gap-2">
                  {needsAttention.map((n) => (
                    <NotificationRow key={n.id} n={n} />
                  ))}
                </div>
              )}
            </div>
          </FrostPanel>

          <FrostPanel className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">History</div>
                <div className="text-[12px] text-slate-600 mt-0.5">
                  A chronological log of what changed. You take action from the linked destination.
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
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
                  onClick={() => load({ includeRead })}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/60 hover:bg-white/80 text-slate-800 border border-white/40 transition"
                >
                  Refresh
                </button>
              </div>
            </div>

            <div className="mt-3">
              {loading ? (
                <div className="text-slate-600">Loading…</div>
              ) : historyItems.length === 0 ? (
                <div className="text-slate-600">No history items right now.</div>
              ) : (
                <div className="grid gap-2">
                  {historyItems.map((n) => (
                    <NotificationRow key={n.id} n={n} />
                  ))}
                </div>
              )}
            </div>
          </FrostPanel>
        </div>
      )}
    </div>
  );

  if (scope === "RECRUITER") {
    return (
      <>
        <Head>
          <title>Action Center | ForgeTomorrow</title>
        </Head>
        <RecruiterLayout
          title="Action Center | ForgeTomorrow"
          header={Header}
          right={<RecruiterRightRail />}
          activeNav="dashboard"
        >
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

  return (
    <>
      <Head>
        <title>Action Center | ForgeTomorrow</title>
      </Head>
      <SeekerLayout title="Action Center | ForgeTomorrow" header={Header} activeNav="dashboard">
        {Content}
      </SeekerLayout>
    </>
  );
}