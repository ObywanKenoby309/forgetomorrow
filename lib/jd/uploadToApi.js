// /lib/jd/uploadToApi.js
// Upload a JD file to our API for extraction (multipart/form-data).
// Returns the extracted raw text string.

export async function uploadJD(file, timeoutMs = 20000) {
  if (!file) throw new Error('No file selected');

  const data = new FormData();
  // IMPORTANT: the field name must be exactly 'file'
  data.append('file', file, file.name || 'upload');

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch('/api/jd-extract', {
      method: 'POST',
      body: data,
      signal: controller.signal,
    });

    const contentType = String(res.headers.get('content-type') || '').toLowerCase();

    // Some handlers return text/plain instead of JSON
    if (contentType.includes('text/plain')) {
      const text = await res.text();
      if (!res.ok) throw new Error(text || `Upload failed (${res.status})`);
      if (!text || !String(text).trim()) throw new Error('No text returned from server.');
      return text;
    }

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json?.error || json?.message || `Upload failed (${res.status})`);
    }

    // Accept multiple common shapes to avoid brittle coupling
    const text =
      (json && typeof json.text === 'string' && json.text) ||
      (json && typeof json.rawText === 'string' && json.rawText) ||
      (json && typeof json.content === 'string' && json.content) ||
      (json && typeof json.extractedText === 'string' && json.extractedText) ||
      '';

    if (!text || !String(text).trim()) throw new Error('No text returned from server.');
    return text;
  } finally {
    clearTimeout(t);
  }
}
