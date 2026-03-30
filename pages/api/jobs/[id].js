// pages/api/jobs/[id].js
import { prisma } from '@/lib/prisma';

function jsonSafe(value) {
  if (value === null || value === undefined) return value;

  const t = typeof value;

  if (t === 'bigint') return value.toString();
  if (t === 'string' || t === 'number' || t === 'boolean') return value;
  if (value instanceof Date) return value;

  if (Array.isArray(value)) return value.map(jsonSafe);

  if (t === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = jsonSafe(v);
    return out;
  }

  return value;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const id = Number(req.query.id);
    if (!id) return res.status(400).json({ error: 'Missing id' });

    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) return res.status(404).json({ error: 'Job not found' });

    return res.status(200).json(jsonSafe(job));
  } catch (e) {
    return res.status(500).json(
      jsonSafe({ error: e?.message || 'Server error' })
    );
  }
}