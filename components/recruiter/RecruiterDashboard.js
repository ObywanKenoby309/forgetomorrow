// components/recruiter/RecruiterDashboard.js

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import FeatureLock from "@/components/recruiter/FeatureLock";
import RightRailPlacementManager from "@/components/ads/RightRailPlacementManager";
import ActionCenterTab from "@/components/dashboard/ActionCenterTab";
import { usePlan } from "@/context/PlanContext";

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
const RIGHT_COL_WIDTH = 280;

export default function RecruiterDashboard() {
  const router = useRouter();
  const chromeQuery = normalizeRecruiterChrome(router?.query?.chrome) || "recruiter-smb";
  const withRecruiterChrome = (path) => chromeQuery ? `${path}${path.includes("?") ? "&" : "?"}chrome=${chromeQuery}` : path;
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
        if (isMounted) {
          setAnalyticsData(json);
          setError(null);
        }
      } catch (err) {
        if (isMounted) setError("Trouble loading live analytics. Will update automatically.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    fetchDashboard();
    return () => {
      isMounted = false;
    };
  }, []);
  const kpis = analyticsData?.kpis || null;
  const sourcesArray = Array.isArray(analyticsData?.sources) ? analyticsData.sources : [];
  const primarySource = sourcesArray[0] || null;
  const stats = [
    { label: "TOTAL VIEWS", value: kpis ? (kpis.totalViews ?? 0) : "—", href: "/recruiter/analytics" },
    { label: "TOTAL APPLIES", value: kpis ? (kpis.totalApplies ?? 0) : "—", href: "/recruiter/analytics" },
    { label: "TIME-TO-FILL", value: kpis ? (typeof kpis.avgTimeToFillDays === "number" ? `${kpis.avgTimeToFillDays}d` : "—") : "—", href: "/recruiter/analytics" },
    { label: "VIEW→APPLY", value: kpis ? (typeof kpis.conversionRatePct === "number" ? `${kpis.conversionRatePct}%` : "—") : "—", href: "/recruiter/analytics" },
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
<ActionCenterTab
            scope="RECRUITER"
            withChrome={withRecruiterChrome}
            pickBucket={pickRecruiterBucket}
            allHref={`/action-center?scope=RECRUITER&chrome=${chromeQuery}`}
            tileDefs={[
              { key: "unread_replies", bucket: "unread_replies", title: "Unread Replies", emptyText: "No unread candidate replies.", href: `/action-center?scope=RECRUITER&tab=UNREAD_REPLIES&chrome=${chromeQuery}`, icon: "💬" },
              { key: "upcoming", bucket: "upcoming", title: "Upcoming Interviews", emptyText: "No upcoming interviews or conflicts.", href: `/action-center?scope=RECRUITER&tab=UPCOMING&chrome=${chromeQuery}`, icon: "📅" },
              { key: "stalled", bucket: "stalled", title: "Stalled Candidates", emptyText: "No stalled candidates right now.", href: `/action-center?scope=RECRUITER&tab=STALLED&chrome=${chromeQuery}`, icon: "⚠️" },
              { key: "awaiting_feedback", bucket: "awaiting_feedback", title: "Awaiting Feedback", emptyText: "No hiring manager feedback pending.", href: `/action-center?scope=RECRUITER&tab=AWAITING_FEEDBACK&chrome=${chromeQuery}`, icon: "🔄" },
            ]}
          />
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
                <span style={{ fontSize: 13, fontWeight: 900, color: "#112033", lineHeight: 1.25, letterSpacing: "-0.01em" }}>
                  Pipeline
                </span>
                <Link href="/recruiter/candidate-center" style={{ fontSize: 11, fontWeight: 800, color: "#FF7043", textDecoration: "none", lineHeight: 1.2 }}>
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
                <span style={{ fontSize: 13, fontWeight: 900, color: "#112033", lineHeight: 1.25, letterSpacing: "-0.01em" }}>
                  Trends
                </span>
                <Link href="/recruiter/analytics" style={{ fontSize: 11, fontWeight: 800, color: "#FF7043", textDecoration: "none", lineHeight: 1.2 }}>
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
            <div style={{ fontSize: 15, fontWeight: 900, color: "#112033", marginBottom: 10, lineHeight: 1.25, letterSpacing: "-0.01em" }}>
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

          <RightRailPlacementManager />
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
          gridTemplateRows: "auto auto auto",
          gap: GAP,
          width: "100%",
          minWidth: 0,
          boxSizing: "border-box",
        }}
      >
{/* KPI Section */}
        <section style={{ ...GLASS, ...GLASS_OVERLAY, padding: "12px 16px 16px 16px", gridColumn: "1 / 2", gridRow: "1" }}>
          <div >
            <div style={{ display:"grid", gridTemplateColumns:"1fr auto 1fr", alignItems:"center", gap:10, marginBottom:12 }}><h2
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
              KPIs
            </h2><div style={{ textAlign:"center", fontSize:12, color:"#64748B", fontWeight:500 }}>Click a card to view more</div><div style={{ textAlign:"right" }}><Link
              href="/recruiter/analytics"
              style={{
                color: "#FF7043",
                fontWeight: 800,
                fontSize: 13,
                lineHeight: 1.2,
                textDecoration: "none",
                ...ORANGE_HEADING_LIFT,
              }}
            >
              Full analytics →
            </Link></div></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {isLoading && !analyticsData
              ? Array.from({ length: 4 }).map((_, idx) => (
                  <div
                    key={idx}
                    style={{
                      ...WHITE_CARD,
                      padding: 16,
                      minHeight: 108,
                    }}
                    className="animate-pulse space-y-2"
                  >
                    <div className="h-3 w-24 bg-slate-200 rounded" />
                    <div className="h-7 w-10 bg-slate-200 rounded" />
                  </div>
                ))
              : stats.map((t) => (
                  <Link
                    key={t.label}
                    href={t.href}
                    style={{
                      ...WHITE_CARD,
                      padding: "14px 16px",
                      minHeight: 108,
                      textDecoration: "none",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ textAlign: "center", width: "100%" }}>
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
                          marginTop: 6,
                          color: "#0F172A",
                          lineHeight: 1.05,
                          letterSpacing: "-0.02em",
                        }}
                      >
                        {t.value}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#64748B",
                        marginTop: 10,
                        lineHeight: 1.4,
                        fontWeight: 500,
                        alignSelf: "flex-end",
                        width: "100%",
                        textAlign: "right",
                      }}
                    >
                      View details
                    </div>
                  </Link>
                ))}
			</div>
          </div>
        </section>

        <div style={{ gridColumn: "1 / 2", gridRow: "2" }}>
          <RecruiterActionCenterSection chromeQuery={chromeQuery} isMobile={false} />
        </div>

        <aside
          style={{
            gridColumn: "2 / 3",
            gridRow: "1 / 2",
            display: "flex",
            flexDirection: "column",
            gap: GAP,
            alignSelf: "stretch",
            width: RIGHT_COL_WIDTH,
            minWidth: RIGHT_COL_WIDTH,
            maxWidth: RIGHT_COL_WIDTH,
            padding: 0,
            background: "transparent",
            border: "none",
            boxShadow: "none",
            backdropFilter: "none",
            WebkitBackdropFilter: "none",
            boxSizing: "border-box",
          }}
        >
          <RightRailPlacementManager />
        </aside>

        <div
          style={{
            gridColumn: "2 / 3",
            gridRow: "2",
            ...GLASS,
            padding: 16,
            boxSizing: "border-box",
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 8, color: "#0F172A", lineHeight: 1.25, letterSpacing: "-0.01em" }}>
            Health Snapshot
          </div>
            {isEnterprise ? (
              analyticsSnapshot ? (
                <div style={{ ...WHITE_CARD, padding: 14, fontSize: 13, display: "grid", gap: 8, color: "#334155", lineHeight: 1.55 }}>
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
                <div style={{ ...WHITE_CARD, padding: 14, fontSize: 13, color: "#64748B", lineHeight: 1.6 }}>
                  Analytics will appear once your roles start receiving views and applications.
                </div>
              )
            ) : (
              <FeatureLock label="Analytics Snapshot">
                <div style={{ ...WHITE_CARD, padding: 14, fontSize: 13, color: "#64748B", lineHeight: 1.6 }}>
                  Upgrade to Enterprise to see detailed analytics for your roles.
                </div>
              </FeatureLock>
            )}
        </div>

        <div
          style={{
            gridColumn: "1 / -1",
            gridRow: "3",
            display: "grid",
            gridTemplateColumns: "minmax(0, 5fr) minmax(0, 5fr) minmax(0, 3fr)",
            gap: GAP,
            marginLeft: -252,
            boxSizing: "border-box",
            minWidth: 0,
          }}
        >
          <section style={{ ...GLASS, ...GLASS_OVERLAY, padding: 16 }}>
            <div >
  <h2
    style={{
      fontSize: 18,
      fontWeight: 900,
      color: "#FF7043",
      lineHeight: 1.25,
      letterSpacing: "-0.01em",
      margin: 0,
      ...ORANGE_HEADING_LIFT
    }}
  >
    Top Candidate Recommendations
  </h2>
  <Link 
    href="/recruiter/candidate-center" 
    style={{ 
      color: "#FF7043", 
      fontWeight: 800, 
      fontSize: 13, 
      lineHeight: 1.2,
      ...ORANGE_HEADING_LIFT 
    }}
  >
    View all
  </Link>
</div>
            <div style={{ ...WHITE_CARD, padding: 14 }}>
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
            </div>
          </section>
          <section style={{ ...GLASS, ...GLASS_OVERLAY, padding: 16 }}>
            <div >
  <h2
    style={{
      fontSize: 18,
      fontWeight: 900,
      color: "#FF7043",
      lineHeight: 1.25,
      letterSpacing: "-0.01em",
      margin: 0,
      ...ORANGE_HEADING_LIFT
    }}
  >
    Pipeline Health
  </h2>
  <Link 
    href="/recruiter/candidate-center" 
    style={{ 
      color: "#FF7043", 
      fontWeight: 800, 
      fontSize: 13, 
      lineHeight: 1.2,
      ...ORANGE_HEADING_LIFT 
    }}
  >
    Open pipeline
  </Link>
</div>
            <div style={{ ...WHITE_CARD, padding: 14, fontSize: 13, color: "#334155", display: "grid", gap: 8, lineHeight: 1.55 }}>
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
          <section style={{ ...GLASS, ...GLASS_OVERLAY, padding: 16 }}>
            <div >
  <h3
    style={{
      fontSize: 16,
      fontWeight: 900,
      color: "#FF7043",
      lineHeight: 1.25,
      letterSpacing: "-0.01em",
      margin: 0,
      ...ORANGE_HEADING_LIFT
    }}
  >
    Trends
  </h3>
  <Link 
    href="/recruiter/analytics" 
    style={{ 
      color: "#FF7043", 
      fontWeight: 800, 
      fontSize: 13, 
      lineHeight: 1.2,
      ...ORANGE_HEADING_LIFT 
    }}
  >
    View charts
  </Link>
</div>
            <div style={{ ...WHITE_CARD, padding: 14, fontSize: 13, color: "#334155", display: "grid", gap: 8, lineHeight: 1.55 }}>
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

