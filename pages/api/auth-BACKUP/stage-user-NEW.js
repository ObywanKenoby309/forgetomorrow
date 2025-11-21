// pages/api/auth/stAGE-user-NEW.js   ← YES, CAPITAL N-E-W
export default function handler(req, res) {
  console.log('NEW STAGE ROUTE HIT — YOU MUST SEE THIS IN TERMINAL RIGHT NOW');

  if (req.method === 'POST') {
    return res.status(200).json({ success: true, message: 'NEW ROUTE WORKS!' });
  } else {
    return res.status(200).json({ message: 'Hello from new route' });
  }
}