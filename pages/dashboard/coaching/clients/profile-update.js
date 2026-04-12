// pages/dashboard/coaching/clients/profile-update.js
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import CoachingLayout from '@/components/layouts/CoachingLayout';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';

function toSafeArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
    return trimmed.split(',').map((v) => v.trim()).filter(Boolean);
  }
  return [];
}

function toStringArray(value) {
  return toSafeArray(value)
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      if (item && typeof item === 'object') {
        return String(item.label || item.name || item.value || item.title || '').trim();
      }
      return String(item || '').trim();
    })
    .filter(Boolean);
}

function toEducationObjects(value) {
  return toSafeArray(value)
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      return {
        school: String(item.school || item.name || '').trim(),
        degree: String(item.degree || '').trim(),
        field: String(item.field || item.study || '').trim(),
        startYear: String(item.startYear || '').trim(),
        endYear: String(item.endYear || '').trim(),
      };
    })
    .filter(Boolean);
}

function getExperienceList(value) {
  return toSafeArray(value)
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const highlights = toStringArray(
        item.highlights || item.bullets || item.description || item.details || []
      );
      return {
        title: String(item.title || item.role || item.jobTitle || '').trim(),
        company: String(item.company || item.employer || '').trim(),
        range: String(
          item.range ||
            [item.startDate || item.start || item.from, item.endDate || item.end || item.to]
              .filter(Boolean)
              .join(' - ')
        ).trim(),
        highlights,
      };
    })
    .filter(Boolean);
}

function avatarColor(name = '') {
  const palette = [
    ['#FF7043', '#BF360C'],
    ['#1E88E5', '#0D47A1'],
    ['#43A047', '#1B5E20'],
    ['#8E24AA', '#4A148C'],
    ['#00ACC1', '#006064'],
    ['#3949AB', '#1A237E'],
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '?';
}

function fmtDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function fmtDateTime(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function toDateInputValue(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toISOString().slice(0, 16);
  } catch {
    return '';
  }
}

function sectionClasses(isEmpty = false) {
  return `rounded-2xl border p-4 sm:p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)] ${
    isEmpty
      ? 'bg-white/70 border-slate-200'
      : 'bg-white/88 border-white/60 backdrop-blur-sm'
  }`;
}

function MetaRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-xs text-slate-500 shrink-0">{label}</span>
      <span className="text-xs text-slate-800 font-medium text-right">{value}</span>
    </div>
  );
}

const STATUS = {
  Active: { bg: '#E8F5E9', color: '#2E7D32', ring: '#43A047' },
  'At Risk': { bg: '#FFF3E0', color: '#E65100', ring: '#FF7043' },
  'New Intake': { bg: '#E3F2FD', color: '#1565C0', ring: '#1E88E5' },
};

const defaultStatus = { bg: '#F5F5F5', color: '#546E7A', ring: '#90A4AE' };

export default function ClientProfileUpdatePage() {
  const router = useRouter();
  const emailParam = router.query.email ? decodeURIComponent(String(router.query.email)) : '';

  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const [docTitle, setDocTitle] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [docType, setDocType] = useState('Other');
  const [savingDoc, setSavingDoc] = useState(false);
  const [showDocForm, setShowDocForm] = useState(false);

  const [planInput, setPlanInput] = useState('');
  const [planItems, setPlanItems] = useState([]);

  const loadClient = useCallback(async () => {
    if (!emailParam) return;

    setLoading(true);
    setError('');

    try {
      const listRes = await fetch('/api/coaching/clients');
      const listData = await listRes.json();

      const match = (listData.clients || []).find(
        c =>
          (c.email || '').toLowerCase() === emailParam.toLowerCase() ||
          String(c.id) === emailParam
      );

      if (!match) {
        setError('Client not found.');
        setLoading(false);
        return;
      }

      const detailRes = await fetch(`/api/coaching/clients/${match.id}`);
      const detailData = await detailRes.json();

      if (!detailRes.ok) {
        setError(detailData.error || 'Failed to load client.');
        setLoading(false);
        return;
      }

      const full = detailData.client;
      setClient(full);
      setForm({
        name: full.name || '',
        email: full.email || '',
        status: full.status || 'Active',
        nextSession: full.nextSession || '',
        lastContact: full.lastContact || '',
        notes: full.notes || '',
        profileUrl: full.profileUrl || '',
      });

      const pinnedPlan =
        typeof full.notes === 'string' && full.notes.includes('PLAN:')
          ? full.notes
              .split('\n')
              .filter((line) => line.trim().startsWith('PLAN:'))
              .map((line) => line.replace(/^PLAN:\s*/, '').trim())
              .filter(Boolean)
          : [];

      setPlanItems(pinnedPlan);
    } catch (err) {
      console.error('Error loading client:', err);
      setError('Failed to load client.');
    } finally {
      setLoading(false);
    }
  }, [emailParam]);

  useEffect(() => {
    loadClient();
  }, [loadClient]);

  const onChange = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSave = async () => {
    if (!client?.id || !form) return;

    setSaving(true);
    setSaved(false);

    try {
      const notesWithPlan = [
        (form.notes || '').trim(),
        ...planItems.filter(Boolean).map((item) => `PLAN: ${item}`),
      ]
        .filter(Boolean)
        .join('\n');

      const res = await fetch(`/api/coaching/clients/${client.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email || null,
          status: form.status,
          nextSession: form.nextSession || null,
          lastContact: form.lastContact || null,
          notes: notesWithPlan,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Save failed.');
        return;
      }

      setClient((prev) => ({ ...prev, ...data.client }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('Save error:', err);
      alert('Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !client?.id) return;

    setSavingNote(true);
    try {
      const res = await fetch(`/api/coaching/clients/${client.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: newNote.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to save note.');
        return;
      }

      setClient((prev) => ({
        ...prev,
        coachingNotes: [data.note, ...(prev.coachingNotes || [])],
      }));
      setNewNote('');
    } catch {
      alert('Failed to save note.');
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!confirm('Delete this note?') || !client?.id) return;

    try {
      await fetch(`/api/coaching/clients/${client.id}/notes`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId }),
      });

      setClient((prev) => ({
        ...prev,
        coachingNotes: (prev.coachingNotes || []).filter((n) => n.id !== noteId),
      }));
    } catch {
      alert('Failed to delete note.');
    }
  };

  const handleAddDoc = async () => {
    if (!docTitle.trim() || !docUrl.trim() || !client?.id) return;

    setSavingDoc(true);
    try {
      const res = await fetch(`/api/coaching/clients/${client.id}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: docTitle.trim(),
          url: docUrl.trim(),
          type: docType,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to add document.');
        return;
      }

      setClient((prev) => ({
        ...prev,
        coachingDocuments: [data.document, ...(prev.coachingDocuments || [])],
      }));

      setDocTitle('');
      setDocUrl('');
      setDocType('Other');
      setShowDocForm(false);
    } catch {
      alert('Failed to add document.');
    } finally {
      setSavingDoc(false);
    }
  };

  const handleDeleteDoc = async (documentId) => {
    if (!confirm('Remove this document?') || !client?.id) return;

    try {
      await fetch(`/api/coaching/clients/${client.id}/documents`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId }),
      });

      setClient((prev) => ({
        ...prev,
        coachingDocuments: (prev.coachingDocuments || []).filter((d) => d.id !== documentId),
      }));
    } catch {
      alert('Failed to remove document.');
    }
  };

  const addPlanItem = () => {
    const next = planInput.trim();
    if (!next) return;
    setPlanItems((prev) => [...prev, next]);
    setPlanInput('');
  };

  const removePlanItem = (idx) => {
    setPlanItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const sessions = toSafeArray(client?.sessions);
  const notes = toSafeArray(client?.coachingNotes);
  const docs = toSafeArray(client?.coachingDocuments);

  const avatarUrl =
    client?.avatarUrl ||
    client?.image ||
    client?.profileImage ||
    client?.userAvatarUrl ||
    '';

  const recentActivity = useMemo(() => {
    const items = [];

    if (client?.lastContact) {
      items.push({
        label: 'Last contact',
        ts: client.lastContact,
        detail: 'Latest recorded coach touchpoint',
      });
    }

    sessions.slice(0, 5).forEach((s) => {
      items.push({
        label: `${s.type || 'Session'} session`,
        ts: s.startAt,
        detail: s.status || 'Scheduled',
      });
    });

    notes.slice(0, 5).forEach((n) => {
      items.push({
        label: 'Coach note added',
        ts: n.createdAt,
        detail: n.body,
      });
    });

    return items
      .filter((x) => x.ts)
      .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
      .slice(0, 8);
  }, [client, sessions, notes]);

  const RightRail = <RightRailPlacementManager slot="right_rail_1" />;

  if (loading) {
    return (
      <CoachingLayout
        title="Client Profile Preview | ForgeTomorrow"
        activeNav="clients"
        sidebarInitialOpen={{ coaching: true, seeker: false }}
        right={RightRail}
        rightVariant="light"
      >
        <style>{shimmerCSS}</style>
        <div style={{ display: 'grid', gap: 14 }}>
          {[200, 300, 180].map((h, i) => (
            <div
              key={i}
              style={{
                height: h,
                borderRadius: 14,
                background: 'linear-gradient(90deg,#F5F7F9 25%,#ECEFF1 50%,#F5F7F9 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.4s infinite',
              }}
            />
          ))}
        </div>
      </CoachingLayout>
    );
  }

  if (error || !client || !form) {
    return (
      <CoachingLayout
        title="Client Profile Preview | ForgeTomorrow"
        activeNav="clients"
        sidebarInitialOpen={{ coaching: true, seeker: false }}
        right={RightRail}
        rightVariant="light"
      >
        <section className={sectionClasses(true)}>
          <div className="text-[22px] font-bold tracking-tight text-slate-900 mb-2">
            Client Not Found
          </div>
          <p className="text-sm text-slate-500 mb-4">
            {error || 'No client found for the provided email.'}
          </p>
          <Link href="/dashboard/coaching/clients" className="text-sm font-semibold text-[#FF7043]">
            ← Back to Clients
          </Link>
        </section>
      </CoachingLayout>
    );
  }

  const [avatarBg, avatarDark] = avatarColor(client.name);
  const cfg = STATUS[form.status] || defaultStatus;

  const profileHref =
    (typeof form.profileUrl === 'string' && form.profileUrl.trim()) ||
    (typeof client.profileUrl === 'string' && client.profileUrl.trim()) ||
    (typeof client.profileSlug === 'string' && client.profileSlug.trim()
      ? `/profile/${client.profileSlug.trim()}`
      : '') ||
    (client.clientId ? `/member-profile?userId=${client.clientId}` : '');

  const summaryText =
  client.summary?.trim?.() ||
  client.aboutMe?.trim?.() ||
  client.profileSummary?.trim?.() ||
  client.headline?.trim?.() ||
  form.notes?.trim() ||
  notes[0]?.body ||
  'This client profile is ready for coach planning, progress tracking, and session continuity.';

  const skillsList = toStringArray(
    client.skills ||
      client.skillsJson ||
      client.skillsProfile ||
      client.topSkills ||
      client.resumeSkills
  );

  const experienceList = getExperienceList(
    client.experience || client.workHistory || client.profileExperience || client.resumeExperience
  );

  const educationList = toEducationObjects(
    client.education || client.educationJson || client.profileEducation
  );

  const preferredLocations = toStringArray(
    client.preferredLocations ||
      client.workPreferences?.preferredLocations ||
      client.workPreferences?.locations
  );

  const workStatus =
    client.workStatus || client.workPreferences?.workStatus || client.workPreferences?.status || '';

  const preferredWorkType =
    client.preferredWorkType ||
    client.workPreferences?.preferredWorkType ||
    client.workPreferences?.workType ||
    '';

  const willingToRelocate =
    client.willingToRelocate ??
    client.workPreferences?.willingToRelocate ??
    client.workPreferences?.relocate ??
    '';

  const hasWorkPrefs = Boolean(
    workStatus || preferredWorkType || preferredLocations.length || String(willingToRelocate || '').trim()
  );

  const openProfile = () => {
    if (!profileHref) return;
    if (/^https?:\/\//i.test(profileHref)) {
      window.open(profileHref, '_blank', 'noopener,noreferrer');
      return;
    }
    router.push(profileHref);
  };

  return (
    <CoachingLayout
      title={`${client.name} | ForgeTomorrow`}
      activeNav="clients"
      sidebarInitialOpen={{ coaching: true, seeker: false }}
      right={RightRail}
      rightVariant="light"
    >
      <style>{`
        ${shimmerCSS}
      `}</style>

      <div className="fixed inset-0 -z-10 bg-[linear-gradient(180deg,rgba(248,250,252,0.22),rgba(241,245,249,0.34))]" />

      <div className="w-full max-w-[1400px] mx-auto rounded-[28px] border border-white/25 bg-[rgba(248,250,252,0.82)] shadow-[0_30px_80px_rgba(2,6,23,0.18)] backdrop-blur-xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-5 sm:px-6 sm:py-6 border-b border-white/30 bg-[linear-gradient(135deg,rgba(255,255,255,0.88),rgba(248,250,252,0.72))] flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[24px] font-black tracking-tight text-slate-900 truncate">
              {client.name || 'Client'}
            </div>
            <div className="mt-1 text-sm text-slate-600 truncate">
              Coaching Client • {client.email || 'No email on file'}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/dashboard/coaching/clients"
              className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-white transition"
            >
              Back
            </Link>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl border border-[#FF7043] bg-[#FF7043] px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#F4511E] transition disabled:opacity-70"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-5 overflow-y-auto bg-[linear-gradient(180deg,rgba(248,250,252,0.22),rgba(241,245,249,0.34))]">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-5">
            {/* Hero */}
            <section className={sectionClasses(false)}>
              <div className="grid grid-cols-1 md:grid-cols-[88px_1fr_auto] gap-5 items-center">
                <div
                  style={{
                    width: 88,
                    height: 88,
                    borderRadius: '999px',
                    background: avatarUrl ? 'transparent' : `linear-gradient(135deg, ${avatarBg}, ${avatarDark})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 800,
                    fontSize: 28,
                    boxShadow: `0 4px 16px ${avatarBg}70`,
                    outline: `3px solid ${cfg.ring}50`,
                    outlineOffset: 3,
                    overflow: 'hidden',
                  }}
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={client.name || 'Client avatar'}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  ) : (
                    initials(client.name)
                  )}
                </div>

                <div>
                  <div className="text-[24px] font-black tracking-tight text-slate-900">
                    {client.name}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {client.email || 'No email on file'}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        padding: '4px 10px',
                        borderRadius: 999,
                        background: cfg.bg,
                        color: cfg.color,
                      }}
                    >
                      {form.status}
                    </span>
                    <span className="text-xs text-slate-500">
                      {notes.length} notes · {docs.length} docs · {sessions.length} sessions
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => router.push('/dashboard/coaching/sessions')}
                    className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-white transition"
                  >
                    View Sessions
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push('/coaching/messaging')}
                    className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-white transition"
                  >
                    Message
                  </button>
                  {profileHref ? (
                    <button
                      type="button"
                      onClick={openProfile}
                      className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-white transition"
                    >
                      View Profile
                    </button>
                  ) : null}
                </div>
              </div>
            </section>

            {/* Summary */}
            <section className={sectionClasses(!summaryText?.trim())}>
              <div className="text-[22px] font-bold tracking-tight text-slate-900 mb-2">Summary</div>
              {summaryText?.trim() ? (
                <div className="text-sm leading-7 text-slate-700 whitespace-pre-line">
                  {summaryText}
                </div>
              ) : (
                <div className="text-sm text-slate-500">
                  No profile summary available yet.
                  <span className="block text-xs text-slate-400 mt-1">
                    Add profile information or resume data to give the coach better context.
                  </span>
                </div>
              )}
            </section>

            {/* Experience */}
            <section className={sectionClasses(experienceList.length === 0)}>
              <div className="text-[22px] font-bold tracking-tight text-slate-900 mb-3">Experience</div>
              {experienceList.length > 0 ? (
                <div className="space-y-3">
                  {experienceList.map((exp, idx) => (
                    <div key={`${exp.title}-${idx}`} className="border-b border-slate-100 last:border-0 pb-3">
                      <div className="font-semibold text-slate-900 break-words">
                        {[exp.title, exp.company].filter(Boolean).join(' — ') || 'Experience'}
                      </div>
                      {exp.range ? (
                        <div className="text-slate-500 text-sm mt-1">{exp.range}</div>
                      ) : null}
                      {exp.highlights?.length ? (
                        <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-slate-700">
                          {exp.highlights.slice(0, 4).map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-500">
                  No experience is available on this client yet.
                </div>
              )}
            </section>

            {/* Education */}
            <section className={sectionClasses(educationList.length === 0)}>
              <div className="text-[22px] font-bold tracking-tight text-slate-900 mb-3">Education</div>
              {educationList.length > 0 ? (
                <div className="space-y-3">
                  {educationList.map((edu, idx) => (
                    <div key={`${edu.school}-${idx}`} className="border-b border-slate-100 last:border-0 pb-3">
                      <div className="font-semibold text-slate-900 break-words">
                        {[edu.degree, edu.field].filter(Boolean).join(' in ') || 'Education'}
                      </div>
                      {edu.school ? (
                        <div className="text-slate-500 text-sm mt-1">{edu.school}</div>
                      ) : null}
                      {[edu.startYear, edu.endYear].filter(Boolean).length ? (
                        <div className="text-slate-400 text-xs mt-1">
                          {[edu.startYear, edu.endYear].filter(Boolean).join(' – ')}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-500">
                  No education details are available yet.
                </div>
              )}
            </section>

            {/* Session History */}
            <section className={sectionClasses(sessions.length === 0)}>
              <div className="text-[22px] font-bold tracking-tight text-slate-900 mb-3">
                Session History
              </div>

              {sessions.length === 0 ? (
                <div className="text-sm text-slate-500">
                  No sessions recorded yet.
                  <span className="block text-xs text-slate-400 mt-1">
                    Once sessions are created, they will appear here as part of the coaching timeline.
                  </span>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.map((s) => {
                    const sessionStatus =
                      s.status === 'Completed'
                        ? { bg: '#E8F5E9', color: '#2E7D32' }
                        : s.status === 'Cancelled'
                        ? { bg: '#FDECEA', color: '#C62828' }
                        : { bg: '#E3F2FD', color: '#1565C0' };

                    return (
                      <div
                        key={s.id}
                        className="border-b border-slate-100 last:border-0 pb-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 break-words">
                              {s.type || 'Session'}
                            </div>
                            <div className="text-slate-500 break-words">
                              {fmtDateTime(s.startAt)} • {s.durationMin} min
                            </div>
                          </div>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              letterSpacing: '0.05em',
                              textTransform: 'uppercase',
                              padding: '4px 8px',
                              borderRadius: 999,
                              background: sessionStatus.bg,
                              color: sessionStatus.color,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {s.status}
                          </span>
                        </div>

                        {(s.notes || s.followUpDueAt) && (
                          <div className="mt-2 text-sm text-slate-700 space-y-1">
                            {s.notes ? <div>{s.notes}</div> : null}
                            {s.followUpDueAt ? (
                              <div className="text-xs text-slate-500">
                                Follow-up: {s.followUpDone ? 'Done' : `Due ${fmtDate(s.followUpDueAt)}`}
                              </div>
                            ) : null}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Recent Coaching Activity */}
            <section className={sectionClasses(recentActivity.length === 0)}>
              <div className="text-[22px] font-bold tracking-tight text-slate-900 mb-3">
                Recent Coaching Activity
              </div>

              {recentActivity.length === 0 ? (
                <div className="text-sm text-slate-500">
                  No recent coaching activity yet.
                </div>
              ) : (
                <div className="space-y-3 overflow-y-auto max-h-[320px] pr-2">
                  {recentActivity.map((item, idx) => (
                    <div key={`${item.label}-${idx}`} className="text-sm">
                      <div className="font-semibold text-slate-900 break-words">
                        {item.label}
                      </div>
                      <div className="text-slate-500 break-words">
                        {fmtDateTime(item.ts)}
                      </div>
                      {item.detail ? (
                        <div className="text-slate-600 mt-1 break-words">
                          {item.detail}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Documents */}
            <section className={sectionClasses(docs.length === 0 && !showDocForm)}>
              <div className="flex items-center justify-between mb-3 gap-3">
                <div>
                  <div className="text-[22px] font-bold tracking-tight text-slate-900">
                    Documents
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Resumes, plans, resources, and supporting materials
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDocForm((v) => !v)}
                  className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-white transition"
                >
                  {showDocForm ? 'Cancel' : '+ Add Document'}
                </button>
              </div>

              {showDocForm && (
                <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_180px_auto] gap-3 mb-4">
                  <input
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white/85"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    placeholder="Document title"
                  />
                  <input
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white/85"
                    value={docUrl}
                    onChange={(e) => setDocUrl(e.target.value)}
                    placeholder="https://..."
                  />
                  <select
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white/85"
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                  >
                    <option value="Resume">Resume</option>
                    <option value="Cover">Cover Letter</option>
                    <option value="Notes">Notes</option>
                    <option value="Other">Other</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddDoc}
                    disabled={savingDoc || !docTitle.trim() || !docUrl.trim()}
                    className="px-3 py-2 rounded-xl text-sm text-white bg-[#FF7043] hover:bg-[#F4511E] shadow-sm disabled:opacity-50 transition"
                  >
                    {savingDoc ? 'Adding…' : 'Add'}
                  </button>
                </div>
              )}

              {docs.length === 0 ? (
                <div className="text-sm text-slate-500">
                  No documents attached yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {docs.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3"
                    >
                      <div className="w-9 h-9 rounded-lg bg-[rgba(255,112,67,0.10)] flex items-center justify-center text-base shrink-0">
                        📄
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-900 truncate">
                          {doc.title}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {doc.type} • Added {fmtDate(doc.uploadedAt)}
                        </div>
                      </div>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-[#FF7043] whitespace-nowrap"
                      >
                        View →
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDeleteDoc(doc.id)}
                        className="text-slate-400 hover:text-slate-700 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right column */}
          <div className="space-y-5">
            {/* Client Details */}
            <section className={sectionClasses(false)}>
              <div className="text-[22px] font-bold tracking-tight text-slate-900 mb-3">
                Client Details
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Name</label>
                  <input
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm w-full bg-white/85"
                    value={form.name}
                    onChange={onChange('name')}
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Email</label>
                  <input
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm w-full bg-white/85"
                    value={form.email}
                    onChange={onChange('email')}
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Status</label>
                  <select
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm w-full bg-white/85"
                    value={form.status}
                    onChange={onChange('status')}
                  >
                    <option value="Active">Active</option>
                    <option value="At Risk">At Risk</option>
                    <option value="New Intake">New Intake</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Next Session</label>
                  <input
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm w-full bg-white/85"
                    type="datetime-local"
                    value={toDateInputValue(form.nextSession)}
                    onChange={onChange('nextSession')}
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Last Contact</label>
                  <input
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm w-full bg-white/85"
                    type="datetime-local"
                    value={toDateInputValue(form.lastContact)}
                    onChange={onChange('lastContact')}
                  />
                </div>
              </div>
            </section>

            {/* Work Preferences */}
            <section className={sectionClasses(!hasWorkPrefs)}>
              <div className="text-[22px] font-bold tracking-tight text-slate-900 mb-3">
                Work Preferences
              </div>

              {hasWorkPrefs ? (
                <div className="divide-y divide-slate-100">
                  <MetaRow label="Status" value={workStatus} />
                  <MetaRow label="Work type" value={preferredWorkType} />
                  <MetaRow
                    label="Willing to relocate"
                    value={
                      typeof willingToRelocate === 'boolean'
                        ? willingToRelocate
                          ? 'Yes'
                          : 'No'
                        : String(willingToRelocate || '').trim()
                    }
                  />
                  {preferredLocations.length > 0 ? (
                    <div className="py-1.5 border-b border-slate-100 last:border-0">
                      <div className="text-xs text-slate-500 mb-1">Preferred locations</div>
                      <div className="flex flex-wrap gap-1.5">
                        {preferredLocations.map((loc, idx) => (
                          <span
                            key={`${loc}-${idx}`}
                            className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-700"
                          >
                            {loc}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="text-sm text-slate-500">
                  No work preferences are available for this client yet.
                </div>
              )}
            </section>

            {/* Skills */}
            <section className={sectionClasses(skillsList.length === 0)}>
              <div className="text-[22px] font-bold tracking-tight text-slate-900 mb-2">
                Skills
              </div>
              <div className="text-[11px] text-slate-400 mb-3">
                Read-only profile context for coaching.
              </div>

              {skillsList.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {skillsList.map((skill, idx) => (
                    <span
                      key={`${skill}-${idx}`}
                      className="text-xs px-2 py-[6px] rounded-xl border bg-slate-100 text-slate-700 border-slate-300"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-500">
                  No skills are available on this client yet.
                </div>
              )}
            </section>

            {/* Focus Areas / Plan */}
            <section className={sectionClasses(planItems.length === 0)}>
              <div className="text-[22px] font-bold tracking-tight text-slate-900 mb-2">
                Focus Areas / Plan
              </div>
              <div className="text-[11px] text-slate-400 mb-3">
                Private to the coach. Use this like recruiter skills, but for action planning.
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {planItems.length > 0 ? (
                  planItems.map((item, i) => (
                    <span
                      key={`${item}-${i}`}
                      className="text-xs px-2 py-[6px] rounded-xl border bg-slate-100 text-slate-700 border-slate-300 flex items-center gap-1 break-words"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => removePlanItem(i)}
                        className="ml-1 text-slate-500 hover:text-slate-700"
                      >
                        ×
                      </button>
                    </span>
                  ))
                ) : (
                  <div className="text-sm text-slate-500">No plan items added yet.</div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm w-full bg-white/85"
                  placeholder="Add a plan item…"
                  value={planInput}
                  onChange={(e) => setPlanInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addPlanItem();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={addPlanItem}
                  className="px-3 py-2 rounded-xl text-sm text-white bg-[#FF7043] hover:bg-[#F4511E] shadow-sm transition"
                >
                  Add
                </button>
              </div>
            </section>

            {/* Context */}
            <section className={sectionClasses(false)}>
              <div className="text-[22px] font-bold tracking-tight text-slate-900 mb-3">
                Client Context
              </div>

              <div className="divide-y divide-slate-100">
                <MetaRow label="Status" value={form.status} />
                <MetaRow label="Next session" value={form.nextSession ? fmtDateTime(form.nextSession) : ''} />
                <MetaRow label="Last contact" value={form.lastContact ? fmtDateTime(form.lastContact) : ''} />
                <MetaRow label="Documents" value={`${docs.length}`} />
                <MetaRow label="Notes" value={`${notes.length}`} />
                <MetaRow label="Sessions" value={`${sessions.length}`} />
              </div>
            </section>

            {/* Notes */}
            <section className={sectionClasses(notes.length === 0 && !(form.notes || '').trim())}>
              <div className="text-[22px] font-bold tracking-tight text-slate-900 mb-3">Notes</div>

              <textarea
                className="border border-slate-200 rounded-2xl px-3 py-2 w-full min-h-[120px] text-sm bg-white/85"
                placeholder="Pinned client context visible to you…"
                value={form.notes}
                onChange={onChange('notes')}
              />
              <div className="mt-1 text-[11px] text-slate-400">
                This stays private to the coach workspace.
              </div>

              <div className="mt-4 border-t border-slate-100 pt-4">
                <div className="text-sm font-semibold text-slate-900 mb-2">Notes Log</div>

                <div className="flex items-start gap-2 mb-3">
                  <textarea
                    className="border border-slate-200 rounded-2xl px-3 py-2 w-full min-h-[84px] text-sm bg-white/85"
                    placeholder="Add a timestamped coaching note…"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={handleAddNote}
                    disabled={savingNote || !newNote.trim()}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-[#FF7043] hover:bg-[#F4511E] shadow-sm transition disabled:opacity-50"
                  >
                    {savingNote ? 'Adding…' : 'Add'}
                  </button>
                </div>

                {notes.length > 0 ? (
                  <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                    {notes.map((note) => (
                      <div
                        key={note.id}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 flex gap-3"
                      >
                        <div className="flex-1">
                          <div className="text-sm text-slate-700 whitespace-pre-wrap">
                            {note.body}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-2">
                            {fmtDateTime(note.createdAt)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-slate-400 hover:text-slate-700 text-sm"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-slate-500">No note history yet.</div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </CoachingLayout>
  );
}

const shimmerCSS = `@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`;