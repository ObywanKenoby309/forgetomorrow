// lib/templates/applyCoverTemplate.js
import { getCoverTemplateById } from './coverTemplates';

/**
 * Small helper to replace bracketed placeholders like:
 *   [Role], [Company], [Team/Name]
 * Missing values are simply removed (and extra spaces trimmed).
 */
function fill(text = '', { role = '', company = '', teamName = '' } = {}) {
  if (!text) return '';
  let out = String(text);

  const map = {
    '\\[Role\\]': role || '',
    '\\[Company\\]': company || '',
    '\\[Team/Name\\]': teamName || company || '',
  };

  for (const pattern in map) {
    out = out.replace(new RegExp(pattern, 'g'), map[pattern]);
  }

  // Collapse any double spaces or leftover punctuation spacing
  return out.replace(/\s{2,}/g, ' ').replace(/\s+([,;:.!?])/g, '$1').trim();
}

/**
 * Build an initial cover letter state from a template + optional profile hints.
 * The function picks "openingRole" vs "openingFallback" and
 * "valuePropRole" vs "valuePropFallback" based on whether role/company exist.
 */
export function applyCoverTemplate(templateId, profile = {}) {
  const tpl = getCoverTemplateById(String(templateId));

  // Fallback template if ID not found (kept very neutral)
  const base = tpl ?? {
    id: 'concise',
    name: 'Concise',
    tone: 'short, to-the-point',
    defaults: {
      greeting: 'Hi there,',
      openingRole: 'As a [Role], I bring clear playbooks and dependable execution—helping teams hit goals faster.',
      openingFallback: 'I bring clear playbooks and dependable execution—helping teams hit goals faster.',
      body: [
        'Standardized workflows that improved throughput and reduced rework.',
        'Partnered cross-functionally to close feedback loops and accelerate delivery.',
        'Turned ambiguous goals into concrete milestones and measurable outcomes.',
      ],
      valuePropRole:
        'I can help [Company] move quickly with crisp priorities, simple process, and consistent follow-through.',
      valuePropFallback:
        'I can help your team move quickly with crisp priorities, simple process, and consistent follow-through.',
      closing: 'Thanks for your time—happy to share relevant wins if helpful.',
      signoff: 'Best,',
    },
  };

  // Profile hints for placeholder substitution / fallback choice
  const name = (profile.name || '').trim();
  const role = (profile.role || profile.targetRole || '').trim();
  const company = (profile.company || '').trim();
  const teamName = (profile.teamName || '').trim();

  // Decide which opening/valueProp to use
  const openingSrc =
    (role && base.defaults.openingRole) ||
    base.defaults.openingFallback ||
    '';
  const valuePropSrc =
    (company && base.defaults.valuePropRole) ||
    base.defaults.valuePropFallback ||
    '';

  // Fill placeholders; greeting may contain [Team/Name]
  const greeting = fill(base.defaults.greeting || '', { role, company, teamName });
  const opening = fill(openingSrc, { role, company, teamName });
  const valueProp = fill(valuePropSrc, { role, company, teamName });

  // Ensure body is an array of strings
  const body = Array.isArray(base.defaults.body)
    ? base.defaults.body.map((line) => fill(line, { role, company, teamName }))
    : [];

  return {
    meta: {
      templateId: base.id,
      templateName: base.name,
      tone: base.tone,
      createdAt: new Date().toISOString(),
    },
    fields: {
      recipient: '',
      company: company,          // keep what we know
      role: role,                // keep what we know
      greeting,
      opening,
      body,
      valueProp,
      closing: base.defaults.closing || '',
      signoff: base.defaults.signoff || '',
      signatureName: name,
      signatureContact: '',
    },
  };
}
