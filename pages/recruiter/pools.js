// pages/recruiter/pools.js
import Link from "next/link";
import RecruiterLayout from "@/components/layouts/RecruiterLayout";

function HeaderBox() {
  return (
    <section
      style={{
        background: "white",
        border: "1px solid #eee",
        borderRadius: 12,
        padding: 16,
        boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
        textAlign: "center",
      }}
    >
      <h1
        style={{
          color: "#FF7043",
          fontSize: 28,
          fontWeight: 800,
          margin: 0,
        }}
      >
        Talent Pools
      </h1>
      <p
        style={{
          marginTop: 8,
          color: "#546E7A",
          fontSize: 14,
        }}
      >
        Save, group, and revisit strong candidates for future roles.
      </p>
    </section>
  );
}

function RightRail() {
  return (
    <div style={{ display: "grid", gap: 12 }}>
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
        <Link href="/recruiter/candidate-center" style={{ color: "#FF7043", fontWeight: 700 }}>
          Candidate Center
        </Link>
        <Link href="/recruiter/candidates" style={{ color: "#FF7043", fontWeight: 700 }}>
          Internal Search
        </Link>
        <Link href="/recruiter/explain" style={{ color: "#FF7043", fontWeight: 700 }}>
          External Compare
        </Link>
      </div>
    </div>
  );
}

export default function RecruiterPools() {
  return (
    <RecruiterLayout
      title="ForgeTomorrow — Talent Pools"
      header={<HeaderBox />}
      right={<RightRail />}
      activeNav="candidate-center"
    >
      <section
        style={{
          background: "white",
          border: "1px solid #eee",
          borderRadius: 14,
          padding: 16,
          boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
        }}
      >
        <div style={{ fontWeight: 900, color: "#37474F", marginBottom: 6 }}>
          Coming online tonight
        </div>
        <p style={{ margin: 0, color: "#607D8B", fontSize: 13, lineHeight: 1.5 }}>
          This is the placeholder surface so the new navigation does not 404. Next we will wire
          real pool creation, saved candidates, and reusable lists.
        </p>

        <div style={{ marginTop: 12 }}>
          <Link href="/recruiter/candidate-center" style={{ color: "#FF7043", fontWeight: 800 }}>
            Back to Candidate Center →
          </Link>
        </div>
      </section>
    </RecruiterLayout>
  );
}
