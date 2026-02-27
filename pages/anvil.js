// pages/anvil.js
import { useState } from "react";
import { useRouter } from "next/router";

import SeekerLayout from "@/components/layouts/SeekerLayout";

import ProfileDevelopment from "../components/roadmap/ProfileDevelopment";
import OfferNegotiation from "../components/roadmap/OfferNegotiation";
import OnboardingGrowth from "../components/roadmap/OnboardingGrowth";

// ✅ Ads (DB-backed placements)
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

export default function AnvilPage() {
  const [activeModule, setActiveModule] = useState(null);

  const router = useRouter();

  // IMPORTANT: router.query can be empty on first render.
  // Use asPath fallback so we never lose chrome context.
  const chrome =
    String(router.query.chrome || "").toLowerCase() ||
    getChromeFromAsPath(router.asPath);

  const withChrome = (path) =>
    chrome ? `${path}${path.includes("?") ? "&" : "?"}chrome=${chrome}` : path;

  // Match seeker-dashboard behavior: SeekerLayout stays, chrome only influences wrappers/nav.
  const chromeKey = chrome || "seeker";
  const activeNav =
    chromeKey === "coach" || chromeKey.startsWith("recruiter") ? "anvil" : "anvil";

  // -----------------------------
  // Shared GLASS (match Feed / profile-standard)
  // -----------------------------
  const GLASS = {
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.22)",
    background: "rgba(255,255,255,0.58)",
    boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
  };

  // -----------------------------
  // Header (hub style) - glass
  // -----------------------------
  const HeaderBox = (
    <section
      style={{
        ...GLASS,
        padding: "24px 16px",
        textAlign: "center",

        // keep centered header like other pages
        margin: "0 auto",
        maxWidth: 1320,
      }}
      aria-label="The Anvil overview"
    >
      <h1
        style={{
          color: "#FF7043",
          fontSize: 28,
          fontWeight: 900,
          margin: 0,
        }}
      >
        The Anvil
      </h1>
      <p
        style={{
          marginTop: 8,
          color: "#546E7A",
          fontSize: 14,
          fontWeight: 600,
          maxWidth: 860,
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        Your workstation for building career signal - profile strength, negotiation readiness,
        and guided growth plans that explain themselves.
      </p>
    </section>
  );

  // -----------------------------
  // Right rail (ONLY ad slot - everything else removed)
  // -----------------------------
  const RightColumn = (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ ...GLASS, padding: 16 }}>
        <RightRailPlacementManager slot="right_rail_1" />
      </div>
    </div>
  );

  // -----------------------------
  // Shared tile styles (hub) - glass
  // -----------------------------
  const tileStyle = {
    ...GLASS,
    padding: 16,
    display: "grid",
    gap: 8,
    minHeight: 106,
  };

  const tileTitleStyle = { margin: 0, color: "#37474F", fontSize: 16, fontWeight: 900 };
  const tileDescStyle = { margin: 0, color: "#607D8B", fontSize: 13, lineHeight: 1.4 };

  const openLinkStyle = {
    color: "#FF7043",
    fontWeight: 800,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    width: "fit-content",
  };

  return (
    <SeekerLayout
      title="The Anvil | ForgeTomorrow"
      header={HeaderBox}
      right={RightColumn}
      activeNav={activeNav}
    >
      <div
        style={{
          ...GLASS,
          padding: "24px 16px",
          width: "100%",
          margin: "24px 0 0",
        }}
      >
        <div style={{ display: "grid", gap: 12, width: "100%" }}>
          {/* HUB ONLY (no old bottom box) */}
          {!activeModule && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 12,
              }}
            >
              {/* Resume & Cover (Creator) */}
              <div style={tileStyle}>
                <h2 style={tileTitleStyle}>Resume &amp; Cover</h2>
                <p style={tileDescStyle}>
                  Start at the beginning and build your resume, then create a cover letter when you’re ready.
                </p>
                <div style={{ color: "#607D8B", fontSize: 12, lineHeight: 1.35 }}>
                  <strong>Opens a full page outside The Anvil.</strong>
                </div>
                <a href={withChrome("/resume-cover")} style={openLinkStyle}>
                  Open →
                </a>
              </div>

              {/* Profile Development */}
              <div style={tileStyle}>
                <h2 style={tileTitleStyle}>Profile Development</h2>
                <p style={tileDescStyle}>
                  Strengthen how you present your experience - clarity, positioning, and practical next steps.
                </p>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveModule("profile");
                  }}
                  style={openLinkStyle}
                >
                  Open →
                </a>
              </div>

              {/* Offer & Negotiation */}
              <div style={tileStyle}>
                <h2 style={tileTitleStyle}>Offer &amp; Negotiation</h2>
                <p style={tileDescStyle}>
                  Prepare for compensation conversations with structure, confidence, and evidence.
                </p>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveModule("offer");
                  }}
                  style={openLinkStyle}
                >
                  Open →
                </a>
              </div>

              {/* Growth & Pivot */}
              <div style={tileStyle}>
                <h2 style={tileTitleStyle}>Growth &amp; Pivot</h2>
                <p style={tileDescStyle}>
                  Plan realistic pivots and growth paths based on your goals and current market conditions.
                </p>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveModule("onboarding");
                  }}
                  style={openLinkStyle}
                >
                  Open →
                </a>
              </div>
            </div>
          )}

          {/* PROFILE DEVELOPMENT */}
          {activeModule === "profile" && (
            <div
              style={{
                ...GLASS,
                padding: 24,
                width: "100%",
                display: "grid",
                gap: 16,
              }}
            >
              <button
                onClick={() => setActiveModule(null)}
                style={{
                  marginBottom: 8,
                  fontSize: "0.875rem",
                  color: "#FF7043",
                  textDecoration: "underline",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  width: "fit-content",
                  fontWeight: 800,
                }}
              >
                Back to The Anvil
              </button>
              <ProfileDevelopment
                onNext={() => setActiveModule("offer")}
                setActiveModule={setActiveModule}
              />
            </div>
          )}

          {/* OFFER NEGOTIATION */}
          {activeModule === "offer" && (
            <div
              style={{
                ...GLASS,
                padding: 24,
                width: "100%",
                display: "grid",
                gap: 16,
              }}
            >
              <button
                onClick={() => setActiveModule(null)}
                style={{
                  marginBottom: 8,
                  fontSize: "0.875rem",
                  color: "#FF7043",
                  textDecoration: "underline",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  width: "fit-content",
                  fontWeight: 800,
                }}
              >
                Back to The Anvil
              </button>
              <OfferNegotiation
                onNext={() => setActiveModule("onboarding")}
                setActiveModule={setActiveModule}
              />
            </div>
          )}

          {/* PLAN GROWTH & PIVOTS */}
          {activeModule === "onboarding" && (
            <div
              style={{
                ...GLASS,
                padding: 24,
                width: "100%",
                display: "grid",
                gap: 16,
              }}
            >
              <button
                onClick={() => setActiveModule(null)}
                style={{
                  marginBottom: 8,
                  fontSize: "0.875rem",
                  color: "#FF7043",
                  textDecoration: "underline",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  width: "fit-content",
                  fontWeight: 800,
                }}
              >
                Back to The Anvil
              </button>
              <OnboardingGrowth
                onNext={() => setActiveModule(null)}
                setActiveModule={setActiveModule}
              />
            </div>
          )}
        </div>
      </div>
    </SeekerLayout>
  );
}