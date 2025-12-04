// pages/api/support/ask.ts
// Public-facing Support chat endpoint for real ForgeTomorrow users.
// Automatically routes messages to the correct support persona based on issue type.

import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { PERSONA_PROMPTS, PersonaId } from '../../../lib/personas';

// Read the API key from environment
const apiKey = process.env.OPENAI_API_KEY;

// Log once on boot so we can see whether the key is present
console.log(
  'Support API boot - OPENAI_API_KEY present?',
  apiKey ? 'YES' : 'NO'
);

// Initialize OpenAI client only if key is present
const openai = apiKey ? new OpenAI({ apiKey }) : null;

// Default model (can override via env)
const SUPPORT_MODEL = process.env.HELPDESK_MODEL || 'gpt-4.1-mini';

// Supported categories
type SupportIntent =
  | 'technical'
  | 'billing'
  | 'recruiter'
  | 'emotional'
  | 'general';

type SupportResponseBody =
  | { reply: string; personaId: PersonaId; intent: SupportIntent }
  | { error: string };

// ---------------------------------------------------------------------------
// Intent Detection - Automatic Routing (like Admin Tester)
// ---------------------------------------------------------------------------
function detectIntent(message: string): SupportIntent {
  const text = message.toLowerCase();

  // Technical issues
  if (
    text.includes('bug') ||
    text.includes('error') ||
    text.includes('crash') ||
    text.includes('broken') ||
    text.includes('not loading') ||
    text.includes('issue') ||
    text.includes('cannot log in') ||
    text.includes("can't log in") ||
    text.includes('cant log in') ||
    text.includes('login') ||
    text.includes('technical') ||
    text.includes('problem with site')
  ) {
    return 'technical';
  }

  // Billing issues
  if (
    text.includes('billing') ||
    text.includes('charge') ||
    text.includes('charged') ||
    text.includes('payment') ||
    text.includes('subscription') ||
    text.includes('plan') ||
    text.includes('refund') ||
    text.includes('invoice')
  ) {
    return 'billing';
  }

  // Recruiter / hiring manager tools
  if (
    text.includes('recruiter') ||
    text.includes('job post') ||
    text.includes('posting') ||
    text.includes('pipeline') ||
    text.includes('talent') ||
    text.includes('candidate') ||
    text.includes('ats')
  ) {
    return 'recruiter';
  }

  // Emotional support
  if (
    text.includes('burnout') ||
    text.includes('anxious') ||
    text.includes('anxiety') ||
    text.includes('overwhelmed') ||
    text.includes('discouraged') ||
    text.includes('depressed') ||
    text.includes('stressed') ||
    text.includes('hopeless') ||
    text.includes('tired') ||
    text.includes('exhausted') ||
    text.includes('mental') ||
    text.includes('emotion')
  ) {
    return 'emotional';
  }

  return 'general';
}

// Map intent → persona
const INTENT_TO_PERSONA: Record<SupportIntent, PersonaId> = {
  general: 'daniel',
  technical: 'timothy',
  billing: 'barbara',
  recruiter: 'mark',
  emotional: 'marie',
};

// ---------------------------------------------------------------------------
// Global ForgeTomorrow Context
// ---------------------------------------------------------------------------
const GLOBAL_CONTEXT = `
You are part of the ForgeTomorrow Support Desk.

IMPORTANT RULES:
- Every question is ALWAYS about ForgeTomorrow, the professional networking platform.
- If a user mentions "login", it ALWAYS means they can't log into ForgeTomorrow.
- If a user mentions "billing", "charges", or "subscriptions", they ALWAYS mean ForgeTomorrow billing.
- If they reference "my account", "the site", or "the app", assume ForgeTomorrow.
- Never ask "which service" or "which platform" — it's always ForgeTomorrow.
- Be clear, concise, helpful, and professional.
`.trim();

// ---------------------------------------------------------------------------
// Escalation trigger detection
// ---------------------------------------------------------------------------
function isEscalationTrigger(message: string): boolean {
  const text = message.toLowerCase();

  const phrases = [
    "this didn't work",
    'this did not work',
    "that didn't work",
    'that did not work',
    'still not working',
    'still not work',
    "didn't fix",
    'did not fix',
    "didn't help",
    'did not help',
    'no change',
    'same issue',
    'same problem',
  ];

  return phrases.some((p) => text.includes(p));
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SupportResponseBody>
) {
  if (!openai) {
    console.warn('[Support API] Missing OPENAI_API_KEY.');
    return res.status(500).json({
      error: 'Support is temporarily unavailable. Please try again later.',
    });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const body = req.body as any;

    const candidateMessage =
      typeof body.message === 'string'
        ? body.message
        : typeof body.text === 'string'
        ? body.text
        : typeof body.question === 'string'
        ? body.question
        : typeof body.query === 'string'
        ? body.query
        : typeof body.input === 'string'
        ? body.input
        : null;

    const message = candidateMessage?.trim() || null;
    if (!message) {
      return res.status(400).json({
        error:
          'Missing or invalid "message". Expected message, text, question, query, or input.',
      });
    }

    // 🔥 If personaId is supplied, stick with it (no auto routing)
    const incomingPersonaId = body.personaId as PersonaId | undefined;

    let intent: SupportIntent;
    let selectedPersona: PersonaId;

    if (incomingPersonaId && PERSONA_PROMPTS[incomingPersonaId]) {
      // Persona already assigned for this session
      selectedPersona = incomingPersonaId;
      intent = body.intent || 'general';
    } else {
      // FIRST message — auto-route based on intent
      intent = detectIntent(message);
      selectedPersona = INTENT_TO_PERSONA[intent];
    }

    // 🆕 Escalation check for follow-up messages like "this didn't work"
    if (incomingPersonaId && isEscalationTrigger(message)) {
      const escalationReply =
        "I'm sorry that didn't fully resolve the issue yet. Would you like me to escalate this to our next level support so we can take a deeper look?";

      return res.status(200).json({
        reply: escalationReply,
        personaId: selectedPersona,
        intent,
      });
    }

    const personaPrompt = PERSONA_PROMPTS[selectedPersona];

    const messagesToSend = [
      { role: 'system' as const, content: GLOBAL_CONTEXT },
      { role: 'system' as const, content: personaPrompt },
      { role: 'user' as const, content: message },
    ];

    const completion = await openai.chat.completions.create({
      model: SUPPORT_MODEL,
      messages: messagesToSend,
      temperature: 0.4,
      max_tokens: 600,
    });

    const reply = completion.choices[0]?.message?.content?.trim() || '';

    return res.status(200).json({
      reply,
      personaId: selectedPersona,
      intent,
    });
  } catch (error: any) {
    console.error('[Support API] Error:', error?.message || error);
    return res.status(500).json({
      error: 'Something went wrong while processing your request.',
    });
  }
}
