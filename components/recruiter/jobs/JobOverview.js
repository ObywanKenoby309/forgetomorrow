// components/recruiter/jobs/JobOverview.js

import React from "react";

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
          {jobSubTab === "overview" && (
  <>
            ? "w-5 bg-[#FF7043]"
            : "w-1.5 bg-slate-300/75"
        }`}
        aria-label={`Go to ${tab.label}`}
      />
    ))}
  </div>
</div>

      {/* Main Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "340px minmax(0,1fr)",
          gap: 20,
        }}
      >
        {/* Job Snapshot */}
        <div style={CARD}>
          <div
            style={{
              height: 180,
              borderRadius: 14,
              background: "linear-gradient(135deg,#ECEFF1,#CFD8DC)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              color: "#546E7A",
              marginBottom: 18,
            }}
          >
            Company Image Placeholder
          </div>

          <h2>{job?.title || "Job Title"}</h2>

          <div
            style={{
              color: "#64748B",
            }}
          >
            {job?.company || "Company Name"}
          </div>

          <div
            style={{
              display: "grid",
              gap: 10,
              marginTop: 18,
            }}
          >
            <div>
              <b>Status:</b> Open
            </div>

            <div>
              <b>Department:</b> Operations
            </div>

            <div>
              <b>Worksite:</b> Remote
            </div>

            <div>
              <b>Employment:</b> Full Time
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gap: 10,
              marginTop: 24,
            }}
          >
            <button>Edit Posting</button>
            <button>View Public Posting</button>
            <button>Duplicate Job</button>
          </div>
        </div>

        {/* Job Summary */}
        <div style={CARD}>
          <h2
            style={{
              color: "#FF7043",
            }}
          >
            Job Summary
          </h2>

          <p>
            This placeholder mirrors the Coaching overview layout and will later
            be wired to recruiter job data.
          </p>

          <h3>Hiring Objectives</h3>

          <ul>
            <li>Responsibilities</li>
            <li>Ideal Candidate</li>
            <li>Hiring Notes</li>
            <li>Priority Skills</li>
            <li>Milestones</li>
          </ul>
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
        <Metric
          title="Hiring Snapshot"
          value="Overview"
        />

        <Metric
          title="Candidate Snapshot"
          value="Applicants"
        />

        <Metric
          title="Activity Snapshot"
          value="Timeline"
        />
      </div>
	  </>
)}
    </div>
  );
}