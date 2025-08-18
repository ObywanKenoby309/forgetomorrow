// components/layouts/PublicLayout.js
import Head from "next/head";
import Header from "../Header";
import Footer from "../Footer";

export default function PublicLayout({
  title = "ForgeTomorrow",
  header,
  left,
  right,
  children,
}) {
  return (
    <>
      <Head><title>{title}</title></Head>
      <Header />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "240px minmax(640px, 1fr) 240px",
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
        {/* LEFT */}
        <aside style={{ gridArea: "left", alignSelf: "start" }}>
          {left}
        </aside>

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

        {/* RIGHT */}
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

      <Footer />
    </>
  );
}
