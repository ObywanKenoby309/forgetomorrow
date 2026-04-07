// pages/recruiter/candidate-center-update.js
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import RecruiterLayout from "@/components/layouts/RecruiterLayout";
import RightRailPlacementManager from "@/components/ads/RightRailPlacementManager";
import { usePlan } from "@/context/PlanContext";
import { getTimeGreeting } from "@/lib/dashboardGreeting";
import RecruiterTitleCard from "@/components/recruiter/RecruiterTitleCard";
import ExternalCompareModule from "@/components/recruiter/candidate-center/ExternalCompareModule";

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

function CandidateIcon({ src, alt, size = 64 }) {
  if (!src) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: 12,
          background: "rgba(255,112,67,0.10)",
          border: "1px solid rgba(255,112,67,0.20)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg width={size * 0.45} height={size * 0.45} viewBox="0 0 24 24" fill="none">
          <path
            d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
            stroke="#FF7043"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx="9"
            cy="7"
            r="4"
            stroke="#FF7043"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
            stroke="#FF7043"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        flexShrink: 0,
        filter: "drop-shadow(0 2px 5px rgba(0,0,0,0.18))",
      }}
      loading="lazy"
      decoding="async"
    />
  );
}

function buildTiles(isEnterprise) {
  return [
    {
      id: "search",
      title: "Internal Candidate Search",
      desc: "Search and automate discovery of candidates already on ForgeTomorrow.",
      subtitle: "Internal candidate search, targeting, WHY, compare, and recruiter workflow tools.",
      src: "/recruiter/candidates?chrome=recruiter-ent",
      img: null,
    },
    {
  id: "compare",
  title: "External Compare",
  desc: "Paste any resume and job description to generate an evidence-backed comparison, even outside ForgeTomorrow.",
  subtitle: "External resume and job comparison with explainable matching support.",
  src: "/recruiter/explain?chrome=recruiter-ent",
  img: null,
},
    {
      id: "pools",
      title: "Talent Pools",
      desc: "Organize strong candidates into pools you can revisit and reuse across roles.",
      subtitle: "Saved candidate pools for review, follow-up, and future hiring needs.",
      src: "/recruiter/pools?chrome=recruiter-ent",
      note: isEnterprise ? "" : "Available tonight",
      img: null,
    },
  ];
}

function WorkspaceModuleShell({ title, subtitle, onBack, children }) {
  return (
    <section
      style={{
        ...GLASS,
        padding: 24,
        display: "grid",
        gap: 16,
        width: "100%",
      }}
    >
      <button
        type="button"
        onClick={onBack}
        style={{
          marginBottom: 4,
          fontSize: "0.875rem",
          color: ORANGE,
          textDecoration: "underline",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          width: "fit-content",
          fontWeight: 800,
          padding: 0,
        }}
      >
        ← Return to Main
      </button>

      <div style={{ display: "grid", gap: 8 }}>
        <h2
          style={{
            margin: 0,
            fontSize: 22,
            color: ORANGE,
            lineHeight: 1.2,
            letterSpacing: "-0.01em",
            ...ORANGE_HEADING_LIFT,
          }}
        >
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

function ToolFrame({ src, height }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.72)",
        border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 6px 18px rgba(15,23,42,0.10)",
      }}
    >
      <iframe
        src={src}
        title="Candidate Center Tool"
        style={{
          width: "100%",
          height,
          border: "none",
          display: "block",
          background: "white",
        }}
      />
    </div>
  );
}

function MobileCard({ tile, isActive, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        ...WHITE_CARD,
        display: "block",
        padding: "22px 20px 20px",
        minHeight: 210,
        width: "100%",
        textAlign: "left",
        cursor: "pointer",
        border: `1.5px solid ${isActive ? "rgba(255,112,67,0.40)" : "rgba(255,112,67,0.15)"}`,
        boxShadow: isActive
          ? "0 12px 28px rgba(0,0,0,0.12), 0 0 0 3px rgba(255,112,67,0.12)"
          : "0 12px 28px rgba(0,0,0,0.10)",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          right: -70,
          top: -70,
          width: 200,
          height: 200,
          background: "radial-gradient(circle, rgba(255,112,67,0.18), rgba(255,112,67,0.00) 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
        <CandidateIcon src={tile.img} alt={tile.title} size={64} />
        <h2
          style={{
            fontSize: 20,
            fontWeight: 900,
            margin: 0,
            color: ORANGE,
            lineHeight: 1.1,
            ...ORANGE_HEADING_LIFT,
          }}
        >
          {tile.title}
        </h2>
      </div>

      <p style={{ color: "#37474F", margin: "0 0 14px", lineHeight: 1.55, fontSize: 15 }}>
        {tile.desc}
      </p>

      {tile.note ? (
        <p
          style={{
            color: ORANGE,
            fontSize: 12,
            margin: "0 0 14px",
            fontWeight: 800,
            fontStyle: "italic",
          }}
        >
          {tile.note}
        </p>
      ) : null}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
        <span
          style={{
            fontSize: 15,
            fontWeight: 900,
            color: ORANGE,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          {isActive ? "Selected" : "Open"}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M3 8H13M13 8L9 4M13 8L9 12"
              stroke="#FF7043"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
    </button>
  );
}

function MobileCandidateCenter({ tiles, activeModule, setActiveModule }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const trackRef = useRef(null);
  const programmatic = useRef(false);

  const goTo = useCallback(
    (index) => {
      setActiveIndex(index);
      setDropdownOpen(false);
      const track = trackRef.current;
      if (!track) return;
      programmatic.current = true;
      track.scrollTo({ left: index * track.offsetWidth, behavior: "smooth" });
      setTimeout(() => {
        programmatic.current = false;
      }, 600);
    },
    []
  );

  const handleScroll = useCallback(() => {
    if (programmatic.current) return;
    const track = trackRef.current;
    if (!track) return;
    const index = Math.round(track.scrollLeft / track.offsetWidth);
    if (index >= 0 && index < tiles.length) setActiveIndex(index);
  }, [tiles.length]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    track.addEventListener("scroll", handleScroll, { passive: true });
    return () => track.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const active = tiles[activeIndex];

  if (activeModule) {
    return null;
  }

  return (
    <div style={{ position: "relative" }}>
      <div style={{ padding: "0 16px 14px", position: "relative", zIndex: 20 }}>
        <button
          onClick={() => setDropdownOpen((o) => !o)}
          style={{
            ...WHITE_CARD,
            width: "100%",
            padding: "13px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <CandidateIcon src={active.img} alt={active.title} size={28} />
            <span style={{ fontSize: 16, fontWeight: 800, color: ORANGE, ...ORANGE_HEADING_LIFT }}>
              {active.title}
            </span>
          </div>
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            style={{
              flexShrink: 0,
              transition: "transform 200ms ease",
              transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            <path
              d="M5 7.5L10 12.5L15 7.5"
              stroke="#FF7043"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {dropdownOpen ? (
          <div
            style={{
              position: "absolute",
              top: "calc(100% - 14px + 6px)",
              left: 16,
              right: 16,
              background: "rgba(255,255,255,0.98)",
              border: "1.5px solid rgba(255,112,67,0.20)",
              borderRadius: 12,
              overflow: "hidden",
              boxShadow: "0 20px 48px rgba(0,0,0,0.16)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
            }}
          >
            {tiles.map((tile, i) => (
              <button
                key={tile.id}
                onClick={() => goTo(i)}
                style={{
                  width: "100%",
                  background: i === activeIndex ? "rgba(255,112,67,0.08)" : "transparent",
                  border: "none",
                  borderBottom: i < tiles.length - 1 ? "1px solid rgba(0,0,0,0.06)" : "none",
                  padding: "13px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <CandidateIcon src={tile.img} alt={tile.title} size={34} />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 800,
                      lineHeight: 1.2,
                      color: i === activeIndex ? ORANGE : "#37474F",
                    }}
                  >
                    {tile.title}
                  </div>
                  <div style={{ fontSize: 12, color: "#78909C", marginTop: 2 }}>Load below</div>
                </div>
                {i === activeIndex ? (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
                    <path
                      d="M4 9L7.5 12.5L14 6"
                      stroke="#FF7043"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div
        ref={trackRef}
        style={{
          display: "flex",
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          msOverflowStyle: "none",
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {tiles.map((tile) => (
          <div
            key={tile.id}
            style={{
              flexShrink: 0,
              width: "100%",
              scrollSnapAlign: "start",
              padding: "0 16px",
              boxSizing: "border-box",
            }}
          >
            <MobileCard
              tile={tile}
              isActive={activeModule === tile.id}
              onSelect={() => setActiveModule(tile.id)}
            />
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 12 }}>
        {tiles.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to ${tiles[i].title}`}
            style={{
              width: i === activeIndex ? 24 : 8,
              height: 8,
              borderRadius: 999,
              background: i === activeIndex ? ORANGE : "rgba(255,112,67,0.25)",
              border: "none",
              padding: 0,
              cursor: "pointer",
              transition: "width 220ms ease, background 220ms ease",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function DesktopCard({ tile, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(tile.id)}
      style={{
        ...WHITE_CARD,
        padding: 18,
        minHeight: 140,
        display: "grid",
        gap: 8,
        width: "100%",
        textAlign: "left",
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <div
          style={{
            fontWeight: 800,
            color: ORANGE,
            fontSize: 18,
            lineHeight: 1.2,
            letterSpacing: "-0.01em",
            textShadow: "0 1px 2px rgba(15,23,42,0.28)",
          }}
        >
          {tile.title}
        </div>
        {tile.note ? (
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: ORANGE,
              textShadow: "0 1px 2px rgba(15,23,42,0.22)",
            }}
          >
            {tile.note}
          </div>
        ) : null}
      </div>

      <div style={{ color: "#546E7A", fontSize: 13, lineHeight: 1.55 }}>{tile.desc}</div>

      <div
        style={{
          marginTop: "auto",
          color: ORANGE,
          fontWeight: 700,
          fontSize: 13,
          lineHeight: 1.2,
          textShadow: "0 1px 2px rgba(15,23,42,0.22)",
        }}
      >
        Open →
      </div>
    </button>
  );
}

export default function CandidateCenterUpdate() {
  const { plan, isEnterprise: planIsEnterprise } = usePlan();
  const dbPlan = String(plan || "").toLowerCase();
  const isEnterprise = planIsEnterprise || dbPlan === "enterprise";

  const isMobile = useIsMobile(1024);
  const greeting = getTimeGreeting();
  const tiles = useMemo(() => buildTiles(isEnterprise), [isEnterprise]);
  const [activeModule, setActiveModule] = useState(null);

  const HeaderBox = (
    <RecruiterTitleCard
      greeting={greeting}
      title="Candidate Center"
      subtitle="Choose the recruiter tool you want to open. Each workspace stays separate and loads inside Candidate Center."
      compact
    />
  );

  const RightColumn = <RightRailPlacementManager slot="right_rail_1" />;
  const activeTile = tiles.find((tile) => tile.id === activeModule) || null;

  if (isMobile === null) {
    return (
      <RecruiterLayout
        title="ForgeTomorrow - Candidate Center Update"
        header={HeaderBox}
        headerCard={false}
        right={RightColumn}
        rightBare
        activeNav="candidate-center"
      />
    );
  }

  return (
    <RecruiterLayout
      title="ForgeTomorrow - Candidate Center Update"
      header={HeaderBox}
      headerCard={false}
      right={isMobile ? null : RightColumn}
      rightBare
      activeNav="candidate-center"
    >
      <section style={{ padding: 0, display: "grid", gap: 12 }}>
        {!activeModule ? (
          <>
            {!isMobile ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 4,
                  gap: 12,
                }}
              >
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: 900,
                    color: ORANGE,
                    lineHeight: 1.25,
                    letterSpacing: "-0.01em",
                    margin: 0,
                    ...ORANGE_HEADING_LIFT,
                  }}
                >
                  Candidate Tools
                </h2>
              </div>
            ) : null}

            <div
              style={{
                ...GLASS,
                paddingTop: 24,
                paddingBottom: 24,
                paddingLeft: isMobile ? 0 : 16,
                paddingRight: isMobile ? 0 : 16,
                width: "100%",
                overflow: isMobile ? "hidden" : "visible",
              }}
            >
              {isMobile ? (
                <MobileCandidateCenter
                  tiles={tiles}
                  activeModule={activeModule}
                  setActiveModule={setActiveModule}
                />
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: GAP,
                  }}
                >
                  {tiles.map((tile) => (
                    <DesktopCard key={tile.id} tile={tile} onOpen={setActiveModule} />
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <WorkspaceModuleShell
            title={activeTile?.title || "Candidate Tool"}
            subtitle={activeTile?.subtitle || ""}
            onBack={() => setActiveModule(null)}
          >
            {(() => {
  switch (activeModule) {
    case "compare":
      return <ExternalCompareModule />;

    default:
      return (
        <ToolFrame
          src={activeTile?.src || "/recruiter/candidate-center"}
          height={isMobile ? "calc(100vh - 320px)" : "calc(100vh - 280px)"}
        />
      );
  }
})()}
          </WorkspaceModuleShell>
        )}
      </section>
    </RecruiterLayout>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}