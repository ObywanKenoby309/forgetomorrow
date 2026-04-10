// pages/dashboard/coaching/client-hub-update.js
//
// Rebuilt Client Hub — mirrors candidate-center-update.js exactly.
// Same UX pattern, different tools. No iframes. No nested pages.
//
// Modules render inline via:
//   - ClientsModule   (components/coaching/modules/ClientsModule.js)
//   - SessionsModule  (components/coaching/modules/SessionsModule.js)
//   - FeedbackModule  (components/coaching/modules/FeedbackModule.js)
//
// When ready to go live, rename this file to client-hub.js
// and delete the old one.

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import CoachingLayout from "@/components/layouts/CoachingLayout";
import CoachingTitleCard from "@/components/coaching/CoachingTitleCard";
import RightRailPlacementManager from "@/components/ads/RightRailPlacementManager";
import { getTimeGreeting } from "@/lib/dashboardGreeting";

// ─── Inline modules ───────────────────────────────────────────────────────────
import ClientsModule  from "@/components/coaching/modules/ClientsModule";
import SessionsModule from "@/components/coaching/modules/SessionsModule";
import FeedbackModule from "@/components/coaching/modules/FeedbackModule";

// ─── Shared styles (identical to candidate center) ────────────────────────────
const GLASS = {
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.22)",
  background: "rgba(255,255,255,0.68)",
  boxShadow: "0 10px 28px rgba(15,23,42,0.12)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
};

const WHITE_CARD = {
  background: "rgba(255,255,255,0.92)",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: 16,
  boxShadow: "0 6px 18px rgba(15,23,42,0.10)",
  boxSizing: "border-box",
  position: "relative",
  overflow: "hidden",
};

const ORANGE = "#FF7043";
const GAP = 16;

const ORANGE_HEADING_LIFT = {
  textShadow: "0 2px 4px rgba(15,23,42,0.65), 0 1px 2px rgba(0,0,0,0.4)",
  fontWeight: 900,
};

// ─── Mobile detection ─────────────────────────────────────────────────────────
function useIsMobile(breakpoint = 1024) {
  const [isMobile, setIsMobile] = useState(null);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);
  return isMobile;
}

// ─── Tile icon ────────────────────────────────────────────────────────────────
function CoachHubIcon({ label, size = 64 }) {
  const iconMap = { clients: "👥", sessions: "📅", feedback: "⭐" };
  return (
    <div style={{
      width: size, height: size, borderRadius: 12,
      background: "rgba(255,112,67,0.10)", border: "1px solid rgba(255,112,67,0.20)",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0, fontSize: size * 0.42,
    }}>
      {iconMap[label] || "📁"}
    </div>
  );
}

// ─── Tile definitions ─────────────────────────────────────────────────────────
const TILES = [
  {
    id:       "clients",
    title:    "Clients",
    desc:     "Manage active clients, goals, status, and coaching plans in one place.",
    subtitle: "Review client records, progress, and account activity.",
  },
  {
    id:       "sessions",
    title:    "Sessions",
    desc:     "Schedule, track, and review upcoming and past coaching sessions.",
    subtitle: "Work with your coaching schedule, session records, and upcoming appointments.",
  },
  {
    id:       "feedback",
    title:    "Feedback",
    desc:     "Review coaching feedback and trends to keep improving outcomes.",
    subtitle: "Monitor ratings, sentiment, and session feedback history.",
  },
];

// ─── WorkspaceModuleShell ─────────────────────────────────────────────────────
function WorkspaceModuleShell({ title, subtitle, onBack, children }) {
  return (
    <section style={{ ...GLASS, padding: 24, display: "grid", gap: 16, width: "100%" }}>
      <button
        type="button"
        onClick={onBack}
        style={{
          marginBottom: 4, fontSize: "0.875rem", color: ORANGE,
          textDecoration: "underline", background: "none", border: "none",
          cursor: "pointer", textAlign: "left", width: "fit-content",
          fontWeight: 800, padding: 0,
        }}
      >
        ← Return to Main
      </button>
      <div style={{ display: "grid", gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: 22, color: ORANGE, lineHeight: 1.2, letterSpacing: "-0.01em", ...ORANGE_HEADING_LIFT }}>
          {title}
        </h2>
        <p style={{ margin: 0, color: "#546E7A", fontSize: 15, lineHeight: 1.6 }}>
          {subtitle}
        </p>
      </div>
      {children}
    </section>
  );
}

// ─── Desktop tile card ────────────────────────────────────────────────────────
function DesktopCard({ tile, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(tile.id)}
      style={{
        ...WHITE_CARD, padding: 18, minHeight: 140,
        display: "grid", gap: 8, width: "100%",
        textAlign: "left", cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <div style={{ fontWeight: 800, color: ORANGE, fontSize: 18, lineHeight: 1.2, letterSpacing: "-0.01em", textShadow: "0 1px 2px rgba(15,23,42,0.28)" }}>
          {tile.title}
        </div>
      </div>
      <div style={{ color: "#546E7A", fontSize: 13, lineHeight: 1.55 }}>{tile.desc}</div>
      <div style={{ marginTop: "auto", color: ORANGE, fontWeight: 700, fontSize: 13, lineHeight: 1.2, textShadow: "0 1px 2px rgba(15,23,42,0.22)" }}>
        Open →
      </div>
    </button>
  );
}

// ─── Mobile card ──────────────────────────────────────────────────────────────
function MobileCard({ tile, isActive, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        ...WHITE_CARD,
        display: "block", padding: "22px 20px 20px", minHeight: 210,
        width: "100%", textAlign: "left", cursor: "pointer",
        border: `1.5px solid ${isActive ? "rgba(255,112,67,0.40)" : "rgba(255,112,67,0.15)"}`,
        boxShadow: isActive
          ? "0 12px 28px rgba(0,0,0,0.12), 0 0 0 3px rgba(255,112,67,0.12)"
          : "0 12px 28px rgba(0,0,0,0.10)",
      }}
    >
      <div aria-hidden="true" style={{ position: "absolute", right: -70, top: -70, width: 200, height: 200, background: "radial-gradient(circle, rgba(255,112,67,0.18), rgba(255,112,67,0.00) 70%)", pointerEvents: "none" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
        <CoachHubIcon label={tile.id} size={64} />
        <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0, color: ORANGE, lineHeight: 1.1, ...ORANGE_HEADING_LIFT }}>
          {tile.title}
        </h2>
      </div>
      <p style={{ color: "#37474F", margin: "0 0 14px", lineHeight: 1.55, fontSize: 15 }}>{tile.desc}</p>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
        <span style={{ fontSize: 15, fontWeight: 900, color: ORANGE, display: "flex", alignItems: "center", gap: 4 }}>
          {isActive ? "Selected" : "Open"}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="#FF7043" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </button>
  );
}

// ─── Mobile hub (swipeable carousel) ─────────────────────────────────────────
function MobileClientHub({ tiles, activeModule, setActiveModule }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const trackRef = useRef(null);
  const programmatic = useRef(false);

  const goTo = useCallback((index) => {
    setActiveIndex(index);
    setDropdownOpen(false);
    const track = trackRef.current;
    if (!track) return;
    programmatic.current = true;
    track.scrollTo({ left: index * track.offsetWidth, behavior: "smooth" });
    setTimeout(() => { programmatic.current = false; }, 600);
  }, []);

  const handleScroll = useCallback(() => {
    if (programmatic.current) return;
    const track = trackRef.current;
    if (!track) return;
    const idx = Math.round(track.scrollLeft / track.offsetWidth);
    setActiveIndex(Math.max(0, Math.min(idx, tiles.length - 1)));
  }, [tiles.length]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    track.addEventListener("scroll", handleScroll, { passive: true });
    return () => track.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {/* Dropdown nav */}
      <div style={{ position: "relative", padding: "0 16px" }}>
        <button
          type="button"
          onClick={() => setDropdownOpen((o) => !o)}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "rgba(255,255,255,0.92)", border: "1.5px solid rgba(255,112,67,0.20)", borderRadius: 12, padding: "12px 16px", cursor: "pointer" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <CoachHubIcon label={tiles[activeIndex]?.id} size={28} />
            <span style={{ fontWeight: 800, fontSize: 15, color: ORANGE }}>{tiles[activeIndex]?.title}</span>
          </div>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ transform: dropdownOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
            <path d="M4 7l5 5 5-5" stroke="#FF7043" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {dropdownOpen && (
          <div style={{ position: "absolute", zIndex: 100, top: "calc(100% + 6px)", left: 16, right: 16, background: "rgba(255,255,255,0.98)", border: "1.5px solid rgba(255,112,67,0.20)", borderRadius: 12, overflow: "hidden", boxShadow: "0 20px 48px rgba(0,0,0,0.16)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" }}>
            {tiles.map((tile, i) => (
              <button key={tile.id} onClick={() => goTo(i)} style={{ width: "100%", background: i === activeIndex ? "rgba(255,112,67,0.08)" : "transparent", border: "none", borderBottom: i < tiles.length - 1 ? "1px solid rgba(0,0,0,0.06)" : "none", padding: "13px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", textAlign: "left" }}>
                <CoachHubIcon label={tile.id} size={34} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.2, color: i === activeIndex ? ORANGE : "#37474F" }}>{tile.title}</div>
                  <div style={{ fontSize: 12, color: "#78909C", marginTop: 2 }}>Open below</div>
                </div>
                {i === activeIndex && (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
                    <path d="M4 9L7.5 12.5L14 6" stroke="#FF7043" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Swipeable track */}
      <div ref={trackRef} style={{ display: "flex", overflowX: "auto", scrollSnapType: "x mandatory", msOverflowStyle: "none", scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
        {tiles.map((tile) => (
          <div key={tile.id} style={{ flexShrink: 0, width: "100%", scrollSnapAlign: "start", padding: "0 16px", boxSizing: "border-box" }}>
            <MobileCard tile={tile} isActive={activeModule === tile.id} onSelect={() => setActiveModule(tile.id)} />
          </div>
        ))}
      </div>

      {/* Dot indicators */}
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 4 }}>
        {tiles.map((_, i) => (
          <button key={i} onClick={() => goTo(i)} aria-label={`Go to ${tiles[i].title}`} style={{ width: i === activeIndex ? 24 : 8, height: 8, borderRadius: 999, background: i === activeIndex ? ORANGE : "rgba(255,112,67,0.25)", border: "none", padding: 0, cursor: "pointer", transition: "width 220ms ease, background 220ms ease" }} />
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ClientHubUpdate() {
  const isMobile  = useIsMobile(1024);
  const greeting  = getTimeGreeting();
  const tiles     = useMemo(() => TILES, []);
  const [activeModule, setActiveModule] = useState(null);
  const activeTile = tiles.find((t) => t.id === activeModule) || null;

  const HeaderBox = (
    <CoachingTitleCard
      greeting={greeting}
      title="Client Hub"
      subtitle="Your coaching workspace — clients, sessions, and feedback all in one place."
      compact
    />
  );

  const RightColumn = <RightRailPlacementManager slot="right_rail_1" />;

  if (isMobile === null) {
    return (
      <CoachingLayout
        title="ForgeTomorrow — Client Hub"
        header={HeaderBox}
        right={RightColumn}
        rightVariant="light"
        activeNav="client-hub"
      />
    );
  }

  return (
    <CoachingLayout
      title="ForgeTomorrow — Client Hub"
      header={HeaderBox}
      right={isMobile ? null : RightColumn}
      rightVariant="light"
      activeNav="client-hub"
    >
      <section style={{ padding: 0, display: "grid", gap: 12 }}>
        {!activeModule ? (
          <>
            {!isMobile && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4, gap: 12 }}>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: ORANGE, lineHeight: 1.25, letterSpacing: "-0.01em", margin: 0, ...ORANGE_HEADING_LIFT }}>
                  Coaching Tools
                </h2>
              </div>
            )}

            <div style={{ ...GLASS, paddingTop: 24, paddingBottom: 24, paddingLeft: isMobile ? 0 : 16, paddingRight: isMobile ? 0 : 16, width: "100%", overflow: isMobile ? "hidden" : "visible" }}>
              {isMobile ? (
                <MobileClientHub tiles={tiles} activeModule={activeModule} setActiveModule={setActiveModule} />
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: GAP }}>
                  {tiles.map((tile) => (
                    <DesktopCard key={tile.id} tile={tile} onOpen={setActiveModule} />
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <WorkspaceModuleShell
            title={activeTile?.title || "Client Hub Tool"}
            subtitle={activeTile?.subtitle || ""}
            onBack={() => setActiveModule(null)}
          >
            {(() => {
              switch (activeModule) {
                case "clients":  return <ClientsModule />;
                case "sessions": return <SessionsModule />;
                case "feedback": return <FeedbackModule />;
                default:         return null;
              }
            })()}
          </WorkspaceModuleShell>
        )}
      </section>
    </CoachingLayout>
  );
}