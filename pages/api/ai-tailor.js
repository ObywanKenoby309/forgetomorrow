// pages/api/ai-tailor.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { prompt } = req.body;

  // MOCK AI (replace with real later)
  // Simulating 2.5s thinking
  await new Promise(r => setTimeout(r, 2500));

  // HARDCODED RESPONSE FOR NOW
  res.status(200).send(`
OPENING: I drove 45% growth launching AI products at ForgeTomorrow.
BULLET1: Launched 0→1 AI platform — 45% conversion increase
BULLET2: Built analytics dashboard — reduced churn 23%
BULLET3: Closed 73% of pilots → $1.2M ARR
CLOSING: Let’s drive 20%+ growth at Acme Analytics.
  `.trim());
}