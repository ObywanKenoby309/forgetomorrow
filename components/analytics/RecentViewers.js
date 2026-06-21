// components/analytics/RecentViewers.js
export default function RecentViewers({ viewers = [], allViewsHref = "#" }) {
  return (
    <section style={{
      border: "1px solid rgba(255,255,255,0.22)",
      background: "rgba(255,255,255,0.32)",
      boxShadow: "0 8px 22px rgba(15,23,42,0.10)",
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      borderRadius: 16,
      padding: 16,
    }}>
      <h2 style={{ color: "#FF7043", marginTop: 0, marginBottom: 12, fontWeight: 700, fontSize: 15 }}>Recent Viewers</h2>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
        {viewers.map((v) => (
          <li key={v.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ fontWeight: 700, color: "#263238" }}>{v.name}</span>
            <span style={{ color: "#607D8B" }}>{v.when}</span>
          </li>
        ))}
      </ul>
      <a href={allViewsHref} style={{ display: "inline-block", marginTop: 12, color: "#FF7043", fontWeight: 700, textDecoration: "none" }}>
        See all viewers →
      </a>
    </section>
  );
}