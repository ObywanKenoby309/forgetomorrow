import React from "react";
import Head from "next/head";

export default function PricingLayout({
  title = "ForgeTomorrow — Pricing",
  header,
  left,
  right,
  children,
}) {
  const hasLeft = Boolean(left);
  const hasRight = Boolean(right);

  return (
    <>
      <Head><title>{title}</title></Head>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: hasLeft
            ? "240px minmax(640px, 1fr) 240px"
            : "minmax(720px, 1fr) 240px",
          gridTemplateRows: "auto 1fr",
          gridTemplateAreas: hasLeft
            ? `"left header right" "left content right"`
            : `"header right" "content right"`,
          gap: 20,
          padding: "30px",
          alignItems: "start",
        }}
      >
        {/* LEFT (optional) */}
        {hasLeft && (
          <aside style={{ gridArea: "left", alignSelf: "start" }}>
            {left}
          </aside>
        )}

        {/* HEADER */}
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

        {/* RIGHT — force black rail */}
        {hasRight && (
          <aside
            style={{
              gridArea: "right",
              alignSelf: "start",
              background: "#000",
              border: "1px solid #222",
              borderRadius: 12,
              padding: 16,
              boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
              minHeight: 120,
              boxSizing: "border-box",
              width: 240,
              minWidth: 240,
              maxWidth: 240,
              minInlineSize: 0,
              color: "#fff",
            }}
          >
            {right}
          </aside>
        )}

        {/* CONTENT */}
        <main style={{ gridArea: "content", minWidth: 0 }}>
          <div style={{ display: "grid", gap: 20, width: "100%", minWidth: 0 }}>
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
