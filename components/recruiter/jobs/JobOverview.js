// components/recruiter/jobs/JobOverview.js

import React from "react";
import { SectionCard } from "./JobProfilePrimitives";

const CARD = {
  borderRadius: 18,
  background: "rgba(255,255,255,.82)",
  border: "1px solid rgba(255,255,255,.55)",
  padding: 20,
  boxShadow: "0 10px 24px rgba(0,0,0,.08)",
};



const Metric = ({ title, value }) => (
  <div
    style={{
      ...CARD,
      minHeight: 150,
    }}
  >
    <div
      style={{
        fontSize: 11,
        fontWeight: 800,
        color: "#FF7043",
        textTransform: "uppercase",
      }}
    >
      {title}
    </div>

    <div
      style={{
        marginTop: 18,
        fontSize: 30,
        fontWeight: 900,
      }}
    >
      {value}
    </div>

    <div
      style={{
        marginTop: 10,
        color: "#64748B",
      }}
    >
      Placeholder
    </div>
  </div>
);

export default function JobOverview({ job }) {
  const [jobSubTab, setJobSubTab] = React.useState("overview");
  const companyAssetKey =
  job?.companyId ||
  job?.organizationId ||
  job?.accountKey ||
  "default";

  const jobSubTabs = [
  { id: "overview", label: "Overview" },
  { id: "hiring", label: "Hiring" },
  { id: "posting", label: "Posting" },
  { id: "metrics", label: "Metrics" },
  { id: "activity", label: "Activity" },
];
	
  return (
    <div
      style={{
        display: "grid",
        gap: 20,
      }}
    >
      {/* Top Navigation */}
<div className="space-y-3">
  <div className="flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none]">
    {jobSubTabs.map((tab) => (
      <button
        key={tab.id}
        type="button"
        onClick={() => setJobSubTab(tab.id)}
        className={`shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-black transition ${
          jobSubTab === tab.id
            ? "border-[#FF7043] bg-[#FF7043] text-white shadow-sm"
            : "border-slate-200 bg-white/85 text-slate-700 hover:bg-white"
        }`}
      >
        {tab.label}
      </button>
    ))}
  </div>

  <div
    className="flex justify-center gap-1.5 -mt-1 pb-1"
    aria-label="Profile section position"
  >
    {jobSubTabs.map((tab) => (
 <button
  key={`dot-${tab.id}`}
  type="button"
  onClick={() => setJobSubTab(tab.id)}
  className={`h-1.5 rounded-full border-0 p-0 transition-all ${
    jobSubTab === tab.id
      ? "w-5 bg-[#FF7043]"
      : "w-1.5 bg-slate-300/75"
  }`}
  aria-label={`Go to ${tab.label}`}
/>
    ))}
  </div>
</div>

{jobSubTab === "overview" && (
  <>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-3">
        {/* Job Snapshot */}
        <div className="space-y-3">

<SectionCard title="Job Snapshot">
            <div
              className="relative overflow-hidden rounded-[20px] border border-white/45 shadow-[0_16px_34px_rgba(15,23,42,0.22)]"
              style={{
  minHeight: 326,
  backgroundImage: `linear-gradient(180deg, rgba(2,6,23,0.18), rgba(2,6,23,0.48)), url("/assets/companies/${companyAssetKey}/banner.png")`,
  backgroundSize: "cover",
  backgroundPosition: "center",
}}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,112,67,0.18),transparent_42%)]" />
			  <div className="absolute inset-x-0 bottom-0 h-[48%] bg-gradient-to-t from-slate-950/70 via-slate-950/24 to-transparent" />

              <div className="relative z-[1] flex min-h-[326px] flex-col items-center justify-end gap-2 px-3 pb-3 pt-7 text-center">
                <img
  src={`/assets/companies/${companyAssetKey}/logo.png`}
  alt={job?.company || "Company Logo"}
  style={{
    width: 74,
    height: 74,
    borderRadius: 18,
    objectFit: "cover",
    boxShadow: "0 14px 34px rgba(2,6,23,0.42)",
    outline: "3px solid rgba(255,255,255,0.70)",
    outlineOffset: 3,
    background: "white",
  }}
/>

                <div className="w-full px-2 text-white [text-shadow:_0_2px_8px_rgba(2,6,23,0.90)]">
                  <div className="text-[17px] font-black tracking-tight leading-tight">
                    {job?.title || "Job Title"}
                  </div>

                  <div className="mt-1 text-[12px] font-bold text-white/90 break-words">
                    {job?.company || "Company Name"}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <span className="rounded-full border border-white/35 bg-white/92 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-green-700 shadow-sm">
                    {job?.status || "Open"}
                  </span>

                  <span className="rounded-full border border-white/30 bg-slate-950/42 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white/92 shadow-sm backdrop-blur-sm">
                    {job?.worksite || "Worksite"}
                  </span>
                </div>

                <div className="grid w-full grid-cols-1 gap-2 pt-1">
                  <button
                    type="button"
                    className="rounded-xl border border-white/60 bg-white/90 px-2.5 py-1.5 text-[13px] font-black text-black shadow-[0_8px_18px_rgba(2,6,23,0.18)] backdrop-blur-sm transition hover:bg-white"
                  >
                    Edit Posting
                  </button>

                  <button
                    type="button"
                    className="rounded-xl border border-white/60 bg-white/90 px-2.5 py-1.5 text-[13px] font-black text-black shadow-[0_8px_18px_rgba(2,6,23,0.18)] backdrop-blur-sm transition hover:bg-white"
                  >
                    View Public Posting
                  </button>

                  <button
                    type="button"
                    className="rounded-xl border border-white/60 bg-white/90 px-2.5 py-1.5 text-[13px] font-black text-black shadow-[0_8px_18px_rgba(2,6,23,0.18)] backdrop-blur-sm transition hover:bg-white"
                  >
                    Duplicate Job
                  </button>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Job Summary */}
        <div className="space-y-3">
  <SectionCard title="Job Summary">

    <div
      style={{
        color: "#475569",
        fontSize: 13,
        lineHeight: 1.7,
        whiteSpace: "pre-line",
        maxHeight: 326,
        overflowY: "auto",
        paddingRight: 8,
      }}
    >
      {job?.description ||
        job?.summary ||
        "No job summary is available yet."}
    </div>

  </SectionCard>
</div>
      </div>

      {/* Bottom Snapshot Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,minmax(0,1fr))",
          gap: 20,
        }}
      >
        <div style={CARD}>
  <h2
    style={{
      marginTop: 0,
      color: "#FF7043",
      fontSize: 18,
      fontWeight: 900,
    }}
  >
    Hiring Snapshot
  </h2>

  <div style={{ display: "grid", gap: 12 }}>
    <div><strong>Hiring Manager:</strong> Placeholder</div>
    <div><strong>Department:</strong> Placeholder</div>
    <div><strong>Employment Type:</strong> Placeholder</div>
    <div><strong>Open Since:</strong> Placeholder</div>
    <div><strong>Target Fill:</strong> Placeholder</div>
  </div>
</div>

<div style={CARD}>
  <h2
    style={{
      marginTop: 0,
      color: "#FF7043",
      fontSize: 18,
      fontWeight: 900,
    }}
  >
    Candidate Snapshot
  </h2>

  <div style={{ display: "grid", gap: 12 }}>
    <div><strong>Total Applicants:</strong> Placeholder</div>
    <div><strong>Screening:</strong> Placeholder</div>
    <div><strong>Interviewing:</strong> Placeholder</div>
    <div><strong>Offers:</strong> Placeholder</div>
    <div><strong>Hired:</strong> Placeholder</div>
  </div>
</div>

<div style={CARD}>
  <h2
    style={{
      marginTop: 0,
      color: "#FF7043",
      fontSize: 18,
      fontWeight: 900,
    }}
  >
    Activity Snapshot
  </h2>

  <div style={{ display: "grid", gap: 12 }}>
    <div><strong>Last Updated:</strong> Placeholder</div>
    <div><strong>Newest Applicant:</strong> Placeholder</div>
    <div><strong>Last Interview:</strong> Placeholder</div>
    <div><strong>Recent Activity:</strong> Placeholder</div>
    <div><strong>Upcoming Tasks:</strong> Placeholder</div>
  </div>
</div>

      </div>
  </>
)}
    </div>
  );
}