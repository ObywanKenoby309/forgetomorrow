// pages/api/messages.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token || token !== process.env.GROQ_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Verify user by GROQ_API_KEY (mapped to api_key in DB)
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('api_key', token)
    .single();

  if (userError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = user.id;

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('messages')
      .select('id, sender_id, content, created_at')
      .eq('conversation_id', 'c3')
      .order('created_at', { ascending: true });

    if (error) return res.status(500).json({ error: 'Database error' });

    const messages = data.map(m => ({
      id: m.id,
      from: m.sender_id,
      text: m.content,
      time: new Date(m.created_at).toLocaleTimeString()
    }));

    return res.status(200).json({ messages });

  } else if (req.method === 'POST') {
    const { conversationId, content } = req.body;
    const convId = conversationId || 'c3';

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: convId,
        sender_id: userId,
        content,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: 'Database error' });

    return res.status(201).json({
      message: {
        id: data.id,
        from: userId,
        text: content,
        time: new Date(data.created_at).toLocaleTimeString()
      }
    });

  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}