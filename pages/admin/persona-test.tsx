// pages/admin/persona-test.tsx
// AI HelpDesk Personas – Admin Preview + Live Test Console
// Built by Sora & Ted — November 2025

import React, { useState } from 'react';
import type { PersonaId } from '@/lib/personas';

type Persona = {
  id: PersonaId;
  name: string;
  initials: string;
  role: string;
  pronouns: string;
  timezone: string;
  style: string;
  specialties: string[];
  sampleGreeting: string;
  sampleQuestions: string[];
};

const PERSONAS: Persona[] = [
  {
    id: 'daniel',
    name: 'Daniel',
    initials: 'DA',
    role: 'Job Seeker Support Specialist',
    pronouns: 'he/him',
    timezone: 'US Eastern (ET)',
    style:
      'Warm, encouraging, explains concepts step-by-step. Great for anxious or first-time job seekers.',
    specialties: [
      'Resume and cover letter questions',
      'Basic job search strategies',
      'Using ForgeTomorrow for the first time',
    ],
    sampleGreeting:
      'Hey there, I am Daniel. You are not bothering me at all. Tell me where you are stuck and we will walk through it together.',
    sampleQuestions: [
      'I am overwhelmed. Where do I even start with my job search?',
      'Can you help me understand what this resume section actually means?',
      'How do I create my ForgeTomorrow profile step-by-step?',
    ],
  },
  {
    id: 'mark',
    name: 'Mark',
    initials: 'MK',
    role: 'Technical and Platform Troubleshooting',
    pronouns: 'he/him',
    timezone: 'US Central (CT)',
    style:
      'Calm, precise, systems-minded. Great for bugs, errors, and "why is this not working" issues.',
    specialties: [
      'Login and authentication issues',
      'Profile settings and privacy controls',
      'Job feed and search filters not behaving as expected',
    ],
    sampleGreeting:
      'Hi, I am Mark. If something is not working the way you expect, I want to hear about it. Give me as much detail as you can and we will dig in.',
    sampleQuestions: [
      'I am stuck in a login loop and cannot reach my dashboard.',
      'I changed my email but the verification link is not working.',
      'The job feed looks wrong. Can you help me troubleshoot?',
    ],
  },
  {
    id: 'timothy',
    name: 'Timothy',
    initials: 'TT',
    role: 'Career Strategy and Clarity Coach',
    pronouns: 'he/him',
    timezone: 'US Pacific (PT)',
    style:
      'Direct but kind, focused on clarity and action plans. Great for people who want an honest read.',
    specialties: [
      'Career direction and "what next" questions',
      'Positioning for remote work',
      'Bridging gaps between past experience and new roles',
    ],
    sampleGreeting:
      'I am Timothy. If you are ready for a real conversation about where you are headed, you are in the right place. Let us get specific about your goals.',
    sampleQuestions: [
      'My background is all over the place. How do I tell a clear story?',
      'Can I realistically transition into tech or remote work from where I am now?',
      'What should I focus on this month to move my career forward?',
    ],
  },
  {
    id: 'barbara',
    name: 'Barbara',
    initials: 'BA',
    role: 'Compassionate Support and Confidence Builder',
    pronouns: 'she/her',
    timezone: 'UK / EU (GMT / CET overlap)',
    style:
      'Patient, nurturing, and highly supportive. Great for users who are discouraged or burnt out.',
    specialties: [
      'Encouragement after rejections',
      'Reframing experience in a positive light',
      'Low-confidence job seekers needing gentle guidance',
    ],
    sampleGreeting:
      'Hi, I am Barbara. I know this process can be exhausting. You do not have to pretend with me. Tell me what is really going on and we will rebuild your confidence step by step.',
    sampleQuestions: [
      'I have been rejected so many times. Am I even hirable?',
      'Can you help me see what I am doing right? I only see what is wrong.',
      'How do I keep going when I feel like nothing is working?',
    ],
  },
  {
    id: 'marie',
    name: 'Marie',
    initials: 'ME',
    role: 'Billing, Subscriptions, and Account Management',
    pronouns: 'she/her',
    timezone: 'Global business hours',
    style:
      'Clear, professional, and straightforward. Great for money, plan, and policy questions.',
    specialties: [
      'Billing issues and refunds (within policy)',
      'Upgrades, downgrades, and plan comparisons',
      'Account deletion and data rights',
    ],
    sampleGreeting:
      'You are talking with Marie. I will make sure you understand exactly what is happening with your plan, billing, and data, and what options you have next.',
    sampleQuestions: [
      'Can you explain the difference between Seeker Basic and Seeker Pro?',
      'I was charged but did not mean to upgrade. What can we do?',
      'How do I fully delete my account and data from ForgeTomorrow?',
    ],
  },
];

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

function PersonaCard({
  persona,
  active,
  onClick,
}: {
  persona: Persona;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex flex-col rounded-2xl border p-4 text-left shadow-sm transition-all',
        active
          ? 'border-indigo-400 bg-slate-900'
          : 'border-slate-800 bg-slate-900/60 hover:border-slate-600 hover:bg-slate-900/80',
      ].join(' ')}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500 text-xs font-semibold text-white">
          {persona.initials}
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-50">
              {persona.name}
            </h3>
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-300">
              {persona.role}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {persona.pronouns} • {persona.timezone}
          </p>
        </div>
      </div>

      <p className="mb-3 text-xs text-slate-300 leading-relaxed">
        {persona.style}
      </p>

      <div className="mb-3">
        <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Specialties
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {persona.specialties.map((item) => (
            <span
              key={item}
              className="rounded-full bg-slate-800/80 px-2 py-0.5 text-[11px] text-slate-200"
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-auto text-[11px] text-slate-400">
        <span className="font-semibold text-slate-300">Sample greeting:</span>{' '}
        {persona.sampleGreeting}
      </div>
    </button>
  );
}

export default function PersonaTestPage() {
  const [selectedPersonaId, setSelectedPersonaId] =
    useState<PersonaId>('daniel');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activePersona = PERSONAS.find(
    (p) => p.id === selectedPersonaId
  ) as Persona;

  function handleSelectPersona(id: PersonaId) {
    setSelectedPersonaId(id);
    setMessages([]);
    setError(null);
    setInput('');
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const newMessages: ChatMessage[] = [
      ...messages,
      { role: 'user', content: trimmed },
    ];

    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/helpdesk/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personaId: selectedPersonaId,
          messages: newMessages,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(
          data.error ||
            'The helpdesk assistant did not return a response.'
        );
        setIsLoading(false);
        return;
      }

      const assistantMessage: string = data.assistantMessage;

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: assistantMessage },
      ]);
    } catch (err) {
      console.error('Helpdesk test error:', err);
      setError(
        'Something went wrong while talking to the helpdesk API.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 lg:px-6 lg:py-10">
        {/* Header */}
        <header className="flex flex-col gap-3 border-b border-slate-800 pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Admin · Service Desk
            </p>
            <h1 className="text-2xl font-semibold text-slate-50">
              AI HelpDesk Personas
            </h1>
            <p className="mt-1 text-sm text-slate-300 max-w-2xl">
              Internal preview and live test console for the five
              Service Desk personas. Select a persona on the left, then
              send test questions on the right to see how they respond.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-slate-400">
            <span className="rounded-full bg-slate-900 px-2.5 py-1">
              5 personas available
            </span>
            <span className="rounded-full bg-slate-900 px-2.5 py-1">
              Internal only · Not user facing
            </span>
          </div>
        </header>

        <main className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1.1fr)]">
          {/* Persona grid */}
          <section className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Personas
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {PERSONAS.map((persona) => (
                <PersonaCard
                  key={persona.id}
                  persona={persona}
                  active={persona.id === selectedPersonaId}
                  onClick={() =>
                    handleSelectPersona(persona.id)
                  }
                />
              ))}
            </div>
          </section>

          {/* Live test console */}
          <section className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                  Live test console
                </p>
                <h2 className="text-sm font-semibold text-slate-50">
                  Talking with {activePersona.name}
                </h2>
                <p className="text-xs text-slate-400">
                  {activePersona.role} · {activePersona.style}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 text-[11px] text-slate-400">
                <span className="rounded-full bg-slate-950 px-2 py-0.5">
                  Persona: {activePersona.name}
                </span>
                <span className="text-[10px]">
                  Each persona has NSFW / NSFL guardrails enabled.
                </span>
              </div>
            </div>

            {/* Chat window */}
            <div className="mt-3 flex min-h-[260px] flex-1 flex-col rounded-xl bg-slate-950/80 p-3">
              <div className="mb-2 flex items-center justify-between text-[11px] text-slate-400">
                <span>Conversation preview</span>
                <button
                  type="button"
                  onClick={() => {
                    setMessages([]);
                    setError(null);
                  }}
                  className="text-[10px] underline-offset-2 hover:underline"
                >
                  Clear
                </button>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/70 p-2 text-[13px]">
                {messages.length === 0 && (
                  <div className="text-[11px] text-slate-500">
                    No messages yet. Type a question below to start a
                    test conversation with {activePersona.name}.
                  </div>
                )}

                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={
                      msg.role === 'user'
                        ? 'flex justify-end'
                        : 'flex justify-start'
                    }
                  >
                    <div
                      className={[
                        'max-w-[80%] rounded-lg px-3 py-1.5 text-[12px] leading-relaxed',
                        msg.role === 'user'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-50',
                      ].join(' ')}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>

              {error && (
                <div className="mt-2 rounded-md border border-red-700 bg-red-950/60 px-2 py-1 text-[11px] text-red-200">
                  {error}
                </div>
              )}

              {/* Input */}
              <form
                onSubmit={handleSend}
                className="mt-3 flex flex-col gap-2"
              >
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={`Ask ${activePersona.name} a question...`}
                  className="min-h-[70px] w-full resize-y rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-[13px] text-slate-50 outline-none placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] text-slate-400">
                    This endpoint uses the central HelpDesk API and
                    persona prompts from <code>lib/personas.ts</code>.
                  </p>
                  <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="inline-flex items-center justify-center rounded-full px-4 py-1.5 text-[12px] font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed bg-indigo-600 hover:bg-indigo-500"
                  >
                    {isLoading
                      ? 'Sending...'
                      : `Send to ${activePersona.name}`}
                  </button>
                </div>
              </form>
            </div>
          </section>
        </main>

        <footer className="mt-2 border-t border-slate-800 pt-2">
          <p className="text-[11px] text-slate-500">
            Future idea: log HelpDesk test conversations here or push
            them into an "AI QA" log for review before enabling
            external users. This page is internal only and should not
            be linked from public navigation.
          </p>
        </footer>
      </div>
    </div>
  );
}
