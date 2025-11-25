// pages/api/maintenance/cron-debug.ts
import type { NextApiRequest, NextApiResponse } from "next";

const CRON_SECRET = process.env.CRON_SECRET || "";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers["x-cron-secret"] as string | undefined;

  return res.status(200).json({
    ok: true,
    method: req.method,
    hasSecret: Boolean(authHeader),
    secretMatches: Boolean(CRON_SECRET && authHeader === CRON_SECRET),
  });
}
