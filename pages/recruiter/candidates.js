// pages/recruiter/candidates.js
import { useState } from "react";
import { PlanProvider, usePlan } from "../../context/PlanContext";
import RecruiterLayout from "../../components/layouts/RecruiterLayout";
import CandidateList from "../../components/recruiter/CandidateList";
import CandidateProfileModal from "../../components/recruiter/CandidateProfileModal";
import FeatureLock from "../../components/recruiter/FeatureLock";

import WhyCandidateDrawer from "../../components/recruiter/WhyCandidateDrawer";
import { getMockExplain } from "../../lib/recruiter/mockExplain";
import * as Analytics from "../../lib/analytics/instrumentation";

const mkWhySnapshot = (explain, mode) => ({
  score: explain?.score,
  mode,
  reasons: (explain?.reasons || [])
    .slice(0, mode === "full" ? 8 : 2)
    .map((r) => ({
      requirement: r.requirement,
      evidence: (r.evidence || [])
        .slice(0, mode === "full" ? 4 : 1)
        .map((e) => ({ text: e.text, source: e.source || null })),
    })),
  filters: explain?.filters_triggered || [],
});

function HeaderOnly() {
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

function RightToolsCard({ whyMode = "lite", creditsLeft = null }) {
  const isFull = whyMode === "full";
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="font-medium mb-2">Tips</div>
      <div className="text-sm text-slate-600 space-y-2">
        <p>Use short queries, then refine with Boolean on Enterprise.</p>
        <p>Tag top candidates to build quick outreach lists.</p>
        <p className="mt-2">
          <span className="font-semibold">WHY</span>:{" "}
          {isFull ? "Full rationale enabled" : "Lite rationale (top reasons only)"}
          {creditsLeft != null && !isFull && (
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full border bg-[#FFEDE6] text-[#FF7043]">
              {creditsLeft} left
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

function Body() {
  const { isEnterprise } = usePlan();

  // Filters
  const [nameQuery, setNameQuery] = useState("");
  const [locQuery, setLocQuery] = useState("");
  const [boolQuery, setBoolQuery] = useState("");

  // Mock candidates
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

  // WHY flags
  const hasWhyFull = isEnterprise;
  const hasWhyLite = true;
  const whyMode = hasWhyFull ? "full" : hasWhyLite ? "lite" : "off";

  // SMB credit counter (optional)
  const [whyCreditsLeft, setWhyCreditsLeft] = useState(hasWhyFull ? null : 100);

  // Profile modal
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

  // WHY drawer + instrumentation
  const [whyOpen, setWhyOpen] = useState(false);
  const [whyData, setWhyData] = useState(null);
  const [whyCandidate, setWhyCandidate] = useState(null); // ← NEW

  const onWhy = (c) => {
    if (whyMode === "off") return;
    if (!hasWhyFull && whyCreditsLeft === 0) return;

    const ex = getMockExplain();
    ex.summary = `${c.name.split(" ")[0]}: ${ex.summary}`;
    ex.score = c.match;

    setWhyCandidate(c);     // ← NEW: remember which candidate the drawer is for
    setWhyData(ex);
    setWhyOpen(true);

    const evt = {
      type: "why_opened",
      ts: new Date().toISOString(),
      orgId: null,
      jobId: null,
      candidateId: c.id,
      role: "recruiter",
      snapshot: mkWhySnapshot(ex, whyMode),
    };
    if (typeof Analytics.logWhyOpened === "function") {
      Analytics.logWhyOpened({ ...evt, score: ex.score, mode: whyMode, explain: ex });
    } else if (typeof Analytics.logEvent === "function") {
      Analytics.logEvent(evt);
    }

    if (!hasWhyFull) {
      setWhyCreditsLeft((n) => Math.max(0, (n || 0) - 1));
    }
  };

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

  return (
    <>
      {FiltersRow}

      <CandidateList
        candidates={candidates}
        isEnterprise={isEnterprise}
        onView={onView}
        onMessage={onMessage}
        onWhy={onWhy}
        showFilters={false}
        showFilterBar={false}
        filtersVisible={false}
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

      <WhyCandidateDrawer
        open={whyOpen}
        onClose={() => setWhyOpen(false)}
        explain={whyData}
        mode={whyMode}
        onViewCandidate={() => {
          if (whyCandidate) {
            setSelected(whyCandidate);
            setOpen(true);
          }
          setWhyOpen(false);
        }}
      />
    </>
  );
}

export default function CandidatesPage() {
  const RightCard = (props) => <RightToolsCard {...props} />;

  return (
    <PlanProvider>
      <RecruiterLayout
        title="Candidates — ForgeTomorrow"
        header={<HeaderOnly />}
        right={<RightCard />}
      >
        <Body />
      </RecruiterLayout>
    </PlanProvider>
  );
}
