// pages/api/feed/upload.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { getMediaUrl, uploadFile } from '@/lib/storage';

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
    const form = formidable({ maxFileSize: 50 * 1024 * 1024 }); // 50 MB max per file
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

    const fileArray = files.file
      ? Array.isArray(files.file)
        ? files.file
        : [files.file]
      : [];

    if (!fileArray.length) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const uploaded = await Promise.all(
      fileArray.map(async (file, index) => {
        const ext = path.extname(file.originalFilename || file.newFilename || '').toLowerCase();
        const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.webm'];

        if (!allowedExts.includes(ext)) {
          throw new Error(`File type ${ext} is not allowed`);
        }

        const type = ['.mp4', '.webm'].includes(ext) ? 'video' : 'image';
        const userId = session.user.id;
        const timestamp = Date.now();
        const storagePath = `feed-media/posts/${userId}/${timestamp}-${index}${ext}`;
        const fileBuffer = fs.readFileSync(file.filepath);

        await uploadFile({
          buffer: fileBuffer,
          path: storagePath,
          contentType: file.mimetype || 'application/octet-stream',
        });

        return {
          type,
          url: getMediaUrl(storagePath),
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
