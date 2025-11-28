// pages/api/ai/generate.js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { tool, input, title } = req.body || {};

  try {
    if (tool === "optimizeJD") {
      if (!process.env.OPENAI_API_KEY) {
        // Clear error instead of a generic 500
        return res
          .status(401)
          .json({ error: "OPENAI_API_KEY is missing on the server." });
      }

      if (!input || !input.trim()) {
        return res.status(400).json({ error: "Missing job description input." });
      }

      const roleTitle = (title || "").trim() || "this role";

      const prompt = `
You are an expert recruiter and ATS optimization assistant.

Rewrite the following job description so that it is:
- clear, concise, and easy to scan
- structured into sections (About the Role, Responsibilities, Requirements, Nice to Have, Benefits if applicable)
- rich with relevant keywords, but not spammy
- suitable for both ATS parsing and human candidates

Job title: ${roleTitle}

Original description:
"""${input}"""

Return ONLY the improved job description text. Do not include commentary.
      `.trim();

      const resp = await client.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
      });

      const text = resp.choices?.[0]?.message?.content?.trim() || "";

      if (!text) {
        return res
          .status(500)
          .json({ error: "LLM returned an empty response for optimizeJD." });
      }

      // 🔴 IMPORTANT: JDOptimizer expects { response: "..." }
      return res.status(200).json({ response: text });
    }

    // TODO: keep or add any other tools you already support here.
    // For unknown tools:
    return res.status(400).json({ error: `Unknown tool: ${tool}` });
  } catch (err) {
    console.error("[api/ai/generate] error", err);
    return res.status(500).json({
      error: "AI generation failed in optimizeJD. Check server logs for details.",
    });
  }
}
