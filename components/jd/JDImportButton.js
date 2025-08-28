// components/jd/JDImportButton.jsx
import { useRef, useState } from 'react';
import { extractTextFromFile, normalizeJobText } from '@/lib/jd/ingest';

function withTimeout(promise, ms = 15000) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('Import timed out. Try a smaller file or paste the JD text.')), ms);
    promise.then(v => { clearTimeout(t); resolve(v); })
           .catch(e => { clearTimeout(t); reject(e); });
  });
}

export default function JDImportButton({ onText, className }) {
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(false);

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        style={{
          background: '#FF7043',
          color: 'white',
          border: '1px solid rgba(0,0,0,0.06)',
          borderRadius: 10,
          padding: '8px 12px',
          fontWeight: 800,
          cursor: 'pointer',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? 'Importing…' : 'Import JD'}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.md,.markdown"
        style={{ display: 'none' }}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setLoading(true);
          try {
            const raw = await withTimeout(extractTextFromFile(file), 15000);
            const text = normalizeJobText(raw);
            try { localStorage.setItem('ft_last_job_text', text); } catch {}
            onText?.(text); // e.g., setJobText(text)
          } catch (err) {
            alert(err?.message || 'Import failed. Please paste the JD text.');
            console.error('[JD Import] Error:', err);
          } finally {
            setLoading(false);
            e.target.value = ''; // allow re-choosing same file later
          }
        }}
      />
    </>
  );
}
