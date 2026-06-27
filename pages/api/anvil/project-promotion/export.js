// pages/api/anvil/project-promotion/export.js
// Exports a saved Project & Promotion Intelligence result as a formatted HTML document.
// Auth: user must own the record.
// GET /api/anvil/project-promotion/export?id=xxx

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function section(title, content) {
  if (!content) return '';
  return `
    <div class="section">
      <div class="section-title">${esc(title)}</div>
      <div class="section-body">${content}</div>
    </div>`;
}

function list(items = []) {
  if (!Array.isArray(items) || !items.length) return '<p class="muted">None provided.</p>';
  return '<ul>' + items.map(i => `<li>${esc(String(i || ''))}</li>`).join('') + '</ul>';
}

function buildHtml({ title, result, formInput, createdAt }) {
  const r = result || {};
  const date = createdAt
    ? new Date(createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const role    = String(formInput?.currentRole    || '').trim();
  const company = String(formInput?.currentCompany || '').trim();
  const meta    = [role, company].filter(Boolean).join(' · ');

  // Render any string or array field from the result generically
  function renderField(val) {
    if (!val) return '';
    if (Array.isArray(val)) return list(val);
    if (typeof val === 'object') {
      return '<ul>' + Object.entries(val).map(([k, v]) =>
        `<li><strong>${esc(k)}:</strong> ${esc(String(v || ''))}</li>`
      ).join('') + '</ul>';
    }
    return `<p>${esc(String(val))}</p>`;
  }

  // Known high-value fields to surface prominently
  const highlights = [
    r.positioningInsight || r.positioning_insight || r.insight,
    r.promotionCase      || r.promotion_case,
    r.executiveSummary   || r.executive_summary || r.summary,
  ].filter(Boolean);

  const sections = Object.entries(r)
    .filter(([k]) => !['positioningInsight','positioning_insight','insight','promotionCase','promotion_case','executiveSummary','executive_summary','summary'].includes(k))
    .map(([k, v]) => {
      const label = k.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()
        .replace(/^./, c => c.toUpperCase());
      const rendered = renderField(v);
      return rendered ? section(label, rendered) : '';
    }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${esc(title)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #1E293B; line-height: 1.6; padding: 48px 56px; max-width: 860px; margin: 0 auto; }
  .header { border-bottom: 3px solid #FF7043; padding-bottom: 18px; margin-bottom: 28px; }
  .brand { font-size: 11px; font-weight: 800; color: #FF7043; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 8px; }
  .doc-title { font-size: 22px; font-weight: 900; color: #1E293B; margin-bottom: 4px; }
  .doc-meta { font-size: 11px; color: #64748B; }
  .section { margin-bottom: 22px; page-break-inside: avoid; }
  .section-title { font-size: 11px; font-weight: 900; color: #FF7043; text-transform: uppercase; letter-spacing: 0.10em; margin-bottom: 8px; border-bottom: 1px solid rgba(255,112,67,0.2); padding-bottom: 4px; }
  .section-body { color: #334155; }
  ul { padding-left: 18px; }
  li { margin-bottom: 5px; }
  .highlight-box { background: #FFF7F5; border-left: 4px solid #FF7043; padding: 12px 16px; border-radius: 4px; font-size: 13px; font-weight: 700; color: #1E293B; margin-bottom: 10px; }
  .muted { color: #94A3B8; font-style: italic; }
  .footer { margin-top: 40px; padding-top: 14px; border-top: 1px solid #E2E8F0; font-size: 10px; color: #94A3B8; display: flex; justify-content: space-between; }
  p { margin-bottom: 6px; }
  @media print { body { padding: 32px 40px; } }
</style>
</head>
<body>

<div class="header">
  <div class="brand">ForgeTomorrow · The Anvil · Project & Promotion Intelligence</div>
  <div class="doc-title">${esc(title)}</div>
  <div class="doc-meta">${meta ? `${esc(meta)} &nbsp;·&nbsp; ` : ''}Generated: ${date}</div>
</div>

${highlights.length ? section('Key Insight', highlights.map(h => `<div class="highlight-box">${esc(String(h))}</div>`).join('')) : ''}

${sections}

<div class="footer">
  <span>ForgeTomorrow · The Anvil · Confidential</span>
  <span>forgetomorrow.com</span>
</div>

</body>
</html>`;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end();
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'id required' });

  try {
    const record = await prisma.projectPromotionResult.findFirst({
      where: { id: String(id), userId: session.user.id },
      select: { id: true, title: true, formInput: true, result: true, createdAt: true },
    });

    if (!record) return res.status(404).json({ error: 'Record not found' });

    const result    = typeof record.result    === 'string' ? JSON.parse(record.result)    : record.result    || {};
    const formInput = typeof record.formInput === 'string' ? JSON.parse(record.formInput) : record.formInput || {};
    const title     = record.title || 'Project & Promotion Brief';

    const html = buildHtml({ title, result, formInput, createdAt: record.createdAt });

    const safeTitle = title.replace(/[^a-z0-9_\-\s]/gi, '').replace(/\s+/g, '_');
    const fileName  = encodeURIComponent(`${safeTitle}.html`);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"; filename*=UTF-8''${fileName}`);
    res.setHeader('Cache-Control', 'private, no-cache');
    return res.status(200).send(html);

  } catch (err) {
    console.error('[api/anvil/project-promotion/export]', err);
    return res.status(500).json({ error: 'Could not export result' });
  }
}