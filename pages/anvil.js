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

  // Title card (SeekerLayout expects `header` content like seeker-dashboard)
  const HeaderBox = (
    <section
      aria-label="The Anvil overview"
      className="bg-white border border-gray-200 rounded-xl p-6 text-center shadow-sm"
    >
      <h1 className="text-2xl md:text-3xl font-bold text-orange-600">The Anvil</h1>
      <p className="text-sm md:text-base text-gray-600 mt-2 max-w-3xl mx-auto">
        Your workstation for building career signal — profile strength, negotiation readiness,
        and guided growth plans that explain themselves.
      </p>
    </section>
  );

  const RightColumn = (
    <div style={{ display: "grid", gap: 12 }}>
      {/* Page-specific ad slot for The Anvil */}
      <div
        style={{
          background: "white",
          borderRadius: 10,
          padding: 12,
          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.06)",
          border: "1px solid #eee",
        }}
      >
        <div style={{ fontWeight: 800, color: "#37474F", marginBottom: 4 }}>
          Career Programs Spotlight
        </div>
        <p style={{ margin: 0, color: "#607D8B", fontSize: 13 }}>
          Feature your bootcamp, coaching program, or upskilling course alongside The
          Anvil. Email{" "}
          <a
            href="mailto:sales@forgetomorrow.com"
            style={{ color: "#FF7043", fontWeight: 600 }}
          >
            sales@forgetomorrow.com
          </a>{" "}
          for Anvil placement.
        </p>
      </div>
    </div>
  );

  return (
    <SeekerLayout
      title="The Anvil | ForgeTomorrow"
      header={HeaderBox}
      right={RightColumn}
      activeNav={activeNav}
    >
      {/* Center column content */}
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
        {/* LANDING / HUB */}
        {!activeModule && (
          <>
            {/* Module chooser (hub cards) */}
            <ToolkitLanding onSelectModule={setActiveModule} />

            {/* Usage note (keep it short + consistent with hub behavior) */}
            <p
              style={{
                color: "#718096",
                fontSize: "0.85rem",
                maxWidth: 820,
                margin: "4px auto 0",
                lineHeight: 1.45,
                textAlign: "center",
              }}
            >
              Start at the beginning in{" "}
              <a
                href={withChrome("/resume-cover")}
                style={{ color: "#FF7043", fontWeight: 700 }}
              >
                Resume &amp; Cover
              </a>
              . (This opens a full page outside The Anvil.)
            </p>
          </>
        )}

        {/* PROFILE DEVELOPMENT */}
        {activeModule === "profile" && (
          <>
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
              }}
            >
              Back to The Anvil
            </button>
            <ProfileDevelopment
              onNext={() => setActiveModule("offer")}
              setActiveModule={setActiveModule}
            />
          </>
        )}

        {/* OFFER NEGOTIATION */}
        {activeModule === "offer" && (
          <>
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
              }}
            >
              Back to The Anvil
            </button>
            <OfferNegotiation
              onNext={() => setActiveModule("onboarding")}
              setActiveModule={setActiveModule}
            />
          </>
        )}

        {/* PLAN GROWTH & PIVOTS */}
        {activeModule === "onboarding" && (
          <>
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
              }}
            >
              Back to The Anvil
            </button>
            <OnboardingGrowth
              onNext={() => setActiveModule(null)}
              setActiveModule={setActiveModule}
            />
          </>
        )}
      </div>
    </SeekerLayout>
  );
}
