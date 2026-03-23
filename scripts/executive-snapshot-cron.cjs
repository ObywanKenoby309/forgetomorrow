// scripts/executive-snapshot-cron.cjs
//
// Executive Snapshot Cron — follows forge-jobs-cron pattern exactly.
// Add to Render Cron Jobs:
//   Command: node scripts/executive-snapshot-cron.cjs
//   Schedule: 0 * * * * (hourly — timing logic inside handles per-user windows)
//
// Flow:
//   Load due schedules → Fetch analytics per user → Generate AI insight →
//   Build email → Send → Log → Done

"use strict";

const { PrismaClient } = require("@prisma/client");
const nodemailer        = require("nodemailer");

// ─── AI (Groq primary, OpenAI fallback) ──────────────────────────────────────
// node-fetch v2 is CommonJS compatible
let fetchFn;
try { fetchFn = require("node-fetch"); } catch { fetchFn = global.fetch; }

const prisma = new PrismaClient();

// ─── Config ───────────────────────────────────────────────────────────────────
const BATCH_SIZE   = 10;   // schedules processed per batch
const FROM_ADDRESS = process.env.EMAIL_FROM
  || `ForgeTomorrow <${process.env.SMTP_USER || process.env.EMAIL_USER || "noreply@forgetomorrow.com"}>`;

// ─── Email transport (same as lib/email.js) ───────────────────────────────────
function buildTransport() {
  const host    = process.env.SMTP_HOST    || process.env.EMAIL_SERVER   || "smtp.gmail.com";
  const port    = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 587);
  const user    = process.env.SMTP_USER    || process.env.EMAIL_USER     || "";
  const pass    = process.env.SMTP_PASS    || process.env.EMAIL_PASSWORD || "";
  const secure  = port === 465;

  return nodemailer.createTransport({
    host, port, secure,
    auth: { user, pass },
    requireTLS: !secure,
    connectionTimeout: 10_000,
    greetingTimeout:   10_000,
    socketTimeout:     15_000,
    tls: { rejectUnauthorized: true, servername: host },
  });
}

const transporter = buildTransport();

// ─── Timing helpers ───────────────────────────────────────────────────────────
function nowInTimezone(timezone) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit",
      hour12: false, weekday: "long",
    }).formatToParts(new Date());

    const get = (type) => (parts.find((p) => p.type === type) || {}).value || "";
    return {
      hour:    parseInt(get("hour"),    10),
      minute:  parseInt(get("minute"),  10),
      weekday: get("weekday"),
      day:     parseInt(get("day"),     10),
    };
  } catch {
    const now = new Date();
    return {
      hour:    now.getUTCHours(),
      minute:  now.getUTCMinutes(),
      weekday: ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][now.getUTCDay()],
      day:     now.getUTCDate(),
    };
  }
}

function getNthWeekdayOfMonth(ordinal, weekday, timezone) {
  try {
    const now   = new Date();
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone, year: "numeric", month: "numeric",
    }).formatToParts(now);
    const year  = parseInt((parts.find((p) => p.type === "year")  || {}).value || now.getFullYear(), 10);
    const month = parseInt((parts.find((p) => p.type === "month") || {}).value || now.getMonth() + 1, 10) - 1;

    const WEEKDAYS   = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const ORDINALS   = { First: 1, Second: 2, Third: 3, Fourth: 4, Last: -1 };
    const targetIdx  = WEEKDAYS.indexOf(weekday);
    const ordinalNum = ORDINALS[ordinal];
    if (targetIdx === -1 || ordinalNum === undefined) return -1;

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    if (ordinalNum === -1) {
      for (let d = daysInMonth; d >= 1; d--) {
        if (new Date(year, month, d).getDay() === targetIdx) return d;
      }
      return -1;
    }

    let count = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      if (new Date(year, month, d).getDay() === targetIdx) {
        count++;
        if (count === ordinalNum) return d;
      }
    }
    return -1;
  } catch { return -1; }
}

function isDue(schedule) {
  const tz = schedule.timezone || "America/Chicago";
  const { hour, minute, weekday, day } = nowInTimezone(tz);

  const [scheduledHour, scheduledMinute] = (schedule.timeOfDay || "08:00")
    .split(":").map((n) => parseInt(n, 10));

  // 5-minute delivery window
  if (hour !== scheduledHour) return false;
  if (minute < scheduledMinute || minute > scheduledMinute + 5) return false;

  switch (schedule.cadence) {
    case "daily":   return true;
    case "weekly":  return weekday === (schedule.weeklyDay || "Monday");
    case "monthly": {
      if (schedule.monthlyMode === "ordinal") {
        return day === getNthWeekdayOfMonth(
          schedule.monthlyOrdinal || "First",
          schedule.monthlyWeekday || "Monday",
          tz
        );
      }
      return day === parseInt(schedule.monthlyDate || "1", 10);
    }
    default: return false;
  }
}

// ─── Analytics data (direct DB query — no API call needed) ───────────────────
async function fetchAnalyticsForUser(userEmail) {
  try {
    // Find the user's accountKey
    const user = await prisma.user.findUnique({
      where:  { email: userEmail },
      select: { id: true, accountKey: true, firstName: true, lastName: true, name: true },
    });

    if (!user) return null;

    const accountKey = user.accountKey;
    const recruiterName = user.name || [user.firstName, user.lastName].filter(Boolean).join(" ") || userEmail;

    // 30-day window
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const where = accountKey
      ? { job: { accountKey }, appliedAt: { gte: since } }
      : { userId: user.id,    appliedAt: { gte: since } };

    const [applications, interviews, offers, jobs] = await Promise.all([
      prisma.application.findMany({ where, select: { id: true, status: true, source: true, job: { select: { title: true } } } }),
      prisma.interview.findMany({   where: accountKey ? { job: { accountKey }, scheduledAt: { gte: since } } : { userId: user.id, scheduledAt: { gte: since } }, select: { id: true } }),
      prisma.offer.findMany({       where: accountKey ? { job: { accountKey }, receivedAt: { gte: since } }  : { userId: user.id, receivedAt: { gte: since } },  select: { id: true, accepted: true } }),
      prisma.job.findMany({         where: accountKey ? { accountKey, publishedAt: { gte: since } }           : { userId: user.id, publishedAt: { gte: since } },  select: { id: true, viewsCount: true, applicationsCount: true } }),
    ]);

    const totalViews   = jobs.reduce((sum, j) => sum + Number(j.viewsCount || 0), 0);
    const totalApplies = applications.length;
    const totalInterviews = interviews.length;
    const totalHires   = offers.filter((o) => o.accepted === true).length;
    const conversionRatePct = totalViews > 0 ? Math.round((totalApplies / totalViews) * 100) : 0;
    const offerAcceptanceRatePct = offers.length > 0
      ? Math.round((offers.filter((o) => o.accepted === true).length / offers.length) * 100) : 0;

    // Source breakdown
    const sourceCounts = {};
    applications.forEach((a) => {
      const src = String(a.source || "Direct").replace(/_/g, " ");
      sourceCounts[src] = (sourceCounts[src] || 0) + 1;
    });
    const sourcesData = Object.entries(sourceCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Funnel
    const funnelData = [
      { stage: "Applied",      value: totalApplies },
      { stage: "Interviewing", value: applications.filter((a) => a.status === "Interviewing").length },
      { stage: "Offers",       value: offers.length },
      { stage: "Hired",        value: totalHires },
    ];

    return {
      accountName:     accountKey || recruiterName,
      recruiterName,
      reportingWindow: "Last 30 days",
      kpis: {
        totalViews, totalApplies, totalInterviews, totalHires,
        conversionRatePct, offerAcceptanceRatePct,
        avgTimeToFillDays: 0, // extend later with publishedAt → acceptedAt calc
      },
      funnelData,
      sourcesData,
      activityData: [],
    };
  } catch (err) {
    console.error(`[Analytics] Failed for ${userEmail}:`, err.message);
    return null;
  }
}

// ─── AI insight (Groq → OpenAI fallback) ─────────────────────────────────────
async function generateInsight(reportType, analytics) {
  if (!analytics) return null;

  const { kpis, funnelData, sourcesData } = analytics;

  const contextMap = {
    executive:      `Views: ${kpis.totalViews}, Applications: ${kpis.totalApplies}, Conversion: ${kpis.conversionRatePct}%, Time-to-Fill: ${kpis.avgTimeToFillDays} days, Interviews: ${kpis.totalInterviews}, Hires: ${kpis.totalHires}, Offer Acceptance: ${kpis.offerAcceptanceRatePct}%`,
    funnel:         `Funnel: ${JSON.stringify(funnelData)}, Conversion: ${kpis.conversionRatePct}%`,
    sources:        `Sources: ${JSON.stringify(sourcesData.slice(0, 6))}`,
    activity:       `Applications: ${kpis.totalApplies}, Interviews: ${kpis.totalInterviews}, Hires: ${kpis.totalHires}`,
    "time-to-fill": `Avg Time to Fill: ${kpis.avgTimeToFillDays} days, Hires: ${kpis.totalHires}`,
  };

  const promptMap = {
    executive:      "You are a senior talent analytics advisor writing for a C-suite audience. Write a 2-3 sentence executive insight identifying the single most important signal and a concrete recommended action. Be direct and data-driven.",
    funnel:         "You are a talent acquisition analyst. Write a 2-3 sentence insight about where candidates are dropping in the funnel and what the team should do about it.",
    sources:        "You are a recruiting strategy advisor. Write a 2-3 sentence insight about which channels are performing and where effort should shift.",
    activity:       "You are a recruiting operations analyst. Write a 2-3 sentence insight about team productivity and any patterns worth flagging.",
    "time-to-fill": "You are a hiring efficiency consultant. Write a 2-3 sentence insight about hiring velocity and what leadership should prioritize.",
  };

  const systemPrompt = promptMap[reportType] || promptMap.executive;
  const userContent  = `Recruiting data for the last 30 days:\n${contextMap[reportType] || contextMap.executive}`;

  // Try Groq first
  if (process.env.GROQ_API_KEY) {
    try {
      const res = await fetchFn("https://api.groq.com/openai/v1/chat/completions", {
        method:  "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.GROQ_API_KEY}` },
        body:    JSON.stringify({ model: "llama3-8b-8192", max_tokens: 200, temperature: 0.4, messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userContent }] }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content?.trim();
        if (text) return text;
      }
    } catch (err) {
      console.warn("[AI] Groq failed, trying OpenAI:", err.message);
    }
  }

  // OpenAI fallback
  if (process.env.OPENAI_API_KEY) {
    try {
      const res = await fetchFn("https://api.openai.com/v1/chat/completions", {
        method:  "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.OPENAI_API_KEY}` },
        body:    JSON.stringify({ model: "gpt-3.5-turbo", max_tokens: 200, temperature: 0.4, messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userContent }] }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content?.trim();
        if (text) return text;
      }
    } catch (err) {
      console.warn("[AI] OpenAI fallback also failed:", err.message);
    }
  }

  return null;
}

// ─── Email builders ───────────────────────────────────────────────────────────
function esc(v) {
  return String(v ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
function fmt(v, suffix = "", fallback = "—") {
  if (v === null || v === undefined || v === "") return fallback;
  const n = Number(v);
  return isNaN(n) ? `${v}${suffix}` : `${n.toLocaleString()}${suffix}`;
}

function kpiBlock(kpis) {
  const metrics = [
    { label: "Job Views",    value: fmt(kpis.totalViews) },
    { label: "Applications", value: fmt(kpis.totalApplies) },
    { label: "Conversion",   value: fmt(kpis.conversionRatePct, "%") },
    { label: "Time to Fill", value: fmt(kpis.avgTimeToFillDays, " days") },
    { label: "Interviews",   value: fmt(kpis.totalInterviews) },
    { label: "Hires",        value: fmt(kpis.totalHires) },
  ];
  const cells = metrics.map((m) => `<td width="33%" style="padding:4px;"><div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:16px;text-align:center;"><div style="font-size:10px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;color:#64748B;margin-bottom:8px;">${esc(m.label)}</div><div style="font-size:26px;font-weight:900;color:#0F172A;line-height:1;">${esc(m.value)}</div></div></td>`).join("");
  return `<div style="margin-bottom:24px;"><div style="font-size:12px;font-weight:800;letter-spacing:0.07em;text-transform:uppercase;color:#94A3B8;margin-bottom:12px;">Key Metrics</div><table width="100%" cellpadding="0" cellspacing="0"><tr>${cells.slice(0,3)}</tr><tr>${cells.slice(3,6)}</tr></table></div>`;
}

function funnelBlock(funnelData) {
  if (!funnelData || !funnelData.length) return "";
  const max = Math.max(...funnelData.map((d) => Number(d.value || 0)), 1);
  const rows = funnelData.map((s) => {
    const pct = Math.round((Number(s.value || 0) / max) * 100);
    return `<tr><td width="130" style="padding:5px 12px 5px 0;font-size:12px;font-weight:700;color:#334155;">${esc(s.stage||s.name||"")}</td><td style="padding:5px 0;"><div style="background:#F1F5F9;border-radius:6px;height:22px;"><div style="background:linear-gradient(90deg,#F57C00,#FFB74D);border-radius:6px;height:22px;width:${pct}%;min-width:4px;"></div></div></td><td width="60" style="padding:5px 0 5px 10px;font-size:13px;font-weight:800;color:#0F172A;text-align:right;">${fmt(s.value)}</td></tr>`;
  }).join("");
  return `<div style="margin-bottom:24px;"><div style="font-size:12px;font-weight:800;letter-spacing:0.07em;text-transform:uppercase;color:#94A3B8;margin-bottom:12px;">Application Funnel</div><div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:14px;padding:18px 20px;"><table width="100%" cellpadding="0" cellspacing="0">${rows}</table></div></div>`;
}

function sourcesBlock(sourcesData) {
  if (!sourcesData || !sourcesData.length) return "";
  const COLORS = ["#FF9800","#2196F3","#4DB6AC","#FFB74D","#7E57C2","#66BB6A"];
  const total  = sourcesData.reduce((sum, s) => sum + Number(s.value || 0), 0) || 1;
  const rows   = sourcesData.slice(0, 6).map((s, i) => {
    const pct   = Math.round((Number(s.value || 0) / total) * 100);
    const color = COLORS[i % COLORS.length];
    return `<tr><td width="10" style="padding:5px 8px 5px 0;"><div style="width:10px;height:10px;border-radius:50%;background:${color};"></div></td><td style="padding:5px 12px 5px 0;font-size:12px;font-weight:700;color:#334155;">${esc(s.name||"")}</td><td style="padding:5px 0;"><div style="background:#F1F5F9;border-radius:6px;height:18px;"><div style="background:${color};border-radius:6px;height:18px;width:${pct}%;min-width:4px;opacity:0.85;"></div></div></td><td width="50" style="padding:5px 0 5px 10px;font-size:12px;font-weight:800;color:#0F172A;text-align:right;">${pct}%</td></tr>`;
  }).join("");
  return `<div style="margin-bottom:24px;"><div style="font-size:12px;font-weight:800;letter-spacing:0.07em;text-transform:uppercase;color:#94A3B8;margin-bottom:12px;">Source Performance</div><div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:14px;padding:18px 20px;"><table width="100%" cellpadding="0" cellspacing="0">${rows}</table></div></div>`;
}

function insightBlock(text) {
  if (!text) return "";
  return `<div style="margin-bottom:24px;padding:20px 22px;background:#FFF7F3;border:1px solid #FBD5C6;border-radius:14px;border-left:4px solid #FF7043;"><div style="font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#C2410C;margin-bottom:10px;">✦ AI Insight</div><div style="font-size:15px;line-height:1.75;color:#1E293B;">${esc(text)}</div></div>`;
}

function buildEmail(reportType, analytics, insight) {
  const { accountName, recruiterName, reportingWindow, kpis, funnelData, sourcesData } = analytics;

  const LABELS = {
    executive:      "Executive Snapshot",
    funnel:         "Funnel Report",
    sources:        "Source Performance",
    activity:       "Recruiter Activity",
    "time-to-fill": "Time-to-Fill Report",
  };
  const label = LABELS[reportType] || "Executive Snapshot";

  const bodyByType = {
    executive:      [kpiBlock(kpis), insight ? insightBlock(insight) : "", funnelBlock(funnelData), sourcesBlock(sourcesData)].join(""),
    funnel:         [funnelBlock(funnelData), insight ? insightBlock(insight) : "", kpiBlock(kpis)].join(""),
    sources:        [sourcesBlock(sourcesData), insight ? insightBlock(insight) : ""].join(""),
    activity:       [kpiBlock(kpis), insight ? insightBlock(insight) : ""].join(""),
    "time-to-fill": [`<div style="margin-bottom:24px;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td width="50%" style="padding:4px;"><div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:22px;text-align:center;"><div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#64748B;margin-bottom:8px;">Avg. Time to Fill</div><div style="font-size:42px;font-weight:900;color:#FF7043;line-height:1;">${fmt(kpis.avgTimeToFillDays)}</div><div style="font-size:13px;color:#94A3B8;margin-top:4px;">days</div></div></td><td width="50%" style="padding:4px;"><div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:22px;text-align:center;"><div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#64748B;margin-bottom:8px;">Total Hires</div><div style="font-size:42px;font-weight:900;color:#0F172A;line-height:1;">${fmt(kpis.totalHires)}</div><div style="font-size:13px;color:#94A3B8;margin-top:4px;">this period</div></div></td></tr></table></div>`, insight ? insightBlock(insight) : ""].join(""),
  };

  const body = bodyByType[reportType] || bodyByType.executive;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.BASE_URL || "https://forgetomorrow.com";

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#F1F5F9;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:32px 16px;"><tr><td align="center">
<table width="680" cellpadding="0" cellspacing="0" style="max-width:680px;width:100%;background:#FFFFFF;border-radius:20px;border:1px solid #E2E8F0;overflow:hidden;">
<tr><td style="padding:28px 32px 24px;background:#0F172A;border-bottom:3px solid #FF7043;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr>
    <td><div style="font-size:11px;font-weight:800;letter-spacing:0.10em;text-transform:uppercase;color:#FF7043;margin-bottom:8px;">ForgeTomorrow · ${esc(label)}</div><div style="font-size:26px;font-weight:900;color:#FFFFFF;line-height:1.1;">Executive Snapshot</div></td>
    <td align="right"><div style="font-size:11px;color:#94A3B8;">${new Date().toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</div></td>
  </tr></table>
</td></tr>
<tr><td style="padding:28px 32px;">
  <div style="margin-bottom:24px;padding-bottom:18px;border-bottom:1px solid #E2E8F0;">
    <div style="font-size:20px;font-weight:900;color:#0F172A;margin-bottom:6px;">${esc(accountName||"Your Organization")}</div>
    <div style="font-size:13px;color:#64748B;">Prepared for <strong style="color:#334155;">${esc(recruiterName||"Recruiter")}</strong> &nbsp;·&nbsp; ${esc(reportingWindow||"Current period")} &nbsp;·&nbsp; <span style="color:#FF7043;font-weight:700;">${esc(label)}</span></div>
  </div>
  ${body}
</td></tr>
<tr><td style="padding:18px 32px;background:#F8FAFC;border-top:1px solid #E2E8F0;">
  <p style="margin:0;font-size:11px;color:#94A3B8;line-height:1.6;">This snapshot was generated automatically by ForgeTomorrow Analytics. <a href="${baseUrl}/recruiter/analytics/snapshot-delivery" style="color:#FF7043;">Update delivery preferences</a>.</p>
</td></tr>
</table></td></tr></table></body></html>`;
}

// ─── Send email ───────────────────────────────────────────────────────────────
async function sendEmail(recipients, subject, html) {
  await transporter.sendMail({
    from: FROM_ADDRESS,
    to:   recipients.join(","),
    subject,
    html,
    text: subject,
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("[Cron] Starting executive snapshot job...");

  const LABELS = {
    executive:      "Executive Snapshot",
    funnel:         "Funnel Report",
    sources:        "Source Performance",
    activity:       "Recruiter Activity",
    "time-to-fill": "Time-to-Fill Report",
  };

  // Load all schedules
  let allSchedules = [];
  try {
    allSchedules = await prisma.snapshotSchedule.findMany();
    console.log(`[Cron] Loaded ${allSchedules.length} total schedules`);
  } catch (err) {
    console.error("[Cron] Failed to load schedules:", err.message);
    process.exit(1);
  }

  if (!allSchedules.length) {
    console.log("[Cron] No schedules found. Exiting.");
    return;
  }

  // Filter to schedules that are due right now
  const dueSchedules = allSchedules.filter((s) => {
    const recipients = s.recipients ? s.recipients.split(",").map((r) => r.trim()).filter(Boolean) : [];
    if (!recipients.length) return false;
    return isDue(s);
  });

  console.log(`[Cron] ${dueSchedules.length} schedules due for delivery`);

  if (!dueSchedules.length) {
    console.log("[Cron] Nothing to send this run. Exiting.");
    return;
  }

  // Process in batches
  let sent = 0, failed = 0, skipped = 0;
  const totalBatches = Math.ceil(dueSchedules.length / BATCH_SIZE);

  for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
    const batch = dueSchedules.slice(batchIdx * BATCH_SIZE, (batchIdx + 1) * BATCH_SIZE);
    console.log(`[Cron] Processing batch ${batchIdx + 1}/${totalBatches} (${batch.length} schedules)`);

    for (const schedule of batch) {
      const tag = `[${schedule.userEmail} / ${schedule.reportType}]`;

      const recipients = schedule.recipients
        .split(",").map((r) => r.trim()).filter(Boolean);

      // Fetch analytics data directly from DB
      console.log(`[Analytics] Fetching data for ${schedule.userEmail}...`);
      const analytics = await fetchAnalyticsForUser(schedule.userEmail);

      if (!analytics) {
        console.warn(`[Analytics] ${tag} No data found, sending with empty metrics`);
      }

      const analyticsOrEmpty = analytics || {
        accountName: schedule.userEmail,
        recruiterName: schedule.userEmail,
        reportingWindow: "Last 30 days",
        kpis: { totalViews: 0, totalApplies: 0, totalInterviews: 0, totalHires: 0, conversionRatePct: 0, offerAcceptanceRatePct: 0, avgTimeToFillDays: 0 },
        funnelData: [],
        sourcesData: [],
        activityData: [],
      };

      // Generate AI insight
      let insight = null;
      if (schedule.includeInsights) {
        console.log(`[AI] Generating insight for ${tag}...`);
        insight = await generateInsight(schedule.reportType, analyticsOrEmpty);
        if (insight) console.log(`[AI] Insight generated for ${tag}`);
        else console.warn(`[AI] No insight generated for ${tag}`);
      }

      // Build and send email
      const label   = LABELS[schedule.reportType] || "Executive Snapshot";
      const subject = `${label} — ${analyticsOrEmpty.accountName || "ForgeTomorrow"}`;
      const html    = buildEmail(schedule.reportType, analyticsOrEmpty, insight);

      try {
        await sendEmail(recipients, subject, html);
        console.log(`[Send] ✓ ${tag} → ${recipients.join(", ")}`);
        sent++;
      } catch (err) {
        console.error(`[Send] ✗ ${tag} Failed:`, err.message);
        failed++;
      }
    }

    console.log(`[Cron] Batch ${batchIdx + 1}/${totalBatches} complete`);
  }

  console.log(`[Done] Snapshot job complete — Sent: ${sent} | Failed: ${failed} | Skipped: ${skipped} | Total due: ${dueSchedules.length}`);
}

main()
  .catch((err) => {
    console.error("[Cron] Fatal error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
