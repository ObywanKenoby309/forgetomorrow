// pages/api/resume/upload.js
import { writeFile } from 'fs/promises';
import { join } from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Parse boundary
    const boundary = req.headers['content-type'].split('boundary=')[1];
    if (!boundary) throw new Error('No boundary');

    const parts = parseMultipart(buffer, boundary);
    const filePart = parts.find(p => p.name === 'resume');
    if (!filePart) throw new Error('No file');

    const filename = filePart.filename;
    if (!filename.match(/\.(pdf|docx)$/i)) {
      return res.status(400).json({ error: 'Only PDF or DOCX allowed' });
    }

    if (filePart.data.length > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'File too large (max 5MB)' });
    }

    const ext = filename.split('.').pop();
    const newFilename = `resume_${Date.now()}.${ext}`;
    const filepath = join(process.cwd(), 'public', 'uploads', newFilename);

    await mkdir(join(process.cwd(), 'public', 'uploads'), { recursive: true });
    await writeFile(filepath, filePart.data);

    res.status(200).json({
      uploaded: true,
      lastUpdated: new Date().toISOString().split('T')[0],
      score: Math.floor(Math.random() * 15) + 80,
      keywords: ['React', 'Next.js', 'Leadership', 'AI', 'Product']
    });
  } catch (err) {
    console.error('Upload error:', err.message);
    res.status(500).json({ error: 'Upload failed. Try again.' });
  }
}

// === MANUAL MULTIPART PARSER (NO DEPENDENCIES) ===
function parseMultipart(buffer, boundary) {
  const parts = [];
  const boundaryBytes = Buffer.from(`--${boundary}`);
  const endBoundary = Buffer.from(`--${boundary}--`);

  let start = buffer.indexOf(boundaryBytes) + boundaryBytes.length + 2; // +2 for \r\n
  const end = buffer.indexOf(endBoundary);

  while (start > boundaryBytes.length && start < end) {
    const headerEnd = buffer.indexOf('\r\n\r\n', start);
    const headers = buffer.subarray(start, headerEnd).toString();
    const contentStart = headerEnd + 4;
    const nextBoundary = buffer.indexOf(boundaryBytes, contentStart);
    const contentEnd = nextBoundary > -1 ? nextBoundary - 2 : end;

    const data = buffer.subarray(contentStart, contentEnd);
    const nameMatch = headers.match(/name="([^"]+)"/);
    const filenameMatch = headers.match(/filename="([^"]+)"/);

    if (nameMatch) {
      parts.push({
        name: nameMatch[1],
        filename: filenameMatch ? filenameMatch[1] : null,
        data
      });
    }

    start = nextBoundary + boundaryBytes.length + 2;
  }

  return parts;
}

async function mkdir(path, options) {
  const { mkdir: fsMkdir } = await import('fs/promises');
  return fsMkdir(path, options);
}