// pages/recruiter/candidates.js
import { useState, useEffect } from "react";
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
            {isFull
              ? "Full rationale enabled"
              : "Lite rationale (top reasons only)"}
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

  // Targeting/automation panel state
  const [targetingOpen, setTargetingOpen] = useState(false);
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

    return params;
  };

  // ---------- WHY PERSONALIZATION (client-side, deterministic) ----------
  const normalizeList = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val.filter(Boolean).map(String);
    if (typeof val === "string") {
      // supports comma-separated or pipe-separated
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

  // Pull whatever we can safely from candidate shape without assuming too much.
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
    // Prefer explicit trajectory if present
    if (Array.isArray(c?.trajectory)) return c.trajectory;
    if (Array.isArray(c?.careerPath)) return c.careerPath;

    // Try to map common work history shapes
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
    if (boolQuery) filters.push(`Boolean: ${boolQuery}`);
    if (summaryKeywords) filters.push(`Summary keywords: ${summaryKeywords}`);
    if (jobTitle) filters.push(`Job title: ${jobTitle}`);
    if (workStatus) filters.push(`Work status: ${workStatus}`);
    if (preferredWorkType) filters.push(`Work type: ${preferredWorkType}`);
    if (willingToRelocate) filters.push(`Relocate: ${willingToRelocate}`);
    if (skills) filters.push(`Skills: ${skills}`);
    if (languages) filters.push(`Languages: ${languages}`);
    return filters;
  };

  const personalizeWhyExplain = (candidate, baseExplain) => {
    const c = candidate || {};
    const ex =
      baseExplain && typeof baseExplain === "object" ? { ...baseExplain } : {};

    const firstName = pickFirstName(c?.name);
    const candidateTitle = c?.currentTitle || c?.title || c?.role || "";
    const candidateLocation = c?.location || c?.city || c?.region || "";

    // Always set score from candidate match if present (keeps UI consistent)
    if (typeof c?.match === "number") {
      ex.score = c.match;
    } else if (typeof ex?.score !== "number") {
      ex.score = 0;
    }

    // Build filter snapshot for the drawer (this drives “Matched your filters” chips)
    ex.filters_triggered = buildFiltersTriggered();

    // Skills: use explicit explain.skills if present; otherwise build from candidate + recruiter filter input
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

    // Trajectory (full mode uses it)
    const traj = getCandidateTrajectory(c);
    if (!Array.isArray(ex.trajectory) || ex.trajectory.length === 0) {
      ex.trajectory = traj;
    }

    // Summary: if API gave us something generic, make it candidate + filter aware
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
      // Keep original if it’s good, just prefix consistently
      ex.summary = `${firstName}: ${baseSummary}`;
    }

    // Reasons/evidence: if API returned nothing (or generic), construct explainable reasons
    const baseReasons = Array.isArray(ex.reasons) ? ex.reasons : [];
    const baseLooksEmpty = baseReasons.length === 0;

    const builtReasons = [];

    // Title alignment reason
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

    // Skills alignment reason (use filter skills if present)
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

    // Location / work type reason
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

    // Summary keywords reason (only if we can actually see the text)
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

    // Languages reason
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

    // If we got real reasons from API, keep them, but ensure they’re not empty shells
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

  // Manual trigger: run search now using all current fields
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

  // Central function to create/open conversation, then route
  const startConversation = async (candidate, channel) => {
    if (!candidate) return;

    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // DEV-ONLY auth stub; replaced by real auth later
          "x-user-id": RECRUITER_DEV_USER_ID,
        },
        body: JSON.stringify({
          recipientId: candidate.userId || candidate.id,
          channel,
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        console.error(
          "[Candidates] startConversation error:",
          res.status,
          payload
        );
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
        ? `Hi ${firstName}, thanks for connecting — I’d love to chat about a role that looks like a strong match for your background.`
        : `Hi there, thanks for connecting — I’d love to chat about a role that looks like a strong match for your background.`;

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

  // Message → open Persona choice modal
  const onMessage = (c) => {
    if (!c) return;
    setPersonaCandidate(c);
    setPersonaOpen(true);
  };

  // Load candidates from Prisma-backed API (with filters)
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
  ]);

  // NEW: load saved automation config on mount
  useEffect(() => {
    let isMounted = true;

    async function loadAutomation() {
      try {
        const res = await fetch("/api/recruiter/candidates/automation");
        if (!res.ok) return; // soft-fail if not wired yet

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
          // backend uses `relocate`; UI state is `willingToRelocate`
          setWillingToRelocate(filters.relocate);
        }
        if (typeof filters.skills === "string") {
          setSkills(filters.skills);
        }
        if (typeof filters.languages === "string") {
          setLanguages(filters.languages);
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

  // WHY drawer + instrumentation (API + mock fallback)
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
        // Phase 1: no specific job context yet → jobId: null
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

    // Ensure WHY is not generic: deterministically personalize with candidate + current filters
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
      Analytics.logWhyOpened({ ...evt, score: ex.score, mode: whyMode, explain: ex });
    } else if (typeof Analytics.logEvent === "function") {
      Analytics.logEvent(evt);
    }

    if (!hasWhyFull) {
      setWhyCreditsLeft((n) => Math.max(0, (n || 0) - 1));
    }
  };

  // ---------- COMPARE (NEW) ----------
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

    // If WHY is off, don't allow compare to open (compare is literally 2 WHY panels)
    if (whyMode === "off") return;

    // Credit gate (SMB): needs at least 2 credits to compare 2 candidates
    if (!hasWhyFull && (whyCreditsLeft || 0) < 2) return;

    const [aExplain, bExplain] = await Promise.all([
      fetchWhyExplainForCandidate(aCandidate),
      fetchWhyExplainForCandidate(bCandidate),
    ]);

    setCompareCandidates({ a: aCandidate, b: bCandidate });
    setCompareExplains({ a: aExplain, b: bExplain });
    setCompareOpen(true);

    // Credits: decrement by 2 for compare (one per candidate)
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

      // If toggling OFF the candidate: remove it and close compare if it was open
      if (has) {
        const next = prev.filter((x) => x !== id);
        // If compare is open, closing resets per your spec
        if (compareOpen) {
          // we reset after state update tick
          setTimeout(() => resetCompare(), 0);
        }
        return next;
      }

      // Toggling ON
      if (prev.length === 0) {
        return [id];
      }

      // When 2nd candidate selected → trigger compare immediately
      if (prev.length === 1) {
        const firstId = prev[0];
        const firstCandidate = candidates.find((c) => c.id === firstId) || null;
        const secondCandidate = candidate;

        // Open compare after state updates
        setTimeout(() => {
          openCompareForTwo(firstCandidate, secondCandidate);
        }, 0);

        return [firstId, id];
      }

      // If already 2 selected, replace the 2nd with the newly clicked one (keeps it simple & predictable)
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
  // ---------- END COMPARE ----------

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

  // Save automation config (soft-fails if API not present)
  const saveAutomationConfig = async () => {
    setAutomationMessage(null);
    setActionError(null);

    try {
      setAutomationSaving(true);

      const payload = {
        name: automationName || null,
        enabled: automationEnabled,
        // Filters used for the daily feed (safe fields only)
        filters: {
          q: nameQuery || null,
          location: locQuery || null,
          bool: boolQuery || null,
          summaryKeywords: summaryKeywords || null,
          jobTitle: jobTitle || null,
          workStatus: workStatus || null,
          preferredWorkType: preferredWorkType || null,
          relocate: willingToRelocate || null, // backend key is `relocate`
          skills: skills || null,
          languages: languages || null,
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

      setAutomationMessage("Automation settings saved for your daily candidate feed.");
    } catch (err) {
      console.error("[Candidates] automation save error:", err);
      setAutomationMessage(
        "We couldn't save automation settings yet. This feature may not be fully wired on your account."
      );
    } finally {
      setAutomationSaving(false);
    }
  };

  // ---------- NEW: desktop 2-column layout split (layout-only) ----------
  const splitForColumns = (list) => {
    const src = Array.isArray(list) ? list : [];
    const left = [];
    const right = [];
    for (let i = 0; i < src.length; i += 1) {
      (i % 2 === 0 ? left : right).push(src[i]);
    }
    return { left, right };
  };

  const { left: leftCandidates, right: rightCandidates } = splitForColumns(candidates);
  // ---------- END: desktop 2-column layout split ----------

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

      {/* Candidate targeting + automation panel */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setTargetingOpen((open) => !open)}
          className="flex w-full items-center justify-between rounded-md border border-slate-300 bg-white/90 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 shadow-sm hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
        >
          <span>Candidate targeting &amp; automation (profile-based filters)</span>
          <span className="ml-2 text-[11px] text-slate-500">
            {targetingOpen ? "Hide" : "Show options"}
          </span>
        </button>

        {targetingOpen && (
          <div className="mt-3 rounded-lg border border-slate-200 bg-white/95 p-4 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Summary keywords
                </label>
                <input
                  type="text"
                  value={summaryKeywords}
                  onChange={(e) => setSummaryKeywords(e.target.value)}
                  placeholder="e.g., customer success, onboarding, renewals"
                  className="w-full rounded border px-2 py-1.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Job title
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g., Customer Success Manager"
                  className="w-full rounded border px-2 py-1.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Current work status
                </label>
                <select
                  value={workStatus}
                  onChange={(e) => setWorkStatus(e.target.value)}
                  className="w-full rounded border px-2 py-1.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
                >
                  <option value="">Any status</option>
                  <option value="employed">Employed</option>
                  <option value="unemployed">Actively looking</option>
                  <option value="student">Student</option>
                  <option value="contractor">Contractor / Freelance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Preferred work type
                </label>
                <select
                  value={preferredWorkType}
                  onChange={(e) => setPreferredWorkType(e.target.value)}
                  className="w-full rounded border px-2 py-1.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
                >
                  <option value="">Any type</option>
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                  <option value="temporary">Temporary</option>
                  <option value="remote-only">Remote only</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Willing to relocate
                </label>
                <select
                  value={willingToRelocate}
                  onChange={(e) => setWillingToRelocate(e.target.value)}
                  className="w-full rounded border px-2 py-1.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
                >
                  <option value="">Any</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                  <option value="maybe">Maybe</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Skills (comma-separated)
                </label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="e.g., Salesforce, SQL, Zendesk"
                  className="w-full rounded border px-2 py-1.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Languages (comma-separated)
                </label>
                <input
                  type="text"
                  value={languages}
                  onChange={(e) => setLanguages(e.target.value)}
                  placeholder="e.g., English, Spanish, French"
                  className="w-full rounded border px-2 py-1.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
                />
              </div>
            </div>

            <div className="mt-4 border-t border-slate-200 pt-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input
                    id="automationEnabled"
                    type="checkbox"
                    checked={automationEnabled}
                    onChange={(e) => setAutomationEnabled(e.target.checked)}
                    className="h-3 w-3 rounded border-slate-400 text-[#FF7043] focus:ring-[#FF7043]"
                  />
                  <label
                    htmlFor="automationEnabled"
                    className="text-xs text-slate-700"
                  >
                    Enable daily candidate feed using these filters
                  </label>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Automation name (optional)
                  </label>
                  <input
                    type="text"
                    value={automationName}
                    onChange={(e) => setAutomationName(e.target.value)}
                    placeholder="e.g., Senior CSM – US remote"
                    className="w-full rounded border px-2 py-1.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 md:justify-end">
                <button
                  type="button"
                  onClick={runManualCandidateSearch}
                  disabled={manualSearching || isLoading}
                  className="rounded-md border border-[#FF7043] bg-white px-3 py-1.5 text-xs sm:text-sm font-medium text-[#FF7043] hover:bg-[#FFF3EF] disabled:opacity-60"
                >
                  {manualSearching ? "Finding…" : "Find Candidates"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSummaryKeywords("");
                    setJobTitle("");
                    setWorkStatus("");
                    setPreferredWorkType("");
                    setWillingToRelocate("");
                    setSkills("");
                    setLanguages("");
                  }}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-xs sm:text-sm text-slate-700 hover:bg-slate-50"
                >
                  Clear targeting
                </button>

                <button
                  type="button"
                  onClick={saveAutomationConfig}
                  disabled={automationSaving}
                  className="rounded-md bg-[#FF7043] px-3 py-1.5 text-xs sm:text-sm font-medium text-white shadow-sm hover:bg-[#f45c28] disabled:opacity-60"
                >
                  {automationSaving ? "Saving…" : "Save automation"}
                </button>
              </div>
            </div>

            {automationMessage && (
              <p className="mt-2 text-[11px] text-slate-600">{automationMessage}</p>
            )}

            <p className="mt-2 text-[11px] text-slate-500">
              ForgeTomorrow never filters candidates by name, hobbies or interests,
              previous employers, birthdays or age, or pronouns. Those details may
              appear in a profile but are not used for search or automation.
            </p>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="text-sm text-slate-600">Loading candidates...</div>
      ) : (
        <>
          {/* Mobile/tablet: single list */}
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

          {/* Desktop: 2-column list */}
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
        </>
      )}

      <CandidateProfileModal
        open={open}
        onClose={() => setOpen(false)}
        candidate={selected}
        onSaveNotes={saveNotes}
        onToggleTag={toggleTag}
      />

      {/* Single WHY drawer */}
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

      {/* Compare WHY drawer (RIGHT-side, 2 panels) */}
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
        title="Candidates — ForgeTomorrow"
        header={<HeaderOnly />}
        right={<RightCard whyMode={undefined} creditsLeft={undefined} />}
        activeNav="candidates" // 🔸 highlight "Candidates" in Recruiter sidebar
      >
        <Body />
      </RecruiterLayout>
    </PlanProvider>
  );
}
