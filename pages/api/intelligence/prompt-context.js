// pages/api/intelligence/prompt-context.js
// ForgeTomorrow Unified Career Intelligence — Stage 4.5
// Read-only prompt context endpoint. GET only.
// Returns a compact, prompt-safe intelligence summary for the authenticated user.
// No AI calls. No writes. No localStorage.

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import buildPromptContext from '@/lib/intelligence/buildPromptContext';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Session resolution — wrapped so a NextAuth misconfiguration never 500s the endpoint
  let session = null;
  try {
    session = await getServerSession(req, res, authOptions);
  } catch (err) {
    console.error('[intelligence/prompt-context] getServerSession error:', err?.message || err);
    // Fall through — userId will be null, returns 401 below
  }

  const userId = session?.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const mode = req.query?.mode || undefined;
  const promptContext = await buildPromptContext({ userId, mode });

  if (!promptContext) {
    return res.status(404).json({ error: 'Prompt context not found' });
  }

  return res.status(200).json({ promptContext });
}