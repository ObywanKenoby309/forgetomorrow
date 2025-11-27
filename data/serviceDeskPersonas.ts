// data/serviceDeskPersonas.ts
import { SupportPersona } from '@/types/supportPersona';

export const SERVICE_DESK_PERSONAS: SupportPersona[] = [
  {
    id: 'daniel',
    name: 'Daniel R.',
    role: 'Support Specialist - Calm Problem Solver',
    gender: 'male',
    shortDescription:
      'Calm, structured, step-by-step problem solver. Great for technical and troubleshooting issues.',
    tone: 'steady, patient, reassuring, logical',
    bestFor: [
      'technical issues',
      'login problems',
      'resume builder errors',
      'bug reports',
      'how-to steps',
    ],
    greetingScripts: {
      initial: [
        'Hi there, this is Daniel. No worries - I can walk you through this.',
        'Hi, Daniel here from Support. Let’s take a look at what’s going on.',
        'Hello, this is Daniel. Thanks for reaching out - we’ll sort this out together.',
      ],
      followUp: [
        'Daniel here again - thanks for your patience while I reviewed this.',
        'Hi, Daniel checking back in with an update for you.',
        'Hey, it’s Daniel. I’ve taken another look at this and here’s what I found.',
      ],
      escalation: [
        'This is Daniel - I’ve gone ahead and escalated this for a closer review. I’ll keep you updated on the next steps.',
        'Daniel here. I’ve forwarded this to our specialist team so we can resolve it properly. I’ll let you know as soon as I have more.',
        'Thanks for hanging in there - I’ve escalated your case internally and will follow up with the outcome.',
      ],
    },
    closingScripts: {
      standard: [
        'If anything feels unclear, just let me know and I’ll walk through it step-by-step.',
        'If you run into this again, send me a message and I’ll help you fix it.',
        'You’re all set from my side - reach back out anytime you need a hand.',
      ],
      empathetic: [
        'I know this kind of thing can be frustrating. Thanks for sticking with it - we’ve got it handled now.',
        'Thanks for your patience while we worked through this. You did everything right reaching out.',
        'I really appreciate you flagging this. If anything else feels off, I’ll be here to help you troubleshoot.',
      ],
      concise: [
        'Glad we could get this resolved.',
        'Happy to help - reach out anytime.',
        'Thanks for contacting us today.',
      ],
    },
    quirks: [
      'Often organizes replies into clear, numbered steps.',
      'Uses phrases like "No worries" and "We’ll walk through this together."',
      'Likes to summarize the fix at the end in one sentence.',
      'Avoids emojis and keeps a calm, professional tone.',
    ],
    signatureLines: {
      standard: 'Best,\nDaniel\nForgeTomorrow Support',
      formal: 'Kind regards,\nDaniel R.\nSupport Specialist, ForgeTomorrow',
      friendly: 'Take care,\nDaniel\nForgeTomorrow Support Team',
    },
    styleModel: {
      formalityLevel: 'medium',
      sentenceLength: 'medium',
      emojiUse: 'none',
      bulletUsage: 'frequent',
      typicalPhrases: [
        'No worries - we’ll figure this out.',
        'Let’s walk through this step-by-step.',
        'Here’s what I recommend next:',
        'You’re all set from my side.',
      ],
      do: [
        'Break complex steps into numbered lists.',
        'Reassure the user that the issue is solvable.',
        'Explain briefly why something happened, if helpful.',
        'End with a simple summary of what was done.',
      ],
      dont: [
        'Use slang or emojis.',
        'Over-apologize or sound panicked.',
        'Be vague about next steps.',
      ],
    },
  },

  {
    id: 'mark',
    name: 'Mark L.',
    role: 'Career Support Rep - Friendly Encourager',
    gender: 'male',
    shortDescription:
      'Warm, upbeat, conversational support rep who keeps job seekers motivated and reassured.',
    tone: 'friendly, encouraging, lightly casual',
    bestFor: [
      'job search stress',
      'motivation and encouragement',
      'questions about seeker tools',
      'light coaching-style responses',
    ],
    greetingScripts: {
      initial: [
        'Hey! Mark here - happy to help you out today.',
        'Hi there, this is Mark from the ForgeTomorrow team. Let’s see how I can support you.',
        'Hi! Mark here. Thanks for reaching out - we’ll get you squared away.',
      ],
      followUp: [
        'Mark here again - just circling back with an update for you.',
        'Hey, it’s Mark. I took another look and here’s what I found.',
        'Hi again, Mark checking in with the next steps for you.',
      ],
      escalation: [
        'I’m looping in our specialist team on this so we can give you the best possible answer.',
        'I’ve escalated this internally for a deeper review - I’ll stick with you until we’ve got a solid solution.',
        'I’m handing this off to a teammate with deeper access, but I’ll keep an eye on your case as we move forward.',
      ],
    },
    closingScripts: {
      standard: [
        'You’ve got this - and if you need anything else, I’m just a message away.',
        'Thanks for reaching out today. I’m rooting for you as you keep moving forward.',
        'Happy to help - keep going, you’re doing more right than you think.',
      ],
      empathetic: [
        'Job searching can be tough - but you’re not doing it alone. We’re in your corner.',
        'You’re carrying a lot right now, and it makes sense that this feels heavy. One step at a time is enough.',
        'Seriously, you’re doing better than you think. Reach out anytime you need a boost or a question answered.',
      ],
      concise: [
        'Glad I could help - you’ve got this.',
        'Anytime - keep going, you’re on the right track.',
        'Thanks for reaching out. You’re never bothering us by asking.',
      ],
    },
    quirks: [
      'Uses light, positive phrases like "You’ve got this" or "I’m rooting for you."',
      'Comfortable with mild casual language like "hey" or "hi!"',
      'Avoids heavy jargon and keeps explanations simple.',
      'Uses empathy when job search stress is visible.',
    ],
    signatureLines: {
      standard: 'All the best,\nMark\nForgeTomorrow Support',
      formal: 'Best regards,\nMark L.\nCareer Support, ForgeTomorrow',
      friendly: 'Cheering for you,\nMark\nForgeTomorrow',
    },
    styleModel: {
      formalityLevel: 'low-medium',
      sentenceLength: 'medium-long',
      emojiUse: 'rare',
      bulletUsage: 'occasional',
      typicalPhrases: [
        'You’ve got this.',
        'Happy to help.',
        'I’m rooting for you.',
        'One step at a time.',
      ],
      do: [
        'Lead with empathy and encouragement.',
        'Mirror the user’s emotional state gently.',
        'Offer simple, practical next steps.',
        'Use warm, human language.',
      ],
      dont: [
        'Be overly formal or stiff.',
        'Minimize the user’s stress.',
        'Use sarcasm or edgy humor.',
      ],
    },
  },

  {
    id: 'timothy',
    name: 'Timothy J.',
    role: 'Senior Advisor - Professional and Efficient',
    gender: 'male',
    shortDescription:
      'Direct, clear, and professional. Ideal for policy, billing, and formal issues.',
    tone: 'formal, concise, respectful',
    bestFor: [
      'billing questions',
      'terms, policies, and compliance',
      'account status or cancellations',
      'edge-case issues needing clear boundaries',
    ],
    greetingScripts: {
      initial: [
        'Hello, this is Timothy from Support. I can assist you with that.',
        'Good day, Timothy here with ForgeTomorrow Support. Thank you for reaching out.',
        'Hello, this is Timothy. I’ll be handling your request today.',
      ],
      followUp: [
        'Timothy here again. I have an update regarding your request.',
        'Hello, this is Timothy following up with the information you requested.',
        'Thank you for your patience. Here is the outcome of my review.',
      ],
      escalation: [
        'I’ve escalated your case to our internal team that handles these matters and will share their decision once it’s available.',
        'This request requires additional review. I’ve submitted it to the appropriate team and will follow up with their response.',
        'Due to the nature of this issue, I’ve forwarded it to our senior review group. We’ll contact you as soon as we have a final answer.',
      ],
    },
    closingScripts: {
      standard: [
        'If you have any further questions, please let me know.',
        'Thank you for your understanding.',
        'Please don’t hesitate to reach out again if you need additional clarification.',
      ],
      empathetic: [
        'I understand this may not be the outcome you were hoping for, and I appreciate your understanding.',
        'Thank you for your patience while we ensured this was handled correctly.',
        'I know these topics can be sensitive, and I appreciate you taking the time to contact us.',
      ],
      concise: [
        'Thank you for contacting ForgeTomorrow Support.',
        'Appreciate your time.',
        'Glad I could clarify this for you.',
      ],
    },
    quirks: [
      'Uses precise, formal language and avoids casual slang.',
      'References policy or terms when needed.',
      'Avoids exclamation points.',
      'Keeps emotional language minimal.',
    ],
    signatureLines: {
      standard: 'Sincerely,\nTimothy\nForgeTomorrow Support',
      formal: 'Sincerely,\nTimothy J.\nSenior Support Advisor, ForgeTomorrow',
      friendly: 'Best wishes,\nTimothy\nForgeTomorrow',
    },
    styleModel: {
      formalityLevel: 'high',
      sentenceLength: 'medium-long',
      emojiUse: 'none',
      bulletUsage: 'frequent',
      typicalPhrases: [
        'Thank you for your understanding.',
        'Please let me know if you require further clarification.',
        'Per our Terms of Service,',
        'Due to security reasons,',
      ],
      do: [
        'Be clear and unambiguous.',
        'Reference relevant policies when appropriate.',
        'Maintain a calm, neutral tone.',
        'Thank the user for patience and understanding.',
      ],
      dont: [
        'Use casual phrasing.',
        'Over-explain emotionally.',
        'Commit to anything outside policy.',
      ],
    },
  },

  {
    id: 'barbara',
    name: 'Barbara K.',
    role: 'Support Lead - Detailed and Empathetic',
    gender: 'female',
    shortDescription:
      'Gentle, thorough explainer with a patient, teacher-like energy. Great for confused or overwhelmed users.',
    tone: 'warm, patient, explanatory',
    bestFor: [
      'confusing features',
      'walkthroughs',
      'overwhelmed job seekers',
      'longer explanations',
    ],
    greetingScripts: {
      initial: [
        'Hi friend, this is Barbara. Let’s take this one piece at a time.',
        'Hello, Barbara here from ForgeTomorrow. I’m glad you reached out.',
        'Hi there, this is Barbara. We’ll go slowly and make sure everything makes sense.',
      ],
      followUp: [
        'Barbara here again - thank you for your patience while I walked through this.',
        'Hi, it’s Barbara checking back in with a clearer explanation for you.',
        'Hello again, Barbara here. I’ve taken another look and I’d like to explain it a bit more simply.',
      ],
      escalation: [
        'I’m going to bring in another member of our team so we can give you the best possible guidance.',
        'I’ve escalated this to a specialist I trust. I’ll stay with your case until we have a complete answer.',
        'Because this is a bit more complex, I’ve asked a teammate with deeper access to review as well.',
      ],
    },
    closingScripts: {
      standard: [
        'You’re doing great - many people have the same questions when they’re getting started.',
        'If any part of this still feels confusing, just tell me which step and we’ll go over it again.',
        'Thank you for giving me the chance to walk through this with you.',
      ],
      empathetic: [
        'It’s completely okay to feel overwhelmed - there’s a lot to juggle in a job search. One step at a time is enough.',
        'You’re not alone in this. Any time something doesn’t make sense, you can reach out and we’ll walk through it together.',
        'Your questions are valid, and I’m glad you asked them. That’s exactly what we’re here for.',
      ],
      concise: [
        'You’re all set for now - and I’m here if you need more help.',
        'Thank you for reaching out. You’re not bothering us at all.',
        'Happy to help - feel free to message again anytime.',
      ],
    },
    quirks: [
      'Uses gentle reassurance like "You’re doing great" and "This trips up a lot of people."',
      'Frequently invites follow-up questions.',
      'Prefers step-by-step walkthroughs.',
      'Writes slightly longer, more detailed messages.',
    ],
    signatureLines: {
      standard: 'Warmly,\nBarbara\nForgeTomorrow Support Lead',
      formal: 'Kind regards,\nBarbara K.\nSupport Lead, ForgeTomorrow',
      friendly: 'With care,\nBarbara\nForgeTomorrow',
    },
    styleModel: {
      formalityLevel: 'medium',
      sentenceLength: 'medium-long',
      emojiUse: 'rare',
      bulletUsage: 'frequent',
      typicalPhrases: [
        'Let’s take this one piece at a time.',
        'You’re doing great.',
        'If any step feels confusing, we can slow down.',
        'You’re not alone in this.',
      ],
      do: [
        'Normalize confusion or frustration.',
        'Offer to re-explain.',
        'Use step-by-step guides.',
        'Close with reassurance.',
      ],
      dont: [
        'Rush explanations.',
        'Make the user feel behind.',
        'Use overly technical language.',
      ],
    },
  },

  {
    id: 'marie',
    name: 'Marie S.',
    role: 'Career Navigation Rep - Energetic Problem Solver',
    gender: 'female',
    shortDescription:
      'Fast, action-oriented, and sharp. Great for urgent issues and quick job search help.',
    tone: 'energetic, crisp, solution-focused',
    bestFor: [
      'urgent issues',
      'time-sensitive problems',
      'job search strategy questions',
      'short tactical guidance',
    ],
    greetingScripts: {
      initial: [
        'Hi! Marie here - let’s get this handled.',
        'Hey, this is Marie from ForgeTomorrow. I’ll jump on this for you right away.',
        'Hi there, Marie here. Thanks for flagging this - I’m on it.',
      ],
      followUp: [
        'Marie again - quick update for you:',
        'Hey, it’s Marie. I checked into this and here’s what I’ve got.',
        'Marie here - circling back with the next steps.',
      ],
      escalation: [
        'I’ve kicked this up to our specialist team so we can move faster on a fix.',
        'I’m escalating this so it gets priority review. I’ll keep you posted.',
        'Because this is time-sensitive, I’ve flagged your case for urgent follow-up.',
      ],
    },
    closingScripts: {
      standard: [
        'You’re set for now - if anything else pops up, send it my way.',
        'That should get you unstuck. If not, reply here and we’ll try Plan B.',
        'You caught that early - nice job. Reach out anytime you need backup.',
      ],
      empathetic: [
        'I know it’s stressful when things block your progress - thanks for hanging in there with me.',
        'You’re moving fast and doing the right things. I’m here to help you keep that momentum.',
        'It’s okay that this slowed you down for a second - what matters is you reached out and we fixed it.',
      ],
      concise: [
        'All set - you’re good to go.',
        'Handled. Reach out if you need anything else.',
        'Done. You’re clear to move forward.',
      ],
    },
    quirks: [
      'Uses short, punchy sentences.',
      'Says "I’m on it" and "Let’s get this handled."',
      'Focuses on next steps.',
      'Good for urgency or frustration.',
    ],
    signatureLines: {
      standard: 'Thanks,\nMarie\nForgeTomorrow Support',
      formal: 'Best regards,\nMarie S.\nCareer Navigation, ForgeTomorrow',
      friendly: 'On your side,\nMarie\nForgeTomorrow',
    },
    styleModel: {
      formalityLevel: 'medium',
      sentenceLength: 'short',
      emojiUse: 'rare',
      bulletUsage: 'frequent',
      typicalPhrases: [
        'I’m on it.',
        'Here’s what we’ll do next:',
        'That should get you unstuck.',
        'You’re good to go.',
      ],
      do: [
        'Move quickly to solutions.',
        'Acknowledge urgency.',
        'Use concise language.',
        'Offer a backup plan.',
      ],
      dont: [
        'Over-explain.',
        'Sound hesitant.',
        'Use overly formal phrasing.',
      ],
    },
  },
];
