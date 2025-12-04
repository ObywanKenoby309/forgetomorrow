// pages/support/chat.js
import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

// Persona definitions for display only
const PERSONA_DISPLAY = {
  daniel: {
    id: 'daniel',
    name: 'Daniel',
    initials: 'D',
    role: 'General & tools support',
  },
  mark: {
    id: 'mark',
    name: 'Mark',
    initials: 'M',
    role: 'Recruiter & account support',
  },
  timothy: {
    id: 'timothy',
    name: 'Timothy',
    initials: 'T',
    role: 'Deep technical troubleshooting',
  },
  barbara: {
    id: 'barbara',
    name: 'Barbara',
    initials: 'B',
    role: 'Billing & subscriptions',
  },
  marie: {
    id: 'marie',
    name: 'Marie',
    initials: 'M',
    role: 'Job search & emotional support',
  },
};

export default function SupportChatPage() {
  const [messages, setMessages] = useState([
    {
      id: 'welcome-1',
      from: 'system',
      text: `Welcome to the ForgeTomorrow Support Desk. 
Type your question or concern in your own words. We'll automatically route it to the right support persona (technical, billing, recruiter, or emotional support) and keep you with that same person for this conversation.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 🔴 Once set after the first reply, this persona stays for the entire chat
  const [activePersonaId, setActivePersonaId] = useState(null);

  // 🆕 A single support ticket per chat session
  const [ticketId, setTicketId] = useState(null);

  const bottomRef = useRef(null);

  useEffect(() => {
    if (!bottomRef.current) return;
    bottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setError(null);

    const userMessage = {
      id: `user-${Date.now()}`,
      from: 'user',
      text: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/support/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          // 🔥 If a persona has already been assigned, stick with it.
          // Backend will only auto-route when personaId is not provided (first message).
          personaId: activePersonaId,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.error || 'Support service is unavailable right now.'
        );
      }

      const data = await res.json();

      // First reply: backend chooses persona → we lock it in activePersonaId
      // Later replies: we keep using the already locked persona
      let resolvedPersonaId = activePersonaId;

      if (!resolvedPersonaId && data.personaId) {
        resolvedPersonaId = data.personaId;
        setActivePersonaId(data.personaId);
      }

      const personaInfo = resolvedPersonaId
        ? PERSONA_DISPLAY[resolvedPersonaId]
        : null;

      const botMessage = {
        id: `bot-${Date.now()}`,
        from: 'bot',
        text: data.reply || 'Our support team is here for you.',
        personaId: resolvedPersonaId,
        personaName: personaInfo?.name || 'Support',
        personaRole: personaInfo?.role || '',
        intent: data.intent || 'general',
      };

      // 🆕 Automatic ticket creation on FIRST successful response
      if (!ticketId) {
        const subject =
          trimmed.length > 80
            ? `${trimmed.slice(0, 77)}...`
            : trimmed;

        try {
          const ticketRes = await fetch('/api/support/tickets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subject,
              initialMessage: trimmed,
              personaId: resolvedPersonaId || null,
              intent: data.intent || 'general',
              source: 'support-chat',
            }),
          });

          if (ticketRes.ok) {
            const ticketData = await ticketRes.json().catch(() => null);
            if (ticketData?.ticket?.id) {
              setTicketId(ticketData.ticket.id);
            }
          } else {
            console.error('Failed to create support ticket');
          }
        } catch (ticketErr) {
          console.error('Error creating support ticket', ticketErr);
        }
      }

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error(err);
      setError(
        err.message || 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const intentLabel = (intent) => {
    switch (intent) {
      case 'technical':
        return 'Technical';
      case 'billing':
        return 'Billing / Plan';
      case 'recruiter':
        return 'Recruiter Tools';
      case 'emotional':
        return 'Job Search / Mindset';
      case 'general':
      default:
        return 'General';
    }
  };

  return (
    <>
      <Head>
        <title>ForgeTomorrow - Support Chat</title>
      </Head>

      <main className="max-w-5xl mx-auto px-4 py-6 md:py-10 min-h-[80vh] flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#FF7043]">
              Support Chat
            </h1>
            <p className="text-sm md:text-base text-slate-600">
              Ask your question in natural language. The right support persona will answer automatically and stay with you for this conversation.
            </p>
            {ticketId && (
              <p className="mt-1 text-[11px] text-slate-500">
                Ticket created for this chat:&nbsp;
                <span className="font-mono">{ticketId}</span>
              </p>
            )}
          </div>

          <Link
            href="/support"
            className="text-xs md:text-sm text-slate-500 hover:text-slate-700 underline"
          >
            ← Back to Support Center
          </Link>
        </div>

        {/* Chat container */}
        <div className="flex-1 bg-white rounded-xl shadow-md border border-slate-200 flex flex-col overflow-hidden">
          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-5 space-y-3">
            {messages.map((msg) => {
              if (msg.from === 'system') {
                return (
                  <div
                    key={msg.id}
                    className="flex justify-center"
                  >
                    <div className="max-w-xl text-xs md:text-sm text-slate-600 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-center whitespace-pre-wrap">
                      {msg.text}
                    </div>
                  </div>
                );
              }

              const isUser = msg.from === 'user';
              const alignment = isUser ? 'justify-end' : 'justify-start';
              const bubbleColor = isUser
                ? 'bg-[#FF7043] text-white'
                : 'bg-slate-100 text-slate-900';
              const bubbleAlign = isUser ? 'items-end' : 'items-start';

              return (
                <div
                  key={msg.id}
                  className={`flex ${alignment}`}
                >
                  <div
                    className={`flex flex-col max-w-[80%] ${bubbleAlign}`}
                  >
                    {!isUser && (
                      <div className="flex items-center gap-2 mb-1">
                        <div className="h-7 w-7 rounded-full bg-[#FF7043] text-white flex items-center justify-center text-xs font-semibold">
                          {msg.personaName
                            ? msg.personaName.charAt(0)
                            : 'S'}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-slate-800">
                            {msg.personaName || 'Support'}
                          </span>
                          {msg.personaRole && (
                            <span className="text-[10px] text-slate-500">
                              {msg.personaRole}
                            </span>
                          )}
                          {msg.intent && (
                            <span className="text-[10px] uppercase tracking-wide text-slate-500">
                              {intentLabel(msg.intent)}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div
                      className={`rounded-2xl px-3 py-2 text-xs md:text-sm whitespace-pre-wrap leading-relaxed ${bubbleColor}`}
                    >
                      {msg.text}
                    </div>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" />
                  <span>Support is typing…</span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Error bar */}
          {error && (
            <div className="px-4 py-2 bg-red-50 text-xs md:text-sm text-red-700 border-t border-red-200">
              {error}
            </div>
          )}

          {/* Input area */}
          <div className="border-t border-slate-200 bg-slate-50 px-3 py-3 md:px-4 md:py-3">
            <div className="flex items-end gap-2">
              <textarea
                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm md:text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF7043] focus:border-transparent resize-none max-h-32"
                rows={2}
                placeholder="Type your message here. You can ask about technical problems, billing questions, recruiter tools, or how you're feeling about your job search."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="inline-flex items-center justify-center rounded-lg bg-[#FF7043] text-white text-sm md:text-base font-medium px-4 py-2 h-10 md:h-11 shadow hover:bg-[#ff8a65] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending…' : 'Send'}
              </button>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Please don’t share passwords or sensitive financial details. Our support personas are here to help, but they can’t see private account numbers.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
