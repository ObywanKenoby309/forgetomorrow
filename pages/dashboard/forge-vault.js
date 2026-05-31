// pages/dashboard/forge-vault.js
// ForgeVault — unified document hub for all ForgeTomorrow-generated artifacts.
// Seeker-chrome only. Reads from existing list endpoints. No new DB models.
// Two deliverable files: forge-vault.js (this) + pages/api/vault/documents.js

import React, { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import SeekerTitleCard from '@/components/seeker/SeekerTitleCard';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';

// ─── Design tokens ────────────────────────────────────────────────────────────
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
const GAP = 12;

// ─── Tab config ───────────────────────────────────────────────────────────────
const TABS = [
  { key: 'all',           label: 'All Documents',              icon: '🗂️' },
  { key: 'resume',        label: 'Resumes',                    icon: '📄' },
  { key: 'cover',         label: 'Cover Letters',              icon: '✉️' },
  { key: 'interview',     label: 'Interview Prep',             icon: '🎯' },
  { key: 'profile',       label: 'Operating Profile',          icon: '🧠' },
  { key: 'roadmap',       label: 'Growth & Pivot Roadmap',     icon: '🗺️' },
  { key: 'negotiation',   label: 'Offer Negotiation',          icon: '🤝' },
  { key: 'packet',        label: 'Application Packets',        icon: '📦' },
  { key: 'strategy',      label: 'Target Strategy',            icon: '🏹' },
];

// ─── Type badge colors ────────────────────────────────────────────────────────
const TYPE_COLORS = {
  resume:      { bg: 'rgba(255,112,67,0.10)', color: '#E64A19' },
  cover:       { bg: 'rgba(33,150,243,0.10)', color: '#1565C0' },
  interview:   { bg: 'rgba(76,175,80,0.10)',  color: '#2E7D32' },
  profile:     { bg: 'rgba(156,39,176,0.10)', color: '#6A1B9A' },
  roadmap:     { bg: 'rgba(0,188,212,0.10)',  color: '#006064' },
  negotiation: { bg: 'rgba(255,193,7,0.12)',  color: '#E65100' },
  packet:      { bg: 'rgba(96,125,139,0.10)', color: '#37474F' },
  strategy:    { bg: 'rgba(103,58,183,0.10)', color: '#4527A0' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(raw) {
  if (!raw) return '—';
  try {
    return new Date(raw).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  } catch {
    return '—';
  }
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
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); document.body.removeChild(a); }, 500);
  } catch (e) {
    console.error('[ForgeVault] downloadText error', e);
  }
}

function downloadJson(filename, obj) {
  downloadText(filename, JSON.stringify(obj, null, 2));
}

// ─── Normalizers — transform each API response into unified VaultDoc shape ────
// VaultDoc: { id, type, name, subtitle?, date, downloadUrl?, downloadFn?, hasPdf, raw }

function normalizeResumes(resumes = []) {
  return resumes.map((r) => ({
    id: `resume-${r.id}`,
    type: 'resume',
    typeLabel: 'Resume',
    name: safeText(r.name, 'Untitled Resume'),
    subtitle: r.isPrimary ? '★ Primary' : null,
    date: r.updatedAt,
    downloadUrl: `/api/resume/download?id=${r.id}`,
    hasPdf: false,
    raw: r,
    exportFoundryEndpoint: '/api/resume/export-foundry',
    exportFoundryPayload: { resumeId: r.id },
  }));
}

function normalizeCovers(covers = []) {
  return covers.map((c) => ({
    id: `cover-${c.id}`,
    type: 'cover',
    typeLabel: 'Cover Letter',
    name: safeText(c.name, 'Untitled Cover Letter'),
    subtitle: c.isPrimary ? '★ Primary' : null,
    date: c.updatedAt,
    downloadFn: async () => {
      const res = await fetch(`/api/cover/download?id=${c.id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Download failed');
      const data = await res.json();
      const content = safeText(data?.cover?.content, JSON.stringify(data?.cover || {}, null, 2));
      const filename = `${safeText(c.name, 'cover_letter').replace(/[^a-z0-9_-]+/gi, '_')}.txt`;
      downloadText(filename, content);
    },
    hasPdf: false,
    raw: c,
    exportFoundryEndpoint: '/api/cover/export-foundry',
    exportFoundryPayload: { coverId: c.id },
  }));
}

function normalizeInterviewPreps(preps = []) {
  return preps.map((p) => ({
    id: `interview-${p.id}`,
    type: 'interview',
    typeLabel: 'Interview Prep',
    name: safeText(p.name, `Interview Prep · App #${p.applicationId}`),
    subtitle: p.jobTitle ? `for ${p.jobTitle}` : null,
    date: p.generatedAt,
    downloadFn: () => {
      downloadJson(`interview_prep_${p.applicationId}.json`, p.result || p);
    },
    hasPdf: false,
    raw: p,
    exportFoundryEndpoint: `/api/seeker/applications/${p.applicationId}/interview-prep-export-foundry`,
    exportFoundryPayload: {},
  }));
}

function normalizeProfile(profile) {
  if (!profile) return [];
  return [{
    id: 'profile-pop',
    type: 'profile',
    typeLabel: 'Professional Operating Profile',
    name: 'Professional Operating Profile',
    subtitle: null,
    date: profile.updatedAt,
    downloadFn: () => {
      downloadJson('professional_operating_profile.json', profile.snapshotJson || profile);
    },
    hasPdf: false,
    raw: profile,
    exportFoundryEndpoint: '/api/anvil/identity/export-foundry',
    exportFoundryPayload: {},
  }];
}

function normalizeRoadmaps(roadmaps = []) {
  return roadmaps.map((r) => ({
    id: `roadmap-${r.id}`,
    type: 'roadmap',
    typeLabel: 'Growth & Pivot Roadmap',
    name: safeText(r.name, 'Growth & Pivot Roadmap'),
    subtitle: safeText(r.title, null),
    date: r.createdAt,
    downloadFn: () => {
      downloadJson(`growth_pivot_roadmap_${r.id}.json`, r.raw || r);
    },
    hasPdf: false,
    raw: r,
    exportFoundryEndpoint: '/api/anvil/onboarding-growth/export-foundry',
    exportFoundryPayload: { roadmapId: r.id },
  }));
}

function normalizeNegotiations(negotiations = []) {
  return negotiations.map((n) => ({
    id: `negotiation-${n.id}`,
    type: 'negotiation',
    typeLabel: 'Offer & Negotiation Brief',
    name: safeText(n.name, 'Offer & Negotiation Brief'),
    subtitle: null,
    date: n.createdAt,
    downloadFn: () => {
      downloadJson(`negotiation_brief_${n.id}.json`, n.raw || n);
    },
    hasPdf: n.hasPdf || false,
    raw: n,
    exportFoundryEndpoint: '/api/offer-negotiation/export-foundry',
    exportFoundryPayload: { negotiationId: n.id },
  }));
}

function normalizePackets(packets = []) {
  return packets.map((p) => ({
    id: `packet-${p.id}`,
    type: 'packet',
    typeLabel: 'Application Packet',
    name: safeText(p.name, 'Application Packet'),
    subtitle: [p.company, p.title].filter(Boolean).join(' · ') || null,
    date: p.updatedAt,
    downloadUrl: p.latestExport?.url || null,
    hasPdf: Boolean(p.latestExport?.url),
    raw: p,
    exportFoundryEndpoint: '/api/apply/application-packets/export-foundry',
    exportFoundryPayload: { applicationId: p.applicationId },
  }));
}

function normalizeStrategies(strategies = []) {
  return strategies.map((s) => ({
    id: `strategy-${s.id}`,
    type: 'strategy',
    typeLabel: 'Target Strategy',
    name: safeText(s.title, 'Target Strategy'),
    subtitle: s.summary ? s.summary.slice(0, 72) + (s.summary.length > 72 ? '…' : '') : null,
    date: s.updatedAt,
    downloadUrl: s.downloadUrl || null,
    hasPdf: false,
    raw: s,
    exportFoundryEndpoint: s.shareEndpoint || '/api/coaching/clients/strategy/export-foundry',
    exportFoundryPayload: s.sharePayload || { clientId: s.id },
  }));
}

// ─── TypeBadge ────────────────────────────────────────────────────────────────
function TypeBadge({ type, label }) {
  const colors = TYPE_COLORS[type] || { bg: 'rgba(0,0,0,0.06)', color: '#546E7A' };
  return (
    <span style={{
      display: 'inline-block',
      fontSize: 10,
      fontWeight: 800,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      padding: '2px 7px',
      borderRadius: 999,
      background: colors.bg,
      color: colors.color,
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}

// ─── FoundryShareButton (placeholder) ────────────────────────────────────────
function FoundryShareButton() {
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        disabled
        title="Share to Foundry — Coming Soon"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '5px 10px',
          borderRadius: 8,
          border: '1px solid rgba(0,0,0,0.10)',
          background: 'rgba(0,0,0,0.04)',
          color: '#90A4AE',
          fontSize: 11,
          fontWeight: 700,
          cursor: 'not-allowed',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ fontSize: 13 }}>⚡</span> Foundry
        <span style={{
          fontSize: 9,
          fontWeight: 800,
          background: 'rgba(255,112,67,0.15)',
          color: '#FF7043',
          borderRadius: 999,
          padding: '1px 5px',
          marginLeft: 2,
        }}>
          SOON
        </span>
      </button>
    </div>
  );
}

// ─── DownloadButton ───────────────────────────────────────────────────────────
function DownloadButton({ doc }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const handle = useCallback(async () => {
    if (busy) return;
    setErr(null);
    setBusy(true);
    try {
      if (doc.downloadUrl) {
        window.open(doc.downloadUrl, '_blank', 'noopener');
      } else if (doc.downloadFn) {
        await doc.downloadFn();
      }
    } catch (e) {
      setErr('Download failed');
      console.error('[ForgeVault] download error', e);
    } finally {
      setBusy(false);
    }
  }, [doc, busy]);

  const canDownload = Boolean(doc.downloadUrl || doc.downloadFn);

  if (!canDownload) {
    return (
      <button disabled style={{
        padding: '5px 10px', borderRadius: 8,
        border: '1px solid rgba(0,0,0,0.08)',
        background: 'rgba(0,0,0,0.04)',
        color: '#B0BEC5', fontSize: 11, fontWeight: 700, cursor: 'not-allowed',
      }}>
        ↓ Download
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={handle}
        disabled={busy}
        title={err || 'Download document'}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '5px 10px', borderRadius: 8,
          border: '1px solid rgba(255,112,67,0.30)',
          background: busy ? 'rgba(255,112,67,0.06)' : 'rgba(255,112,67,0.08)',
          color: err ? '#E53935' : '#FF7043',
          fontSize: 11, fontWeight: 700, cursor: busy ? 'wait' : 'pointer',
          transition: 'all 150ms ease',
          whiteSpace: 'nowrap',
        }}
      >
        {busy ? '…' : '↓'} {busy ? 'Downloading' : 'Download'}
      </button>
      {err && <div style={{ fontSize: 10, color: '#E53935', marginTop: 2 }}>{err}</div>}
    </div>
  );
}

// ─── VaultRow ─────────────────────────────────────────────────────────────────
function VaultRow({ doc, isMobile }) {
  return (
    <div style={{
      ...WHITE_CARD,
      display: 'flex',
      alignItems: isMobile ? 'flex-start' : 'center',
      flexDirection: isMobile ? 'column' : 'row',
      gap: isMobile ? 10 : 0,
      padding: '12px 14px',
      borderBottom: '1px solid rgba(0,0,0,0.05)',
    }}>
      {/* Left: type icon + name */}
      <div style={{
        flex: 1, minWidth: 0,
        display: 'flex', alignItems: 'flex-start', gap: 10,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 9, flexShrink: 0,
          background: (TYPE_COLORS[doc.type] || {}).bg || 'rgba(0,0,0,0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16,
        }}>
          {TABS.find(t => t.key === doc.type)?.icon || '📄'}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 800, color: '#112033',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            maxWidth: isMobile ? '80vw' : 340,
          }}>
            {doc.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
            <TypeBadge type={doc.type} label={doc.typeLabel} />
            {doc.subtitle && (
              <span style={{ fontSize: 11, color: '#78909C', fontWeight: 600 }}>{doc.subtitle}</span>
            )}
          </div>
        </div>
      </div>

      {/* Date */}
      <div style={{
        flexShrink: 0,
        width: isMobile ? 'auto' : 110,
        fontSize: 11,
        color: '#90A4AE',
        fontWeight: 600,
        paddingLeft: isMobile ? 46 : 0,
      }}>
        {formatDate(doc.date)}
      </div>

      {/* Actions */}
      <div style={{
        flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 6,
        paddingLeft: isMobile ? 46 : 12,
      }}>
        <DownloadButton doc={doc} />
        <FoundryShareButton />
      </div>
    </div>
  );
}

// ─── VaultTable ───────────────────────────────────────────────────────────────
function VaultTable({ docs, loading, isMobile }) {
  if (loading) {
    return (
      <div style={{ padding: '32px 0', textAlign: 'center', color: '#90A4AE', fontSize: 14 }}>
        Loading your documents…
      </div>
    );
  }

  if (!docs.length) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>📭</div>
        <div style={{ fontSize: 14, color: '#78909C', fontWeight: 600 }}>
          No documents here yet.
        </div>
        <div style={{ fontSize: 12, color: '#B0BEC5', marginTop: 4 }}>
          Documents will appear here as you create them across ForgeTomorrow.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* Header row — desktop only */}
      {!isMobile && (
        <div style={{
          display: 'flex', alignItems: 'center',
          padding: '6px 14px',
          fontSize: 10, fontWeight: 800, color: '#90A4AE',
          letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>
          <div style={{ flex: 1 }}>Document</div>
          <div style={{ width: 110 }}>Last Updated</div>
          <div style={{ width: 160, paddingLeft: 12 }}>Actions</div>
        </div>
      )}
      {docs.map((doc) => (
        <VaultRow key={doc.id} doc={doc} isMobile={isMobile} />
      ))}
    </div>
  );
}

// ─── TabBar ───────────────────────────────────────────────────────────────────
function TabBar({ activeTab, setActiveTab, counts }) {
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: 6,
      padding: '10px 14px 0 14px',
      borderBottom: '1px solid rgba(0,0,0,0.07)',
    }}>
      {TABS.map((tab) => {
        const count = counts[tab.key] ?? 0;
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 12px',
              borderRadius: '8px 8px 0 0',
              border: 'none',
              borderBottom: isActive ? '2px solid #FF7043' : '2px solid transparent',
              background: isActive ? 'rgba(255,112,67,0.08)' : 'transparent',
              color: isActive ? '#FF7043' : '#78909C',
              fontSize: 12,
              fontWeight: isActive ? 800 : 600,
              cursor: 'pointer',
              transition: 'all 150ms ease',
              whiteSpace: 'nowrap',
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {count > 0 && (
              <span style={{
                fontSize: 10, fontWeight: 800,
                background: isActive ? '#FF7043' : 'rgba(0,0,0,0.10)',
                color: isActive ? '#fff' : '#546E7A',
                borderRadius: 999, padding: '1px 5px', minWidth: 16,
                textAlign: 'center',
              }}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ForgeVaultPage() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ── Fetch all artifact lists in parallel ──────────────────────────────────
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    async function safeGet(url) {
      try {
        const res = await fetch(url, { credentials: 'include' });
        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;
      }
    }

    async function loadAll() {
      const [
        resumeData,
        coverData,
        roadmapData,
        negotiationData,
        packetData,
        strategyData,
        vaultData,       // aggregator for interview prep + POP (see api/vault/documents.js)
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
      ];

      // Sort by date descending
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

  // ── Filtered view ─────────────────────────────────────────────────────────
  const filtered = activeTab === 'all'
    ? docs
    : docs.filter((d) => d.type === activeTab);

  // ── Tab counts ─────────────────────────────────────────────────────────────
  const counts = {};
  counts.all = docs.length;
  TABS.slice(1).forEach((tab) => {
    counts[tab.key] = docs.filter((d) => d.type === tab.key).length;
  });

  // ── KPI strip ─────────────────────────────────────────────────────────────
  const kpiTypes = [
    { key: 'resume',      label: 'Resumes',    icon: '📄' },
    { key: 'cover',       label: 'Covers',     icon: '✉️' },
    { key: 'interview',   label: 'Prep Docs',  icon: '🎯' },
    { key: 'negotiation', label: 'Briefs',     icon: '🤝' },
  ];

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
            title="ForgeVault"
            description="Your complete document archive — every artifact ForgeTomorrow has built for you, in one place."
          />
        }
        right={<RightRailPlacementManager slot="right_rail_1" />}
        rightVariant="light"
      >
        {/* ── KPI strip ─────────────────────────────────────────────── */}
        {!loading && docs.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${kpiTypes.length}, 1fr)`,
            gap: GAP,
          }}>
            {kpiTypes.map(({ key, label, icon }) => {
              const c = counts[key] || 0;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  style={{
                    ...GLASS,
                    padding: '12px 14px',
                    border: activeTab === key
                      ? '1px solid rgba(255,112,67,0.40)'
                      : GLASS.border,
                    background: activeTab === key
                      ? 'rgba(255,112,67,0.06)'
                      : GLASS.background,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 150ms ease',
                  }}
                >
                  <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
                  <div style={{
                    fontSize: 22, fontWeight: 900,
                    color: activeTab === key ? '#FF7043' : '#112033',
                    lineHeight: 1,
                  }}>
                    {c}
                  </div>
                  <div style={{ fontSize: 11, color: '#78909C', fontWeight: 700, marginTop: 2 }}>
                    {label}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Main vault card ────────────────────────────────────────── */}
        <section style={{ ...GLASS, overflow: 'hidden' }}>
          {/* Section heading */}
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
            <div style={{ fontSize: 12, color: '#90A4AE', fontWeight: 600 }}>
              {loading ? '—' : `${filtered.length} document${filtered.length !== 1 ? 's' : ''}`}
            </div>
          </div>

          {/* Tabs */}
          <TabBar activeTab={activeTab} setActiveTab={setActiveTab} counts={counts} />

          {/* Table */}
          <div style={{ padding: '12px 14px 14px 14px' }}>
            {error ? (
              <div style={{
                padding: '20px 0', textAlign: 'center',
                color: '#E53935', fontSize: 13, fontWeight: 600,
              }}>
                {error}
                <button
                  onClick={() => window.location.reload()}
                  style={{
                    display: 'block', margin: '10px auto 0',
                    padding: '6px 14px', borderRadius: 8,
                    border: '1px solid rgba(229,57,53,0.30)',
                    background: 'rgba(229,57,53,0.06)',
                    color: '#E53935', fontSize: 12, fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Retry
                </button>
              </div>
            ) : (
              <VaultTable docs={filtered} loading={loading} isMobile={isMobile} />
            )}
          </div>
        </section>

        {/* ── Foundry callout ────────────────────────────────────────── */}
        <div style={{
          ...GLASS,
          padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        }}>
          <div style={{ fontSize: 22 }}>⚡</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#112033' }}>
              Share to Foundry — Coming Soon
            </div>
            <div style={{ fontSize: 11, color: '#78909C', marginTop: 2 }}>
              Share any document directly into a live Foundry coaching or review session. Available in an upcoming release.
            </div>
          </div>
          <span style={{
            fontSize: 10, fontWeight: 800,
            background: 'rgba(255,112,67,0.15)', color: '#FF7043',
            borderRadius: 999, padding: '3px 9px',
          }}>
            COMING SOON
          </span>
        </div>
      </SeekerLayout>
    </>
  );
}