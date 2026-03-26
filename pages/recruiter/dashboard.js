// pages/recruiter/dashboard.js
// Layout strategy — mirrors Seeker dashboard blueprint exactly:
//   - RecruiterLayout receives NO header prop, NO right prop
//   - contentFullBleed passed to RecruiterLayout so main content overflowX clipping
//     is removed for this page only (other recruiter pages unaffected)
//   - DashboardBody owns the full internal grid
//   - Right rail (Sponsored + Health Snapshot) lives INSIDE the internal grid
//   - Bottom 3 cards use marginLeft: -252 to extend under sidebar
//
// Visual structure:
// ┌─────────────────────────────┬──────────────┐
// │ Title Card       (row 1)    │  Sponsored   │
// ├─────────────────────────────│  (rows 1-3)  │
// │ KPI Row          (row 2)    │              │
// ├─────────────────────────────│  Health      │
// │ Action Center    (row 3)    │  Snapshot    │
// ├─────────────────────────────┴──────────────┤
// │ Top Candidates │ Pipeline Health │ Trends  │  ← full width incl. under sidebar
// └────────────────────────────────────────────┘

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { getTimeGreeting } from "@/lib/dashboardGreeting";
import { PlanProvider, usePlan } from "@/context/PlanContext";
import FeatureLock from "@/components/recruiter/FeatureLock";
import RecruiterLayout from "@/components/layouts/RecruiterLayout";
import RecruiterTitleCard from "@/components/recruiter/RecruiterTitleCard";

function safeText(v) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function normalizeRecruiterChrome(input) {
  const raw = String(input || "").toLowerCase().trim();
  if (!raw) return "";
  if (raw === "recruiter-ent" || raw === "ent" || raw === "enterprise") return "recruiter-ent";
  if (raw === "recruiter-smb" || raw === "smb" || raw === "recruiter") return "recruiter-smb";
  if (raw.startsWith("recruiter")) {
    if (raw.includes("ent") || raw.includes("enterprise")) return "recruiter-ent";
    return "recruiter-smb";
  }
  return "";
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
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.22)",
  background: "rgba(255,255,255,0.58)",
  boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
};

const WHITE_CARD = {
  background: "rgba(255,255,255,0.92)",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: 12,
  boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
  boxSizing: "border-box",
};

const DARK_RAIL = {
  background: "#2a2a2a",
  border: "1px solid #3a3a3a",
  borderRadius: 12,
  padding: 16,
  boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
  boxSizing: "border-box",
};

const GAP = 16;
const RIGHT_COL_WIDTH = 280;

// ─── Action tile — desktop ────────────────────────────────────────────────────
function ActionTile({ title, emptyText, items, href, chromeQuery }) {
  const list = Array.isArray(items) ? items : [];
  const link = `${href}${chromeQuery ? `&chrome=${chromeQuery}` : ""}`;
  return (
    <div className="rounded-lg border bg-white p-4 flex flex-col min-h-[170px]">
      <div
        className="text-slate-900 whitespace-normal break-words"
        style={{ fontSize: 15, fontWeight: 900, lineHeight: 1.35, letterSpacing: "-0.01em" }}
      >
        {title}
      </div>
      <div className="mt-5 flex-1">
        {list.length === 0 ? (
          <div style={{ fontSize: 13, color: "#64748B", lineHeight: 1.55 }}>{emptyText}</div>
        ) : (
          <div className="space-y-2">
            {list.slice(0, 1).map((n) => (
              <div key={n.id} style={{ fontSize: 13, color: "#334155", lineHeight: 1.55 }}>
                {n.title || "Update"}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="mt-auto pt-4 flex justify-end">
        <a
          href={link}
          className="shrink-0 rounded-md border px-4 py-2 hover:bg-slate-50"
          style={{ fontSize: 13, fontWeight: 700, color: "#334155", lineHeight: 1.2 }}
        >
          View More
        </a>
      </div>
    </div>
  );
}

// ─── Action Center ────────────────────────────────────────────────────────────
function RecruiterActionCenterSection({ chromeQuery, isMobile }) {
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
          method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include",
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
    return () => { alive = false; clearInterval(t); };
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
    { key: "unread_replies",    title: "Unread Replies",       emptyText: "No unread candidate replies.",          href: "/action-center?scope=RECRUITER&tab=UNREAD_REPLIES",    items: buckets.unread_replies,    icon: "💬" },
    { key: "upcoming",          title: "Upcoming Interviews",  emptyText: "No upcoming interviews or conflicts.",  href: "/action-center?scope=RECRUITER&tab=UPCOMING",          items: buckets.upcoming,          icon: "📅" },
    { key: "stalled",           title: "Stalled Candidates",   emptyText: "No stalled candidates right now.",      href: "/action-center?scope=RECRUITER&tab=STALLED",           items: buckets.stalled,           icon: "⚠️" },
    { key: "awaiting_feedback", title: "Awaiting Feedback",    emptyText: "No hiring manager feedback pending.",   href: "/action-center?scope=RECRUITER&tab=AWAITING_FEEDBACK", items: buckets.awaiting_feedback, icon: "🔄" },
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
    <section className="rounded-xl border bg-white p-4">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div style={{ fontSize: 18, fontWeight: 900, color: "#FF7043", lineHeight: 1.2, letterSpacing: "-0.01em" }}>
          Action Center
        </div>
        <div className="flex items-center gap-3">
          {refreshing ? <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.4 }}>Updating…</div> : null}
          <a
            href={`/action-center?scope=RECRUITER${chromeQuery ? `&chrome=${chromeQuery}` : ""}`}
            className="rounded-md border px-4 py-2 hover:bg-slate-50"
            style={{ fontSize: 13, fontWeight: 700, color: "#334155", lineHeight: 1.2 }}
          >
            View all
          </a>
        </div>
      </div>
      {initialLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="rounded-lg border bg-white p-4 min-h-[170px] animate-pulse flex flex-col">
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

// ─── Dashboard Body ───────────────────────────────────────────────────────────
function DashboardBody() {
  const router = useRouter();
  const chromeQuery = normalizeRecruiterChrome(router?.query?.chrome) || "recruiter-smb";
  const { isEnterprise } = usePlan();

  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function fetchDashboard() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/analytics/recruiter?range=30d&jobId=all&recruiterId=all");
        if (!res.ok) throw new Error(`Failed: ${res.status}`);
        const json = await res.json();
        if (isMounted) { setAnalyticsData(json); setError(null); }
      } catch (err) {
        if (isMounted) setError("Trouble loading live analytics. Will update automatically.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    fetchDashboard();
    return () => { isMounted = false; };
  }, []);

  const kpis = analyticsData?.kpis || null;
  const sourcesArray = Array.isArray(analyticsData?.sources) ? analyticsData.sources : [];
  const primarySource = sourcesArray[0] || null;

  const stats = [
    { label: "Total Views", value: kpis ? (kpis.totalViews ?? 0) : "—", href: "/recruiter/analytics" },
    { label: "Total Applies", value: kpis ? (kpis.totalApplies ?? 0) : "—", href: "/recruiter/analytics" },
    { label: "Time-to-Fill", value: kpis ? (typeof kpis.avgTimeToFillDays === "number" ? `${kpis.avgTimeToFillDays}d` : "—") : "—", href: "/recruiter/analytics" },
    { label: "View→Apply", value: kpis ? (typeof kpis.conversionRatePct === "number" ? `${kpis.conversionRatePct}%` : "—") : "—", href: "/recruiter/analytics" },
  ];

  const topCandidates = Array.isArray(analyticsData?.topCandidates) ? analyticsData.topCandidates : [];
  const topApplySourceLabel = primarySource?.name || "Forge";
  const topApplySourcePercent = primarySource && kpis?.totalApplies
    ? Math.round((primarySource.value / Math.max(kpis.totalApplies, 1)) * 100)
    : 100;
  const analyticsSnapshot = kpis ? {
    timeToHireDays: kpis.avgTimeToFillDays ?? 0,
    topApplySourceLabel,
    topApplySourcePercent,
    conversionViewToApply: kpis.conversionRatePct ?? 0,
  } : null;

  if (isMobile === null) return <div style={{ minHeight: 200 }} />;
  const greeting = getTimeGreeting();

  if (isMobile) {
    return (
      <div style={{ width: "100%", boxSizing: "border-box" }}>
        {error && (
          <div
            style={{
              background: "rgba(254,226,226,0.90)",
              border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: 10,
              padding: "10px 14px",
              fontSize: 12,
              color: "#B91C1C",
              marginBottom: 12,
              lineHeight: 1.5,
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "grid", gap: GAP }}>
          <RecruiterTitleCard
            greeting={greeting}
            title="Recruiter Dashboard"
            subtitle="Your hiring pipeline at a glance. Act on what matters most today."
            isMobile
          />

          <section style={{ ...GLASS, padding: 16 }}>
            <RecruiterActionCenterSection chromeQuery={chromeQuery} isMobile={true} />
          </section>

          <section style={{ ...GLASS, padding: "12px 0 12px 12px", overflow: "hidden" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingRight: 12,
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#112033",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  lineHeight: 1.2,
                }}
              >
                Last 30 Days
              </span>
              <Link
                href="/recruiter/analytics"
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: "#FF7043",
                  textDecoration: "none",
                  lineHeight: 1.2,
                }}
              >
                Full analytics →
              </Link>
            </div>
            <div
              style={{
                display: "flex",
                gap: 8,
                overflowX: "auto",
                paddingRight: 12,
                paddingBottom: 4,
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              <style>{`.kpi-scroll::-webkit-scrollbar{display:none}`}</style>
              {isLoading && !analyticsData ? (
                [1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    style={{
                      flexShrink: 0,
                      width: 110,
                      height: 72,
                      borderRadius: 12,
                      background: "rgba(255,255,255,0.70)",
                      border: "1px solid rgba(0,0,0,0.06)",
                    }}
                  />
                ))
              ) : (
                stats.map((t) => (
                  <Link
                    key={t.label}
                    href={t.href}
                    style={{
                      flexShrink: 0,
                      width: 110,
                      ...WHITE_CARD,
                      padding: "10px 12px",
                      textDecoration: "none",
                      display: "block",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        color: "#FF7043",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        lineHeight: 1.2,
                      }}
                    >
                      {t.label}
                    </div>
                    <div
                      style={{
                        fontSize: 24,
                        fontWeight: 900,
                        color: "#112033",
                        lineHeight: 1.05,
                        marginTop: 5,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {t.value}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>

          <section style={{ ...GLASS, padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 900,
                  color: "#112033",
                  lineHeight: 1.25,
                  letterSpacing: "-0.01em",
                }}
              >
                Top Candidates
              </span>
              <Link
                href="/recruiter/candidate-center"
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: "#FF7043",
                  textDecoration: "none",
                  padding: "5px 10px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,112,67,0.25)",
                  background: "rgba(255,112,67,0.08)",
                  lineHeight: 1.2,
                }}
              >
                View all
              </Link>
            </div>
            <div style={{ ...WHITE_CARD, padding: 12 }}>
              {isLoading && !analyticsData ? (
                <div style={{ display: "grid", gap: 8 }}>
                  {[1, 2, 3].map((i) => (
                    <div key={i} style={{ height: 14, background: "rgba(0,0,0,0.07)", borderRadius: 6, width: `${70 + i * 8}%` }} />
                  ))}
                </div>
              ) : isEnterprise ? (
                topCandidates.length === 0 ? (
                  <div style={{ fontSize: 13, color: "#90A4AE", lineHeight: 1.6 }}>
                    AI recommendations will appear once candidates interact with your jobs.
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 10 }}>
                    {topCandidates.slice(0, 5).map((c) => (
                      <div
                        key={`${c.id || c.email || c.name}-${c.title}`}
                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 800,
                              color: "#112033",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              lineHeight: 1.35,
                            }}
                          >
                            {c.name}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "#607D8B",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              lineHeight: 1.45,
                              marginTop: 2,
                            }}
                          >
                            {c.title}
                          </div>
                        </div>
                        <div
                          style={{
                            flexShrink: 0,
                            fontSize: 12,
                            fontWeight: 800,
                            color: "#FF7043",
                            background: "rgba(255,112,67,0.10)",
                            padding: "3px 8px",
                            borderRadius: 999,
                            border: "1px solid rgba(255,112,67,0.20)",
                            lineHeight: 1.2,
                          }}
                        >
                          {c.matchPercent}%
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <FeatureLock label="AI Candidate Recommendations">
                  <div style={{ fontSize: 13, color: "#90A4AE", lineHeight: 1.6 }}>
                    Upgrade to Enterprise to unlock AI-powered matching.
                  </div>
                </FeatureLock>
              )}
            </div>
          </section>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: GAP }}>
            <section style={{ ...GLASS, padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 900,
                    color: "#112033",
                    lineHeight: 1.25,
                    letterSpacing: "-0.01em",
                  }}
                >
                  Pipeline
                </span>
                <Link
                  href="/recruiter/candidate-center"
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#FF7043",
                    textDecoration: "none",
                    lineHeight: 1.2,
                  }}
                >
                  Open →
                </Link>
              </div>
              <div style={{ display: "grid", gap: 7 }}>
                {["New applicants", "Stuck in stage", "Interviews this week", "Offers pending"].map((item) => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: 999, background: "#FF7043", flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: "#37474F", lineHeight: 1.4 }}>{item}</span>
                  </div>
                ))}
              </div>
            </section>

            <section style={{ ...GLASS, padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 900,
                    color: "#112033",
                    lineHeight: 1.25,
                    letterSpacing: "-0.01em",
                  }}
                >
                  Trends
                </span>
                <Link
                  href="/recruiter/analytics"
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#FF7043",
                    textDecoration: "none",
                    lineHeight: 1.2,
                  }}
                >
                  Charts →
                </Link>
              </div>
              <div style={{ display: "grid", gap: 7 }}>
                {["Views vs Applies", "Time-to-fill", "Funnel drop-off", "Period vs prior"].map((item) => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: 999, background: "#1A4B8F", flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: "#37474F", lineHeight: 1.4 }}>{item}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section style={{ ...GLASS, padding: 16 }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 900,
                color: "#112033",
                marginBottom: 10,
                lineHeight: 1.25,
                letterSpacing: "-0.01em",
              }}
            >
              Health Snapshot
            </div>
            <div style={{ ...WHITE_CARD, padding: 12 }}>
              {isEnterprise ? (
                analyticsSnapshot ? (
                  <div style={{ display: "grid", gap: 8 }}>
                    {[
                      { label: "Time-to-Hire", value: `${analyticsSnapshot.timeToHireDays} days` },
                      { label: "Top Source", value: `${analyticsSnapshot.topApplySourceLabel} (${analyticsSnapshot.topApplySourcePercent}%)` },
                      { label: "Conversion", value: `${analyticsSnapshot.conversionViewToApply}%` },
                    ].map((row) => (
                      <div key={row.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <span style={{ fontSize: 12, color: "#607D8B", lineHeight: 1.45 }}>{row.label}</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: "#112033", lineHeight: 1.35 }}>{row.value}</span>
                      </div>
                    ))}
                    <Link
                      href="/recruiter/analytics"
                      style={{
                        color: "#FF7043",
                        fontWeight: 800,
                        fontSize: 12,
                        marginTop: 4,
                        display: "block",
                        textDecoration: "none",
                        lineHeight: 1.25,
                      }}
                    >
                      Open Analytics →
                    </Link>
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: "#90A4AE", lineHeight: 1.6 }}>
                    Analytics will appear once your roles receive activity.
                  </div>
                )
              ) : (
                <FeatureLock label="Analytics Snapshot">
                  <div style={{ fontSize: 13, color: "#90A4AE", lineHeight: 1.6 }}>
                    Upgrade to Enterprise to see detailed analytics.
                  </div>
                </FeatureLock>
              )}
            </div>
          </section>

          <section style={{ ...GLASS, padding: 12 }}>
            <div style={{ ...WHITE_CARD, padding: 16, minHeight: 100 }}>
              <div
                style={{
                  fontWeight: 800,
                  color: "#90A4AE",
                  marginBottom: 6,
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  lineHeight: 1.2,
                }}
              >
                Sponsored
              </div>
              <div style={{ fontSize: 13, color: "#B0BEC5", lineHeight: 1.5 }}>Ad space</div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", padding: 0, margin: 0, paddingRight: 16, boxSizing: "border-box" }}>
      {error && (
        <div
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 mb-4"
          style={{ fontSize: 12, color: "#B91C1C", lineHeight: 1.5, fontWeight: 600 }}
        >
          {error}
        </div>
      )}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `minmax(0, 1fr) ${RIGHT_COL_WIDTH}px`,
          gridTemplateRows: "auto auto auto auto",
          gap: GAP,
          width: "100%",
          minWidth: 0,
          boxSizing: "border-box",
        }}
      >
        <RecruiterTitleCard
          greeting={greeting}
          title="Recruiter Dashboard"
          subtitle="At-a-glance health for your roles, candidate flow, and where action is needed."
          style={{
            gridColumn: "1 / 2",
            gridRow: "1",
          }}
        />

        <section style={{ ...WHITE_CARD, padding: 16, gridColumn: "1 / 2", gridRow: "2" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {isLoading && !analyticsData
              ? Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="rounded-lg border bg-white p-4 animate-pulse space-y-2">
                    <div className="h-3 w-24 bg-slate-200 rounded" />
                    <div className="h-7 w-10 bg-slate-200 rounded" />
                  </div>
                ))
              : stats.map((t) => (
                  <Link
                    key={t.label}
                    href={t.href}
                    className="rounded-lg border bg-white p-4 hover:bg-slate-50 transition"
                    style={{ textDecoration: "none" }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        color: "#FF7043",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        lineHeight: 1.2,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {t.label}
                    </div>
                    <div
                      style={{
                        fontSize: 24,
                        fontWeight: 900,
                        marginTop: 5,
                        color: "#0F172A",
                        lineHeight: 1.05,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {t.value}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#64748B",
                        marginTop: 3,
                        lineHeight: 1.4,
                        fontWeight: 500,
                      }}
                    >
                      View details
                    </div>
                  </Link>
                ))}
          </div>
        </section>

        <div style={{ gridColumn: "1 / 2", gridRow: "3" }}>
          <RecruiterActionCenterSection chromeQuery={chromeQuery} isMobile={false} />
        </div>

        <aside
          style={{
            ...DARK_RAIL,
            gridColumn: "2 / 3",
            gridRow: "1 / 4",
            display: "flex",
            flexDirection: "column",
            gap: GAP,
            alignSelf: "stretch",
          }}
        >
          <div style={{ ...WHITE_CARD, padding: 16, flex: 2, minHeight: 180 }}>
            <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 8, color: "#0F172A", lineHeight: 1.25, letterSpacing: "-0.01em" }}>
              Sponsored
            </div>
            <div style={{ fontSize: 13, color: "#64748B", lineHeight: 1.55 }}>Ad space</div>
          </div>
          <div style={{ ...WHITE_CARD, padding: 16, flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 8, color: "#0F172A", lineHeight: 1.25, letterSpacing: "-0.01em" }}>
              Health Snapshot
            </div>
            {isEnterprise ? (
              analyticsSnapshot ? (
                <div style={{ fontSize: 13, display: "grid", gap: 8, color: "#334155", lineHeight: 1.55 }}>
                  <div>Time-to-Hire: {analyticsSnapshot.timeToHireDays} days</div>
                  <div>Top Apply Source: {analyticsSnapshot.topApplySourceLabel} ({analyticsSnapshot.topApplySourcePercent}%)</div>
                  <div>Conversion (View→Apply): {analyticsSnapshot.conversionViewToApply}%</div>
                  <div style={{ paddingTop: 2, fontSize: 11, color: "#64748B", lineHeight: 1.5 }}>
                    Open Analytics for breakdowns by range, role, recruiter, and funnel stage.
                  </div>
                  <div style={{ paddingTop: 4 }}>
                    <Link href="/recruiter/analytics" style={{ color: "#FF7043", fontWeight: 800, fontSize: 13, lineHeight: 1.2 }}>
                      Open Analytics
                    </Link>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 13, color: "#64748B", lineHeight: 1.6 }}>
                  Analytics will appear once your roles start receiving views and applications.
                </div>
              )
            ) : (
              <FeatureLock label="Analytics Snapshot">
                <div style={{ fontSize: 13, color: "#64748B", lineHeight: 1.6 }}>
                  Upgrade to Enterprise to see detailed analytics for your roles.
                </div>
              </FeatureLock>
            )}
          </div>
        </aside>

        <div
          style={{
            gridColumn: "1 / -1",
            gridRow: "4",
            display: "grid",
            gridTemplateColumns: "minmax(0, 5fr) minmax(0, 5fr) minmax(0, 3fr)",
            gap: GAP,
            marginLeft: -252,
            boxSizing: "border-box",
            minWidth: 0,
          }}
        >
          <section style={{ ...WHITE_CARD, padding: 16 }}>
            <div className="flex items-center justify-between mb-3">
              <h2 style={{ fontSize: 18, fontWeight: 900, color: "#FF7043", lineHeight: 1.25, letterSpacing: "-0.01em", margin: 0 }}>
                Top Candidate Recommendations
              </h2>
              <Link href="/recruiter/candidate-center" style={{ color: "#FF7043", fontWeight: 800, fontSize: 13, lineHeight: 1.2 }}>
                View all
              </Link>
            </div>
            {isLoading && !analyticsData ? (
              <ul className="text-sm grid gap-2 animate-pulse">
                <li className="h-3 bg-slate-200 rounded w-3/4" />
                <li className="h-3 bg-slate-200 rounded w-4/5" />
                <li className="h-3 bg-slate-200 rounded w-2/3" />
              </ul>
            ) : isEnterprise ? (
              topCandidates.length === 0 ? (
                <div style={{ fontSize: 13, color: "#64748B", lineHeight: 1.6 }}>
                  AI recommendations will appear here once candidates start interacting with your jobs.
                </div>
              ) : (
                <ul style={{ fontSize: 13, display: "grid", gap: 8, color: "#334155", lineHeight: 1.55, paddingLeft: 0, margin: 0, listStyle: "none" }}>
                  {topCandidates.slice(0, 5).map((c) => (
                    <li key={`${c.id || c.email || c.name}-${c.title}`}>• {c.name} — {c.title} ({c.matchPercent}% match)</li>
                  ))}
                </ul>
              )
            ) : (
              <FeatureLock label="AI Candidate Recommendations">
                <div style={{ fontSize: 13, color: "#64748B", lineHeight: 1.6 }}>
                  Upgrade to Enterprise to unlock AI-powered candidate matching in this panel.
                </div>
              </FeatureLock>
            )}
          </section>

          <section style={{ ...WHITE_CARD, padding: 16 }}>
            <div className="flex items-center justify-between mb-3">
              <h2 style={{ fontSize: 18, fontWeight: 900, color: "#FF7043", lineHeight: 1.25, letterSpacing: "-0.01em", margin: 0 }}>
                Pipeline Health
              </h2>
              <Link href="/recruiter/candidate-center" style={{ color: "#FF7043", fontWeight: 800, fontSize: 13, lineHeight: 1.2 }}>
                Open pipeline
              </Link>
            </div>
            <div style={{ fontSize: 13, color: "#334155", display: "grid", gap: 8, lineHeight: 1.55 }}>
              <div style={{ color: "#64748B" }}>This panel becomes your "where do I act today?" view.</div>
              <div>• New applicants needing review</div>
              <div>• Candidates stuck in stage (SLA watch)</div>
              <div>• Interviews scheduled this week</div>
              <div>• Offers pending response</div>
              <div style={{ paddingTop: 4, fontSize: 11, color: "#64748B", lineHeight: 1.5 }}>
                Next wiring step: feed counts by stage + "stale" thresholds.
              </div>
            </div>
          </section>

          <section style={{ ...WHITE_CARD, padding: 16 }}>
            <div className="flex items-center justify-between mb-3">
              <h3 style={{ fontSize: 16, fontWeight: 900, color: "#FF7043", lineHeight: 1.25, letterSpacing: "-0.01em", margin: 0 }}>
                Trends
              </h3>
              <Link href="/recruiter/analytics" style={{ color: "#FF7043", fontWeight: 800, fontSize: 13, lineHeight: 1.2 }}>
                View charts
              </Link>
            </div>
            <div style={{ fontSize: 13, color: "#334155", display: "grid", gap: 8, lineHeight: 1.55 }}>
              <div style={{ color: "#64748B" }}>Trendline / chart goes here.</div>
              <div>• Views vs Applies (last 7 / 30 / 90)</div>
              <div>• Time-to-fill trend</div>
              <div>• Funnel drop-off alerts</div>
              <div style={{ paddingTop: 4, fontSize: 11, color: "#64748B", lineHeight: 1.5 }}>
                Next wiring step: add a small sparkline + "change vs last period".
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function RecruiterDashboardPage() {
  return (
    <PlanProvider>
      <RecruiterLayout title="ForgeTomorrow — Recruiter Dashboard" activeNav="dashboard" contentFullBleed>
        <DashboardBody />
      </RecruiterLayout>
    </PlanProvider>
  );
}