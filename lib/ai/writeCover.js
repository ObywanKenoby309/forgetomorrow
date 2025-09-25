// lib/ai/writeCover.js
import { extractRole } from './shared/role';

function normalize(text = '') {
  return String(text)
    .replace(/[“”]/g, '"')
    .replace(/[’‘`]/g, "'")
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function sanitizeOpening(opening = '', role = '') {
  let s = normalize(opening);

  // Remove “I'm applying for …” boilerplate
  s = s.replace(/\b(i['’`]?m|i am)\s+applying\s+for\b.*?(\.|$)/gi, '').trim();

  // Remove “my background in …”
  s = s.replace(/\bmy\s+background\s+in\s+[^.]+(\.|$)/gi, '').trim();

  // If it starts with the role but has trailing clause, trim
  if (role) {
    const rx = new RegExp(`^(${role.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')})\\b.*$`, 'i');
    if (rx.test(s)) s = s.replace(rx, (_, r) => r);
  }

  // Limit to 1–2 sentences and ~45 words
  const sentences = s.split(/(?<=[.!?])\s+/).filter(Boolean);
  s = sentences.slice(0, 2).join(' ');
  const words = s.split(/\s+/);
  if (words.length > 45) s = words.slice(0, 45).join(' ') + '…';

  if (!s) {
    s = role
      ? `As a ${role}, I bring clear playbooks and dependable execution—helping teams hit goals faster.`
      : `I bring clear playbooks and dependable execution—helping teams hit goals faster.`;
  }

  if (role && !/^as\s+a?n?\s+/i.test(s)) {
    s = `As a ${role}, ${s.charAt(0).toLowerCase()}${s.slice(1)}`;
  }

  // Light title-casing of a few terms
  s = s
    .replace(/\bwindows\b/g, 'Windows')
    .replace(/\bactive directory\b/gi, 'Active Directory')
    .replace(/\bga4\b/gi, 'GA4')
    .replace(/\bslas?\b/gi, 'SLAs')
    .replace(/\bmttr\b/gi, 'MTTR')
    .replace(/\bfcr\b/gi, 'FCR');

  return s.trim();
}

export async function writeCover({ jobText = '', resume = {}, style = 'concise' } = {}) {
  // ← Reuse resume’s extraction behavior
  const role = extractRole({ jobText, resume });

  // Demo-friendly packs (same as before)
  const baseByStyle = {
    concise: {
      greeting: 'Hi there,',
      opening: role
        ? `As a ${role}, I bring clear playbooks and dependable execution—helping teams hit goals faster.`
        : `I bring clear playbooks and dependable execution—helping teams hit goals faster.`,
      body: [
        'Standardized workflows that improved throughput and reduced rework.',
        'Partnered cross-functionally to close feedback loops and accelerate delivery.',
        'Turned ambiguous goals into concrete milestones and measurable outcomes.',
      ],
      valueProp: 'I can help your team move quickly with crisp priorities, simple process, and consistent follow-through.',
      closing: 'Thanks for your time—happy to share relevant wins if helpful.',
      signoff: 'Best,',
    },
    narrative: {
      greeting: 'Dear Hiring Team,',
      opening: role
        ? `As a ${role}, I’ve learned that real impact comes from turning messy problems into clear stories and systems that scale.`
        : `I’ve learned that real impact comes from turning messy problems into clear stories and systems that scale.`,
      body: [
        'Translated goals into journeys with milestones, owners, and definitions of “done.”',
        'Built trust by making expectations explicit—and then delivering consistently.',
        'Scaled what worked through lightweight documentation and repeatable playbooks.',
      ],
      valueProp: 'I’d bring narrative clarity plus operational discipline to help your team move from “trying” to “thriving.”',
      closing: 'I’d love to learn more about the challenges ahead and where I can help most.',
      signoff: 'With appreciation,',
    },
    achievement: {
      greeting: 'Dear Hiring Manager,',
      opening: role
        ? `As a ${role}, I own outcomes—reducing time-to-value and protecting service levels by pairing clear playbooks with the right tools.`
        : `I own outcomes—reducing time-to-value and protecting service levels by pairing clear playbooks with the right tools.`,
      body: [
        'Cut cycle time and backlog by focusing on root causes and standard fixes.',
        'Drove measurable improvements in quality, uptime, or customer satisfaction.',
        'Partnered with adjacent teams to prevent repeat issues and speed decisions.',
      ],
      valueProp: 'I’d help your team hit targets faster with repeatable processes, simple metrics, and steady execution.',
      closing: 'Thank you for your consideration—I’d welcome the chance to discuss impact.',
      signoff: 'Sincerely,',
    },
  };

  const pack = baseByStyle[style] || baseByStyle.concise;
  const opening = sanitizeOpening(pack.opening, role);

  return {
    fields: {
      role,
      greeting: pack.greeting,
      opening,
      body: pack.body,
      valueProp: pack.valueProp,
      closing: pack.closing,
      signoff: pack.signoff,
    },
  };
}
