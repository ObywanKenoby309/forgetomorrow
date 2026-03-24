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
// Charts      → Inline HTML (email-safe)

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { safeSendMail } from "@/lib/email";

const BRAND_DARK = "#0F172A";
const BRAND_ORANGE = "#FF7043";
const TEXT = "#1E293B";
const MUTED = "#64748B";
const BORDER = "#E2E8F0";
const PANEL = "#F8FAFC";
const AI_BG = "#FFF7F3";
const AI_BORDER = "#FBD5C6";

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
  if (!Number.isNaN(num)) return `${num.toLocaleString()}${suffix}`;
  return `${value}${suffix}`;
}

function cap(value = "") {
  return String(value).charAt(0).toUpperCase() + String(value).slice(1);
}

function getReportLabel(reportType) {
  const labels = {
    executive: "Executive Snapshot",
    funnel: "Funnel Report",
    sources: "Source Performance Report",
    activity: "Recruiter Activity Report",
    "time-to-fill": "Time-to-Fill Report",
  };
  return labels[reportType] || labels.executive;
}

function getReportSummary(reportType) {
  const summaries = {
    executive:
      "A leadership-ready summary of recruiting health, combining core KPIs, pipeline movement, source performance, and AI evaluation.",
    funnel:
      "A focused conversion report showing how candidates move through the hiring funnel and where drop-off is affecting outcomes.",
    sources:
      "A channel-performance report showing where candidate volume is coming from and which sources appear to be driving stronger recruiting value.",
    activity:
      "A recruiter operations report highlighting outreach and interview activity trends to support performance and staffing discussions.",
    "time-to-fill":
      "A hiring velocity report focused on fill speed, downstream outcomes, and where leadership attention may reduce delay.",
  };
  return summaries[reportType] || summaries.executive;
}

function getFallbackInsight(reportType, kpis, funnelData, sourcesData, activityData) {
  const topSource =
    Array.isArray(sourcesData) && sourcesData.length
      ? [...sourcesData].sort((a, b) => Number(b?.value || 0) - Number(a?.value || 0))[0]
      : null;

  const topFunnelStage =
    Array.isArray(funnelData) && funnelData.length
      ? [...funnelData].sort((a, b) => Number(b?.value || 0) - Number(a?.value || 0))[0]
      : null;

  const latestActivity =
    Array.isArray(activityData) && activityData.length ? activityData[activityData.length - 1] : null;

  const fallbacks = {
    executive: `Current recruiting activity shows ${fmt(
      kpis?.totalApplies ?? 0
    )} applications and ${fmt(
      kpis?.totalHires ?? 0
    )} hires in the selected period. Leadership should focus on improving conversion efficiency while reinforcing the channels and stages already producing measurable traction.`,
    funnel: `The funnel currently shows strongest visible volume at ${esc(
      topFunnelStage?.stage || "the top of the pipeline"
    )}. The clearest next step is to identify where movement slows between early engagement and completed applications or interviews.`,
    sources: `Current source performance suggests ${
      topSource ? `${esc(topSource.name)} is contributing the most visible volume` : "source mix is still developing"
    }. Leadership should use this report to compare reach against downstream quality before shifting recruiter effort or budget.`,
    activity: `Recent recruiter activity ${
      latestActivity
        ? `shows ${fmt(latestActivity.messages)} application-related actions and ${fmt(
            latestActivity.responses
          )} interview-related actions in the latest tracked period`
        : "is still building"
    }. The next leadership question should be whether activity levels are converting into consistent pipeline outcomes.`,
    "time-to-fill": `Average time-to-fill is currently ${fmt(
      kpis?.avgTimeToFillDays ?? 0,
      " days"
    )}. Leadership should review approval speed, scheduling responsiveness, and bottlenecks in later-stage decision making to improve hiring velocity.`,
  };

  return fallbacks[reportType] || fallbacks.executive;
}

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
    executive:
      "You are a senior talent analytics advisor writing for a C-suite audience. Based on the recruiting metrics below, write a 2-3 sentence executive insight that identifies the single most important signal in the data and a concrete recommended action. Be direct, specific, and data-driven. No fluff.",
    funnel:
      "You are a talent acquisition analyst. Based on the application funnel data below, write a 2-3 sentence insight identifying where candidates are dropping off and what that means for the recruiting team. Be specific and actionable.",
    sources:
      "You are a recruiting strategy advisor. Based on the source performance data below, write a 2-3 sentence insight about which channels are delivering the best results and where budget or effort should be shifted.",
    activity:
      "You are a recruiting operations analyst. Based on the recruiter activity data below, write a 2-3 sentence insight about team productivity trends and any patterns worth flagging to leadership.",
    "time-to-fill":
      "You are a hiring efficiency consultant. Based on the time-to-fill data below, write a 2-3 sentence insight about hiring velocity, what's driving it, and what leadership should prioritize to improve it.",
  };

  const systemPrompt = prompts[reportType] || prompts.executive;
  const userContent = `Here is the recruiting data:\n${dataContext[reportType] || dataContext.executive}`;

  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        max_tokens: 200,
        temperature: 0.4,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (groqRes.ok) {
      const groqData = await groqRes.json();
      const text = groqData?.choices?.[0]?.message?.content?.trim();
      if (text) return text;
    }
  } catch {}

  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        max_tokens: 200,
        temperature: 0.4,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (openaiRes.ok) {
      const openaiData = await openaiRes.json();
      const text = openaiData?.choices?.[0]?.message?.content?.trim();
      if (text) return text;
    }
  } catch {}

  return null;
}

function logoLockup() {
  return `
    <table cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="vertical-align:middle;">
          <div style="width:42px;height:42px;border:2px solid ${BRAND_ORANGE};border-radius:10px;display:flex;align-items:center;justify-content:center;color:${BRAND_ORANGE};font-size:18px;font-weight:900;line-height:1;">
            FT
          </div>
        </td>
        <td style="vertical-align:middle;padding-left:12px;">
          <div style="font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:${BRAND_ORANGE};margin-bottom:4px;">
            ForgeTomorrow Analytics
          </div>
          <div style="font-size:24px;font-weight:900;color:#FFFFFF;line-height:1.15;">
            Executive Snapshot
          </div>
        </td>
      </tr>
    </table>
  `;
}

function emailWrapper(content, reportLabel, accountName, reportingWindow) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${esc(reportLabel)}</title>
</head>
<body style="margin:0;padding:0;background:#EDEFF2;font-family:Arial,Helvetica,sans-serif;color:${TEXT};">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#EDEFF2;padding:28px 12px;">
    <tr>
      <td align="center">
        <table width="720" cellpadding="0" cellspacing="0" border="0" style="max-width:720px;width:100%;background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid ${BORDER};">
          <tr>
            <td style="background:${BRAND_DARK};padding:24px 28px 18px;border-bottom:4px solid ${BRAND_ORANGE};">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td valign="top">
                    ${logoLockup()}
                  </td>
                  <td valign="top" align="right">
                    <div style="font-size:11px;color:#CBD5E1;line-height:1.7;text-align:right;">
                      <div style="font-weight:700;color:#FFFFFF;">${esc(reportLabel)}</div>
                      <div>${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
                      <div>${esc(reportingWindow || "Current period")}</div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:22px 28px 10px;">
              <div style="font-size:24px;font-weight:900;color:${TEXT};margin-bottom:6px;">${esc(accountName || "Your Organization")}</div>
              <div style="font-size:13px;color:${MUTED};line-height:1.7;">
                This report delivers a leadership-focused summary of recruiting performance, highlighting pipeline health, conversion strength, and the clearest next action for decision-makers.
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:0 28px 28px;">
              ${content}
            </td>
          </tr>

          <tr>
            <td style="padding:18px 28px;background:#F8FAFC;border-top:1px solid ${BORDER};">
              <div style="font-size:11px;color:#94A3B8;line-height:1.7;">
                This report was generated by ForgeTomorrow Analytics.
                Update your
                <a href="${process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL}/recruiter/analytics/snapshot-delivery" style="color:${BRAND_ORANGE};text-decoration:none;font-weight:700;">
                  delivery preferences
                </a>.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function heroBlock(recruiterName, reportLabel, insight, kpis) {
  const metrics = [
    { label: "Job Views", value: fmt(kpis?.totalViews ?? kpis?.jobViews ?? 0) },
    { label: "Applications", value: fmt(kpis?.totalApplies ?? kpis?.applies ?? 0) },
    { label: "Conversion", value: fmt(kpis?.conversionRatePct ?? kpis?.conversionRate ?? 0, "%") },
    { label: "Interviews", value: fmt(kpis?.totalInterviews ?? 0) },
    { label: "Hires", value: fmt(kpis?.totalHires ?? 0) },
    { label: "Time to Fill", value: fmt(kpis?.avgTimeToFillDays ?? kpis?.avgTimeToFill ?? 0, " days") },
  ];

  const rows = [
    metrics.slice(0, 3),
    metrics.slice(3, 6),
  ]
    .map(
      (row) => `
      <tr>
        ${row
          .map(
            (m) => `
          <td style="padding:6px;" width="33.33%">
            <div style="background:${PANEL};border:1px solid ${BORDER};border-radius:12px;padding:14px 12px;text-align:center;">
              <div style="font-size:10px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:${MUTED};margin-bottom:8px;">${esc(m.label)}</div>
              <div style="font-size:24px;font-weight:900;color:${TEXT};line-height:1;">${esc(m.value)}</div>
            </div>
          </td>`
          )
          .join("")}
      </tr>`
    )
    .join("");

  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:22px;">
      <tr>
        <td style="padding-bottom:16px;border-bottom:1px solid ${BORDER};">
          <div style="font-size:12px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND_ORANGE};margin-bottom:6px;">Leadership Brief</div>
          <div style="font-size:13px;color:${MUTED};line-height:1.7;">
            Prepared for <strong style="color:${TEXT};">${esc(recruiterName || "Recruiter")}</strong>
            &nbsp;&middot;&nbsp;
            <span style="color:${BRAND_ORANGE};font-weight:700;">${esc(reportLabel)}</span>
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding-top:18px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td valign="top" width="58%" style="padding-right:10px;">
                <div style="font-size:12px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:${MUTED};margin-bottom:10px;">Performance Snapshot</div>
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  ${rows}
                </table>
              </td>
              <td valign="top" width="42%" style="padding-left:10px;">
                <div style="font-size:12px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:${MUTED};margin-bottom:10px;">AI Evaluation</div>
                <div style="background:${AI_BG};border:1px solid ${AI_BORDER};border-left:4px solid ${BRAND_ORANGE};border-radius:12px;padding:16px 16px 16px 14px;">
                  <div style="font-size:12px;font-weight:800;color:${BRAND_ORANGE};text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">Leadership Readout</div>
                  <div style="font-size:14px;line-height:1.7;color:${TEXT};">
                    ${esc(insight)}
                  </div>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
}

function sectionTitle(title, subtitle = "") {
  return `
    <div style="margin-bottom:12px;">
      <div style="font-size:12px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:${MUTED};margin-bottom:6px;">${esc(title)}</div>
      ${
        subtitle
          ? `<div style="font-size:13px;color:${MUTED};line-height:1.6;">${esc(subtitle)}</div>`
          : ""
      }
    </div>`;
}

function sectionCard(innerHtml) {
  return `
    <div style="background:#FFFFFF;border:1px solid ${BORDER};border-radius:14px;padding:18px 20px;margin-bottom:22px;">
      ${innerHtml}
    </div>`;
}

function funnelBlock(funnelData) {
  if (!Array.isArray(funnelData) || !funnelData.length) {
    return sectionCard(
      `${sectionTitle("Application Funnel", "No funnel activity is available for the selected period.")}
       <div style="font-size:13px;color:${MUTED};line-height:1.7;">Pipeline activity will appear here as candidate movement is recorded.</div>`
    );
  }

  const max = Math.max(...funnelData.map((d) => Number(d.value || 0)), 1);

  const rows = funnelData
    .map((stage) => {
      const pct = Math.round((Number(stage.value || 0) / max) * 100);
      return `
        <tr>
          <td width="120" style="padding:6px 12px 6px 0;font-size:12px;font-weight:700;color:${TEXT};white-space:nowrap;">${esc(
            stage.stage || stage.name || ""
          )}</td>
          <td style="padding:6px 0;">
            <div style="background:#EDF2F7;border-radius:999px;height:16px;overflow:hidden;">
              <div style="background:linear-gradient(90deg,#F57C00,#FFB74D);height:16px;border-radius:999px;width:${pct}%;min-width:4px;"></div>
            </div>
          </td>
          <td width="84" style="padding:6px 0 6px 10px;font-size:12px;font-weight:800;color:${TEXT};text-align:right;">
            ${fmt(stage.value)}
            <div style="font-size:10px;color:${MUTED};font-weight:700;margin-top:2px;">${pct}%</div>
          </td>
        </tr>`;
    })
    .join("");

  return sectionCard(
    `${sectionTitle("Application Funnel", "Pipeline progression from initial visibility through hire.")}
     <table width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table>`
  );
}

function sourcesBlock(sourcesData) {
  if (!Array.isArray(sourcesData) || !sourcesData.length) {
    return sectionCard(
      `${sectionTitle("Source Performance", "No source activity is available for the selected period.")}
       <div style="font-size:13px;color:${MUTED};line-height:1.7;">Channel performance will appear here as source-attributed activity is recorded.</div>`
    );
  }

  const total = sourcesData.reduce((sum, s) => sum + Number(s.value || 0), 0) || 1;

  const rows = sourcesData
    .slice(0, 8)
    .map((source) => {
      const pct = Math.round((Number(source.value || 0) / total) * 100);
      return `
        <tr>
          <td width="150" style="padding:6px 12px 6px 0;font-size:12px;font-weight:700;color:${TEXT};">${esc(
            source.name || ""
          )}</td>
          <td style="padding:6px 0;">
            <div style="background:#EDF2F7;border-radius:999px;height:14px;overflow:hidden;">
              <div style="background:rgba(255,112,67,0.92);height:14px;border-radius:999px;width:${pct}%;min-width:4px;"></div>
            </div>
          </td>
          <td width="58" style="padding:6px 0 6px 10px;font-size:12px;font-weight:800;color:${TEXT};text-align:right;">${pct}%</td>
        </tr>`;
    })
    .join("");

  return sectionCard(
    `${sectionTitle("Source Performance", "Visible source mix for the selected reporting window.")}
     <table width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table>`
  );
}

function activityBlock(activityData) {
  if (!Array.isArray(activityData) || !activityData.length) {
    return sectionCard(
      `${sectionTitle("Recruiter Activity", "No recruiter activity is available for the selected period.")}
       <div style="font-size:13px;color:${MUTED};line-height:1.7;">Activity trends will appear here as application and interview actions are recorded.</div>`
    );
  }

  const maxApps = Math.max(...activityData.map((d) => Number(d.messages || 0)), 1);
  const maxInts = Math.max(...activityData.map((d) => Number(d.responses || 0)), 1);

  const rows = activityData
    .slice(-8)
    .map((item) => {
      const appPct = Math.round((Number(item.messages || 0) / maxApps) * 100);
      const intPct = Math.round((Number(item.responses || 0) / maxInts) * 100);
      return `
        <tr>
          <td width="48" style="padding:6px 8px 6px 0;font-size:11px;font-weight:700;color:${TEXT};">${esc(
            item.week || ""
          )}</td>
          <td style="padding:6px 8px 6px 0;">
            <div style="font-size:10px;color:${MUTED};margin-bottom:4px;">Applications</div>
            <div style="background:#FFF3E0;border-radius:999px;height:14px;overflow:hidden;">
              <div style="background:#FF9800;height:14px;border-radius:999px;width:${appPct}%;min-width:4px;"></div>
            </div>
          </td>
          <td width="44" style="padding:6px 10px 6px 0;font-size:11px;font-weight:800;color:#C2410C;text-align:right;">${fmt(
            item.messages
          )}</td>
          <td style="padding:6px 8px 6px 0;">
            <div style="font-size:10px;color:${MUTED};margin-bottom:4px;">Interviews</div>
            <div style="background:#E3F2FD;border-radius:999px;height:14px;overflow:hidden;">
              <div style="background:#2196F3;height:14px;border-radius:999px;width:${intPct}%;min-width:4px;"></div>
            </div>
          </td>
          <td width="44" style="padding:6px 0 6px 0;font-size:11px;font-weight:800;color:#1D4ED8;text-align:right;">${fmt(
            item.responses
          )}</td>
        </tr>`;
    })
    .join("");

  return sectionCard(
    `${sectionTitle("Recruiter Activity", "Applications and interview-related activity across the selected period.")}
     <table width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table>`
  );
}

function timeToFillBlock(kpis) {
  return sectionCard(`
    ${sectionTitle("Hiring Velocity", "Time-to-fill and downstream hiring output for the selected period.")}
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td width="50%" style="padding:6px;">
          <div style="background:${PANEL};border:1px solid ${BORDER};border-radius:12px;padding:20px;text-align:center;">
            <div style="font-size:10px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:${MUTED};margin-bottom:8px;">Average Time to Fill</div>
            <div style="font-size:38px;font-weight:900;color:${BRAND_ORANGE};line-height:1;">${fmt(
    kpis?.avgTimeToFillDays ?? kpis?.avgTimeToFill ?? 0
  )}</div>
            <div style="font-size:12px;color:${MUTED};margin-top:4px;">days</div>
          </div>
        </td>
        <td width="50%" style="padding:6px;">
          <div style="background:${PANEL};border:1px solid ${BORDER};border-radius:12px;padding:20px;text-align:center;">
            <div style="font-size:10px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:${MUTED};margin-bottom:8px;">Total Hires</div>
            <div style="font-size:38px;font-weight:900;color:${TEXT};line-height:1;">${fmt(
    kpis?.totalHires ?? 0
  )}</div>
            <div style="font-size:12px;color:${MUTED};margin-top:4px;">this period</div>
          </div>
        </td>
      </tr>
    </table>
  `);
}

function supportingNotes(reportType, kpis, funnelData, sourcesData, activityData) {
  const topSource =
    Array.isArray(sourcesData) && sourcesData.length
      ? [...sourcesData].sort((a, b) => Number(b?.value || 0) - Number(a?.value || 0))[0]
      : null;

  const topStage =
    Array.isArray(funnelData) && funnelData.length
      ? [...funnelData].sort((a, b) => Number(b?.value || 0) - Number(a?.value || 0))[0]
      : null;

  const latestActivity =
    Array.isArray(activityData) && activityData.length ? activityData[activityData.length - 1] : null;

  const notes = {
    executive: [
      `Top visible funnel stage: ${topStage ? `${topStage.stage} (${fmt(topStage.value)})` : "No activity recorded"}`,
      `Top visible source: ${topSource ? `${topSource.name}` : "No source activity recorded"}`,
      `Average time-to-fill: ${fmt(kpis?.avgTimeToFillDays ?? 0, " days")}`,
    ],
    funnel: [
      `Highest visible stage count: ${topStage ? `${topStage.stage} (${fmt(topStage.value)})` : "No activity recorded"}`,
      `Applications recorded: ${fmt(kpis?.totalApplies ?? 0)}`,
      `Hires recorded: ${fmt(kpis?.totalHires ?? 0)}`,
    ],
    sources: [
      `Leading source: ${topSource ? `${topSource.name} (${fmt(topSource.value)})` : "No source activity recorded"}`,
      `Applications recorded: ${fmt(kpis?.totalApplies ?? 0)}`,
      `Interviews recorded: ${fmt(kpis?.totalInterviews ?? 0)}`,
    ],
    activity: [
      `Latest tracked application activity: ${fmt(latestActivity?.messages ?? 0)}`,
      `Latest tracked interview activity: ${fmt(latestActivity?.responses ?? 0)}`,
      `Total interviews recorded: ${fmt(kpis?.totalInterviews ?? 0)}`,
    ],
    "time-to-fill": [
      `Average time-to-fill: ${fmt(kpis?.avgTimeToFillDays ?? 0, " days")}`,
      `Total hires recorded: ${fmt(kpis?.totalHires ?? 0)}`,
      `Total interviews recorded: ${fmt(kpis?.totalInterviews ?? 0)}`,
    ],
  };

  const items = notes[reportType] || notes.executive;

  return sectionCard(`
    ${sectionTitle("Key Takeaways", "Supporting signals leaders can use in discussion and follow-up.")}
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      ${items
        .map(
          (item) => `
        <tr>
          <td width="18" valign="top" style="padding:6px 0;color:${BRAND_ORANGE};font-size:16px;line-height:1;">•</td>
          <td style="padding:6px 0;font-size:13px;color:${TEXT};line-height:1.7;">${esc(item)}</td>
        </tr>`
        )
        .join("")}
    </table>
  `);
}

function buildExecutiveEmail(payload, insight) {
  const { recruiterName, accountName, reportingWindow, kpis, funnelData, sourcesData, activityData } = payload;

  const content = [
    heroBlock(recruiterName, "Executive Snapshot", insight, kpis),
    funnelBlock(funnelData),
    sourcesBlock(sourcesData),
    supportingNotes("executive", kpis, funnelData, sourcesData, activityData),
  ].join("");

  return emailWrapper(content, "Executive Snapshot", accountName, reportingWindow);
}

function buildFunnelEmail(payload, insight) {
  const { recruiterName, accountName, reportingWindow, kpis, funnelData, sourcesData, activityData } = payload;

  const content = [
    heroBlock(recruiterName, "Funnel Report", insight, kpis),
    funnelBlock(funnelData),
    supportingNotes("funnel", kpis, funnelData, sourcesData, activityData),
  ].join("");

  return emailWrapper(content, "Funnel Report", accountName, reportingWindow);
}

function buildSourcesEmail(payload, insight) {
  const { recruiterName, accountName, reportingWindow, kpis, funnelData, sourcesData, activityData } = payload;

  const content = [
    heroBlock(recruiterName, "Source Performance Report", insight, kpis),
    sourcesBlock(sourcesData),
    supportingNotes("sources", kpis, funnelData, sourcesData, activityData),
  ].join("");

  return emailWrapper(content, "Source Performance Report", accountName, reportingWindow);
}

function buildActivityEmail(payload, insight) {
  const { recruiterName, accountName, reportingWindow, kpis, funnelData, sourcesData, activityData } = payload;

  const content = [
    heroBlock(recruiterName, "Recruiter Activity Report", insight, kpis),
    activityBlock(activityData),
    supportingNotes("activity", kpis, funnelData, sourcesData, activityData),
  ].join("");

  return emailWrapper(content, "Recruiter Activity Report", accountName, reportingWindow);
}

function buildTimeFillEmail(payload, insight) {
  const { recruiterName, accountName, reportingWindow, kpis, funnelData, sourcesData, activityData } = payload;

  const content = [
    heroBlock(recruiterName, "Time-to-Fill Report", insight, kpis),
    timeToFillBlock(kpis),
    supportingNotes("time-to-fill", kpis, funnelData, sourcesData, activityData),
  ].join("");

  return emailWrapper(content, "Time-to-Fill Report", accountName, reportingWindow);
}

const REPORT_BUILDERS = {
  executive: buildExecutiveEmail,
  funnel: buildFunnelEmail,
  sources: buildSourcesEmail,
  activity: buildActivityEmail,
  "time-to-fill": buildTimeFillEmail,
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

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
    reportType = "executive",
    accountName,
    recruiterName,
    reportingWindow,
    kpis = {},
    funnelData = [],
    sourcesData = [],
    activityData = [],
    insightSummary,
    includeInsights = true,
  } = req.body || {};

  const normalizedRecipients = Array.isArray(recipients)
    ? recipients.map((r) => String(r).trim()).filter(Boolean)
    : String(recipients || "")
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean);

  if (!normalizedRecipients.length) {
    return res.status(400).json({ error: "No recipients provided" });
  }

  let insight = insightSummary || null;
  if (includeInsights && !insight) {
    insight = await generateInsight(reportType, kpis, funnelData, sourcesData, activityData);
  }
  if (!insight) {
    insight = getFallbackInsight(reportType, kpis, funnelData, sourcesData, activityData);
  }

  const payload = {
    recipients: normalizedRecipients,
    reportType,
    accountName: accountName || "ForgeTomorrow Demo Account",
    recruiterName: recruiterName || "Recruiter Team",
    reportingWindow: reportingWindow || "Current period",
    kpis,
    funnelData,
    sourcesData,
    activityData,
  };

  const builder = REPORT_BUILDERS[reportType] || REPORT_BUILDERS.executive;
  const label = getReportLabel(reportType);
  const html = builder(payload, insight);

  const text = `
${label} — ${payload.accountName}
Prepared for: ${payload.recruiterName}
${payload.reportingWindow}

Summary:
${getReportSummary(reportType)}

Key Metrics:
- Job Views: ${kpis?.totalViews ?? kpis?.jobViews ?? "—"}
- Applications: ${kpis?.totalApplies ?? kpis?.applies ?? "—"}
- Conversion: ${kpis?.conversionRatePct ?? "—"}%
- Time to Fill: ${kpis?.avgTimeToFillDays ?? "—"} days
- Interviews: ${kpis?.totalInterviews ?? "—"}
- Hires: ${kpis?.totalHires ?? "—"}

AI Evaluation:
${insight}
  `.trim();

  try {
    await safeSendMail(
      {
        to: normalizedRecipients.join(","),
        subject: `${label} — ${payload.accountName}`,
        html,
        text,
      },
      { type: "snapshot", subtype: reportType, to: normalizedRecipients.join(",") }
    );

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("snapshot email error:", err);
    return res.status(500).json({
      error: "Email failed",
      message: err?.message || "Unknown error",
    });
  }
}