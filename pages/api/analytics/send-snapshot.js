// pages/api/analytics/send-snapshot.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { recipients, snapshot } = req.body;

    if (!recipients || !recipients.length) {
      return res.status(400).json({ error: "Recipients required" });
    }

    // TODO: replace with real email service (Resend, SendGrid, etc)
    console.log("Sending snapshot to:", recipients);

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: "Failed to send snapshot" });
  }
}