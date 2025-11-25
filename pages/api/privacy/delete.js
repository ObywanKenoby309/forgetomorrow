// pages/api/privacy/delete.js

import { prisma } from '@/lib/prisma'

export default async function handler(req, res) {
  // Only allow DELETE for now
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // NOTE:
  // This is a minimal first version.
  // Right now it expects a userId in the body.
  // Later we can wire this to your real auth/session so it uses the logged-in user instead.
  const { userId } = req.body || {}

  if (!userId) {
    return res.status(400).json({
      error: 'Missing userId. Delete endpoint is not fully wired to auth yet.',
    })
  }

  try {
    const now = new Date()

    // Soft-delete: mark the user as deleted now
    await prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: now,
      },
    })

    return res.status(200).json({
      status: 'pending_deletion',
      deletedAt: now.toISOString(),
      message:
        'Account marked for deletion. Data will be purged automatically after 30 days.',
    })
  } catch (error) {
    console.error('[privacy/delete] error', error)
    return res.status(500).json({ error: 'Failed to mark account for deletion' })
  }
}
