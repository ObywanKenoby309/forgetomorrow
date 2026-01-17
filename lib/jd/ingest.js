// /lib/jd/ingest.js
// JD ingestion: paste + TXT + (PDF/DOCX when libs installed)
// Robust imports for pdfjs-dist (v3/v4) and mammoth.

const TXT_TYPES = new Set(['text/plain', 'text/markdown', 'text/html']);

function readText(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = () => reject(new Error('Could not read text file.'));
    fr.onload = () => resolve(String(fr.result || ''));
    fr.readAsText(file);
  });
}
function readArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = () => reject(new Error('Could not read file.'));
    fr.onload = () => resolve(fr.result);
    fr.readAsArrayBuffer(file);
  });
}

// --- PDF (robust: try legacy → modern → root) ---
async function importPdfJs() {
  try {
    return await import('pdfjs-dist/legacy/build/pdf');
  } catch {}
  try {
    return await import('pdfjs-dist/build/pdf');
  } catch {}
  try {
    return await import('pdfjs-dist');
  } catch {}
  throw new Error('PDF support requires pdfjs-dist. Please install or paste text.');
}

// Workerless + timeout, robust across pdfjs versions
async function extractTextFromPDF(file, timeoutMs = 15000) {
  const pdfjsModule = await importPdfJs();
  const pdfjsLib = pdfjsModule?.getDocument ? pdfjsModule : (pdfjsModule?.default || pdfjsModule);

    // ✅ FIX: configure PDF.js worker (prevents "No GlobalWorkerOptions.workerSrc specified")
  try {
    if (pdfjsLib?.GlobalWorkerOptions) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).toString();
    }
  } catch (err) {
    // If worker path can't be set in this environment, we'll still try to proceed.
    console.warn('[jd/ingest] failed to set pdfjs workerSrc', err);
  }

  const buf = await readArrayBuffer(file);
  const data = buf instanceof ArrayBuffer ? new Uint8Array(buf) : new Uint8Array(buf?.buffer || []);

  const loadingTask = pdfjsLib.getDocument({
    data,
    // keep defaults as much as possible; overly-restrictive flags can break some PDFs
  });


  const withTimeout = (p) =>
    Promise.race([
      p,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('PDF extraction timed out. Try a text-based PDF or upload a .txt JD.')), timeoutMs)
      ),
    ]);

  const pdf = await withTimeout(loadingTask.promise);

  let text = '';
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    try {
      const page = await withTimeout(pdf.getPage(pageNum));
      const content = await withTimeout(page.getTextContent());
      const strings = content.items?.map((it) => it.str).filter(Boolean) || [];
      if (strings.length) text += strings.join(' ') + '\n';
    } catch {
      // skip pages that fail instead of killing the whole document
    }
  }

  return text.trim();
}

// --- DOCX (mammoth browser build safe) ---
async function importMammoth() {
  try {
    return await import('mammoth/mammoth.browser.js');
  } catch {}
  try {
    return await import('mammoth/mammoth.browser');
  } catch {}
  throw new Error('DOCX support requires mammoth. Please install or paste text.');
}
async function extractTextFromDOCX(file) {
  const mammoth = await importMammoth();
  const arrayBuffer = await readArrayBuffer(file);
  const result = await mammoth.extractRawText({ arrayBuffer });
  return String(result?.value || '').trim();
}

export async function extractTextFromFile(file) {
  if (!file) throw new Error('No file provided.');
  const type = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();

  if (type.includes('pdf') || name.endsWith('.pdf')) {
    return extractTextFromPDF(file);
  }
  if (
    type.includes('word') ||
    type.includes('officedocument') ||
    name.endsWith('.docx') ||
    name.endsWith('.doc')
  ) {
    return extractTextFromDOCX(file);
  }
  if (TXT_TYPES.has(type) || name.endsWith('.txt') || name.endsWith('.md')) {
    return readText(file);
  }

  // Fallback: attempt text read; otherwise ask to paste
  try {
    return await readText(file);
  } catch {
    throw new Error('Unsupported file type. Please paste the job description text.');
  }
}

export function normalizeJobText(raw) {
  if (!raw) return '';
  return String(raw)
    .replace(/\r/g, ' ')
    .replace(/\t/g, ' ')
    .replace(/[•·]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
