// pages/api/analytics/send-snapshot.js
//
// Builds and sends a C-suite quality executive snapshot email.
// Handles 5 report types: executive | funnel | sources | activity | time-to-fill
//
// Auth:
//   UI "Send Now" → NextAuth session
//   Cron job      → x-cron-secret header
//
// AI insights → Groq (fast, cheap) with OpenAI fallback
// Charts      → Inline HTML (Recharts is browser-only, HTML renders in all email clients)

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { safeSendMail } from "@/lib/email";

// ─── HTML escape ──────────────────────────────────────────────────────────────
function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function fmt(value, suffix = "", fallback = "—") {
  if (value === null || value === undefined || value === "") return fallback;
  const num = Number(value);
  if (!isNaN(num)) return `${num.toLocaleString()}${suffix}`;
  return `${value}${suffix}`;
}

// ─── AI insight generation ────────────────────────────────────────────────────
async function generateInsight(reportType, kpis, funnelData, sourcesData, activityData) {
  const dataContext = {
    executive: `
      Job Views: ${kpis?.totalViews ?? kpis?.jobViews ?? "N/A"}
      Applications: ${kpis?.totalApplies ?? kpis?.applies ?? "N/A"}
      Conversion Rate: ${kpis?.conversionRatePct ?? kpis?.conversionRate ?? "N/A"}%
      Avg Time to Fill: ${kpis?.avgTimeToFillDays ?? kpis?.avgTimeToFill ?? "N/A"} days
      Interviews: ${kpis?.totalInterviews ?? "N/A"}
      Hires: ${kpis?.totalHires ?? "N/A"}
      Offer Acceptance: ${kpis?.offerAcceptanceRatePct ?? "N/A"}%
    `,
    funnel: `
      Funnel stages: ${JSON.stringify(funnelData?.slice(0, 8) || [])}
      Total applies: ${kpis?.totalApplies ?? "N/A"}
      Conversion: ${kpis?.conversionRatePct ?? "N/A"}%
    `,
    sources: `
      Source breakdown: ${JSON.stringify(sourcesData?.slice(0, 8) || [])}
      Top source produces most candidate volume.
    `,
    activity: `
      Recruiter activity trend: ${JSON.stringify(activityData?.slice(0, 8) || [])}
      Applications submitted and interviews scheduled this period.
    `,
    "time-to-fill": `
      Average time to fill: ${kpis?.avgTimeToFillDays ?? "N/A"} days
      Total hires: ${kpis?.totalHires ?? "N/A"}
      Interviews: ${kpis?.totalInterviews ?? "N/A"}
    `,
  };

  const prompts = {
    executive: "You are a senior talent analytics advisor writing for a C-suite audience. Based on the recruiting metrics below, write a 2-3 sentence executive insight that identifies the single most important signal in the data and a concrete recommended action. Be direct, specific, and data-driven. No fluff.",
    funnel: "You are a talent acquisition analyst. Based on the application funnel data below, write a 2-3 sentence insight identifying where candidates are dropping off and what that means for the recruiting team. Be specific and actionable.",
    sources: "You are a recruiting strategy advisor. Based on the source performance data below, write a 2-3 sentence insight about which channels are delivering the best results and where budget or effort should be shifted.",
    activity: "You are a recruiting operations analyst. Based on the recruiter activity data below, write a 2-3 sentence insight about team productivity trends and any patterns worth flagging to leadership.",
    "time-to-fill": "You are a hiring efficiency consultant. Based on the time-to-fill data below, write a 2-3 sentence insight about hiring velocity, what's driving it, and what leadership should prioritize to improve it.",
  };

  const systemPrompt = prompts[reportType] || prompts.executive;
  const userContent  = `Here is the recruiting data:\n${dataContext[reportType] || dataContext.executive}`;

  // Try Groq first (faster and cheaper for this use case)
  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        max_tokens: 200,
        temperature: 0.4,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user",   content: userContent },
        ],
      }),
    });

    if (groqRes.ok) {
      const groqData = await groqRes.json();
      const text = groqData?.choices?.[0]?.message?.content?.trim();
      if (text) return text;
    }
  } catch {
    // Fall through to OpenAI
  }

  // OpenAI fallback
  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        max_tokens: 200,
        temperature: 0.4,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user",   content: userContent },
        ],
      }),
    });

    if (openaiRes.ok) {
      const openaiData = await openaiRes.json();
      const text = openaiData?.choices?.[0]?.message?.content?.trim();
      if (text) return text;
    }
  } catch {
    // Both failed
  }

  return null;
}

// ─── HTML email builders ──────────────────────────────────────────────────────

function emailWrapper(content, reportLabel) {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:32px 16px;">
  <tr><td align="center">
    <table width="680" cellpadding="0" cellspacing="0" style="max-width:680px;width:100%;background:#FFFFFF;border-radius:20px;border:1px solid #E2E8F0;overflow:hidden;">

      <!-- Header -->
      <tr>
        <td style="padding:28px 32px 24px;background:#0F172A;border-bottom:3px solid #FF7043;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <div style="font-size:11px;font-weight:800;letter-spacing:0.10em;text-transform:uppercase;color:#FF7043;margin-bottom:8px;">
                  ForgeTomorrow · ${esc(reportLabel)}
                </div>
                <div style="font-size:26px;font-weight:900;color:#FFFFFF;line-height:1.1;">
                  Executive Snapshot
                </div>
              </td>
              <td align="right" style="vertical-align:top;">
                <div style="font-size:11px;color:#94A3B8;text-align:right;line-height:1.7;">
                  ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:28px 32px;">
          ${content}
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="padding:18px 32px;background:#F8FAFC;border-top:1px solid #E2E8F0;">
          <p style="margin:0;font-size:11px;color:#94A3B8;line-height:1.6;">
            This snapshot was generated automatically by ForgeTomorrow Analytics.
            To update your delivery preferences, visit your
            <a href="${process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL}/recruiter/analytics/snapshot-delivery" style="color:#FF7043;">Snapshot Delivery Center</a>.
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function kpiBlock(kpis) {
  const metrics = [
    { label: "Job Views",      value: fmt(kpis?.totalViews      ?? kpis?.jobViews) },
    { label: "Applications",   value: fmt(kpis?.totalApplies    ?? kpis?.applies) },
    { label: "Conversion",     value: fmt(kpis?.conversionRatePct ?? kpis?.conversionRate, "%") },
    { label: "Time to Fill",   value: fmt(kpis?.avgTimeToFillDays ?? kpis?.avgTimeToFill, " days") },
    { label: "Interviews",     value: fmt(kpis?.totalInterviews) },
    { label: "Hires",          value: fmt(kpis?.totalHires) },
  ];

  const cells = metrics.map((m) => `
    <td width="33%" style="padding:4px;">
      <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:16px 14px;text-align:center;">
        <div style="font-size:10px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;color:#64748B;margin-bottom:8px;">${esc(m.label)}</div>
        <div style="font-size:26px;font-weight:900;color:#0F172A;line-height:1;">${esc(m.value)}</div>
      </div>
    </td>
  `).join("");

  return `
    <div style="margin-bottom:24px;">
      <div style="font-size:12px;font-weight:800;letter-spacing:0.07em;text-transform:uppercase;color:#94A3B8;margin-bottom:12px;">Key Metrics</div>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>${cells.slice(0, 3)}</tr>
        <tr>${cells.slice(3, 6)}</tr>
      </table>
    </div>`;
}

function funnelBlock(funnelData) {
  if (!Array.isArray(funnelData) || !funnelData.length) return "";

  const max = Math.max(...funnelData.map((d) => Number(d.value || 0)), 1);

  const rows = funnelData.map((stage) => {
    const pct = Math.round((Number(stage.value || 0) / max) * 100);
    return `
      <tr>
        <td width="130" style="padding:5px 12px 5px 0;font-size:12px;font-weight:700;color:#334155;white-space:nowrap;">${esc(stage.stage || stage.name || "")}</td>
        <td style="padding:5px 0;">
          <div style="background:#F1F5F9;border-radius:6px;height:22px;position:relative;">
            <div style="background:linear-gradient(90deg,#F57C00,#FFB74D);border-radius:6px;height:22px;width:${pct}%;min-width:4px;"></div>
          </div>
        </td>
        <td width="60" style="padding:5px 0 5px 10px;font-size:13px;font-weight:800;color:#0F172A;text-align:right;">${fmt(stage.value)}</td>
      </tr>`;
  }).join("");

  return `
    <div style="margin-bottom:24px;">
      <div style="font-size:12px;font-weight:800;letter-spacing:0.07em;text-transform:uppercase;color:#94A3B8;margin-bottom:12px;">Application Funnel</div>
      <div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:14px;padding:18px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0">${rows}</table>
      </div>
    </div>`;
}

function sourcesBlock(sourcesData) {
  if (!Array.isArray(sourcesData) || !sourcesData.length) return "";

  const COLORS = ["#FF9800","#2196F3","#4DB6AC","#FFB74D","#7E57C2","#66BB6A","#29B6F6","#90A4AE"];
  const total = sourcesData.reduce((sum, s) => sum + Number(s.value || 0), 0) || 1;

  const rows = sourcesData.slice(0, 8).map((source, i) => {
    const pct = Math.round((Number(source.value || 0) / total) * 100);
    const color = COLORS[i % COLORS.length];
    return `
      <tr>
        <td width="10" style="padding:5px 8px 5px 0;">
          <div style="width:10px;height:10px;border-radius:50%;background:${color};"></div>
        </td>
        <td style="padding:5px 12px 5px 0;font-size:12px;font-weight:700;color:#334155;">${esc(source.name || "")}</td>
        <td style="padding:5px 0;">
          <div style="background:#F1F5F9;border-radius:6px;height:18px;">
            <div style="background:${color};border-radius:6px;height:18px;width:${pct}%;min-width:4px;opacity:0.85;"></div>
          </div>
        </td>
        <td width="50" style="padding:5px 0 5px 10px;font-size:12px;font-weight:800;color:#0F172A;text-align:right;">${pct}%</td>
      </tr>`;
  }).join("");

  return `
    <div style="margin-bottom:24px;">
      <div style="font-size:12px;font-weight:800;letter-spacing:0.07em;text-transform:uppercase;color:#94A3B8;margin-bottom:12px;">Source Performance</div>
      <div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:14px;padding:18px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0">${rows}</table>
      </div>
    </div>`;
}

function activityBlock(activityData) {
  if (!Array.isArray(activityData) || !activityData.length) return "";

  const maxApps = Math.max(...activityData.map((d) => Number(d.messages || 0)), 1);
  const maxInt  = Math.max(...activityData.map((d) => Number(d.responses || 0)), 1);

  const rows = activityData.slice(-8).map((week) => {
    const appPct = Math.round((Number(week.messages || 0) / maxApps) * 100);
    const intPct = Math.round((Number(week.responses || 0) / maxInt) * 100);
    return `
      <tr>
        <td width="48" style="padding:4px 8px 4px 0;font-size:11px;color:#64748B;white-space:nowrap;">${esc(week.week || "")}</td>
        <td style="padding:4px 4px 4px 0;">
          <div style="background:#FFF3E0;border-radius:4px;height:16px;">
            <div style="background:#FF9800;border-radius:4px;height:16px;width:${appPct}%;min-width:2px;"></div>
          </div>
        </td>
        <td width="32" style="padding:4px 12px 4px 6px;font-size:11px;font-weight:700;color:#FF9800;text-align:right;">${fmt(week.messages)}</td>
        <td style="padding:4px 4px 4px 0;">
          <div style="background:#E3F2FD;border-radius:4px;height:16px;">
            <div style="background:#2196F3;border-radius:4px;height:16px;width:${intPct}%;min-width:2px;"></div>
          </div>
        </td>
        <td width="32" style="padding:4px 0 4px 6px;font-size:11px;font-weight:700;color:#2196F3;text-align:right;">${fmt(week.responses)}</td>
      </tr>`;
  }).join("");

  return `
    <div style="margin-bottom:24px;">
      <div style="font-size:12px;font-weight:800;letter-spacing:0.07em;text-transform:uppercase;color:#94A3B8;margin-bottom:8px;">Recruiter Activity</div>
      <div style="display:flex;gap:16px;margin-bottom:10px;">
        <span style="font-size:11px;color:#FF9800;font-weight:700;">■ Applications</span>
        <span style="font-size:11px;color:#2196F3;font-weight:700;">■ Interviews</span>
      </div>
      <div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:14px;padding:18px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0">${rows}</table>
      </div>
    </div>`;
}

function insightBlock(insightText) {
  if (!insightText) return "";
  return `
    <div style="margin-bottom:24px;padding:20px 22px;background:#FFF7F3;border:1px solid #FBD5C6;border-radius:14px;border-left:4px solid #FF7043;">
      <div style="font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#C2410C;margin-bottom:10px;">
        ✦ AI Insight
      </div>
      <div style="font-size:15px;line-height:1.75;color:#1E293B;">${esc(insightText)}</div>
    </div>`;
}

function sectionHeader(recruiterName, accountName, reportingWindow, reportLabel) {
  return `
    <div style="margin-bottom:24px;padding-bottom:18px;border-bottom:1px solid #E2E8F0;">
      <div style="font-size:20px;font-weight:900;color:#0F172A;margin-bottom:6px;">${esc(accountName || "Your Organization")}</div>
      <div style="font-size:13px;color:#64748B;line-height:1.6;">
        Prepared for <strong style="color:#334155;">${esc(recruiterName || "Recruiter")}</strong>
        &nbsp;·&nbsp; ${esc(reportingWindow || "Current period")}
        &nbsp;·&nbsp; <span style="color:#FF7043;font-weight:700;">${esc(reportLabel)}</span>
      </div>
    </div>`;
}

// ─── Report builders ──────────────────────────────────────────────────────────

function buildExecutiveEmail(payload, insight) {
  const { recruiterName, accountName, reportingWindow, kpis, funnelData, sourcesData } = payload;
  const content = [
    sectionHeader(recruiterName, accountName, reportingWindow, "Executive Snapshot"),
    kpiBlock(kpis),
    insight ? insightBlock(insight) : "",
    funnelBlock(funnelData),
    sourcesBlock(sourcesData),
  ].join("");
  return emailWrapper(content, "Executive Snapshot");
}

function buildFunnelEmail(payload, insight) {
  const { recruiterName, accountName, reportingWindow, kpis, funnelData } = payload;
  const content = [
    sectionHeader(recruiterName, accountName, reportingWindow, "Funnel Report"),
    funnelBlock(funnelData),
    insight ? insightBlock(insight) : "",
    `<div style="margin-bottom:24px;padding:16px 20px;background:#F8FAFC;border-radius:12px;border:1px solid #E2E8F0;">
      <div style="display:flex;gap:32px;flex-wrap:wrap;">
        <div><div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#94A3B8;margin-bottom:4px;">Total Applies</div><div style="font-size:22px;font-weight:900;color:#0F172A;">${fmt(kpis?.totalApplies)}</div></div>
        <div><div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#94A3B8;margin-bottom:4px;">Conversion Rate</div><div style="font-size:22px;font-weight:900;color:#0F172A;">${fmt(kpis?.conversionRatePct, "%")}</div></div>
        <div><div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#94A3B8;margin-bottom:4px;">Hires</div><div style="font-size:22px;font-weight:900;color:#0F172A;">${fmt(kpis?.totalHires)}</div></div>
      </div>
    </div>`,
  ].join("");
  return emailWrapper(content, "Funnel Report");
}

function buildSourcesEmail(payload, insight) {
  const { recruiterName, accountName, reportingWindow, sourcesData } = payload;
  const content = [
    sectionHeader(recruiterName, accountName, reportingWindow, "Source Performance"),
    sourcesBlock(sourcesData),
    insight ? insightBlock(insight) : "",
  ].join("");
  return emailWrapper(content, "Source Performance");
}

function buildActivityEmail(payload, insight) {
  const { recruiterName, accountName, reportingWindow, kpis, activityData } = payload;
  const content = [
    sectionHeader(recruiterName, accountName, reportingWindow, "Recruiter Activity"),
    activityBlock(activityData),
    insight ? insightBlock(insight) : "",
    `<div style="padding:16px 20px;background:#F8FAFC;border-radius:12px;border:1px solid #E2E8F0;">
      <div style="display:flex;gap:32px;flex-wrap:wrap;">
        <div><div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#94A3B8;margin-bottom:4px;">Interviews</div><div style="font-size:22px;font-weight:900;color:#0F172A;">${fmt(kpis?.totalInterviews)}</div></div>
        <div><div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#94A3B8;margin-bottom:4px;">Applications</div><div style="font-size:22px;font-weight:900;color:#0F172A;">${fmt(kpis?.totalApplies)}</div></div>
      </div>
    </div>`,
  ].join("");
  return emailWrapper(content, "Recruiter Activity");
}

function buildTimeFillEmail(payload, insight) {
  const { recruiterName, accountName, reportingWindow, kpis } = payload;
  const content = [
    sectionHeader(recruiterName, accountName, reportingWindow, "Time-to-Fill"),
    `<div style="margin-bottom:24px;">
      <div style="font-size:12px;font-weight:800;letter-spacing:0.07em;text-transform:uppercase;color:#94A3B8;margin-bottom:12px;">Hiring Velocity</div>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="50%" style="padding:4px;">
            <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:22px;text-align:center;">
              <div style="font-size:10px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;color:#64748B;margin-bottom:8px;">Avg. Time to Fill</div>
              <div style="font-size:42px;font-weight:900;color:#FF7043;line-height:1;">${fmt(kpis?.avgTimeToFillDays ?? kpis?.avgTimeToFill)}</div>
              <div style="font-size:13px;color:#94A3B8;margin-top:4px;">days</div>
            </div>
          </td>
          <td width="50%" style="padding:4px;">
            <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:22px;text-align:center;">
              <div style="font-size:10px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;color:#64748B;margin-bottom:8px;">Total Hires</div>
              <div style="font-size:42px;font-weight:900;color:#0F172A;line-height:1;">${fmt(kpis?.totalHires)}</div>
              <div style="font-size:13px;color:#94A3B8;margin-top:4px;">this period</div>
            </div>
          </td>
        </tr>
      </table>
    </div>`,
    insight ? insightBlock(insight) : "",
  ].join("");
  return emailWrapper(content, "Time-to-Fill Report");
}

const REPORT_BUILDERS = {
  executive:    buildExecutiveEmail,
  funnel:       buildFunnelEmail,
  sources:      buildSourcesEmail,
  activity:     buildActivityEmail,
  "time-to-fill": buildTimeFillEmail,
};

const REPORT_LABELS = {
  executive:    "Executive Snapshot",
  funnel:       "Funnel Report",
  sources:      "Source Performance",
  activity:     "Recruiter Activity",
  "time-to-fill": "Time-to-Fill Report",
};

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Auth: NextAuth session (UI) or cron secret (job)
  const cronSecret = req.headers["x-cron-secret"];
  const isCronCall = cronSecret && cronSecret === process.env.CRON_SECRET;

  if (!isCronCall) {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.email) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  const {
    recipients,
    reportType     = "executive",
    accountName,
    recruiterName,
    reportingWindow,
    kpis           = {},
    funnelData     = [],
    sourcesData    = [],
    activityData   = [],
    insightSummary,
    includeInsights = true,
  } = req.body || {};

  const normalizedRecipients = Array.isArray(recipients)
    ? recipients.map((r) => String(r).trim()).filter(Boolean)
    : String(recipients || "").split(",").map((r) => r.trim()).filter(Boolean);

  if (!normalizedRecipients.length) {
    return res.status(400).json({ error: "No recipients provided" });
  }

  const builder = REPORT_BUILDERS[reportType] || REPORT_BUILDERS.executive;
  const label   = REPORT_LABELS[reportType]   || "Executive Snapshot";

  // Generate AI insight if enabled
  let insight = insightSummary || null;
  if (includeInsights && !insight) {
    insight = await generateInsight(reportType, kpis, funnelData, sourcesData, activityData);
  }

  const payload = { recipients: normalizedRecipients, reportType, accountName, recruiterName, reportingWindow, kpis, funnelData, sourcesData, activityData };
  const html = builder(payload, insight);

  const text = `
${label} — ${accountName || "ForgeTomorrow"}
Prepared for: ${recruiterName || "Recruiter"}
${reportingWindow || ""}

Key Metrics:
- Job Views: ${kpis?.totalViews ?? kpis?.jobViews ?? "—"}
- Applications: ${kpis?.totalApplies ?? kpis?.applies ?? "—"}
- Conversion: ${kpis?.conversionRatePct ?? "—"}%
- Time to Fill: ${kpis?.avgTimeToFillDays ?? "—"} days
- Hires: ${kpis?.totalHires ?? "—"}

${insight ? `Insight:\n${insight}` : ""}
  `.trim();

  try {
    await safeSendMail(
      {
        to:      normalizedRecipients.join(","),
        subject: `${label} — ${accountName || "ForgeTomorrow"}`,
        html,
        text,
      },
      { type: "snapshot", subtype: reportType, to: normalizedRecipients.join(",") }
    );

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("snapshot email error:", err);
    return res.status(500).json({ error: "Email failed", message: err?.message || "Unknown error" });
  }
}