// pages/recruiter/candidates.js
import { useState, useEffect } from "react";
import { PlanProvider, usePlan } from "../../context/PlanContext";
import RecruiterLayout from "../../components/layouts/RecruiterLayout";
import CandidateList from "../../components/recruiter/CandidateList";
import CandidateProfileModal from "../../components/recruiter/CandidateProfileModal";
import FeatureLock from "../../components/recruiter/FeatureLock";

import WhyCandidateDrawer from "../../components/recruiter/WhyCandidateDrawer";
import { getMockExplain } from "../../lib/recruiter/mockExplain";
import * as Analytics from "../../lib/analytics/instrumentation";
import WhyInfo from "../../components/recruiter/WhyInfo";

// Shape the snapshot we log / maybe show later
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
        Review and manage your active pipeline. Search by name/role, filter by
        location, and—on Enterprise—use Boolean search to dial in exactly who you
        need.
      </p>
    </div>
  );
}

// Sidebar card now reads the real plan via usePlan()
function RightToolsCard({ whyMode = "lite", creditsLeft = null }) {
  const isFull = whyMode === "full";
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="font-medium mb-2">Tips</div>
      <div className="text-sm text-slate-600 space-y-2">
        <p>Use short queries, then refine with Boolean on Enterprise.</p>
        <p>Tag top candidates to build quick outreach lists.</p>
        <p className="mt-2 flex items-center flex-wrap gap-1">
          <span>
            <span className="font-semibold">WHY</span>:{" "}
            {isFull ? "Full rationale enabled" : "Lite rationale (top reasons only)"}
          </span>
          {/* Single POR for explainability */}
          <WhyInfo />
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

  // Data & errors
  const [candidates, setCandidates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [actionError, setActionError] = useState(null);

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

  const onMessage = (c) => {
    // Messaging system will be wired in a dedicated pass
    console.log("Message", c);
  };

  // Helper: demo candidate used for dev-only fallback
  const buildDemoCandidates = () => [
    {
      id: "demo-1",
      name: "Demo Candidate",
      title: "Senior Customer Success Manager",
      currentTitle: "Senior Customer Success Manager",
      location: "Remote (US)",
      match: 91,
      email: "demo@example.com",
      tags: [],
      notes: "",
    },
  ];

  // Load candidates from Prisma-backed API
  useEffect(() => {
    let isMounted = true;

    async function fetchCandidates() {
      try {
        setIsLoading(true);
        setLoadError(null);

        const params = new URLSearchParams();
        if (nameQuery) params.set("q", nameQuery);
        if (locQuery) params.set("location", locQuery);
        if (boolQuery) params.set("bool", boolQuery);

        const res = await fetch(
          `/api/recruiter/candidates${
            params.toString() ? `?${params.toString()}` : ""
          }`
        );

        // If API fails but dev flag is on, fall back to demo candidate
        if (!res.ok) {
          if (process.env.NEXT_PUBLIC_FAKE_CANDIDATES === "1") {
            if (!isMounted) return;
            setCandidates(buildDemoCandidates());
            setLoadError(null);
            return;
          }
          throw new Error(`Failed to load candidates: ${res.status}`);
        }

        const json = await res.json();
        if (!isMounted) return;

        let list = Array.isArray(json.candidates) ? json.candidates : [];

        // If API succeeds but returns no rows, optionally seed demo
        if (!list.length && process.env.NEXT_PUBLIC_FAKE_CANDIDATES === "1") {
          list = buildDemoCandidates();
        }

        setCandidates(list);
        setLoadError(null);
      } catch (err) {
        console.error("[Candidates] load error:", err);
        if (!isMounted) return;

        // Final catch: if anything blows up, still show demo in dev
        if (process.env.NEXT_PUBLIC_FAKE_CANDIDATES === "1") {
          setCandidates(buildDemoCandidates());
          setLoadError(null);
        } else {
          setLoadError(
            "We had trouble loading candidates. Contact the Support Team if communication isn't provided in 30 minutes."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchCandidates();
    return () => {
      isMounted = false;
    };
  }, [nameQuery, locQuery, boolQuery]);

  // Notes persistence — optimistic update + Sev-1-transparent errors
  const saveNotes = async (id, text) => {
    setActionError(null);
    // Optimistic update
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, notes: text } : c))
    );

    try {
      const res = await fetch("/api/recruiter/candidates/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId: id, notes: text }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        const msg =
          payload?.error ||
          `Failed to save candidate notes (status ${res.status}).`;
        throw new Error(msg);
      }
    } catch (err) {
      console.error("[Candidates] saveNotes error:", err);
      setActionError(
        "We couldn't save candidate notes. Your changes may not be stored yet."
      );
    }
  };

  // Tag toggle persistence — optimistic update + honest errors
  const toggleTag = async (id, tag) => {
    setActionError(null);

    let updatedTags = null;

    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const currentTags = Array.isArray(c.tags) ? c.tags : [];
        const has = currentTags.includes(tag);
        const next = has
          ? currentTags.filter((t) => t !== tag)
          : [...currentTags, tag];
        updatedTags = next;
        return { ...c, tags: next };
      })
    );

    if (!updatedTags) {
      return;
    }

    try {
      const res = await fetch("/api/recruiter/candidates/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId: id, tags: updatedTags }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        const msg =
          payload?.error ||
          `Failed to update candidate tags (status ${res.status}).`;
        throw new Error(msg);
      }
    } catch (err) {
      console.error("[Candidates] toggleTag error:", err);
      setActionError(
        "We couldn't update candidate tags. Your changes may not be stored yet."
      );
    }
  };

  // WHY drawer + instrumentation (API + mock fallback)
  const [whyOpen, setWhyOpen] = useState(false);
  const [whyData, setWhyData] = useState(null);
  const [whyCandidate, setWhyCandidate] = useState(null);

  const onWhy = async (c) => {
    if (whyMode === "off") return;
    if (!hasWhyFull && whyCreditsLeft === 0) return;

    let ex;

    try {
      const res = await fetch("/api/recruiter/candidates/why", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Phase 1: no specific job context yet → jobId: null
        body: JSON.stringify({
          candidateId: c.id,
          jobId: null,
        }),
      });

      if (!res.ok) {
        throw new Error(`WHY API failed (status ${res.status})`);
      }

      ex = await res.json();
    } catch (err) {
      console.error("[Candidates] WHY API error:", err);
      // Fallback to mock explanation so feature never feels broken
      ex = getMockExplain();
    }

    // Personalize explanation with candidate’s data
    if (c?.name && ex.summary) {
      ex.summary = `${c.name.split(" ")[0]}: ${ex.summary}`;
    }
    if (typeof c?.match === "number") {
      ex.score = c.match;
    }

    setWhyCandidate(c);
    setWhyData(ex);
    setWhyOpen(true);

    const snapshot = mkWhySnapshot(ex, whyMode);

    const evt = {
      type: "why_opened",
      ts: new Date().toISOString(),
      orgId: null,
      jobId: null,
      candidateId: c.id,
      role: "recruiter",
      snapshot,
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
      {/* Sev-1 style feed incident banner */}
      {loadError && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {loadError}
        </div>
      )}

      {/* Action-level error (notes/tags) */}
      {actionError && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {actionError}
        </div>
      )}

      {FiltersRow}

      {isLoading ? (
        <div className="text-sm text-slate-600">Loading candidates...</div>
      ) : (
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
      )}

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
