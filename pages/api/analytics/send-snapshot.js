// pages/api/analytics/send-snapshot.js
import { safeSendMail } from "@/lib/email";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatMetric(value, suffix = "") {
  if (value === null || value === undefined || value === "") return "—";
  return `${value}${suffix}`;
}

function buildKPISection(kpis = {}) {
  const metrics = [
    {
      label: "Job Views",
      value: formatMetric(
        kpis.jobViews ?? kpis.totalJobViews ?? kpis.views ?? kpis.totalViews
      ),
    },
    {
      label: "Applications",
      value: formatMetric(
        kpis.applies ?? kpis.totalApplies ?? kpis.applications
      ),
    },
    {
      label: "Conversion Rate",
      value: formatMetric(
        kpis.conversionRate ?? kpis.viewToApplyRate,
        "%"
      ),
    },
    {
      label: "Time to Fill",
      value: formatMetric(
        kpis.avgTimeToFill ?? kpis.timeToFill,
        " days"
      ),
    },
  ];

  return `
    <div style="margin:0 0 28px 0;">
      <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;">
        ${metrics
          .map(
            (m) => `
          <div style="padding:18px;border:1px solid #E2E8F0;border-radius:14px;background:#F8FAFC;">
            <div style="font-size:12px;color:#64748B;margin-bottom:8px;">${escapeHtml(m.label)}</div>
            <div style="font-size:30px;font-weight:800;color:#0F172A;">${escapeHtml(m.value)}</div>
          </div>
        `
          )
          .join("")}
      </div>
    </div>
  `;
}

function buildSection(title, content, highlight = false) {
  if (!content) return "";

  return `
    <div style="
      margin:0 0 20px 0;
      padding:20px;
      border-radius:14px;
      border:1px solid ${highlight ? "#FBD5C6" : "#E2E8F0"};
      background:${highlight ? "#FFF7F3" : "#FFFFFF"};
    ">
      <div style="
        font-size:13px;
        font-weight:800;
        letter-spacing:0.06em;
        text-transform:uppercase;
        color:${highlight ? "#C2410C" : "#94A3B8"};
        margin-bottom:10px;
      ">
        ${escapeHtml(title)}
      </div>
      <div style="font-size:16px;line-height:1.7;color:#0F172A;">
        ${escapeHtml(content)}
      </div>
    </div>
  `;
}

function buildListSection(title, items = []) {
  const clean = Array.isArray(items)
    ? items.map((i) => String(i).trim()).filter(Boolean)
    : [];

  if (!clean.length) return "";

  return `
    <div style="margin-top:18px;padding:18px;border:1px solid #E2E8F0;border-radius:14px;background:#FFFFFF;">
      <div style="font-size:13px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:#94A3B8;margin-bottom:10px;">
        ${escapeHtml(title)}
      </div>
      <ul style="padding-left:18px;margin:0;color:#334155;line-height:1.8;">
        ${clean.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ul>
    </div>
  `;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    recipients,
    accountName,
    recruiterName,
    reportingWindow,
    kpis,
    insightSummary,
    recommendedAction,
    funnelBreakdown,
    sourceBreakdown,
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

  const html = `
    <div style="font-family:Arial,sans-serif;padding:24px;background:#F8FAFC;color:#334155;">
      <div style="max-width:760px;margin:0 auto;background:#FFFFFF;border-radius:18px;border:1px solid #E2E8F0;overflow:hidden;">
        
        <!-- HEADER -->
        <div style="padding:26px;border-bottom:1px solid #E2E8F0;background:#FFFFFF;">
          <div style="font-size:12px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#FF7043;margin-bottom:10px;">
            Executive Snapshot
          </div>

          <h1 style="margin:0;font-size:30px;color:#0F172A;">
            ${escapeHtml(accountName || "Account")}
          </h1>

          <div style="margin-top:10px;font-size:14px;color:#475569;line-height:1.7;">
            Prepared for <strong>${escapeHtml(recruiterName || "Recruiter")}</strong><br/>
            ${escapeHtml(reportingWindow || "")}
          </div>
        </div>

        <!-- BODY -->
        <div style="padding:26px;">

          ${buildKPISection(kpis)}

          ${buildSection("Insight", insightSummary)}

          ${buildSection("Recommended Action", recommendedAction, true)}

          ${buildListSection("Funnel Breakdown", funnelBreakdown)}

          ${buildListSection("Source Breakdown", sourceBreakdown)}

        </div>

      </div>
    </div>
  `;

  const text = `
Executive Snapshot — ${accountName || "Account"}

Prepared for: ${recruiterName || "Recruiter"}
${reportingWindow || ""}

Key Metrics:
- Job Views: ${kpis?.jobViews ?? "—"}
- Applications: ${kpis?.applies ?? "—"}
- Conversion Rate: ${kpis?.conversionRate ?? "—"}%
- Time to Fill: ${kpis?.avgTimeToFill ?? "—"} days

${insightSummary ? `Insight:\n${insightSummary}\n` : ""}

${recommendedAction ? `Recommended Action:\n${recommendedAction}\n` : ""}
`;

  try {
    await safeSendMail(
      {
        to: normalizedRecipients.join(","),
        subject: `Executive Snapshot — ${accountName || "ForgeTomorrow"}`,
        html,
        text,
      },
      { type: "snapshot", to: normalizedRecipients.join(",") }
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