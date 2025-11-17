// pages/api/auth/signup-free.js
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, password, name } = req.body;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, role: 'free' } },
  });

  if (error) return res.status(400).json({ error: error.message });

  res.status(200).json({ success: true, user: data.user });
}