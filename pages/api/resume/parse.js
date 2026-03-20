// pages/api/resume/parse.js
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { text } = req.body;
  if (!text || typeof text !== 'string') return res.status(400).json({ error: 'Missing text' });

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0,
      messages: [
        {
          role: 'system',
          content: `You are a resume parser. Extract structured data from resume text and return ONLY valid JSON, no markdown, no explanation.

Return this exact shape:
{
  "formData": {
    "fullName": "",
    "email": "",
    "phone": "",
    "location": "",
    "targetedRole": ""
  },
  "summary": "",
  "experiences": [
    {
      "title": "",
      "company": "",
      "location": "",
      "startDate": "",
      "endDate": "",
      "bullets": []
    }
  ],
  "educationList": [
    {
      "school": "",
      "degree": "",
      "field": "",
      "startDate": "",
      "endDate": ""
    }
  ],
  "skills": [],
  "certifications": [],
  "languages": [],
  "projects": []
}`,
        },
        {
          role: 'user',
          content: `Parse this resume:\n\n${text.slice(0, 6000)}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content || '';
    const parsed = JSON.parse(raw);
    return res.status(200).json(parsed);
  } catch (err) {
    console.error('[api/resume/parse] failed:', err);
    return res.status(500).json({ error: 'Parse failed' });
  }
}