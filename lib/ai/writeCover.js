// lib/ai/writeCover.js
const STOP = new Set([
  'with','from','that','this','your','have','will','team','work','role','and','the','for','into','over','plus','such',
  'you','our','are','is','as','on','of','to','in','a','an','be','by','or','we','they','their','them','us'
]);

function topKeywords(text, limit = 12) {
  const words = (text.toLowerCase().match(/\b[a-z][a-z\-]{3,}\b/g) || [])
    .filter(w => !STOP.has(w));
  const freq = new Map();
  for (const w of words) freq.set(w, (freq.get(w) || 0) + 1);
  return [...freq.entries()].sort((a,b)=>b[1]-a[1]).slice(0, limit).map(([w])=>w);
}

function guessTitle(text) {
  const m = text.match(/\b(we\s+are\s+looking\s+for|seeking|hire|hiring)\s+(an?\s+)?([A-Z][A-Za-z0-9\/\-\s]{2,60})/i);
  return m ? m[3].trim().replace(/\s+at\s+.*/i,'') : '';
}
function guessCompany(text) {
  const at = text.match(/\bat\s+([A-Z][A-Za-z0-9&\.\-\s]{2,60})/);
  const comp = at ? at[1].trim() : '';
  const line = text.split('\n').find(l => /company\s*:\s*/i.test(l));
  const comp2 = line ? line.split(':')[1].trim() : '';
  return comp || comp2;
}

export async function writeCover({ jobText = '', resume = {}, style = 'concise', maxBullets = 4 }) {
  const kw = topKeywords(jobText, 16);
  const title = guessTitle(jobText);
  const company = guessCompany(jobText);

  const greeting = 'Dear Hiring Manager,';
  const opening = [
    `I’m applying for the ${title || resume?.headline || 'role'}${company ? ` at ${company}` : ''}.`,
    `My background in ${(resume?.skills || []).slice(0,3).join(', ') || kw.slice(0,3).join(', ')} aligns well with your needs.`
  ].join(' ');

  const bullets = [];
  const seed = (resume?.highlights || resume?.achievements || []).slice(0, maxBullets);
  for (const s of seed) bullets.push(s);
  for (const k of kw.slice(0, maxBullets)) {
    if (bullets.length >= maxBullets) break;
    bullets.push(`Delivered measurable results using ${k}; eager to apply this at ${company || 'your organization'}.`);
  }

  const valueProp = `I bring a bias for action and clear communication—focused on outcomes, customer impact, and quality.`;
  const closing   = `I’d welcome the chance to discuss how I can help the team hit goals in the first 90 days.`;
  const signoff   = 'Sincerely,';

  return {
    fields: {
      recipient: '',
      company: company || '',
      role: title || '',
      greeting,
      opening,
      body: bullets,
      valueProp,
      closing,
      signoff,
      signatureName: resume?.fullName || '',
      signatureContact: resume?.contact || '',
    },
    keywords: kw
  };
}
