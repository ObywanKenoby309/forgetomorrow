// lib/intelligence/buildPromptContext.js
//
// ForgeTomorrow Unified Career Intelligence — Stage 4
// Converts full career context into a compact, prompt-safe summary for AI tool injection.
// Token-controlled. No full resume content. No full roadmap JSON. No full aboutMe.
// Read-only. No AI calls. No localStorage. Never throws.
//
// Usage:
//   const prompt = await buildPromptContext({ userId });
//   if (!prompt) { /* no context available */ }

import buildCareerContext from '@/lib/intelligence/buildCareerContext';

// ─── Safe helpers ──────────────────────────────────────────────────────────────
function ss(value, fallback = '') {
  try {
    return typeof value === 'string' ? value.trim() : fallback;
  } catch {
    return fallback;
  }
}

function sa(value) {
  try {
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function truncate(str, max = 180) {
  try {
    const s = ss(str);
    return s.length > max ? s.slice(0, max).trimEnd() + '…' : s;
  } catch {
    return '';
  }
}

// Safe object-or-array helper
// If array → return as-is. If object → return Object.values(). Else → [].
function safeObjOrArr(value) {
  try {
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object') return Object.values(value);
    return [];
  } catch {
    return [];
  }
}

// Extract a display label from a skill/cert/project/education item
function extractLabel(item) {
  try {
    if (!item) return '';
    if (typeof item === 'string') return item.trim();
    return ss(
      item.name || item.label || item.skill || item.title ||
      item.certification || item.projectName || item.degree || ''
    );
  } catch {
    return '';
  }
}

// Collect arrays from roadmap data — handles nested day30/day60/day90 structures
function collectRoadmapArray(data, key) {
  try {
    if (!data || typeof data !== 'object') return [];
    const results = [];
    // Top-level key
    const top = data[key];
    if (Array.isArray(top)) results.push(...top);
    // Nested day buckets
    for (const bucket of ['day30', 'day60', 'day90']) {
      const nested = data[bucket];
      if (nested && typeof nested === 'object' && Array.isArray(nested[key])) {
        results.push(...nested[key]);
      }
    }
    return results.filter(Boolean);
  } catch {
    return [];
  }
}

// ─── Positioning ───────────────────────────────────────────────────────────────
// Derives a compact positioning block from user + profile + resume + history
function buildPositioning(ctx) {
  try {
    const user     = ctx.user    || {};
    const profile  = ctx.profile || {};
    const history  = ctx.history || {};
    const resume   = ctx.resume  || null;

    // Current headline — prefer live headline, fall back to latest snapshot
    const currentHeadline =
      ss(user.headline) ||
      ss(sa(history.profileSnapshots)[0]?.headline) ||
      '';

    // Current role signal — infer from headline or resume name
    const currentRoleSignal =
      ss(user.headline).split('|')[0].split('–')[0].split('-')[0].trim() ||
      ss(resume?.name) ||
      '';

    // Work status — from workPreferences if available
    const prefs = profile.workPreferences || {};
    const workStatus = ss(
      prefs.status || prefs.workStatus || prefs.availability || prefs.openTo || ''
    );

    // Target role — from roadmap data if available
    const latestRoadmap = sa(history.roadmaps)[0];
    const roadmapData   = (latestRoadmap?.data && typeof latestRoadmap.data === 'object')
      ? latestRoadmap.data : {};
    const targetRole = ss(
      roadmapData.targetRole ||
      roadmapData.targetTitle ||
      roadmapData.targetPosition ||
      roadmapData.meta?.targetRole ||
      roadmapData.meta?.headline ||
      prefs.targetRole ||
      ''
    );

    // Summary — truncated aboutMe
    const summary = truncate(ss(profile.aboutMe), 300);

    return { currentHeadline, currentRoleSignal, workStatus, targetRole, summary };
  } catch {
    return { currentHeadline: '', currentRoleSignal: '', workStatus: '', targetRole: '', summary: '' };
  }
}

// ─── Proof signals ─────────────────────────────────────────────────────────────
// From: profile skills, certifications, education, projects, languages
// Supplemented by resume skills section when profile signals are thin
function extractProofSignals(profile, resume) {
  try {
    const signals = new Set();

    sa(profile.skills).map(extractLabel).filter(Boolean).slice(0, 12)
      .forEach(s => signals.add(s));

    sa(profile.certifications).map(extractLabel).filter(Boolean).slice(0, 5)
      .forEach(s => signals.add(s));

    sa(profile.education).slice(0, 3).forEach(e => {
      if (!e) return;
      const label = typeof e === 'string'
        ? e
        : [e.degree, e.field || e.major].filter(Boolean).join(' in ');
      if (label.trim()) signals.add(label.trim());
    });

    sa(profile.projects).slice(0, 4).forEach(p => {
      const t = extractLabel(p);
      if (t) signals.add(t);
    });

    sa(profile.languages).map(extractLabel).filter(Boolean).slice(0, 3)
      .forEach(s => signals.add(s));

    // Supplement from resume when profile signals are thin (< 4)
    // Safe: only reads resume.content as parsed JSON — never dumps raw content
    if (signals.size < 4 && resume?.content) {
      try {
        const parsed = typeof resume.content === 'string'
          ? JSON.parse(resume.content) : resume.content;
        const resumeData = parsed?.data || parsed || {};
        const resumeSkills = sa(resumeData.skills || []);
        resumeSkills
          .map(extractLabel)
          .filter(Boolean)
          .slice(0, 6)
          .forEach(s => signals.add(s));
      } catch { /* malformed resume content — skip silently */ }
    }

    return Array.from(signals).slice(0, 8);
  } catch {
    return [];
  }
}

// ─── Relevant wins ─────────────────────────────────────────────────────────────
// From: profile projects (with outcomes), customSections, roadmap actions/metrics
function extractRelevantWins(profile, history) {
  try {
    const wins = [];

    // Profile projects — prefer those with outcome/impact
    sa(profile.projects).slice(0, 6).forEach(p => {
      if (!p) return;
      if (typeof p === 'string') {
        if (p.trim()) wins.push(truncate(p, 120));
        return;
      }
      const title   = extractLabel(p);
      const outcome = ss(p.outcome || p.impact || p.result || p.description || '');
      if (title && outcome) wins.push(truncate(title + ': ' + outcome, 140));
      else if (title)       wins.push(title);
    });

    // Custom sections — surface labeled entries (handles array or object shape)
    safeObjOrArr(profile.customSections).slice(0, 3).forEach(section => {
      if (!section) return;
      const label = extractLabel(section);
      const body  = ss(section.content || section.value || section.description || '');
      if (label && body) wins.push(truncate(label + ': ' + body, 120));
      else if (label)    wins.push(label);
    });

    // Latest roadmap actions + metrics — collected across top-level and day30/60/90
    const latestRoadmap = sa(history.roadmaps)[0];
    if (latestRoadmap?.data && typeof latestRoadmap.data === 'object') {
      const data    = latestRoadmap.data;
      const actions = collectRoadmapArray(data, 'actions');
      const metrics = collectRoadmapArray(data, 'metrics');
      // Actions first, then metrics, capped at 3 combined
      const combined = [...actions, ...metrics].slice(0, 10);
      combined.forEach(a => {
        const label = typeof a === 'string'
          ? a : ss(a.action || a.milestone || a.metric || a.title || '');
        if (!label) return;

        const l = label.toLowerCase();

        // Pivot/direction signals belong in recentToolInsights, not wins
        const isPivot = /pivot|career change|transition|switch|explore.*role|new (field|industry|path)/i.test(l);
        if (isPivot) return;

        // Only include if it looks like a real win:
        // past tense, outcome-based, or metric-based proof
        const isProof =
          l.includes('led') ||
          l.includes('built') ||
          l.includes('created') ||
          l.includes('launched') ||
          l.includes('delivered') ||
          l.includes('improved') ||
          l.includes('increased') ||
          l.includes('reduced') ||
          l.includes('saved') ||
          l.includes('drove') ||
          l.includes('grew') ||
          l.includes('achieved') ||
          l.includes('completed') ||
          l.includes('shipped') ||
          l.includes('established') ||
          l.includes('implemented') ||
          l.includes('%') ||
          l.includes('$') ||
          /\d+x/.test(l);         // e.g. "3x revenue"

        // Instructions, recommendations, and tool suggestions are not wins
        const isInstruction =
          l.startsWith('use ') ||
          l.startsWith('consider ') ||
          l.startsWith('explore ') ||
          l.startsWith('try ') ||
          l.startsWith('focus on ') ||
          l.startsWith('build ') ||
          l.startsWith('develop ') ||
          l.startsWith('refine ') ||
          l.startsWith('update ') ||
          l.startsWith('create a ') ||
          l.includes('forgetomorrow') ||
          l.includes('should ') ||
          l.includes('could ') ||
          l.includes('recommend');

        if (isProof && !isInstruction) wins.push(truncate(label, 120));
      });
    }

    return wins.filter(Boolean).slice(0, 8);
  } catch {
    return [];
  }
}

// ─── Known gaps ────────────────────────────────────────────────────────────────
// From: roadmap risks, empty profile sections, thin history
function extractKnownGaps(profile, history) {
  try {
    const gaps = [];

    // Roadmap risks — collected across top-level and day30/60/90 buckets
    const latestRoadmap = sa(history.roadmaps)[0];
    if (latestRoadmap?.data && typeof latestRoadmap.data === 'object') {
      const data  = latestRoadmap.data;
      const risks = [
        ...collectRoadmapArray(data, 'risks'),
        ...collectRoadmapArray(data, 'gaps'),
        ...collectRoadmapArray(data, 'blockers'),
        ...collectRoadmapArray(data, 'challenges'),
      ];
      risks.slice(0, 4).forEach(r => {
        const label = typeof r === 'string'
          ? r : ss(r.risk || r.gap || r.blocker || r.challenge || r.label || '');
        if (label) gaps.push(truncate(label, 120));
      });
    }

    // Structural gaps — empty profile sections
    if (!sa(profile.skills).length)         gaps.push('No profile skills listed');
    if (!sa(profile.projects).length)       gaps.push('No portfolio projects listed');
    if (!sa(profile.certifications).length) gaps.push('No certifications listed');
    if (!ss(profile.aboutMe))              gaps.push('Profile summary is empty');

    // Thin platform history
    const hasHistory =
      sa(history.roadmaps).length > 0 ||
      sa(history.negotiations).length > 0 ||
      sa(history.profileSnapshots).length > 0;
    if (!hasHistory) gaps.push('No platform tool history — first-time context');

    return gaps.filter(Boolean).slice(0, 8);
  } catch {
    return [];
  }
}

// ─── Recent tool insights ──────────────────────────────────────────────────────
// From: latest roadmap summary, negotiation input/result, profile snapshot, recruiter runs
function extractRecentToolInsights(history) {
  try {
    const insights = [];

    // Latest roadmap — read top-level and day-bucket summaries
    const latestRoadmap = sa(history.roadmaps)[0];
    if (latestRoadmap?.data && typeof latestRoadmap.data === 'object') {
      const data = latestRoadmap.data;

      // Top-level summary
      const summary = ss(
        data.summary || data.recommendation || data.overview ||
        data.direction || data.positioning || ''
      );
      if (summary) insights.push('Growth roadmap: ' + truncate(summary, 160));

      // Target role — top-level and meta
      const targetRole = ss(
        data.targetRole || data.targetTitle ||
        data.meta?.targetRole || data.meta?.headline || ''
      );
      if (targetRole) insights.push('Target role from roadmap: ' + targetRole);

      // Day-bucket focus/theme lines — surface any meaningful strings
      for (const bucket of ['day30', 'day60', 'day90']) {
        try {
          const b = data[bucket];
          if (!b || typeof b !== 'object') continue;
          const focus = ss(b.focus || b.theme || b.summary || b.goal || b.objective || '');
          if (focus) insights.push(bucket + ' focus: ' + truncate(focus, 120));
        } catch { /* skip malformed bucket */ }
      }
    }

    // Latest negotiation
    const latestNeg = sa(history.negotiations)[0];
    if (latestNeg?.input && typeof latestNeg.input === 'object') {
      const inp = latestNeg.input;
      if (inp.currentJobTitle) insights.push('Last negotiation role: ' + ss(inp.currentJobTitle));
      if (inp.targetSalaryMin || inp.targetSalaryMax) {
        insights.push(
          'Negotiation target: $' + (inp.targetSalaryMin || '?') +
          ' \u2013 $' + (inp.targetSalaryMax || '?')
        );
      }
    }
    if (latestNeg?.result && typeof latestNeg.result === 'object') {
      const summary = ss(latestNeg.result.summary || latestNeg.result.recommendation || '');
      if (summary) insights.push('Negotiation insight: ' + truncate(summary, 140));
    }

    // Latest profile snapshot
    const latestSnap = sa(history.profileSnapshots)[0];
    if (latestSnap?.headline) insights.push('Recent profile headline: ' + ss(latestSnap.headline));

    // Latest recruiter explain run
    const latestRun = sa(history.recruiterExplainRuns)[0];
    if (latestRun?.result && typeof latestRun.result === 'object') {
      const why = ss(
        latestRun.result.whyThisCandidate || latestRun.result.summary ||
        latestRun.result.explanation || ''
      );
      if (why) insights.push('Recruiter signal: ' + truncate(why, 140));
    }

    return insights.filter(Boolean).slice(0, 8);
  } catch {
    return [];
  }
}

// ─── Caution flags ─────────────────────────────────────────────────────────────
// Flags tools should be aware of — thin data, missing resume, mismatches
function extractCautionFlags(ctx, resume, profile, history) {
  try {
    const flags = [];

    if (!resume)                          flags.push('No resume found — context is profile-only');
    if (resume && !ss(resume.content))    flags.push('Resume exists but content is empty');
    if (!ss(ctx.user?.headline))          flags.push('No user headline — positioning is unclear');
    if (!ss(ctx.user?.name))              flags.push('No user name in context');

    // Roadmap vs profile mismatch — target role in roadmap but no matching skills
    const roadmapData = sa(history.roadmaps)[0]?.data;
    if (roadmapData?.targetRole && !sa(profile.skills).length) {
      flags.push('Target role defined in roadmap but no skills listed on profile');
    }

    // Very thin profile
    const profileSignalCount = [
      sa(profile.skills).length > 0,
      sa(profile.projects).length > 0,
      ss(profile.aboutMe).length > 0,
      sa(profile.certifications).length > 0,
    ].filter(Boolean).length;
    if (profileSignalCount < 2) flags.push('Very thin profile — fewer than 2 signal sources available');

    return flags.filter(Boolean).slice(0, 6);
  } catch {
    return [];
  }
}

// ─── Source status ─────────────────────────────────────────────────────────────
function buildSourceStatus(resume, profile, history) {
  try {
    return {
      hasResume:   Boolean(resume && ss(resume.content)),
      hasProfile:  Boolean(
        sa(profile.skills).length > 0 ||
        ss(profile.aboutMe) ||
        sa(profile.projects).length > 0
      ),
      hasProjects: Boolean(sa(profile.projects).length > 0),
      hasHistory:  Boolean(
        sa(history.roadmaps).length > 0 ||
        sa(history.negotiations).length > 0 ||
        sa(history.profileSnapshots).length > 0 ||
        sa(history.recruiterExplainRuns).length > 0
      ),
    };
  } catch {
    return { hasResume: false, hasProfile: false, hasProjects: false, hasHistory: false };
  }
}

// ─── Main export ───────────────────────────────────────────────────────────────
export async function buildPromptContext({ userId } = {}) {
  if (!userId || typeof userId !== 'string') return null;

  try {
    const ctx = await buildCareerContext({ userId, includeHistory: true });
    if (!ctx) return null;

    const resume  = ctx.resume  || null;
    const profile = ctx.profile || {};
    const history = ctx.history || {
      roadmaps: [], negotiations: [], profileSnapshots: [], recruiterExplainRuns: [],
    };

    return {
      user: {
        id:       ss(ctx.user?.id),
        name:     ss(ctx.user?.name),
        headline: ss(ctx.user?.headline),
        role:     ss(ctx.user?.role),
        plan:     ss(ctx.user?.plan),
      },
      positioning:        buildPositioning(ctx),
      proofSignals:       extractProofSignals(profile, resume),
      relevantWins:       extractRelevantWins(profile, history),
      knownGaps:          extractKnownGaps(profile, history),
      recentToolInsights: extractRecentToolInsights(history),
      cautionFlags:       extractCautionFlags(ctx, resume, profile, history),
      sourceStatus:       buildSourceStatus(resume, profile, history),
    };
  } catch (err) {
    console.error('[buildPromptContext] error:', err?.message || err);
    return null;
  }
}

export default buildPromptContext;