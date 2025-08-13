// pages/recruiter/candidates.js
import Head from "next/head";
import { useState } from "react";
import { PlanProvider, usePlan } from "../../context/PlanContext";
import RecruiterHeader from "../../components/recruiter/RecruiterHeader";
import CandidateList from "../../components/recruiter/CandidateList";
import CandidateProfileModal from "../../components/recruiter/CandidateProfileModal";
import FeatureLock from "../../components/recruiter/FeatureLock";

function Body() {
  const { isEnterprise } = usePlan();

  const [candidates, setCandidates] = useState([
    {
      id: 1,
      name: "Jane Doe",
      role: "Client Success Lead",
      location: "Remote",
      match: 92,
      summary: "Customer-obsessed team lead with 7+ years in SaaS onboarding and retention.",
      experience: [
        { title: "Senior CSM", company: "NimbusCloud", range: "Jan 2022 — Present", highlights: ["Led 6 CSMs; 96% logo retention", "Built playbooks for enterprise onboarding"] },
        { title: "CSM", company: "AcmeSoft", range: "2019 — 2021", highlights: ["Improved NPS from 41 → 62", "Drove $1.2M expansion revenue"] },
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
      experience: [{ title: "Onboarding Specialist", company: "FlowOps", range: "2021 — Present", highlights: ["Avg TTV 10 days"] }],
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
      experience: [{ title: "Solutions Architect", company: "SecureLayer", range: "2020 — Present", highlights: ["Led 15 POCs"] }],
      skills: ["Solutions Architecture", "Security", "APIs", "Pre-sales"],
      activity: [],
      tags: ["Keep Warm"],
      notes: "Potential for future SA role; not ideal for CSM role.",
    },
  ]);

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
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl font-semibold">Candidates</h1>
        <div className="flex items-center gap-2">
          {/* Boolean Search — Enterprise-only */}
          {isEnterprise ? (
            <button className="rounded border px-3 py-2 text-sm">Boolean Search</button>
          ) : (
            <FeatureLock label="Boolean Search">
              <button className="rounded border px-3 py-2 text-sm">Boolean Search</button>
            </FeatureLock>
          )}
        </div>
      </div>

      <CandidateList
        candidates={candidates}
        isEnterprise={isEnterprise}
        onView={onView}
        onMessage={onMessage}
      />

      <CandidateProfileModal
        open={open}
        onClose={() => setOpen(false)}
        candidate={selected}
        onSaveNotes={saveNotes}
        onToggleTag={toggleTag}
      />
    </main>
  );
}

export default function CandidatesPage() {
  return (
    <PlanProvider>
      <Head><title>Candidates — ForgeTomorrow</title></Head>
      <RecruiterHeader />
      <Body />
    </PlanProvider>
  );
}
