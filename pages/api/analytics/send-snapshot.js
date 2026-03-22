// pages/api/analytics/send-snapshot.js
import { safeSendMail } from "@/lib/email";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { recipients, snapshotType } = req.body || {};

  // Normalize recipients (supports string or array)
  const normalizedRecipients = Array.isArray(recipients)
    ? recipients.map((r) => String(r).trim()).filter(Boolean)
    : String(recipients || "")
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean);

  if (!normalizedRecipients.length) {
    return res.status(400).json({ error: "No recipients provided" });
  }

  try {
    await safeSendMail(
      {
        to: normalizedRecipients.join(","),
        subject: "Executive Snapshot – ForgeTomorrow",
        html: `
          <div style="font-family:Arial,sans-serif;padding:24px;background:#f8fafc;color:#334155;">
            <h2 style="margin:0 0 12px 0;color:#FF7043;">Executive Snapshot</h2>
            <p style="margin:0 0 10px 0;">
              This is your current recruiter performance snapshot.
            </p>
            <p style="margin:0;">
              <strong>Type:</strong> ${snapshotType || "executive"}
            </p>
          </div>
        `,
        text: [
          "Executive Snapshot",
          "",
          `Type: ${snapshotType || "executive"}`,
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