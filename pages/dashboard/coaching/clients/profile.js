// pages/dashboard/coaching/clients/profile.js
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
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || '?'
  );
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

function MetaRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start justify-between gap-2 py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-[11px] text-slate-500 shrink-0">{label}</span>
      <span className="text-[11px] text-slate-800 font-medium text-right">{value}</span>
    </div>
  );
}

function SectionCard({ title, action, helperText, children, className = '', bodyClassName = '' }) {
  return (
    <section
      className={`rounded-[18px] border border-white/26 bg-[rgba(255,255,255,0.70)] shadow-[0_10px_22px_rgba(15,23,42,0.11)] backdrop-blur-xl ${className}`}
    >
      <div className={`p-2.5 sm:p-3 ${bodyClassName}`}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <div className="text-[15px] font-black tracking-tight text-[#FF7043] drop-shadow-[0_2px_4px_rgba(15,23,42,0.45)]">
              {title}
            </div>
            {helperText ? <div className="text-xs text-slate-500 mt-1">{helperText}</div> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
        {children}
      </div>
    </section>
  );
}

function TabButton({ id, label, activeTab, setActiveTab, badge }) {
  const active = activeTab === id;
  return (
    <button
      type="button"
      onClick={() => setActiveTab(id)}
      className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[13px] font-semibold transition ${
        active
          ? 'border border-[#FF7043] bg-[rgba(255,112,67,0.12)] text-[#FF7043] shadow-sm'
          : 'border border-slate-200 bg-white/80 text-slate-700 hover:bg-white'
      }`}
    >
      <span>{label}</span>
      {badge ? (
        <span className="inline-flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-white/90 px-1.5 text-[11px] font-bold text-slate-700 border border-slate-200">
          {badge}
        </span>
      ) : null}
    </button>
  );
}


function buildTargetStrategy(targetCompanies = '', strategyBackground = '') {
  const companyText = String(targetCompanies || '').trim();
  const backgroundText = String(strategyBackground || '').trim();
  const combined = `${companyText}\n${backgroundText}`.toLowerCase();

  if (!companyText) {
    return {
      error: 'Add at least one target company or category before generating strategy.',
      themes: [],
      roles: [],
      nextStep: '',
    };
  }

  const themeRules = [
    { label: 'Health / Wellness', terms: ['health', 'wellness', 'medicine', 'medical', 'nutrition', 'vitamin', 'supplement'] },
    { label: 'Faith-based', terms: ['church', 'faith', 'christian', 'ministry', 'gospel', 'bible', 'evangel', 'life.church', 'youversion'] },
    { label: 'Veteran Support', terms: ['veteran', 'warrior', 'heroes', 'military', 'honor'] },
    { label: 'Education', terms: ['school', 'education', 'curriculum', 'college', 'university', 'homeschool', 'classical'] },
    { label: 'Media / Communications', terms: ['media', 'broadcast', 'radio', 'news', 'wire', 'blaze', 'signal', 'studios'] },
    { label: 'Local / Immediate Search', terms: ['san antonio', 'available immediately', 'immediately'] },
  ];

  const detectedThemes = themeRules
    .filter((rule) => rule.terms.some((term) => combined.includes(term)))
    .map((rule) => rule.label);

  const themes = detectedThemes.length > 0 ? detectedThemes : ['Mission / values alignment needs review'];

  const roleSet = new Set();
  if (combined.includes('media') || combined.includes('broadcast') || combined.includes('radio') || combined.includes('communications')) {
    roleSet.add('Content / Communications');
  }
  if (combined.includes('community') || combined.includes('mission') || combined.includes('church') || combined.includes('faith') || combined.includes('veteran')) {
    roleSet.add('Community / Outreach');
  }
  if (combined.includes('health') || combined.includes('wellness') || combined.includes('customer') || combined.includes('member')) {
    roleSet.add('Customer Success / Support');
  }
  roleSet.add('Operations / Coordination');

  const roles = Array.from(roleSet);

  let nextStep = 'Focus on 10–15 best-fit companies and align outreach to these role lanes.';
  if (themes.includes('Local / Immediate Search')) {
    nextStep = 'Prioritize the fastest local or remote opportunities first, then narrow outreach to 10–15 best-fit companies.';
  }

  return { error: '', themes, roles, nextStep };
}


const STATUS = {
  Active: { bg: '#E8F5E9', color: '#2E7D32', ring: '#43A047' },
  'At Risk': { bg: '#FFF3E0', color: '#E65100', ring: '#FF7043' },
  'New Intake': { bg: '#E3F2FD', color: '#1565C0', ring: '#1E88E5' },
};

const defaultStatus = { bg: '#F5F5F5', color: '#546E7A', ring: '#90A4AE' };
const shimmerCSS = `@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`;

export default function ClientProfileUpdatePage() {
  const router = useRouter();
  const emailParam = router.query.email ? decodeURIComponent(String(router.query.email)) : '';

  const [client, setClient] = useState(null);
  const [profileData, setProfileData] = useState(null);
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

  const [activeTab, setActiveTab] = useState('coaching');
  const [strategyView, setStrategyView] = useState('input');

  const loadClient = useCallback(async () => {
    if (!emailParam) return;

    setLoading(true);
    setError('');

    try {
      const listRes = await fetch('/api/coaching/clients');
      const listData = await listRes.json();

      const match = (listData.clients || []).find(
        (c) =>
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
        manualSummary: full.manualSummary || '',
        manualExperience: full.manualExperience || '',
        manualEducation: full.manualEducation || '',
        manualSkills: full.manualSkills || '',
        manualWorkStatus: full.manualWorkStatus || '',
        manualPreferredWorkType: full.manualPreferredWorkType || '',
        manualPreferredLocations: full.manualPreferredLocations || '',
        manualWillingToRelocate: full.manualWillingToRelocate || '',
        targetCompanies: full.targetCompanies || '',
        strategyBackground: full.strategyBackground || '',
        strategyThemes: full.strategyThemes || '',
        strategyRoleLanes: full.strategyRoleLanes || '',
        strategyNextStep: full.strategyNextStep || '',
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

      if (full?.clientId) {
        try {
          const profileRes = await fetch(`/api/coaching/clients/profile/${full.clientId}`);
          const profileJson = await profileRes.json().catch(() => ({}));

          if (profileRes.ok) {
            setProfileData(profileJson.profile || null);
          } else {
            setProfileData(null);
          }
        } catch (profileErr) {
          console.error('Failed to load profile data:', profileErr);
          setProfileData(null);
        }
      } else {
        setProfileData(null);
      }
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
          manualSummary: form.manualSummary || null,
          manualExperience: form.manualExperience || null,
          manualEducation: form.manualEducation || null,
          manualSkills: form.manualSkills || null,
          manualWorkStatus: form.manualWorkStatus || null,
          manualPreferredWorkType: form.manualPreferredWorkType || null,
          manualPreferredLocations: form.manualPreferredLocations || null,
          manualWillingToRelocate: form.manualWillingToRelocate || null,
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

  if (loading) {
    return (
      <CoachingLayout
        title="Client Profile | ForgeTomorrow"
        activeNav="clients"
        contentFullBleed
        sidebarInitialOpen={{ coaching: true, seeker: false }}
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
        title="Client Profile | ForgeTomorrow"
        activeNav="clients"
        contentFullBleed
        sidebarInitialOpen={{ coaching: true, seeker: false }}
      >
        <SectionCard title="Client Not Found">
          <p className="text-sm text-slate-500 mb-4">
            {error || 'No client found for the provided email.'}
          </p>
          <Link href="/dashboard/coaching/clients" className="text-sm font-semibold text-[#FF7043]">
            ← Back to Clients
          </Link>
        </SectionCard>
      </CoachingLayout>
    );
  }

  const source = profileData || client;
  const isFTUser = Boolean(profileData);
  const [avatarBg, avatarDark] = avatarColor(client.name);
  const cfg = STATUS[form.status] || defaultStatus;

  const profileHref =
    (typeof source.profileUrl === 'string' && source.profileUrl.trim()) ||
    (typeof form.profileUrl === 'string' && form.profileUrl.trim()) ||
    (typeof client.profileUrl === 'string' && client.profileUrl.trim()) ||
    (typeof source.slug === 'string' && source.slug.trim() ? `/profile/${source.slug.trim()}` : '') ||
    (typeof client.profileSlug === 'string' && client.profileSlug.trim()
      ? `/profile/${client.profileSlug.trim()}`
      : '') ||
    (client.clientId ? `/member-profile?userId=${client.clientId}` : '');

  const summaryText = isFTUser
    ? source.summary?.trim?.() ||
      source.aboutMe?.trim?.() ||
      source.profileSummary?.trim?.() ||
      source.headline?.trim?.() ||
      ''
    : form.manualSummary?.trim() || '';

  const skillsList = isFTUser
    ? toStringArray(
        source.skills ||
          source.skillsJson ||
          source.skillsProfile ||
          source.topSkills ||
          source.resumeSkills
      )
    : toStringArray(form.manualSkills || '');

  const experienceList = isFTUser
    ? getExperienceList(
        source.experience || source.workHistory || source.profileExperience || source.resumeExperience
      )
    : [];

  const educationList = isFTUser
    ? toEducationObjects(source.education || source.educationJson || source.profileEducation)
    : [];

  const preferredLocations = isFTUser
    ? toStringArray(
        source.preferredLocations ||
          source.workPreferences?.preferredLocations ||
          source.workPreferences?.locations
      )
    : toStringArray(form.manualPreferredLocations || '');

  const workStatus = isFTUser
    ? source.workStatus || source.workPreferences?.workStatus || source.workPreferences?.status || ''
    : form.manualWorkStatus || '';

  const preferredWorkType = isFTUser
    ? source.preferredWorkType ||
      source.workPreferences?.preferredWorkType ||
      source.workPreferences?.workType ||
      ''
    : form.manualPreferredWorkType || '';

  const willingToRelocate = isFTUser
    ? source.willingToRelocate ??
      source.workPreferences?.willingToRelocate ??
      source.workPreferences?.relocate ??
      ''
    : form.manualWillingToRelocate || '';

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

  const tabBadges = {
    profile: null,
    coaching: notes.length + sessions.length,
    documents: docs.length || null,
  };

  const strategyThemesList = toStringArray(form.strategyThemes || '');
  const strategyRoleLanesList = toStringArray(form.strategyRoleLanes || '');
  const strategyHasResults = Boolean(
    strategyThemesList.length || strategyRoleLanesList.length || String(form.strategyNextStep || '').trim()
  );

  const handleGenerateStrategy = () => {
    const result = buildTargetStrategy(form.targetCompanies, form.strategyBackground);

    setForm((prev) => ({
      ...prev,
      strategyThemes: result.themes.join(', '),
      strategyRoleLanes: result.roles.join(', '),
      strategyNextStep: result.nextStep,
      strategyError: result.error || '',
    }));

    if (!result.error) {
      setStrategyView('results');
    }
  };

  return (
    <CoachingLayout
      title={`${client.name} | ForgeTomorrow`}
      activeNav="clients"
      contentFullBleed
      sidebarInitialOpen={{ coaching: true, seeker: false }}
    >
      <style>{shimmerCSS}</style>

      <div className="w-full pr-3 box-border">
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_260px] gap-3 w-full min-w-0">
          <section className="rounded-[22px] border border-white/24 bg-[rgba(248,250,252,0.80)] shadow-[0_20px_50px_rgba(2,6,23,0.16)] backdrop-blur-xl overflow-hidden xl:col-[1/2]">
            <div className="px-3 py-3 sm:px-4 sm:py-4 border-b border-white/30 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(248,250,252,0.78))]">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[16px] font-black tracking-tight text-slate-900 truncate">
                    {client.name || 'Client'}
                  </div>
                  <div className="mt-1 text-[13px] text-slate-600 truncate">
                    Coaching Client • {client.email || 'No email on file'}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Link
                    href="/dashboard/coaching/clients"
                    className="rounded-xl border border-slate-200 bg-white/85 px-2.5 py-1.5 text-[13px] font-medium text-slate-700 shadow-sm hover:bg-white transition"
                  >
                    Back
                  </Link>

                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-xl border border-[#FF7043] bg-[#FF7043] px-2.5 py-1.5 text-[13px] font-medium text-white shadow-sm hover:bg-[#F4511E] transition disabled:opacity-70"
                  >
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>

                  {saved ? (
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
                      Saved
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mt-3">
                <TabButton
                  id="profile"
                  label="Profile"
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  badge={tabBadges.profile}
                />
                <TabButton
                  id="coaching"
                  label="Coaching"
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  badge={tabBadges.coaching}
                />
                <TabButton
                  id="documents"
                  label="Documents"
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  badge={tabBadges.documents}
                />
              </div>
            </div>

            <div className="p-3 sm:p-3.5 bg-[linear-gradient(180deg,rgba(248,250,252,0.24),rgba(241,245,249,0.38))]">
              {activeTab === 'profile' ? (
                <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-3">
                  <div className="space-y-3">
                    <SectionCard title="Client Snapshot">
                      <div className="flex flex-col items-center text-center gap-3">
                        <div
                          style={{
                            width: 64,
                            height: 64,
                            borderRadius: '999px',
                            background: avatarUrl
                              ? 'transparent'
                              : `linear-gradient(135deg, ${avatarBg}, ${avatarDark})`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 800,
                            fontSize: 24,
                            boxShadow: `0 8px 24px ${avatarBg}55`,
                            outline: `3px solid ${cfg.ring}45`,
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
                          <div className="text-[16px] font-black tracking-tight text-slate-900">
                            {client.name}
                          </div>
                          <div className="mt-1 text-sm text-slate-500">
                            {client.email || 'No email on file'}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-2">
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
                          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                            {isFTUser ? 'ForgeTomorrow User' : 'External Client'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 gap-2 w-full pt-1">
                          <button
                            type="button"
                            onClick={() => router.push('/dashboard/coaching/sessions')}
                            className="rounded-xl border border-slate-200 bg-white/85 px-2.5 py-1.5 text-[13px] font-medium text-slate-700 shadow-sm hover:bg-white transition"
                          >
                            View Sessions
                          </button>

                          <button
                            type="button"
                            onClick={() => router.push('/coaching/messaging')}
                            className="rounded-xl border border-slate-200 bg-white/85 px-2.5 py-1.5 text-[13px] font-medium text-slate-700 shadow-sm hover:bg-white transition"
                          >
                            Message
                          </button>

                          {profileHref ? (
                            <button
                              type="button"
                              onClick={openProfile}
                              className="rounded-xl border border-slate-200 bg-white/85 px-2.5 py-1.5 text-[13px] font-medium text-slate-700 shadow-sm hover:bg-white transition"
                            >
                              View Profile
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </SectionCard>

                    <SectionCard title="Command Snapshot">
                      <div className="divide-y divide-slate-100">
                        <MetaRow label="Status" value={form.status} />
                        <MetaRow
                          label="Next session"
                          value={form.nextSession ? fmtDateTime(form.nextSession) : ''}
                        />
                        <MetaRow
                          label="Last contact"
                          value={form.lastContact ? fmtDateTime(form.lastContact) : ''}
                        />
                        <MetaRow label="Sessions" value={sessions.length} />
                        <MetaRow label="Notes" value={notes.length} />
                        <MetaRow label="Documents" value={docs.length} />
                      </div>
                    </SectionCard>
                  </div>

                  <div className="space-y-3">
                    <SectionCard title="Summary">
                      {isFTUser ? (
                        summaryText ? (
                          <div className="text-[13px] leading-6 text-slate-700 whitespace-pre-line">
                            {summaryText}
                          </div>
                        ) : (
                          <div className="text-sm text-slate-500">
                            No profile summary available yet.
                          </div>
                        )
                      ) : (
                        <textarea
                          className="border border-slate-200 rounded-2xl px-3 py-2 w-full min-h-[150px] text-sm bg-white/88"
                          placeholder="Enter client summary..."
                          value={form.manualSummary || ''}
                          onChange={onChange('manualSummary')}
                        />
                      )}
                    </SectionCard>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                      <SectionCard title="Experience">
                        {isFTUser ? (
                          experienceList.length > 0 ? (
                            <div className="space-y-3 max-h-[240px] overflow-y-auto pr-1">
                              {experienceList.map((exp, idx) => (
                                <div
                                  key={`${exp.title}-${idx}`}
                                  className="border-b border-slate-100 last:border-0 pb-3"
                                >
                                  <div className="font-semibold text-slate-900 break-words">
                                    {[exp.title, exp.company].filter(Boolean).join(' — ') || 'Experience'}
                                  </div>
                                  {exp.range ? (
                                    <div className="text-xs text-slate-500 mt-1">{exp.range}</div>
                                  ) : null}
                                  {exp.highlights?.length ? (
                                    <ul className="mt-2 space-y-1">
                                      {exp.highlights.slice(0, 3).map((item, itemIdx) => (
                                        <li
                                          key={`${item}-${itemIdx}`}
                                          className="text-sm text-slate-700 leading-6"
                                        >
                                          • {item}
                                        </li>
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
                          )
                        ) : (
                          <textarea
                            className="border border-slate-200 rounded-2xl px-3 py-2 w-full min-h-[180px] text-sm bg-white/88"
                            placeholder="Enter experience manually..."
                            value={form.manualExperience || ''}
                            onChange={onChange('manualExperience')}
                          />
                        )}
                      </SectionCard>

                      <SectionCard title="Education">
                        {isFTUser ? (
                          educationList.length > 0 ? (
                            <div className="space-y-3 max-h-[240px] overflow-y-auto pr-1">
                              {educationList.map((edu, idx) => (
                                <div
                                  key={`${edu.school}-${idx}`}
                                  className="border-b border-slate-100 last:border-0 pb-3"
                                >
                                  <div className="font-semibold text-slate-900 break-words">
                                    {[edu.degree, edu.field].filter(Boolean).join(' in ') || 'Education'}
                                  </div>
                                  <div className="text-sm text-slate-600 mt-1 break-words">
                                    {edu.school || 'School not listed'}
                                  </div>
                                  {(edu.startYear || edu.endYear) ? (
                                    <div className="text-xs text-slate-500 mt-1">
                                      {[edu.startYear, edu.endYear].filter(Boolean).join(' - ')}
                                    </div>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-slate-500">
                              No education details are available yet.
                            </div>
                          )
                        ) : (
                          <textarea
                            className="border border-slate-200 rounded-2xl px-3 py-2 w-full min-h-[180px] text-sm bg-white/88"
                            placeholder="Enter education manually..."
                            value={form.manualEducation || ''}
                            onChange={onChange('manualEducation')}
                          />
                        )}
                      </SectionCard>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                      <SectionCard
                        title="Skills"
                        helperText={
                          isFTUser
                            ? 'Read-only profile context for coaching.'
                            : 'Coach-managed profile context for non-FT clients.'
                        }
                      >
                        {isFTUser ? (
                          skillsList.length > 0 ? (
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
                          )
                        ) : (
                          <input
                            className="border border-slate-200 rounded-xl px-3 py-2 text-sm w-full bg-white/88"
                            placeholder="Enter skills (comma separated)"
                            value={form.manualSkills || ''}
                            onChange={onChange('manualSkills')}
                          />
                        )}
                      </SectionCard>

                      <SectionCard title="Work Preferences">
                        {isFTUser ? (
                          hasWorkPrefs ? (
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
                                <div className="py-2">
                                  <div className="text-xs text-slate-500 mb-2">Preferred locations</div>
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
                          )
                        ) : (
                          <div className="space-y-3">
                            <input
                              className="border border-slate-200 rounded-xl px-3 py-2 text-sm w-full bg-white/88"
                              placeholder="Work status"
                              value={form.manualWorkStatus || ''}
                              onChange={onChange('manualWorkStatus')}
                            />
                            <input
                              className="border border-slate-200 rounded-xl px-3 py-2 text-sm w-full bg-white/88"
                              placeholder="Preferred work type"
                              value={form.manualPreferredWorkType || ''}
                              onChange={onChange('manualPreferredWorkType')}
                            />
                            <input
                              className="border border-slate-200 rounded-xl px-3 py-2 text-sm w-full bg-white/88"
                              placeholder="Preferred locations (comma separated)"
                              value={form.manualPreferredLocations || ''}
                              onChange={onChange('manualPreferredLocations')}
                            />
                            <input
                              className="border border-slate-200 rounded-xl px-3 py-2 text-sm w-full bg-white/88"
                              placeholder="Willing to relocate"
                              value={form.manualWillingToRelocate || ''}
                              onChange={onChange('manualWillingToRelocate')}
                            />
                          </div>
                        )}
                      </SectionCard>
                    </div>
                  </div>
                </div>
              ) : null}

              {activeTab === 'coaching' ? (
                <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1fr)_minmax(0,0.9fr)] gap-3">
                  <div className="space-y-3">
                    <SectionCard title="Coach Controls">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1.5">Name</label>
                          <input
                            className="border border-slate-200 rounded-xl px-3 py-2 text-sm w-full bg-white/88"
                            value={form.name}
                            onChange={onChange('name')}
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-slate-500 mb-1.5">Email</label>
                          <input
                            className="border border-slate-200 rounded-xl px-3 py-2 text-sm w-full bg-white/88"
                            value={form.email}
                            onChange={onChange('email')}
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-slate-500 mb-1.5">Status</label>
                          <select
                            className="border border-slate-200 rounded-xl px-3 py-2 text-sm w-full bg-white/88"
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
                            className="border border-slate-200 rounded-xl px-3 py-2 text-sm w-full bg-white/88"
                            type="datetime-local"
                            value={toDateInputValue(form.nextSession)}
                            onChange={onChange('nextSession')}
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-slate-500 mb-1.5">Last Contact</label>
                          <input
                            className="border border-slate-200 rounded-xl px-3 py-2 text-sm w-full bg-white/88"
                            type="datetime-local"
                            value={toDateInputValue(form.lastContact)}
                            onChange={onChange('lastContact')}
                          />
                        </div>
                      </div>
                    </SectionCard>

                    <SectionCard
  title="Focus Areas / Plan"
  helperText="Private to the coach."
  className="min-h-[160px]"
  bodyClassName="h-full flex flex-col"
>
  <div className="flex-1 min-h-0 flex flex-col">
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

    <div className="mt-auto flex items-center gap-2">
      <input
        className="border border-slate-200 rounded-xl px-3 py-2 text-sm w-full bg-white/88"
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
        className="px-2.5 py-1.5 rounded-xl text-sm text-white bg-[#FF7043] hover:bg-[#F4511E] shadow-sm transition"
      >
        Add
      </button>
    </div>
  </div>
</SectionCard>
                  </div>

                  <div className="space-y-3">
                    <SectionCard
                      title="Target Strategy"
                      helperText="Convert target companies into role direction and coaching plan"
                      className="min-h-[420px]"
                      bodyClassName="h-full flex flex-col"
                      action={
                        <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white/85 p-1 shadow-sm">
                          <button
                            type="button"
                            onClick={() => setStrategyView('input')}
                            className={`rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition ${
                              strategyView === 'input'
                                ? 'bg-[rgba(255,112,67,0.14)] text-[#FF7043]'
                                : 'text-slate-600 hover:text-slate-800'
                            }`}
                          >
                            Target Strategy
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (strategyHasResults) setStrategyView('results');
                            }}
                            disabled={!strategyHasResults}
                            className={`rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition ${
                              strategyView === 'results'
                                ? 'bg-[rgba(255,112,67,0.14)] text-[#FF7043]'
                                : 'text-slate-600 hover:text-slate-800'
                            } disabled:opacity-45 disabled:cursor-not-allowed`}
                          >
                            Results
                          </button>
                        </div>
                      }
                    >
                      <div className="flex-1 min-h-0">
                        {strategyView === 'input' ? (
                          <div className="h-full flex flex-col gap-3">
                            <textarea
                              className="border border-slate-200 rounded-2xl px-3 py-2 w-full min-h-[104px] text-sm bg-white/88"
                              placeholder="Paste target companies or categories..."
                              value={form.targetCompanies || ''}
                              onChange={onChange('targetCompanies')}
                            />

                            <textarea
                              className="border border-slate-200 rounded-2xl px-3 py-2 w-full min-h-[104px] text-sm bg-white/88"
                              placeholder="Add quick background summary, strengths, or role clues..."
                              value={form.strategyBackground || ''}
                              onChange={onChange('strategyBackground')}
                            />

                            {form.strategyError ? (
                              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
                                {form.strategyError}
                              </div>
                            ) : null}

                            <div className="mt-auto flex justify-end">
                              <button
                                type="button"
                                onClick={handleGenerateStrategy}
                                className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-[#FF7043] hover:bg-[#F4511E] shadow-sm transition"
                              >
                                Generate Strategy
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="h-full overflow-y-auto pr-1 space-y-4">
                            <div className="rounded-2xl border border-slate-200 bg-white/70 px-3 py-3">
                              <div className="text-[11px] font-bold tracking-[0.08em] text-slate-500 uppercase mb-2">
                                Themes
                              </div>
                              {strategyThemesList.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {strategyThemesList.map((theme, idx) => (
                                    <span
                                      key={`${theme}-${idx}`}
                                      className="inline-flex items-center rounded-xl border border-slate-300 bg-slate-100 px-2.5 py-1 text-[12px] text-slate-700"
                                    >
                                      {theme}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-sm text-slate-500">No themes generated yet.</div>
                              )}
                            </div>

                            <div>
                              <div className="text-[11px] font-bold tracking-[0.08em] text-slate-500 uppercase mb-2">
                                Role Lanes
                              </div>
                              {strategyRoleLanesList.length > 0 ? (
                                <div className="text-sm leading-6 text-slate-700">
                                  {strategyRoleLanesList.join(', ')}
                                </div>
                              ) : (
                                <div className="text-sm text-slate-500">No role lanes generated yet.</div>
                              )}
                            </div>

                            <div>
                              <div className="text-[11px] font-bold tracking-[0.08em] text-slate-500 uppercase mb-2">
                                Next Step
                              </div>
                              <div className="text-sm leading-6 text-slate-700">
                                {form.strategyNextStep || 'Generate strategy to view the next step.'}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </SectionCard>

                    <SectionCard
  title="Session History"
  helperText="Coaching timeline and recent sessions"
  className="min-h-[160px]"
  bodyClassName="h-full flex flex-col"
>
  <div className="flex-1 min-h-0">
    {sessions.length === 0 ? (
      <div className="text-sm text-slate-500">
        No sessions recorded yet.
        <span className="block text-xs text-slate-400 mt-1">
          Once sessions are created, they will appear here.
        </span>
      </div>
    ) : (
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
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
                  <div className="text-slate-500 break-words text-sm">
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

              {(s.notes || s.followUpDueAt) ? (
                <div className="mt-2 text-sm text-slate-700 space-y-1">
                  {s.notes ? <div>{s.notes}</div> : null}
                  {s.followUpDueAt ? (
                    <div className="text-xs text-slate-500">
                      Follow-up: {s.followUpDone ? 'Done' : `Due ${fmtDate(s.followUpDueAt)}`}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    )}
  </div>
</SectionCard>
</div>

                  <div className="space-y-3">
                    <SectionCard title="Coach Notes" helperText="Pinned context plus timestamped note log">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1.5">Pinned Context</label>
                          <textarea
                            className="border border-slate-200 rounded-2xl px-3 py-2 w-full min-h-[120px] text-sm bg-white/88"
                            placeholder="Pinned client context visible to you…"
                            value={form.notes}
                            onChange={onChange('notes')}
                          />
                          <div className="mt-1 text-[11px] text-slate-400">
                            This stays private to the coach workspace.
                          </div>
                        </div>

                        <div className="border-t border-slate-100 pt-4">
                          <div className="text-sm font-semibold text-slate-900 mb-2">Add Note</div>

                          <div className="flex flex-col gap-2 mb-3">
                            <textarea
                              className="border border-slate-200 rounded-2xl px-3 py-2 w-full min-h-[84px] text-sm bg-white/88"
                              placeholder="Add a timestamped coaching note…"
                              value={newNote}
                              onChange={(e) => setNewNote(e.target.value)}
                            />
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={handleAddNote}
                                disabled={savingNote || !newNote.trim()}
                                className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-[#FF7043] hover:bg-[#F4511E] shadow-sm transition disabled:opacity-50"
                              >
                                {savingNote ? 'Adding…' : 'Add Note'}
                              </button>
                            </div>
                          </div>

                          {notes.length > 0 ? (
                            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
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
                      </div>
                    </SectionCard>

                    <SectionCard title="Recent Coaching Activity">
                      {recentActivity.length === 0 ? (
                        <div className="text-sm text-slate-500">No recent coaching activity yet.</div>
                      ) : (
                        <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1">
                          {recentActivity.map((item, idx) => (
                            <div key={`${item.label}-${idx}`} className="text-sm">
                              <div className="font-semibold text-slate-900 break-words">{item.label}</div>
                              <div className="text-slate-500 break-words">{fmtDateTime(item.ts)}</div>
                              {item.detail ? (
                                <div className="text-slate-600 mt-1 break-words">{item.detail}</div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      )}
                    </SectionCard>
                  </div>
                </div>
              ) : null}

              {activeTab === 'documents' ? (
                <SectionCard
                  title="Documents"
                  helperText="Resumes, plans, resources, and supporting materials"
                  action={
                    <button
                      type="button"
                      onClick={() => setShowDocForm((v) => !v)}
                      className="rounded-xl border border-slate-200 bg-white/85 px-2.5 py-1.5 text-[13px] font-medium text-slate-700 shadow-sm hover:bg-white transition"
                    >
                      {showDocForm ? 'Cancel' : '+ Add Document'}
                    </button>
                  }
                >
                  {showDocForm ? (
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_180px_auto] gap-3 mb-4">
                      <input
                        className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white/88"
                        value={docTitle}
                        onChange={(e) => setDocTitle(e.target.value)}
                        placeholder="Document title"
                      />
                      <input
                        className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white/88"
                        value={docUrl}
                        onChange={(e) => setDocUrl(e.target.value)}
                        placeholder="https://..."
                      />
                      <select
                        className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white/88"
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
                        className="px-2.5 py-1.5 rounded-xl text-sm text-white bg-[#FF7043] hover:bg-[#F4511E] shadow-sm disabled:opacity-50 transition"
                      >
                        {savingDoc ? 'Adding…' : 'Add'}
                      </button>
                    </div>
                  ) : null}

                  {docs.length === 0 ? (
                    <div className="text-sm text-slate-500">No documents attached yet.</div>
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
                </SectionCard>
              ) : null}
            </div>
          </section>

          <aside className="hidden xl:flex xl:flex-col gap-3 xl:col-[2/3] xl:row-[1/2]">
            <div className="min-h-[150px]">
              <RightRailPlacementManager slot="right_rail_1" />
            </div>

            <SectionCard title="Quick Snapshot">
              <div className="divide-y divide-slate-100">
                <MetaRow label="Current tab" value={activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} />
                <MetaRow label="Status" value={form.status} />
                <MetaRow label="Next session" value={form.nextSession ? fmtDateTime(form.nextSession) : '—'} />
                <MetaRow label="Documents" value={docs.length} />
              </div>
            </SectionCard>
          </aside>
        </div>
      </div>
    </CoachingLayout>
  );
}
