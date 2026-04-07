// pages/api/coaching/documents/[id].js
//
// DELETE — removes the CoachingDocument record AND the file
//           from Supabase Storage. Scoped to authed coach.

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import prisma from '@/lib/prisma';
import { supabase } from '@/lib/supabaseClient';

const BUCKET = 'coaching-documents';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });

  const coachId = session.user.id;
  const { id } = req.query;

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const doc = await prisma.coachingDocument.findFirst({
      where: { id, coachId },
    });
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    // Remove from Supabase Storage if a file was uploaded
    // Path convention: {coachId}/{docId}/{filename}
    if (doc.url) {
      // Extract the storage path from the public URL
      // Public URLs look like: {SUPABASE_URL}/storage/v1/object/public/{bucket}/{path}
      const marker = `/object/public/${BUCKET}/`;
      const markerIdx = doc.url.indexOf(marker);
      if (markerIdx !== -1) {
        const storagePath = doc.url.slice(markerIdx + marker.length);
        const { error: removeError } = await supabase.storage
          .from(BUCKET)
          .remove([storagePath]);
        if (removeError) {
          // Log but don't block — DB record cleanup is more important
          console.error('[coaching/documents DELETE] storage remove', removeError);
        }
      }
    }

    await prisma.coachingDocument.delete({ where: { id } });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[coaching/documents DELETE]', err);
    return res.status(500).json({ error: 'Failed to delete document' });
  }
}