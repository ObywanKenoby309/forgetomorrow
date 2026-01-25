// pages/recruiter/candidates.js
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { PlanProvider, usePlan } from "../../context/PlanContext";
import RecruiterLayout from "../../components/layouts/RecruiterLayout";
import CandidateList from "../../components/recruiter/CandidateList";
import CandidateProfileModal from "../../components/recruiter/CandidateProfileModal";
import FeatureLock from "../../components/recruiter/FeatureLock";
import WhyCandidateDrawer, {
  WhyCandidateCompareDrawer,
} from "../../components/recruiter/WhyCandidateDrawer";
import { getMockExplain } from "../../lib/recruiter/mockExplain";
import * as Analytics from "../../lib/analytics/instrumentation";
import WhyInfo from "../../components/recruiter/WhyInfo";
import PersonaChoiceModal from "../../components/common/PersonaChoiceModal";
import CandidateTargetingPanel from "../../components/recruiter/CandidateTargetingPanel";

// DEV-ONLY: your recruiter user id to hit /api/conversations
const RECRUITER_DEV_USER_ID = "cmic534oy0000bv2gsjrl83al";

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

const GlassPanel = ({ className = "", children }) => {
  return (
    <section
      className={
        "rounded-2xl border border-white/30 bg-white/70 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.10)] " +
        className
      }
    >
      {children}
    </section>
  );
};

function HeaderOnly() {
  return (
    <div className="w-full">
      <GlassPanel className="px-5 py-4 sm:px-6">
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-0">
            <h1 className="text-2xl font-bold text-[#FF7043]">Candidates</h1>
          </div>

          <p className="mt-2 text-sm text-slate-500 max-w-lg leading-snug">
            Review and manage your active pipeline. Search by name or role,
            filter by location, and on Enterprise use advanced queries to dial in
            exactly who you need.
          </p>
        </div>
      </GlassPanel>
    </div>
  );
}

// Sidebar card reads plan via usePlan(). Keeps props optional.
function RightToolsCard({ whyMode, creditsLeft = null }) {
  const { isEnterprise } = usePlan();
  const resolvedMode = whyMode || (isEnterprise ? "full" : "lite");
  const isFull = resolvedMode === "full";

  return (
    <GlassPanel className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-slate-900">Tips</div>
          <div className="mt-1 text-xs text-slate-600">
            Fast workflows, clean signal.
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={
              "text-[11px] px-2 py-0.5 rounded-full border bg-white/60 " +
              (isFull
                ? "border-emerald-200 text-emerald-700"
                : "border-amber-200 text-amber-700")
            }
          >
            {isFull ? "WHY: Full" : "WHY: Lite"}
          </span>

          {/* Single POR for explainability */}
          <WhyInfo />
        </div>
      </div>

      <div className="mt-3 text-sm text-slate-700 space-y-2">
        <p>
          Start with a short query, then refine. Enterprise teams can use advanced
          queries when the pool is large.
        </p>
        <p>
          Tag top candidates to build quick outreach lists and keep your pipeline
          clean.
        </p>

        <div className="pt-2">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1">
              <span className="font-semibold text-slate-800">Explainability</span>
              <span className="text-slate-500">shows evidence, not buzzwords.</span>
            </span>

            {creditsLeft != null && !isFull && (
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full border border-[#FF7043]/25 bg-[#FFEDE6]/70 text-[#FF7043]">
                {creditsLeft} left
              </span>
            )}
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}

function Body() {
  const { isEnterprise } = usePlan();
  const router = useRouter();

  // Filters
  const [nameQuery, setNameQuery] = useState("");
  const [locQuery, setLocQuery] = useState("");
  const [boolQuery, setBoolQuery] = useState("");

  // Profile-based targeting filters (safe fields only)
  const [summaryKeywords, setSummaryKeywords] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [workStatus, setWorkStatus] = useState("");
  const [preferredWorkType, setPreferredWorkType] = useState("");
  const [willingToRelocate, setWillingToRelocate] = useState("");
  const [skills, setSkills] = useState("");
  const [languages, setLanguages] = useState("");

  // Education keywords (comma-separated)
  const [education, setEducation] = useState("");

  // Targeting/automation panel state
  const [automationEnabled, setAutomationEnabled] = useState(false);
  const [automationName, setAutomationName] = useState("");
  const [automationSaving, setAutomationSaving] = useState(false);
  const [automationMessage, setAutomationMessage] = useState(null);

  // Data & errors
  const [candidates, setCandidates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [actionError, setActionError] = useState(null);

  // Manual search button state
  const [manualSearching, setManualSearching] = useState(false);

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

  // Persona modal state
  const [personaOpen, setPersonaOpen] = useState(false);
  const [personaCandidate, setPersonaCandidate] = useState(null);

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

  // Build current query params (single source of truth for manual + auto runs)
  const buildCandidateParams = () => {
    const params = new URLSearchParams();

    if (nameQuery) params.set("q", nameQuery);
    if (locQuery) params.set("location", locQuery);
    if (boolQuery) params.set("bool", boolQuery);

    // Safe profile filters
    if (summaryKeywords) params.set("summaryKeywords", summaryKeywords);
    if (jobTitle) params.set("jobTitle", jobTitle);
    if (workStatus) params.set("workStatus", workStatus);
    if (preferredWorkType) params.set("preferredWorkType", preferredWorkType);
    if (willingToRelocate) params.set("willingToRelocate", willingToRelocate);
    if (skills) params.set("skills", skills);
    if (languages) params.set("languages", languages);

    // Education
    if (education) params.set("education", education);

    return params;
  };

  const hasAnyTargeting =
    Boolean(summaryKeywords) ||
    Boolean(jobTitle) ||
    Boolean(workStatus) ||
    Boolean(preferredWorkType) ||
    Boolean(willingToRelocate) ||
    Boolean(skills) ||
    Boolean(languages) ||
    Boolean(education);

  const activeChips = useMemo(() => {
    const chips = [];

    if (nameQuery) chips.push({ key: "q", label: `Query: ${nameQuery}` });
    if (locQuery) chips.push({ key: "loc", label: `Location: ${locQuery}` });
    if (boolQuery) chips.push({ key: "bool", label: `Advanced query: ${boolQuery}` });

    if (summaryKeywords)
      chips.push({ key: "summary", label: `Summary: ${summaryKeywords}` });
    if (jobTitle) chips.push({ key: "title", label: `Target role: ${jobTitle}` });
    if (workStatus) chips.push({ key: "status", label: `Status: ${workStatus}` });
    if (preferredWorkType)
      chips.push({ key: "worktype", label: `Work type: ${preferredWorkType}` });
    if (willingToRelocate)
      chips.push({ key: "relocate", label: `Relocate: ${willingToRelocate}` });
    if (skills) chips.push({ key: "skills", label: `Skills: ${skills}` });
    if (languages)
      chips.push({ key: "langs", label: `Languages: ${languages}` });
    if (education)
      chips.push({ key: "edu", label: `Education: ${education}` });

    return chips;
  }, [
    nameQuery,
    locQuery,
    boolQuery,
    summaryKeywords,
    jobTitle,
    workStatus,
    preferredWorkType,
    willingToRelocate,
    skills,
    languages,
    education,
  ]);

  const clearSearchFilters = () => {
    setNameQuery("");
    setLocQuery("");
    setBoolQuery("");
  };

  const clearTargeting = () => {
    setSummaryKeywords("");
    setJobTitle("");
    setWorkStatus("");
    setPreferredWorkType("");
    setWillingToRelocate("");
    setSkills("");
    setLanguages("");
    setEducation("");
  };

  // ---------- WHY PERSONALIZATION (client-side, deterministic) ----------
  const normalizeList = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val.filter(Boolean).map(String);
    if (typeof val === "string") {
      return val
        .split(/[,|]/g)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [];
  };

  const uniq = (arr) => Array.from(new Set((arr || []).filter(Boolean)));

  const pickFirstName = (fullName) => {
    const n = String(fullName || "").trim();
    if (!n) return "";
    return n.split(" ")[0] || "";
  };

  const containsAnyKeyword = (haystack, keywords) => {
    const h = String(haystack || "").toLowerCase();
    if (!h) return false;
    return (keywords || []).some((k) =>
      h.includes(String(k || "").toLowerCase())
    );
  };

  const getCandidateSkills = (c) => {
    const pools = []
      .concat(normalizeList(c?.skills))
      .concat(normalizeList(c?.topSkills))
      .concat(normalizeList(c?.skillTags))
      .concat(normalizeList(c?.profile?.skills))
      .concat(normalizeList(c?.resume?.skills));
    return uniq(pools).slice(0, 24);
  };

  const getCandidateLanguages = (c) => {
    const pools = []
      .concat(normalizeList(c?.languages))
      .concat(normalizeList(c?.profile?.languages));
    return uniq(pools).slice(0, 12);
  };

  const getCandidateEducation = (c) => {
    const pools = []
      .concat(normalizeList(c?.education))
      .concat(normalizeList(c?.educationList))
      .concat(normalizeList(c?.degrees))
      .concat(normalizeList(c?.profile?.education))
      .concat(normalizeList(c?.profile?.educationList))
      .concat(normalizeList(c?.resume?.education))
      .concat(normalizeList(c?.resume?.educationList));
    return uniq(pools).slice(0, 24);
  };

  const getCandidateSummaryText = (c) => {
    return (
      c?.summary ||
      c?.headline ||
      c?.about ||
      c?.profile?.summary ||
      c?.profile?.headline ||
      ""
    );
  };

  const getCandidateTrajectory = (c) => {
    if (Array.isArray(c?.trajectory)) return c.trajectory;
    if (Array.isArray(c?.careerPath)) return c.careerPath;

    const wh = c?.workHistory || c?.experience || c?.profile?.workHistory || [];
    if (!Array.isArray(wh)) return [];

    return wh
      .filter(Boolean)
      .slice(0, 6)
      .map((t) => ({
        title: t.title || t.role || "",
        company: t.company || t.employer || "",
        from: t.from || t.start || t.startDate || "",
        to: t.to || t.end || t.endDate || "",
      }))
      .filter((t) => t.title || t.company);
  };

  const buildFiltersTriggered = () => {
    const filters = [];
    if (nameQuery) filters.push(`Name/role: ${nameQuery}`);
    if (locQuery) filters.push(`Location: ${locQuery}`);
    if (boolQuery) filters.push(`Advanced query: ${boolQuery}`);
    if (summaryKeywords) filters.push(`Summary keywords: ${summaryKeywords}`);
    if (jobTitle) filters.push(`Job title: ${jobTitle}`);
    if (workStatus) filters.push(`Work status: ${workStatus}`);
    if (preferredWorkType) filters.push(`Work type: ${preferredWorkType}`);
    if (willingToRelocate) filters.push(`Relocate: ${willingToRelocate}`);
    if (skills) filters.push(`Skills: ${skills}`);
    if (languages) filters.push(`Languages: ${languages}`);
    if (education) filters.push(`Education: ${education}`);
    return filters;
  };

  const personalizeWhyExplain = (candidate, baseExplain) => {
    const c = candidate || {};
    const ex =
      baseExplain && typeof baseExplain === "object" ? { ...baseExplain } : {};

    const firstName = pickFirstName(c?.name);
    const candidateTitle = c?.currentTitle || c?.title || c?.role || "";
    const candidateLocation = c?.location || c?.city || c?.region || "";

    if (typeof c?.match === "number") {
      ex.score = c.match;
    } else if (typeof ex?.score !== "number") {
      ex.score = 0;
    }

    ex.filters_triggered = buildFiltersTriggered();

    const filterSkills = normalizeList(skills);
    const candSkills = getCandidateSkills(c);

    const matched = filterSkills.length
      ? uniq(
          filterSkills.filter((s) =>
            candSkills.map((x) => x.toLowerCase()).includes(s.toLowerCase())
          )
        )
      : candSkills.slice(0, 8);

    const gaps = filterSkills.length
      ? uniq(
          filterSkills.filter(
            (s) =>
              !candSkills.map((x) => x.toLowerCase()).includes(s.toLowerCase())
          )
        ).slice(0, 10)
      : [];

    ex.skills =
      ex.skills && typeof ex.skills === "object" ? { ...ex.skills } : {};
    ex.skills.matched =
      (ex.skills.matched && ex.skills.matched.length
        ? ex.skills.matched
        : matched) || [];
    ex.skills.gaps =
      (ex.skills.gaps && ex.skills.gaps.length ? ex.skills.gaps : gaps) || [];
    ex.skills.transferable =
      (ex.skills.transferable && ex.skills.transferable.length
        ? ex.skills.transferable
        : []) || [];

    const traj = getCandidateTrajectory(c);
    if (!Array.isArray(ex.trajectory) || ex.trajectory.length === 0) {
      ex.trajectory = traj;
    }

    const baseSummary = String(ex.summary || "").trim();
    const needsBetterSummary =
      !baseSummary ||
      baseSummary.toLowerCase().includes("candidate") ||
      baseSummary.toLowerCase().includes("strong match") ||
      baseSummary.toLowerCase().includes("recommended");

    if (needsBetterSummary) {
      const parts = [];
      if (candidateTitle) parts.push(`title alignment (${candidateTitle})`);
      if (candidateLocation) parts.push(`location fit (${candidateLocation})`);
      if (matched?.length)
        parts.push(`skills overlap (${matched.slice(0, 4).join(", ")})`);
      if (jobTitle) parts.push(`target role signal (${jobTitle})`);

      const join = parts.length ? parts.join(", ") : "available profile signals";
      ex.summary = `${firstName || "Candidate"} recommended based on ${join}.`;
    } else if (firstName && !baseSummary.startsWith(`${firstName}:`)) {
      ex.summary = `${firstName}: ${baseSummary}`;
    }

    const baseReasons = Array.isArray(ex.reasons) ? ex.reasons : [];
    const baseLooksEmpty = baseReasons.length === 0;

    const builtReasons = [];

    if (jobTitle || candidateTitle) {
      const req = jobTitle ? `Role alignment: ${jobTitle}` : `Role alignment`;
      const evidence = [];
      if (candidateTitle) {
        evidence.push({
          text: `Current title: ${candidateTitle}`,
          source: "Profile",
        });
      }
      if (c?.title && c?.currentTitle && c?.title !== c?.currentTitle) {
        evidence.push({ text: `Listed role: ${c.title}`, source: "Profile" });
      }
      if (evidence.length) builtReasons.push({ requirement: req, evidence });
    }

    if (filterSkills.length || candSkills.length) {
      const req = filterSkills.length
        ? `Skills match: ${filterSkills.slice(0, 6).join(", ")}`
        : `Skills match`;
      const evidence = [];

      if (matched?.length) {
        evidence.push({
          text: `Matched skills: ${matched.slice(0, 6).join(", ")}`,
          source: "Skills",
        });
      }
      if (gaps?.length) {
        evidence.push({
          text: `Gaps: ${gaps.slice(0, 4).join(", ")}`,
          source: "Skills",
        });
      }
      if (!matched?.length && candSkills.length) {
        evidence.push({
          text: `Top skills listed: ${candSkills.slice(0, 6).join(", ")}`,
          source: "Profile",
        });
      }

      if (evidence.length) builtReasons.push({ requirement: req, evidence });
    }

    const filterEdu = normalizeList(education);
    const candEdu = getCandidateEducation(c);
    if (filterEdu.length || candEdu.length) {
      const req = filterEdu.length
        ? `Education alignment: ${filterEdu.slice(0, 6).join(", ")}`
        : `Education alignment`;
      const evidence = [];
      if (candEdu.length) {
        evidence.push({
          text: `Education listed: ${candEdu.slice(0, 8).join(", ")}`,
          source: "Profile",
        });
      }
      if (evidence.length) builtReasons.push({ requirement: req, evidence });
    }

    if (locQuery || candidateLocation || preferredWorkType) {
      const reqParts = [];
      if (locQuery) reqParts.push(`Location: ${locQuery}`);
      if (preferredWorkType) reqParts.push(`Work type: ${preferredWorkType}`);
      const req = reqParts.length
        ? `Logistics fit: ${reqParts.join(" • ")}`
        : `Logistics fit`;
      const evidence = [];
      if (candidateLocation) {
        evidence.push({
          text: `Candidate location: ${candidateLocation}`,
          source: "Profile",
        });
      }
      if (c?.remotePreference) {
        evidence.push({
          text: `Work preference: ${c.remotePreference}`,
          source: "Profile",
        });
      }
      if (c?.preferredWorkType) {
        evidence.push({
          text: `Work type: ${c.preferredWorkType}`,
          source: "Profile",
        });
      }
      if (evidence.length) builtReasons.push({ requirement: req, evidence });
    }

    const kw = normalizeList(summaryKeywords);
    const summaryText = getCandidateSummaryText(c);
    if (kw.length && summaryText) {
      const hit = containsAnyKeyword(summaryText, kw);
      if (hit) {
        builtReasons.push({
          requirement: `Keyword alignment: ${kw.slice(0, 6).join(", ")}`,
          evidence: [
            {
              text: "Keywords appear in candidate summary/headline.",
              source: "Profile",
            },
          ],
        });
      }
    }

    const filterLang = normalizeList(languages);
    const candLang = getCandidateLanguages(c);
    if (filterLang.length || candLang.length) {
      const req = filterLang.length
        ? `Language alignment: ${filterLang.slice(0, 6).join(", ")}`
        : `Language alignment`;
      const evidence = [];
      if (candLang.length) {
        evidence.push({
          text: `Languages listed: ${candLang.join(", ")}`,
          source: "Profile",
        });
      }
      if (evidence.length) builtReasons.push({ requirement: req, evidence });
    }

    const looksGeneric =
      baseReasons.length &&
      baseReasons.every((r) => {
        const req = String(r?.requirement || "").toLowerCase();
        const ev = Array.isArray(r?.evidence) ? r.evidence : [];
        return !req || req.includes("requirement") || ev.length === 0;
      });

    if (baseLooksEmpty || looksGeneric) {
      ex.reasons = builtReasons.slice(0, 10);
    } else {
      ex.reasons = baseReasons;
    }

    return ex;
  };
  // ---------- END WHY PERSONALIZATION ----------

  const runManualCandidateSearch = async () => {
    setActionError(null);
    setLoadError(null);

    try {
      setManualSearching(true);
      setIsLoading(true);

      const params = buildCandidateParams();

      const res = await fetch(
        `/api/recruiter/candidates${
          params.toString() ? `?${params.toString()}` : ""
        }`
      );

      if (!res.ok) {
        if (process.env.NEXT_PUBLIC_FAKE_CANDIDATES === "1") {
          setCandidates(buildDemoCandidates());
          setLoadError(null);
          return;
        }
        throw new Error(`Failed to load candidates: ${res.status}`);
      }

      const json = await res.json();
      let list = Array.isArray(json.candidates) ? json.candidates : [];

      if (!list.length && process.env.NEXT_PUBLIC_FAKE_CANDIDATES === "1") {
        list = buildDemoCandidates();
      }

      setCandidates(list);
      setLoadError(null);
    } catch (err) {
      console.error("[Candidates] manual search error:", err);

      if (process.env.NEXT_PUBLIC_FAKE_CANDIDATES === "1") {
        setCandidates(buildDemoCandidates());
        setLoadError(null);
      } else {
        setLoadError(
          "We had trouble loading candidates. Contact the Support Team if communication isn't provided in 30 minutes."
        );
      }
    } finally {
      setIsLoading(false);
      setManualSearching(false);
    }
  };

  const startConversation = async (candidate, channel) => {
    if (!candidate) return;

    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": RECRUITER_DEV_USER_ID,
        },
        body: JSON.stringify({
          recipientId: candidate.userId || candidate.id,
          channel,
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        console.error("[Candidates] startConversation error:", res.status, payload);
        alert("We couldn't open a conversation yet. Please try again in a moment.");
        return;
      }

      const json = await res.json();
      const conv = json?.conversation;
      if (!conv || !conv.id) {
        alert("We couldn't open a conversation yet. Please try again in a moment.");
        return;
      }

      const destName = candidate.name || "";
      const firstName = destName.split(" ")[0] || "";
      const prefill = firstName
        ? `Hi ${firstName}, thanks for connecting - I’d love to chat about a role that looks like a strong match for your background.`
        : `Hi there, thanks for connecting - I’d love to chat about a role that looks like a strong match for your background.`;

      if (channel === "recruiter") {
        router.push({
          pathname: "/recruiter/messaging",
          query: {
            c: conv.id,
            candidateId: candidate.id,
            toUserId: conv.otherUser?.id || "",
            name: destName,
            role: candidate.role || candidate.title || "",
            prefill,
          },
        });
      } else {
        router.push({
          pathname: "/seeker/messages",
          query: {
            c: conv.id,
            toUserId: conv.otherUser?.id || "",
            name: destName,
            role: candidate.role || candidate.title || "",
            prefill,
          },
        });
      }
    } catch (err) {
      console.error("[Candidates] startConversation error:", err);
      alert("We couldn't open a conversation yet. Please try again in a moment.");
    }
  };

  const onMessage = (c) => {
    if (!c) return;
    setPersonaCandidate(c);
    setPersonaOpen(true);
  };

  useEffect(() => {
    let isMounted = true;

    async function fetchCandidates() {
      try {
        setIsLoading(true);
        setLoadError(null);

        const params = buildCandidateParams();

        const res = await fetch(
          `/api/recruiter/candidates${
            params.toString() ? `?${params.toString()}` : ""
          }`
        );

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

        if (!list.length && process.env.NEXT_PUBLIC_FAKE_CANDIDATES === "1") {
          list = buildDemoCandidates();
        }

        setCandidates(list);
        setLoadError(null);
      } catch (err) {
        console.error("[Candidates] load error:", err);
        if (!isMounted) return;

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
  }, [
    nameQuery,
    locQuery,
    boolQuery,
    summaryKeywords,
    jobTitle,
    workStatus,
    preferredWorkType,
    willingToRelocate,
    skills,
    languages,
    education,
  ]);

  useEffect(() => {
    let isMounted = true;

    async function loadAutomation() {
      try {
        const res = await fetch("/api/recruiter/candidates/automation");
        if (!res.ok) return;

        const json = await res.json();
        if (!isMounted) return;

        const automation = json?.automation;
        if (!automation) return;

        setAutomationEnabled(Boolean(automation.enabled));
        setAutomationName(automation.name || "");

        const filters = automation.filters || {};
        if (typeof filters.summaryKeywords === "string") {
          setSummaryKeywords(filters.summaryKeywords);
        }
        if (typeof filters.jobTitle === "string") {
          setJobTitle(filters.jobTitle);
        }
        if (typeof filters.workStatus === "string") {
          setWorkStatus(filters.workStatus);
        }
        if (typeof filters.preferredWorkType === "string") {
          setPreferredWorkType(filters.preferredWorkType);
        }
        if (typeof filters.relocate === "string") {
          setWillingToRelocate(filters.relocate);
        }
        if (typeof filters.skills === "string") {
          setSkills(filters.skills);
        }
        if (typeof filters.languages === "string") {
          setLanguages(filters.languages);
        }
        if (typeof filters.education === "string") {
          setEducation(filters.education);
        }
      } catch (err) {
        console.error("[Candidates] automation load error:", err);
      }
    }

    loadAutomation();
    return () => {
      isMounted = false;
    };
  }, []);

  const saveNotes = async (id, text) => {
    setActionError(null);
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

  const toggleTag = async (id, tag) => {
    setActionError(null);

    let updatedTags = null;

    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const currentTags = Array.isArray(c.tags) ? c.tags : [];
        const has = currentTags.includes(tag);
        const next = has ? currentTags.filter((t) => t !== tag) : [...currentTags, tag];
        updatedTags = next;
        return { ...c, tags: next };
      })
    );

    if (!updatedTags) return;

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

  const [whyOpen, setWhyOpen] = useState(false);
  const [whyData, setWhyData] = useState(null);
  const [whyCandidate, setWhyCandidate] = useState(null);

  const fetchWhyExplainForCandidate = async (c) => {
    if (!c) return getMockExplain();

    let ex;

    try {
      const res = await fetch("/api/recruiter/candidates/why", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: c.id,
          jobId: null,
          filters: {
            q: nameQuery || null,
            location: locQuery || null,
            bool: boolQuery || null,
            summaryKeywords: summaryKeywords || null,
            jobTitle: jobTitle || null,
            workStatus: workStatus || null,
            preferredWorkType: preferredWorkType || null,
            relocate: willingToRelocate || null,
            skills: skills || null,
            languages: languages || null,
            education: education || null,
          },
        }),
      });

      if (!res.ok) {
        throw new Error(`WHY API failed (status ${res.status})`);
      }

      ex = await res.json();
    } catch (err) {
      console.error("[Candidates] WHY API error:", err);
      ex = getMockExplain();
    }

    ex = personalizeWhyExplain(c, ex);
    return ex;
  };

  const onWhy = async (c) => {
    if (whyMode === "off") return;
    if (!hasWhyFull && whyCreditsLeft === 0) return;

    const ex = await fetchWhyExplainForCandidate(c);

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
      Analytics.logWhyOpened({
        ...evt,
        score: ex.score,
        mode: whyMode,
        explain: ex,
      });
    } else if (typeof Analytics.logEvent === "function") {
      Analytics.logEvent(evt);
    }

    if (!hasWhyFull) {
      setWhyCreditsLeft((n) => Math.max(0, (n || 0) - 1));
    }
  };

  const [compareSelectedIds, setCompareSelectedIds] = useState([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareCandidates, setCompareCandidates] = useState({
    a: null,
    b: null,
  });
  const [compareExplains, setCompareExplains] = useState({
    a: null,
    b: null,
  });

  const resetCompare = () => {
    setCompareOpen(false);
    setCompareSelectedIds([]);
    setCompareCandidates({ a: null, b: null });
    setCompareExplains({ a: null, b: null });
  };

  const openCompareForTwo = async (aCandidate, bCandidate) => {
    if (!aCandidate || !bCandidate) return;
    if (whyMode === "off") return;
    if (!hasWhyFull && (whyCreditsLeft || 0) < 2) return;

    const [aExplain, bExplain] = await Promise.all([
      fetchWhyExplainForCandidate(aCandidate),
      fetchWhyExplainForCandidate(bCandidate),
    ]);

    setCompareCandidates({ a: aCandidate, b: bCandidate });
    setCompareExplains({ a: aExplain, b: bExplain });
    setCompareOpen(true);

    if (!hasWhyFull) {
      setWhyCreditsLeft((n) => Math.max(0, (n || 0) - 2));
    }
  };

  const onToggleCompare = async (candidate) => {
    if (!candidate?.id) return;

    setActionError(null);

    setCompareSelectedIds((prev) => {
      const id = candidate.id;
      const has = prev.includes(id);

      if (has) {
        const next = prev.filter((x) => x !== id);
        if (compareOpen) {
          setTimeout(() => resetCompare(), 0);
        }
        return next;
      }

      if (prev.length === 0) {
        return [id];
      }

      if (prev.length === 1) {
        const firstId = prev[0];
        const firstCandidate = candidates.find((c) => c.id === firstId) || null;
        const secondCandidate = candidate;

        setTimeout(() => {
          openCompareForTwo(firstCandidate, secondCandidate);
        }, 0);

        return [firstId, id];
      }

      if (prev.length >= 2) {
        const firstId = prev[0];
        const firstCandidate = candidates.find((c) => c.id === firstId) || null;
        const secondCandidate = candidate;

        setTimeout(() => {
          openCompareForTwo(firstCandidate, secondCandidate);
        }, 0);

        return [firstId, id];
      }

      return prev;
    });
  };

  // Search tools panel now includes Results (count, chips, clear actions)
  const FiltersRow = (
    <GlassPanel className="mb-3 px-5 py-4 sm:px-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs tracking-wide uppercase text-slate-500">
              Quick filters
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-900">
              Search and Filters
            </div>
            <div className="text-xs text-slate-600">
              Use quick filters for breadth. Use targeting for precision.
            </div>
          </div>
          <div className="text-[11px] px-2 py-0.5 rounded-full border border-white/40 bg-white/60 text-slate-700">
            {isEnterprise ? "Enterprise" : "SMB"}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Search by name or role..."
            className="border border-white/40 bg-white/70 rounded-xl px-3 py-2 text-sm w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
            value={nameQuery}
            onChange={(e) => setNameQuery(e.target.value)}
          />
          <input
            type="text"
            placeholder="Filter by location..."
            className="border border-white/40 bg-white/70 rounded-xl px-3 py-2 text-sm w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
            value={locQuery}
            onChange={(e) => setLocQuery(e.target.value)}
          />

          {isEnterprise ? (
            <div className="flex flex-col">
              <input
                type="text"
                placeholder="Advanced query (Enterprise)..."
                className="border border-white/40 bg-white/70 rounded-xl px-3 py-2 text-sm w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
                value={boolQuery}
                onChange={(e) => setBoolQuery(e.target.value)}
              />
              <div className="mt-1 text-xs text-slate-500">
                Example: ("customer success" OR CSM) AND SaaS AND -intern
              </div>
            </div>
          ) : (
            <FeatureLock label="Advanced query">
              <input
                type="text"
                placeholder="Advanced query (Enterprise-only)"
                className="border border-white/40 rounded-xl px-3 py-2 text-sm w-full bg-gray-100 cursor-not-allowed"
                disabled
              />
            </FeatureLock>
          )}
        </div>

        {/* Results live inside Search tools */}
        <div className="pt-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs tracking-wide uppercase text-slate-500">
                Results
              </div>
              <div className="mt-1 text-xs text-slate-600">
                {isLoading ? (
                  "Updating..."
                ) : (
                  <>
                    {candidates.length} candidate{candidates.length === 1 ? "" : "s"} in view
                    {compareSelectedIds.length
                      ? ` - ${compareSelectedIds.length} selected for compare`
                      : ""}
                    .
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {manualSearching ? (
                <span className="text-[11px] px-2 py-0.5 rounded-full border border-white/40 bg-white/60 text-slate-700">
                  Searching...
                </span>
              ) : null}

              {(nameQuery || locQuery || boolQuery) && (
                <button
                  type="button"
                  onClick={clearSearchFilters}
                  className="text-xs px-2.5 py-1 rounded-full border border-white/40 bg-white/60 text-slate-700 hover:bg-white/80"
                >
                  Clear search
                </button>
              )}
              {hasAnyTargeting && (
                <button
                  type="button"
                  onClick={clearTargeting}
                  className="text-xs px-2.5 py-1 rounded-full border border-white/40 bg-white/60 text-slate-700 hover:bg-white/80"
                >
                  Clear targeting
                </button>
              )}
            </div>
          </div>

          {activeChips.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {activeChips.slice(0, 10).map((chip) => (
                <span
                  key={chip.key}
                  className="text-[11px] px-2 py-0.5 rounded-full border border-white/35 bg-white/55 text-slate-700"
                  title={chip.label}
                >
                  {chip.label}
                </span>
              ))}
              {activeChips.length > 10 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full border border-white/35 bg-white/55 text-slate-500">
                  +{activeChips.length - 10} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </GlassPanel>
  );

  const saveAutomationConfig = async () => {
    setAutomationMessage(null);
    setActionError(null);

    try {
      setAutomationSaving(true);

      const payload = {
        name: automationName || null,
        enabled: automationEnabled,
        filters: {
          q: nameQuery || null,
          location: locQuery || null,
          bool: boolQuery || null,
          summaryKeywords: summaryKeywords || null,
          jobTitle: jobTitle || null,
          workStatus: workStatus || null,
          preferredWorkType: preferredWorkType || null,
          relocate: willingToRelocate || null,
          skills: skills || null,
          languages: languages || null,
          education: education || null,
        },
      };

      const res = await fetch("/api/recruiter/candidates/automation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Automation API failed (status ${res.status})`);
      }

      setAutomationMessage(
        "Automation settings saved for your daily candidate feed."
      );
    } catch (err) {
      console.error("[Candidates] automation save error:", err);
      setAutomationMessage(
        "We couldn't save automation settings yet. This feature may not be fully wired on your account."
      );
    } finally {
      setAutomationSaving(false);
    }
  };

  const splitForColumns = (list) => {
    const src = Array.isArray(list) ? list : [];
    const left = [];
    const right = [];
    for (let i = 0; i < src.length; i += 1) {
      (i % 2 === 0 ? left : right).push(src[i]);
    }
    return { left, right };
  };

  const { left: leftCandidates, right: rightCandidates } =
    splitForColumns(candidates);

  return (
    <>
      {loadError && (
        <GlassPanel className="mb-3 px-5 py-3 sm:px-6 border-red-200/50 bg-red-50/60">
          <div className="text-xs text-red-700">{loadError}</div>
        </GlassPanel>
      )}

      {actionError && (
        <GlassPanel className="mb-3 px-5 py-3 sm:px-6 border-amber-200/50 bg-amber-50/60">
          <div className="text-xs text-amber-800">{actionError}</div>
        </GlassPanel>
      )}

      {FiltersRow}

      <CandidateTargetingPanel
        filters={{
          summaryKeywords,
          jobTitle,
          workStatus,
          preferredWorkType,
          willingToRelocate,
          skills,
          languages,
          education,
        }}
        setFilters={{
          setSummaryKeywords,
          setJobTitle,
          setWorkStatus,
          setPreferredWorkType,
          setWillingToRelocate,
          setSkills,
          setLanguages,
          setEducation,
        }}
        automation={{
          enabled: automationEnabled,
          setEnabled: setAutomationEnabled,
          name: automationName,
          setName: setAutomationName,
          saving: automationSaving,
          message: automationMessage,
          onSave: saveAutomationConfig,
        }}
        onFindCandidates={runManualCandidateSearch}
        onClearTargeting={clearTargeting}
        manualSearching={manualSearching}
        isLoading={isLoading}
      />

      {isLoading ? (
        <GlassPanel className="px-5 py-8 sm:px-6">
          <div className="text-sm text-slate-700 font-medium">
            Loading candidates...
          </div>
          <div className="mt-2 text-xs text-slate-600">
            Pulling your latest pipeline and signals.
          </div>
        </GlassPanel>
      ) : (
        <>
          {candidates.length === 0 ? (
            <GlassPanel className="px-5 py-10 sm:px-6">
              <div className="text-sm font-semibold text-slate-900">
                No candidates found
              </div>
              <div className="mt-1 text-xs text-slate-600 max-w-2xl">
                Try a broader query, remove a filter, or clear targeting and run
                the search again.
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    clearSearchFilters();
                    clearTargeting();
                  }}
                  className="text-xs px-3 py-1.5 rounded-full border border-white/40 bg-white/60 text-slate-700 hover:bg-white/80"
                >
                  Clear all filters
                </button>

                <button
                  type="button"
                  onClick={runManualCandidateSearch}
                  className="text-xs px-3 py-1.5 rounded-full border border-[#FF7043]/25 bg-[#FFEDE6]/70 text-[#FF7043] hover:bg-[#FFEDE6]/90"
                >
                  Run search
                </button>
              </div>
            </GlassPanel>
          ) : (
            <div className="pt-0">
              <div className="block lg:hidden">
                <CandidateList
                  candidates={candidates}
                  isEnterprise={isEnterprise}
                  onView={onView}
                  onMessage={onMessage}
                  onWhy={onWhy}
                  onToggleCompare={onToggleCompare}
                  compareSelectedIds={compareSelectedIds}
                  showFilters={false}
                  showFilterBar={false}
                  filtersVisible={false}
                  query={nameQuery}
                  locationFilter={locQuery}
                  booleanQuery={boolQuery}
                />
              </div>

              <div className="hidden lg:grid lg:grid-cols-2 gap-4">
                <CandidateList
                  candidates={leftCandidates}
                  isEnterprise={isEnterprise}
                  onView={onView}
                  onMessage={onMessage}
                  onWhy={onWhy}
                  onToggleCompare={onToggleCompare}
                  compareSelectedIds={compareSelectedIds}
                  showFilters={false}
                  showFilterBar={false}
                  filtersVisible={false}
                  query={nameQuery}
                  locationFilter={locQuery}
                  booleanQuery={boolQuery}
                />
                <CandidateList
                  candidates={rightCandidates}
                  isEnterprise={isEnterprise}
                  onView={onView}
                  onMessage={onMessage}
                  onWhy={onWhy}
                  onToggleCompare={onToggleCompare}
                  compareSelectedIds={compareSelectedIds}
                  showFilters={false}
                  showFilterBar={false}
                  filtersVisible={false}
                  query={nameQuery}
                  locationFilter={locQuery}
                  booleanQuery={boolQuery}
                />
              </div>
            </div>
          )}
        </>
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

      <WhyCandidateCompareDrawer
        open={compareOpen}
        onClose={resetCompare}
        mode={whyMode}
        left={{
          candidate: compareCandidates?.a,
          explain: compareExplains?.a,
        }}
        right={{
          candidate: compareCandidates?.b,
          explain: compareExplains?.b,
        }}
        onViewLeft={() => {
          if (compareCandidates?.a) {
            setSelected(compareCandidates.a);
            setOpen(true);
          }
        }}
        onViewRight={() => {
          if (compareCandidates?.b) {
            setSelected(compareCandidates.b);
            setOpen(true);
          }
        }}
      />

      <PersonaChoiceModal
        open={personaOpen}
        targetName={personaCandidate?.name}
        description="Recruiter messages stay in your Recruiter Suite inbox. Personal messages go to your Signal inbox so you can network as yourself."
        primaryLabel="Use Recruiter inbox"
        secondaryLabel="Use Personal inbox (Signal)"
        onClose={() => {
          setPersonaOpen(false);
          setPersonaCandidate(null);
        }}
        onPrimary={async () => {
          const c = personaCandidate;
          setPersonaOpen(false);
          setPersonaCandidate(null);
          if (c) await startConversation(c, "recruiter");
        }}
        onSecondary={async () => {
          const c = personaCandidate;
          setPersonaOpen(false);
          setPersonaCandidate(null);
          if (c) await startConversation(c, "personal");
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
        title="Candidates - ForgeTomorrow"
        header={<HeaderOnly />}
        right={<RightCard />}
        activeNav="candidates"
      >
        <Body />
      </RecruiterLayout>
    </PlanProvider>
  );
}
