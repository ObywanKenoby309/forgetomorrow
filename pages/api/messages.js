// pages/api/messages.js
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://postgres:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtY3pwZGR6Y3Bkb3RnZGNxamdsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjk1NDMxNywiZXhwIjoyMDc4NTMwMzE3fQ.9hpgweaVAV218-Lrif7E3ZLMJbKVgbbxA1bLsT0pNmE@db.umczpddzcpdotgdcqjgl.supabase.co:5432/postgres',
});

export default function handler(req, res) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token || token !== process.env.GROQ_API_KEY) return res.status(401).json({ error: 'Unauthorized' });
  const query = 'SELECT id, name FROM users WHERE api_key = $1';
  pool.query(query, [token], (err, result) => {
    if (err || !result.rows.length) return res.status(401).json({ error: 'Unauthorized' });
    const userId = result.rows[0].id;
    if (req.method === 'GET') {
      const query = 'SELECT id, sender_id, content, created_at FROM messages WHERE conversation_id = $1';
      pool.query(query, ['c3'], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.status(200).json({ messages: result.rows.map(r => ({ id: r.id, from: r.sender_id, text: r.content, time: r.created_at.toLocaleTimeString() })) });
      });
    } else if (req.method === 'POST') {
      const { conversationId, content } = req.body;
      const query = 'INSERT INTO messages (conversation_id, sender_id, content, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *';
      pool.query(query, [conversationId || 'c3', userId, content], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.status(201).json({ message: { id: result.rows[0].id, from: userId, text: content, time: result.rows[0].created_at.toLocaleTimeString() } });
      });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  });
}