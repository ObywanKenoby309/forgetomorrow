// components/calendar/RecruiterCalendarEventForm.js
import React, { useEffect, useMemo, useRef, useState } from 'react';

const VIDEO_INVITEE_LIMIT = 5;

function normalizeContact(c) {
  const id = c?.contactUserId || c?.userId || c?.id;
  if (!id) return null;

  const name =
    c?.name ||
    [c?.firstName, c?.lastName].filter(Boolean).join(' ') ||
    c?.email ||
    'Unknown contact';

  return {
    id,
    name,
    email: c?.email || '',
    headline: c?.headline || c?.title || '',
    avatarUrl: c?.avatarUrl || null,
  };
}

function normalizeInitialInternalInvitees(initial) {
  if (Array.isArray(initial?.internalInvitees)) {
    return initial.internalInvitees
      .map(normalizeContact)
      .filter(Boolean);
  }

  if (Array.isArray(initial?.invitees)) {
    return initial.invitees
      .filter((i) => i?.userId || i?.id || i?.contactUserId)
      .map((i) =>
        normalizeContact({
          id: i.userId || i.id || i.contactUserId,
          name: i.name,
          email: i.email,
          headline: i.headline,
          avatarUrl: i.avatarUrl,
        })
      )
      .filter(Boolean);
  }

  if (initial?.candidateUserId) {
    return [
      {
        id: initial.candidateUserId,
        name: initial.candidateName || initial.candidate || 'Selected candidate',
        email: '',
        headline: '',
        avatarUrl: null,
      },
    ];
  }

  return [];
}

function normalizeInitialExternalInvitees(initial) {
  if (Array.isArray(initial?.externalInvitees)) {
    return initial.externalInvitees
      .map((i) => ({
        name: i?.name || i?.email || '',
        email: i?.email || '',
      }))
      .filter((i) => i.name || i.email);
  }

  if (Array.isArray(initial?.invitees)) {
    return initial.invitees
      .filter((i) => i?.email && !(i?.userId || i?.id || i?.contactUserId))
      .map((i) => ({
        name: i.name || i.email,
        email: i.email,
      }));
  }

  if (
    initial?.candidateType === 'external' &&
    (initial?.candidateName || initial?.candidate)
  ) {
    return [
      {
        name: initial.candidateName || initial.candidate,
        email: initial.candidateEmail || '',
      },
    ];
  }

  return [];
}

function buildScheduledAt(date, time) {
  return new Date(`${date}T${time || '09:00'}:00`).toISOString();
}

export default function RecruiterCalendarEventForm({
  mode = 'add', // 'add' | 'edit'
  initial = null, // { id?, title, date, time, candidateType, candidateUserId, candidateName, type, status, notes, scope/calendarScope, meetingMode/enableVideo }
  onClose,
  onSave,
  onDelete,
  typeChoices = [],
  statusChoices = [],
  saving = false,
}) {
  const firstRef = useRef(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [foundryScheduling, setFoundryScheduling] = useState(false);
  const busy = saving || foundryScheduling;

  const [internalInvitees, setInternalInvitees] = useState(() =>
    normalizeInitialInternalInvitees(initial)
  );
  const [externalInvitees, setExternalInvitees] = useState(() =>
    normalizeInitialExternalInvitees(initial)
  );
  const [externalName, setExternalName] = useState('');
  const [externalEmail, setExternalEmail] = useState('');

  // ───────────── Form state ─────────────
  const [form, setForm] = useState(() => {
    const today = new Date().toISOString().slice(0, 10);

    const candidateType =
      initial?.candidateType === 'external'
        ? 'external'
        : 'internal';

    const rawScope =
      initial?.calendarScope || initial?.scope;
    const calendarScope =
      rawScope === 'personal' || rawScope === 'team'
        ? rawScope
        : 'personal';

    const rawMeetingMode =
      initial?.meetingMode ||
      initial?.communicationMode ||
      (initial?.enableVideo ? 'audio_video' : null);

    const meetingMode =
      rawMeetingMode === 'audio_video' || rawMeetingMode === 'video'
        ? 'audio_video'
        : 'calendar_only';

    return {
      title: initial?.title || '',
      date: initial?.date || today,
      time: initial?.time || '09:00',
      candidateType,
      type: initial?.type || typeChoices[0] || 'Interview',
      status: initial?.status || statusChoices[0] || 'Scheduled',
      notes: initial?.notes || '',
      calendarScope, // 'team' | 'personal'
      meetingMode, // 'calendar_only' | 'audio_video'
    };
  });

  const update = (key, value) =>
    setForm((f) => ({
      ...f,
      [key]: value,
    }));

  const totalInvitees = internalInvitees.length + externalInvitees.length;
  const videoLimitActive = form.meetingMode === 'audio_video';
  const inviteeLimitReached = videoLimitActive && totalInvitees >= VIDEO_INVITEE_LIMIT;

  // ───────────── Contacts search / browse ─────────────
  const [candidateSearchTerm, setCandidateSearchTerm] = useState('');
  const [candidateResults, setCandidateResults] = useState([]);
  const [candidateSearchLoading, setCandidateSearchLoading] = useState(false);
  const [candidateSearchError, setCandidateSearchError] = useState('');
  const [candidateContacts, setCandidateContacts] = useState([]);
  const [candidateContactsLoading, setCandidateContactsLoading] = useState(false);
  const [candidateContactsError, setCandidateContactsError] = useState('');
  const [candidatePickerOpen, setCandidatePickerOpen] = useState(false);

  useEffect(() => {
    if (firstRef.current) firstRef.current.focus();
    const onEsc = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [onClose]);

  useEffect(() => {
    if (form.candidateType !== 'internal') return;
    if (!candidatePickerOpen && candidateContacts.length > 0) return;

    let active = true;

    async function loadContacts() {
      try {
        setCandidateContactsLoading(true);
        setCandidateContactsError('');

        const res = await fetch('/api/contacts/list');

        if (!res.ok) {
          if (!active) return;
          setCandidateContacts([]);
          setCandidateContactsError('Could not load contacts.');
          return;
        }

        const data = await res.json().catch(() => ({}));
        const rows = Array.isArray(data.contacts) ? data.contacts : [];
        const deduped = new Map();

        rows.forEach((c) => {
          const normalized = normalizeContact(c);
          if (!normalized || deduped.has(normalized.id)) return;
          deduped.set(normalized.id, normalized);
        });

        if (active) {
          setCandidateContacts(Array.from(deduped.values()));
        }
      } catch (err) {
        if (!active) return;
        console.error('Candidate contact list error', err);
        setCandidateContacts([]);
        setCandidateContactsError('Could not load contacts.');
      } finally {
        if (active) {
          setCandidateContactsLoading(false);
        }
      }
    }

    loadContacts();

    return () => {
      active = false;
    };
  }, [form.candidateType, candidatePickerOpen, candidateContacts.length]);

  useEffect(() => {
    if (form.candidateType !== 'internal') return;

    const term = candidateSearchTerm.trim();
    if (!term) {
      setCandidateResults([]);
      setCandidateSearchError('');
      return;
    }

    let active = true;
    const controller = new AbortController();

    async function run() {
      try {
        setCandidateSearchLoading(true);
        setCandidateSearchError('');

        const res = await fetch(
          `/api/contacts/search?q=${encodeURIComponent(term)}`,
          { signal: controller.signal }
        );

        if (!res.ok) {
          if (!active) return;
          console.error('Contacts search failed:', await res.text());
          setCandidateResults([]);
          setCandidateSearchError('Search failed. Try again.');
          return;
        }

        const data = await res.json().catch(() => ({}));
        let results = [];
        if (Array.isArray(data.contacts)) {
          results = data.contacts;
        } else if (Array.isArray(data.results)) {
          results = data.results;
        }

        if (active) {
          setCandidateResults(results.map(normalizeContact).filter(Boolean));
        }
      } catch (err) {
        if (!active) return;
        if (err.name === 'AbortError') return;
        console.error('Candidate search error', err);
        setCandidateResults([]);
        setCandidateSearchError('Search failed. Try again.');
      } finally {
        if (active) {
          setCandidateSearchLoading(false);
        }
      }
    }

    run();
    return () => {
      active = false;
      controller.abort();
    };
  }, [candidateSearchTerm, form.candidateType]);

  const selectedInternalIds = useMemo(
    () => new Set(internalInvitees.map((i) => i.id)),
    [internalInvitees]
  );

  const visibleCandidateContacts = useMemo(() => {
    const term = candidateSearchTerm.trim().toLowerCase();
    const merged = new Map();

    candidateContacts.forEach((c) => {
      if (c?.id) merged.set(c.id, c);
    });

    candidateResults.forEach((c) => {
      if (c?.id && !merged.has(c.id)) merged.set(c.id, c);
    });

    const base = Array.from(merged.values());

    if (!term) return base;

    return base.filter((c) => {
      const haystack = `${c.name || ''} ${c.email || ''} ${c.headline || ''}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [candidateContacts, candidateResults, candidateSearchTerm]);

  const addInternalInvitee = (contact) => {
    const normalized = normalizeContact(contact);
    if (!normalized) return;

    if (selectedInternalIds.has(normalized.id)) {
      setCandidateSearchTerm('');
      setCandidatePickerOpen(false);
      return;
    }

    if (inviteeLimitReached) {
      alert(`Audio/Video meetings are limited to ${VIDEO_INVITEE_LIMIT} invitees.`);
      return;
    }

    setInternalInvitees((prev) => [...prev, normalized]);
    setCandidateSearchTerm('');
    setCandidateSearchError('');
  };

  const removeInternalInvitee = (id) => {
    setInternalInvitees((prev) => prev.filter((i) => i.id !== id));
  };

  const addExternalInvitee = () => {
    const email = externalEmail.trim();
    const name = externalName.trim() || email;

    if (!name && !email) return;

    if (inviteeLimitReached) {
      alert(`Audio/Video meetings are limited to ${VIDEO_INVITEE_LIMIT} invitees.`);
      return;
    }

    if (email && externalInvitees.some((i) => i.email.toLowerCase() === email.toLowerCase())) {
      setExternalName('');
      setExternalEmail('');
      return;
    }

    setExternalInvitees((prev) => [...prev, { name, email }]);
    setExternalName('');
    setExternalEmail('');
  };

  const removeExternalInvitee = (index) => {
    setExternalInvitees((prev) => prev.filter((_, i) => i !== index));
  };


  const scheduleFoundryRoom = async ({ title, payloadInvitees }) => {
    const scheduledAt = buildScheduledAt(form.date, form.time);
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';

    const foundryInvitees = payloadInvitees.map((i) => {
      if (i.type === 'internal') {
        return {
          userId: i.userId,
          name: i.name,
        };
      }

      return {
        email: i.email,
        name: i.name || i.email,
      };
    });

    const res = await fetch('/api/foundry/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        scheduledAt,
        timezone,
        invitees: foundryInvitees,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || 'Could not schedule Foundry room.');
    }

    return {
      roomId: data.roomId,
      guestToken: data.guestToken,
      joinUrl: data.roomId ? `/foundry/${data.roomId}` : '',
      guestJoinUrl:
        data.roomId && data.guestToken
          ? `/foundry/join/${data.roomId}?code=${data.guestToken}`
          : '',
      scheduledAt,
      timezone,
    };
  };

  // ───────────── Styles ─────────────
  const label = {
    fontSize: 12,
    color: '#607D8B',
    marginBottom: 4,
    display: 'block',
  };

  const input = {
    border: '1px solid #DADCE0',
    borderRadius: 10,
    padding: '8px 10px',
    width: '100%',
    outline: 'none',
    background: '#FFFFFF',
    color: '#263238',
    fontSize: 14,
    boxSizing: 'border-box',
  };

  const calendarToggleButton = (active) => ({
    borderRadius: 999,
    border: active ? '1px solid #1A4B8F' : '1px solid #CFD8DC',
    background: active ? 'rgba(26,75,143,0.08)' : '#FFFFFF',
    color: active ? '#1A4B8F' : '#455A64',
    padding: '6px 12px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    minWidth: 70,
  });

  const meetingModeButton = (active) => ({
    borderRadius: 12,
    border: active ? '1px solid #FF7043' : '1px solid #CFD8DC',
    background: active ? 'rgba(255,112,67,0.09)' : '#FFFFFF',
    color: active ? '#C75B33' : '#455A64',
    padding: '10px 12px',
    fontSize: 13,
    fontWeight: 700,
    cursor: saving ? 'not-allowed' : 'pointer',
    textAlign: 'left',
    fontFamily: 'inherit',
    minHeight: 64,
    opacity: saving ? 0.72 : 1,
  });

  const meetingModeTitle = {
    display: 'block',
    fontSize: 13,
    fontWeight: 800,
    marginBottom: 2,
  };

  const meetingModeHelper = {
    display: 'block',
    fontSize: 11,
    color: '#78909C',
    lineHeight: 1.35,
    fontWeight: 500,
  };

  const sectionCard = {
    border: '1px solid #E5E7EB',
    borderRadius: 14,
    padding: 12,
    background: 'rgba(255,255,255,0.72)',
  };

  const contactPickerCard = {
    marginTop: 8,
    border: '1px solid #E5E7EB',
    borderRadius: 12,
    background: '#FFFFFF',
    maxHeight: 220,
    overflowY: 'auto',
    boxShadow: '0 10px 22px rgba(15,23,42,0.10)',
  };

  const contactPickerRow = (selected, disabled) => ({
    width: '100%',
    border: 'none',
    borderBottom: '1px solid #F3F4F6',
    background: selected ? 'rgba(255,112,67,0.08)' : '#FFFFFF',
    padding: '9px 10px',
    textAlign: 'left',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    opacity: disabled ? 0.55 : 1,
  });

  const contactPickerName = {
    fontWeight: 700,
    color: '#111827',
    fontSize: 13,
  };

  const contactPickerMeta = {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  };

  const browseButton = {
    border: '1px solid #CFD8DC',
    background: '#FFFFFF',
    color: '#455A64',
    borderRadius: 10,
    padding: '8px 10px',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 700,
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  };

  const chipWrap = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  };

  const chip = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    border: '1px solid rgba(255,112,67,0.22)',
    background: 'rgba(255,112,67,0.08)',
    color: '#C75B33',
    borderRadius: 999,
    padding: '5px 8px',
    fontSize: 12,
    fontWeight: 700,
  };

  const chipRemove = {
    border: 'none',
    background: 'transparent',
    color: '#C75B33',
    cursor: 'pointer',
    fontSize: 14,
    lineHeight: 1,
    padding: 0,
    fontFamily: 'inherit',
  };

  const helper = {
    fontSize: 11,
    color: videoLimitActive && totalInvitees >= VIDEO_INVITEE_LIMIT ? '#C75B33' : '#90A4AE',
    marginTop: 4,
    lineHeight: 1.45,
  };

  const addSmallButton = {
    border: '1px solid rgba(255,112,67,0.35)',
    background: 'rgba(255,112,67,0.08)',
    color: '#C75B33',
    borderRadius: 10,
    padding: '8px 10px',
    cursor: busy || inviteeLimitReached ? 'not-allowed' : 'pointer',
    fontSize: 12,
    fontWeight: 800,
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
    opacity: busy || inviteeLimitReached ? 0.55 : 1,
  };

  // ───────────── Submit ─────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    const title = (form.title || '').trim();
    if (!title) {
      alert('Title is required.');
      return;
    }
    if (!form.date || !form.time) {
      alert('Date and time are required.');
      return;
    }

    if (videoLimitActive && totalInvitees > VIDEO_INVITEE_LIMIT) {
      alert(`Audio/Video meetings are limited to ${VIDEO_INVITEE_LIMIT} invitees.`);
      return;
    }

    const primaryInternal = internalInvitees[0] || null;
    const primaryExternal = externalInvitees[0] || null;
    const primaryName = primaryInternal?.name || primaryExternal?.name || '';
    const primaryEmail = primaryExternal?.email || '';

    if (!primaryName && totalInvitees === 0) {
      alert('Please add at least one invitee.');
      return;
    }

    if (videoLimitActive && externalInvitees.some((i) => !i.email?.trim())) {
      alert('External guests need an email address for Audio/Video invites.');
      return;
    }

    const payloadInvitees = [
      ...internalInvitees.map((i) => ({
        type: 'internal',
        userId: i.id,
        name: i.name,
        email: i.email || '',
      })),
      ...externalInvitees.map((i) => ({
        type: 'external',
        name: i.name,
        email: i.email || '',
      })),
    ];

    let foundry = null;
    let finalNotes = form.notes || '';

    try {
      if (videoLimitActive) {
        setFoundryScheduling(true);
        foundry = await scheduleFoundryRoom({ title, payloadInvitees });
        const roomNote = `Foundry room: ${foundry.joinUrl}`;
        finalNotes = finalNotes.trim() ? `${finalNotes.trim()}

${roomNote}` : roomNote;
      }

      await onSave?.({
        ...form,
        title,
        notes: finalNotes,
        candidateType: primaryInternal ? 'internal' : 'external',
        candidateUserId: primaryInternal?.id || null,
        candidateName: primaryName,
        candidateEmail: primaryEmail,
        internalInvitees,
        externalInvitees,
        invitees: payloadInvitees,
        enableVideo: videoLimitActive,
        foundryRoomId: foundry?.roomId || null,
        foundryGuestToken: foundry?.guestToken || null,
        foundryJoinUrl: foundry?.joinUrl || null,
        foundryGuestJoinUrl: foundry?.guestJoinUrl || null,
        foundryScheduledAt: foundry?.scheduledAt || null,
        foundryTimezone: foundry?.timezone || null,
      });
    } catch (err) {
      console.error('Recruiter calendar VC scheduling error:', err);
      alert(err?.message || 'Could not schedule the Audio/Video meeting.');
    } finally {
      setFoundryScheduling(false);
    }
  };

  // ───────────── Render ─────────────
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.60)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: 'clamp(88px, 12vh, 128px)',
        paddingBottom: 40,
        paddingLeft: 16,
        paddingRight: 16,
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg,#FFFFFF,#F9FAFB)',
          borderRadius: 16,
          width: '100%',
          maxWidth: 700,
          maxHeight: 'calc(100vh - 150px)',
          overflowY: 'auto',
          boxShadow: '0 24px 60px rgba(15,23,42,0.55)',
          color: '#263238',
          border: '1px solid rgba(148,163,184,0.7)',
        }}
      >
        {/* Header with title + calendar toggle (Option 2 layout, Personal first) */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 20px',
            borderBottom: '1px solid #E5E7EB',
            gap: 16,
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                color: '#112033',
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              {mode === 'edit' ? 'Edit Calendar Item' : 'Add Calendar Item'}
            </h3>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 6,
            }}
          >
            <span
              style={{
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: '#90A4AE',
                fontWeight: 600,
              }}
            >
              Calendar
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => update('calendarScope', 'personal')}
                style={calendarToggleButton(form.calendarScope === 'personal')}
                disabled={busy}
              >
                Personal (only me)
              </button>
              <button
                type="button"
                onClick={() => update('calendarScope', 'team')}
                style={calendarToggleButton(form.calendarScope === 'team')}
                disabled={busy}
              >
                Team (shared)
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'grid',
            gap: 14,
            padding: '16px 20px 20px',
          }}
        >
          {/* Title */}
          <div>
            <label style={label}>
              Title <span style={{ color: '#EF6C00' }}>*</span>
            </label>
            <input
              ref={firstRef}
              type="text"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              style={input}
              placeholder="e.g., Phone Screen with Acme"
            />
          </div>

          {/* Meeting mode */}
          <div style={sectionCard}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                gap: 12,
                marginBottom: 8,
              }}
            >
              <div style={{ ...label, marginBottom: 0 }}>Meeting Mode</div>
              <div style={helper}>
                {videoLimitActive
                  ? `${totalInvitees}/${VIDEO_INVITEE_LIMIT} video invitees`
                  : 'No invitee limit for non-video calendar items'}
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 10,
              }}
            >
              <button
                type="button"
                onClick={() => update('meetingMode', 'calendar_only')}
                style={meetingModeButton(form.meetingMode === 'calendar_only')}
                disabled={busy}
              >
                <span style={meetingModeTitle}>No Audio/Video</span>
                <span style={meetingModeHelper}>
                  Calendar invite only. Use this for tasks, reminders, phone calls, or in-person meetings.
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (totalInvitees > VIDEO_INVITEE_LIMIT) {
                    alert(`Audio/Video meetings are limited to ${VIDEO_INVITEE_LIMIT} invitees.`);
                    return;
                  }
                  update('meetingMode', 'audio_video');
                }}
                style={meetingModeButton(form.meetingMode === 'audio_video')}
                disabled={busy}
              >
                <span style={meetingModeTitle}>Audio/Video</span>
                <span style={meetingModeHelper}>
                  Creates a scheduled ForgeMeeting room. Limited to 5 invitees.
                </span>
              </button>
            </div>
          </div>

          {/* Invitee source */}
          <div>
            <div style={{ ...label, marginBottom: 4 }}>Invitee Source</div>
            <div style={{ display: 'flex', gap: 24, fontSize: 13 }}>
              <label style={{ cursor: 'pointer', color: '#37474F' }}>
                <input
                  type="radio"
                  name="candidateType"
                  checked={form.candidateType === 'internal'}
                  onChange={() => {
                    update('candidateType', 'internal');
                    setCandidateSearchTerm('');
                    setCandidateResults([]);
                    setCandidateSearchError('');
                    setCandidatePickerOpen(true);
                  }}
                  style={{ marginRight: 6 }}
                />
                Forge members (from my contacts)
              </label>
              <label style={{ cursor: 'pointer', color: '#37474F' }}>
                <input
                  type="radio"
                  name="candidateType"
                  checked={form.candidateType === 'external'}
                  onChange={() => {
                    update('candidateType', 'external');
                    setCandidatePickerOpen(false);
                  }}
                  style={{ marginRight: 6 }}
                />
                External guests
              </label>
            </div>
          </div>

          {/* Selected invitees */}
          {totalInvitees > 0 && (
            <div>
              <div style={label}>Selected Invitees</div>
              <div style={chipWrap}>
                {internalInvitees.map((i) => (
                  <span key={i.id} style={chip}>
                    {i.name}
                    <button
                      type="button"
                      onClick={() => removeInternalInvitee(i.id)}
                      style={chipRemove}
                      aria-label={`Remove ${i.name}`}
                      disabled={busy}
                    >
                      ×
                    </button>
                  </span>
                ))}

                {externalInvitees.map((i, index) => (
                  <span key={`${i.email || i.name}-${index}`} style={chip}>
                    {i.name || i.email}
                    <button
                      type="button"
                      onClick={() => removeExternalInvitee(index)}
                      style={chipRemove}
                      aria-label={`Remove ${i.name || i.email}`}
                      disabled={busy}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Internal candidate picker */}
          {form.candidateType === 'internal' && (
            <div>
              <div style={label}>Forge Member Contacts</div>

              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  placeholder="Search or browse your contacts..."
                  value={candidateSearchTerm}
                  onFocus={() => setCandidatePickerOpen(true)}
                  onChange={(e) => {
                    setCandidateSearchTerm(e.target.value);
                    setCandidatePickerOpen(true);
                  }}
                  style={{ ...input, marginBottom: 4 }}
                />

                <button
                  type="button"
                  onClick={() => setCandidatePickerOpen((open) => !open)}
                  style={browseButton}
                  disabled={busy}
                >
                  {candidatePickerOpen ? 'Hide list' : 'Browse'}
                </button>
              </div>

              {candidatePickerOpen && (
                <div style={contactPickerCard}>
                  {candidateContactsLoading && (
                    <div style={{ padding: '10px 12px', fontSize: 12, color: '#90A4AE' }}>
                      Loading contacts…
                    </div>
                  )}

                  {candidateContactsError && (
                    <div style={{ padding: '10px 12px', fontSize: 12, color: '#C62828' }}>
                      {candidateContactsError}
                    </div>
                  )}

                  {candidateSearchLoading && (
                    <div style={{ padding: '10px 12px', fontSize: 12, color: '#90A4AE' }}>
                      Searching…
                    </div>
                  )}

                  {candidateSearchError && (
                    <div style={{ padding: '10px 12px', fontSize: 12, color: '#C62828' }}>
                      {candidateSearchError}
                    </div>
                  )}

                  {!candidateContactsLoading &&
                    !candidateContactsError &&
                    visibleCandidateContacts.length === 0 && (
                      <div style={{ padding: '10px 12px', fontSize: 12, color: '#9CA3AF' }}>
                        No contacts matched that search.
                      </div>
                    )}

                  {!candidateContactsLoading &&
                    !candidateContactsError &&
                    visibleCandidateContacts.map((r) => {
                      const selected = selectedInternalIds.has(r.id);
                      const disabled = !selected && inviteeLimitReached;

                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => {
                            if (disabled) return;
                            if (selected) {
                              removeInternalInvitee(r.id);
                            } else {
                              addInternalInvitee(r);
                            }
                          }}
                          style={contactPickerRow(selected, disabled)}
                        >
                          <div style={{ minWidth: 0 }}>
                            <div style={contactPickerName}>
                              {r.name || r.email || 'Unknown contact'}
                            </div>
                            {(r.email || r.headline) && (
                              <div style={contactPickerMeta}>
                                {r.email}
                                {r.email && r.headline ? ' • ' : ''}
                                {r.headline || ''}
                              </div>
                            )}
                          </div>

                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 800,
                              color: selected ? '#FF7043' : '#90A4AE',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {selected ? 'Selected' : disabled ? 'Limit reached' : 'Add'}
                          </span>
                        </button>
                      );
                    })}
                </div>
              )}

              {!candidatePickerOpen && (
                <div style={{ fontSize: 11, color: '#90A4AE', marginTop: 2 }}>
                  Browse your full contact list or search by name, email, or headline.
                </div>
              )}
            </div>
          )}

          {/* External invitees */}
          {form.candidateType === 'external' && (
            <div>
              <label style={label}>External Guests</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8 }}>
                <input
                  type="text"
                  value={externalName}
                  onChange={(e) => setExternalName(e.target.value)}
                  style={input}
                  placeholder="Name"
                  disabled={busy || inviteeLimitReached}
                />
                <input
                  type="email"
                  value={externalEmail}
                  onChange={(e) => setExternalEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addExternalInvitee();
                    }
                  }}
                  style={input}
                  placeholder="email@example.com"
                  disabled={busy || inviteeLimitReached}
                />
                <button
                  type="button"
                  onClick={addExternalInvitee}
                  style={addSmallButton}
                  disabled={busy || inviteeLimitReached}
                >
                  + Add
                </button>
              </div>

              <div style={helper}>
                {videoLimitActive
                  ? `Audio/Video meetings can include up to ${VIDEO_INVITEE_LIMIT} total invitees.`
                  : 'Calendar-only items can include as many external guests as needed.'}
              </div>
            </div>
          )}

          {/* Date / Time */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
            }}
          >
            <div>
              <label style={label}>Date</label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={(e) => update('date', e.target.value)}
                style={input}
              />
            </div>
            <div>
              <label style={label}>Time</label>
              <input
                type="time"
                name="time"
                value={form.time}
                onChange={(e) => update('time', e.target.value)}
                style={input}
              />
            </div>
          </div>

          {/* Type / Status */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
            }}
          >
            <div>
              <label style={label}>Type</label>
              <select
                name="type"
                value={form.type}
                onChange={(e) => update('type', e.target.value)}
                style={input}
              >
                {(typeChoices.length
                  ? typeChoices
                  : ['Interview', 'Screen', 'Sourcing', 'Offer', 'Task', 'Appointment']
                ).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={label}>Status</label>
              <select
                name="status"
                value={form.status}
                onChange={(e) => update('status', e.target.value)}
                style={input}
              >
                {(statusChoices.length
                  ? statusChoices
                  : ['Scheduled', 'Completed', 'Canceled']
                ).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={label}>Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              rows={3}
              style={{ ...input, resize: 'vertical', minHeight: 90 }}
            />
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 4,
            }}
          >
            {mode === 'edit' ? (
              !confirmingDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  disabled={busy}
                  style={{
                    background: 'white',
                    color: '#B71C1C',
                    border: '1px solid #F5C6CB',
                    padding: '6px 10px',
                    borderRadius: 999,
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  Delete
                </button>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span style={{ color: '#B71C1C', fontSize: 12 }}>
                    Delete this calendar item?
                  </span>
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
                    disabled={busy}
                    style={{
                      background: 'white',
                      border: '1px solid #ccc',
                      padding: '6px 10px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 13,
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete?.()}
                    disabled={busy}
                    style={{
                      background: '#E53935',
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: 13,
                    }}
                  >
                    Confirm Delete
                  </button>
                </div>
              )
            ) : (
              <span />
            )}

            {!confirmingDelete && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={busy}
                  style={{
                    background: 'white',
                    border: '1px solid #CFD8DC',
                    padding: '8px 12px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    color: '#455A64',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  style={{
                    background: '#FF7043',
                    color: 'white',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: 999,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontWeight: 700,
                    fontSize: 14,
                    boxShadow: '0 4px 12px rgba(255,112,67,0.4)',
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {foundryScheduling
                    ? 'Creating room…'
                    : saving
                    ? 'Saving…'
                    : mode === 'edit'
                    ? 'Save Changes'
                    : 'Save'}
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
