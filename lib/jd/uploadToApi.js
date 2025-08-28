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

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json?.error || `Upload failed (${res.status})`);
    }

    const text = (json && typeof json.text === 'string') ? json.text : '';
    if (!text) throw new Error('No text returned from server.');
    return text;
  } finally {
    clearTimeout(t);
  }
}
