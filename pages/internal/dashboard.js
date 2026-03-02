// pages/internal/dashboard.js
// Self-contained dark CRM dashboard — exact design from mockup, real data.
// No InternalLayoutPlain. Drop this file in, it owns its full layout.

import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]';

// ✅ NEW: use internal header component (no hard-wired topnav)
import EmployeeHeader from '@/components/employee/EmployeeHeader';

const PRIORITY_COLOR = { P1: '#EF4444', P2: '#F59E0B', P3: '#3B82F6', P4: '#636B78' };
const PRIORITY_GLOW  = { P1: '0 0 6px #EF4444', P2: 'none', P3: 'none', P4: 'none' };

const STATUS_LABEL = {
  OPEN: 'Open', ASSIGNED: 'Assigned', IN_PROGRESS: 'In Progress',
  ON_HOLD: 'On Hold', PENDING_CUSTOMER: 'Pending',
  RESOLVED: 'Resolved', CLOSED: 'Closed', CANCELLED: 'Cancelled',
};

const STATUS_CHIP = {
  OPEN:             { bg: '#3B82F620', color: '#3B82F6', border: '#3B82F640' },
  ASSIGNED:         { bg: '#E8590C20', color: '#E8590C', border: '#E8590C40' },
  IN_PROGRESS:      { bg: '#22C55E20', color: '#22C55E', border: '#22C55E40' },
  ON_HOLD:          { bg: '#F59E0B20', color: '#F59E0B', border: '#F59E0B40' },
  PENDING_CUSTOMER: { bg: '#A78BFA20', color: '#A78BFA', border: '#A78BFA40' },
  RESOLVED:         { bg: '#63687820', color: '#636B78', border: '#63687840' },
  CLOSED:           { bg: '#63687820', color: '#636B78', border: '#63687840' },
};

// ─── CSS (exact mockup design system, scoped to #crm-root) ───────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

  #crm-root, #crm-root * { margin:0; padding:0; box-sizing:border-box; }

  #crm-root {
    font-family: 'DM Sans', sans-serif;
    background: #111318;
    color: #F0F2F5;
    height: 100vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    --orange: #E8590C;
    --dark: #111318;
    --dark-2: #1C1F27;
    --dark-3: #252932;
    --dark-4: #2F3340;
    --border: #353A45;
    --text-1: #F0F2F5;
    --text-2: #9BA3B0;
    --text-3: #636B78;
    --green: #22C55E;
    --blue: #3B82F6;
    --yellow: #F59E0B;
    --red: #EF4444;
  }

  /* TOPNAV (kept in CSS even though we now render EmployeeHeader) */
  #crm-root .topnav {
    height:52px; background:var(--dark-2); border-bottom:1px solid var(--border);
    display:flex; align-items:center; padding:0 20px; gap:16px; flex-shrink:0; z-index:100;
  }
  #crm-root .logo { display:flex; align-items:center; gap:10px; }
  #crm-root .logo-mark {
    width:28px; height:28px; background:var(--orange); border-radius:7px;
    display:flex; align-items:center; justify-content:center;
    font-size:14px; font-weight:700; color:white; flex-shrink:0;
  }
  #crm-root .logo-name { font-size:15px; font-weight:700; color:var(--text-1); letter-spacing:-0.3px; }
  #crm-root .nav-badge { font-size:10px; font-weight:600; padding:2px 8px; border-radius:4px; letter-spacing:0.5px; text-transform:uppercase; }
  #crm-root .badge-suite { background:var(--dark-4); color:var(--text-2); }
  #crm-root .badge-limited { background:#F59E0B22; color:var(--yellow); border:1px solid #F59E0B44; }
  #crm-root .nav-spacer { flex:1; }
  #crm-root .nav-right { display:flex; align-items:center; gap:12px; }
  #crm-root .view-as { display:flex; align-items:center; gap:8px; font-size:12px; color:var(--text-3); }
  #crm-root .view-select {
    background:var(--dark-3); border:1px solid var(--border); color:var(--text-2);
    font-family:'DM Sans',sans-serif; font-size:12px; padding:4px 28px 4px 10px;
    border-radius:6px; appearance:none; cursor:pointer;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239BA3B0' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
    background-repeat:no-repeat; background-position:right 8px center;
  }
  #crm-root .btn-site {
    background:var(--orange); color:white; border:none; font-family:'DM Sans',sans-serif;
    font-size:12px; font-weight:600; padding:6px 14px; border-radius:7px; cursor:pointer;
    text-decoration:none; display:inline-flex; align-items:center; transition:background 0.15s;
  }
  #crm-root .btn-site:hover { background:#cf5010; }
  #crm-root .avatar {
    width:30px; height:30px; border-radius:50%; background:var(--dark-4);
    border:2px solid var(--border); display:flex; align-items:center; justify-content:center;
    font-size:12px; font-weight:600; color:var(--text-2); cursor:pointer;
  }

  /* BREADCRUMB */
  #crm-root .breadcrumb {
    height:36px; background:var(--dark-2); border-bottom:1px solid var(--border);
    display:flex; align-items:center; padding:0 20px; gap:6px; flex-shrink:0;
  }
  #crm-root .crumb { font-size:12px; color:var(--text-3); }
  #crm-root .crumb-sep { font-size:12px; color:var(--text-3); }
  #crm-root .crumb-current { font-size:12px; color:var(--text-2); }

  /* MAIN LAYOUT */
  #crm-root .main-layout { display:flex; flex:1; overflow:hidden; }

  /* SIDEBAR */
  #crm-root .sidebar {
    width:220px; background:var(--dark-2); border-right:1px solid var(--border);
    display:flex; flex-direction:column; padding:16px 12px; gap:4px; flex-shrink:0; overflow-y:auto;
  }
  #crm-root .sidebar-section {
    font-size:10px; font-weight:600; color:var(--text-3); letter-spacing:0.8px;
    text-transform:uppercase; padding:12px 8px 6px; margin-top:4px;
  }
  #crm-root .sidebar-section:first-child { margin-top:0; padding-top:2px; }
  #crm-root .nav-item {
    display:flex; align-items:center; gap:10px; padding:7px 10px; border-radius:8px;
    font-size:13px; font-weight:500; color:var(--text-2); cursor:pointer; transition:all 0.12s;
    text-decoration:none; user-select:none;
  }
  #crm-root .nav-item:hover { background:var(--dark-3); color:var(--text-1); }
  #crm-root .nav-item.active { background:var(--orange); color:white; }
  #crm-root .nav-count {
    margin-left:auto; font-size:10px; font-weight:600; font-family:'DM Mono',monospace;
    background:var(--dark-4); color:var(--text-2); padding:1px 6px; border-radius:10px;
  }
  #crm-root .nav-item.active .nav-count { background:rgba(255,255,255,0.2); color:white; }

  /* CONTENT */
  #crm-root .content {
    flex:1; overflow-y:auto; padding:20px 24px;
    display:flex; flex-direction:column; gap:20px;
  }
  #crm-root .content-header {
    display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px;
  }
  #crm-root .page-title { font-size:20px; font-weight:700; color:var(--text-1); letter-spacing:-0.3px; }
  #crm-root .header-controls { display:flex; align-items:center; gap:10px; }
  #crm-root .queue-selector { display:flex; align-items:center; gap:8px; font-size:12px; color:var(--text-3); }
  #crm-root .queue-select {
    background:var(--dark-3); border:1px solid var(--border); color:var(--text-1);
    font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500;
    padding:7px 32px 7px 12px; border-radius:8px; appearance:none; cursor:pointer; min-width:160px;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239BA3B0' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
    background-repeat:no-repeat; background-position:right 10px center; transition:border-color 0.15s;
  }
  #crm-root .queue-select:focus { outline:none; border-color:var(--orange); }
  #crm-root .btn-create {
    display:flex; align-items:center; gap:6px; background:var(--orange); color:white; border:none;
    font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; padding:8px 16px;
    border-radius:8px; cursor:pointer; transition:background 0.15s; text-decoration:none;
  }
  #crm-root .btn-create:hover { background:#cf5010; }

  /* BREACH BANNER */
  #crm-root .breach-banner {
    display:flex; align-items:center; gap:10px; background:#EF444410;
    border:1px solid #EF444430; border-radius:8px; padding:10px 16px;
    font-size:12px; color:var(--red); animation:pulseBorder 2s ease-in-out infinite;
  }
  @keyframes pulseBorder { 0%,100%{border-color:#EF444430} 50%{border-color:#EF444480} }
  #crm-root .breach-dot {
    width:8px; height:8px; border-radius:50%; background:var(--red);
    animation:pulseDot 2s ease-in-out infinite; flex-shrink:0;
  }
  @keyframes pulseDot { 0%,100%{opacity:1} 50%{opacity:0.4} }
  #crm-root .breach-text { flex:1; font-weight:500; }
  #crm-root .breach-action { font-size:11px; font-weight:600; color:var(--red); text-decoration:underline; cursor:pointer; white-space:nowrap; }

  /* STAT SECTIONS */
  #crm-root .stat-section {
    background:var(--dark-2); border:1px solid var(--border); border-radius:12px;
    overflow:hidden; animation:fadeUp 0.4s ease both;
  }
  @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  #crm-root .stat-section-header {
    display:flex; align-items:center; justify-content:space-between;
    padding:14px 20px 12px; border-bottom:1px solid var(--border);
  }
  #crm-root .stat-section-title { font-size:13px; font-weight:600; color:var(--text-1); display:flex; align-items:center; gap:8px; }
  #crm-root .type-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
  #crm-root .stat-section-meta { font-size:11px; color:var(--text-3); font-family:'DM Mono',monospace; }
  #crm-root .stat-grid { display:grid; }
  #crm-root .stat-card {
    padding:16px 20px; border-right:1px solid var(--border); cursor:pointer;
    transition:background 0.15s; position:relative;
  }
  #crm-root .stat-card:last-child { border-right:none; }
  #crm-root .stat-card:hover { background:var(--dark-3); }
  #crm-root .stat-label { font-size:10px; font-weight:600; letter-spacing:0.6px; text-transform:uppercase; color:var(--text-3); margin-bottom:8px; white-space:nowrap; }
  #crm-root .stat-value { font-size:26px; font-weight:700; font-family:'DM Mono',monospace; color:var(--text-1); line-height:1; margin-bottom:4px; }
  #crm-root .stat-value.breach { color:var(--red); }
  #crm-root .stat-value.warn   { color:var(--yellow); }
  #crm-root .stat-value.good   { color:var(--green); }
  #crm-root .stat-sub { font-size:11px; color:var(--text-3); white-space:nowrap; }
  #crm-root .stat-indicator { position:absolute; bottom:0; left:20px; right:20px; height:2px; border-radius:2px; background:transparent; transition:background 0.2s; }
  #crm-root .stat-card:hover .stat-indicator { background:var(--orange); }
  #crm-root .stat-card.alert .stat-indicator { background:var(--red) !important; }

  /* SKELETON */
  #crm-root .skeleton { background:var(--dark-3); border-radius:6px; animation:shimmer 1.5s ease-in-out infinite; }
  @keyframes shimmer { 0%,100%{opacity:0.5} 50%{opacity:1} }

  /* BOTTOM SPLIT */
  #crm-root .bottom-split { display:grid; grid-template-columns:1fr 280px; gap:20px; animation:fadeUp 0.4s ease 0.15s both; }

  /* RECENT PANEL */
  #crm-root .recent-panel { background:var(--dark-2); border:1px solid var(--border); border-radius:12px; overflow:hidden; display:flex; flex-direction:column; }
  #crm-root .panel-header { display:flex; align-items:center; justify-content:space-between; padding:14px 20px; border-bottom:1px solid var(--border); }
  #crm-root .panel-title { font-size:13px; font-weight:600; color:var(--text-1); }
  #crm-root .panel-title span { color:var(--text-3); font-weight:400; }
  #crm-root .btn-view { font-size:12px; font-weight:500; color:var(--orange); background:none; border:1px solid var(--border); padding:4px 12px; border-radius:6px; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.15s; text-decoration:none; }
  #crm-root .btn-view:hover { border-color:var(--orange); background:#E8590C15; }
  #crm-root .ticket-row { display:flex; align-items:center; gap:12px; padding:12px 20px; border-bottom:1px solid var(--border); cursor:pointer; transition:background 0.12s; text-decoration:none; color:inherit; }
  #crm-root .ticket-row:last-child { border-bottom:none; }
  #crm-root .ticket-row:hover { background:var(--dark-3); }
  #crm-root .ticket-priority { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
  #crm-root .ticket-info { flex:1; min-width:0; }
  #crm-root .ticket-title { font-size:13px; font-weight:500; color:var(--text-1); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:3px; }
  #crm-root .ticket-meta { display:flex; align-items:center; gap:8px; font-size:11px; color:var(--text-3); font-family:'DM Mono',monospace; }
  #crm-root .ticket-meta-sep { color:var(--border); }
  #crm-root .sla-bar-wrap { display:flex; flex-direction:column; gap:3px; width:80px; flex-shrink:0; }
  #crm-root .sla-label { font-size:10px; color:var(--text-3); font-family:'DM Mono',monospace; white-space:nowrap; }
  #crm-root .sla-bar { height:3px; background:var(--dark-4); border-radius:2px; overflow:hidden; }
  #crm-root .sla-fill { height:100%; border-radius:2px; transition:width 0.3s; }
  #crm-root .sla-ok     { background:var(--green); }
  #crm-root .sla-warn   { background:var(--yellow); }
  #crm-root .sla-breach-fill { background:var(--red); }
  #crm-root .status-chip { font-size:10px; font-weight:600; padding:3px 8px; border-radius:5px; white-space:nowrap; border:1px solid; text-transform:uppercase; letter-spacing:0.3px; }
  #crm-root .assignee-avatar { width:26px; height:26px; border-radius:50%; background:var(--dark-4); border:1px solid var(--border); display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:600; color:var(--text-2); flex-shrink:0; }
  #crm-root .panel-footer { padding:10px 20px; border-top:1px solid var(--border); font-size:11px; color:var(--text-3); display:flex; gap:8px; align-items:center; font-family:'DM Mono',monospace; }
  #crm-root .footer-dot { color:var(--border); }

  /* RIGHT COL */
  #crm-root .right-col { display:flex; flex-direction:column; gap:16px; }
  #crm-root .org-card { background:var(--dark-2); border:1px solid var(--border); border-radius:12px; overflow:hidden; }
  #crm-root .org-card-header { padding:14px 16px; border-bottom:1px solid var(--border); }
  #crm-root .org-card-title { font-size:13px; font-weight:600; color:var(--text-1); }
  #crm-root .org-card-sub { font-size:11px; color:var(--text-3); margin-top:2px; }
  #crm-root .org-row { display:flex; align-items:center; justify-content:space-between; padding:10px 16px; border-bottom:1px solid var(--border); cursor:pointer; transition:background 0.12s; text-decoration:none; color:inherit; }
  #crm-root .org-row:last-child { border-bottom:none; }
  #crm-root .org-row:hover { background:var(--dark-3); }
  #crm-root .org-row-label { font-size:12px; font-weight:500; color:var(--text-2); }
  #crm-root .org-badge { font-size:9px; font-weight:600; padding:1px 5px; border-radius:3px; background:var(--dark-4); color:var(--text-3); text-transform:uppercase; letter-spacing:0.3px; }
  #crm-root .my-work-card { background:var(--dark-2); border:1px solid var(--border); border-radius:12px; overflow:hidden; }
  #crm-root .my-work-item { display:flex; align-items:center; gap:10px; padding:10px 16px; border-bottom:1px solid var(--border); cursor:pointer; transition:background 0.12s; text-decoration:none; color:inherit; }
  #crm-root .my-work-item:last-child { border-bottom:none; }
  #crm-root .my-work-item:hover { background:var(--dark-3); }
  #crm-root .my-work-num { font-size:11px; font-family:'DM Mono',monospace; color:var(--text-3); white-space:nowrap; }
  #crm-root .my-work-title { font-size:12px; font-weight:500; color:var(--text-2); flex:1; min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

  #crm-root ::-webkit-scrollbar { width:4px; }
  #crm-root ::-webkit-scrollbar-track { background:transparent; }
  #crm-root ::-webkit-scrollbar-thumb { background:var(--dark-4); border-radius:4px; }
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────
const ticketRef = (n) => `FT-${String(n).padStart(5, '0')}`;
const initials  = (u) => u ? `${u.firstName?.[0]??''}${u.lastName?.[0]??''}`.toUpperCase()||'?' : '?';
const timeAgo   = (d) => {
  const m = Math.floor((Date.now() - new Date(d)) / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  return new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric' });
};

function slaPercent(t) {
  if (!t.slaResolveDue || !t.createdAt) return null;
  const total   = new Date(t.slaResolveDue) - new Date(t.createdAt);
  const elapsed = Date.now() - new Date(t.createdAt);
  return Math.min(100, Math.round((elapsed / total) * 100));
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function StatCard({ label, value, sub, colorClass, alert, span }) {
  return (
    <div className={`stat-card${alert ? ' alert' : ''}`} style={span ? { gridColumn: `span ${span}` } : {}}>
      <div className="stat-label">{label}</div>
      <div className={`stat-value${colorClass ? ` ${colorClass}` : ''}`}
           style={typeof value === 'string' && value.length > 5 ? { fontSize: 18 } : {}}>
        {value ?? '—'}
      </div>
      <div className="stat-sub">{sub}</div>
      <div className="stat-indicator" />
    </div>
  );
}

function SkeletonStats({ cols }) {
  return (
    <div className="stat-grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {Array(cols).fill(0).map((_, i) => (
        <div key={i} className="stat-card">
          <div className="skeleton" style={{ height: 10, width: 56, marginBottom: 10 }} />
          <div className="skeleton" style={{ height: 26, width: 44, marginBottom: 6 }} />
          <div className="skeleton" style={{ height: 9, width: 36 }} />
        </div>
      ))}
    </div>
  );
}

function TicketRow({ ticket }) {
  const ref  = ticketRef(ticket.number);
  const pct  = slaPercent(ticket);
  const chip = STATUS_CHIP[ticket.status] ?? STATUS_CHIP.OPEN;
  const slaClass = ticket.slaBreached || pct >= 100 ? 'sla-fill sla-breach-fill'
                 : pct >= 75 ? 'sla-fill sla-warn'
                 : 'sla-fill sla-ok';

  return (
    <Link href={`/internal/tickets/${ticket.id}`} className="ticket-row">
      <div className="ticket-priority" style={{ background: PRIORITY_COLOR[ticket.priority], boxShadow: PRIORITY_GLOW[ticket.priority] }} />
      <div className="ticket-info">
        <div className="ticket-title">{ref} · {ticket.title}</div>
        <div className="ticket-meta">
          <span>{ticket.type}</span><span className="ticket-meta-sep">·</span>
          <span>{ticket.priority}</span><span className="ticket-meta-sep">·</span>
          <span>{ticket.queue?.name ?? ''}</span><span className="ticket-meta-sep">·</span>
          <span>{timeAgo(ticket.updatedAt)}</span>
        </div>
      </div>
      {pct !== null && (
        <div className="sla-bar-wrap">
          <div className="sla-label">{ticket.slaBreached ? 'BREACHED' : `SLA ${pct}%`}</div>
          <div className="sla-bar"><div className={slaClass} style={{ width: `${pct}%` }} /></div>
        </div>
      )}
      <span className="status-chip" style={{ background: chip.bg, color: chip.color, borderColor: chip.border }}>
        {STATUS_LABEL[ticket.status] ?? ticket.status}
      </span>
      <div className="assignee-avatar">{initials(ticket.assignedTo)}</div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Dashboard({ queues: initialQueues }) {
  const [queues, setQueues]     = useState(initialQueues ?? []);
  const [queueId, setQueueId]   = useState(initialQueues?.[0]?.id ?? '');
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);

  // ✅ minimal: let EmployeeHeader know if we’re mobile
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const onResize = () => setIsMobile(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const fetchStats = useCallback(async (id) => {
    if (!id) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/crm/reports/queue?queueId=${id}`);
      setData(await r.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStats(queueId); }, [queueId, fetchStats]);

  const stats   = data?.stats ?? {};
  const recent  = data?.recentTickets ?? [];
  const myWork  = data?.myOpenTickets ?? [];
  const qName   = queues.find((q) => q.id === queueId)?.name ?? '';
  const recentInc = recent.filter((t) => t.type === 'INCIDENT').slice(0, 5);
  const breached  = recent.find((t) => t.slaBreached);

  return (
    <>
      <Head><title>Dashboard — ForgeTomorrow Employee Suite</title></Head>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div id="crm-root">
        {/* ✅ INTERNAL HEADER (component, not hard-wired) */}
        <EmployeeHeader
          headerTitle="Employee Suite"
          headerSubtitle=""
          employee={false}
          department=""
          active="dashboard"
          hat="seeker"
          onHatChange={() => {}}
          isMobile={isMobile}
          onOpenTools={() => {}}
        />

        {/* BREADCRUMB */}
        <div className="breadcrumb">
          <span className="crumb">Employee Suite</span>
          <span className="crumb-sep">›</span>
          <span className="crumb-current">Dashboard</span>
        </div>

        {/* MAIN */}
        <div className="main-layout">

          {/* SIDEBAR */}
          <aside className="sidebar">
            <div className="sidebar-section">Employee Suite</div>
            <Link href="/internal/dashboard" className="nav-item active">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
              Dashboard
            </Link>
            <Link href="/internal/tickets/new" className="nav-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
              Create Ticket
            </Link>
            <Link href="/internal/tickets/mine" className="nav-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>
              My Open Tickets
              {myWork.length > 0 && <span className="nav-count">{myWork.length}</span>}
            </Link>
            <Link href="/internal/queues" className="nav-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
              Queue Management
            </Link>
            <Link href="/internal/reports" className="nav-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
              Reports
            </Link>
            <div className="sidebar-section">Forge Site</div>
            <Link href="/seeker-dashboard" className="nav-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              Open Site
            </Link>
          </aside>

          {/* CONTENT */}
          <main className="content">

            {/* HEADER */}
            <div className="content-header">
              <div className="page-title">Dashboard</div>
              <div className="header-controls">
                <div className="queue-selector">
                  <span>Queue</span>
                  <select className="queue-select" value={queueId} onChange={(e) => setQueueId(e.target.value)}>
                    {queues.map((q) => <option key={q.id} value={q.id}>{q.name}</option>)}
                  </select>
                </div>
                <Link href="/internal/tickets/new" className="btn-create">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                  Create Ticket
                </Link>
              </div>
            </div>

            {/* SLA BREACH BANNER */}
            {!loading && breached && (
              <div className="breach-banner">
                <div className="breach-dot" />
                <span className="breach-text">
                  {stats.slaBreached} ticket{stats.slaBreached !== 1 ? 's' : ''} breached SLA — {ticketRef(breached.number)} · {breached.priority}
                </span>
                <Link href={`/internal/tickets/${breached.id}`} className="breach-action">View ticket →</Link>
              </div>
            )}

            {/* INCIDENTS */}
            <div className="stat-section">
              <div className="stat-section-header">
                <div className="stat-section-title">
                  <div className="type-dot" style={{ background: '#EF4444' }} /> Incidents
                </div>
                <span className="stat-section-meta">{qName} · Live</span>
              </div>
              {loading ? <SkeletonStats cols={7} /> : (
                <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
                  <StatCard label="Assigned"    value={stats.assigned}           sub={qName} />
                  <StatCard label="Open"        value={stats.open}               sub={qName} />
                  <StatCard label="Unassigned"  value={stats.unassigned}         sub="Open"       colorClass={stats.unassigned > 0 ? 'warn' : ''} />
                  <StatCard label="On Hold"     value={stats.onHold}             sub="Open" />
                  <StatCard label="Aging"       value={stats.aging}              sub="> 7 days"   colorClass={stats.aging > 0 ? 'breach' : ''} alert={stats.aging > 0} />
                  <StatCard label="Reopen"      value={stats.reopen ?? '—'}      sub="This month" />
                  <StatCard label="Avg Resolve" value={stats.avgResolution ?? '—'} sub="This month" colorClass={stats.avgResolution ? 'good' : ''} />
                </div>
              )}
            </div>

            {/* SCTASKS */}
            <div className="stat-section" style={{ animationDelay: '0.05s' }}>
              <div className="stat-section-header">
                <div className="stat-section-title">
                  <div className="type-dot" style={{ background: '#3B82F6' }} /> SCTASKs
                </div>
                <span className="stat-section-meta">{qName} · Live</span>
              </div>
              {loading ? <SkeletonStats cols={7} /> : (
                <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
                  <StatCard label="Assigned"        value={stats.assigned}            sub={qName} />
                  <StatCard label="Open"            value={stats.open}                sub={qName} />
                  <StatCard label="Unassigned"      value={stats.unassigned}          sub="Open" colorClass={stats.unassigned > 0 ? 'warn' : ''} />
                  <StatCard label="Pending"         value={stats.pending}             sub="Open" />
                  <StatCard label="Aging"           value={stats.aging}               sub="> 7 days" colorClass={stats.aging > 0 ? 'breach' : ''} alert={stats.aging > 0} />
                  <StatCard label="Avg Fulfillment" value={stats.avgFulfillment ?? '—'} sub="This month" colorClass={stats.avgFulfillment ? 'good' : ''} span={2} />
                </div>
              )}
            </div>

            {/* BOTTOM SPLIT */}
            <div className="bottom-split">

              {/* RECENT INCIDENTS */}
              <div className="recent-panel">
                <div className="panel-header">
                  <div className="panel-title">Recent Incidents <span>· {qName}</span></div>
                  <Link href={`/internal/tickets?queueId=${queueId}&type=INCIDENT`} className="btn-view">View queue</Link>
                </div>
                {loading ? (
                  Array(4).fill(0).map((_, i) => (
                    <div key={i} style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
                      <div className="skeleton" style={{ height: 13, width: '70%', marginBottom: 6 }} />
                      <div className="skeleton" style={{ height: 10, width: '45%' }} />
                    </div>
                  ))
                ) : recentInc.length ? (
                  recentInc.map((t) => <TicketRow key={t.id} ticket={t} />)
                ) : (
                  <div style={{ padding: 20, fontSize: 13, color: 'var(--text-3)', textAlign: 'center' }}>
                    No incidents in this queue.
                  </div>
                )}
                <div className="panel-footer">
                  <span>Active: <strong style={{ color: 'var(--text-2)' }}>{stats.open ?? 0}</strong></span>
                  <span className="footer-dot">·</span>
                  <span>Avg resolve: <strong style={{ color: 'var(--text-2)' }}>{stats.avgResolution ?? '—'}</strong></span>
                  <span className="footer-dot">·</span>
                  <span>SLA breached: <strong style={{ color: stats.slaBreached > 0 ? 'var(--red)' : 'var(--text-2)' }}>{stats.slaBreached ?? 0}</strong></span>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="right-col">
                <div className="org-card">
                  <div className="org-card-header">
                    <div className="org-card-title">Org-wide</div>
                    <div className="org-card-sub">Full lists (not queue-scoped)</div>
                  </div>
                  {[
                    { label: 'All Incidents', href: '/internal/tickets?type=INCIDENT' },
                    { label: 'All Requests',  href: '/internal/tickets?type=REQUEST' },
                    { label: 'All SCTASKs',   href: '/internal/tickets?type=SCTASK' },
                    { label: 'Problems',      href: '/internal/tickets?type=PROBLEM' },
                    { label: 'Reports',       href: '/internal/reports' },
                  ].map((row) => (
                    <Link key={row.label} href={row.href} className="org-row">
                      <span className="org-row-label">{row.label}</span>
                      <span className="org-badge">live</span>
                    </Link>
                  ))}
                </div>

                <div className="my-work-card">
                  <div className="panel-header">
                    <div className="panel-title">My Work</div>
                    {myWork.length > 0 && <span className="org-badge">{myWork.length} open</span>}
                  </div>
                  {myWork.length ? myWork.slice(0, 6).map((t) => (
                    <Link key={t.id} href={`/internal/tickets/${t.id}`} className="my-work-item">
                      <div className="ticket-priority" style={{ background: PRIORITY_COLOR[t.priority], boxShadow: PRIORITY_GLOW[t.priority] }} />
                      <span className="my-work-num">{ticketRef(t.number)}</span>
                      <span className="my-work-title">{t.title}</span>
                    </Link>
                  )) : (
                    <div style={{ padding: '14px 16px', fontSize: 12, color: 'var(--text-3)' }}>No open tickets assigned to you.</div>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session?.user) return { redirect: { destination: '/auth/signin', permanent: false } };

  let queues = [];
  try {
    const { prisma } = await import('@/lib/prisma');
    queues = await prisma.queue.findMany({
      where: { isActive: true }, orderBy: { name: 'asc' },
      select: { id: true, name: true, color: true },
    });
  } catch (e) { console.error('[Dashboard SSR]', e.message); }

  return { props: { queues } };
}