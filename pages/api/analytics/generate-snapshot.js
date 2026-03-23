// pages/api/analytics/generate-snapshot.js
//
// SHRM-ready snapshot data generator
// Returns the exact data shape needed by send-snapshot.js and the UI preview.
//
// For now this uses a strong demo dataset so Ted has credible data immediately.
// Later, the internals can be swapped to real DB queries without changing the page flow.

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

const VALID_REPORT_TYPES = [
  "executive",
  "funnel",
  "sources",
  "activity",
  "time-to-fill",
];

function buildDemoSnapshot(reportType = "executive") {
  const kpis = {
    totalViews: 12458,
    totalApplies: 842,
    conversionRatePct: 6.8,
    avgTimeToFillDays: 24,
    totalInterviews: 126,
    totalHires: 18,
    offerAcceptanceRatePct: 81,
  };

  const funnelData = [
    { stage: "Views", value: 12458 },
    { stage: "Clicks", value: 3120 },
    { stage: "Applies", value: 842 },
    { stage: "Interviews", value: 126 },
    { stage: "Offers", value: 22 },
    { stage: "Hires", value: 18 },
  ];

  const sourcesData = [
    { name: "ForgeTomorrow", value: 312 },
    { name: "Referrals", value: 188 },
    { name: "LinkedIn", value: 142 },
    { name: "Indeed", value: 96 },
    { name: "Company Careers", value: 58 },
    { name: "University Outreach", value: 28 },
    { name: "Staffing Partner", value: 12 },
    { name: "Other", value: 6 },
  ];

  const activityData = [
    { week: "W1", messages: 64, responses: 12 },
    { week: "W2", messages: 72, responses: 16 },
    { week: "W3", messages: 81, responses: 18 },
    { week: "W4", messages: 75, responses: 15 },
    { week: "W5", messages: 88, responses: 20 },
    { week: "W6", messages: 94, responses: 23 },
    { week: "W7", messages: 102, responses: 24 },
    { week: "W8", messages: 110, responses: 28 },
  ];

  const previewNotes = {
    executive:
      "Hiring activity is healthy, with strong top-of-funnel visibility and a stable interview-to-hire pattern. The clearest opportunity is improving apply conversion from job views, especially on high-traffic roles where visibility is already strong.",
    funnel:
      "Most candidate loss is occurring between click and application start, which suggests friction in the apply experience or weaker message match on the posting itself. Improving apply clarity and reducing drop-off here should produce the fastest lift.",
    sources:
      "ForgeTomorrow and referrals are producing the highest-value candidate flow, while external boards are generating reach with lower efficiency. The best near-term move is to invest more in owned and referral channels while tightening spend on lower-converting sources.",
    activity:
      "Recruiter activity is trending upward week over week, with interview scheduling rising alongside outreach. The pattern suggests stronger process consistency and better candidate engagement over the current period.",
    "time-to-fill":
      "Average time-to-fill is within a workable range, but leadership should focus on earlier decision velocity to compress the final stages. Interview throughput is strong enough that the next gains likely come from approval speed, not sourcing volume.",
  };

  return {
    accountName: "ForgeTomorrow Demo Account",
    recruiterName: "Recruiter Team",
    reportingWindow: "Last 30 days",
    kpis,
    funnelData,
    sourcesData,
    activityData,
    previewInsight: previewNotes[reportType] || previewNotes.executive,
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { reportType = "executive" } = req.body || {};

  if (!VALID_REPORT_TYPES.includes(reportType)) {
    return res.status(400).json({ error: "Invalid reportType" });
  }

  try {
    const snapshot = buildDemoSnapshot(reportType);
    return res.status(200).json({
      success: true,
      reportType,
      ...snapshot,
    });
  } catch (err) {
    console.error("generate-snapshot error:", err);
    return res.status(500).json({
      error: "Failed to generate snapshot",
      message: err?.message || "Unknown error",
    });
  }
}