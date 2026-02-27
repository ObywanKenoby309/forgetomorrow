// pages/api/feed/upload.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { supabase } from '@/lib/supabaseClient';

export const config = {
  api: {
    bodyParser: false, // We parse the raw stream manually via formidable
  },
};

import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = formidable({ maxFileSize: 50 * 1024 * 1024 }); // 50mb max per file
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const { files } = await parseForm(req);

    // formidable gives us either an array or single file
    const fileArray = files.file
      ? Array.isArray(files.file)
        ? files.file
        : [files.file]
      : [];

    if (!fileArray.length) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const uploaded = await Promise.all(
      fileArray.map(async (file) => {
        const ext = path.extname(file.originalFilename || file.newFilename || '').toLowerCase();
        const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.webm'];

        if (!allowedExts.includes(ext)) {
          throw new Error(`File type ${ext} is not allowed`);
        }

        const type = ['.mp4', '.webm'].includes(ext) ? 'video' : 'image';
        const userId = session.user.id;
        const timestamp = Date.now();
        const storagePath = `posts/${userId}/${timestamp}${ext}`;

        const fileBuffer = fs.readFileSync(file.filepath);

        const { error: uploadError } = await supabase.storage
          .from('feed-media')
          .upload(storagePath, fileBuffer, {
            contentType: file.mimetype,
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('feed-media')
          .getPublicUrl(storagePath);

        return {
          type,
          url: urlData.publicUrl,
          name: file.originalFilename || file.newFilename || storagePath,
        };
      })
    );

    return res.status(200).json({ attachments: uploaded });
  } catch (err) {
    console.error('[FEED UPLOAD ERROR]', err);
    return res.status(500).json({ error: err.message || 'Upload failed' });
  }
}