// components/layouts/RecruiterLayout.js
import React from "react";
import Head from "next/head";
import RecruiterHeader from "@/components/recruiter/RecruiterHeader";
import RecruiterSidebar from "@/components/recruiter/RecruiterSidebar";

export default function RecruiterLayout({
  title = "ForgeTomorrow — Recruiter",
  header,
  right,
  children,
  headerCard = true,
  role = "recruiter",
  variant = "smb",
  counts,
  initialOpen,
  activeNav = "dashboard",
}) {
  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>

      <RecruiterHeader />

      {/* Desktop grid stays intact — mobile overrides at bottom */}
      <div
        className="recruiter-grid-wrapper"
        style={{
          display: "grid",
          gridTemplateColumns: "240px minmax(640px,1fr) 240px",
          gridTemplateRows: "auto 1fr",
          gridTemplateAreas: `
            "left header right"
            "left content right"
          `,
          gap: 20,
          padding: "30px",
          alignItems: "start",
        }}
      >
        {/* LEFT — Sidebar */}
        <aside style={{ gridArea: "left", alignSelf: "start" }}>
          <RecruiterSidebar
            active={activeNav}
            role={role}
            variant={variant}
            counts={counts}
            initialOpen={initialOpen}
          />
        </aside>

        {/* CENTER HEADER */}
        {headerCard ? (
          <section
            style={{
              gridArea: "header",
              background: "white",
              borderRadius: 12,
              padding: "8px 16px",
              border: "1px solid #eee",
              boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
              minWidth: 0,
            }}
          >
            {header}
          </section>
        ) : (
          <header
            style={{
              gridArea: "header",
              alignSelf: "start",
              marginTop: 0,
              paddingTop: 0,
              minWidth: 0,
            }}
          >
            {header}
          </header>
        )}

        {/* RIGHT RAIL */}
        <aside
          style={{
            gridArea: "right",
            alignSelf: "start",
            background: "#2a2a2a",
            border: "1px solid #3a3a3a",
            borderRadius: 12,
            padding: 16,
            boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
            minHeight: 120,
            boxSizing: "border-box",
            width: 240,
            minWidth: 240,
            maxWidth: 240,
            minInlineSize: 0,
          }}
        >
          {right}
        </aside>

        {/* CONTENT */}
        <main style={{ gridArea: "content", minWidth: 0 }}>
          <div style={{ display: "grid", gap: 20, width: "100%", minWidth: 0 }}>
            {children}
          </div>
        </main>
      </div>

      {/* ❗ MOBILE ONLY — Fix layout overflow, stacking, header height */}
      <style jsx>{`
        @media (max-width: 1024px) {
          .recruiter-grid-wrapper {
            display: flex !important;
            flex-direction: column !important;
            padding: 16px !important;
            gap: 16px !important;
          }

          .recruiter-grid-wrapper aside {
            width: 100% !important;
            max-width: 100% !important;
          }

          .recruiter-grid-wrapper section,
          .recruiter-grid-wrapper header {
            width: 100% !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </>
  );
}
