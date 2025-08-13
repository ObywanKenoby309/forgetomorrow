// pages/recruiter/candidates.js
import Head from "next/head";
import { PlanProvider, usePlan } from "../../context/PlanContext";
import RecruiterHeader from "../../components/recruiter/RecruiterHeader";
import CandidateList from "../../components/recruiter/CandidateList";

function Body() {
  const { isEnterprise } = usePlan();

  const candidates = [
    { id: 1, name: "Jane Doe", role: "Client Success Lead", location: "Remote", match: 92 },
    { id: 2, name: "Omar Reed", role: "Onboarding Specialist", location: "Nashville, TN", match: 88 },
    { id: 3, name: "Priya Kumar", role: "Solutions Architect", location: "Austin, TX", match: 86 },
  ];

  const onView = (c) => console.log("View profile", c);
  const onMessage = (c) => console.log("Message", c);

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
      <h1 className="text-xl font-semibold">Candidates</h1>

      {/* Boolean search teaser / control */}
      <div className="flex items-center gap-2">
        {!isEnterprise ? (
          <button className="rounded border px-3 py-2 text-sm" title="Enterprise only">🔒 Boolean Search</button>
        ) : (
          <button className="rounded border px-3 py-2 text-sm">Boolean Search</button>
        )}
      </div>

      <CandidateList
        candidates={candidates}
        isEnterprise={isEnterprise}
        onView={onView}
        onMessage={onMessage}
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
