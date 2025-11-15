// lib/bulk/ai-tailor.js
export async function tailorResumeAndCover(jd, resumeData) {
  const prompt = `...`; // Full prompt — honest, metric-only
  const res = await fetch('/api/ai-tailor', { method: 'POST', body: JSON.stringify({ prompt }) });
  const text = await res.text();
  // Parse into resume + cover
  return { tailoredResume, tailoredCover, score: 92 };
}