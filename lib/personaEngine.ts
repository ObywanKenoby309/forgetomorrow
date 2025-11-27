// lib/personaEngine.ts
import { SERVICE_DESK_PERSONAS } from '@/data/serviceDeskPersonas';
import { SupportIntent, SupportPersona } from '@/types/supportPersona';

export function detectSupportIntent(message: string): SupportIntent {
  const text = message.toLowerCase();

  if (
    text.includes('charge') ||
    text.includes('billing') ||
    text.includes('invoice') ||
    text.includes('refund') ||
    text.includes('payment')
  ) {
    return 'billing';
  }

  if (
    text.includes('error') ||
    text.includes('bug') ||
    text.includes('not working') ||
    text.includes('can’t log in') ||
    text.includes("can't log in") ||
    text.includes('login issue') ||
    text.includes('technical')
  ) {
    return 'technical';
  }

  if (
    text.includes('asap') ||
    text.includes('urgent') ||
    text.includes('immediately') ||
    text.includes('now') ||
    text.includes('right away')
  ) {
    return 'urgent';
  }

  if (
    text.includes('stressed') ||
    text.includes('overwhelmed') ||
    text.includes('anxious') ||
    text.includes('burned out') ||
    text.includes('discouraged') ||
    text.includes('frustrated')
  ) {
    return 'emotional';
  }

  return 'general';
}

export function pickPersona(
  intent: SupportIntent,
  previousPersonaId?: SupportPersona['id']
): SupportPersona {
  const byIntent: Record<SupportIntent, SupportPersona['id'][]> = {
    technical: ['daniel'],
    billing: ['timothy'],
    emotional: ['mark', 'barbara'],
    urgent: ['marie', 'daniel'],
    general: ['mark', 'barbara', 'daniel', 'timothy', 'marie'],
  };

  let pool = byIntent[intent] || byIntent.general;

  // avoid repeating the same persona if possible
  if (previousPersonaId && pool.length > 1) {
    pool = pool.filter((id) => id !== previousPersonaId);
  }

  const id = pool[Math.floor(Math.random() * pool.length)];
  const persona =
    SERVICE_DESK_PERSONAS.find((p) => p.id === id) || SERVICE_DESK_PERSONAS[0];

  return persona;
}

function randomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export type ClosingTone = 'standard' | 'empathetic' | 'concise';

export function pickGreeting(persona: SupportPersona): string {
  return randomFromArray(persona.greetingScripts.initial);
}

export function pickClosing(
  persona: SupportPersona,
  tone: ClosingTone
): string {
  const closings = persona.closingScripts[tone];
  return randomFromArray(closings);
}

export function pickSignature(
  persona: SupportPersona,
  style: 'standard' | 'formal' | 'friendly' = 'standard'
): string {
  return persona.signatureLines[style];
}
