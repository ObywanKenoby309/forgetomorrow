// pages/api/resume-align.js
import { Configuration, OpenAIApi } from 'openai';

const openai = new OpenAIApi(
  new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  })
);

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { jobDescription, resumeText } = req.body;

    if (!jobDescription || !resumeText) {
      return res.status(400).json({ error: 'Missing jobDescription or resumeText' });
    }

    // Simple GPT prompt to calculate alignment %
    const prompt = `
      Compare the following resume to the job description. 
      Respond ONLY with a numeric alignment percentage (0-100).

      Job Description:
      ${jobDescription}

      Resume:
      ${resumeText}

      Alignment percentage:
    `;

    const response = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt,
      max_tokens: 10,
    });

    const alignment = parseFloat(response.data.choices[0].text.trim());
    const clampedAlignment = Math.min(Math.max(alignment, 0), 100); // ensure 0-100

    res.status(200).json({ alignment: clampedAlignment });
  } catch (error) {
    console.error('Resume align API error:', error);
    res.status(500).json({ error: 'Failed to calculate alignment' });
  }
}
