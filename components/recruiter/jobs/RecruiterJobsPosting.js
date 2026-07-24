// components/recruiter/jobs/RecruiterJobsPosting.js

import React from "react";
import { usePlan } from "@/context/PlanContext";
import JDOptimizer from "@/components/ai/JDOptimizer";
import ATSAdvisor from "@/components/ai/ATSAdvisor";
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
  const { isEnterprise } = usePlan();

  const [jobSubTab, setJobSubTab] = React.useState("details");

  const [isView, setIsView] = React.useState(true);

  const [data, setData] = React.useState({
    company: job?.company || "",
    title: job?.title || "",
    worksite: job?.worksite || "Remote",
    location: job?.location || "",
    type: job?.type || "Full-time",
    compensation: job?.compensation || "",
    description: job?.description || job?.summary || "",
    companyUrl: job?.companyUrl || "",
    status: job?.status || "Draft",
  });

  const companyAssetKey =
    job?.companyId ||
    job?.organizationId ||
    job?.accountKey ||
    "default";

const descWords = data.description.trim()
  ? data.description.trim().split(/\s+/).length
  : 0;

const missing = [];

if (!data.company) missing.push("Company");
if (!data.title) missing.push("Job Title");
if (!data.location) missing.push("Location");
if (!data.description) missing.push("Description");

const valid = missing.length === 0;

  const jobSubTabs = [
  { id: "details", label: "Details" },
  { id: "questions", label: "Questions" },
  { id: "templates", label: "Templates" },
  { id: "publishing", label: "Publishing" },
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

{jobSubTab === "details" && (
  <>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-3">
        {/* Job Details */}
<div className="space-y-3">

<SectionCard title="Job Details">
        </div>

        <div className="p-5 text-sm">
          <div className="flex flex-col md:flex-row gap-5">
            {/* LEFT: Job form */}
            <div className="flex-1 space-y-5 min-w-0">
              {/* Row: quick “completion” pulse */}
              {!isView && (
                <div className="rounded-xl border border-slate-200 bg-white/70 backdrop-blur p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs text-slate-700">
                      <span className="font-medium">Posting readiness:</span>{" "}
                      {valid ? (
                        <span className="text-slate-800">
                          Ready to save - required fields complete.
                        </span>
                      ) : (
                        <span className="text-slate-600">
                          Missing:{" "}
                          <span className="font-medium text-slate-800">
                            {missing.join(", ")}
                          </span>
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-500">
                      Description: <span className="font-medium">{descWords}</span> words
                    </div>
                  </div>
                </div>
              )}

              {/* ROW 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Company" required>
                  <input
                    className="border border-slate-200 rounded-xl px-3 py-2 w-full bg-white/90 focus:outline-none focus:ring-2 focus:ring-[#FF7043]/35"
                    value={data.company}
                    onChange={(e) => setData((p) => ({ ...p, company: e.target.value }))}
                    disabled={isView}
                    placeholder="e.g., ForgeTomorrow"
                  />
                </Field>
                <Field label="Job Title" required>
                  <input
                    className="border border-slate-200 rounded-xl px-3 py-2 w-full bg-white/90 focus:outline-none focus:ring-2 focus:ring-[#FF7043]/35"
                    value={data.title}
                    onChange={(e) => setData((p) => ({ ...p, title: e.target.value }))}
                    disabled={isView}
                    placeholder="e.g., Senior Recruiter"
                  />
                </Field>
              </div>

              {/* ROW 2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Worksite" required>
                  <select
                    className="border border-slate-200 rounded-xl px-3 py-2 w-full bg-white/90 focus:outline-none focus:ring-2 focus:ring-[#FF7043]/35"
                    value={data.worksite}
                    onChange={(e) => setData((p) => ({ ...p, worksite: e.target.value }))}
                    disabled={isView}
                  >
                    <option>Remote</option>
                    <option>Hybrid</option>
                    <option>Onsite</option>
                  </select>
                </Field>
                <Field label="Location" required>
                  <input
                    className="border border-slate-200 rounded-xl px-3 py-2 w-full bg-white/90 focus:outline-none focus:ring-2 focus:ring-[#FF7043]/35"
                    value={data.location}
                    onChange={(e) => setData((p) => ({ ...p, location: e.target.value }))}
                    disabled={isView}
                    placeholder="e.g., Nashville, TN"
                  />
                </Field>
              </div>

              {/* ROW 3 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Employment Type">
                  <select
                    className="border border-slate-200 rounded-xl px-3 py-2 w-full bg-white/90 focus:outline-none focus:ring-2 focus:ring-[#FF7043]/35"
                    value={data.type}
                    onChange={(e) => setData((p) => ({ ...p, type: e.target.value }))}
                    disabled={isView}
                  >
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Contract</option>
                    <option>Internship</option>
                  </select>
                </Field>
                <Field label="Compensation">
                  <input
                    className="border border-slate-200 rounded-xl px-3 py-2 w-full bg-white/90 focus:outline-none focus:ring-2 focus:ring-[#FF7043]/35"
                    value={data.compensation}
                    onChange={(e) => setData((p) => ({ ...p, compensation: e.target.value }))}
                    disabled={isView}
                    placeholder="e.g., $70-90k base + bonus"
                  />
                </Field>
              </div>

              {/* DESCRIPTION + AI */}
              <Field label="Description" required>
                <div className="rounded-xl border border-slate-200 bg-white/70 backdrop-blur p-3">
                  <textarea
                    className="border border-slate-200 rounded-xl px-3 py-2 w-full min-h-[160px] font-mono text-sm bg-white/90 focus:outline-none focus:ring-2 focus:ring-[#FF7043]/35"
                    value={data.description}
                    onChange={(e) => setData((p) => ({ ...p, description: e.target.value }))}
                    disabled={isView}
                    placeholder="Write the role clearly. Keep it human. You can optimize it with AI after you draft."
                  />

                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-[11px] text-slate-500">
                      Pro tip: strong postings reduce back-and-forth and attract better-fit applicants.
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {descWords} words
                    </div>
                  </div>

                  {data.description.trim() && isEnterprise && !isView && (
                    <>
                      <div className="mt-4">
                        <JDOptimizer
                          draft={data.description}
                          title={data.title}
                          company={data.company}
                          onOptimize={(text) => setData((p) => ({ ...p, description: text }))}
                        />
                      </div>
                      <div className="mt-4">
                        <ATSAdvisor draft={data.description} title={data.title} company={data.company} />
                      </div>
                    </>
                  )}

                  {data.description.trim() && !isEnterprise && !isView && (
                    <div className="mt-4 rounded-xl border border-slate-200 bg-white/80 p-3 text-xs text-slate-600">
                      <span className="font-medium text-slate-800">AI Optimizer</span> is locked on your plan.
                      When enabled, it rewrites for clarity + ATS alignment and gives quick guidance.
                    </div>
                  )}
                </div>
              </Field>

<Field label="Company / About Us URL">
  <input
    type="url"
    className="border border-slate-200 rounded-xl px-3 py-2 w-full bg-white/90 focus:outline-none focus:ring-2 focus:ring-[#FF7043]/35"
    value={data.companyUrl}
    onChange={(e) =>
      setData((p) => ({ ...p, companyUrl: e.target.value }))
    }
    disabled={isView}
    placeholder="https://company.com/about"
  />

  {!isView && (
    <div className="mt-2 text-[11px] text-slate-500">
      Keep the job description focused on the role. Add your company website or About Us page here for candidates who want additional background.
    </div>
  )}
</Field>

              <Field label="Status">
                <select
                  className="border border-slate-200 rounded-xl px-3 py-2 w-full bg-white/90 focus:outline-none focus:ring-2 focus:ring-[#FF7043]/35"
                  value={data.status}
                  onChange={(e) => setData((p) => ({ ...p, status: e.target.value }))}
                  disabled={isView}
                >
                  <option value="Draft">Draft</option>
                  <option value="Open">Open</option>
                  <option value="Reviewing">Reviewing applicants</option>
                  <option value="Closed">Closed</option>
                </select>

                {!isView && (
                  <div className="mt-2 text-[11px] text-slate-500">
                    “Open” makes it visible to seekers. “Reviewing” keeps it visible but pauses new applications.
                  </div>
                )}
              </Field>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  </div>

  </>
)}
    </div>
  );
}