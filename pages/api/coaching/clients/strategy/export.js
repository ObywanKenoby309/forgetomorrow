// pages/api/coaching/clients/strategy/export.js
// Exports a saved coaching target strategy as a formatted PDF.
// Auth: coach must own the CoachingClient record.
// GET /api/coaching/clients/strategy/export?clientId=xxx

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
  if (!items.length) return '<p class="muted">None provided.</p>';
  return '<ul>' + items.map(i => `<li>${esc(i)}</li>`).join('') + '</ul>';
}

function targetList(items = []) {
  if (!items.length) return '<p class="muted">None provided.</p>';
  return items.map(t => {
    const name   = esc(t.name   || t.title || '');
    const reason = esc(t.reason || t.why   || '');
    return `<div class="target-item"><strong>${name}</strong>${reason ? `<br><span class="muted">${reason}</span>` : ''}</div>`;
  }).join('');
}

function buildHtml({ clientName, title, strategy, targetCompanies, generatedAt }) {
  const s = strategy || {};
  const date = generatedAt
    ? new Date(generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

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
  .highlight-box { background: #FFF7F5; border-left: 4px solid #FF7043; padding: 12px 16px; border-radius: 4px; font-size: 13px; font-weight: 700; color: #1E293B; margin-bottom: 6px; }
  .warning-box { background: #FFF3E0; border-left: 4px solid #F4511E; padding: 12px 16px; border-radius: 4px; font-size: 13px; color: #7A2A0E; margin-bottom: 6px; }
  .target-item { padding: 8px 0; border-bottom: 1px solid #F1F5F9; }
  .target-item:last-child { border-bottom: none; }
  .muted { color: #94A3B8; font-style: italic; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .footer { margin-top: 40px; padding-top: 14px; border-top: 1px solid #E2E8F0; font-size: 10px; color: #94A3B8; display: flex; justify-content: space-between; }
  p { margin-bottom: 6px; }
  @media print { body { padding: 32px 40px; } }
</style>
</head>
<body>

<div class="header">
  <div class="brand">ForgeTomorrow Coaching Intelligence</div>
  <div class="doc-title">${esc(title)}</div>
  <div class="doc-meta">Client: ${esc(clientName)} &nbsp;·&nbsp; Generated: ${date}${targetCompanies ? `&nbsp;·&nbsp; Targets: ${esc(targetCompanies)}` : ''}</div>
</div>

${s.positioningInsight ? section('Positioning Insight', `<div class="highlight-box">${esc(s.positioningInsight)}</div>`) : ''}

${s.marketPositionWarning ? section('Market Position Warning', `<div class="warning-box">${esc(s.marketPositionWarning)}</div>`) : ''}

${s.hiddenSignalGap ? section('Hidden Signal Gap', `<div class="warning-box">${esc(s.hiddenSignalGap)}</div>`) : ''}

${s.themes?.length ? section('Themes', list(s.themes)) : ''}

${s.roleLanes?.length ? section('Role Lanes', list(s.roleLanes)) : ''}

${s.transferabilitySignals?.length ? section('Transferability Signals', list(s.transferabilitySignals)) : ''}

${s.narrativeGaps?.length ? section('Narrative Gaps', list(s.narrativeGaps)) : ''}

<div class="two-col">
  ${s.safeHarborTargets?.length ? section('Safe Harbor Targets', targetList(s.safeHarborTargets)) : ''}
  ${s.stretchTargets?.length ? section('Stretch Targets', targetList(s.stretchTargets)) : ''}
</div>

${s.executionPlan?.length ? section('Execution Plan', '<ol style="padding-left:18px">' + s.executionPlan.map(step => `<li style="margin-bottom:8px">${esc(step)}</li>`).join('') + '</ol>') : ''}

${s.nextStep ? section('Priority Next Step', `<div class="highlight-box">${esc(s.nextStep)}</div>`) : ''}

${s.sessionFocus ? section('Next Session Focus', `<p>${esc(s.sessionFocus)}</p>`) : ''}

${s.reasoning?.length ? section('Strategy Reasoning', list(s.reasoning)) : ''}

<div class="footer">
  <span>ForgeTomorrow Coaching Intelligence · Confidential</span>
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

  const { clientId } = req.query;
  if (!clientId) return res.status(400).json({ error: 'clientId required' });

  try {
    const client = await prisma.coachingClient.findFirst({
      where: { id: String(clientId), coachId: session.user.id },
      select: {
        id: true,
        name: true,
        strategyJson: true,
        targetCompanies: true,
        updatedAt: true,
      },
    });

    if (!client) return res.status(404).json({ error: 'Client not found' });
    if (!client.strategyJson) return res.status(404).json({ error: 'No strategy found for this client' });

    const strategy = typeof client.strategyJson === 'string'
      ? JSON.parse(client.strategyJson)
      : client.strategyJson;

    const clientName = client.name || 'Client';
    const title = `${clientName} — Target Strategy`;
    const generatedAt = strategy.generatedAt || client.updatedAt;

    const html = buildHtml({
      clientName,
      title,
      strategy,
      targetCompanies: client.targetCompanies || '',
      generatedAt,
    });

    const safeTitle = title.replace(/[^a-z0-9_\-\s]/gi, '').replace(/\s+/g, '_');
    const fileName = encodeURIComponent(`${safeTitle}.html`);

    // Return as HTML — browser renders/prints it. Coach downloads and opens it.
    // For a true PDF, wire up a headless renderer (Puppeteer/wkhtmltopdf) here.
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"; filename*=UTF-8''${fileName}`);
    res.setHeader('Cache-Control', 'private, no-cache');
    return res.status(200).send(html);

  } catch (err) {
    console.error('[api/coaching/clients/strategy/export]', err);
    return res.status(500).json({ error: 'Could not export strategy' });
  }
}