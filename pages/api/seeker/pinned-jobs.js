// pages/api/seeker/pinned-jobs.js
// Temporary placeholder so the app builds cleanly.
// TODO: Wire this to real pinned-jobs storage (Prisma) later.

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // For now, just return an empty list so the dashboard preview
      // and pinned-jobs page don't crash.
      return res.status(200).json({ jobs: [] });
    }

    if (req.method === 'POST') {
      // Called when user clicks "Pin Job"
      return res
        .status(501)
        .json({ error: 'Pinned jobs API not fully wired yet (POST placeholder).' });
    }

    if (req.method === 'DELETE') {
      // Called when user unpins a job
      return res
        .status(501)
        .json({ error: 'Pinned jobs API not fully wired yet (DELETE placeholder).' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[pinned-jobs] unexpected error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
