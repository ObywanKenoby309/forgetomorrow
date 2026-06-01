import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prisma from "@/lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const id = String(req.query?.id || "").trim();

    if (!id) {
      return res.status(400).json({ error: "Analysis id required" });
    }

    const analysis = await prisma.recruiterExplainRun.findUnique({
      where: { id },
      select: {
        id: true,
        recruiterUserId: true,
      },
    });

    if (!analysis) {
      return res.status(404).json({ error: "Analysis not found" });
    }

    if (analysis.recruiterUserId !== session.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const updated = await prisma.recruiterExplainRun.update({
      where: { id },
      data: {
        vaultSaved: true,
        vaultTitle: "Resume vs Role Analysis",
      },
    });

    return res.status(200).json({
      ok: true,
      id: updated.id,
    });
  } catch (err) {
    console.error("[api/recruiter/explain/save]", err);
    return res.status(500).json({
      error: "Could not save analysis",
    });
  }
}