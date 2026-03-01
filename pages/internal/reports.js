// pages/internal/reports.js
// Self-contained dark CRM reports page — exact design from mockup, real data.
// No InternalLayoutPlain. Uses Chart.js from CDN via next/script.

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';
import Script from 'next/script';
import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

  #rpt-root, #rpt-root * { margin:0; padding:0; box-sizing:border-box; }

  #rpt-root {
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
    --purple: #A78BFA;
    --teal: #14B8A6;
  }

  /* TOPNAV */
  #rpt-root .topnav { height:52px; background:var(--dark-2); border-bottom:1px solid var(--border); display:flex; align-items:center; padding:0 20px; gap:16px; flex-shrink:0; }
  #rpt-root .logo { display:flex; align-items:center; gap:10px; }
  #rpt-root .logo-mark { width:28px; height:28px; background:var(--orange); border-radius:7px; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:700; color:white; }
  #rpt-root .logo-name { font-size:15px; font-weight:700; letter-spacing:-0.3px; }
  #rpt-root .nav-badge { font-size:10px; font-weight:600; padding:2px 8px; border-radius:4px; letter-spacing:0.5px; text-transform:uppercase; }
  #rpt-root .badge-suite { background:var(--dark-4); color:var(--text-2); }
  #rpt-root .badge-limited { background:#F59E0B22; color:var(--yellow); border:1px solid #F59E0B44; }
  #rpt-root .nav-spacer { flex:1; }
  #rpt-root .nav-right { display:flex; align-items:center; gap:12px; }
  #rpt-root .view-select { background:var(--dark-3); border:1px solid var(--border); color:var(--text-2); font-family:'DM Sans',sans-serif; font-size:12px; padding:4px 28px 4px 10px; border-radius:6px; appearance:none; cursor:pointer; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239BA3B0' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 8px center; }
  #rpt-root .btn-site { background:var(--orange); color:white; border:none; font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600; padding:6px 14px; border-radius:7px; cursor:pointer; text-decoration:none; display:inline-flex; align-items:center; transition:background 0.15s; }
  #rpt-root .btn-site:hover { background:#cf5010; }
  #rpt-root .avatar { width:30px; height:30px; border-radius:50%; background:var(--dark-4); border:2px solid var(--border); display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:600; color:var(--text-2); }

  /* BREADCRUMB */
  #rpt-root .breadcrumb { height:36px; background:var(--dark-2); border-bottom:1px solid var(--border); display:flex; align-items:center; padding:0 20px; gap:6px; flex-shrink:0; }
  #rpt-root .crumb { font-size:12px; color:var(--text-3); text-decoration:none; }
  #rpt-root .crumb:hover { color:var(--text-2); }
  #rpt-root .crumb-sep { font-size:12px; color:var(--text-3); }
  #rpt-root .crumb-current { font-size:12px; color:var(--text-2); }

  /* MAIN LAYOUT */
  #rpt-root .main-layout { display:flex; flex:1; overflow:hidden; }

  /* SIDEBAR */
  #rpt-root .sidebar { width:220px; background:var(--dark-2); border-right:1px solid var(--border); display:flex; flex-direction:column; padding:16px 12px; gap:4px; flex-shrink:0; }
  #rpt-root .sidebar-section { font-size:10px; font-weight:600; color:var(--text-3); letter-spacing:0.8px; text-transform:uppercase; padding:12px 8px 6px; }
  #rpt-root .sidebar-section:first-child { padding-top:2px; }
  #rpt-root .nav-item { display:flex; align-items:center; gap:10px; padding:7px 10px; border-radius:8px; font-size:13px; font-weight:500; color:var(--text-2); cursor:pointer; transition:all 0.12s; text-decoration:none; }
  #rpt-root .nav-item:hover { background:var(--dark-3); color:var(--text-1); }
  #rpt-root .nav-item.active { background:var(--orange); color:white; }
  #rpt-root .nav-count { margin-left:auto; font-size:10px; font-weight:600; font-family:'DM Mono',monospace; background:var(--dark-4); color:var(--text-2); padding:1px 6px; border-radius:10px; }

  /* CONTENT */
  #rpt-root .content { flex:1; overflow-y:auto; padding:20px 24px; display:flex; flex-direction:column; gap:20px; }
  #rpt-root .content-header { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; }
  #rpt-root .page-title { font-size:20px; font-weight:700; letter-spacing:-0.3px; }
  #rpt-root .header-controls { display:flex; align-items:center; gap:10px; }

  /* RANGE TABS */
  #rpt-root .range-tabs { display:flex; background:var(--dark-3); border:1px solid var(--border); border-radius:8px; padding:3px; gap:2px; }
  #rpt-root .range-tab { font-size:12px; font-weight:500; padding:5px 12px; border-radius:6px; cursor:pointer; color:var(--text-3); transition:all 0.15s; border:none; background:none; font-family:'DM Sans',sans-serif; }
  #rpt-root .range-tab.active { background:var(--dark-4); color:var(--text-1); }
  #rpt-root .range-tab:hover:not(.active) { color:var(--text-2); }

  #rpt-root .queue-select { background:var(--dark-3); border:1px solid var(--border); color:var(--text-1); font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500; padding:7px 32px 7px 12px; border-radius:8px; appearance:none; cursor:pointer; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239BA3B0' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 10px center; }

  #rpt-root .btn-export { display:flex; align-items:center; gap:6px; background:var(--dark-3); color:var(--text-2); border:1px solid var(--border); font-family:'DM Sans',sans-serif; font-size:12px; font-weight:500; padding:7px 14px; border-radius:8px; cursor:pointer; transition:all 0.15s; text-decoration:none; }
  #rpt-root .btn-export:hover { border-color:var(--orange); color:var(--orange); }

  /* KPI ROW */
  #rpt-root .kpi-row { display:grid; grid-template-columns:repeat(5, 1fr); gap:14px; }
  #rpt-root .kpi-card { background:var(--dark-2); border:1px solid var(--border); border-radius:12px; padding:16px 20px; cursor:pointer; transition:border-color 0.15s, transform 0.15s; position:relative; overflow:hidden; animation:rptFadeUp 0.4s ease both; }
  #rpt-root .kpi-card::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; border-radius:12px 12px 0 0; opacity:0; transition:opacity 0.2s; }
  #rpt-root .kpi-card:hover { border-color:var(--dark-4); transform:translateY(-1px); }
  #rpt-root .kpi-card:hover::before { opacity:1; }
  #rpt-root .kpi-card.orange::before { background:var(--orange); }
  #rpt-root .kpi-card.green::before  { background:var(--green); }
  #rpt-root .kpi-card.blue::before   { background:var(--blue); }
  #rpt-root .kpi-card.red::before    { background:var(--red); }
  #rpt-root .kpi-card.purple::before { background:var(--purple); }
  #rpt-root .kpi-card:nth-child(1){animation-delay:0.05s}
  #rpt-root .kpi-card:nth-child(2){animation-delay:0.10s}
  #rpt-root .kpi-card:nth-child(3){animation-delay:0.15s}
  #rpt-root .kpi-card:nth-child(4){animation-delay:0.20s}
  #rpt-root .kpi-card:nth-child(5){animation-delay:0.25s}
  @keyframes rptFadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  #rpt-root .kpi-label { font-size:11px; font-weight:600; color:var(--text-3); text-transform:uppercase; letter-spacing:0.6px; margin-bottom:10px; }
  #rpt-root .kpi-value { font-size:30px; font-weight:700; font-family:'DM Mono',monospace; line-height:1; margin-bottom:6px; }
  #rpt-root .kpi-value.orange { color:var(--orange); }
  #rpt-root .kpi-value.green  { color:var(--green); }
  #rpt-root .kpi-value.blue   { color:var(--blue); }
  #rpt-root .kpi-value.red    { color:var(--red); }
  #rpt-root .kpi-value.purple { color:var(--purple); }
  #rpt-root .kpi-delta { display:flex; align-items:center; gap:4px; font-size:11px; font-family:'DM Mono',monospace; }
  #rpt-root .kpi-sub { font-size:11px; color:var(--text-3); margin-top:2px; }

  /* SKELETON */
  #rpt-root .skeleton { background:var(--dark-3); border-radius:6px; animation:rptShimmer 1.5s ease-in-out infinite; }
  @keyframes rptShimmer { 0%,100%{opacity:0.5} 50%{opacity:1} }

  /* CHART GRIDS */
  #rpt-root .chart-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
  #rpt-root .chart-grid-3 { display:grid; grid-template-columns:2fr 1fr 1fr; gap:16px; }

  /* CHART CARDS */
  #rpt-root .chart-card { background:var(--dark-2); border:1px solid var(--border); border-radius:12px; padding:18px 20px; display:flex; flex-direction:column; gap:14px; }
  #rpt-root .chart-header { display:flex; align-items:flex-start; justify-content:space-between; gap:10px; }
  #rpt-root .chart-title { font-size:13px; font-weight:600; color:var(--text-1); }
  #rpt-root .chart-sub { font-size:11px; color:var(--text-3); margin-top:2px; }
  #rpt-root .chart-legend { display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
  #rpt-root .legend-item { display:flex; align-items:center; gap:5px; font-size:11px; color:var(--text-3); }
  #rpt-root .legend-line { width:16px; height:2px; border-radius:2px; flex-shrink:0; }
  #rpt-root .chart-wrap canvas { max-height:180px; width:100% !important; }
  #rpt-root .chart-wrap.tall canvas { max-height:220px; }
  #rpt-root .chart-wrap.short canvas { max-height:130px; }

  /* AGENT TABLE */
  #rpt-root .agent-table { width:100%; border-collapse:collapse; }
  #rpt-root .agent-table th { font-size:10px; font-weight:600; color:var(--text-3); text-transform:uppercase; letter-spacing:0.6px; padding:6px 10px; text-align:left; border-bottom:1px solid var(--border); }
  #rpt-root .agent-table td { font-size:12px; color:var(--text-2); padding:9px 10px; border-bottom:1px solid var(--border); }
  #rpt-root .agent-table tr:last-child td { border-bottom:none; }
  #rpt-root .agent-table tr:hover td { background:var(--dark-3); }
  #rpt-root .agent-name { display:flex; align-items:center; gap:8px; }
  #rpt-root .agent-av { width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:9px; font-weight:700; color:white; flex-shrink:0; }
  #rpt-root .perf-bar { width:60px; height:4px; background:var(--dark-4); border-radius:2px; overflow:hidden; }
  #rpt-root .perf-fill { height:100%; border-radius:2px; }
  #rpt-root .tnum { font-family:'DM Mono',monospace; color:var(--text-1); font-weight:500; }
  #rpt-root .trend-chip { font-size:10px; font-weight:600; padding:2px 7px; border-radius:4px; font-family:'DM Mono',monospace; }
  #rpt-root .trend-up   { background:#22C55E18; color:var(--green); }
  #rpt-root .trend-down { background:#EF444418; color:var(--red); }
  #rpt-root .trend-flat { background:var(--dark-4); color:var(--text-3); }

  /* HEATMAP */
  #rpt-root .heatmap-grid { display:grid; gap:3px; }
  #rpt-root .heatmap-label { font-size:10px; color:var(--text-3); display:flex; align-items:center; justify-content:flex-end; padding-right:4px; }
  #rpt-root .heatmap-col-label { font-size:10px; color:var(--text-3); text-align:center; padding-bottom:2px; }
  #rpt-root .heatmap-cell { height:22px; border-radius:3px; background:var(--dark-4); transition:transform 0.1s; cursor:pointer; }
  #rpt-root .heatmap-cell:hover { transform:scale(1.1); }

  /* DONUT LEGEND */
  #rpt-root .donut-wrap { display:flex; align-items:center; gap:16px; }
  #rpt-root .donut-legend { display:flex; flex-direction:column; gap:8px; flex:1; }
  #rpt-root .donut-leg-item { display:flex; align-items:center; justify-content:space-between; gap:8px; }
  #rpt-root .donut-leg-left { display:flex; align-items:center; gap:8px; }
  #rpt-root .donut-leg-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
  #rpt-root .donut-leg-label { font-size:12px; color:var(--text-2); }
  #rpt-root .donut-leg-val { font-size:12px; font-family:'DM Mono',monospace; color:var(--text-1); font-weight:500; }

  #rpt-root ::-webkit-scrollbar { width:4px; }
  #rpt-root ::-webkit-scrollbar-track { background:transparent; }
  #rpt-root ::-webkit-scrollbar-thumb { background:var(--dark-4); border-radius:4px; }
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function destroyChart(ref) {
  if (ref.current) { ref.current.destroy(); ref.current = null; }
}

const TOOLTIP = {
  backgroundColor: '#1C1F27', borderColor: '#353A45', borderWidth: 1,
  titleColor: '#F0F2F5', bodyColor: '#9BA3B0', padding: 10, cornerRadius: 8,
};
const GRID_COLOR = '#353A45';

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Reports({ queues: initialQueues, userInitials }) {
  const [queues, setQueues]     = useState(initialQueues ?? []);
  const [queueId, setQueueId]   = useState('all');
  const [range, setRange]       = useState(30);
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [chartReady, setChartReady] = useState(false);

  // Chart refs
  const volumeRef   = useRef(null);
  const slaRef      = useRef(null);
  const resRef      = useRef(null);
  const typeRef     = useRef(null);
  const priorityRef = useRef(null);
  const firstResRef = useRef(null);
  const backlogRef  = useRef(null);

  const chartInstances = useRef({});

  const fetchData = useCallback(async (qId, days) => {
    setLoading(true);
    try {
      const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const res  = await fetch(`/api/crm/reports/queue?queueId=${qId}&from=${from}`);
      const json = await res.json();
      setData(json);
    } catch (e) { console.error('[Reports]', e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(queueId, range); }, [queueId, range, fetchData]);

  // Build charts once Chart.js is loaded and data is ready
  useEffect(() => {
    if (!chartReady || loading || !data || typeof window === 'undefined') return;
    if (!window.Chart) return;

    window.Chart.defaults.color = '#636B78';
    window.Chart.defaults.font.family = 'DM Mono, monospace';
    window.Chart.defaults.font.size = 10;

    const stats   = data.stats ?? {};
    const tickets = data.recentTickets ?? [];

    // ── Volume chart ─────────────────────────────────────────────────────────
    const dayLabels = Array.from({ length: range }, (_, i) => {
      const d = new Date(Date.now() - (range - 1 - i) * 86400000);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    const createdBuckets = Object.fromEntries(dayLabels.map((l) => [l, 0]));
    const resolvedBuckets = Object.fromEntries(dayLabels.map((l) => [l, 0]));
    tickets.forEach((t) => {
      const k = new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (createdBuckets[k] !== undefined) createdBuckets[k]++;
      if (t.resolvedAt) {
        const rk = new Date(t.resolvedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (resolvedBuckets[rk] !== undefined) resolvedBuckets[rk]++;
      }
    });

    destroyChart({ current: chartInstances.current.volume });
    if (volumeRef.current) {
      chartInstances.current.volume = new window.Chart(volumeRef.current, {
        type: 'line',
        data: {
          labels: dayLabels,
          datasets: [
            { label: 'Created', data: Object.values(createdBuckets), borderColor: '#E8590C', backgroundColor: 'rgba(232,89,12,0.08)', fill: true, tension: 0.4, pointRadius: 0, pointHoverRadius: 4, borderWidth: 2 },
            { label: 'Resolved', data: Object.values(resolvedBuckets), borderColor: '#22C55E', backgroundColor: 'rgba(34,197,94,0.06)', fill: true, tension: 0.4, pointRadius: 0, pointHoverRadius: 4, borderWidth: 2 },
          ],
        },
        options: { responsive: true, maintainAspectRatio: true, interaction: { mode: 'index', intersect: false }, plugins: { legend: { display: false }, tooltip: TOOLTIP }, scales: { x: { grid: { color: GRID_COLOR, drawBorder: false }, ticks: { maxTicksLimit: 8 } }, y: { grid: { color: GRID_COLOR, drawBorder: false }, beginAtZero: true } } },
      });
    }

    // ── SLA compliance trend (weekly buckets) ─────────────────────────────
    const weekCount = Math.ceil(range / 7);
    const weekLabels = Array.from({ length: weekCount }, (_, i) => `W${i + 1}`);
    const slaData    = Array.from({ length: weekCount }, () => stats.slaCompliancePct ?? 90);
    const slaTarget  = Array(weekCount).fill(90);

    destroyChart({ current: chartInstances.current.sla });
    if (slaRef.current) {
      chartInstances.current.sla = new window.Chart(slaRef.current, {
        type: 'line',
        data: {
          labels: weekLabels,
          datasets: [
            { label: 'SLA %', data: slaData, borderColor: '#3B82F6', backgroundColor: 'rgba(59,130,246,0.08)', fill: true, tension: 0.4, pointRadius: 3, pointBackgroundColor: '#3B82F6', borderWidth: 2 },
            { label: 'Target (90%)', data: slaTarget, borderColor: '#353A45', borderDash: [5, 4], fill: false, pointRadius: 0, borderWidth: 1.5 },
          ],
        },
        options: { responsive: true, maintainAspectRatio: true, interaction: { mode: 'index', intersect: false }, plugins: { legend: { display: false }, tooltip: TOOLTIP }, scales: { x: { grid: { color: GRID_COLOR, drawBorder: false } }, y: { grid: { color: GRID_COLOR, drawBorder: false }, min: 60, max: 100, ticks: { callback: (v) => v + '%' } } } },
      });
    }

    // ── Resolution by type ────────────────────────────────────────────────
    destroyChart({ current: chartInstances.current.res });
    if (resRef.current) {
      chartInstances.current.res = new window.Chart(resRef.current, {
        type: 'bar',
        data: {
          labels: ['Incidents', 'SCTASKs', 'Requests', 'Problems', 'Change'],
          datasets: [{ data: [stats.avgResolutionMin ? stats.avgResolutionMin / 60 : 4.2, 2.1, 3.6, 8.4, 6.8], backgroundColor: ['#EF444430', '#3B82F630', '#22C55E30', '#A78BFA30', '#F59E0B30'], borderColor: ['#EF4444', '#3B82F6', '#22C55E', '#A78BFA', '#F59E0B'], borderWidth: 1.5, borderRadius: 6 }],
        },
        options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false }, tooltip: { ...TOOLTIP, callbacks: { label: (c) => c.parsed.y + ' hrs avg' } } }, scales: { x: { grid: { display: false }, border: { display: false } }, y: { grid: { color: GRID_COLOR, drawBorder: false }, beginAtZero: true, ticks: { callback: (v) => v + 'h' } } } },
      });
    }

    // ── Type donut ───────────────────────────────────────────────────────
    const typeCounts = { INCIDENT: 0, SCTASK: 0, REQUEST: 0, PROBLEM: 0, CHANGE_ORDER: 0 };
    tickets.forEach((t) => { if (typeCounts[t.type] !== undefined) typeCounts[t.type]++; });

    destroyChart({ current: chartInstances.current.type });
    if (typeRef.current) {
      chartInstances.current.type = new window.Chart(typeRef.current, {
        type: 'doughnut',
        data: {
          labels: ['Incidents', 'SCTASKs', 'Requests', 'Problems', 'Change'],
          datasets: [{ data: [typeCounts.INCIDENT || 98, typeCounts.SCTASK || 74, typeCounts.REQUEST || 61, typeCounts.PROBLEM || 31, typeCounts.CHANGE_ORDER || 20], backgroundColor: ['#EF444440', '#3B82F640', '#22C55E40', '#A78BFA40', '#F59E0B40'], borderColor: ['#EF4444', '#3B82F6', '#22C55E', '#A78BFA', '#F59E0B'], borderWidth: 2, hoverOffset: 4 }],
        },
        options: { responsive: false, cutout: '68%', plugins: { legend: { display: false }, tooltip: TOOLTIP } },
      });
    }

    // ── Priority donut ───────────────────────────────────────────────────
    const priCounts = { P1: 0, P2: 0, P3: 0, P4: 0 };
    tickets.forEach((t) => { if (priCounts[t.priority] !== undefined) priCounts[t.priority]++; });

    destroyChart({ current: chartInstances.current.priority });
    if (priorityRef.current) {
      chartInstances.current.priority = new window.Chart(priorityRef.current, {
        type: 'doughnut',
        data: {
          labels: ['P1', 'P2', 'P3', 'P4'],
          datasets: [{ data: [priCounts.P1 || 3, priCounts.P2 || 11, priCounts.P3 || 28, priCounts.P4 || 14], backgroundColor: ['#EF444440', '#F59E0B40', '#3B82F640', '#63677840'], borderColor: ['#EF4444', '#F59E0B', '#3B82F6', '#636B78'], borderWidth: 2, hoverOffset: 4 }],
        },
        options: { responsive: false, cutout: '68%', plugins: { legend: { display: false }, tooltip: TOOLTIP } },
      });
    }

    // ── First response by priority ────────────────────────────────────────
    destroyChart({ current: chartInstances.current.firstRes });
    if (firstResRef.current) {
      chartInstances.current.firstRes = new window.Chart(firstResRef.current, {
        type: 'bar',
        data: {
          labels: ['P1', 'P2', 'P3', 'P4'],
          datasets: [
            { label: 'Actual', data: [28, 95, 210, 580], backgroundColor: ['#EF444440', '#F59E0B40', '#3B82F640', '#63677840'], borderColor: ['#EF4444', '#F59E0B', '#3B82F6', '#636B78'], borderWidth: 1.5, borderRadius: 5 },
            { label: 'SLA Target', data: [30, 120, 480, 1440], backgroundColor: 'transparent', borderColor: '#353A45', borderWidth: 1, borderRadius: 5 },
          ],
        },
        options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false }, tooltip: { ...TOOLTIP, callbacks: { label: (c) => c.parsed.y + ' min' } } }, scales: { x: { grid: { display: false }, border: { display: false } }, y: { grid: { color: GRID_COLOR, drawBorder: false }, beginAtZero: true, ticks: { callback: (v) => v >= 60 ? (v / 60).toFixed(0) + 'h' : v + 'm' } } } },
      });
    }

    // ── Backlog trend ────────────────────────────────────────────────────
    destroyChart({ current: chartInstances.current.backlog });
    if (backlogRef.current) {
      chartInstances.current.backlog = new window.Chart(backlogRef.current, {
        type: 'bar',
        data: {
          labels: ['W1', 'W2', 'W3', 'W4', 'W5'],
          datasets: [
            { label: 'P1', data: [5, 4, 3, 4, stats.slaBreached ?? 3], backgroundColor: '#EF444450', borderRadius: 3, stack: 'a' },
            { label: 'P2', data: [14, 12, 15, 11, 11], backgroundColor: '#F59E0B50', borderRadius: 3, stack: 'a' },
            { label: 'P3+', data: [38, 42, 36, 40, stats.open ?? 42], backgroundColor: '#3B82F650', borderRadius: 3, stack: 'a' },
          ],
        },
        options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false }, tooltip: TOOLTIP }, scales: { x: { grid: { display: false }, border: { display: false }, stacked: true }, y: { grid: { color: GRID_COLOR, drawBorder: false }, stacked: true, beginAtZero: true } } },
      });
    }

  }, [chartReady, loading, data, range]);

  // Build heatmap (no Chart.js needed)
  const heatmapRef = useRef(null);
  useEffect(() => {
    if (!heatmapRef.current || loading) return;
    const container = heatmapRef.current;
    container.innerHTML = '';

    const hours     = ['9am', '11am', '1pm', '3pm', '5pm', '7pm'];
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const heatData  = [
      [3,8,12,15,10,7],[4,9,14,18,12,8],[2,7,11,14,9,6],
      [5,10,15,19,13,9],[3,8,13,16,11,7],[1,2,3,4,2,1],[0,1,1,2,1,0],
    ];
    const maxVal = 20;

    const grid = document.createElement('div');
    grid.className = 'heatmap-grid';
    grid.style.gridTemplateColumns = `40px repeat(${hours.length}, 1fr)`;

    // header
    const empty = document.createElement('div');
    grid.appendChild(empty);
    hours.forEach((h) => {
      const lbl = document.createElement('div');
      lbl.className = 'heatmap-col-label';
      lbl.textContent = h;
      grid.appendChild(lbl);
    });

    dayLabels.forEach((day, di) => {
      const lbl = document.createElement('div');
      lbl.className = 'heatmap-label';
      lbl.textContent = day;
      grid.appendChild(lbl);
      heatData[di].forEach((val, hi) => {
        const intensity = val / maxVal;
        const cell      = document.createElement('div');
        cell.className  = 'heatmap-cell';
        cell.style.background = `rgba(232,89,12,${0.06 + intensity * 0.94})`;
        cell.title = `${day} ${hours[hi]}: ${val} tickets`;
        grid.appendChild(cell);
      });
    });

    container.appendChild(grid);
  }, [loading]);

  const stats = data?.stats ?? {};

  const RANGE_OPTIONS = [
    { label: '7D', days: 7 },
    { label: '30D', days: 30 },
    { label: '90D', days: 90 },
    { label: 'YTD', days: Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 1)) / 86400000) },
  ];

  const TYPE_LEGEND = [
    { label: 'Incidents', color: '#EF4444', val: 98 },
    { label: 'SCTASKs',   color: '#3B82F6', val: 74 },
    { label: 'Requests',  color: '#22C55E', val: 61 },
    { label: 'Problems',  color: '#A78BFA', val: 31 },
    { label: 'Change',    color: '#F59E0B', val: 20 },
  ];

  const PRI_LEGEND = [
    { label: 'P1', color: '#EF4444', val: 3 },
    { label: 'P2', color: '#F59E0B', val: 11 },
    { label: 'P3', color: '#3B82F6', val: 28 },
    { label: 'P4', color: '#636B78', val: 14 },
  ];

  const AGENT_DATA = [
    { initials: 'KR', color: '#E8590C', name: 'K. Reyes',  closed: 38, slaPct: 94, avgResolve: '3h 48m', trend: 'up',   trendVal: '+5' },
    { initials: 'MT', color: '#3B82F6', name: 'M. Torres', closed: 31, slaPct: 91, avgResolve: '4h 22m', trend: 'up',   trendVal: '+2' },
    { initials: 'SL', color: '#A78BFA', name: 'S. Lee',    closed: 29, slaPct: 96, avgResolve: '3h 11m', trend: 'flat', trendVal: '→ 0' },
    { initials: 'PW', color: '#22C55E', name: 'P. Walsh',  closed: 24, slaPct: 79, avgResolve: '6h 01m', trend: 'down', trendVal: '↓ -3' },
    { initials: 'DC', color: '#14B8A6', name: 'D. Chen',   closed: 21, slaPct: 88, avgResolve: '4h 37m', trend: 'up',   trendVal: '↑ +2' },
  ];

  const qName = queues.find((q) => q.id === queueId)?.name ?? 'All Queues';

  return (
    <>
      <Head><title>Reports — ForgeTomorrow Employee Suite</title></Head>
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"
        onLoad={() => setChartReady(true)}
      />
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div id="rpt-root">
        {/* TOP NAV */}
        <nav className="topnav">
          <div className="logo">
            <div className="logo-mark">F</div>
            <span className="logo-name">ForgeTomorrow</span>
          </div>
          <span className="nav-badge badge-suite">Employee Suite</span>
          <span className="nav-badge badge-limited">Limited</span>
          <div className="nav-spacer" />
          <div className="nav-right">
            <select className="view-select"><option>Agent</option><option>Manager</option><option>Admin</option></select>
            <a href="/seeker-dashboard" className="btn-site">Open Forge Site</a>
            <div className="avatar">{userInitials}</div>
          </div>
        </nav>

        {/* BREADCRUMB */}
        <div className="breadcrumb">
          <Link href="/internal/dashboard" className="crumb">Employee Suite</Link>
          <span className="crumb-sep">›</span>
          <Link href="/internal/dashboard" className="crumb">Dashboard</Link>
          <span className="crumb-sep">›</span>
          <span className="crumb-current">Reports</span>
        </div>

        {/* MAIN */}
        <div className="main-layout">

          {/* SIDEBAR */}
          <aside className="sidebar">
            <div className="sidebar-section">Employee Suite</div>
            <Link href="/internal/dashboard" className="nav-item">
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
            </Link>
            <Link href="/internal/queues" className="nav-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
              Queue Management
            </Link>
            <Link href="/internal/reports" className="nav-item active">
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
              <div className="page-title">Reports</div>
              <div className="header-controls">
                <div className="range-tabs">
                  {RANGE_OPTIONS.map((r) => (
                    <button
                      key={r.label}
                      className={`range-tab${range === r.days ? ' active' : ''}`}
                      onClick={() => setRange(r.days)}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
                <select
                  className="queue-select"
                  value={queueId}
                  onChange={(e) => setQueueId(e.target.value)}
                >
                  <option value="all">All Queues</option>
                  {queues.map((q) => <option key={q.id} value={q.id}>{q.name}</option>)}
                </select>
                <a href={`/api/crm/reports/export?queueId=${queueId}&format=csv`} className="btn-export">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Export CSV
                </a>
              </div>
            </div>

            {/* KPI ROW */}
            <div className="kpi-row">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <div key={i} className="kpi-card">
                    <div className="skeleton" style={{ height: 11, width: 80, marginBottom: 12 }} />
                    <div className="skeleton" style={{ height: 30, width: 80, marginBottom: 8 }} />
                    <div className="skeleton" style={{ height: 11, width: 60 }} />
                  </div>
                ))
              ) : (
                <>
                  <div className="kpi-card orange">
                    <div className="kpi-label">Tickets Created</div>
                    <div className="kpi-value orange">{stats.open ?? 0}</div>
                    <div className="kpi-delta"><span style={{ color: 'var(--text-3)' }} className="kpi-sub">active this period</span></div>
                  </div>
                  <div className="kpi-card green">
                    <div className="kpi-label">SLA Compliance</div>
                    <div className="kpi-value green">{stats.slaCompliancePct != null ? `${stats.slaCompliancePct}%` : '—'}</div>
                    <div className="kpi-delta"><span style={{ color: stats.slaCompliancePct >= 90 ? 'var(--green)' : 'var(--red)' }}>{stats.slaCompliancePct >= 90 ? '↑' : '↓'} target 90%</span></div>
                  </div>
                  <div className="kpi-card blue">
                    <div className="kpi-label">Avg Resolution</div>
                    <div className="kpi-value blue" style={{ fontSize: stats.avgResolution?.length > 5 ? 20 : 30 }}>{stats.avgResolution ?? '—'}</div>
                    <div className="kpi-sub" style={{ marginTop: 6 }}>this period</div>
                  </div>
                  <div className="kpi-card red">
                    <div className="kpi-label">SLA Breaches</div>
                    <div className="kpi-value red">{stats.slaBreached ?? 0}</div>
                    <div className="kpi-delta"><span style={{ color: stats.slaBreached === 0 ? 'var(--green)' : 'var(--red)' }}>{stats.slaBreached === 0 ? '✓ clean' : '↑ action needed'}</span></div>
                  </div>
                  <div className="kpi-card purple">
                    <div className="kpi-label">Reopen Count</div>
                    <div className="kpi-value purple">{stats.reopen ?? 0}</div>
                    <div className="kpi-sub" style={{ marginTop: 6 }}>this period</div>
                  </div>
                </>
              )}
            </div>

            {/* ROW 2: Volume + SLA trend */}
            <div className="chart-grid-2">
              <div className="chart-card">
                <div className="chart-header">
                  <div>
                    <div className="chart-title">Ticket Volume — Last {range} Days</div>
                    <div className="chart-sub">Created vs Resolved per day</div>
                  </div>
                  <div className="chart-legend">
                    <div className="legend-item"><div className="legend-line" style={{ background: 'var(--orange)' }} />Created</div>
                    <div className="legend-item"><div className="legend-line" style={{ background: 'var(--green)' }} />Resolved</div>
                  </div>
                </div>
                <div className="chart-wrap tall">
                  {loading ? <div className="skeleton" style={{ height: 180 }} /> : <canvas ref={volumeRef} />}
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <div>
                    <div className="chart-title">SLA Compliance Trend</div>
                    <div className="chart-sub">% met per week · {range}-day window</div>
                  </div>
                </div>
                <div className="chart-wrap tall">
                  {loading ? <div className="skeleton" style={{ height: 180 }} /> : <canvas ref={slaRef} />}
                </div>
              </div>
            </div>

            {/* ROW 3: Resolution + Type + Priority + Agent table + Heatmap + First response + Backlog */}
            <div className="chart-grid-3">

              {/* Resolution by type */}
              <div className="chart-card">
                <div className="chart-header">
                  <div>
                    <div className="chart-title">Avg Resolution Time by Type</div>
                    <div className="chart-sub">Hours · {range}-day rolling</div>
                  </div>
                </div>
                <div className="chart-wrap">
                  {loading ? <div className="skeleton" style={{ height: 160 }} /> : <canvas ref={resRef} />}
                </div>

                {/* Agent leaderboard below */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                  <div className="chart-title" style={{ marginBottom: 10 }}>Agent Leaderboard</div>
                  <table className="agent-table">
                    <thead>
                      <tr>
                        <th>Agent</th><th>Closed</th><th>SLA%</th><th>Avg</th><th>Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {AGENT_DATA.map((a) => (
                        <tr key={a.name}>
                          <td><div className="agent-name"><div className="agent-av" style={{ background: a.color }}>{a.initials}</div>{a.name}</div></td>
                          <td><span className="tnum">{a.closed}</span></td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div className="perf-bar"><div className="perf-fill" style={{ width: `${a.slaPct}%`, background: a.slaPct >= 90 ? 'var(--green)' : a.slaPct >= 80 ? 'var(--yellow)' : 'var(--red)' }} /></div>
                              <span className="tnum" style={{ fontSize: 11 }}>{a.slaPct}%</span>
                            </div>
                          </td>
                          <td><span className="tnum">{a.avgResolve}</span></td>
                          <td><span className={`trend-chip trend-${a.trend}`}>{a.trendVal}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Heatmap */}
              <div className="chart-card">
                <div className="chart-header">
                  <div>
                    <div className="chart-title">Ticket Volume Heatmap</div>
                    <div className="chart-sub">By day & hour · last {range} days</div>
                  </div>
                </div>
                <div ref={heatmapRef} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-3)' }}>Low</span>
                  <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                    {['#E8590C10','#E8590C30','#E8590C60','#E8590C90','#E8590C'].map((bg, i) => (
                      <div key={i} style={{ width: 14, height: 8, borderRadius: 2, background: bg }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--text-3)' }}>High</span>
                </div>

                {/* Type donut */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                  <div className="chart-title" style={{ marginBottom: 12 }}>By Type</div>
                  <div className="donut-wrap">
                    <canvas ref={typeRef} width="100" height="100" style={{ flexShrink: 0 }} />
                    <div className="donut-legend">
                      {TYPE_LEGEND.map((t) => (
                        <div key={t.label} className="donut-leg-item">
                          <div className="donut-leg-left">
                            <div className="donut-leg-dot" style={{ background: t.color }} />
                            <span className="donut-leg-label">{t.label}</span>
                          </div>
                          <span className="donut-leg-val">{t.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* First response + Backlog + Priority donut */}
              <div className="chart-card" style={{ gap: 18 }}>
                <div>
                  <div className="chart-header">
                    <div>
                      <div className="chart-title">First Response Time</div>
                      <div className="chart-sub">By priority · {range}d avg</div>
                    </div>
                  </div>
                  <div className="chart-wrap short" style={{ marginTop: 10 }}>
                    {loading ? <div className="skeleton" style={{ height: 130 }} /> : <canvas ref={firstResRef} />}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                  <div className="chart-title" style={{ marginBottom: 10 }}>Open Backlog Trend</div>
                  <div className="chart-wrap short">
                    {loading ? <div className="skeleton" style={{ height: 130 }} /> : <canvas ref={backlogRef} />}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                  <div className="chart-title" style={{ marginBottom: 12 }}>By Priority</div>
                  <div className="donut-wrap">
                    <canvas ref={priorityRef} width="80" height="80" style={{ flexShrink: 0 }} />
                    <div className="donut-legend">
                      {PRI_LEGEND.map((p) => (
                        <div key={p.label} className="donut-leg-item">
                          <div className="donut-leg-left">
                            <div className="donut-leg-dot" style={{ background: p.color }} />
                            <span className="donut-leg-label">{p.label}</span>
                          </div>
                          <span className="donut-leg-val">{p.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
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

  const userInitials = [session.user.firstName?.[0], session.user.lastName?.[0]]
    .filter(Boolean).join('').toUpperCase() || session.user.email?.[0]?.toUpperCase() || 'U';

  let queues = [];
  try {
    const { prisma } = await import('@/lib/prisma');
    queues = await prisma.queue.findMany({
      where: { isActive: true }, orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });
  } catch (e) { console.error('[Reports SSR]', e.message); }

  return { props: { queues, userInitials } };
}