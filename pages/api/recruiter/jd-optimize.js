// pages/api/recruiter/jd-optimize.js
import OpenAI from 'openai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { title, draft, company, location, worksite, employmentType, compensation } = req.body;

  if (!draft || !title) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `
Rewrite this job description to be ATS-optimized, inclusive, clear, and appealing.
Preserve factual meaning but improve structure, clarity, and action verbs.

Job Title: ${title}
Company: ${company || 'N/A'}
Location: ${location || 'N/A'}
Worksite: ${worksite || 'N/A'}
Employment Type: ${employmentType || 'N/A'}
Compensation: ${compensation || 'N/A'}

Draft Description:
${draft}

Return ONLY the improved job description text.
`;

    const completion = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    const optimized = completion.output[0].content[0].text;

    return res.status(200).json({
      optimizedDescription: optimized,
    });
  } catch (err) {
    console.error('JD Optimize Error:', err);
    return res.status(500).json({ error: 'Failed to optimize job description.' });
  }
}
