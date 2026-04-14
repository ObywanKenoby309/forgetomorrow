// hooks/useClientProfile.js
// Encapsulates all data fetching, state, and action handlers
// for the coaching client profile page.
// Returns everything the page needs — no JSX, no layout concerns.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { toSafeArray } from '@/lib/coaching/clientProfileHelpers';

export function useClientProfile() {
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
  const [generatingStrategy, setGeneratingStrategy] = useState(false);

  // ─── Load ─────────────────────────────────────────────────────────────────
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
        strategyBrief: full.strategyJson || null,
        strategyError: '',
      });

      // Auto-show results if a saved brief exists
      if (full.strategyJson) {
        setStrategyView('results');
      }

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
          setProfileData(profileRes.ok ? profileJson.profile || null : null);
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

  useEffect(() => { loadClient(); }, [loadClient]);

  // ─── Form helpers ──────────────────────────────────────────────────────────
  const onChange = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  // ─── Save ──────────────────────────────────────────────────────────────────
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

  // ─── Notes ────────────────────────────────────────────────────────────────
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

  // ─── Documents ────────────────────────────────────────────────────────────
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

  // ─── Plan items ───────────────────────────────────────────────────────────
  const addPlanItem = () => {
    const next = planInput.trim();
    if (!next) return;
    setPlanItems((prev) => [...prev, next]);
    setPlanInput('');
  };

  const removePlanItem = (idx) => {
    setPlanItems((prev) => prev.filter((_, i) => i !== idx));
  };

  // ─── Derived values ───────────────────────────────────────────────────────
  const sessions = toSafeArray(client?.sessions);
  const notes    = toSafeArray(client?.coachingNotes);
  const docs     = toSafeArray(client?.coachingDocuments);

  const avatarUrl =
    client?.avatarUrl ||
    client?.image ||
    client?.profileImage ||
    client?.userAvatarUrl ||
    '';

  const recentActivity = useMemo(() => {
    const items = [];

    if (client?.lastContact) {
      items.push({ label: 'Last contact', ts: client.lastContact, detail: 'Latest recorded coach touchpoint' });
    }

    sessions.slice(0, 5).forEach((s) => {
      items.push({ label: `${s.type || 'Session'} session`, ts: s.startAt, detail: s.status || 'Scheduled' });
    });

    notes.slice(0, 5).forEach((n) => {
      items.push({ label: 'Coach note added', ts: n.createdAt, detail: n.body });
    });

    return items
      .filter((x) => x.ts)
      .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
      .slice(0, 8);
  }, [client, sessions, notes]);

  // ─── Strategy generation ──────────────────────────────────────────────────
  const handleGenerateStrategy = async () => {
    if (!client?.id || !form?.targetCompanies?.trim()) return;

    setGeneratingStrategy(true);
    setForm((prev) => ({ ...prev, strategyError: '' }));

    try {
      const res = await fetch('/api/coaching/clients/strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: client.id,
          targetCompanies: form.targetCompanies,
          strategyBackground: form.strategyBackground,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setForm((prev) => ({ ...prev, strategyError: data.error || 'Strategy generation failed.' }));
        return;
      }

      // Store full brief, keep inputs intact
      setForm((prev) => ({
        ...prev,
        strategyBrief: data.strategy,
        strategyError: '',
      }));

      setStrategyView('results');
    } catch (err) {
      console.error('[handleGenerateStrategy]', err);
      setForm((prev) => ({ ...prev, strategyError: 'Strategy generation failed. Please try again.' }));
    } finally {
      setGeneratingStrategy(false);
    }
  };

  return {
    // data
    client, setClient,
    profileData,
    form, setForm,
    // loading / error
    loading, error,
    // save
    saving, saved, handleSave,
    // notes
    newNote, setNewNote, savingNote, handleAddNote, handleDeleteNote,
    // documents
    docTitle, setDocTitle,
    docUrl, setDocUrl,
    docType, setDocType,
    savingDoc, showDocForm, setShowDocForm,
    handleAddDoc, handleDeleteDoc,
    // plan
    planInput, setPlanInput, planItems, addPlanItem, removePlanItem,
    // tabs & strategy
    activeTab, setActiveTab,
    strategyView, setStrategyView,
    generatingStrategy, handleGenerateStrategy,
    // derived
    sessions, notes, docs, avatarUrl, recentActivity,
    // form helper
    onChange,
  };
}