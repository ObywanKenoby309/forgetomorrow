// pages/api/recruiter/ats-builder.js
import OpenAI from "openai";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";

/**
 * Body shape:
 * {
 *   title: string,
 *   company: string,
 *   seniority: string,
 *   location: string,
 *   employmentType: string,
 *   notes: string,          // freeform wishes, “must have X, nice to have Y”
 *   tone: "formal" | "friendly" | "concise"
 * }
 *
 * Response:
 * {
 *   jobDescription: string, // full JD, markdown-ish
 *   keySkills: string[],    // ATS skills list
 *   screeningQuestions: string[], // suggested screens
 *   atsHints: string        // short paragraph of ATS notes
 * }
 */

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Optional: require auth so randoms can’t spam this
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.email) {
      return res.status(401).json({ error: "Not authenticated" });
    }
  } catch (err) {
    console.error("[ats-builder] session error", err);
    // still bail to be safe
    return res.status(401).json({ error: "Not authenticated" });
  }

  const {
    title = "",
    company = "",
    seniority = "",
    location = "",
    employmentType = "",
    notes = "",
    tone = "formal",
  } = req.body || {};

  if (!title) {
    return res.status(400).json({ error: "Missing required field: title" });
  }

  try {
    const prompt = `
You are an expert recruiter and ATS specialist. You help hiring teams write clear, inclusive, ATS-friendly job descriptions.

Write an ATS-optimized job description and supporting details for this role:

- Title: ${title}
- Company: ${company || "Confidential"}
- Seniority: ${seniority || "Not specified"}
- Location: ${location || "Remote / flexible"}
- Employment type: ${employmentType || "Full-time"}
- Recruiter notes / must-haves / nice-to-haves:
${notes || "(none provided)"}

Tone: ${tone === "friendly" ? "friendly but professional" : tone === "concise" ? "concise and to the point" : "formal and professional"}.

OUTPUT STRICTLY AS JSON with this shape:
{
  "jobDescription": "string - multi-paragraph JD with sections (About the role, Responsibilities, Requirements, Nice to have, Benefits)",
  "keySkills": ["skill1", "skill2", "..."],
  "screeningQuestions": ["question1", "question2", "..."],
  "atsHints": "short paragraph explaining why this is ATS-friendly and how to tweak it if needed"
}
    `.trim();

    const completion = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
      response_format: { type: "json_object" },
    });

    const raw = completion.output[0]?.content[0]?.text || "{}";
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      console.error("[ats-builder] JSON parse error", err, raw);
      return res.status(500).json({ error: "AI response parse error" });
    }

    const payload = {
      jobDescription: parsed.jobDescription || "",
      keySkills: Array.isArray(parsed.keySkills) ? parsed.keySkills : [],
      screeningQuestions: Array.isArray(parsed.screeningQuestions)
        ? parsed.screeningQuestions
        : [],
      atsHints: parsed.atsHints || "",
    };

    return res.status(200).json(payload);
  } catch (err) {
    console.error("[ats-builder] error", err);
    return res.status(500).json({ error: "Failed to generate job description" });
  }
}
