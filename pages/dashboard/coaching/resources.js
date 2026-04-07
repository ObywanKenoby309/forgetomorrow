// pages/dashboard/coaching/resources.js
//
// Layout mirrors coaching-dashboard.js exactly:
//   - CoachingLayout with contentFullBleed
//   - CoachingTitleCard, RightRailPlacementManager
//   - GLASS / WHITE_CARD / ORANGE_HEADING_LIFT constants
//
// All data from DB. File uploads go to Supabase Storage bucket
// 'coaching-documents' via /api/coaching/documents (multipart POST).
// Public URL is stored back in CoachingDocument.url.

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import CoachingLayout from '@/components/layouts/CoachingLayout';
import CoachingTitleCard from '@/components/coaching/CoachingTitleCard';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';

// ─── Style constants (identical to coaching-dashboard) ────────────────────────
const GLASS = {
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.58)',
  boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};
const WHITE_CARD = {
  background: 'rgba(255,255,255,0.92)',
  border: '1px solid rgba(0,0,0,0.08)',
  borderRadius: 12,
  boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
  boxSizing: 'border-box',
};
const ORANGE_HEADING_LIFT = {
  textShadow: '0 2px 4px rgba(15,23,42,0.65), 0 1px 2px rgba(0,0,0,0.4)',
  fontWeight: 900,
};
const GAP = 16;
const RIGHT_COL_WIDTH = 280;

const TYPE_STYLES = {
  Template:  { background: '#E6F1FB', color: '#185FA5' },
  Guide:     { background: '#EAF3DE', color: '#3B6D11' },
  Worksheet: { background: '#EEEDFE', color: '#534AB7' },
  Other:     { background: '#F1EFE8', color: '#5F5E5A' },
};
const DOC_TYPES = ['Template', 'Guide', 'Worksheet', 'Other'];

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
].join(',');

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

// ─── Primitives ───────────────────────────────────────────────────────────────
function TypeTag({ type }) {
  const s = TYPE_STYLES[type] || TYPE_STYLES.Other;
  return (
    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, fontWeight: 600, whiteSpace: 'nowrap', ...s }}>
      {type || 'Other'}
    </span>
  );
}

function TH({ children, right }) {
  return (
    <th style={{
      textAlign: right ? 'right' : 'left', padding: '9px 14px', fontSize: 11,
      fontWeight: 700, color: '#546E7A', borderBottom: '1px solid rgba(0,0,0,0.06)',
      textTransform: 'uppercase', letterSpacing: '0.05em',
    }}>
      {children}
    </th>
  );
}

function EmptyState({ message, action, onAction }) {
  return (
    <div style={{
      padding: '40px 24px', textAlign: 'center',
      background: 'rgba(255,255,255,0.6)', borderRadius: 10,
      border: '1px dashed rgba(0,0,0,0.12)',
    }}>
      <div style={{ fontSize: 13, color: '#90A4AE', marginBottom: action ? 14 : 0 }}>{message}</div>
      {action && (
        <button onClick={onAction} style={{
          background: '#FF7043', color: 'white', border: 'none', borderRadius: 8,
          padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
        }}>
          {action}
        </button>
      )}
    </div>
  );
}

function InlineError({ message }) {
  if (!message) return null;
  return (
    <div style={{
      background: '#FDECEA', border: '1px solid #FFCDD2', borderRadius: 8,
      padding: '10px 14px', fontSize: 13, color: '#C62828', marginBottom: 12,
    }}>
      {message}
    </div>
  );
}

// ─── Tab: My Documents ────────────────────────────────────────────────────────
function MyDocumentsTab({ docs, loading, error, onAdd, onDelete }) {
  const [filter, setFilter] = useState('All');
  const filters = ['All', ...DOC_TYPES];
  const visible = filter === 'All' ? docs : docs.filter(d => d.type === filter);

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <InlineError message={error} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            fontSize: 12, padding: '5px 14px', borderRadius: 20, border: '1px solid',
            borderColor: filter === f ? '#334155' : 'rgba(0,0,0,0.12)',
            background: filter === f ? '#334155' : 'transparent',
            color: filter === f ? 'white' : '#607D8B',
            cursor: 'pointer', fontWeight: 600,
          }}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: '#90A4AE', fontSize: 13, padding: 16 }}>Loading documents…</div>
      ) : visible.length === 0 ? (
        <EmptyState
          message={filter === 'All'
            ? 'No documents yet. Upload your first template, guide, or worksheet.'
            : `No ${filter.toLowerCase()}s uploaded yet.`}
          action={filter === 'All' ? '+ Upload document' : null}
          onAction={onAdd}
        />
      ) : (
        <div style={{ ...WHITE_CARD, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(250,250,250,0.8)' }}>
                  <TH>Name</TH><TH>Type</TH><TH>Client</TH><TH>Uploaded</TH><TH right>Actions</TH>
                </tr>
              </thead>
              <tbody>
                {visible.map(doc => (
                  <tr key={doc.id} style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: '#112033' }}>
                      {doc.url
                        ? <a href={doc.url} target="_blank" rel="noreferrer"
                            style={{ color: '#112033', textDecoration: 'none' }}>
                            {doc.title}
                          </a>
                        : doc.title}
                    </td>
                    <td style={{ padding: '11px 14px' }}><TypeTag type={doc.type} /></td>
                    <td style={{ padding: '11px 14px', fontSize: 12, color: '#607D8B' }}>
                      {doc.coachingClient?.name || '—'}
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: 12, color: '#607D8B' }}>
                      {formatDate(doc.uploadedAt)}
                    </td>
                    <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                      <button onClick={() => onDelete(doc.id)} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: 12, color: '#90A4AE', fontWeight: 600, padding: 0,
                      }}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Shared with Clients ─────────────────────────────────────────────────
function SharedTab({ docs, loading }) {
  const byClient = docs.reduce((acc, doc) => {
    const key = doc.coachingClientId;
    const name = doc.coachingClient?.name || 'Unknown client';
    if (!acc[key]) acc[key] = { name, docs: [] };
    acc[key].docs.push(doc);
    return acc;
  }, {});
  const groups = Object.values(byClient);

  if (loading) return <div style={{ color: '#90A4AE', fontSize: 13, padding: 16 }}>Loading…</div>;
  if (groups.length === 0) {
    return <EmptyState message="No documents uploaded yet. Documents will appear here organized by client." />;
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {groups.map(g => (
        <div key={g.name} style={{ ...WHITE_CARD, overflow: 'hidden' }}>
          <div style={{
            padding: '10px 14px', borderBottom: '1px solid rgba(0,0,0,0.06)',
            fontSize: 12, fontWeight: 700, color: '#334155',
            background: 'rgba(250,250,250,0.8)',
          }}>
            {g.name}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(250,250,250,0.8)' }}>
                <TH>Document</TH><TH>Type</TH><TH>Uploaded</TH>
              </tr>
            </thead>
            <tbody>
              {g.docs.map(doc => (
                <tr key={doc.id} style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                  <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: '#112033' }}>
                    {doc.url
                      ? <a href={doc.url} target="_blank" rel="noreferrer"
                          style={{ color: '#112033', textDecoration: 'none' }}>
                          {doc.title}
                        </a>
                      : doc.title}
                  </td>
                  <td style={{ padding: '10px 14px' }}><TypeTag type={doc.type} /></td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: '#607D8B' }}>
                    {formatDate(doc.uploadedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

// ─── Tab: Announcements ───────────────────────────────────────────────────────
const FT_ANNOUNCEMENTS = [
  {
    id: 1, date: 'Apr 5, 2026', category: 'Platform update',
    title: 'Coach onboarding improvements are live',
    body: 'A new intake flow and calendar sync are now available for all coaches. Head to the Calendar tab to set up your availability and sync your booking link.',
  },
  {
    id: 2, date: 'Mar 28, 2026', category: 'Coming soon',
    title: 'Resource library expanding in May',
    body: 'ForgeTomorrow will begin publishing curated coaching materials — salary benchmarks, role archetypes, and interview frameworks — available directly in your Resource Center.',
  },
];

function AnnouncementsTab() {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {FT_ANNOUNCEMENTS.map(a => (
        <div key={a.id} style={{ ...WHITE_CARD, padding: '16px 18px' }}>
          <div style={{
            fontSize: 11, color: '#90A4AE', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5,
          }}>
            {a.date} · {a.category}
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#112033', marginBottom: 7 }}>{a.title}</div>
          <div style={{ fontSize: 13, color: '#607D8B', lineHeight: 1.6 }}>{a.body}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Tab: Newsletter ──────────────────────────────────────────────────────────
function NewsletterTab() {
  return (
    <div style={{ ...WHITE_CARD, padding: '52px 32px', textAlign: 'center' }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#112033', marginBottom: 10 }}>
        Newsletter builder
      </div>
      <div style={{ fontSize: 13, color: '#607D8B', lineHeight: 1.65, maxWidth: 420, margin: '0 auto 16px' }}>
        Compose and send a broadcast message to all your active clients at once —
        great for session recaps, resource drops, or motivational check-ins.
        This feature is in development and will appear here when it launches.
      </div>
      <div style={{ fontSize: 11, color: '#B0BEC5' }}>
        In the meantime, use the Client Hub to message clients individually.
      </div>
    </div>
  );
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────
function UploadModal({ clients, onClose, onUploaded }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Template');
  const [clientId, setClientId] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');

  const inputStyle = {
    width: '100%', padding: '9px 12px', fontSize: 13, border: '1px solid #e0e0e0',
    borderRadius: 8, fontFamily: 'inherit', boxSizing: 'border-box', background: 'white',
  };

  async function handleUpload() {
    if (!title.trim()) { setError('Document name is required.'); return; }
    if (!clientId) { setError('Please select a client.'); return; }
    if (!file) { setError('Please select a file.'); return; }

    setUploading(true);
    setError('');
    setProgress('Uploading…');

    try {
      const form = new FormData();
      form.append('title', title.trim());
      form.append('type', type);
      form.append('coachingClientId', clientId);
      form.append('file', file);

      const res = await fetch('/api/coaching/documents', {
        method: 'POST',
        body: form,
        // No Content-Type header — browser sets it with boundary for multipart
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setProgress('');
      onUploaded(data.document);
      onClose();
    } catch (err) {
      setError(err.message);
      setProgress('');
      setUploading(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{ ...WHITE_CARD, padding: 28, width: 440, maxWidth: '90vw' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#112033', marginBottom: 18 }}>
          Upload document
        </div>
        <InlineError message={error} />
        <div style={{ display: 'grid', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#546E7A', display: 'block', marginBottom: 5 }}>
              Document name
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Intake session framework"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#546E7A', display: 'block', marginBottom: 5 }}>
              Type
            </label>
            <select value={type} onChange={e => setType(e.target.value)} style={inputStyle}>
              {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#546E7A', display: 'block', marginBottom: 5 }}>
              Client
            </label>
            <select value={clientId} onChange={e => setClientId(e.target.value)} style={inputStyle}>
              <option value="">Select a client…</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#546E7A', display: 'block', marginBottom: 5 }}>
              File
            </label>
            <input
              type="file"
              accept={ACCEPTED_TYPES}
              onChange={e => setFile(e.target.files[0] || null)}
              style={{ ...inputStyle, padding: '6px 12px', cursor: 'pointer' }}
            />
            <div style={{ fontSize: 11, color: '#90A4AE', marginTop: 5 }}>
              PDF, Word, Excel, or plain text · Max 20 MB
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 22, alignItems: 'center' }}>
          {progress && (
            <span style={{ fontSize: 12, color: '#607D8B', marginRight: 4 }}>{progress}</span>
          )}
          <button onClick={onClose} disabled={uploading} style={{
            background: 'none', border: '1px solid #e0e0e0', borderRadius: 8,
            padding: '8px 16px', fontSize: 13, cursor: 'pointer', color: '#607D8B',
          }}>
            Cancel
          </button>
          <button onClick={handleUpload} disabled={uploading} style={{
            background: '#FF7043', color: 'white', border: 'none', borderRadius: 8,
            padding: '8px 20px', fontSize: 13, fontWeight: 700,
            cursor: uploading ? 'not-allowed' : 'pointer',
            opacity: uploading ? 0.7 : 1, ...ORANGE_HEADING_LIFT,
          }}>
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CoachingResourcesPage() {
  useSession();

  const [activeTab, setActiveTab] = useState('docs');
  const [docs, setDocs] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUpload, setShowUpload] = useState(false);

  const TABS = [
    { id: 'docs',          label: 'My documents' },
    { id: 'shared',        label: 'Shared with clients' },
    { id: 'announcements', label: 'Announcements' },
    { id: 'newsletter',    label: 'Newsletter', soon: true },
  ];

  const loadDocs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/coaching/documents');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load documents');
      setDocs(data.documents);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadClients = useCallback(async () => {
    try {
      const res = await fetch('/api/coaching/clients');
      const data = await res.json();
      if (res.ok) setClients(data.clients || []);
    } catch (_) {}
  }, []);

  useEffect(() => {
    loadDocs();
    loadClients();
  }, [loadDocs, loadClients]);

  async function handleDelete(id) {
    if (!confirm('Delete this document? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/coaching/documents/${id}`, { method: 'DELETE' });
      if (res.ok) setDocs(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      console.error('[delete doc]', err);
    }
  }

  return (
    <CoachingLayout
      title="Resource Center | ForgeTomorrow"
      activeNav="resources"
      contentFullBleed
      sidebarInitialOpen={{ coaching: true, seeker: false }}
    >
      {showUpload && (
        <UploadModal
          clients={clients}
          onClose={() => setShowUpload(false)}
          onUploaded={doc => setDocs(prev => [doc, ...prev])}
        />
      )}

      <div style={{ width: '100%', padding: 0, margin: 0, paddingRight: 16, boxSizing: 'border-box' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `minmax(0,1fr) ${RIGHT_COL_WIDTH}px`,
          gridTemplateRows: 'auto auto',
          gap: GAP, width: '100%', minWidth: 0, boxSizing: 'border-box',
        }}>

          {/* Title card */}
          <CoachingTitleCard
            title="Resource Center"
            subtitle="Your documents, client materials, and coaching resources — all in one place."
            style={{ gridColumn: '1/2', gridRow: '1' }}
          />

          {/* Right rail */}
          <aside style={{
            gridColumn: '2/3', gridRow: '1/3',
            display: 'flex', flexDirection: 'column', gap: GAP,
            alignSelf: 'stretch', boxSizing: 'border-box',
          }}>
            <RightRailPlacementManager slot="right_rail_1" />
          </aside>

          {/* Main content */}
          <div style={{ gridColumn: '1/2', gridRow: '2', ...GLASS, padding: 0, overflow: 'hidden' }}>

            {/* Tab bar */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderBottom: '1px solid rgba(255,255,255,0.3)',
              padding: '0 20px', background: 'rgba(255,255,255,0.35)',
            }}>
              <div style={{ display: 'flex' }}>
                {TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: '14px 16px', fontSize: 13, fontFamily: 'inherit',
                      fontWeight: activeTab === tab.id ? 900 : 600,
                      color: activeTab === tab.id ? '#FF7043' : '#607D8B',
                      borderBottom: activeTab === tab.id ? '2px solid #FF7043' : '2px solid transparent',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    {tab.label}
                    {tab.soon && (
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 6,
                        background: '#F1EFE8', color: '#888780',
                        letterSpacing: '0.04em', textTransform: 'uppercase',
                      }}>
                        soon
                      </span>
                    )}
                  </button>
                ))}
              </div>
              {activeTab === 'docs' && (
                <button onClick={() => setShowUpload(true)} style={{
                  background: '#FF7043', color: 'white', border: 'none', borderRadius: 8,
                  padding: '7px 16px', fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit', ...ORANGE_HEADING_LIFT,
                }}>
                  + Upload
                </button>
              )}
            </div>

            {/* Tab content */}
            <div style={{ padding: 20 }}>
              {activeTab === 'docs' && (
                <MyDocumentsTab
                  docs={docs} loading={loading} error={error}
                  onAdd={() => setShowUpload(true)} onDelete={handleDelete}
                />
              )}
              {activeTab === 'shared' && <SharedTab docs={docs} loading={loading} />}
              {activeTab === 'announcements' && <AnnouncementsTab />}
              {activeTab === 'newsletter' && <NewsletterTab />}
            </div>
          </div>

        </div>
      </div>
    </CoachingLayout>
  );
}