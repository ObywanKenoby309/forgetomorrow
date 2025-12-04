// pages/support/ticket/[id].js
import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import Footer from '../../../components/Footer';

export default function SupportTicketDetail({ ticket, comments: initialComments }) {
  if (!ticket) {
    return (
      <>
        <Head>
          <title>Ticket not found – ForgeTomorrow Support</title>
        </Head>
        <main className="max-w-3xl mx-auto p-6 min-h-[80vh] flex flex-col justify-center items-center bg-[#ECEFF1] text-[#212121] pt-20">
          <h1 className="text-2xl font-bold text-[#FF7043] mb-2">
            Ticket not found
          </h1>
          <p className="text-sm text-slate-600 mb-4">
            We couldn&apos;t find that support ticket. It may have been removed or the ID is incorrect.
          </p>
          <Link
            href="/support"
            className="text-sm text-[#FF7043] underline"
          >
            ← Back to Support Center
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  const [comments, setComments] = useState(initialComments || []);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const statusBadgeClasses = (status) => {
    if (!status) return 'bg-slate-100 text-slate-700';
    const s = status.toUpperCase();
    if (s === 'OPEN') return 'bg-red-50 text-red-700';
    if (s === 'IN_PROGRESS') return 'bg-amber-50 text-amber-700';
    if (s === 'AWAITING_USER') return 'bg-blue-50 text-blue-700';
    if (s === 'RESOLVED') return 'bg-emerald-50 text-emerald-700';
    if (s === 'CLOSED') return 'bg-slate-100 text-slate-700';
    return 'bg-slate-100 text-slate-700';
  };

  const intentLabel = (intent) => {
    if (!intent) return 'General';
    switch (intent) {
      case 'technical':
        return 'Technical';
      case 'billing':
        return 'Billing';
      case 'recruiter':
        return 'Recruiter';
      case 'emotional':
        return 'Mindset';
      case 'general':
      default:
        return 'General';
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch {
      return iso;
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    const trimmed = newComment.trim();
    if (!trimmed) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/support/tickets/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: ticket.id,
          body: trimmed,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to add note');
      }

      const data = await res.json().catch(() => null);
      const created = data?.comment;

      if (created) {
        setComments((prev) => [...prev, created]);
        setNewComment('');
      }
    } catch (err) {
      console.error('Error adding internal note:', err);
      setError(err.message || 'Unable to add note.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>{ticket.subject} – ForgeTomorrow Support Ticket</title>
      </Head>

      <main className="max-w-3xl mx-auto p-6 space-y-8 min-h-[80vh] bg-[#ECEFF1] text-[#212121] pt-20">
        {/* Header */}
        <section
          style={{
            background: 'white',
            borderRadius: 12,
            padding: 16,
            border: '1px solid #eee',
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1
                style={{
                  margin: 0,
                  color: '#FF7043',
                  fontSize: 24,
                  fontWeight: 800,
                }}
              >
                Support Ticket
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Ticket ID: <span className="font-mono text-xs">{ticket.id}</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Created: {formatDate(ticket.createdAt)} · Last updated: {formatDate(ticket.updatedAt)}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClasses(
                  ticket.status
                )}`}
              >
                {ticket.status || 'OPEN'}
              </span>
              <Link
                href="/support"
                className="text-xs text-[#FF7043] underline"
              >
                ← Back to Support Center
              </Link>
            </div>
          </div>
        </section>

        {/* Details card */}
        <section className="bg-white rounded-lg shadow p-6 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-1">
              Subject
            </h2>
            <p className="text-base font-medium text-slate-900">
              {ticket.subject}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                Intent
              </h3>
              <p className="text-slate-800">{intentLabel(ticket.intent)}</p>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                Persona
              </h3>
              <p className="text-slate-800">
                {ticket.personaId ? ticket.personaId : '—'}
              </p>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                Source
              </h3>
              <p className="text-slate-800">
                {ticket.source || 'support-chat'}
              </p>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                User
              </h3>
              <p className="text-slate-800">
                {ticket.userEmail || ticket.userId || '—'}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">
              Initial Message
            </h2>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <p className="text-sm text-slate-800 whitespace-pre-wrap">
                {ticket.initialMessage}
              </p>
            </div>
          </div>

          {/* Internal notes */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                Internal Notes (agents only)
              </h2>
            </div>

            {comments.length === 0 ? (
              <p className="text-xs text-slate-500">
                No internal notes yet. Use the form below to leave a quick note about actions taken, findings, or escalation context.
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto border border-slate-100 rounded-md p-2 bg-slate-50">
                {comments.map((c) => (
                  <div
                    key={c.id}
                    className="text-xs bg-white border border-slate-200 rounded px-2 py-1.5 mb-1"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-700">
                        {c.authorEmail || 'Agent'}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {formatDate(c.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-800 whitespace-pre-wrap">
                      {c.body}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleAddComment} className="space-y-2 mt-2">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                Add internal note
              </label>
              <textarea
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF7043] focus:border-transparent resize-vertical min-h-[60px]"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Summarize what you found, what you changed, or what needs follow-up. This is only visible to the support team."
              />
              {error && (
                <p className="text-xs text-red-600">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={submitting || !newComment.trim()}
                className="inline-flex items-center justify-center rounded-md bg-[#FF7043] text-white text-xs font-semibold px-3 py-1.5 shadow hover:bg-[#ff8a65] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? 'Saving…' : 'Add Note'}
              </button>
            </form>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export async function getServerSideProps(context) {
  const { id } = context.params || {};

  if (!id || typeof id !== 'string') {
    return { notFound: true };
  }

  try {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return { notFound: true };
    }

    // Load internal notes (comments) for this ticket
    const comments = await prisma.supportTicketComment.findMany({
      where: { ticketId: id },
      orderBy: { createdAt: 'asc' },
    });

    return {
      props: {
        ticket: {
          id: ticket.id,
          subject: ticket.subject,
          initialMessage: ticket.initialMessage,
          status: ticket.status,
          intent: ticket.intent,
          personaId: ticket.personaId,
          source: ticket.source,
          userId: ticket.userId,
          userEmail: ticket.userEmail,
          createdAt: ticket.createdAt.toISOString(),
          updatedAt: ticket.updatedAt.toISOString(),
        },
        comments: comments.map((c) => ({
          id: c.id,
          body: c.body,
          isInternal: c.isInternal,
          authorId: c.authorId,
          authorEmail: c.authorEmail,
          createdAt: c.createdAt.toISOString(),
        })),
      },
    };
  } catch (err) {
    console.error('Error loading support ticket detail:', err);
    return { notFound: true };
  }
}
