// pages/api/resume/upload.js
export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // File storage not needed — text extraction happens client-side
  // and is saved to DB drafts separately in resume-cover.js
  return res.status(200).json({
    uploaded: true,
    lastUpdated: new Date().toISOString().split('T')[0],
  });
}