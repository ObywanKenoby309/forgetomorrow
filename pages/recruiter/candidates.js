// pages/recruiter/candidates.js
import { useState } from "react";
import { PlanProvider, usePlan } from "../../context/PlanContext";
import RecruiterLayout from "../../components/layouts/RecruiterLayout";
import CandidateList from "../../components/recruiter/CandidateList";
import CandidateProfileModal from "../../components/recruiter/CandidateProfileModal";
import FeatureLock from "../../components/recruiter/FeatureLock";

function HeaderOnly() {
  // Header shows ONLY title + description (no inputs)
  return (
    <div className="w-full text-center">
      <h1 className="text-2xl font-bold text-[#FF7043]">Candidates</h1>
      <p className="mt-1 text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
        Review and manage your active pipeline. Search by name/role, filter by location,
        and—on Enterprise—use Boolean search to dial in exactly who you need.
      </p>
    </div>
  );
}

function RightToolsCard() {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="font-medium mb-2">Tips</div>
      <div className="text-sm text-slate-600 space-y-2">
        <p>Use short queries, then refine with Boolean on Enterprise.</p>
        <p>Tag top candidates to build quick outreach lists.</p>
      </div>
    </div>
  );
}

function Body() {
  const { isEnterprise } = usePlan();

  // inputs (one single row below header)
  const [nameQuery, setNameQuery] = useState("");
  const [locQuery, setLocQuery] = useState("");
  const [boolQuery, setBoolQuery] = useState("");

  // mock data (wire to API later)
  const [candidates, setCandidates] = useState([
    {
      id: 1,
      name: "Jane Doe",
      role: "Client Success Lead",
      location: "Remote",
      match: 92,
      summary:
        "Customer-obsessed team lead with 7+ years in SaaS onboarding and retention.",
      experience: [
        {
          title: "Senior CSM",
          company: "NimbusCloud",
          range: "Jan 2022 — Present",
          highlights: ["Led 6 CSMs; 96% logo retention", "Built playbooks for enterprise onboarding"],
        },
        {
          title: "CSM",
          company: "AcmeSoft",
          range: "2019 — 2021",
          highlights: ["Improved NPS from 41 → 62", "Drove $1.2M expansion revenue"],
        },
      ],
      skills: ["Customer Success", "Onboarding", "Playbooks", "SaaS", "Retention"],
      activity: [{ event: "Applied to Client Success Team Lead", when: "2 days ago" }],
      tags: ["Top Prospect"],
      notes: "Strong in process building; confirm compensation expectations.",
    },
    {
      id: 2,
      name: "Omar Reed",
      role: "Onboarding Specialist",
      location: "Nashville, TN",
      match: 88,
      summary: "Process-driven onboarding specialist focused on time-to-value.",
      experience: [
        { title: "Onboarding Specialist", company: "FlowOps", range: "2021 — Present", highlights: ["Avg TTV 10 days"] },
      ],
      skills: ["Onboarding", "Process", "Documentation"],
      activity: [{ event: "Viewed job post", when: "Yesterday" }],
      tags: [],
      notes: "",
    },
    {
      id: 3,
      name: "Priya Kumar",
      role: "Solutions Architect",
      location: "Austin, TX",
      match: 86,
      summary: "SA with strong pre-sales experience in integrations and security.",
      experience: [
        { title: "Solutions Architect", company: "SecureLayer", range: "2020 — Present", highlights: ["Led 15 POCs"] },
      ],
      skills: ["Solutions Architecture", "Security", "APIs", "Pre-sales"],
      activity: [],
      tags: ["Keep Warm"],
      notes: "Potential for future SA role; not ideal for CSM role.",
    },
  ]);

  // SINGLE filters row (equal widths), placed BELOW header
  const FiltersRow = (
    <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
      <input
        type="text"
        placeholder="Search by name or role…"
        className="border rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
        value={nameQuery}
        onChange={(e) => setNameQuery(e.target.value)}
      />
      <input
        type="text"
        placeholder="Filter by location…"
        className="border rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
        value={locQuery}
        onChange={(e) => setLocQuery(e.target.value)}
      />
      {isEnterprise ? (
        <input
          type="text"
          placeholder="Boolean Search…"
          className="border rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
          value={boolQuery}
          onChange={(e) => setBoolQuery(e.target.value)}
        />
      ) : (
        // Locked input stays disabled but wrapped to keep spacing consistent
        <FeatureLock label="Boolean Search">
          <input
            type="text"
            placeholder="Boolean Search (Upgrade required)"
            className="border rounded px-3 py-2 text-sm w-full bg-gray-100 cursor-not-allowed"
            disabled
          />
        </FeatureLock>
      )}
    </div>
  );

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const onView = (c) => {
    setSelected(c);
    setOpen(true);
  };
  const onMessage = (c) => console.log("Message", c);

  const saveNotes = (id, text) => {
    setCandidates((prev) => prev.map((c) => (c.id === id ? { ...c, notes: text } : c)));
  };

  const toggleTag = (id, tag) => {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const has = (c.tags || []).includes(tag);
        return { ...c, tags: has ? c.tags.filter((t) => t !== tag) : [...(c.tags || []), tag] };
      })
    );
  };

  return (
    <>
      {FiltersRow}

      <CandidateList
        candidates={candidates}
        isEnterprise={isEnterprise}
        onView={onView}
        onMessage={onMessage}
        // If CandidateList renders its own filters, hide them:
        showFilters={false}
        showFilterBar={false}
        filtersVisible={false}
        // Optionally pass queries for future wiring:
        query={nameQuery}
        locationFilter={locQuery}
        booleanQuery={boolQuery}
      />

      <CandidateProfileModal
        open={open}
        onClose={() => setOpen(false)}
        candidate={selected}
        onSaveNotes={saveNotes}
        onToggleTag={toggleTag}
      />
    </>
  );
}

export default function CandidatesPage() {
  return (
    <PlanProvider>
      <RecruiterLayout
        title="Candidates — ForgeTomorrow"
        header={<HeaderOnly />}
        right={<RightToolsCard />}
      >
        <Body />
      </RecruiterLayout>
    </PlanProvider>
  );
}
