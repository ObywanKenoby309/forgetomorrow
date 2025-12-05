// pages/api/feed.js

let POSTS = [
  {
    id: 'seed-1',
    authorId: 'system',
    author: 'ForgeTomorrow',
    text: 'Welcome to your shared ForgeTomorrow feed. Posts from any role appear here.',
    type: 'business', // 'business' | 'personal'
    audience: 'both',
    createdAt: Date.now() - 5 * 60 * 1000, // 5m ago
    likes: 0,
    comments: [],
  },
];

export default function handler(req, res) {
  if (req.method === 'GET') {
    // newest first
    const posts = [...POSTS].sort((a, b) => b.createdAt - a.createdAt);
    return res.status(200).json({ posts });
  }

  if (req.method === 'POST') {
    try {
      const body = req.body || {};
      const text = (body.text || '').trim();

      if (!text) {
        return res.status(400).json({ error: 'Post text is required.' });
      }

      const now = Date.now();

      const newPost = {
        id: `p_${now}_${Math.random().toString(36).slice(2, 8)}`,
        text,
        type: body.type === 'personal' ? 'personal' : 'business',
        audience: body.audience || 'both',
        authorId: body.authorId || 'anon',
        author: body.authorName || 'ForgeTomorrow',
        createdAt: now,
        likes: 0,
        comments: [],
      };

      POSTS.unshift(newPost);

      return res.status(201).json({ post: newPost });
    } catch (err) {
      console.error('[api/feed] POST error', err);
      return res.status(500).json({ error: 'Failed to create post.' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Method not allowed' });
}
