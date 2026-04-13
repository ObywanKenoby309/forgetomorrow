// components/spotlights/SpotlightCardUI.js
//
// Shared UI for both:
//   - pages/hearth/spotlights/index.js  (standalone)
//   - pages/the-hearth.js               (inline MentorshipModule)
//
// CTAs follow the existing MemberActions architecture:
//   Profile  → router.push(`/profile/${userSlug}`)
//   Book     → router.push(`/profile/${userSlug}?action=book&offeringId=${id}`)
//   Connect  → POST /api/contacts/request { toUserId }  (same as MemberActions.sendConnect)
//
// Owner view:
//   If the logged-in user owns the spotlight, show Edit instead of Profile / Book / Connect.
//
// Avatar: prefers userAvatarUrl, falls back to first letter of name.
// No direct messaging. No coach-specific routes. No /coach/[id].

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import RequestAppointmentModal from '@/components/spotlights/RequestAppointmentModal';

export const WHITE_CARD = {
  background: 'rgba(255,255,255,0.92)',
  border: '0.5px solid rgba(0,0,0,0.08)',
  borderRadius: 12,
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  boxSizing: 'border-box',
};

// ─── Availability badge ───────────────────────────────────────────────────────
export function AvailBadge({ value, large }) {
  const styles = {
    'Open to discuss': { background: '#E8F5E9', color: '#2E7D32' },
    'Limited slots': { background: '#FFF8E1', color: '#F57F17' },
    'Waitlist': { background: '#FDECEA', color: '#C62828' },
  };
  const s = styles[value] || styles['Open to discuss'];
  return (
    <span
      style={{
        fontSize: large ? 12 : 10,
        padding: large ? '4px 10px' : '2px 7px',
        borderRadius: 20,
        fontWeight: 700,
        whiteSpace: 'nowrap',
        ...s,
      }}
    >
      {value || 'Open to discuss'}
    </span>
  );
}

// ─── Stars ────────────────────────────────────────────────────────────────────
export function Stars({ value, size = 11 }) {
  const n = Math.round(value || 0);
  return (
    <span style={{ color: '#FF7043', fontSize: size, letterSpacing: 1 }}>
      {'★'.repeat(n)}
      {'☆'.repeat(5 - n)}
    </span>
  );
}

// ─── Avatar — prefers avatarUrl, falls back to initial ───────────────────────
export function Avatar({ name, avatarUrl, size = 44 }) {
  const initial = (name || '?')[0].toUpperCase();

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name || 'Mentor'}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: '#FAECE7',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.35,
        fontWeight: 900,
        color: '#993C1D',
        flexShrink: 0,
      }}
    >
      {initial}
    </div>
  );
}

// ─── Logged-in user helper ────────────────────────────────────────────────────
function useCurrentUserId() {
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadCurrentUser() {
      try {
        const res = await fetch('/api/auth/me', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) return;

        const data = await res.json();
        if (!active) return;

        const userId = data?.user?.id || null;
        setCurrentUserId(userId);
      } catch (err) {
        console.warn('[SpotlightCardUI] unable to load current user', err);
      }
    }

    loadCurrentUser();
    return () => {
      active = false;
    };
  }, []);

  return currentUserId;
}

// ─── Connect action — mirrors MemberActions.sendConnect exactly ───────────────
async function sendConnect(userId) {
  if (!userId) return;
  try {
    const res = await fetch('/api/contacts/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toUserId: userId }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data?.error || 'We could not send your connection request.');
    }
    if (data?.alreadyConnected) {
      alert('You are already connected with this member.');
      return;
    }
    if (data?.alreadyRequested && data?.status === 'PENDING') {
      alert('You already have a pending connection request with this member.');
      return;
    }
    if (data?.status === 'PENDING') {
      alert(data?.reopened ? 'Connection request re-sent.' : 'Connection request sent.');
      return;
    }
    alert('Connection request sent.');
  } catch (err) {
    console.error('[SpotlightCardUI] connect error:', err);
    alert('We could not send your connection request. Please try again.');
  }
}

// ─── List card ────────────────────────────────────────────────────────────────
export function SpotlightCard({ spotlight, selected, onSelect }) {
  const router = useRouter();
  const currentUserId = useCurrentUserId();

  const [connecting, setConnecting] = useState(false);
  const [showBook, setShowBook] = useState(false);

  const {
    id,
    name,
    headline,
    hook,
    summary,
    specialties,
    rate,
    availability,
    csat,
    userId,
    userSlug,
    userAvatarUrl,
  } = spotlight;

  const isOwner = Boolean(currentUserId) && currentUserId === userId;
  const displayHook = hook || headline || '';
  const tags = Array.isArray(specialties) ? specialties.slice(0, 3) : [];

  async function handleConnect(e) {
    e.stopPropagation();
    setConnecting(true);
    await sendConnect(userId);
    setConnecting(false);
  }

  function handleProfile(e) {
    e.stopPropagation();
    const slug = (userSlug || '').trim();
    const dest = slug
      ? `/profile/${slug}`
      : userId
      ? `/member-profile?userId=${userId}`
      : null;
    if (dest) router.push(dest);
  }

  function handleBook(e) {
    e.stopPropagation();
    setShowBook(true);
  }

  function handleEdit(e) {
    e.stopPropagation();
    router.push('/resources/mentors/spotlight/edit');
  }

  return (
    <>
      {showBook && !isOwner && (
        <RequestAppointmentModal spotlight={spotlight} onClose={() => setShowBook(false)} />
      )}

      <div
        onClick={() => onSelect(spotlight)}
        style={{
          ...WHITE_CARD,
          padding: '12px 14px',
          cursor: 'pointer',
          border: selected ? '2px solid #FF7043' : '0.5px solid rgba(0,0,0,0.08)',
          transition: 'box-shadow 0.15s, transform 0.1s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = WHITE_CARD.boxShadow;
          e.currentTarget.style.transform = 'none';
        }}
      >
        {/* Avatar + hook + name */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 6 }}>
          <Avatar name={name} avatarUrl={userAvatarUrl} size={36} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 900, fontSize: 13, color: '#112033', lineHeight: 1.25 }}>
              {displayHook}
            </div>
            <div style={{ fontSize: 11, color: '#90A4AE', marginTop: 1 }}>{name}</div>
          </div>
        </div>

        {/* Summary */}
        {summary && (
          <div style={{ fontSize: 12, color: '#546E7A', lineHeight: 1.5, marginBottom: 8 }}>
            {summary.length > 120 ? `${summary.slice(0, 120)}…` : summary}
          </div>
        )}

        {/* Specialty tags */}
        {tags.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
            {tags.map((t) => (
              <span
                key={t}
                style={{
                  fontSize: 10,
                  padding: '2px 7px',
                  borderRadius: 20,
                  background: 'rgba(255,112,67,0.08)',
                  color: '#993C1D',
                  fontWeight: 500,
                  opacity: 0.85,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Signals + CTAs */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <AvailBadge value={availability} />
            {csat?.overall != null && (
              <span
                style={{
                  fontSize: 11,
                  color: '#607D8B',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <span style={{ color: '#FF7043' }}>★</span>
                {csat.overall} · {csat.sessions} sessions
              </span>
            )}
            {rate && <span style={{ fontSize: 11, color: '#90A4AE' }}>{rate}</span>}
          </div>

          <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
            {isOwner ? (
              <button onClick={handleEdit} style={btnSolid}>
                Edit
              </button>
            ) : (
              <>
                <button onClick={handleProfile} style={btnOutline}>
                  Profile
                </button>
                <button onClick={handleBook} style={btnOutline}>
                  Book
                </button>
                <button
                  onClick={handleConnect}
                  disabled={connecting}
                  style={{ ...btnSolid, opacity: connecting ? 0.7 : 1 }}
                >
                  {connecting ? '…' : 'Connect'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────
export function SpotlightDetail({ spotlight }) {
  const router = useRouter();
  const currentUserId = useCurrentUserId();

  const [showAll, setShowAll] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [showBook, setShowBook] = useState(false);

  const {
    id,
    name,
    headline,
    hook,
    summary,
    whyICoach,
    specialties,
    rate,
    availability,
    csat,
    userId,
    userSlug,
    userAvatarUrl,
  } = spotlight;

  const isOwner = Boolean(currentUserId) && currentUserId === userId;
  const tags = Array.isArray(specialties) ? specialties : [];
  const visibleTags = showAll ? tags : tags.slice(0, 3);
  const extraCount = tags.length - 3;

  async function handleConnect() {
    setConnecting(true);
    await sendConnect(userId);
    setConnecting(false);
  }

  function handleEdit() {
    router.push('/resources/mentors/spotlight/edit');
  }

  return (
    <div style={{ ...WHITE_CARD, padding: '18px 20px', display: 'grid', gap: 14 }}>
      {/* Header with avatar */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <Avatar name={name} avatarUrl={userAvatarUrl} size={46} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 900, fontSize: 16, color: '#112033', lineHeight: 1.2 }}>
            {hook || headline || 'Mentor'}
          </div>
          <div style={{ fontSize: 12, color: '#90A4AE', marginTop: 2 }}>{name}</div>
          <div style={{ marginTop: 5 }}>
            <AvailBadge value={availability} large />
          </div>
        </div>
      </div>

      {/* CSAT strip */}
      {csat?.overall != null && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8 }}>
            {[
              { label: 'Satisfaction', val: csat.satisfaction },
              { label: 'Timeliness', val: csat.timeliness },
              { label: 'Quality', val: csat.quality },
            ].map((m) => (
              <div
                key={m.label}
                style={{
                  background: 'rgba(0,0,0,0.03)',
                  borderRadius: 8,
                  padding: '8px 10px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: '#90A4AE',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: 3,
                  }}
                >
                  {m.label}
                </div>
                <div style={{ fontSize: 17, fontWeight: 900, color: '#112033' }}>
                  {m.val != null ? m.val : '—'}
                </div>
                {m.val != null && <Stars value={m.val} size={10} />}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: '#90A4AE', textAlign: 'center', marginTop: -6 }}>
            Based on {csat.sessions} {csat.sessions === 1 ? 'session' : 'sessions'}
          </div>
        </>
      )}

      {/* Why I coach */}
      {whyICoach && (
        <div
          style={{
            background: 'rgba(255,112,67,0.06)',
            borderLeft: '3px solid #FF7043',
            borderRadius: '0 8px 8px 0',
            padding: '10px 13px',
            fontSize: 12,
            color: '#455A64',
            lineHeight: 1.65,
            fontStyle: 'italic',
          }}
        >
          "{whyICoach}"
        </div>
      )}

      {/* Summary */}
      {summary && (
        <p style={{ margin: 0, fontSize: 13, color: '#546E7A', lineHeight: 1.6 }}>{summary}</p>
      )}

      {/* Specialties */}
      {tags.length > 0 && (
        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#90A4AE',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 7,
            }}
          >
            Specialties
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {visibleTags.map((t) => (
              <span
                key={t}
                style={{
                  fontSize: 11,
                  padding: '3px 10px',
                  borderRadius: 20,
                  background: 'rgba(255,112,67,0.08)',
                  color: '#993C1D',
                  fontWeight: 500,
                }}
              >
                {t}
              </span>
            ))}
          </div>
          {tags.length > 3 && (
            <button
              onClick={() => setShowAll((p) => !p)}
              style={{
                fontSize: 11,
                color: '#FF7043',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                marginTop: 5,
                padding: 0,
                fontWeight: 600,
              }}
            >
              {showAll ? '− show less' : `+ ${extraCount} more`}
            </button>
          )}
        </div>
      )}

      {/* Meta */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {rate && (
          <div style={{ fontSize: 12, color: '#455A64' }}>
            <span style={{ color: '#90A4AE', fontWeight: 700 }}>Rate </span>
            {rate}
          </div>
        )}
        {csat?.sessions > 0 && (
          <div style={{ fontSize: 12, color: '#455A64' }}>
            <span style={{ color: '#90A4AE', fontWeight: 700 }}>Sessions </span>
            {csat.sessions} completed
          </div>
        )}
      </div>

      <hr style={{ border: 'none', borderTop: '0.5px solid rgba(0,0,0,0.06)' }} />

      {/* CTAs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isOwner ? '1fr' : '1fr 1fr 1fr',
          gap: 8,
        }}
      >
        {isOwner ? (
          <button onClick={handleEdit} style={detailBtnSolid}>
            Edit Your Spotlight
          </button>
        ) : (
          <>
            <button
              onClick={() => {
                const slug = (userSlug || '').trim();
                const dest = slug
                  ? `/profile/${slug}`
                  : userId
                  ? `/member-profile?userId=${userId}`
                  : null;
                if (dest) router.push(dest);
              }}
              style={detailBtnOutline}
            >
              Profile
            </button>
            <button onClick={() => setShowBook(true)} style={detailBtnOutline}>
              Book
            </button>
            <button
              onClick={handleConnect}
              disabled={connecting}
              style={{ ...detailBtnSolid, opacity: connecting ? 0.7 : 1 }}
            >
              {connecting ? 'Sending…' : 'Connect'}
            </button>
          </>
        )}
      </div>

      {showBook && !isOwner && (
        <RequestAppointmentModal spotlight={spotlight} onClose={() => setShowBook(false)} />
      )}
    </div>
  );
}

// ─── Button styles ────────────────────────────────────────────────────────────
const btnOutline = {
  background: 'white',
  color: '#FF7043',
  border: '0.5px solid #FF7043',
  borderRadius: 6,
  padding: '4px 9px',
  fontSize: 11,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
  whiteSpace: 'nowrap',
};

const btnSolid = {
  background: '#FF7043',
  color: 'white',
  border: 'none',
  borderRadius: 6,
  padding: '4px 9px',
  fontSize: 11,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
  whiteSpace: 'nowrap',
};

const detailBtnOutline = {
  background: 'white',
  color: '#FF7043',
  border: '1px solid #FF7043',
  borderRadius: 8,
  padding: '10px 0',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
  textAlign: 'center',
};

const detailBtnSolid = {
  background: '#FF7043',
  color: 'white',
  border: 'none',
  borderRadius: 8,
  padding: '10px 0',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
  textAlign: 'center',
};