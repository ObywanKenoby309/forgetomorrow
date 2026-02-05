// pages/anvil.js
import { useState } from "react";
import { useRouter } from "next/router";

import SeekerLayout from "@/components/layouts/SeekerLayout";

import ToolkitLanding from "../components/roadmap/ToolkitLanding";
import ProfileDevelopment from "../components/roadmap/ProfileDevelopment";
import OfferNegotiation from "../components/roadmap/OfferNegotiation";
import OnboardingGrowth from "../components/roadmap/OnboardingGrowth";

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
  // Header (hub style)
  // -----------------------------
  const HeaderBox = (
    <section
      style={{
        background: "white",
        border: "1px solid #eee",
        borderRadius: 12,
        padding: 16,
        boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
        textAlign: "center",
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
        Your workstation for building career signal — profile strength, negotiation readiness,
        and guided growth plans that explain themselves.
      </p>
    </section>
  );

  // -----------------------------
  // Right rail (hub shortcuts + help + ad)
  // -----------------------------
  const RightColumn = (
    <div style={{ display: "grid", gap: 12 }}>
      {/* Shortcuts */}
      {!activeModule && (
        <div
          style={{
            background: "white",
            borderRadius: 10,
            padding: 12,
            display: "grid",
            gap: 8,
            boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
            border: "1px solid #eee",
          }}
        >
          <div style={{ fontWeight: 800, color: "#37474F" }}>Shortcuts</div>

          <a
            href={withChrome("/resume-cover")}
            style={{ color: "#FF7043", fontWeight: 700, textDecoration: "none" }}
          >
            Resume &amp; Cover
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setActiveModule("profile");
            }}
            style={{ color: "#FF7043", fontWeight: 700, textDecoration: "none" }}
          >
            Profile Development
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setActiveModule("offer");
            }}
            style={{ color: "#FF7043", fontWeight: 700, textDecoration: "none" }}
          >
            Offer &amp; Negotiation
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setActiveModule("onboarding");
            }}
            style={{ color: "#FF7043", fontWeight: 700, textDecoration: "none" }}
          >
            Growth &amp; Pivot
          </a>

          <div style={{ marginTop: 6, color: "#607D8B", fontSize: 12, lineHeight: 1.35 }}>
            Note: <strong>Resume &amp; Cover</strong> opens a full page outside The Anvil.
          </div>
        </div>
      )}

      {/* Need help */}
      <div
        style={{
          background: "white",
          borderRadius: 10,
          padding: 12,
          display: "grid",
          gap: 8,
          boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
          border: "1px solid #eee",
        }}
      >
        <div style={{ fontWeight: 800, color: "#37474F" }}>Need help?</div>
        <p style={{ margin: 0, color: "#607D8B", fontSize: 13 }}>
          Use the orange “Need help? Chat with Support” button at the bottom-right of the screen.
        </p>
      </div>

      {/* Page-specific ad slot for The Anvil */}
      <div
        style={{
          background: "white",
          borderRadius: 10,
          padding: 12,
          boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
          border: "1px solid #eee",
        }}
      >
        <div style={{ fontWeight: 800, color: "#37474F", marginBottom: 4 }}>
          Career Programs Spotlight
        </div>
        <p style={{ margin: 0, color: "#607D8B", fontSize: 13 }}>
          Feature your bootcamp, coaching program, or upskilling course alongside The Anvil. Email{" "}
          <a
            href="mailto:sales@forgetomorrow.com"
            style={{ color: "#FF7043", fontWeight: 700 }}
          >
            sales@forgetomorrow.com
          </a>{" "}
          for Anvil placement.
        </p>
      </div>
    </div>
  );

  // -----------------------------
  // Shared tile styles (hub)
  // -----------------------------
  const tileStyle = {
    background: "white",
    borderRadius: 12,
    border: "1px solid #eee",
    boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
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
      {/* Center column content */}
      <div style={{ display: "grid", gap: 12, width: "100%" }}>
        {/* LANDING / HUB */}
        {!activeModule && (
          <>
            {/* Hub tiles */}
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
                  Strengthen how you present your experience — clarity, positioning, and practical next steps.
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

            {/* Keep your existing module chooser (unchanged) */}
            <div
              style={{
                backgroundColor: "white",
                borderRadius: 12,
                border: "1px solid #eee",
                boxShadow: "0 2px 6px rgba(0, 0, 0, 0.06)",
                padding: 24,
                width: "100%",
                display: "grid",
                gap: 16,
                marginTop: 12,
              }}
            >
              <p
                style={{
                  color: "#4A5568",
                  fontSize: "1.05rem",
                  maxWidth: 720,
                  margin: "0 auto",
                  lineHeight: 1.55,
                  fontWeight: 600,
                  textAlign: "center",
                }}
              >
                Use The Anvil to strengthen your professional presence, prepare for compensation
                conversations, and plan realistic growth or career pivots, based on your experience,
                goals, and current market conditions.
              </p>

              {/* Module chooser */}
              <ToolkitLanding onSelectModule={setActiveModule} />

              {/* Usage note */}
              <p
                style={{
                  color: "#718096",
                  fontSize: "0.85rem",
                  maxWidth: 760,
                  margin: "8px auto 0",
                  lineHeight: 1.45,
                  textAlign: "center",
                }}
              >
                <strong>Usage note:</strong> Free plan users receive one personalized Pivot &amp; Growth Roadmap.
                Start by building your resume in{" "}
                <a
                  href={withChrome("/resume-cover")}
                  style={{ color: "#FF7043", fontWeight: 700 }}
                >
                  Resume &amp; Cover
                </a>
                . (This opens a full page outside The Anvil.)
              </p>
            </div>
          </>
        )}

        {/* PROFILE DEVELOPMENT */}
        {activeModule === "profile" && (
          <div
            style={{
              backgroundColor: "white",
              borderRadius: 12,
              border: "1px solid #eee",
              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.06)",
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
              backgroundColor: "white",
              borderRadius: 12,
              border: "1px solid #eee",
              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.06)",
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
              backgroundColor: "white",
              borderRadius: 12,
              border: "1px solid #eee",
              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.06)",
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
    </SeekerLayout>
  );
}
