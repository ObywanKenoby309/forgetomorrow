// pages/dashboard/forge-vault.js
// ForgeVault — professional document workspace.
// Three tabs: Forge Documents | Uploaded Documents | Shared With Me
// View + Category dropdowns within Forge Documents tab.

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import Head from 'next/head';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import SeekerTitleCard from '@/components/seeker/SeekerTitleCard';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';
import { getTimeGreeting } from '@/lib/dashboardGreeting';

// ─── Design tokens ────────────────────────────────────────────────────────────
const GLASS = {
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.58)',
  boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};
const ORANGE_HEADING_LIFT = {
  textShadow: '0 2px 4px rgba(15,23,42,0.65), 0 1px 2px rgba(0,0,0,0.4)',
  fontWeight: 900,
};
const GAP = 12;

// ─── Workspace + category config ──────────────────────────────────────────────
const WORKSPACE_CONFIG = {
  seeker: {
    label: 'Seeker',
    categories: {
      all:     { label: 'All seeker documents' },
      seeking: { label: 'Seeking' },
      career:  { label: 'Career' },
    },
  },
  coach: {
    label: 'Coach',
    categories: {
      all:      { label: 'All coaching documents' },
      coaching: { label: 'Coaching' },
    },
  },
  recruiter: {
    label: 'Recruiter',
    categories: {
      all:          { label: 'All recruiter documents' },
      candidates:   { label: 'Candidate packages' },
      intelligence: { label: 'Candidate intelligence' },
    },
  },
};

const TYPE_META = {
  resume:          { label: 'Resume',                  bg: 'rgba(255,112,67,0.10)',  color: '#993C1D' },
  cover:           { label: 'Cover letter',             bg: 'rgba(33,150,243,0.10)',  color: '#185FA5' },
  interview:       { label: 'Interview prep',           bg: 'rgba(76,175,80,0.10)',   color: '#27500A' },
  profile:         { label: 'Operating profile',        bg: 'rgba(156,39,176,0.10)',  color: '#6A1B9A' },
  roadmap:         { label: 'Roadmap',                  bg: 'rgba(0,188,212,0.10)',   color: '#006064' },
  negotiation:     { label: 'Negotiation brief',        bg: 'rgba(255,193,7,0.12)',   color: '#633806' },
  packet:          { label: 'Application packet',       bg: 'rgba(96,125,139,0.10)', color: '#37474F' },
  strategy:        { label: 'Target strategy',          bg: 'rgba(33,150,243,0.10)',  color: '#185FA5' },
  candidateReview: { label: 'Candidate review packet',  bg: 'rgba(255,112,67,0.12)', color: '#7A2A0E' },
  resumeRole:      { label: 'Resume vs role analysis',  bg: 'rgba(76,175,80,0.12)',   color: '#2E7D32' },
};

const TYPE_CATEGORY = {
  resume: 'seeking', cover: 'seeking', interview: 'seeking', packet: 'seeking',
  profile: 'career', roadmap: 'career', negotiation: 'career',
  strategy: 'coaching', candidateReview: 'candidates', resumeRole: 'intelligence',
};

const WORKSPACE_BADGE = {
  seeker:    { bg: 'rgba(255,112,67,0.10)',  color: '#993C1D',  label: 'Seeker'    },
  coach:     { bg: 'rgba(33,150,243,0.10)',  color: '#185FA5',  label: 'Coach'     },
  recruiter: { bg: 'rgba(96,125,139,0.10)', color: '#37474F',  label: 'Recruiter' },
};

const CATEGORY_LABELS = {
  seeking: 'Seeking', career: 'Career', coaching: 'Coaching',
  candidates: 'Candidate packages', intelligence: 'Candidate intelligence',
};

const TYPE_ICON = {
  resume: '📄', cover: '✉️', interview: '🎯', profile: '🧠',
  roadmap: '🗺️', negotiation: '🤝', packet: '📦',
  strategy: '🏹', candidateReview: '🧾', resumeRole: '📊',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(raw) {
  if (!raw) return '—';
  try {
    return new Date(raw).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return '—'; }
}

function formatBytes(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function safeText(v, fallback = '') {
  const s = String(v || '').trim();
  return s || fallback;
}

function downloadText(filename, content) {
  try {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); document.body.removeChild(a); }, 500);
  } catch (e) { console.error('[ForgeVault] downloadText error', e); }
}

function downloadJson(filename, obj) {
  downloadText(filename, JSON.stringify(obj, null, 2));
}

// ─── Normalizers ──────────────────────────────────────────────────────────────
function normalizeResumes(resumes = []) {
  return resumes.map((r) => ({
    id: `resume-${r.id}`, type: 'resume', workspace: 'seeker', category: 'seeking',
    typeLabel: TYPE_META.resume.label, name: safeText(r.name, 'Untitled Resume'),
    subtitle: r.isPrimary ? '★ Primary' : null, date: r.updatedAt,
    downloadUrl: `/api/resume/download?id=${r.id}`, hasPdf: false, raw: r,
    sharePayload: { forgeDocType: 'resume', forgeDocId: String(r.id), fileName: safeText(r.name, 'Resume'), downloadUrl: `/api/resume/download?id=${r.id}` },
  }));
}

function normalizeCovers(covers = []) {
  return covers.map((c) => ({
    id: `cover-${c.id}`, type: 'cover', workspace: 'seeker', category: 'seeking',
    typeLabel: TYPE_META.cover.label, name: safeText(c.name, 'Untitled Cover Letter'),
    subtitle: c.isPrimary ? '★ Primary' : null, date: c.updatedAt,
    downloadFn: async () => {
      const res = await fetch(`/api/cover/download?id=${c.id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Download failed');
      const data = await res.json();
      const content = safeText(data?.cover?.content, JSON.stringify(data?.cover || {}, null, 2));
      downloadText(`${safeText(c.name, 'cover_letter').replace(/[^a-z0-9_-]+/gi, '_')}.txt`, content);
    },
    hasPdf: false, raw: c,
    sharePayload: { forgeDocType: 'cover', forgeDocId: String(c.id), fileName: safeText(c.name, 'Cover Letter') },
  }));
}

function normalizeInterviewPreps(preps = []) {
  return preps.map((p) => ({
    id: `interview-${p.id}`, type: 'interview', workspace: 'seeker', category: 'seeking',
    typeLabel: TYPE_META.interview.label,
    name: safeText(p.name, `Interview Prep · App #${p.applicationId}`),
    subtitle: p.jobTitle ? `for ${p.jobTitle}` : null, date: p.generatedAt,
    downloadFn: () => downloadJson(`interview_prep_${p.applicationId}.json`, p.result || p),
    hasPdf: false, raw: p,
    sharePayload: { forgeDocType: 'interview', forgeDocId: p.id, fileName: safeText(p.name, 'Interview Prep') },
  }));
}

function normalizeProfile(profile) {
  if (!profile) return [];
  return [{
    id: 'profile-pop', type: 'profile', workspace: 'seeker', category: 'career',
    typeLabel: TYPE_META.profile.label, name: 'Professional Operating Profile', subtitle: null,
    date: profile.updatedAt,
    downloadFn: () => downloadJson('professional_operating_profile.json', profile.snapshotJson || profile),
    hasPdf: false, raw: profile,
    sharePayload: { forgeDocType: 'profile', forgeDocId: profile.id, fileName: 'Professional Operating Profile' },
  }];
}

function normalizeRoadmaps(roadmaps = []) {
  return roadmaps.map((r) => ({
    id: `roadmap-${r.id}`, type: 'roadmap', workspace: 'seeker', category: 'career',
    typeLabel: TYPE_META.roadmap.label, name: safeText(r.name, 'Growth & Pivot Roadmap'),
    subtitle: safeText(r.title, null), date: r.createdAt,
    downloadFn: () => downloadJson(`growth_pivot_roadmap_${r.id}.json`, r.raw || r),
    hasPdf: false, raw: r,
    sharePayload: { forgeDocType: 'roadmap', forgeDocId: r.id, fileName: safeText(r.name, 'Growth & Pivot Roadmap') },
  }));
}

function normalizeNegotiations(negotiations = []) {
  return negotiations.map((n) => ({
    id: `negotiation-${n.id}`, type: 'negotiation', workspace: 'seeker', category: 'career',
    typeLabel: TYPE_META.negotiation.label, name: safeText(n.name, 'Offer & Negotiation Brief'),
    subtitle: null, date: n.createdAt,
    downloadFn: () => downloadJson(`negotiation_brief_${n.id}.json`, n.raw || n),
    hasPdf: n.hasPdf || false, raw: n,
    sharePayload: { forgeDocType: 'negotiation', forgeDocId: n.id, fileName: safeText(n.name, 'Negotiation Brief') },
  }));
}

function normalizePackets(packets = []) {
  return packets.map((p) => ({
    id: `packet-${p.id}`, type: 'packet', workspace: 'seeker', category: 'seeking',
    typeLabel: TYPE_META.packet.label, name: safeText(p.name, 'Application Packet'),
    subtitle: [p.company, p.title].filter(Boolean).join(' · ') || null, date: p.updatedAt,
    downloadUrl: p.latestExport?.url || null, hasPdf: Boolean(p.latestExport?.url), raw: p,
    sharePayload: { forgeDocType: 'packet', forgeDocId: String(p.id), fileName: safeText(p.name, 'Application Packet'), downloadUrl: p.latestExport?.url || null },
  }));
}

function normalizeStrategies(strategies = []) {
  return strategies.map((s) => ({
    id: `strategy-${s.id}`, type: 'strategy', workspace: 'coach', category: 'coaching',
    typeLabel: TYPE_META.strategy.label, name: safeText(s.title, 'Target Strategy'),
    subtitle: s.summary ? s.summary.slice(0, 72) + (s.summary.length > 72 ? '…' : '') : null,
    date: s.updatedAt, downloadUrl: s.downloadUrl || null, hasPdf: false, raw: s,
    sharePayload: { forgeDocType: 'strategy', forgeDocId: s.id, fileName: safeText(s.title, 'Target Strategy'), downloadUrl: s.downloadUrl || null },
  }));
}

function normalizeCandidateReviewPackets(packets = []) {
  return packets.map((p) => {
    const candidateName = safeText(p.candidateName, 'Candidate');
    const downloadUrl = p.packetUrl || (p.candidateUserId ? `/api/recruiter/candidates/${p.candidateUserId}/review-packet` : null);
    return {
      id: `candidate-review-${p.id}`, type: 'candidateReview', workspace: 'recruiter', category: 'candidates',
      typeLabel: TYPE_META.candidateReview.label,
      name: safeText(p.title, `${candidateName} · Candidate Review Packet`),
      subtitle: candidateName, date: p.updatedAt || p.createdAt, downloadUrl, hasPdf: true, raw: p,
      sharePayload: { forgeDocType: 'candidateReview', forgeDocId: p.id, fileName: safeText(p.title, 'Candidate Review Packet'), downloadUrl },
    };
  });
}

function normalizeResumeRoleAnalyses(analyses = []) {
  return analyses.map((a) => ({
    id: `resume-role-${a.id}`, type: 'resumeRole', workspace: 'recruiter', category: 'intelligence',
    typeLabel: TYPE_META.resumeRole.label, name: a.title || 'Resume vs Role Analysis',
    subtitle: a.candidateName || null, date: a.updatedAt || a.createdAt,
    downloadFn: () => downloadJson(`resume_role_analysis_${a.id}.json`, a.result || a),
    hasPdf: false, raw: a,
    sharePayload: { forgeDocType: 'resumeRole', forgeDocId: a.id, fileName: a.title || 'Resume vs Role Analysis' },
  }));
}

// ─── Shared UI components ──────────────────────────────────────────────────────
function WorkspaceBadge({ workspace }) {
  const wb = WORKSPACE_BADGE[workspace] || { bg: 'rgba(0,0,0,0.06)', color: '#546E7A', label: workspace };
  return (
    <span style={{
      display: 'inline-block', alignSelf: 'flex-start', width: 'fit-content',
      fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999,
      background: wb.bg, color: wb.color, whiteSpace: 'nowrap',
    }}>
      {wb.label}
    </span>
  );
}

function TypeLabel({ type }) {
  const meta = TYPE_META[type] || { label: type, color: '#546E7A' };
  return (
    <span style={{ fontSize: 10, fontWeight: 600, color: meta.color, whiteSpace: 'nowrap' }}>
      {meta.label}
    </span>
  );
}

function CategoryLabel({ type, workspace }) {
  const category = TYPE_CATEGORY[type];
  const label = CATEGORY_LABELS[category] || category || '';
  const wb = WORKSPACE_BADGE[workspace] || { color: '#546E7A' };
  if (!label) return null;
  return (
    <span style={{ fontSize: 10, fontWeight: 600, color: wb.color, whiteSpace: 'nowrap', alignSelf: 'flex-start', width: 'fit-content' }}>
      {label}
    </span>
  );
}

// ─── DownloadButton ───────────────────────────────────────────────────────────
function DownloadButton({ doc }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const handle = useCallback(async () => {
    if (busy) return;
    setErr(null); setBusy(true);
    try {
      if (doc.downloadUrl) window.open(doc.downloadUrl, '_blank', 'noopener');
      else if (doc.downloadFn) await doc.downloadFn();
    } catch (e) {
      setErr('Download failed');
      console.error('[ForgeVault] download error', e);
    } finally { setBusy(false); }
  }, [doc, busy]);

  const canDownload = Boolean(doc.downloadUrl || doc.downloadFn);
  if (!canDownload) {
    return (
      <button disabled style={{
        padding: '5px 10px', borderRadius: 8,
        border: '1px solid rgba(0,0,0,0.08)', background: 'transparent',
        color: '#B0BEC5', fontSize: 11, fontWeight: 700, cursor: 'not-allowed',
      }}>↓ Download</button>
    );
  }
  return (
    <div>
      <button onClick={handle} disabled={busy} title={err || 'Download document'} style={{
        display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8,
        border: '1px solid rgba(255,112,67,0.30)',
        background: busy ? 'rgba(255,112,67,0.06)' : 'rgba(255,112,67,0.08)',
        color: err ? '#E53935' : '#FF7043', fontSize: 11, fontWeight: 700,
        cursor: busy ? 'wait' : 'pointer', transition: 'all 150ms ease', whiteSpace: 'nowrap',
      }}>
        {busy ? '…' : '↓'} {busy ? 'Downloading' : 'Download'}
      </button>
      {err && <div style={{ fontSize: 10, color: '#E53935', marginTop: 2 }}>{err}</div>}
    </div>
  );
}

// ─── SharePanel — slide-in right rail ────────────────────────────────────────
// Shows who a doc is shared with, lets sender add recipients and revoke access.
function SharePanel({ doc, onClose }) {
  const [tab, setTab] = useState('sharedWith'); // 'sharedWith' | 'add'
  const [shares, setShares] = useState([]);
  const [loadingShares, setLoadingShares] = useState(true);
  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [selectedContact, setSelectedContact] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [revoking, setRevoking] = useState(null); // shareId being revoked
  const [removingAll, setRemovingAll] = useState(false);

  const sp = doc.sharePayload || {};

  // Build query params for shares list
  const sharesQuery = sp.vaultUploadId
    ? `uploadId=${sp.vaultUploadId}`
    : `docType=${sp.forgeDocType}&docId=${sp.forgeDocId}`;

  const loadShares = useCallback(() => {
    setLoadingShares(true);
    fetch(`/api/vault/shares/list?${sharesQuery}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { setShares(data?.shares || []); setLoadingShares(false); })
      .catch(() => setLoadingShares(false));
  }, [sharesQuery]);

  useEffect(() => { loadShares(); }, [loadShares]);

  useEffect(() => {
    fetch('/api/contacts/list', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const list = data?.contacts || data?.members || [];
        const seen = new Set();
        const deduped = list.filter(c => {
          const id = c.userId || c.contactUserId || c.id;
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        });
        setContacts(deduped);
        setLoadingContacts(false);
      })
      .catch(() => setLoadingContacts(false));
  }, []);

  const handleSend = async () => {
    if (!selectedContact || sending) return;
    setSending(true); setSendError(null);
    try {
      const payload = {
        toUserId: selectedContact,
        message: message.trim() || undefined,
        ...sp,
      };
      const res = await fetch('/api/vault/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Share failed'); }
      setSent(true);
      setSelectedContact(''); setMessage('');
      setTimeout(() => { setSent(false); setTab('sharedWith'); loadShares(); }, 1200);
    } catch (e) { setSendError(e.message || 'Share failed'); }
    finally { setSending(false); }
  };

  const handleRevoke = async (shareId) => {
    if (revoking) return;
    setRevoking(shareId);
    try {
      await fetch('/api/vault/shares/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ shareId }),
      });
      setShares(prev => prev.filter(s => s.id !== shareId));
    } catch {}
    finally { setRevoking(null); }
  };

  const handleRemoveAll = async () => {
    if (!confirm('Remove access for everyone? This cannot be undone.')) return;
    setRemovingAll(true);
    try {
      const body = sp.vaultUploadId
        ? { revokeAll: true, uploadId: sp.vaultUploadId }
        : { revokeAll: true, docType: sp.forgeDocType, docId: sp.forgeDocId };
      await fetch('/api/vault/shares/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      setShares([]);
    } catch {}
    finally { setRemovingAll(false); }
  };

  const ROLE_BADGE = {
    SEEKER: { bg: 'rgba(255,112,67,0.10)', color: '#993C1D' },
    COACH: { bg: 'rgba(33,150,243,0.10)', color: '#185FA5' },
    RECRUITER: { bg: 'rgba(96,125,139,0.10)', color: '#37474F' },
  };

  const panelStyle = {
    position: 'fixed', top: 0, right: 0, bottom: 0,
    width: 'min(380px, 96vw)', zIndex: 99999,
    background: 'rgba(255,255,255,0.97)',
    backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
    boxShadow: '-8px 0 32px rgba(0,0,0,0.18)',
    borderLeft: '1px solid rgba(0,0,0,0.08)',
    display: 'flex', flexDirection: 'column',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 99998 }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.30)' }} />

      {/* Panel */}
      <div style={panelStyle}>
        {/* Header */}
        <div style={{ padding: '18px 18px 12px', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#112033', lineHeight: 1.2 }}>Sharing</div>
              <div style={{ fontSize: 11, color: '#78909C', marginTop: 3, fontWeight: 600,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>
                {doc.name}
              </div>
            </div>
            <button onClick={onClose} style={{
              border: 'none', background: 'transparent', fontSize: 22,
              cursor: 'pointer', color: '#90A4AE', lineHeight: 1, flexShrink: 0, padding: 2,
            }}>×</button>
          </div>

          {/* Tab switcher */}
          <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
            {[
              { key: 'sharedWith', label: `Shared with${shares.length ? ` (${shares.length})` : ''}` },
              { key: 'add', label: '+ Add recipient' },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                fontSize: 12, fontWeight: tab === t.key ? 800 : 600,
                padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
                background: tab === t.key ? '#FF7043' : 'rgba(0,0,0,0.06)',
                color: tab === t.key ? '#fff' : '#546E7A',
                transition: 'all 120ms ease',
              }}>{t.label}</button>
            ))}
          </div>
        </div>

        {/* Body — scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px' }}>

          {/* ── Shared With tab ── */}
          {tab === 'sharedWith' && (
            <>
              {loadingShares ? (
                <div style={{ color: '#90A4AE', fontSize: 13, paddingTop: 20, textAlign: 'center' }}>Loading…</div>
              ) : shares.length === 0 ? (
                <div style={{ paddingTop: 30, textAlign: 'center' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>🔒</div>
                  <div style={{ fontSize: 13, color: '#546E7A', fontWeight: 700 }}>Not shared yet</div>
                  <div style={{ fontSize: 11, color: '#90A4AE', marginTop: 4 }}>Only you can see this document.</div>
                  <button onClick={() => setTab('add')} style={{
                    marginTop: 14, fontSize: 12, fontWeight: 800, padding: '8px 18px',
                    borderRadius: 8, border: 'none', background: '#FF7043', color: '#fff', cursor: 'pointer',
                  }}>+ Share with someone</button>
                </div>
              ) : (
                <>
                  {shares.map(s => {
                    const rb = ROLE_BADGE[s.role?.toUpperCase()] || { bg: 'rgba(0,0,0,0.06)', color: '#546E7A' };
                    return (
                      <div key={s.id} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.05)',
                      }}>
                        {/* Avatar */}
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                          background: rb.bg, display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: 13, fontWeight: 800, color: rb.color,
                        }}>
                          {s.name.charAt(0).toUpperCase()}
                        </div>

                        {/* Name + meta */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#112033',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {s.name}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2, flexWrap: 'wrap' }}>
                            {s.role && (
                              <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px',
                                borderRadius: 999, background: rb.bg, color: rb.color, textTransform: 'uppercase' }}>
                                {s.role}
                              </span>
                            )}
                            <span style={{ fontSize: 10, color: '#90A4AE' }}>
                              {s.origin === 'foundry' ? '⚡ Foundry · ' : ''}{formatDate(s.createdAt)}
                            </span>
                            {s.hasRead
                              ? <span style={{ fontSize: 10, color: '#4CAF50' }}>✓ Viewed</span>
                              : <span style={{ fontSize: 10, color: '#FF7043' }}>● Unread</span>
                            }
                          </div>
                          {s.message && (
                            <div style={{ fontSize: 10, color: '#78909C', marginTop: 2, fontStyle: 'italic' }}>
                              "{s.message}"
                            </div>
                          )}
                        </div>

                        {/* Revoke */}
                        <button
                          onClick={() => handleRevoke(s.id)}
                          disabled={revoking === s.id}
                          style={{
                            fontSize: 11, fontWeight: 700, padding: '4px 9px', borderRadius: 6,
                            border: '1px solid rgba(229,57,53,0.25)', background: 'transparent',
                            color: '#E53935', cursor: revoking === s.id ? 'wait' : 'pointer',
                            flexShrink: 0, whiteSpace: 'nowrap',
                          }}
                        >
                          {revoking === s.id ? '…' : 'Revoke'}
                        </button>
                      </div>
                    );
                  })}
                </>
              )}
            </>
          )}

          {/* ── Add recipient tab ── */}
          {tab === 'add' && (
            <>
              {sent ? (
                <div style={{ paddingTop: 30, textAlign: 'center' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>✓</div>
                  <div style={{ fontSize: 14, color: '#2E7D32', fontWeight: 800 }}>Shared!</div>
                  <div style={{ fontSize: 12, color: '#78909C', marginTop: 4 }}>A PDF copy is being prepared.</div>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#78909C', marginBottom: 6 }}>Share with</div>
                    {loadingContacts ? (
                      <div style={{ fontSize: 12, color: '#90A4AE' }}>Loading contacts…</div>
                    ) : contacts.length === 0 ? (
                      <div style={{ fontSize: 12, color: '#90A4AE' }}>No contacts yet. Connect with someone first.</div>
                    ) : (
                      <select value={selectedContact} onChange={e => setSelectedContact(e.target.value)} style={{
                        width: '100%', fontSize: 13, padding: '9px 10px', borderRadius: 8,
                        border: '1px solid rgba(0,0,0,0.14)', background: '#fff', color: '#112033', outline: 'none',
                      }}>
                        <option value="">Select a contact…</option>
                        {contacts.map(c => {
                          const name = c.name || [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email || 'Contact';
                          const id = c.userId || c.contactUserId || c.id;
                          const role = c.role ? ` · ${c.role.charAt(0) + c.role.slice(1).toLowerCase()}` : '';
                          return <option key={id} value={id}>{name}{role}</option>;
                        })}
                      </select>
                    )}
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#78909C', marginBottom: 6 }}>Message (optional)</div>
                    <textarea value={message} onChange={e => setMessage(e.target.value)}
                      placeholder="Add a note…" rows={3}
                      style={{
                        width: '100%', fontSize: 12, padding: '9px 10px', borderRadius: 8,
                        border: '1px solid rgba(0,0,0,0.14)', background: '#fff',
                        color: '#112033', outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                      }} />
                  </div>

                  {/* PDF note */}
                  <div style={{
                    fontSize: 11, color: '#78909C', marginBottom: 14, padding: '8px 10px',
                    background: 'rgba(255,112,67,0.05)', borderRadius: 8, borderLeft: '3px solid rgba(255,112,67,0.40)',
                  }}>
                    Recipient receives a <strong>view-only PDF</strong>. They cannot edit or regenerate the document.
                  </div>

                  {sendError && (
                    <div style={{ fontSize: 11, color: '#E53935', marginBottom: 10, fontWeight: 600,
                      padding: '6px 10px', background: 'rgba(229,57,53,0.06)', borderRadius: 8 }}>
                      {sendError}
                    </div>
                  )}

                  <button onClick={handleSend} disabled={!selectedContact || sending || contacts.length === 0} style={{
                    width: '100%', padding: '11px', borderRadius: 8, border: 'none',
                    fontSize: 13, fontWeight: 800,
                    cursor: selectedContact && !sending ? 'pointer' : 'not-allowed',
                    background: selectedContact && !sending ? '#FF7043' : 'rgba(0,0,0,0.08)',
                    color: selectedContact && !sending ? '#fff' : '#90A4AE',
                    transition: 'all 150ms ease',
                  }}>
                    {sending ? 'Preparing PDF & sending…' : 'Share'}
                  </button>
                </>
              )}
            </>
          )}
        </div>

        {/* Footer — Remove All */}
        {tab === 'sharedWith' && shares.length > 0 && (
          <div style={{ padding: '12px 18px', borderTop: '1px solid rgba(0,0,0,0.07)' }}>
            <button onClick={handleRemoveAll} disabled={removingAll} style={{
              width: '100%', padding: '9px', borderRadius: 8, fontSize: 12, fontWeight: 700,
              border: '1px solid rgba(229,57,53,0.25)', background: 'transparent',
              color: '#E53935', cursor: removingAll ? 'wait' : 'pointer', transition: 'all 150ms',
            }}>
              {removingAll ? 'Removing…' : 'Remove All Access'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── VaultRow (Forge Documents) ───────────────────────────────────────────────
function VaultRow({ doc, isMobile, showWorkspace }) {
  const meta = TYPE_META[doc.type] || { bg: 'rgba(0,0,0,0.05)', color: '#546E7A' };

  const meta = TYPE_META[doc.type] || { bg: 'rgba(0,0,0,0.05)', color: '#546E7A' };
  const [panelOpen, setPanelOpen] = useState(false);

  return (
    <>
      <div
        style={{
          display: 'flex', alignItems: isMobile ? 'flex-start' : 'center',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 10 : 0, padding: '11px 14px',
          borderBottom: '1px solid rgba(0,0,0,0.05)', transition: 'background 120ms ease',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.55)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8, flexShrink: 0,
            background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 15, lineHeight: 1 }}>{TYPE_ICON[doc.type] || '📄'}</span>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: 13, fontWeight: 800, color: '#112033',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              maxWidth: isMobile ? '75vw' : 300,
            }}>
              {doc.name}
            </div>
            {doc.subtitle && (
              <div style={{ fontSize: 11, color: '#78909C', fontWeight: 600, marginTop: 1 }}>
                {doc.subtitle}
              </div>
            )}
          </div>
        </div>

        <div style={{
          flexShrink: 0, width: isMobile ? 'auto' : 150,
          paddingLeft: isMobile ? 44 : 0,
          display: 'flex', flexDirection: 'column', gap: 3,
        }}>
          {showWorkspace
            ? <WorkspaceBadge workspace={doc.workspace} />
            : <CategoryLabel type={doc.type} workspace={doc.workspace} />
          }
          <TypeLabel type={doc.type} />
        </div>

        <div style={{
          flexShrink: 0, width: isMobile ? 'auto' : 100,
          paddingLeft: isMobile ? 44 : 0,
          fontSize: 11, color: '#546E7A', fontWeight: 600,
        }}>
          {formatDate(doc.date)}
        </div>

        <div style={{
          flexShrink: 0, width: isMobile ? 'auto' : 110,
          paddingLeft: isMobile ? 44 : 12, display: 'flex', alignItems: 'center',
        }}>
          <DownloadButton doc={doc} />
        </div>

        {!isMobile && (
          <div style={{
            flexShrink: 0, width: 110, paddingLeft: 12,
            display: 'flex', alignItems: 'center',
          }}>
            <button
              onClick={() => setPanelOpen(true)}
              style={{
                fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 8,
                border: '1px solid rgba(0,0,0,0.12)', background: 'transparent',
                color: '#546E7A', cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'all 120ms ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,112,67,0.08)'; e.currentTarget.style.color = '#FF7043'; e.currentTarget.style.borderColor = 'rgba(255,112,67,0.30)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#546E7A'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)'; }}
            >
              + Share
            </button>
          </div>
        )}
      </div>
      {panelOpen && <SharePanel doc={doc} onClose={() => setPanelOpen(false)} />}
    </>
  );
}

// ─── SectionDivider ───────────────────────────────────────────────────────────
function SectionDivider({ workspace }) {
  const wb = WORKSPACE_BADGE[workspace] || { label: workspace, bg: 'rgba(0,0,0,0.04)', color: '#546E7A' };
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 14px 6px 14px', background: 'rgba(255,255,255,0.30)',
      borderBottom: '1px solid rgba(0,0,0,0.05)',
    }}>
      <span style={{
        fontSize: 10, fontWeight: 800, letterSpacing: '0.06em',
        textTransform: 'uppercase', color: wb.color,
        background: wb.bg, padding: '2px 8px', borderRadius: 999,
        alignSelf: 'flex-start', width: 'fit-content',
      }}>
        {wb.label} workspace
      </span>
    </div>
  );
}

// ─── ColumnHeader ─────────────────────────────────────────────────────────────
function ColumnHeader({ viewFilter, showShare = true }) {
  const typeColLabel = viewFilter === 'all' ? 'Workspace / Type' : 'Type';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', padding: '6px 14px',
      fontSize: 10, fontWeight: 800, color: '#90A4AE',
      letterSpacing: '0.06em', textTransform: 'uppercase',
      background: 'rgba(255,255,255,0.30)', borderBottom: '1px solid rgba(0,0,0,0.05)',
    }}>
      <div style={{ flex: 1 }}>Document</div>
      <div style={{ width: 150 }}>{typeColLabel}</div>
      <div style={{ width: 100 }}>Updated</div>
      <div style={{ width: 110, paddingLeft: 12 }}>Actions</div>
      {showShare && <div style={{ width: 110, paddingLeft: 12 }}>Share With</div>}
    </div>
  );
}

// ─── ForgeDocumentsTable ──────────────────────────────────────────────────────
function ForgeDocumentsTable({ docs, loading, isMobile, viewFilter }) {
  if (loading) {
    return <div style={{ padding: '36px 0', textAlign: 'center', color: '#90A4AE', fontSize: 13 }}>Loading your documents…</div>;
  }
  if (!docs.length) {
    return (
      <div style={{ padding: '44px 0', textAlign: 'center' }}>
        <div style={{ fontSize: 30, marginBottom: 10 }}>📭</div>
        <div style={{ fontSize: 14, color: '#546E7A', fontWeight: 700 }}>No documents here yet.</div>
        <div style={{ fontSize: 12, color: '#90A4AE', marginTop: 4 }}>Documents appear here as you create them across ForgeTomorrow.</div>
      </div>
    );
  }

  const showDividers = viewFilter === 'all';
  const showWorkspaceBadge = viewFilter === 'all';

  if (!showDividers) {
    return (
      <div>
        {!isMobile && <ColumnHeader viewFilter={viewFilter} />}
        {docs.map(doc => <VaultRow key={doc.id} doc={doc} isMobile={isMobile} showWorkspace={showWorkspaceBadge} />)}
      </div>
    );
  }

  const WS_ORDER = ['seeker', 'coach', 'recruiter'];
  const grouped = {};
  docs.forEach(d => {
    if (!grouped[d.workspace]) grouped[d.workspace] = [];
    grouped[d.workspace].push(d);
  });

  return (
    <div>
      {!isMobile && <ColumnHeader viewFilter={viewFilter} />}
      {WS_ORDER.filter(ws => grouped[ws]?.length).map(ws => (
        <React.Fragment key={ws}>
          <SectionDivider workspace={ws} />
          {grouped[ws].map(doc => <VaultRow key={doc.id} doc={doc} isMobile={isMobile} showWorkspace={true} />)}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── ControlsBar ──────────────────────────────────────────────────────────────
function ControlsBar({ viewFilter, setViewFilter, catFilter, setCatFilter, searchTerm, setSearchTerm, sortMode, setSortMode, availableWorkspaces }) {
  const catOptions = useMemo(() => {
    if (viewFilter === 'all') return [{ value: 'all', label: 'All documents' }];
    const ws = WORKSPACE_CONFIG[viewFilter];
    if (!ws) return [{ value: 'all', label: 'All documents' }];
    return Object.entries(ws.categories).map(([k, v]) => ({ value: k, label: v.label }));
  }, [viewFilter]);

  const handleViewChange = e => { setViewFilter(e.target.value); setCatFilter('all'); };

  const selectStyle = {
    fontSize: 12, fontWeight: 600, padding: '7px 10px', borderRadius: 8,
    border: '1px solid rgba(0,0,0,0.12)', background: 'rgba(255,255,255,0.88)',
    color: '#263238', outline: 'none', cursor: 'pointer',
  };
  const labelStyle = { fontSize: 11, fontWeight: 700, color: '#78909C', whiteSpace: 'nowrap' };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8,
      padding: '12px 14px', borderBottom: '1px solid rgba(0,0,0,0.07)',
      background: 'rgba(255,255,255,0.30)',
    }}>
      <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 160 }}>
        <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#90A4AE', pointerEvents: 'none' }}>🔍</span>
        <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search documents, companies, titles…"
          style={{ ...selectStyle, width: '100%', paddingLeft: 28, fontWeight: 500 }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={labelStyle}>View</span>
        <select value={viewFilter} onChange={handleViewChange} style={selectStyle}>
          <option value="all">All</option>
          {availableWorkspaces.map(ws => (
            <option key={ws} value={ws}>{WORKSPACE_CONFIG[ws]?.label || ws}</option>
          ))}
        </select>
      </div>
      {viewFilter !== 'all' && catOptions.length > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={labelStyle}>Category</span>
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={selectStyle}>
            {catOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={labelStyle}>Sort</span>
        <select value={sortMode} onChange={e => setSortMode(e.target.value)} style={selectStyle}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name">Name A–Z</option>
          <option value="type">Type A–Z</option>
        </select>
      </div>
    </div>
  );
}

// ─── UploadedDocumentsTab ─────────────────────────────────────────────────────
function UploadedDocumentsTab({ isMobile }) {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [shareDoc, setShareDoc] = useState(null);
  const fileRef = useRef(null);

  const loadUploads = useCallback(async () => {
    try {
      const res = await fetch('/api/vault/uploads/list', { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      setUploads(data.uploads || []);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadUploads(); }, [loadUploads]);

  const handleFiles = useCallback(async (files) => {
    const file = files[0];
    if (!file) return;

    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    if (!allowed.includes(file.type)) {
      setUploadError('Only PDF and DOCX files are allowed.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File must be under 10MB.');
      return;
    }

    setUploadError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/vault/upload', { method: 'POST', credentials: 'include', body: formData });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Upload failed');
      }
      await loadUploads();
    } catch (e) {
      setUploadError(e.message || 'Upload failed');
    } finally { setUploading(false); }
  }, [loadUploads]);

  const handleDelete = useCallback(async (id) => {
    if (!confirm('Delete this file?')) return;
    try {
      await fetch(`/api/vault/uploads/${id}`, { method: 'DELETE', credentials: 'include' });
      setUploads(prev => prev.filter(u => u.id !== id));
    } catch { /* silent */ }
  }, []);

  const dropZoneStyle = {
    border: `2px dashed ${dragOver ? '#FF7043' : 'rgba(0,0,0,0.15)'}`,
    borderRadius: 12, padding: '28px 20px', textAlign: 'center',
    background: dragOver ? 'rgba(255,112,67,0.05)' : 'rgba(255,255,255,0.40)',
    cursor: 'pointer', transition: 'all 150ms ease', marginBottom: 16,
  };

  return (
    <div style={{ padding: '14px' }}>
      {/* Drop zone */}
      <div
        style={dropZoneStyle}
        onClick={() => fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
      >
        <div style={{ fontSize: 28, marginBottom: 8 }}>📁</div>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#112033', marginBottom: 4 }}>
          {uploading ? 'Uploading…' : 'Drop a file or click to upload'}
        </div>
        <div style={{ fontSize: 11, color: '#90A4AE' }}>PDF or DOCX only · 10MB max</div>
        <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }}
          onChange={e => handleFiles(e.target.files)} />
      </div>

      {uploadError && (
        <div style={{ fontSize: 12, color: '#E53935', fontWeight: 600, marginBottom: 12, padding: '8px 10px', background: 'rgba(229,57,53,0.06)', borderRadius: 8 }}>
          {uploadError}
        </div>
      )}

      {/* Column header */}
      {!isMobile && !loading && uploads.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', padding: '6px 0',
          fontSize: 10, fontWeight: 800, color: '#90A4AE',
          letterSpacing: '0.06em', textTransform: 'uppercase',
          borderBottom: '1px solid rgba(0,0,0,0.05)', marginBottom: 4,
        }}>
          <div style={{ flex: 1 }}>File</div>
          <div style={{ width: 70 }}>Size</div>
          <div style={{ width: 100 }}>Uploaded</div>
          <div style={{ width: 180, paddingLeft: 12 }}>Actions</div>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '24px 0', textAlign: 'center', color: '#90A4AE', fontSize: 13 }}>Loading…</div>
      ) : uploads.length === 0 ? (
        <div style={{ padding: '24px 0', textAlign: 'center', color: '#90A4AE', fontSize: 13 }}>No uploads yet.</div>
      ) : (
        uploads.map(u => (
          <div key={u.id}
            style={{
              display: 'flex', alignItems: isMobile ? 'flex-start' : 'center',
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? 8 : 0, padding: '10px 0',
              borderBottom: '1px solid rgba(0,0,0,0.05)', transition: 'background 120ms',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.55)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 7, flexShrink: 0,
                background: u.fileType === 'pdf' ? 'rgba(229,57,53,0.10)' : 'rgba(33,150,243,0.10)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
              }}>
                {u.fileType === 'pdf' ? '📕' : '📘'}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#112033', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: isMobile ? '70vw' : 320 }}>
                  {u.fileName}
                </div>
                <div style={{ fontSize: 10, color: '#90A4AE', marginTop: 1, textTransform: 'uppercase', fontWeight: 600 }}>
                  {u.fileType}
                </div>
              </div>
            </div>
            <div style={{ flexShrink: 0, width: isMobile ? 'auto' : 70, fontSize: 11, color: '#90A4AE' }}>
              {formatBytes(u.fileSizeBytes)}
            </div>
            <div style={{ flexShrink: 0, width: isMobile ? 'auto' : 100, fontSize: 11, color: '#546E7A', fontWeight: 600 }}>
              {formatDate(u.createdAt)}
            </div>
            <div style={{ flexShrink: 0, width: isMobile ? 'auto' : 180, paddingLeft: isMobile ? 0 : 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <button onClick={() => window.open(u.downloadUrl, '_blank', 'noopener')} style={{
                fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 8,
                border: '1px solid rgba(255,112,67,0.30)', background: 'rgba(255,112,67,0.08)',
                color: '#FF7043', cursor: 'pointer', whiteSpace: 'nowrap',
              }}>↓ Download</button>
              <button onClick={() => setShareDoc({ name: u.fileName, sharePayload: { vaultUploadId: u.id, fileName: u.fileName, downloadUrl: u.downloadUrl } })} style={{
                fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 8,
                border: '1px solid rgba(0,0,0,0.12)', background: 'transparent',
                color: '#546E7A', cursor: 'pointer', whiteSpace: 'nowrap',
              }}>⇧ Share</button>
              <button onClick={() => handleDelete(u.id)} style={{
                fontSize: 11, fontWeight: 700, padding: '5px 8px', borderRadius: 8,
                border: '1px solid rgba(229,57,53,0.20)', background: 'transparent',
                color: '#E53935', cursor: 'pointer',
              }}>✕</button>
            </div>
          </div>
        ))
      )}
      {shareDoc && <SharePanel doc={shareDoc} onClose={() => setShareDoc(null)} />}
    </div>
  );
}

// ─── SharedWithMeTab ──────────────────────────────────────────────────────────
function SharedWithMeTab({ isMobile }) {
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetch('/api/vault/shared-with-me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) { setShares(data.shares || []); setUnreadCount(data.unreadCount || 0); }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const markRead = useCallback(async (shareId) => {
    try {
      await fetch('/api/vault/shared-with-me/mark-read', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shareId }),
      });
      setShares(prev => prev.map(s => s.id === shareId ? { ...s, isUnread: false, readAt: new Date().toISOString() } : s));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* silent */ }
  }, []);

  if (loading) return <div style={{ padding: '36px 0', textAlign: 'center', color: '#90A4AE', fontSize: 13 }}>Loading…</div>;

  if (!shares.length) {
    return (
      <div style={{ padding: '44px 0', textAlign: 'center' }}>
        <div style={{ fontSize: 30, marginBottom: 10 }}>📬</div>
        <div style={{ fontSize: 14, color: '#546E7A', fontWeight: 700 }}>Nothing shared with you yet.</div>
        <div style={{ fontSize: 12, color: '#90A4AE', marginTop: 4 }}>Documents shared by contacts or Foundry participants will appear here.</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '0 14px 14px' }}>
      {!isMobile && (
        <div style={{
          display: 'flex', alignItems: 'center', padding: '8px 0',
          fontSize: 10, fontWeight: 800, color: '#90A4AE',
          letterSpacing: '0.06em', textTransform: 'uppercase',
          borderBottom: '1px solid rgba(0,0,0,0.05)', marginBottom: 4,
        }}>
          <div style={{ flex: 1 }}>Document</div>
          <div style={{ width: 120 }}>From</div>
          <div style={{ width: 80 }}>Origin</div>
          <div style={{ width: 100 }}>Received</div>
          <div style={{ width: 110, paddingLeft: 12 }}>Actions</div>
        </div>
      )}

      {shares.map(s => (
        <div key={s.id}
          style={{
            display: 'flex', alignItems: isMobile ? 'flex-start' : 'center',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 8 : 0, padding: '11px 0',
            borderBottom: '1px solid rgba(0,0,0,0.05)',
            background: s.isUnread ? 'rgba(255,112,67,0.04)' : 'transparent',
            transition: 'background 120ms',
          }}
        >
          {/* File info */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            {s.isUnread && (
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF7043', flexShrink: 0 }} />
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: 13, fontWeight: s.isUnread ? 800 : 700, color: '#112033',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                maxWidth: isMobile ? '70vw' : 280,
              }}>
                {s.fileName}
              </div>
              {s.message && (
                <div style={{ fontSize: 11, color: '#78909C', marginTop: 2, fontStyle: 'italic' }}>
                  "{s.message}"
                </div>
              )}
            </div>
          </div>

          {/* From */}
          <div style={{ flexShrink: 0, width: isMobile ? 'auto' : 120 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>{s.from.name}</div>
            {s.from.role && <div style={{ fontSize: 10, color: '#90A4AE', textTransform: 'capitalize' }}>{s.from.role.toLowerCase()}</div>}
          </div>

          {/* Origin */}
          <div style={{ flexShrink: 0, width: isMobile ? 'auto' : 80 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999,
              background: s.origin === 'foundry' ? 'rgba(103,58,183,0.10)' : 'rgba(33,150,243,0.10)',
              color: s.origin === 'foundry' ? '#4527A0' : '#185FA5',
            }}>
              {s.origin === 'foundry' ? 'Foundry' : 'Direct'}
            </span>
          </div>

          {/* Date */}
          <div style={{ flexShrink: 0, width: isMobile ? 'auto' : 100, fontSize: 11, color: '#546E7A', fontWeight: 600 }}>
            {formatDate(s.createdAt)}
          </div>

          {/* Actions */}
          <div style={{ flexShrink: 0, width: isMobile ? 'auto' : 110, paddingLeft: isMobile ? 0 : 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            {s.downloadUrl ? (
              <button
                onClick={() => { window.open(s.downloadUrl, '_blank', 'noopener'); if (s.isUnread) markRead(s.id); }}
                style={{
                  fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 8,
                  border: '1px solid rgba(255,112,67,0.30)', background: 'rgba(255,112,67,0.08)',
                  color: '#FF7043', cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >↓ Open</button>
            ) : (
              <span style={{ fontSize: 11, color: '#B0BEC5' }}>No file</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ForgeVaultPage() {
  const [activeTab, setActiveTab]       = useState('forge');    // 'forge' | 'uploads' | 'shared'
  const [docs, setDocs]                 = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [searchTerm, setSearchTerm]     = useState('');
  const [sortMode, setSortMode]         = useState('newest');
  const [viewFilter, setViewFilter]     = useState('all');
  const [catFilter, setCatFilter]       = useState('all');
  const [isMobile, setIsMobile]         = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Load forge docs
  useEffect(() => {
    let alive = true;
    setLoading(true); setError(null);

    async function safeGet(url) {
      try {
        const res = await fetch(url, { credentials: 'include' });
        if (!res.ok) return null;
        return await res.json();
      } catch { return null; }
    }

    async function loadAll() {
      const [resumeData, coverData, roadmapData, negotiationData, packetData, strategyData, vaultData] = await Promise.all([
        safeGet('/api/resume/list'),
        safeGet('/api/cover/list'),
        safeGet('/api/anvil/onboarding-growth/list'),
        safeGet('/api/offer-negotiation/list'),
        safeGet('/api/apply/application-packets/list'),
        safeGet('/api/coaching/clients/strategy/list'),
        safeGet('/api/vault/documents'),
      ]);

      if (!alive) return;

      const all = [
        ...normalizeResumes(resumeData?.resumes || []),
        ...normalizeCovers(coverData?.covers || []),
        ...normalizeInterviewPreps(vaultData?.interviewPreps || []),
        ...normalizeProfile(vaultData?.professionalProfile || null),
        ...normalizeRoadmaps(roadmapData?.roadmaps || []),
        ...normalizeNegotiations(negotiationData?.negotiations || []),
        ...normalizePackets(packetData?.packets || []),
        ...normalizeStrategies(strategyData?.strategies || []),
        ...normalizeCandidateReviewPackets(vaultData?.recruiterReviewPackets || []),
        ...normalizeResumeRoleAnalyses(vaultData?.resumeRoleAnalyses || []),
      ];

      all.sort((a, b) => {
        const da = a.date ? new Date(a.date).getTime() : 0;
        const db = b.date ? new Date(b.date).getTime() : 0;
        return db - da;
      });

      setDocs(all);
      setLoading(false);
    }

    loadAll().catch(() => {
      if (!alive) return;
      setError('Could not load your documents. Please try again.');
      setLoading(false);
    });

    return () => { alive = false; };
  }, []);

  const availableWorkspaces = useMemo(() => {
    const ws = new Set(docs.map(d => d.workspace));
    return ['seeker', 'coach', 'recruiter'].filter(w => ws.has(w));
  }, [docs]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    let rows = docs.filter(d => {
      if (viewFilter !== 'all' && d.workspace !== viewFilter) return false;
      if (catFilter !== 'all' && d.category !== catFilter) return false;
      if (q) {
        const haystack = [d.name, d.subtitle, d.typeLabel, d.raw?.title, d.raw?.company, d.raw?.jobTitle]
          .filter(Boolean).join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    rows.sort((a, b) => {
      if (sortMode === 'oldest') return (a.date ? new Date(a.date) : 0) - (b.date ? new Date(b.date) : 0);
      if (sortMode === 'name')   return String(a.name || '').localeCompare(String(b.name || ''));
      if (sortMode === 'type')   return String(a.typeLabel || '').localeCompare(String(b.typeLabel || ''));
      return (b.date ? new Date(b.date) : 0) - (a.date ? new Date(a.date) : 0);
    });

    return rows;
  }, [docs, viewFilter, catFilter, searchTerm, sortMode]);

  const greeting = getTimeGreeting();

  const TAB_CONFIG = [
    { key: 'forge',   label: 'Forge Documents',    icon: '⚒️'  },
    { key: 'uploads', label: 'Uploaded Documents',  icon: '📁'  },
    { key: 'shared',  label: 'Shared With Me',      icon: '📬'  },
  ];

  const tabStyle = (key) => ({
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '10px 16px', border: 'none', borderRadius: '10px 10px 0 0',
    cursor: 'pointer', fontSize: 13, fontWeight: activeTab === key ? 800 : 600,
    color: activeTab === key ? '#FF7043' : '#546E7A',
    background: activeTab === key ? 'rgba(255,112,67,0.08)' : 'transparent',
    borderBottom: activeTab === key ? '2px solid #FF7043' : '2px solid transparent',
    transition: 'all 150ms ease', whiteSpace: 'nowrap',
  });

  return (
    <>
      <Head><title>ForgeVault — ForgeTomorrow</title></Head>

      <SeekerLayout
        title="ForgeVault — ForgeTomorrow"
        activeNav="vault"
        header={
          <SeekerTitleCard
            greeting={greeting}
            title="ForgeVault"
            subtitle="Your professional document workspace — every artifact ForgeTomorrow has built for you, organized by workflow."
          />
        }
        right={<RightRailPlacementManager slot="right_rail_1" />}
        rightVariant="light"
      >
        <section style={{ ...GLASS, overflow: 'hidden' }}>
          {/* Heading */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 14px 0 14px',
          }}>
            <h2 style={{ margin: 0, fontSize: 18, color: '#FF7043', lineHeight: 1.25, letterSpacing: '-0.01em', ...ORANGE_HEADING_LIFT }}>
              Document Archive
            </h2>
            <div style={{ fontSize: 12, color: '#546E7A', fontWeight: 600 }}>
              {activeTab === 'forge' && !loading ? `${filtered.length} document${filtered.length !== 1 ? 's' : ''}` : ''}
            </div>
          </div>

          {/* Tab bar */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 4,
            padding: '10px 14px 0 14px',
            borderBottom: '1px solid rgba(0,0,0,0.07)',
          }}>
            {TAB_CONFIG.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={tabStyle(tab.key)}>
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === 'forge' && (
            <>
              <ControlsBar
                viewFilter={viewFilter} setViewFilter={setViewFilter}
                catFilter={catFilter} setCatFilter={setCatFilter}
                searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                sortMode={sortMode} setSortMode={setSortMode}
                availableWorkspaces={availableWorkspaces}
              />
              <div>
                {error ? (
                  <div style={{ padding: '24px 14px', textAlign: 'center', color: '#E53935', fontSize: 13, fontWeight: 600 }}>
                    {error}
                    <button onClick={() => window.location.reload()} style={{
                      display: 'block', margin: '10px auto 0', padding: '6px 14px', borderRadius: 8,
                      border: '1px solid rgba(229,57,53,0.30)', background: 'rgba(229,57,53,0.06)',
                      color: '#E53935', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    }}>Retry</button>
                  </div>
                ) : (
                  <ForgeDocumentsTable docs={filtered} loading={loading} isMobile={isMobile} viewFilter={viewFilter} />
                )}
              </div>
            </>
          )}

          {activeTab === 'uploads' && <UploadedDocumentsTab isMobile={isMobile} />}
          {activeTab === 'shared'  && <SharedWithMeTab isMobile={isMobile} />}
        </section>
      </SeekerLayout>
    </>
  );
}