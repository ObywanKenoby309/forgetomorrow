// components/recruiter/RecruiterActionCenterPreview.js
import React from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

function safeText(v) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function pickRecruiterBucket(n) {
  const title = safeText(n?.title).toLowerCase();
  const body = safeText(n?.body).toLowerCase();
  const meta = n?.metadata || {};
  const metaStr = safeText(meta?.bucket || meta?.tab || meta?.queue || meta?.type || meta?.event || meta?.kind || "").toLowerCase();
  const catStr = safeText(n?.category || "").toLowerCase();
  const haystack = `${title} ${body} ${metaStr} ${catStr}`;
  if (haystack.includes("stalled") || haystack.includes("stale") || haystack.includes("no movement") || haystack.includes("stuck") || haystack.includes("aging")) return "stalled";
  if (haystack.includes("awaiting") || haystack.includes("feedback") || haystack.includes("hiring mgr") || haystack.includes("hiring manager")) return "awaiting_feedback";
  if (haystack.includes("unread") || haystack.includes("reply") || haystack.includes("replies") || haystack.includes("message") || haystack.includes("inbox") || haystack.includes("dm") || haystack.includes("chat")) return "unread_replies";
  if (haystack.includes("upcoming") || haystack.includes("interview") || haystack.includes("conflict") || haystack.includes("schedule") || haystack.includes("invite") || haystack.includes("resched")) return "upcoming";
  return "unread_replies";
}

// ─── Shared styles ────────────────────────────────────────────────────────────
const GLASS = {
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.22)",
  background: "rgba(255,255,255,0.68)",
  boxShadow: "0 10px 28px rgba(15,23,42,0.12)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
};

// NEW: Targeted overlay for better glass readability (very light dark tint)
const GLASS_OVERLAY = {
  position: "relative",
  overflow: "hidden",
};

// NEW: Inner tint layer (placed behind content, inside blur)
const GLASS_TINT = {
  position: "absolute",
  inset: 0,
  borderRadius: 18,
  background: "rgba(15, 23, 42, 0.28)", // subtle dark stabilizer — keeps glass look
  pointerEvents: "none",
  zIndex: 0,
};

// NEW: Orange text lift — only for the specific headings you want improved
const ORANGE_HEADING_LIFT = {
  textShadow: "0 2px 4px rgba(15,23,42,0.65), 0 1px 2px rgba(0,0,0,0.4)",
  fontWeight: 900, // already 900 in most places, but forces it
  position: "relative",
  zIndex: 1,
};

const WHITE_CARD = {
  background: "rgba(255,255,255,0.97)",
  border: "1px solid rgba(255,255,255,0.60)",
  borderRadius: 14,
  boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
  boxSizing: "border-box",
  position: "relative",
  zIndex: 1,
};

const GAP = 16;

// ─── Action tile — desktop ────────────────────────────────────────────────────
function ActionTile({ title, emptyText, items, href, chromeQuery }) {
  const list = Array.isArray(items) ? items : [];
  const link = `${href}${chromeQuery ? `&chrome=${chromeQuery}` : ""}`;
  return (
    <div
      style={{
        ...WHITE_CARD,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        minHeight: 176,
      }}
    >
      <div
        style={{
          fontSize: 15,
          fontWeight: 900,
          lineHeight: 1.35,
          letterSpacing: "-0.01em",
          color: "#0F172A",
        }}
      >
        {title}
      </div>
      <div style={{ marginTop: 18, flex: 1 }}>
        {list.length === 0 ? (
          <div style={{ fontSize: 13, color: "#64748B", lineHeight: 1.55 }}>{emptyText}</div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {list.slice(0, 1).map((n) => (
              <div key={n.id} style={{ fontSize: 13, color: "#334155", lineHeight: 1.55 }}>
                {n.title || "Update"}
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ marginTop: "auto", paddingTop: 14, display: "flex", justifyContent: "flex-end" }}>
        <a
          href={link}
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "#334155",
            lineHeight: 1.2,
            textDecoration: "none",
            border: "1px solid rgba(0,0,0,0.10)",
            borderRadius: 10,
            padding: "10px 14px",
            background: "rgba(255,255,255,0.86)",
          }}
        >
          View More
        </a>
      </div>
    </div>
  );
}

export default function RecruiterQuickActions({ chromeQuery, isMobile }) {
  const [items, setItems] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  useEffect(() => {
    let alive = true;
    const load = async (isInitial = false) => {
      if (isInitial) setInitialLoading(true);
      else setRefreshing(true);
      try {
        const res = await fetch("/api/notifications/list?scope=RECRUITER&limit=25&includeRead=0", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!alive) return;
        setItems(Array.isArray(data?.items) ? data.items : []);
      } catch {}
      finally {
        if (!alive) return;
        if (isInitial) setInitialLoading(false);
        setRefreshing(false);
      }
    };
    load(true);
    const t = setInterval(() => load(false), 25000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);
  const buckets = useMemo(() => {
    const b = { stalled: [], awaiting_feedback: [], unread_replies: [], upcoming: [] };
    for (const n of Array.isArray(items) ? items : []) {
      const k = pickRecruiterBucket(n);
      if (!b[k]) continue;
      b[k].push(n);
    }
    return {
      stalled: b.stalled.slice(0, 3),
      awaiting_feedback: b.awaiting_feedback.slice(0, 3),
      unread_replies: b.unread_replies.slice(0, 3),
      upcoming: b.upcoming.slice(0, 3),
    };
  }, [items]);
  const tiles = [
    { key: "unread_replies", title: "Unread Replies", emptyText: "No unread candidate replies.", href: "/action-center?scope=RECRUITER&tab=UNREAD_REPLIES", items: buckets.unread_replies, icon: "💬" },
    { key: "upcoming", title: "Upcoming Interviews", emptyText: "No upcoming interviews or conflicts.", href: "/action-center?scope=RECRUITER&tab=UPCOMING", items: buckets.upcoming, icon: "📅" },
    { key: "stalled", title: "Stalled Candidates", emptyText: "No stalled candidates right now.", href: "/action-center?scope=RECRUITER&tab=STALLED", items: buckets.stalled, icon: "⚠️" },
    { key: "awaiting_feedback", title: "Awaiting Feedback", emptyText: "No hiring manager feedback pending.", href: "/action-center?scope=RECRUITER&tab=AWAITING_FEEDBACK", items: buckets.awaiting_feedback, icon: "🔄" },
  ];
  const sortedTiles = [...tiles].sort((a, b) => {
    const aHas = a.items.length > 0 ? 1 : 0;
    const bHas = b.items.length > 0 ? 1 : 0;
    return bHas - aHas;
  });
  if (isMobile) {
    if (initialLoading) {
      return (
        <div style={{ display: "grid", gap: 8 }}>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                height: 64,
                borderRadius: 12,
                background: "rgba(255,255,255,0.70)",
                border: "1px solid rgba(0,0,0,0.06)",
              }}
            />
          ))}
        </div>
      );
    }
    const totalActions = tiles.reduce((sum, t) => sum + t.items.length, 0);
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#FF7043", lineHeight: 1.2, letterSpacing: "-0.01em" }}>
              Action Center
            </div>
            <div
              style={{
                fontSize: 12,
                color: totalActions > 0 ? "#FF7043" : "#243B63",
                fontWeight: totalActions > 0 ? 700 : 600,
                marginTop: 3,
                lineHeight: 1.45,
              }}
            >
              {totalActions > 0
                ? `${totalActions} item${totalActions !== 1 ? "s" : ""} need your attention`
                : "You're all caught up"}
            </div>
          </div>
          <Link
            href={`/action-center?scope=RECRUITER${chromeQuery ? `&chrome=${chromeQuery}` : ""}`}
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: "#FF7043",
              textDecoration: "none",
              padding: "6px 12px",
              borderRadius: 999,
              border: "1px solid rgba(255,112,67,0.30)",
              background: "rgba(255,112,67,0.08)",
              lineHeight: 1.2,
            }}
          >
            View all
          </Link>
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          {sortedTiles.map((tile) => {
            const hasItems = tile.items.length > 0;
            const link = `${tile.href}${chromeQuery ? `&chrome=${chromeQuery}` : ""}`;
            return (
              <Link
                key={tile.key}
                href={link}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  borderRadius: 12,
                  textDecoration: "none",
                  background: hasItems ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.55)",
                  border: hasItems ? "1px solid rgba(255,112,67,0.22)" : "1px solid rgba(0,0,0,0.06)",
                  boxShadow: hasItems ? "0 4px 12px rgba(0,0,0,0.08)" : "none",
                  transition: "all 150ms ease",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    flexShrink: 0,
                    background: hasItems ? "rgba(255,112,67,0.10)" : "rgba(0,0,0,0.04)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                  }}
                >
                  {tile.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 900,
                      color: hasItems ? "#112033" : "#90A4AE",
                      lineHeight: 1.3,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {tile.title}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      marginTop: 3,
                      color: hasItems ? "#546E7A" : "#B0BEC5",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      lineHeight: 1.4,
                    }}
                  >
                    {hasItems ? (tile.items[0].title || "View item") : tile.emptyText}
                  </div>
                </div>
                {hasItems ? (
                  <div
                    style={{
                      minWidth: 28,
                      height: 28,
                      borderRadius: 999,
                      flexShrink: 0,
                      background: "#FF7043",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 900,
                      boxShadow: "0 4px 10px rgba(255,112,67,0.40)",
                      lineHeight: 1,
                    }}
                  >
                    {tile.items.length}
                  </div>
                ) : (
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 999,
                      flexShrink: 0,
                      background: "rgba(0,0,0,0.04)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      color: "#B0BEC5",
                    }}
                  >
                    ✓
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    );
  }
  return (
    <section style={{ ...GLASS, ...GLASS_OVERLAY, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 900,
            color: "#FF7043",
            lineHeight: 1.25,
            letterSpacing: "-0.01em",
            margin: 0,
            ...ORANGE_HEADING_LIFT,
          }}
        >
          Action Center
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {refreshing ? <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.4 }}>Updating…</div> : null}
          <a
            href={`/action-center?scope=RECRUITER${chromeQuery ? `&chrome=${chromeQuery}` : ""}`}
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: "#FF7043",
              lineHeight: 1.2,
              textDecoration: "none",
              ...ORANGE_HEADING_LIFT,
            }}
          >
            View all
          </a>
        </div>
      </div>
      {initialLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              style={{
                ...WHITE_CARD,
                padding: 16,
                minHeight: 176,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div className="h-5 w-40 bg-slate-200 rounded" />
              <div className="h-3 w-56 bg-slate-200 rounded mt-8" />
              <div className="mt-auto pt-4 flex justify-end">
                <div className="h-9 w-24 bg-slate-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {tiles.map((t) => <ActionTile key={t.key} {...t} chromeQuery={chromeQuery} />)}
        </div>
      )}
    </section>
  );
}