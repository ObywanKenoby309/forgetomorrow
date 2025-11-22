// pages/api/rate-limit-test.js

export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    message: 'ForgeTomorrow API is alive',
    time: new Date().toISOString(),
  });
}
