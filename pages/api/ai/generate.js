// pages/api/ai/generate.js
import { Groq } from 'groq-sdk';
import { PROMPTS } from '@/lib/ai/prompts';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { tool, input, user } = req.body;
  if (!tool || !input) return res.status(400).json({ error: 'tool and input required' });

  const promptFn = PROMPTS[tool];
  if (!promptFn) return res.status(400).json({ error: 'Invalid tool' });

  try {
    const prompt = promptFn(input, user);
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 1024,
    });

    return res.json({ response: completion.choices[0].message.content });
  } catch (error) {
    console.error('AI ERROR:', error.message);
    return res.status(500).json({ error: 'AI failed', details: error.message });
  }
}