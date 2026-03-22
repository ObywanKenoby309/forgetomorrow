// pages/recruiter/candidate-center.js
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import RecruiterLayout from "@/components/layouts/RecruiterLayout";
import RightRailPlacementManager from "@/components/ads/RightRailPlacementManager";
import { usePlan } from "@/context/PlanContext";

// ─── Shared styles ────────────────────────────────────────────────────────────
const GLASS = {
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.22)",
  background: "rgba(255,255,255,0.58)",
  boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
};

const ORANGE = "#FF7043";
const MUTED = "#64748B";

// ─── SSR-safe mobile hook ─────────────────────────────────────────────────────
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

// ─── Icon placeholder — swap src when ChatGPT icons are ready ────────────────
function CandidateIcon({ src, alt, size = 64 }) {
  if (!src) {
    return (
      <div style={{
        width: size, height: size, borderRadius: 12,
        background: "rgba(255,112,67,0.10)",
        border: "1px solid rgba(255,112,67,0.20)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <svg width={size * 0.45} height={size * 0.45} viewBox="0 0 24 24" fill="none">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
            stroke="#FF7043" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="9" cy="7" r="4"
            stroke="#FF7043" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
            stroke="#FF7043" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }
  return (
    <img src={src} alt={alt}
      style={{ width: size, height: size, objectFit: "contain", flexShrink: 0,
        filter: "drop-shadow(0 2px 5px rgba(0,0,0,0.18))" }}
      loading="lazy" decoding="async"
    />
  );
}

// ─── Tiles config ─────────────────────────────────────────────────────────────
// Set img to your icon paths when ready e.g. '/icons/candidate-search.png'
const buildTiles = (isEnterprise) => [
  {
    id: "search",
    title: "Internal Search",
    desc: "Search and automate discovery of candidates already on ForgeTomorrow.",
    href: "/recruiter/candidates",
    img: null, // swap to '/icons/candidate-search.png' when ready
  },
  {
    id: "compare",
    title: "External Compare",
    desc: "Paste any resume and job description to generate an evidence-backed comparison — even outside ForgeTomorrow.",
    href: "/recruiter/explain",
    img: null, // swap to '/icons/candidate-compare.png' when ready
  },
  {
    id: "pools",
    title: "Talent Pools",
    desc: "Organize strong candidates into pools you can revisit and reuse across roles.",
    href: "/recruiter/pools",
    note: isEnterprise ? "" : "Available tonight",
    img: null, // swap to '/icons/candidate-pools.png' when ready
  },
];

// ─── Mobile carousel card ─────────────────────────────────────────────────────
function MobileCard({ tile }) {
  const cardStyle = {
    display: "block",
    background: "rgba(255,255,255,0.95)",
    borderRadius: 16,
    padding: "22px 20px 20px",
    border: "1.5px solid rgba(255,112,67,0.15)",
    boxShadow: "0 12px 28px rgba(0,0,0,0.10)",
    textDecoration: "none",
    position: "relative",
    overflow: "hidden",
    minHeight: 210,
    width: "100%",
    textAlign: "left",
    color: "inherit",
    transition: "border-color 200ms ease, box-shadow 200ms ease",
  };

  return (
    <Link href={tile.href} style={cardStyle}>
      {/* Corner glow */}
      <div aria-hidden="true" style={{
        position: "absolute", right: -70, top: -70, width: 200, height: 200,
        background: "radial-gradient(circle, rgba(255,112,67,0.18), rgba(255,112,67,0.00) 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
        <CandidateIcon src={tile.img} alt={tile.title} size={64} />
        <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0, color: "#FF7043", lineHeight: 1.1 }}>
          {tile.title}
        </h2>
      </div>

      <p style={{ color: "#37474F", margin: "0 0 14px", lineHeight: 1.55, fontSize: 15 }}>
        {tile.desc}
      </p>

      {tile.note && (
        <p style={{ color: "#FF7043", fontSize: 12, margin: "0 0 14px",
          fontWeight: 800, fontStyle: "italic" }}>
          {tile.note}
        </p>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
        <span style={{ fontSize: 15, fontWeight: 900, color: "#FF7043",
          display: "flex", alignItems: "center", gap: 4 }}>
          Open
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8H13M13 8L9 4M13 8L9 12"
              stroke="#FF7043" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </Link>
  );
}

// ─── Mobile layout: dropdown + carousel ──────────────────────────────────────
function MobileCandidateCenter({ tiles }) {
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

  return (
    <div style={{ position: "relative" }}>

      {/* ── Dropdown ── */}
      <div style={{ padding: "0 16px 14px", position: "relative", zIndex: 20 }}>
        <button
          onClick={() => setDropdownOpen((o) => !o)}
          style={{
            width: "100%", background: "rgba(255,255,255,0.95)",
            border: "1.5px solid rgba(255,112,67,0.35)", borderRadius: 12,
            padding: "13px 16px", display: "flex", alignItems: "center",
            justifyContent: "space-between", cursor: "pointer",
            boxShadow: "0 4px 14px rgba(0,0,0,0.08)", gap: 10, boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <CandidateIcon src={active.img} alt={active.title} size={28} />
            <span style={{ fontSize: 16, fontWeight: 800, color: "#FF7043" }}>
              {active.title}
            </span>
          </div>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
            style={{ flexShrink: 0, transition: "transform 200ms ease",
              transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
            <path d="M5 7.5L10 12.5L15 7.5" stroke="#FF7043" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {dropdownOpen && (
          <div style={{
            position: "absolute", top: "calc(100% - 14px + 6px)", left: 16, right: 16,
            background: "rgba(255,255,255,0.98)", border: "1.5px solid rgba(255,112,67,0.20)",
            borderRadius: 12, overflow: "hidden", boxShadow: "0 20px 48px rgba(0,0,0,0.16)",
            backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
          }}>
            {tiles.map((tile, i) => (
              <button key={tile.id} onClick={() => goTo(i)}
                style={{
                  width: "100%",
                  background: i === activeIndex ? "rgba(255,112,67,0.08)" : "transparent",
                  border: "none",
                  borderBottom: i < tiles.length - 1 ? "1px solid rgba(0,0,0,0.06)" : "none",
                  padding: "13px 16px", display: "flex", alignItems: "center",
                  gap: 12, cursor: "pointer", textAlign: "left",
                }}
              >
                <CandidateIcon src={tile.img} alt={tile.title} size={34} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.2,
                    color: i === activeIndex ? "#FF7043" : "#37474F" }}>
                    {tile.title}
                  </div>
                  <div style={{ fontSize: 12, color: "#78909C", marginTop: 2 }}>
                    Opens page
                  </div>
                </div>
                {i === activeIndex && (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
                    <path d="M4 9L7.5 12.5L14 6" stroke="#FF7043" strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Carousel ── */}
      <div ref={trackRef} style={{
        display: "flex", overflowX: "auto", scrollSnapType: "x mandatory",
        msOverflowStyle: "none", scrollbarWidth: "none", WebkitOverflowScrolling: "touch",
      }}>
        {tiles.map((tile) => (
          <div key={tile.id} style={{
            flexShrink: 0, width: "100%", scrollSnapAlign: "start",
            padding: "0 16px", boxSizing: "border-box",
          }}>
            <MobileCard tile={tile} />
          </div>
        ))}
      </div>

      {/* ── Dot indicators ── */}
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 12 }}>
        {tiles.map((_, i) => (
          <button key={i} onClick={() => goTo(i)} aria-label={`Go to ${tiles[i].title}`}
            style={{
              width: i === activeIndex ? 24 : 8, height: 8, borderRadius: 999,
              background: i === activeIndex ? "#FF7043" : "rgba(255,112,67,0.25)",
              border: "none", padding: 0, cursor: "pointer",
              transition: "width 220ms ease, background 220ms ease",
            }}
          />
        ))}
      </div>

    </div>
  );
}

// ─── Desktop hub card (original behavior) ────────────────────────────────────
function DesktopCard({ tile }) {
  return (
    <Link href={tile.href} style={{
      ...GLASS,
      padding: 16, display: "grid", gap: 8, minHeight: 120,
      textDecoration: "none", color: "inherit",
      transition: "box-shadow 200ms ease, border-color 200ms ease",
    }}>
      <div style={{ display: "flex", alignItems: "baseline",
        justifyContent: "space-between", gap: 12 }}>
        <div style={{ fontWeight: 900, color: "#37474F", fontSize: 16 }}>{tile.title}</div>
        {tile.note ? (
          <div style={{ fontSize: 12, fontWeight: 800, color: "#FF7043" }}>{tile.note}</div>
        ) : null}
      </div>
      <div style={{ color: "#607D8B", fontSize: 13, lineHeight: 1.45 }}>{tile.desc}</div>
      <div style={{ marginTop: "auto", color: "#FF7043", fontWeight: 800, fontSize: 13 }}>
        Open →
      </div>
    </Link>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CandidateCenter() {
  const { plan, isEnterprise: planIsEnterprise } = usePlan();
  const dbPlan = String(plan || "").toLowerCase();
  const isEnterprise = planIsEnterprise || dbPlan === "enterprise";

  const isMobile = useIsMobile(1024);
  const tiles = buildTiles(isEnterprise);

  const HeaderBox = (
    <section style={{ ...GLASS, borderRadius: 18, padding: 16, textAlign: "center" }}>
      <div style={{ fontSize: 24, fontWeight: 900, color: ORANGE }}>
        Candidate Center
      </div>
      <div style={{ fontSize: 14, color: MUTED, marginTop: 6 }}>
        Internal search, external comparisons, and talent pools — all in one place.
      </div>
    </section>
  );

  const RightColumn = (
    <div style={{ minHeight: 160, width: "100%" }}>
      <RightRailPlacementManager slot="right_rail_1" />
    </div>
  );

  // Render nothing until client measures viewport — prevents hydration stacking
  if (isMobile === null) {
    return (
      <RecruiterLayout
        title="ForgeTomorrow — Candidate Center"
        header={HeaderBox}
        headerCard={false}
        right={RightColumn}
        activeNav="candidate-center"
      />
    );
  }

  // ── MOBILE ────────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <RecruiterLayout
        title="ForgeTomorrow — Candidate Center"
        header={HeaderBox}
        headerCard={false}
        right={null}
        activeNav="candidate-center"
      >
        <div style={{
          ...GLASS,
          paddingTop: 24,
          paddingBottom: 24,
          paddingLeft: 0,
          paddingRight: 0,
          width: "100%",
          overflow: "hidden",
        }}>
          <MobileCandidateCenter tiles={tiles} />
        </div>
      </RecruiterLayout>
    );
  }

  // ── DESKTOP ───────────────────────────────────────────────────────────────
  return (
    <RecruiterLayout
      title="ForgeTomorrow — Candidate Center"
      header={HeaderBox}
      headerCard={false}
      right={RightColumn}
      activeNav="candidate-center"
    >
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: 12,
      }}>
        {tiles.map((tile) => (
          <DesktopCard key={tile.id} tile={tile} />
        ))}
      </div>
    </RecruiterLayout>
  );
}

// Prevents static prerendering — required for pages using client-side state
export async function getServerSideProps() {
  return { props: {} };
}