export default function handler(req, res) {
  if (req.method === 'GET') {
    res.status(200).json({ posts: [{ id: 'p1', title: 'Test Post', content: 'Hello world!', time: '10:00 AM' }] });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}