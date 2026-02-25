// pages/dashboard/coaching/clients/[email].js
import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import CoachingLayout from '@/components/layouts/CoachingLayout';

/* ── Avatar helpers ─────────────────────────────────────────────────────── */
function avatarColor(name = '') {
  const palette = [
    ['#FF7043', '#BF360C'], ['#1E88E5', '#0D47A1'], ['#43A047', '#1B5E20'],
    ['#8E24AA', '#4A148C'], ['#00ACC1', '#006064'], ['#3949AB', '#1A237E'],
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}
function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
}

/* ── Status config ──────────────────────────────────────────────────────── */
const STATUS = {
  Active:       { bg: '#E8F5E9', color: '#2E7D32', ring: '#43A047' },
  'At Risk':    { bg: '#FFF3E0', color: '#E65100', ring: '#FF7043' },
  'New Intake': { bg: '#E3F2FD', color: '#1565C0', ring: '#1E88E5' },
};
const defaultStatus = { bg: '#F5F5F5', color: '#546E7A', ring: '#90A4AE' };

/* ── Format helpers ─────────────────────────────────────────────────────── */
function fmtDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return iso; }
}
function fmtDateTime(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  } catch { return iso; }
}
function toDateInputValue(iso) {
  if (!iso) return '';
  try { return new Date(iso).toISOString().slice(0, 16); }
  catch { return ''; }
}

/* ════════════════════════════════════════════════════════════════════════════
   Main page
═══════════════════════════════════════════════════════════════════════════ */
export default function ClientProfilePage() {
  const router = useRouter();
  const emailParam = router.query.email ? decodeURIComponent(String(router.query.email)) : '';

  const [client, setClient]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  // Edit form state
  const [form, setForm]     = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  // Notes
  const [newNote, setNewNote]         = useState('');
  const [savingNote, setSavingNote]   = useState(false);

  // Documents
  const [docTitle, setDocTitle]   = useState('');
  const [docUrl, setDocUrl]       = useState('');
  const [docType, setDocType]     = useState('Other');
  const [savingDoc, setSavingDoc] = useState(false);
  const [showDocForm, setShowDocForm] = useState(false);

  /* ── Load client by email ─────────────────────────────────────────────── */
  const loadClient = useCallback(async () => {
    if (!emailParam) return;
    setLoading(true);
    setError('');
    try {
      // Step 1: get the list to find the client's id by email
      const listRes  = await fetch('/api/coaching/clients');
      const listData = await listRes.json();
      const match    = (listData.clients || []).find(
        c => (c.email || '').toLowerCase() === emailParam.toLowerCase()
      );

      if (!match) {
        setError('Client not found.');
        setLoading(false);
        return;
      }

      // Step 2: fetch full client detail by id
      const detailRes  = await fetch(`/api/coaching/clients/${match.id}`);
      const detailData = await detailRes.json();

      if (!detailRes.ok) {
        setError(detailData.error || 'Failed to load client.');
        setLoading(false);
        return;
      }

      setClient(detailData.client);
      setForm({
        name:        detailData.client.name        || '',
        email:       detailData.client.email       || '',
        status:      detailData.client.status      || 'Active',
        nextSession: detailData.client.nextSession || '',
        lastContact: detailData.client.lastContact || '',
        notes:       detailData.client.notes       || '',
      });
    } catch (err) {
      console.error('Error loading client:', err);
      setError('Failed to load client.');
    } finally {
      setLoading(false);
    }
  }, [emailParam]);

  useEffect(() => { loadClient(); }, [loadClient]);

  /* ── Save core fields ─────────────────────────────────────────────────── */
  const handleSave = async () => {
    if (!client?.id || !form) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/coaching/clients/${client.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:        form.name,
          email:       form.email || null,
          status:      form.status,
          nextSession: form.nextSession || null,
          lastContact: form.lastContact || null,
          notes:       form.notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Save failed.'); return; }
      setClient(prev => ({ ...prev, ...data.client }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('Save error:', err);
      alert('Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  /* ── Add note ─────────────────────────────────────────────────────────── */
  const handleAddNote = async () => {
    if (!newNote.trim() || !client?.id) return;
    setSavingNote(true);
    try {
      const res  = await fetch(`/api/coaching/clients/${client.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: newNote.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Failed to save note.'); return; }
      setClient(prev => ({
        ...prev,
        coachingNotes: [data.note, ...(prev.coachingNotes || [])],
      }));
      setNewNote('');
    } catch { alert('Failed to save note.'); }
    finally { setSavingNote(false); }
  };

  /* ── Delete note ──────────────────────────────────────────────────────── */
  const handleDeleteNote = async (noteId) => {
    if (!confirm('Delete this note?') || !client?.id) return;
    try {
      await fetch(`/api/coaching/clients/${client.id}/notes`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId }),
      });
      setClient(prev => ({
        ...prev,
        coachingNotes: (prev.coachingNotes || []).filter(n => n.id !== noteId),
      }));
    } catch { alert('Failed to delete note.'); }
  };

  /* ── Add document ─────────────────────────────────────────────────────── */
  const handleAddDoc = async () => {
    if (!docTitle.trim() || !docUrl.trim() || !client?.id) return;
    setSavingDoc(true);
    try {
      const res  = await fetch(`/api/coaching/clients/${client.id}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: docTitle, url: docUrl, type: docType }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Failed to add document.'); return; }
      setClient(prev => ({
        ...prev,
        coachingDocuments: [data.document, ...(prev.coachingDocuments || [])],
      }));
      setDocTitle(''); setDocUrl(''); setDocType('Other');
      setShowDocForm(false);
    } catch { alert('Failed to add document.'); }
    finally { setSavingDoc(false); }
  };

  /* ── Delete document ──────────────────────────────────────────────────── */
  const handleDeleteDoc = async (documentId) => {
    if (!confirm('Remove this document?') || !client?.id) return;
    try {
      await fetch(`/api/coaching/clients/${client.id}/documents`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId }),
      });
      setClient(prev => ({
        ...prev,
        coachingDocuments: (prev.coachingDocuments || []).filter(d => d.id !== documentId),
      }));
    } catch { alert('Failed to remove document.'); }
  };

  /* ── Shared onChange ──────────────────────────────────────────────────── */
  const onChange = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  /* ── Render states ────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <CoachingLayout title="Client Profile | ForgeTomorrow" activeNav="clients" sidebarInitialOpen={{ coaching: true }}>
        <style>{shimmerCSS}</style>
        <div style={{ display: 'grid', gap: 14 }}>
          {[200, 300, 180].map((h, i) => (
            <div key={i} style={{ height: h, borderRadius: 14, background: 'linear-gradient(90deg,#F5F7F9 25%,#ECEFF1 50%,#F5F7F9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
          ))}
        </div>
      </CoachingLayout>
    );
  }

  if (error || !client || !form) {
    return (
      <CoachingLayout title="Client Not Found | ForgeTomorrow" activeNav="clients" sidebarInitialOpen={{ coaching: true }}>
        <section style={sectionStyle}>
          <h2 style={{ color: '#FF7043', margin: '0 0 8px' }}>Client Not Found</h2>
          <p style={{ color: '#607D8B', marginBottom: 16 }}>{error || `No client found for "${emailParam}".`}</p>
          <Link href="/dashboard/coaching/clients" style={outlineLink}>← Back to Clients</Link>
        </section>
      </CoachingLayout>
    );
  }

  const [avatarBg, avatarDark] = avatarColor(client.name);
  const cfg = STATUS[form.status] || defaultStatus;
  const internalProfileHref = `/profile/${encodeURIComponent(client.email || '')}`;

  return (
    <CoachingLayout
      title={`${client.name} | ForgeTomorrow`}
      activeNav="clients"
      sidebarInitialOpen={{ coaching: true, seeker: false }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        .cp-root * { font-family: 'DM Sans', system-ui, sans-serif; box-sizing: border-box; }
        ${shimmerCSS}

        .cp-input {
          width: 100%; border: 1px solid #E0E5EA; border-radius: 10px;
          padding: 10px 13px; font-size: 13px; color: #37474F;
          background: #FAFBFC; outline: none; display: block;
          font-family: 'DM Sans', system-ui, sans-serif;
          transition: border-color 0.15s ease;
        }
        .cp-input:focus { border-color: #FF7043; background: white; }

        .cp-btn-primary {
          background: #FF7043; color: white; border: none; border-radius: 10px;
          padding: 10px 20px; font-weight: 800; font-size: 13px; cursor: pointer;
          font-family: 'DM Sans', system-ui, sans-serif;
          transition: all 0.15s ease;
          box-shadow: 0 3px 10px rgba(255,112,67,0.3);
        }
        .cp-btn-primary:hover:not(:disabled) { background: #F4511E; box-shadow: 0 4px 14px rgba(255,112,67,0.4); }
        .cp-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

        .cp-btn-outline {
          background: white; color: #FF7043; border: 1px solid #FFCCBC;
          border-radius: 10px; padding: 9px 16px; font-weight: 700; font-size: 13px;
          cursor: pointer; font-family: 'DM Sans', system-ui, sans-serif;
          transition: all 0.15s ease;
        }
        .cp-btn-outline:hover { background: #FFF3E0; border-color: #FF7043; }

        .cp-btn-ghost {
          background: transparent; color: #90A4AE; border: 1px solid #E0E5EA;
          border-radius: 8px; padding: 5px 10px; font-size: 12px; font-weight: 600;
          cursor: pointer; font-family: 'DM Sans', system-ui, sans-serif;
          transition: all 0.15s ease;
        }
        .cp-btn-ghost:hover { color: #FF7043; border-color: #FFCCBC; background: #FFF8F6; }

        .cp-note-item:hover .cp-note-delete { opacity: 1; }
        .cp-note-delete { opacity: 0; transition: opacity 0.15s ease; }

        .cp-session-row { transition: background 0.15s ease; }
        .cp-session-row:hover { background: #F8F9FA !important; }

        @media (max-width: 768px) {
          .cp-details-grid { grid-template-columns: 1fr !important; }
          .cp-hero-grid { grid-template-columns: 1fr !important; text-align: center; }
          .cp-hero-avatar { margin: 0 auto; }
        }
      `}</style>

      <div className="cp-root" style={{ display: 'grid', gap: 16, maxWidth: '100%' }}>

        {/* ── Back link ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href="/dashboard/coaching/clients" style={{ color: '#90A4AE', fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            ← Back to Clients
          </Link>
        </div>

        {/* ── Hero card ── */}
        <section style={sectionStyle}>
          <div className="cp-hero-grid" style={{ display: 'grid', gridTemplateColumns: '80px 1fr auto', gap: 20, alignItems: 'center' }}>
            {/* Avatar */}
            <div className="cp-hero-avatar" style={{
              width: 80, height: 80, borderRadius: '50%', flexShrink: 0,
              background: `linear-gradient(135deg, ${avatarBg}, ${avatarDark})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 800, fontSize: 26,
              boxShadow: `0 4px 16px ${avatarBg}70`,
              outline: `3px solid ${cfg.ring}50`, outlineOffset: 3,
            }}>
              {initials(client.name)}
            </div>

            {/* Name + email + status */}
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#1C2B36', letterSpacing: '-0.02em' }}>
                {client.name}
              </h1>
              <div style={{ fontSize: 13, color: '#78909C', fontFamily: "'DM Mono', monospace", marginTop: 3 }}>
                {client.email || 'No email on file'}
              </div>
              <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 999, background: cfg.bg, color: cfg.color }}>
                  {form.status}
                </span>
                <span style={{ fontSize: 12, color: '#90A4AE' }}>
                  {(client.coachingNotes || []).length} notes · {(client.coachingDocuments || []).length} docs · {(client.sessions || []).length} sessions
                </span>
              </div>
            </div>

            {/* ForgeTomorrow profile link */}
            {client.clientId && (
              <a href={internalProfileHref} style={{ ...solidLink, whiteSpace: 'nowrap' }}>
                View FT Profile →
              </a>
            )}
          </div>
        </section>

        {/* ── Details form ── */}
        <section style={sectionStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div>
              <h2 style={sectionTitle}>Client Details</h2>
              <p style={sectionSub}>Edit and save client information</p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {saved && <span style={{ fontSize: 12, color: '#43A047', fontWeight: 700 }}>✓ Saved</span>}
              <button onClick={handleSave} disabled={saving} className="cp-btn-primary">
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>

          <div className="cp-details-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>Name</label>
              <input className="cp-input" value={form.name} onChange={onChange('name')} />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input className="cp-input" type="email" value={form.email} onChange={onChange('email')} />
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select className="cp-input" value={form.status} onChange={onChange('status')} style={{ flex: 1 }}>
                  <option value="Active">Active</option>
                  <option value="At Risk">At Risk</option>
                  <option value="New Intake">New Intake</option>
                </select>
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 999, background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap' }}>
                  {form.status}
                </span>
              </div>
            </div>
            <div>
              <label style={labelStyle}>External Profile URL <span style={{ color: '#B0BEC5', fontWeight: 400 }}>(optional)</span></label>
              <input className="cp-input" value={form.profileUrl || ''} onChange={onChange('profileUrl')} placeholder="https://linkedin.com/in/…" />
            </div>
            <div>
              <label style={labelStyle}>Next Session</label>
              <input className="cp-input" type="datetime-local" value={toDateInputValue(form.nextSession)} onChange={onChange('nextSession')} />
            </div>
            <div>
              <label style={labelStyle}>Last Contact</label>
              <input className="cp-input" type="datetime-local" value={toDateInputValue(form.lastContact)} onChange={onChange('lastContact')} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Quick Note <span style={{ color: '#B0BEC5', fontWeight: 400 }}>(pinned to client record)</span></label>
              <textarea className="cp-input" value={form.notes} onChange={onChange('notes')} rows={3} style={{ resize: 'vertical' }} placeholder="Key context, preferences, goals…" />
            </div>
          </div>
        </section>

        {/* ── Notes log ── */}
        <section style={sectionStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h2 style={sectionTitle}>Notes Log</h2>
              <p style={sectionSub}>Timestamped coaching notes</p>
            </div>
          </div>

          {/* Add note */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, marginBottom: 16, alignItems: 'start' }}>
            <textarea
              className="cp-input"
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              rows={2}
              style={{ resize: 'vertical' }}
              placeholder="Add a coaching note…"
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAddNote(); }}
            />
            <button onClick={handleAddNote} disabled={savingNote || !newNote.trim()} className="cp-btn-primary" style={{ alignSelf: 'flex-end' }}>
              {savingNote ? 'Adding…' : 'Add Note'}
            </button>
          </div>

          {/* Notes list */}
          {(client.coachingNotes || []).length === 0 ? (
            <div style={{ padding: '20px 0', color: '#90A4AE', fontSize: 13, textAlign: 'center' }}>No notes yet. Add your first note above.</div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {(client.coachingNotes || []).map(note => (
                <div key={note.id} className="cp-note-item" style={{ display: 'flex', gap: 12, padding: '12px 14px', background: '#F8F9FA', borderRadius: 10, border: '1px solid #ECEFF1', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: '#37474F', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{note.body}</div>
                    <div style={{ fontSize: 11, color: '#90A4AE', marginTop: 5, fontFamily: "'DM Mono', monospace" }}>{fmtDateTime(note.createdAt)}</div>
                  </div>
                  <button onClick={() => handleDeleteNote(note.id)} className="cp-btn-ghost cp-note-delete" style={{ flexShrink: 0 }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Documents ── */}
        <section style={sectionStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h2 style={sectionTitle}>Documents</h2>
              <p style={sectionSub}>Resumes, cover letters, and resources</p>
            </div>
            <button onClick={() => setShowDocForm(v => !v)} className="cp-btn-outline">
              {showDocForm ? 'Cancel' : '+ Add Document'}
            </button>
          </div>

          {/* Add doc form */}
          {showDocForm && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: 10, marginBottom: 16, padding: 14, background: '#F8F9FA', borderRadius: 10, border: '1px solid #ECEFF1', alignItems: 'end' }}>
              <div>
                <label style={labelStyle}>Title</label>
                <input className="cp-input" value={docTitle} onChange={e => setDocTitle(e.target.value)} placeholder="Resume_v3.pdf" />
              </div>
              <div>
                <label style={labelStyle}>URL or Path</label>
                <input className="cp-input" value={docUrl} onChange={e => setDocUrl(e.target.value)} placeholder="https://…" />
              </div>
              <div>
                <label style={labelStyle}>Type</label>
                <select className="cp-input" value={docType} onChange={e => setDocType(e.target.value)}>
                  <option value="Resume">Resume</option>
                  <option value="Cover">Cover Letter</option>
                  <option value="Notes">Notes</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <button onClick={handleAddDoc} disabled={savingDoc || !docTitle.trim() || !docUrl.trim()} className="cp-btn-primary">
                {savingDoc ? 'Adding…' : 'Add'}
              </button>
            </div>
          )}

          {/* Docs list */}
          {(client.coachingDocuments || []).length === 0 ? (
            <div style={{ padding: '20px 0', color: '#90A4AE', fontSize: 13, textAlign: 'center' }}>No documents yet.</div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {(client.coachingDocuments || []).map(doc => (
                <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#F8F9FA', borderRadius: 10, border: '1px solid #ECEFF1' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#FF704318', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>📄</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#37474F', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.title}</div>
                    <div style={{ fontSize: 11, color: '#90A4AE', marginTop: 1 }}>{doc.type} · Added {fmtDate(doc.uploadedAt)}</div>
                  </div>
                  <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#FF7043', fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>View →</a>
                  <button onClick={() => handleDeleteDoc(doc.id)} className="cp-btn-ghost">✕</button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Session history ── */}
        <section style={sectionStyle}>
          <div style={{ marginBottom: 16 }}>
            <h2 style={sectionTitle}>Session History</h2>
            <p style={sectionSub}>Last 20 coaching sessions</p>
          </div>

          {(client.sessions || []).length === 0 ? (
            <div style={{ padding: '20px 0', color: '#90A4AE', fontSize: 13, textAlign: 'center' }}>No sessions recorded yet.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px' }}>
                <thead>
                  <tr>
                    {['Date', 'Type', 'Duration', 'Status', 'Follow-up', 'Notes'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '6px 12px', fontSize: 10, fontWeight: 800, color: '#B0BEC5', letterSpacing: '0.07em', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(client.sessions || []).map(s => {
                    const sessionStatus = s.status === 'Completed' ? { bg: '#E8F5E9', color: '#2E7D32' }
                      : s.status === 'Cancelled' ? { bg: '#FDECEA', color: '#C62828' }
                      : { bg: '#E3F2FD', color: '#1565C0' };
                    return (
                      <tr key={s.id} className="cp-session-row" style={{ background: 'white', borderRadius: 8 }}>
                        <td style={tdStyle}>{fmtDateTime(s.startAt)}</td>
                        <td style={tdStyle}>{s.type}</td>
                        <td style={tdStyle}>{s.durationMin}m</td>
                        <td style={tdStyle}>
                          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 999, background: sessionStatus.bg, color: sessionStatus.color }}>
                            {s.status}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          {s.followUpDueAt ? (
                            <span style={{ fontSize: 12, color: s.followUpDone ? '#43A047' : '#FF7043', fontWeight: 600 }}>
                              {s.followUpDone ? '✓ Done' : `Due ${fmtDate(s.followUpDueAt)}`}
                            </span>
                          ) : '—'}
                        </td>
                        <td style={{ ...tdStyle, maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#78909C', fontSize: 12 }}>
                          {s.notes || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>
    </CoachingLayout>
  );
}

/* ── Styles ─────────────────────────────────────────────────────────────── */
const shimmerCSS = `@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`;

const sectionStyle = {
  background: 'white',
  borderRadius: 14,
  padding: '20px 22px',
  boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
  border: '1px solid #E8ECEF',
};

const sectionTitle = { margin: 0, fontSize: 15, fontWeight: 800, color: '#1C2B36', letterSpacing: '-0.01em' };
const sectionSub   = { margin: '3px 0 0', fontSize: 12, color: '#90A4AE', fontWeight: 500 };

const labelStyle = {
  display: 'block', fontSize: 12, fontWeight: 700,
  color: '#546E7A', marginBottom: 6, letterSpacing: '0.02em',
};

const tdStyle = { padding: '10px 12px', fontSize: 13, color: '#37474F', background: 'white' };

const solidLink = {
  background: '#FF7043', color: 'white', textDecoration: 'none',
  borderRadius: 10, padding: '9px 14px', fontSize: 12, fontWeight: 700,
  display: 'inline-block',
};

const outlineLink = {
  color: '#FF7043', textDecoration: 'none', fontWeight: 700,
  fontSize: 13, display: 'inline-block',
};