// pages/api/anvil/project-promotion/generate.js

import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';
import { evaluateSignals } from '@/lib/forge/evidenceEngine';
import { classifyRisk } from '@/lib/forge/riskEngine';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function safeString(value) {
  return String(value || '').trim();
}

function safeJsonParse(value, fallback = null) {
  try {
    if (!value) return fallback;
    if (typeof value === 'object') return value;
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function safeArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  const parsed = safeJsonParse(value, []);
  return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
}

function extractChat(resp) {
  return String(resp?.choices?.[0]?.message?.content || '');
}

function normalizeResumeContent(content) {
  const parsed = safeJsonParse(content, null);
  if (parsed?.data && typeof parsed.data === 'object') return parsed.data;
  if (parsed && typeof parsed === 'object') return parsed;
  return { summary: safeString(content) };
}

function buildProfileProjectLines(projectsJson) {
  const projects = safeArray(projectsJson);

  return projects
    .slice(0, 8)
    .map((project, index) => {
      if (typeof project === 'string') return `${index + 1}. ${project}`;

      const title = project.title || project.name || project.projectName || 'Untitled project';
      const description = project.description || project.summary || project.details || '';
      const outcome = project.outcome || project.impact || project.result || '';
      const status = project.status || project.stage || '';

      return [
        `${index + 1}. ${title}`,
        description ? `Description: ${description}` : '',
        outcome ? `Outcome: ${outcome}` : '',
        status ? `Status: ${status}` : '',
      ].filter(Boolean).join('\n');
    })
    .join('\n\n');
}

function buildUserContext(user, resume) {
  const skills = safeArray(user.skillsJson)
    .map((item) => typeof item === 'string' ? item : item?.name || item?.label || item?.skill || '')
    .filter(Boolean);

  const certifications = safeArray(user.certificationsJson)
    .map((item) => typeof item === 'string' ? item : item?.name || item?.title || item?.certification || '')
    .filter(Boolean);

  const education = safeArray(user.educationJson)
    .map((item) => {
      if (typeof item === 'string') return item;
      return [item.degree, item.field || item.major, item.school || item.institution].filter(Boolean).join(' | ');
    })
    .filter(Boolean);

  const customSections = safeArray(user.customSectionJson);
  const workPreferences = user.workPreferences && typeof user.workPreferences === 'object'
    ? user.workPreferences
    : safeJsonParse(user.workPreferences, {});

  const profileProjects = buildProfileProjectLines(user.projectsJson);
  const resumeData = normalizeResumeContent(resume?.content || '');

  return {
    resumeData,
    profileText: [
      `Name: ${user.name || [user.firstName, user.lastName].filter(Boolean).join(' ') || 'User'}`,
      `Headline: ${user.headline || 'N/A'}`,
      `Location: ${user.location || 'N/A'}`,
      '',
      'ABOUT / PROFILE:',
      user.aboutMe || 'N/A',
      '',
      'PROFILE SKILLS:',
      skills.length ? skills.join(', ') : 'N/A',
      '',
      'CERTIFICATIONS:',
      certifications.length ? certifications.join(', ') : 'N/A',
      '',
      'EDUCATION:',
      education.length ? education.join('\n') : 'N/A',
      '',
      'PROFILE / PORTFOLIO PROJECTS:',
      profileProjects || 'N/A',
      '',
      'CUSTOM PROFILE SECTIONS:',
      customSections.length ? JSON.stringify(customSections).slice(0, 2500) : 'N/A',
      '',
      'WORK PREFERENCES:',
      workPreferences ? JSON.stringify(workPreferences).slice(0, 1200) : 'N/A',
    ].join('\n'),
  };
}

function runEvidenceEngine(resumeData) {
  const PROJECT_PROMOTION_SIGNALS = [
    'ownership and accountability',
    'delivery and execution',
    'people leadership and team management',
    'stakeholder and executive engagement',
    'process and methodology development',
    'domain knowledge and qualification',
  ];

  try {
    const signalResults = evaluateSignals(PROJECT_PROMOTION_SIGNALS, resumeData);

    const direct = signalResults.filter((s) => s.status === 'direct').map((s) => s.signal);
    const adjacentTech = signalResults.filter((s) => s.status === 'adjacent_technical').map((s) => s.signal);
    const adjacent = signalResults.filter((s) => s.status === 'adjacent').map((s) => s.signal);
    const missing = signalResults.filter((s) => s.status === 'missing').map((s) => s.signal);

    const risks = signalResults.map((s) =>
      classifyRisk({ signal: s.signal, status: s.status, required: true })
    );

    const riskLines = risks
      .filter((r) => r.level === 'survivable' || r.level === 'fatal')
      .map((r) => r.reason);

    const lines = [];
    if (direct.length) lines.push(`DIRECTLY PROVEN: ${direct.join(', ')}`);
    if (adjacentTech.length) lines.push(`STRONG ADJACENT EVIDENCE: ${adjacentTech.join(', ')}`);
    if (adjacent.length) lines.push(`ADJACENT EVIDENCE: ${adjacent.join(', ')}`);
    if (missing.length) lines.push(`NOT VISIBLE YET: ${missing.join(', ')}`);
    if (riskLines.length) lines.push(`PROMOTION RISKS: ${riskLines.slice(0, 4).join(' ')}`);

    return {
      summary: lines.join('\n'),
      signalResults,
    };
  } catch (error) {
    console.error('[project-promotion/generate] Evidence engine error:', error?.message || error);
    return { summary: '', signalResults: [] };
  }
}

async function resolveUser(session) {
  const sessionUserId = safeString(session?.user?.id);
  const sessionEmail = safeString(session?.user?.email).toLowerCase();

  if (sessionUserId) {
    return prisma.user.findUnique({
      where: { id: sessionUserId },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        headline: true,
        location: true,
        aboutMe: true,
        skillsJson: true,
        educationJson: true,
        certificationsJson: true,
        customSectionJson: true,
        projectsJson: true,
        workPreferences: true,
        plan: true,
      },
    });
  }

  if (sessionEmail) {
    return prisma.user.findUnique({
      where: { email: sessionEmail },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        headline: true,
        location: true,
        aboutMe: true,
        skillsJson: true,
        educationJson: true,
        certificationsJson: true,
        customSectionJson: true,
        projectsJson: true,
        workPreferences: true,
        plan: true,
      },
    });
  }

  return null;
}

async function getCurrentResume(userId) {
  const primary = await prisma.resume.findFirst({
    where: { userId, isPrimary: true },
    select: { id: true, name: true, content: true, isPrimary: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
  });

  if (primary) return primary;

  return prisma.resume.findFirst({
    where: { userId },
    select: { id: true, name: true, content: true, isPrimary: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'Server missing OPENAI_API_KEY' });
    }

    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id && !session?.user?.email) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await resolveUser(session);
    if (!user?.id) return res.status(404).json({ error: 'User not found' });

    const resume = await getCurrentResume(user.id);
    if (!resume?.content) {
      return res.status(400).json({
        error: 'No resume found. Create or mark a primary resume before running Project & Promotion Intelligence.',
      });
    }

    const { currentRole = '', currentCompany = '', additionalContext = '' } = req.body || {};

    const { resumeData, profileText } = buildUserContext(user, resume);
    const evidence = runEvidenceEngine(resumeData);

    const systemPrompt = `
You are ForgeTomorrow's Project & Promotion Intelligence Engine.

This is NOT a career roadmap tool.
This is NOT a job-seeker pivot tool.
This is for professionals already in a role who want to win harder where they are now.

Your job:
Identify the next high-impact projects, internal moves, or ownership opportunities that increase the user's value, visibility, promotion potential, and future career leverage.

CORE PHILOSOPHY:
ForgeTomorrow exists because corporate systems often fail to focus on individual success.
Do not write safe corporate advice.
Write what wins.

TONE:
Direct. Strategic. Evidence-backed. Human.
No fluff. No motivational filler. No HR-safe language.
Write like a strategic operator advisor, not HR and not a performance review template.
If the user is under-leveraging their capabilities, say it clearly and then show the path forward.

VOICE RULES:
- Do NOT write: "You have demonstrated strong operational leadership."
- Prefer: "You have already proven you can improve operations at scale."
- Do NOT write: "shows capability in."
- Prefer: "proves you can."
- Do NOT write: "has experience in" when stronger evidence exists.
- Prefer: "you have already done."
- Do NOT over-soften the gap.
- Say: "You are seeing the problems, but you are not owning them yet" when user has clear workplace problems and no active project.
- Keep performanceRead to 2-3 direct sentences.
- Keep leverageGap to 2-3 direct sentences.
- Keep underLeveragingSignal to 1 blunt, constructive sentence.

HARD RULES:
- Do NOT suggest applying to jobs.
- Do NOT suggest a career pivot.
- Do NOT produce a 30/60/90 roadmap.
- Do NOT say "seek opportunities", "develop leadership skills", "network more", or "take initiative" unless tied to a concrete project.
- Do NOT invent achievements, metrics, tools, companies, projects, titles, or authority.
- Ground the read in resume evidence, profile/portfolio signals, and user-supplied current-role context.
- User-supplied context is HIGH PRIORITY. If the user gives current problems, recommend projects that directly address those problems.
- If user says "None currently" for current projects, do not treat them as inactive. Treat it as an ownership gap: they are operating, but not yet leading a named initiative.
- If evidence is weak, say what proof is not visible yet. Do not say a capability is absent unless the data proves it is absent.
- Every recommended project must produce a measurable proof artifact.
- Output ONLY valid JSON. No markdown. No commentary outside JSON.

WHAT GOOD LOOKS LIKE:
The user should feel:
"This system sees what I have done, understands what I am becoming, and is telling me exactly how to win next."

Return JSON in this exact shape:
{
  "performanceRead": "",
  "leverageGap": "",
  "underLeveragingSignal": "",
  "rankedMoves": [
    {
      "rank": 1,
      "title": "",
      "whatToDo": "",
      "whyThisWins": "",
      "evidenceBasis": "",
      "exampleProjects": [],
      "successMetrics": [],
      "proofArtifact": "",
      "promotionSignal": "",
      "riskIfIgnored": ""
    },
    {
      "rank": 2,
      "title": "",
      "whatToDo": "",
      "whyThisWins": "",
      "evidenceBasis": "",
      "exampleProjects": [],
      "successMetrics": [],
      "proofArtifact": "",
      "promotionSignal": "",
      "riskIfIgnored": ""
    },
    {
      "rank": 3,
      "title": "",
      "whatToDo": "",
      "whyThisWins": "",
      "evidenceBasis": "",
      "exampleProjects": [],
      "successMetrics": [],
      "proofArtifact": "",
      "promotionSignal": "",
      "riskIfIgnored": ""
    }
  ],
  "recommendedMove": {
    "rank": 1,
    "decision": "",
    "firstStepThisWeek": "",
    "whoToAlignWith": "",
    "howToPitchIt": ""
  },
  "reviewNarrative": {
    "managerSummary": "",
    "promotionCaseAngle": "",
    "resumeFutureBullet": ""
  },
  "coachBridge": {
    "whyCoachHelps": "Use careful language. Do not imply ForgeTomorrow has assigned coaches or a managed mentor network. Say Coach Spotlights can help the user find professionals who may be able to pressure-test the project before leadership conversations.",
    "whatToBring": "Your selected move, current operational data, and a rough pitch or plan.",
    "cta": "View Coach Spotlights"
  },
  "reasoning": []
}
`.trim();

    const userPrompt = `
USER CONTEXT:
Current role supplied by user: ${safeString(currentRole) || 'N/A'}
Current company supplied by user: ${safeString(currentCompany) || 'N/A'}
Additional context supplied by user: ${safeString(additionalContext) || 'N/A'}

PROFILE / PORTFOLIO DATA:
${profileText}

PRIMARY / CURRENT RESUME:
Resume name: ${resume.name}
Resume content:
${safeString(resume.content).slice(0, 8000)}

FORGETOMORROW EVIDENCE ENGINE ANALYSIS:
${evidence.summary || 'Evidence engine unavailable. Use resume/profile content directly and be conservative.'}

TASK:
Return the 3 ranked projects or internal moves this professional should pursue next to increase value, visibility, promotion potential, and future leverage.

Remember:
- This is for winning inside the current role/company.
- Do not recommend job searching.
- Do not recommend a pivot.
- Do not write a 30/60/90 plan.
- Recommend concrete projects, ownership plays, or internal initiatives.
- Each move must be tied to actual evidence.
- Each move must produce a proof artifact.
- If they are under-leveraging, be honest but constructive.
- Avoid corporate performance review language.
- The Decision tab should sound like: "You have already proven X. Right now, Y is the gap. The next win is Z."
- Spotlights language must be accurate: Coach Spotlights are users advertising coach packages, not a managed ForgeTomorrow coaching team.
`.trim();

    let parsed = null;

    try {
      const response = await client.chat.completions.create({
        model: process.env.OPENAI_PROJECT_PROMOTION_MODEL || process.env.OPENAI_COACH_MODEL || 'gpt-4.1-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.25,
      });

      parsed = safeJsonParse(extractChat(response), null);
    } catch (error) {
      console.error('[project-promotion/generate] OpenAI error:', error?.message || error);
      return res.status(500).json({ error: 'Failed to generate project promotion plan' });
    }

    if (!parsed || typeof parsed !== 'object') {
      return res.status(500).json({ error: 'Failed to parse project promotion response' });
    }

    return res.status(200).json({
      plan: parsed,
      resumeConnected: true,
      resumeId: resume.id,
      resumeName: resume.name,
      profileConnected: true,
      evidenceConnected: !!evidence.summary,
    });
  } catch (error) {
    console.error('[project-promotion/generate] Unhandled error:', error);
    return res.status(500).json({ error: 'Failed to generate project promotion plan' });
  }
}