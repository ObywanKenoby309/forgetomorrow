// pages/dashboard/forge-vault.js
// ForgeVault — professional document workspace.
// Workflow-oriented: View + Category dropdowns replace flat tab system.
// No new DB models. No architecture changes. Reads existing list endpoints.

import React, { useEffect, useState, useCallback, useMemo } from 'react';
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

// ─── Type display config ──────────────────────────────────────────────────────
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
  resume:          'seeking',
  cover:           'seeking',
  interview:       'seeking',
  packet:          'seeking',
  profile:         'career',
  roadmap:         'career',
  negotiation:     'career',
  strategy:        'coaching',
  candidateReview: 'candidates',
  resumeRole:      'intelligence',
};

const WORKSPACE_BADGE = {
  seeker:    { bg: 'rgba(255,112,67,0.10)',  color: '#993C1D',  label: 'Seeker'    },
  coach:     { bg: 'rgba(33,150,243,0.10)',  color: '#185FA5',  label: 'Coach'     },
  recruiter: { bg: 'rgba(96,125,139,0.10)', color: '#37474F',  label: 'Recruiter' },
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
    typeLabel: TYPE_META.resume.label,
    name: safeText(r.name, 'Untitled Resume'),
    subtitle: r.isPrimary ? '★ Primary' : null,
    date: r.updatedAt,
    downloadUrl: `/api/resume/download?id=${r.id}`,
    hasPdf: false, raw: r,
  }));
}

function normalizeCovers(covers = []) {
  return covers.map((c) => ({
    id: `cover-${c.id}`, type: 'cover', workspace: 'seeker', category: 'seeking',
    typeLabel: TYPE_META.cover.label,
    name: safeText(c.name, 'Untitled Cover Letter'),
    subtitle: c.isPrimary ? '★ Primary' : null,
    date: c.updatedAt,
    downloadFn: async () => {
      const res = await fetch(`/api/cover/download?id=${c.id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Download failed');
      const data = await res.json();
      const content = safeText(data?.cover?.content, JSON.stringify(data?.cover || {}, null, 2));
      downloadText(`${safeText(c.name, 'cover_letter').replace(/[^a-z0-9_-]+/gi, '_')}.txt`, content);
    },
    hasPdf: false, raw: c,
  }));
}

function normalizeInterviewPreps(preps = []) {
  return preps.map((p) => ({
    id: `interview-${p.id}`, type: 'interview', workspace: 'seeker', category: 'seeking',
    typeLabel: TYPE_META.interview.label,
    name: safeText(p.name, `Interview Prep · App #${p.applicationId}`),
    subtitle: p.jobTitle ? `for ${p.jobTitle}` : null,
    date: p.generatedAt,
    downloadFn: () => downloadJson(`interview_prep_${p.applicationId}.json`, p.result || p),
    hasPdf: false, raw: p,
  }));
}

function normalizeProfile(profile) {
  if (!profile) return [];
  return [{
    id: 'profile-pop', type: 'profile', workspace: 'seeker', category: 'career',
    typeLabel: TYPE_META.profile.label,
    name: 'Professional Operating Profile', subtitle: null,
    date: profile.updatedAt,
    downloadFn: () => downloadJson('professional_operating_profile.json', profile.snapshotJson || profile),
    hasPdf: false, raw: profile,
  }];
}

function normalizeRoadmaps(roadmaps = []) {
  return roadmaps.map((r) => ({
    id: `roadmap-${r.id}`, type: 'roadmap', workspace: 'seeker', category: 'career',
    typeLabel: TYPE_META.roadmap.label,
    name: safeText(r.name, 'Growth & Pivot Roadmap'),
    subtitle: safeText(r.title, null),
    date: r.createdAt,
    downloadFn: () => downloadJson(`growth_pivot_roadmap_${r.id}.json`, r.raw || r),
    hasPdf: false, raw: r,
  }));
}

function normalizeNegotiations(negotiations = []) {
  return negotiations.map((n) => ({
    id: `negotiation-${n.id}`, type: 'negotiation', workspace: 'seeker', category: 'career',
    typeLabel: TYPE_META.negotiation.label,
    name: safeText(n.name, 'Offer & Negotiation Brief'), subtitle: null,
    date: n.createdAt,
    downloadFn: () => downloadJson(`negotiation_brief_${n.id}.json`, n.raw || n),
    hasPdf: n.hasPdf || false, raw: n,
  }));
}

function normalizePackets(packets = []) {
  return packets.map((p) => ({
    id: `packet-${p.id}`, type: 'packet', workspace: 'seeker', category: 'seeking',
    typeLabel: TYPE_META.packet.label,
    name: safeText(p.name, 'Application Packet'),
    subtitle: [p.company, p.title].filter(Boolean).join(' · ') || null,
    date: p.updatedAt,
    downloadUrl: p.latestExport?.url || null,
    hasPdf: Boolean(p.latestExport?.url), raw: p,
  }));
}

function normalizeStrategies(strategies = []) {
  return strategies.map((s) => ({
    id: `strategy-${s.id}`, type: 'strategy', workspace: 'coach', category: 'coaching',
    typeLabel: TYPE_META.strategy.label,
    name: safeText(s.title, 'Target Strategy'),
    subtitle: s.summary ? s.summary.slice(0, 72) + (s.summary.length > 72 ? '…' : '') : null,
    date: s.updatedAt,
    downloadUrl: s.downloadUrl || null,
    hasPdf: false, raw: s,
  }));
}

function normalizeCandidateReviewPackets(packets = []) {
  return packets.map((p) => {
    const candidateName = safeText(p.candidateName, 'Candidate');
    const downloadUrl = p.packetUrl || (p.candidateUserId
      ? `/api/recruiter/candidates/${p.candidateUserId}/review-packet` : null);
    return {
      id: `candidate-review-${p.id}`, type: 'candidateReview', workspace: 'recruiter', category: 'candidates',
      typeLabel: TYPE_META.candidateReview.label,
      name: safeText(p.title, `${candidateName} · Candidate Review Packet`),
      subtitle: candidateName,
      date: p.updatedAt || p.createdAt,
      downloadUrl, hasPdf: true, raw: p,
    };
  });
}

function normalizeResumeRoleAnalyses(analyses = []) {
  return analyses.map((a) => ({
    id: `resume-role-${a.id}`, type: 'resumeRole', workspace: 'recruiter', category: 'intelligence',
    typeLabel: TYPE_META.resumeRole.label,
    name: a.title || 'Resume vs Role Analysis',
    subtitle: a.candidateName || null,
    date: a.updatedAt || a.createdAt,
    downloadFn: () => downloadJson(`resume_role_analysis_${a.id}.json`, a.result || a),
    hasPdf: false, raw: a,
  }));
}

// ─── WorkspaceBadge ───────────────────────────────────────────────────────────
function WorkspaceBadge({ workspace }) {
  const wb = WORKSPACE_BADGE[workspace] || { bg: 'rgba(0,0,0,0.06)', color: '#546E7A', label: workspace };
  return (
    <span style={{
      display: 'inline-block', fontSize: 10, fontWeight: 700,
      padding: '2px 7px', borderRadius: 999,
      background: wb.bg, color: wb.color, whiteSpace: 'nowrap',
    }}>
      {wb.label}
    </span>
  );
}

// ─── TypeLabel ────────────────────────────────────────────────────────────────
function TypeLabel({ type }) {
  const meta = TYPE_META[type] || { label: type, color: '#546E7A' };
  return (
    <span style={{ fontSize: 10, fontWeight: 600, color: meta.color, whiteSpace: 'nowrap' }}>
      {meta.label}
    </span>
  );
}

// ─── CategoryLabel ────────────────────────────────────────────────────────────
const CATEGORY_LABELS = {
  seeking:      'Seeking',
  career:       'Career',
  coaching:     'Coaching',
  candidates:   'Candidate packages',
  intelligence: 'Candidate intelligence',
};

function CategoryLabel({ type, workspace }) {
  const category = TYPE_CATEGORY[type];
  const label = CATEGORY_LABELS[category] || category || '';
  const wb = WORKSPACE_BADGE[workspace] || { color: '#546E7A' };
  if (!label) return null;
  return (
    <span style={{ fontSize: 10, fontWeight: 600, color: wb.color, whiteSpace: 'nowrap' }}>
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
        border: '1px solid rgba(0,0,0,0.08)',
        background: 'transparent', color: '#B0BEC5',
        fontSize: 11, fontWeight: 700, cursor: 'not-allowed',
      }}>↓ Download</button>
    );
  }

  return (
    <div>
      <button onClick={handle} disabled={busy} title={err || 'Download document'} style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '5px 10px', borderRadius: 8,
        border: '1px solid rgba(255,112,67,0.30)',
        background: busy ? 'rgba(255,112,67,0.06)' : 'rgba(255,112,67,0.08)',
        color: err ? '#E53935' : '#FF7043',
        fontSize: 11, fontWeight: 700,
        cursor: busy ? 'wait' : 'pointer',
        transition: 'all 150ms ease', whiteSpace: 'nowrap',
      }}>
        {busy ? '…' : '↓'} {busy ? 'Downloading' : 'Download'}
      </button>
      {err && <div style={{ fontSize: 10, color: '#E53935', marginTop: 2 }}>{err}</div>}
    </div>
  );
}

// ─── VaultRow ─────────────────────────────────────────────────────────────────
function VaultRow({ doc, isMobile, showWorkspace }) {
  const meta = TYPE_META[doc.type] || { bg: 'rgba(0,0,0,0.05)', color: '#546E7A' };
  return (
    <div
      style={{
        display: 'flex', alignItems: isMobile ? 'flex-start' : 'center',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 10 : 0,
        padding: '11px 14px',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
        transition: 'background 120ms ease',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.55)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Icon + name */}
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

      {/* Workspace / Type — context-aware */}
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

      {/* Date */}
      <div style={{
        flexShrink: 0, width: isMobile ? 'auto' : 100,
        paddingLeft: isMobile ? 44 : 0,
        fontSize: 11, color: '#90A4AE', fontWeight: 600,
      }}>
        {formatDate(doc.date)}
      </div>

      {/* Actions */}
      <div style={{
        flexShrink: 0, width: isMobile ? 'auto' : 110,
        paddingLeft: isMobile ? 44 : 12,
        display: 'flex', alignItems: 'center',
      }}>
        <DownloadButton doc={doc} />
      </div>
    </div>
  );
}

// ─── SectionDivider ───────────────────────────────────────────────────────────
function SectionDivider({ workspace }) {
  const wb = WORKSPACE_BADGE[workspace] || { label: workspace, bg: 'rgba(0,0,0,0.04)', color: '#546E7A' };
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 14px 6px 14px',
      background: 'rgba(255,255,255,0.30)',
      borderBottom: '1px solid rgba(0,0,0,0.05)',
    }}>
      <span style={{
        fontSize: 10, fontWeight: 800, letterSpacing: '0.06em',
        textTransform: 'uppercase', color: wb.color,
        background: wb.bg, padding: '2px 8px', borderRadius: 999,
      }}>
        {wb.label} workspace
      </span>
    </div>
  );
}

// ─── ColumnHeader ─────────────────────────────────────────────────────────────
function ColumnHeader({ viewFilter }) {
  const typeColLabel = viewFilter === 'all' ? 'Workspace / Type' : 'Type';
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      padding: '6px 14px',
      fontSize: 10, fontWeight: 800, color: '#90A4AE',
      letterSpacing: '0.06em', textTransform: 'uppercase',
      background: 'rgba(255,255,255,0.30)',
      borderBottom: '1px solid rgba(0,0,0,0.05)',
    }}>
      <div style={{ flex: 1 }}>Document</div>
      <div style={{ width: 150 }}>{typeColLabel}</div>
      <div style={{ width: 100 }}>Updated</div>
      <div style={{ width: 110, paddingLeft: 12 }}>Actions</div>
    </div>
  );
}

// ─── VaultTable ───────────────────────────────────────────────────────────────
function VaultTable({ docs, loading, isMobile, viewFilter }) {
  if (loading) {
    return (
      <div style={{ padding: '36px 0', textAlign: 'center', color: '#90A4AE', fontSize: 13 }}>
        Loading your documents…
      </div>
    );
  }
  if (!docs.length) {
    return (
      <div style={{ padding: '44px 0', textAlign: 'center' }}>
        <div style={{ fontSize: 30, marginBottom: 10 }}>📭</div>
        <div style={{ fontSize: 14, color: '#546E7A', fontWeight: 700 }}>No documents here yet.</div>
        <div style={{ fontSize: 12, color: '#90A4AE', marginTop: 4 }}>
          Documents appear here as you create them across ForgeTomorrow.
        </div>
      </div>
    );
  }

  const showDividers = viewFilter === 'all';
  const showWorkspaceBadge = viewFilter === 'all';

  if (!showDividers) {
    return (
      <div>
        {!isMobile && <ColumnHeader viewFilter={viewFilter} />}
        {docs.map((doc) => (
          <VaultRow key={doc.id} doc={doc} isMobile={isMobile} showWorkspace={showWorkspaceBadge} />
        ))}
      </div>
    );
  }

  const WS_ORDER = ['seeker', 'coach', 'recruiter'];
  const grouped = {};
  docs.forEach((d) => {
    if (!grouped[d.workspace]) grouped[d.workspace] = [];
    grouped[d.workspace].push(d);
  });

  return (
    <div>
      {!isMobile && <ColumnHeader viewFilter={viewFilter} />}
      {WS_ORDER.filter(ws => grouped[ws]?.length).map((ws) => (
        <React.Fragment key={ws}>
          <SectionDivider workspace={ws} />
          {grouped[ws].map((doc) => (
            <VaultRow key={doc.id} doc={doc} isMobile={isMobile} showWorkspace={true} />
          ))}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── ControlsBar ──────────────────────────────────────────────────────────────
function ControlsBar({
  viewFilter, setViewFilter, catFilter, setCatFilter,
  searchTerm, setSearchTerm, sortMode, setSortMode,
  availableWorkspaces,
}) {
  const catOptions = useMemo(() => {
    if (viewFilter === 'all') return [{ value: 'all', label: 'All documents' }];
    const ws = WORKSPACE_CONFIG[viewFilter];
    if (!ws) return [{ value: 'all', label: 'All documents' }];
    return Object.entries(ws.categories).map(([k, v]) => ({ value: k, label: v.label }));
  }, [viewFilter]);

  const handleViewChange = (e) => { setViewFilter(e.target.value); setCatFilter('all'); };

  const selectStyle = {
    fontSize: 12, fontWeight: 600,
    padding: '7px 10px', borderRadius: 8,
    border: '1px solid rgba(0,0,0,0.12)',
    background: 'rgba(255,255,255,0.88)',
    color: '#263238', outline: 'none', cursor: 'pointer',
  };
  const labelStyle = { fontSize: 11, fontWeight: 700, color: '#78909C', whiteSpace: 'nowrap' };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', flexWrap: 'wrap',
      gap: 8, padding: '12px 14px',
      borderBottom: '1px solid rgba(0,0,0,0.07)',
      background: 'rgba(255,255,255,0.30)',
    }}>
      <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 160 }}>
        <span style={{
          position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)',
          fontSize: 13, color: '#90A4AE', pointerEvents: 'none',
        }}>🔍</span>
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search documents, companies, titles…"
          style={{ ...selectStyle, width: '100%', paddingLeft: 28, fontWeight: 500 }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={labelStyle}>View</span>
        <select value={viewFilter} onChange={handleViewChange} style={selectStyle}>
          <option value="all">All</option>
          {availableWorkspaces.map((ws) => (
            <option key={ws} value={ws}>{WORKSPACE_CONFIG[ws]?.label || ws}</option>
          ))}
        </select>
      </div>

      {viewFilter !== 'all' && catOptions.length > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={labelStyle}>Category</span>
          <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} style={selectStyle}>
            {catOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={labelStyle}>Sort</span>
        <select value={sortMode} onChange={(e) => setSortMode(e.target.value)} style={selectStyle}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name">Name A–Z</option>
          <option value="type">Type A–Z</option>
        </select>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ForgeVaultPage() {
  const [docs, setDocs]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortMode, setSortMode]     = useState('newest');
  const [viewFilter, setViewFilter] = useState('all');
  const [catFilter, setCatFilter]   = useState('all');
  const [isMobile, setIsMobile]     = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    async function safeGet(url) {
      try {
        const res = await fetch(url, { credentials: 'include' });
        if (!res.ok) return null;
        return await res.json();
      } catch { return null; }
    }

    async function loadAll() {
      const [
        resumeData, coverData, roadmapData, negotiationData,
        packetData, strategyData, vaultData,
      ] = await Promise.all([
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
    const ws = new Set(docs.map((d) => d.workspace));
    return ['seeker', 'coach', 'recruiter'].filter((w) => ws.has(w));
  }, [docs]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    let rows = docs.filter((d) => {
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

  return (
    <>
      <Head>
        <title>ForgeVault — ForgeTomorrow</title>
      </Head>

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
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 14px 0 14px',
          }}>
            <h2 style={{
              margin: 0, fontSize: 18, color: '#FF7043',
              lineHeight: 1.25, letterSpacing: '-0.01em',
              ...ORANGE_HEADING_LIFT,
            }}>
              Document Archive
            </h2>
            <div style={{ fontSize: 12, color: '#546E7A', fontWeight: 600 }}>
              {loading ? '—' : `${filtered.length} document${filtered.length !== 1 ? 's' : ''}`}
            </div>
          </div>

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
                }}>
                  Retry
                </button>
              </div>
            ) : (
              <VaultTable docs={filtered} loading={loading} isMobile={isMobile} viewFilter={viewFilter} />
            )}
          </div>
        </section>
      </SeekerLayout>
    </>
  );
}