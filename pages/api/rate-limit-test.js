// pages/api/rate-limit-test.js

export default function handler(req, res) {
  // ❌ Hide this endpoint in production so bots can't poke at it
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({
      ok: false,
      error: 'Not found',
    });
  }

  // ✅ Dev / preview: simple health check
  return res.status(200).json({
    ok: true,
    message: 'ForgeTomorrow API is alive',
    time: new Date().toISOString(),
  });
}
