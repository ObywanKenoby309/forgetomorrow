// types/supportPersona.ts

export type SupportIntent =
  | 'technical'
  | 'billing'
  | 'emotional'
  | 'urgent'
  | 'general';

export interface PersonaGreetingScripts {
  initial: string[];
  followUp: string[];
  escalation: string[];
}

export interface PersonaClosingScripts {
  standard: string[];
  empathetic: string[];
  concise: string[];
}

export interface PersonaSignatureLines {
  standard: string;
  formal: string;
  friendly: string;
}

export interface PersonaStyleModel {
  formalityLevel: 'low' | 'low-medium' | 'medium' | 'high';
  sentenceLength: 'short' | 'medium' | 'medium-long' | 'long';
  emojiUse: 'none' | 'rare';
  bulletUsage: 'none' | 'occasional' | 'frequent';
  typicalPhrases: string[];
  do: string[];
  dont: string[];
}

export interface SupportPersona {
  id: 'daniel' | 'mark' | 'timothy' | 'barbara' | 'marie';
  name: string;
  role: string;
  gender: 'male' | 'female';
  shortDescription: string;
  tone: string;
  bestFor: string[];
  greetingScripts: PersonaGreetingScripts;
  closingScripts: PersonaClosingScripts;
  quirks: string[];
  signatureLines: PersonaSignatureLines;
  styleModel: PersonaStyleModel;
}
