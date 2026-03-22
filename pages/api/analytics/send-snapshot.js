// pages/api/analytics/send-snapshot.js
import { safeSendMail } from "@/lib/email";

function formatCadenceSummary({
  cadence,
  timezone,
  timeOfDay,
  weeklyDay,
  monthlyMode,
  monthlyDate,
  monthlyOrdinal,
  monthlyWeekday,
}) {
  if (cadence === "daily") {
    return `Daily at ${timeOfDay || "08:00"} (${timezone || "Not set"})`;
  }

  if (cadence === "weekly") {
    return `Weekly on ${weeklyDay || "Monday"} at ${timeOfDay || "08:00"} (${timezone || "Not set"})`;
  }

  if (cadence === "monthly") {
    if (monthlyMode === "ordinal") {
      return `Monthly on the ${(monthlyOrdinal || "First").toLowerCase()} ${monthlyWeekday || "Monday"} at ${timeOfDay || "08:00"} (${timezone || "Not set"})`;
    }

    return `Monthly on day ${monthlyDate || "1"} at ${timeOfDay || "08:00"} (${timezone || "Not set"})`;
  }

  return "Not scheduled";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    recipients,
    snapshotType,
    includePng,
    includeInsights,
    timezone,
    cadence,
    timeOfDay,
    weeklyDay,
    monthlyMode,
    monthlyDate,
    monthlyOrdinal,
    monthlyWeekday,
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

  const cadenceSummary = formatCadenceSummary({
    cadence,
    timezone,
    timeOfDay,
    weeklyDay,
    monthlyMode,
    monthlyDate,
    monthlyOrdinal,
    monthlyWeekday,
  });

  try {
    await safeSendMail(
      {
        to: normalizedRecipients.join(","),
        subject: "Executive Snapshot – ForgeTomorrow",
        html: `
          <div style="font-family:Arial,sans-serif;padding:24px;background:#f8fafc;color:#334155;">
            <div style="max-width:700px;margin:0 auto;background:#ffffff;border-radius:14px;border:1px solid #e2e8f0;overflow:hidden;">
              <div style="padding:20px 24px;background:#fff7f3;border-bottom:1px solid #e2e8f0;">
                <h1 style="margin:0;font-size:28px;line-height:1.1;color:#FF7043;">Executive Snapshot</h1>
                <p style="margin:8px 0 0 0;font-size:14px;color:#64748B;">
                  ForgeTomorrow recruiter reporting summary
                </p>
              </div>

              <div style="padding:24px;">
                <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;">
                  This is your current recruiter performance snapshot. Delivery settings and included content are summarized below.
                </p>

                <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:0 0 18px 0;">
                  <div style="padding:14px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;">
                    <div style="font-size:12px;color:#64748B;margin-bottom:6px;">Snapshot type</div>
                    <div style="font-size:18px;font-weight:800;color:#334155;">${snapshotType || "executive"}</div>
                  </div>

                  <div style="padding:14px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;">
                    <div style="font-size:12px;color:#64748B;margin-bottom:6px;">Recipient count</div>
                    <div style="font-size:18px;font-weight:800;color:#334155;">${normalizedRecipients.length}</div>
                  </div>

                  <div style="padding:14px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;">
                    <div style="font-size:12px;color:#64748B;margin-bottom:6px;">Time zone</div>
                    <div style="font-size:18px;font-weight:800;color:#334155;">${timezone || "Not set"}</div>
                  </div>

                  <div style="padding:14px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;">
                    <div style="font-size:12px;color:#64748B;margin-bottom:6px;">Delivery cadence</div>
                    <div style="font-size:16px;font-weight:800;color:#334155;">${cadenceSummary}</div>
                  </div>
                </div>

                <div style="padding:16px;border:1px solid #e2e8f0;border-radius:12px;background:#ffffff;">
                  <div style="font-size:13px;font-weight:800;color:#334155;margin-bottom:10px;">Included content</div>
                  <ul style="padding-left:18px;margin:0;color:#475569;line-height:1.8;">
                    <li>PNG-ready reporting attachment: ${includePng ? "Yes" : "No"}</li>
                    <li>AI insights summary: ${includeInsights ? "Yes" : "No"}</li>
                  </ul>
                </div>

                <div style="margin-top:20px;font-size:12px;color:#64748B;line-height:1.7;">
                  Sent by ForgeTomorrow Executive Snapshot Delivery Center
                </div>
              </div>
            </div>
          </div>
        `,
        text: [
          "Executive Snapshot – ForgeTomorrow",
          "",
          "This is your current recruiter performance snapshot.",
          "",
          `Snapshot type: ${snapshotType || "executive"}`,
          `Recipient count: ${normalizedRecipients.length}`,
          `Time zone: ${timezone || "Not set"}`,
          `Delivery cadence: ${cadenceSummary}`,
          `PNG-ready reporting attachment: ${includePng ? "Yes" : "No"}`,
          `AI insights summary: ${includeInsights ? "Yes" : "No"}`,
        ].join("\n"),
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