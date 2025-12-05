// pages/api/feed.js
let posts = [
  {
    id: 'p1',
    authorId: 'system',
    author: 'ForgeTomorrow',
    content: 'Welcome to your new feed. Share wins, lessons, and questions here.',
    type: 'business',
    likes: 0,
    comments: [],
    createdAt: new Date().toISOString(),
  },
];

export default function handler(req, res) {
  if (req.method === 'GET') {
    // Return newest first
    return res.status(200).json({ posts: posts || [] });
  }

  if (req.method === 'POST') {
    try {
      const body = req.body || {};

      // We accept either `content` or `text` from the composer
      const content = body.content || body.text || '';
      const type = body.type === 'personal' ? 'personal' : 'business';

      if (!content || typeof content !== 'string') {
        return res
          .status(400)
          .json({ error: 'Post content is required as `content` or `text`.' });
      }

      const now = new Date();
      const id = 'p_' + now.getTime().toString(36);

      const post = {
        id,
        authorId: body.authorId || 'anon',
        author: body.author || 'Anonymous',
        content,
        type,
        likes: typeof body.likes === 'number' ? body.likes : 0,
        comments: Array.isArray(body.comments) ? body.comments : [],
        createdAt: now.toISOString(),
      };

      // Prepend newest
      posts = [post, ...posts];

      return res.status(201).json({ post });
    } catch (err) {
      console.error('[api/feed] POST error:', err);
      return res.status(500).json({ error: 'Failed to create post.' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
