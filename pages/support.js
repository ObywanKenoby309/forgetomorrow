// pages/support.js (or pages/support/index.js)
import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import SeekerRightColumn from '@/components/seeker/SeekerRightColumn';

function getChromeFromAsPath(asPath) {
  try {
    const s = String(asPath || '');
    if (!s.includes('chrome=')) return '';
    const qIndex = s.indexOf('?');
    if (qIndex === -1) return '';
    const query = s.slice(qIndex + 1);
    const params = new URLSearchParams(query);
    return String(params.get('chrome') || '').toLowerCase();
  } catch {
    return '';
  }
}

const UI = { CARD_PAD: 14 };

const GLASS = {
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.58)',
  boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};

const STATUS_OPTIONS = ['OPEN', 'IN_PROGRESS', 'AWAITING_USER', 'RESOLVED', 'CLOSED'];

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

  return (
    <section
      style={{
        ...GLASS,
        padding: '24px 16px',
        textAlign: 'center',
        margin: '0 auto',
        maxWidth: 1320,
      }}
      aria-label="Support Center overview"
    >
      <h1 style={{ color: '#FF7043', fontSize: 28, fontWeight: 900, margin: 0 }}>
        {title}
      </h1>
      <p
        style={{
          marginTop: 8,
          color: '#546E7A',
          fontSize: 14,
          fontWeight: 600,
          maxWidth: 860,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        {subtitle}
      </p>
    </section>
  );
}

function SupportIcon({ size = 64 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        background: 'rgba(255,112,67,0.10)',
        border: '1px solid rgba(255,112,67,0.20)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <svg width={size * 0.45} height={size * 0.45} viewBox="0 0 24 24" fill="none">
        <path
          d="M4 6.5C4 5.67 4.67 5 5.5 5h13c.83 0 1.5.67 1.5 1.5v8c0 .83-.67 1.5-1.5 1.5H10l-4 3v-3H5.5C4.67 16 4 15.33 4 14.5v-8Z"
          stroke="#FF7043"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

const SUPPORT_TILES = [
  {
    id: 'chat',
    title: 'Chat with Support',
    desc: 'Start a live conversation with our support personas about your job search, billing, or technical issues.',
    href: '/support/chat',
  },
  {
    id: 'faq',
    title: 'FAQs',
    desc: 'Find answers to common questions about using ForgeTomorrow.',
    alertMsg: 'FAQs coming soon!',
  },
  {
    id: 'contact',
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
    id: 'guides',
    title: 'Tutorials & Guides',
    desc: 'Step-by-step instructions and video tutorials to get the most from ForgeTomorrow.',
    alertMsg: 'Tutorials & Guides coming soon!',
  },
  {
    id: 'community',
    title: 'Community Forum',
    desc: 'Connect with other users to share tips, ideas, and best practices.',
    alertMsg: 'Community Forum coming soon!',
  },
];

function MobileSupportCard({ tile, withChrome }) {
  const isLink = !!tile.href;

  const cardStyle = {
    display: 'block',
    background: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: '22px 20px 20px',
    border: '1.5px solid rgba(255,112,67,0.15)',
    boxShadow: '0 12px 28px rgba(0,0,0,0.10)',
    textDecoration: 'none',
    position: 'relative',
    overflow: 'hidden',
    minHeight: 210,
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
    transition: 'border-color 200ms ease, box-shadow 200ms ease',
  };

  const inner = (
    <>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          right: -70,
          top: -70,
          width: 200,
          height: 200,
          background:
            'radial-gradient(circle, rgba(255,112,67,0.18), rgba(255,112,67,0.00) 70%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
        <SupportIcon size={64} />
        <h2
          style={{
            fontSize: 20,
            fontWeight: 900,
            margin: 0,
            color: '#FF7043',
            lineHeight: 1.1,
          }}
        >
          {tile.title}
        </h2>
      </div>

      <div style={{ color: '#37474F', margin: '0 0 14px', lineHeight: 1.55, fontSize: 15 }}>
        {tile.desc}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        <span
          style={{
            fontSize: 15,
            fontWeight: 900,
            color: '#FF7043',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {isLink ? 'Open' : 'View'}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M3 8H13M13 8L9 4M13 8L9 12"
              stroke="#FF7043"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
    </>
  );

  if (isLink) {
    return (
      <a href={withChrome(tile.href)} style={cardStyle}>
        {inner}
      </a>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => alert(tile.alertMsg)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          alert(tile.alertMsg);
        }
      }}
      style={cardStyle}
      aria-label={tile.title}
    >
      {inner}
    </div>
  );
}

function MobileSupport({ tiles, withChrome }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const trackRef = useRef(null);
  const programmatic = useRef(false);

  const goTo = useCallback(
    (index) => {
      setActiveIndex(index);
      setDropdownOpen(false);
      const track = trackRef.current;
      if (!track) return;
      programmatic.current = true;
      track.scrollTo({ left: index * track.offsetWidth, behavior: 'smooth' });
      setTimeout(() => {
        programmatic.current = false;
      }, 600);
    },
    []
  );

  const handleScroll = useCallback(() => {
    if (programmatic.current) return;
    const track = trackRef.current;
    if (!track) return;
    const index = Math.round(track.scrollLeft / track.offsetWidth);
    if (index >= 0 && index < tiles.length) setActiveIndex(index);
  }, [tiles.length]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    track.addEventListener('scroll', handleScroll, { passive: true });
    return () => track.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const active = tiles[activeIndex];

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ padding: '0 16px 14px', position: 'relative', zIndex: 20 }}>
        <button
          onClick={() => setDropdownOpen((o) => !o)}
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.95)',
            border: '1.5px solid rgba(255,112,67,0.35)',
            borderRadius: 12,
            padding: '13px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
            gap: 10,
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <SupportIcon size={28} />
            <span style={{ fontSize: 16, fontWeight: 800, color: '#FF7043' }}>
              {active.title}
            </span>
          </div>
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            style={{
              flexShrink: 0,
              transition: 'transform 200ms ease',
              transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          >
            <path
              d="M5 7.5L10 12.5L15 7.5"
              stroke="#FF7043"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {dropdownOpen && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% - 14px + 6px)',
              left: 16,
              right: 16,
              background: 'rgba(255,255,255,0.98)',
              border: '1.5px solid rgba(255,112,67,0.20)',
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: '0 20px 48px rgba(0,0,0,0.16)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
            }}
          >
            {tiles.map((tile, i) => (
              <button
                key={tile.id}
                onClick={() => goTo(i)}
                style={{
                  width: '100%',
                  background: i === activeIndex ? 'rgba(255,112,67,0.08)' : 'transparent',
                  border: 'none',
                  borderBottom: i < tiles.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none',
                  padding: '13px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <SupportIcon size={34} />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 800,
                      lineHeight: 1.2,
                      color: i === activeIndex ? '#FF7043' : '#37474F',
                    }}
                  >
                    {tile.title}
                  </div>
                  <div style={{ fontSize: 12, color: '#78909C', marginTop: 2 }}>
                    {tile.href ? 'Open option' : 'Preview option'}
                  </div>
                </div>
                {i === activeIndex && (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
                    <path
                      d="M4 9L7.5 12.5L14 6"
                      stroke="#FF7043"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div
        ref={trackRef}
        style={{
          display: 'flex',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {tiles.map((tile) => (
          <div
            key={tile.id}
            style={{
              flexShrink: 0,
              width: '100%',
              scrollSnapAlign: 'start',
              padding: '0 16px',
              boxSizing: 'border-box',
            }}
          >
            <MobileSupportCard tile={tile} withChrome={withChrome} />
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 8 }}>
        {tiles.map((tile, i) => (
          <button
            key={tile.id}
            onClick={() => goTo(i)}
            aria-label={`Go to ${tile.title}`}
            style={{
              width: i === activeIndex ? 24 : 8,
              height: 8,
              borderRadius: 999,
              background: i === activeIndex ? '#FF7043' : 'rgba(255,112,67,0.25)',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              transition: 'width 220ms ease, background 220ms ease',
            }}
          />
        ))}
      </div>
    </div>
  );
}

function DesktopSupportTile({ tile, withChrome }) {
  const tileStyle = {
    ...GLASS,
    padding: 16,
    display: 'grid',
    gap: 8,
    minHeight: 106,
  };

  const titleStyle = {
    margin: 0,
    color: '#37474F',
    fontSize: 16,
    fontWeight: 900,
  };

  const descStyle = {
    margin: 0,
    color: '#607D8B',
    fontSize: 13,
    lineHeight: 1.4,
  };

  const linkStyle = {
    color: '#FF7043',
    fontWeight: 800,
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    width: 'fit-content',
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
  };

  if (tile.href) {
    return (
      <div style={tileStyle}>
        <h2 style={titleStyle}>{tile.title}</h2>
        <div style={descStyle}>{tile.desc}</div>
        <a href={withChrome(tile.href)} style={linkStyle}>
          Open →
        </a>
      </div>
    );
  }

  return (
    <div style={tileStyle}>
      <h2 style={titleStyle}>{tile.title}</h2>
      <div style={descStyle}>{tile.desc}</div>
      <button
        onClick={() => alert(tile.alertMsg)}
        style={linkStyle}
      >
        Open →
      </button>
    </div>
  );
}

export default function Support() {
  const router = useRouter();

  const chrome =
    String(router.query.chrome || '').toLowerCase() ||
    getChromeFromAsPath(router.asPath);

  const withChrome = (path) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [ticketError, setTicketError] = useState(null);
  const [updatingTicketId, setUpdatingTicketId] = useState(null);

  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

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

  const HeaderBox = <SupportHeaderBox chrome={chrome} />;

  return (
    <SeekerLayout
      title="ForgeTomorrow – Support"
      header={HeaderBox}
      right={<SeekerRightColumn variant="support" />}
      activeNav="support"
    >
      <div
        style={{
          ...GLASS,
          paddingTop: 24,
          paddingBottom: 24,
          paddingLeft: isMobile ? 0 : 16,
          paddingRight: isMobile ? 0 : 16,
          width: '100%',
          overflow: isMobile ? 'hidden' : 'visible',
        }}
      >
        {isMobile && (
          <MobileSupport
            tiles={SUPPORT_TILES}
            withChrome={withChrome}
          />
        )}

        {!isMobile && (
          <div style={{ display: 'grid', gap: 12, width: '100%' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: 12,
              }}
            >
              {SUPPORT_TILES.map((tile) => (
                <DesktopSupportTile
                  key={tile.id}
                  tile={tile}
                  withChrome={withChrome}
                />
              ))}
            </div>
          </div>
        )}

        <section
          style={{
            ...GLASS,
            margin: isMobile ? '16px 16px 0' : '16px 0 0',
            padding: UI.CARD_PAD,
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
                      <td className="py-2 px-3 text-xs text-slate-700 align-top">
                        {intentLabel(t.intent)}
                      </td>
                      <td className="py-2 px-3 text-xs text-slate-700 align-top">
                        {t.personaId || '—'}
                      </td>
                      <td className="py-2 px-3 text-xs text-slate-700 align-top">
                        {t.source || 'support-chat'}
                      </td>
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