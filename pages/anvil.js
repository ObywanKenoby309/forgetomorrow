// pages/anvil.js
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/router";

import SeekerLayout from "@/components/layouts/SeekerLayout";
import ProfileDevelopment from "../components/roadmap/ProfileDevelopment";
import OfferNegotiation from "../components/roadmap/OfferNegotiation";
import OnboardingGrowth from "../components/roadmap/OnboardingGrowth";
import RightRailPlacementManager from "@/components/ads/RightRailPlacementManager";

function getChromeFromAsPath(asPath) {
  try {
    const s = String(asPath || "");
    if (!s.includes("chrome=")) return "";
    const qIndex = s.indexOf("?");
    if (qIndex === -1) return "";
    const query = s.slice(qIndex + 1);
    const params = new URLSearchParams(query);
    return String(params.get("chrome") || "").toLowerCase();
  } catch {
    return "";
  }
}

const GLASS = {
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.22)",
  background: "rgba(255,255,255,0.58)",
  boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
};

const GAP = 16;

// Icon component — swap src for your ChatGPT-generated icons when ready
function AnvilIcon({ src, alt, size = 64 }) {
  // Placeholder renders a styled div until real icons are dropped in
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
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
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

// ─── The 4 Anvil tiles ───────────────────────────────────────────────────────
// Set img to your icon paths when ready e.g. '/icons/anvil-resume.png'
const TILES = [
  {
    id: "resume",
    title: "Resume & Cover",
    desc: "Start at the beginning — build your resume, then create a cover letter when you're ready.",
    note: "Opens a full page outside The Anvil.",
    href: null, // handled as external link
    img: null,  // swap to '/icons/anvil-resume.png' when ready
  },
  {
    id: "profile",
    title: "Profile Development",
    desc: "Strengthen how you present your experience — clarity, positioning, and practical next steps.",
    img: null,  // swap to '/icons/anvil-profile.png' when ready
  },
  {
    id: "offer",
    title: "Offer & Negotiation",
    desc: "Prepare for compensation conversations with structure, confidence, and evidence.",
    img: null,  // swap to '/icons/anvil-offer.png' when ready
  },
  {
    id: "onboarding",
    title: "Growth & Pivot",
    desc: "Plan realistic pivots and growth paths based on your goals and current market conditions.",
    img: null,  // swap to '/icons/anvil-growth.png' when ready
  },
];

// ─── Mobile carousel card ────────────────────────────────────────────────────
function MobileCard({ tile, isActive, onSelect, withChrome }) {
  const isLink = tile.id === "resume";

  const cardStyle = {
    display: "block",
    background: "rgba(255,255,255,0.95)",
    borderRadius: 16,
    padding: "22px 20px 20px",
    border: `1.5px solid ${isActive ? "rgba(255,112,67,0.40)" : "rgba(255,112,67,0.15)"}`,
    boxShadow: isActive
      ? "0 12px 28px rgba(0,0,0,0.12), 0 0 0 3px rgba(255,112,67,0.12)"
      : "0 12px 28px rgba(0,0,0,0.10)",
    textDecoration: "none",
    position: "relative",
    overflow: "hidden",
    minHeight: 210,
    cursor: "pointer",
    width: "100%",
    textAlign: "left",
    transition: "border-color 200ms ease, box-shadow 200ms ease",
  };

  const inner = (
    <>
      {/* Corner glow */}
      <div aria-hidden="true" style={{
        position: "absolute", right: -70, top: -70, width: 200, height: 200,
        background: "radial-gradient(circle, rgba(255,112,67,0.18), rgba(255,112,67,0.00) 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
        <AnvilIcon src={tile.img} alt={tile.title} size={64} />
        <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0, color: "#FF7043", lineHeight: 1.1 }}>
          {tile.title}
        </h2>
      </div>

      <p style={{ color: "#37474F", margin: "0 0 14px", lineHeight: 1.55, fontSize: 15 }}>
        {tile.desc}
      </p>

      {tile.note && (
        <p style={{ color: "#90A4AE", fontSize: 12, margin: "0 0 14px", fontStyle: "italic" }}>
          {tile.note}
        </p>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#FF7043",
          display: "flex", alignItems: "center", gap: 4 }}>
          {isLink ? "Open" : isActive ? "Selected" : "Select"}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8H13M13 8L9 4M13 8L9 12"
              stroke="#FF7043" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </>
  );

  if (isLink) {
    return <a href={withChrome("/resume-cover")} style={cardStyle}>{inner}</a>;
  }

  return (
    <button onClick={onSelect} style={{ ...cardStyle, border: cardStyle.border }}>
      {inner}
    </button>
  );
}

// ─── Mobile layout: dropdown + carousel + inline content ────────────────────
function MobileAnvil({ tiles, activeModule, setActiveModule, withChrome }) {
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

  // Scroll hint — shows when a module is activated, auto-hides after 3s
  const [showScrollHint, setShowScrollHint] = useState(false);
  const hintTimer = useRef(null);

  const handleCardSelect = (tile) => {
    if (tile.id === "resume") return;
    const next = tile.id === activeModule ? null : tile.id;
    setActiveModule(next);
    if (next) {
      setShowScrollHint(true);
      clearTimeout(hintTimer.current);
      hintTimer.current = setTimeout(() => setShowScrollHint(false), 3000);
    }
  };

  useEffect(() => () => clearTimeout(hintTimer.current), []);

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
            <AnvilIcon src={active.img} alt={active.title} size={28} />
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
                  width: "100%", background: i === activeIndex ? "rgba(255,112,67,0.08)" : "transparent",
                  border: "none", borderBottom: i < tiles.length - 1 ? "1px solid rgba(0,0,0,0.06)" : "none",
                  padding: "13px 16px", display: "flex", alignItems: "center",
                  gap: 12, cursor: "pointer", textAlign: "left",
                }}
              >
                <AnvilIcon src={tile.img} alt={tile.title} size={34} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.2,
                    color: i === activeIndex ? "#FF7043" : "#37474F" }}>
                    {tile.title}
                  </div>
                  <div style={{ fontSize: 12, color: "#78909C", marginTop: 2 }}>
                    {tile.id === "resume" ? "External page" : "Load below"}
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
        {tiles.map((tile, i) => (
          <div key={tile.id} style={{
            flexShrink: 0, width: "100%", scrollSnapAlign: "start",
            padding: "0 16px", boxSizing: "border-box",
          }}>
            <MobileCard
              tile={tile}
              isActive={activeModule === tile.id}
              onSelect={() => handleCardSelect(tile)}
              withChrome={withChrome}
            />
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

      {/* ── Scroll hint — mobile only, auto-hides after 3s ── */}
      {showScrollHint && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          padding: "10px 16px", marginTop: 8,
          animation: "fadeInOut 3s ease forwards",
        }}>
          <style>{`
            @keyframes fadeInOut {
              0%   { opacity: 0; transform: translateY(-4px); }
              15%  { opacity: 1; transform: translateY(0); }
              70%  { opacity: 1; }
              100% { opacity: 0; }
            }
          `}</style>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ animation: "bounce 1s ease infinite" }}>
            <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(3px)} }`}</style>
            <path d="M8 3v10M8 13l-3-3M8 13l3-3" stroke="#FF7043" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#FF7043" }}>
            Scroll down to see your selection
          </span>
        </div>
      )}

      {/* ── Inline module content (loads below carousel, no back button — use carousel to switch) ── */}
      {activeModule && activeModule !== "resume" && (
        <div style={{ ...GLASS, margin: "16px 16px 0", padding: 24, display: "grid", gap: 16 }}>
          {activeModule === "profile" && (
            <ProfileDevelopment onNext={() => setActiveModule("offer")} setActiveModule={setActiveModule} />
          )}
          {activeModule === "offer" && (
            <OfferNegotiation onNext={() => setActiveModule("onboarding")} setActiveModule={setActiveModule} />
          )}
          {activeModule === "onboarding" && (
            <OnboardingGrowth onNext={() => setActiveModule(null)} setActiveModule={setActiveModule} />
          )}
        </div>
      )}

    </div>
  );
}

// ─── Desktop tile (unchanged from original) ──────────────────────────────────
function DesktopTile({ tile, onOpen, withChrome }) {
  const tileStyle = {
    ...GLASS, padding: 16, display: "grid", gap: 8, minHeight: 106,
  };
  const titleStyle = { margin: 0, color: "#37474F", fontSize: 16, fontWeight: 900 };
  const descStyle = { margin: 0, color: "#607D8B", fontSize: 13, lineHeight: 1.4 };
  const linkStyle = {
    color: "#FF7043", fontWeight: 800, textDecoration: "none",
    display: "inline-flex", alignItems: "center", gap: 6, width: "fit-content",
  };

  return (
    <div style={tileStyle}>
      <h2 style={titleStyle}>{tile.title}</h2>
      <p style={descStyle}>{tile.desc}</p>
      {tile.note && (
        <div style={{ color: "#607D8B", fontSize: 12, lineHeight: 1.35 }}>
          <strong>{tile.note}</strong>
        </div>
      )}
      {tile.id === "resume" ? (
        <a href={withChrome("/resume-cover")} style={linkStyle}>Open →</a>
      ) : (
        <a href="#" onClick={(e) => { e.preventDefault(); onOpen(tile.id); }} style={linkStyle}>
          Open →
        </a>
      )}
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function AnvilPage() {
  const [activeModule, setActiveModule] = useState(null);
  const router = useRouter();

  const chrome =
    String(router.query.chrome || "").toLowerCase() ||
    getChromeFromAsPath(router.asPath);

  const withChrome = (path) =>
    chrome ? `${path}${path.includes("?") ? "&" : "?"}chrome=${chrome}` : path;

  const activeNav = "anvil";

  // JS-driven mobile detection — same pattern as SeekerLayout + HearthCenter
  const [isMobile, setIsMobile] = useState(true);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const HeaderBox = (
    <section style={{ ...GLASS, padding: "24px 16px", textAlign: "center",
      margin: "0 auto", maxWidth: 1320 }} aria-label="The Anvil overview">
      <h1 style={{ color: "#FF7043", fontSize: 28, fontWeight: 900, margin: 0 }}>
        The Anvil
      </h1>
      <p style={{ marginTop: 8, color: "#546E7A", fontSize: 14, fontWeight: 600,
        maxWidth: 860, marginLeft: "auto", marginRight: "auto" }}>
        Your workstation for building career signal — profile strength, negotiation readiness,
        and guided growth plans that explain themselves.
      </p>
    </section>
  );

  const RightColumn = (
    <aside style={{ ...GLASS, padding: 16, boxSizing: "border-box",
      display: "flex", flexDirection: "column", gap: GAP, alignSelf: "stretch" }}>
      <div style={{ minHeight: 160, width: "100%" }}>
        <RightRailPlacementManager slot="right_rail_1" />
      </div>
    </aside>
  );

  return (
    <SeekerLayout
      title="The Anvil | ForgeTomorrow"
      header={HeaderBox}
      right={RightColumn}
      activeNav={activeNav}
    >
      <div style={{
        ...GLASS,
        // Same JS-driven padding pattern as HearthCenter
        paddingTop: 24,
        paddingBottom: 24,
        paddingLeft: isMobile ? 0 : 16,
        paddingRight: isMobile ? 0 : 16,
        width: "100%",
        overflow: isMobile ? "hidden" : "visible",
      }}>

        {/* ── MOBILE: dropdown + carousel + inline content ── */}
        {isMobile && (
          <MobileAnvil
            tiles={TILES}
            activeModule={activeModule}
            setActiveModule={setActiveModule}
            withChrome={withChrome}
          />
        )}

        {/* ── DESKTOP: original 2×2 grid + inline module swap ── */}
        {!isMobile && (
          <div style={{ display: "grid", gap: 12, width: "100%" }}>
            {!activeModule && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
                {TILES.map((tile) => (
                  <DesktopTile key={tile.id} tile={tile} onOpen={setActiveModule} withChrome={withChrome} />
                ))}
              </div>
            )}

            {activeModule === "profile" && (
              <div style={{ ...GLASS, padding: 24, width: "100%", display: "grid", gap: 16 }}>
                <button onClick={() => setActiveModule(null)}
                  style={{ marginBottom: 8, fontSize: "0.875rem", color: "#FF7043",
                    textDecoration: "underline", background: "none", border: "none",
                    cursor: "pointer", textAlign: "left", width: "fit-content", fontWeight: 800 }}>
                  Back to The Anvil
                </button>
                <ProfileDevelopment onNext={() => setActiveModule("offer")} setActiveModule={setActiveModule} />
              </div>
            )}

            {activeModule === "offer" && (
              <div style={{ ...GLASS, padding: 24, width: "100%", display: "grid", gap: 16 }}>
                <button onClick={() => setActiveModule(null)}
                  style={{ marginBottom: 8, fontSize: "0.875rem", color: "#FF7043",
                    textDecoration: "underline", background: "none", border: "none",
                    cursor: "pointer", textAlign: "left", width: "fit-content", fontWeight: 800 }}>
                  Back to The Anvil
                </button>
                <OfferNegotiation onNext={() => setActiveModule("onboarding")} setActiveModule={setActiveModule} />
              </div>
            )}

            {activeModule === "onboarding" && (
              <div style={{ ...GLASS, padding: 24, width: "100%", display: "grid", gap: 16 }}>
                <button onClick={() => setActiveModule(null)}
                  style={{ marginBottom: 8, fontSize: "0.875rem", color: "#FF7043",
                    textDecoration: "underline", background: "none", border: "none",
                    cursor: "pointer", textAlign: "left", width: "fit-content", fontWeight: 800 }}>
                  Back to The Anvil
                </button>
                <OnboardingGrowth onNext={() => setActiveModule(null)} setActiveModule={setActiveModule} />
              </div>
            )}
          </div>
        )}

      </div>
    </SeekerLayout>
  );
}