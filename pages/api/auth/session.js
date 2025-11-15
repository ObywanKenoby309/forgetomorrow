import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://postgres:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtY3pwZGR6Y3Bkb3RnZGNxamdsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjk1NDMxNywiZXhwIjoyMDc4NTMwMzE3fQ.9hpgweaVAV218-Lrif7E3ZLMJbKVgbbxA1bLsT0pNmE@db.umczpddzcpdotgdcqjgl.supabase.co:5432/postgres',
});

export default function handler(req, res) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  const query = 'SELECT id, name FROM users WHERE api_key = $1';
  pool.query(query, [token], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!result.rows.length) return res.status(401).json({ error: 'Unauthorized' });
    res.status(200).json({ user: result.rows[0] });
  });
}