// pages/recruiter/candidate-center.js
import Link from "next/link";
import RecruiterLayout from "@/components/layouts/RecruiterLayout";
import { usePlan } from "@/context/PlanContext";

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
        Candidate Center
      </h1>
      <p
        style={{
          marginTop: 8,
          color: "#546E7A",
          fontSize: 14,
        }}
      >
        Internal search, external comparisons, and talent pools - all in one place.
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
        <Link href="/recruiter/candidates" style={{ color: "#FF7043", fontWeight: 700 }}>
          Internal Search
        </Link>
        <Link href="/recruiter/explain" style={{ color: "#FF7043", fontWeight: 700 }}>
          External Compare
        </Link>
        <Link href="/recruiter/pools" style={{ color: "#FF7043", fontWeight: 700 }}>
          Talent Pools
        </Link>
      </div>

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
          Need help?
        </div>
        <p style={{ margin: 0, color: "#607D8B", fontSize: 13 }}>
          Use the orange “Need help? Chat with Support” button at the bottom-right of the screen.
        </p>
      </div>
    </div>
  );
}

function HubCard({ title, description, href, note }) {
  return (
    <Link
      href={href}
      style={{
        background: "white",
        borderRadius: 14,
        padding: 16,
        boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
        border: "1px solid #eee",
        textDecoration: "none",
        color: "inherit",
        display: "grid",
        gap: 8,
        minHeight: 120,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <div style={{ fontWeight: 900, color: "#37474F", fontSize: 16 }}>{title}</div>
        {note ? (
          <div style={{ fontSize: 12, fontWeight: 800, color: "#FF7043" }}>{note}</div>
        ) : null}
      </div>
      <div style={{ color: "#607D8B", fontSize: 13, lineHeight: 1.45 }}>{description}</div>
      <div style={{ marginTop: "auto", color: "#FF7043", fontWeight: 800, fontSize: 13 }}>
        Open →
      </div>
    </Link>
  );
}

export default function CandidateCenter() {
  const { plan, isEnterprise: planIsEnterprise } = usePlan();
  const dbPlan = String(plan || "").toLowerCase();
  const isEnterprise = planIsEnterprise || dbPlan === "enterprise";

  return (
    <RecruiterLayout
      title="ForgeTomorrow — Candidate Center"
      header={<HeaderBox />}
      right={<RightRail />}
      activeNav="candidate-center"
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 12,
        }}
      >
        <HubCard
          title="Internal Search"
          description="Search and automate discovery of candidates already on ForgeTomorrow."
          href="/recruiter/candidates"
        />
        <HubCard
          title="External Compare"
          description="Paste any resume and job description to generate an evidence-backed comparison - even outside ForgeTomorrow."
          href="/recruiter/explain"
        />
        <HubCard
          title="Talent Pools"
          description="Organize strong candidates into pools you can revisit and reuse across roles."
          href="/recruiter/pools"
          note={isEnterprise ? "" : "Available tonight"}
        />
      </div>
    </RecruiterLayout>
  );
}
