// pages/api/recruiter/jd-optimize.js
// Dual-AI: Grok-style JD builder (currently powered by OpenAI for stability)

import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { draft, title, company } = req.body || {};

  if (!draft || typeof draft !== "string" || !draft.trim()) {
    return res.status(400).json({ error: "Missing or empty draft" });
  }

  try {
    const jobTitle = (title || "").trim() || "Role";
    const companyName = (company || "").trim() || "the company";

    const systemPrompt =
      "You are an expert technical recruiter and ATS specialist. " +
      "Your job is to rewrite job descriptions so they are:\n" +
      "- Clear, honest, and candidate-friendly\n" +
      "- Optimized for modern ATS keyword parsing\n" +
      "- Structured with headings and bullet points\n" +
      "- Free of fluff, discrimination, or unrealistic requirements.\n\n" +
      "Always preserve the *true* requirements and seniority. " +
      "Do not fabricate benefits, tools, or requirements that were not implied by the original text.";

    const userPrompt = `
Job Title: ${jobTitle}
Company: ${companyName}

Original Job Description:
"""
${draft}
"""

Rewrite this into a stronger job description that:

1. Keeps the same intent and core requirements.
2. Uses clear headings (Overview, Responsibilities, Requirements, Nice to Have, Compensation/Benefits if present).
3. Uses bullet points where helpful.
4. Uses inclusive, non-discriminatory language.
5. Is friendly to ATS parsing and keyword coverage.

Return ONLY the improved job description text. Do not add commentary or notes.
    `.trim();

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: 1200,
    });

    const content = completion?.choices?.[0]?.message?.content?.trim();

    if (!content) {
      console.error("[jd-optimize] No content in completion", completion);
      return res
        .status(500)
        .json({ error: "No optimized description was returned." });
    }

    return res.status(200).json({
      ok: true,
      optimized: content,
    });
  } catch (err) {
    console.error("[jd-optimize] error", err);
    return res.status(500).json({
      ok: false,
      error:
        "We couldn't optimize this job description right now. Please try again shortly.",
    });
  }
}
