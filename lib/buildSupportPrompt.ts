// lib/buildSupportPrompt.ts
import {
  ClosingTone,
  pickClosing,
  pickGreeting,
  pickSignature,
} from '@/lib/personaEngine';
import { SupportPersona } from '@/types/supportPersona';

interface BuildSupportPromptOptions {
  userMessage: string;
  persona: SupportPersona;
  inferredClosingTone?: ClosingTone;
  signatureStyle?: 'standard' | 'formal' | 'friendly';
}

export function buildSupportPrompt({
  userMessage,
  persona,
  inferredClosingTone = 'standard',
  signatureStyle = 'standard',
}: BuildSupportPromptOptions): string {
  const personaProfile = JSON.stringify(
    {
      id: persona.id,
      name: persona.name,
      role: persona.role,
      tone: persona.tone,
      shortDescription: persona.shortDescription,
      bestFor: persona.bestFor,
      quirks: persona.quirks,
      styleModel: persona.styleModel,
    },
    null,
    2
  );

  const masterPrompt = `
You are acting as a ForgeTomorrow Service Desk representative.

Your name, tone, style, and behavior are defined by the selected persona profile below.

[PERSONA_PROFILE]

---

### MESSAGE TO RESPOND TO:
[USER_MESSAGE]

### INSTRUCTIONS:
1. Respond strictly in the persona’s voice and tone.
2. Start with this greeting line (you may adapt it slightly to flow better, but keep its spirit):
   "[GREETING_LINE]"
3. Write the main response in the persona’s style model and quirks.
4. End with:
   - One closing line that fits this tone: [CLOSING_TONE]
   - Then a signature block like this:
     [SIGNATURE_BLOCK]
5. Keep replies human, friendly, and natural.
6. DO NOT mention that you are an AI or language model.
7. NEVER break persona character.

### OUTPUT FORMAT:
- Greeting line  
- Response body  
- Closing line  
- Signature block
`.trim();

  const greetingLine = pickGreeting(persona);
  const closingToneLabel = inferredClosingTone;
  const closingLine = pickClosing(persona, inferredClosingTone);
  const signatureBlock = pickSignature(persona, signatureStyle);

  const filledPrompt = masterPrompt
    .replace('[PERSONA_PROFILE]', personaProfile)
    .replace('[USER_MESSAGE]', userMessage)
    .replace('[GREETING_LINE]', greetingLine)
    .replace('[CLOSING_TONE]', closingToneLabel)
    .replace(
      '[SIGNATURE_BLOCK]',
      signatureBlock + '\n(Use this signature in your own words at the end.)'
    );

  return filledPrompt;
}
