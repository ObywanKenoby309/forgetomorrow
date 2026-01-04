// pages/support.js (or pages/support/index.js)
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import SeekerRightColumn from '@/components/seeker/SeekerRightColumn';

const UI = { CARD_PAD: 14 };

// ✅ Profile-standard glass (canonical)
const GLASS = {
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.58)',
  boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};

function SupportHeaderBox({ chrome }) {
  const mode = String(chrome || '').toLowerCase();

  const isRecruiter = mode.startsWith('recruiter');
  const isCoach = mode === 'coach';

  let title = 'Support Center';
  let subtitle =
    'We take your experience seriously. If you have questions, feedback, or need assistance, you’re in the right place. Our dedicated team is here to help you succeed every step of the way.';

  if (isRecruiter) {
    title = 'Recruiter Support Center';
    subtitle =
      'Running searches, posting jobs, managing pipelines, or reviewing candidates — if something isn’t working the way you expect, we’re here to help your hiring run smoother and faster.';
  } else if (isCoach) {
    title = 'Coach Support Center';
    subtitle =
      'Whether you’re supporting clients, building programs, or using coaching tools, this is your home base for questions, feedback, and help staying focused on your clients.';
  }

  // ✅ Same glass treatment as Profile header card
  return (
    <section className="px-4 pt-1 md:pt-2">
      <div
        style={{
          borderRadius: 14,
          padding: UI.CARD_PAD,
          textAlign: 'center',
          ...GLASS,
          maxWidth: 896, // ~ max-w-4xl
          margin: '0 auto',
        }}
      >
        <h1 style={{ margin: 0, color: '#FF7043', fontSize: 22, fontWeight: 900 }}>
          {title}
        </h1>
        <p
          style={{
            margin: '6px auto 0',
            color: '#455A64',
            maxWidth: 760,
            fontWeight: 600,
          }}
        >
          {subtitle}
        </p>
      </div>
    </section>
  );
}

const STATUS_OPTIONS = ['OPEN', 'IN_PROGRESS', 'AWAITING_USER', 'RESOLVED', 'CLOSED'];

export default function Support() {
  const router = useRouter();
  const chrome = String(router.query.chrome || '').toLowerCase();
  const withChrome = (path) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [ticketError, setTicketError] = useState(null);
  const [updatingTicketId, setUpdatingTicketId] = useState(null);

  useEffect(() => {
    let isCancelled = false;

    async function fetchTickets() {
      try {
        setLoadingTickets(true);
        setTicketError(null);

        const res = await fetch('/api/support/tickets');
        if (!res.ok) {
          throw new Error('Failed to load tickets');
        }

        const data = await res.json().catch(() => ({}));
        if (!isCancelled) {
          setTickets(data.tickets || []);
        }
      } catch (err) {
        console.error('Error loading tickets:', err);
        if (!isCancelled) {
          setTicketError(err.message || 'Unable to load tickets.');
        }
      } finally {
        if (!isCancelled) {
          setLoadingTickets(false);
        }
      }
    }

    fetchTickets();

    return () => {
      isCancelled = true;
    };
  }, []);

  const formatDate = (iso) => {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch {
      return iso;
    }
  };

  const ageLabel = (iso) => {
    if (!iso) return '-';
    try {
      const created = new Date(iso);
      const now = new Date();
      let diffMs = now.getTime() - created.getTime();
      if (diffMs < 0) diffMs = 0;

      const diffMinutes = Math.floor(diffMs / 60000);
      if (diffMinutes < 60) return `${diffMinutes}m`;

      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 48) return `${diffHours}h`;

      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d`;
    } catch {
      return '-';
    }
  };

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

  const handleStatusUpdate = async (ticketId, newStatus) => {
    if (!ticketId || !newStatus) return;

    setUpdatingTicketId(ticketId);
    setTicketError(null);

    try {
      const res = await fetch('/api/support/tickets/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ticketId, status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update ticket status');
      }

      const data = await res.json().catch(() => null);
      const updated = data?.ticket;

      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId
            ? {
                ...t,
                status: updated?.status || newStatus,
                updatedAt: updated?.updatedAt || t.updatedAt,
              }
            : t
        )
      );
    } catch (err) {
      console.error('Error updating ticket status:', err);
      setTicketError(err.message || 'Unable to update ticket status.');
    } finally {
      setUpdatingTicketId(null);
    }
  };

  return (
    <SeekerLayout
      title="ForgeTomorrow – Support"
      header={<SupportHeaderBox chrome={chrome} />}
      right={<SeekerRightColumn variant="support" />}
      activeNav="support"
    >
      <div className="max-w-4xl mx-auto p-6 space-y-10">
        {/* MAIN CONTENT CARD (glass) */}
        <section
          style={{
            borderRadius: 14,
            padding: 18,
            ...GLASS,
          }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                title: 'Chat with Support',
                desc: 'Start a live conversation with our support personas about your job search, billing, or technical issues.',
                href: '/support/chat',
              },
              {
                title: 'FAQs',
                desc: 'Find answers to common questions about using ForgeTomorrow.',
                alertMsg: 'FAQs coming soon!',
              },
              {
                title: 'Contact Us',
                desc: (
                  <>
                    Need personalized support? Email us anytime at{' '}
                    <a href="mailto:support@forgetomorrow.com" className="text-[#FF7043] underline">
                      support@forgetomorrow.com
                    </a>
                    .
                  </>
                ),
                alertMsg: 'Contact Us feature coming soon!',
              },
              {
                title: 'Tutorials & Guides',
                desc: 'Step-by-step instructions and video tutorials to get the most from ForgeTomorrow.',
                alertMsg: 'Tutorials & Guides coming soon!',
              },
              {
                title: 'Community Forum',
                desc: 'Connect with other users to share tips, ideas, and best practices.',
                alertMsg: 'Community Forum coming soon!',
              },
            ].map(({ title, desc, alertMsg, href }) => {
              // ✅ Tile glass (slightly stronger than base so text pops, but still wallpaper-breathing)
              const tileStyle = {
                borderRadius: 14,
                padding: 16,
                border: '1px solid rgba(255,255,255,0.22)',
                background: 'rgba(255,255,255,0.72)',
                boxShadow: '0 10px 22px rgba(0,0,0,0.10)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                transition: 'box-shadow 150ms ease, transform 150ms ease',
              };

              const tileClass =
                'hover:shadow-lg hover:-translate-y-[1px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FF7043] focus:ring-offset-2 focus:ring-offset-white';

              if (href) {
                return (
                  <Link
                    key={title}
                    href={withChrome(href)}
                    className={tileClass}
                    style={tileStyle}
                    aria-label={title}
                  >
                    <h2 className="text-2xl font-semibold text-[#FF7043] mb-3">{title}</h2>
                    <p className="text-slate-700">{desc}</p>
                  </Link>
                );
              }

              return (
                <div
                  key={title}
                  style={tileStyle}
                  className={tileClass}
                  role="button"
                  tabIndex={0}
                  onClick={() => alert(alertMsg)}
                  onKeyPress={(e) => e.key === 'Enter' && alert(alertMsg)}
                  aria-label={title}
                >
                  <h2 className="text-2xl font-semibold text-[#FF7043] mb-3">{title}</h2>
                  <p className="text-slate-700">{desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* RECENT TICKETS (glass) */}
        <section
          style={{
            borderRadius: 14,
            padding: 14,
            ...GLASS,
          }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[#FF7043]">Recent Support Tickets</h2>
              <p className="text-sm text-slate-700">
                Tickets created from your Support Chat and other channels. Agents can update status as they work cases.
              </p>
            </div>
          </div>

          {loadingTickets && <p className="text-sm text-slate-600">Loading tickets…</p>}

          {ticketError && !loadingTickets && <p className="text-sm text-red-600">{ticketError}</p>}

          {!loadingTickets && !ticketError && tickets.length === 0 && (
            <p className="text-sm text-slate-700">
              No tickets yet. Start a conversation in{' '}
              <Link href={withChrome('/support/chat')} className="text-[#FF7043] underline">
                Support Chat
              </Link>{' '}
              and we’ll track it here.
            </p>
          )}

          {!loadingTickets && !ticketError && tickets.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border-t border-slate-200">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-600">
                    <th className="py-2 pr-3">Subject</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Intent</th>
                    <th className="py-2 px-3">Persona</th>
                    <th className="py-2 px-3">Source</th>
                    <th className="py-2 px-3">Created</th>
                    <th className="py-2 pl-3">Age</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.id} className="border-t border-slate-200">
                      <td className="py-2 pr-3 max-w-xs">
                        <Link
                          href={withChrome(`/support/ticket/${t.id}`)}
                          className="font-medium text-slate-800 hover:underline"
                        >
                          {t.subject}
                        </Link>
                      </td>
                      <td className="py-2 px-3 align-top">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${statusBadgeClasses(
                              t.status
                            )}`}
                          >
                            {t.status || 'OPEN'}
                          </span>
                          <select
                            className="mt-1 text-xs border border-slate-300 rounded px-2 py-1 bg-white"
                            value={t.status || 'OPEN'}
                            onChange={(e) => handleStatusUpdate(t.id, e.target.value)}
                            disabled={updatingTicketId === t.id}
                          >
                            {STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status}>
                                {status.replace('_', ' ')}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-xs text-slate-700 align-top">{intentLabel(t.intent)}</td>
                      <td className="py-2 px-3 text-xs text-slate-700 align-top">{t.personaId || '—'}</td>
                      <td className="py-2 px-3 text-xs text-slate-700 align-top">{t.source || 'support-chat'}</td>
                      <td className="py-2 px-3 text-xs text-slate-600 whitespace-nowrap align-top">
                        {formatDate(t.createdAt)}
                      </td>
                      <td className="py-2 pl-3 text-xs text-slate-700 whitespace-nowrap align-top">
                        {ageLabel(t.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </SeekerLayout>
  );
}
