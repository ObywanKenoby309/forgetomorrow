// pages/api/recruiter/candidates/why.js
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";
import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";

const prisma = new PrismaClient();
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const { candidateId, jobId } = req.body;

    if (!candidateId || !jobId) {
      return res.status(400).json({
        error: "Missing candidateId or jobId",
      });
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
    });

    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!candidate || !job) {
      return res.status(404).json({ error: "Candidate or job not found" });
    }

    // AI: Why this candidate?
    const prompt = `
You are an AI recruiter. Explain why this candidate may be a good fit for the job.

### Job Title:
${job.title}

### Job Description:
${job.description || "(No description)"}

### Candidate Name:
${candidate.name}

### Candidate Experience:
${candidate.experience || "(No experience text)"}

### Task:
Return JSON with:
- score: number (0–100)
- summary: 1–2 sentence explanation
- reasons: list with requirement + evidence
- filters_triggered: optional array of metadata
`;

    const completion = await client.chat.completions.create({
      model: "gpt-5-mini",
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    });

    const parsed = JSON.parse(completion.choices[0].message.content);

    return res.status(200).json(parsed);
  } catch (err) {
    console.error("WHY API ERROR:", err);
    return res.status(500).json({
      error: "AI explanation failed. Try again shortly.",
    });
  }
}
