import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'

const CRON_SECRET = process.env.CRON_SECRET || ''

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers['x-cron-secret'] as string | undefined

  console.log('[purge-deleted-users] method:', req.method)
  console.log('[purge-deleted-users] auth header:', authHeader ? 'present' : 'missing')

  if (!CRON_SECRET || authHeader !== CRON_SECRET) {
    return res.status(401).json({
      error: 'Unauthorized',
      detail: 'x-cron-secret did not match CRON_SECRET',
      method: req.method,
    })
  }

  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000
  const cutoff = new Date(Date.now() - THIRTY_DAYS_MS)

  try {
    const result = await prisma.user.deleteMany({
      where: {
        deletedAt: {
          lte: cutoff,
        },
      },
    })

    return res.status(200).json({
      status: 'ok',
      purged: result.count,
      cutoff: cutoff.toISOString(),
      method: req.method,
    })
  } catch (error) {
    console.error('[purge-deleted-users] error', error)
    return res.status(500).json({ error: 'Failed to purge users' })
  }
}
