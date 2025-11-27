// pages/api/recruiter/dashboard.js
// Aggregated Recruiter Dashboard data
// Later: replace mock data with real DB queries (Prisma / Supabase / etc.)

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // TODO: Replace this block with real queries.
    // Example future shape (Prisma):
    // const openJobs = await prisma.job.count({ where: { status: "OPEN", orgId } });
    // const applications7d = await prisma.application.count({ where: { createdAt: { gte: sevenDaysAgo }, orgId } });
    // etc.

    const payload = {
      stats: [
        { label: "Open Jobs", value: 3 },
        { label: "Active Candidates", value: 18 },
        { label: "Messages Waiting", value: 5 },
        { label: "Applications (7d)", value: 42 },
      ],
      topCandidates: [
        { name: "Jane D.", title: "Sr. CSM", matchPercent: 92 },
        { name: "Omar R.", title: "Onboarding Lead", matchPercent: 88 },
        { name: "Priya K.", title: "Solutions Architect", matchPercent: 86 },
      ],
      analytics: {
        timeToHireDays: 18,
        topSourceLabel: "Community Hubs",
        topSourcePercent: 38,
        conversionViewToApply: 4.7,
      },
    };

    return res.status(200).json(payload);
  } catch (err) {
    console.error("[/api/recruiter/dashboard] Error:", err);
    return res.status(500).json({ error: "Failed to load recruiter dashboard data" });
  }
}
