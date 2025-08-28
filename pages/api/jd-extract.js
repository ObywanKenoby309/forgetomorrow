// /pages/api/jd-extract.js
// Server-side JD text extraction for PDF/DOCX/TXT via multipart form upload.
// Uses formidable to parse the upload, pdf-parse for PDFs, and mammoth for DOCX.

import fs from 'fs';
import formidable from 'formidable';

export const config = {
  api: { bodyParser: false }, // we parse multipart ourselves
};

// ---------- helpers ----------
function pickFirstFile(files) {
  if (files?.file) return Array.isArray(files.file) ? files.file[0] : files.file;
  const vals = Object.values(files || {});
  if (!vals.length) return null;
  return Array.isArray(vals[0]) ? vals[0][0] : vals[0];
}

function extFromName(name = '') {
  const m = String(name).toLowerCase().match(/\.([a-z0-9]+)$/i);
  return m ? m[1] : '';
}
function isPDF(name = '', type = '') {
  const ext = extFromName(name); const t = String(type).toLowerCase();
  return ext === 'pdf' || t.includes('pdf');
}
function isDOCX(name = '', type = '') {
  const ext = extFromName(name); const t = String(type).toLowerCase();
  return ext === 'docx' || t.includes('officedocument') || t.includes('word');
}

// ---------- parsers ----------
async function parsePDFBuffer(buffer) {
  const mod = await import('pdf-parse');            // npm i pdf-parse
  const pdfParse = mod.default || mod;
  const data = await pdfParse(buffer);
  return String(data?.text || '').trim();
}
async function parseDOCXBuffer(buffer) {
  const mod = await import('mammoth');              // npm i mammoth
  const mammoth = mod.default || mod;
  const result = await mammoth.extractRawText({ buffer });
  return String(result?.value || '').trim();
}

// ---------- route ----------
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' }); return;
  }

  try {
    const form = formidable({ multiples: false, maxFileSize: 8 * 1024 * 1024 });
    const { files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, _fields, _files) => (err ? reject(err) : resolve({ files: _files })));
    });

    const f = pickFirstFile(files);
    if (!f) { res.status(400).json({ error: 'No file uploaded.' }); return; }

    const filepath = f.filepath ?? f.path;
    const mimetype = f.mimetype || f.type || '';
    const originalName = f.originalFilename || f.newFilename || f.name || 'upload';
    if (!filepath) { res.status(400).json({ error: 'Upload failed (no temporary file path).' }); return; }

    const buffer = await fs.promises.readFile(filepath);

    let text = '';
    if (isPDF(originalName, mimetype)) {
      text = await parsePDFBuffer(buffer);
    } else if (isDOCX(originalName, mimetype)) {
      text = await parseDOCXBuffer(buffer);
    } else {
      // TXT/MD/HTML or unknown -> best-effort UTF-8
      text = buffer.toString('utf8');
    }

    // light normalization
    text = text.replace(/\r/g, ' ')
               .replace(/\t/g, ' ')
               .replace(/[•·]/g, ' ')
               .replace(/\s+/g, ' ')
               .trim();

    res.status(200).json({ ok: true, text });
  } catch (e) {
    console.error('[api/jd-extract] error:', e);
    res.status(500).json({ error: e?.message || 'Could not extract text.' });
  }
}
