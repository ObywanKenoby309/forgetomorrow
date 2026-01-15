// pages/api/recruiter/explain.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { resumeText, jobDescription } = req.body || {};
  if (!resumeText || !jobDescription) {
    return res.status(400).json({ error: "Missing resumeText or jobDescription" });
  }

  // TODO: Wire this to the SAME explainability logic used in recruiter candidate view.
  return res.status(200).json({
    summary: "WHY analysis is live (stub). Wire to recruiter explainability logic next.",
    strengths: [],
    gaps: [],
    interviewQuestions: { behavioral: [], occupational: [] },
  });
}
