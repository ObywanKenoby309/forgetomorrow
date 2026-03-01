// pages/internal/reports.js
//
// WIRED — replaces mock data with live /api/crm/reports/queue
// Matches existing code style: InternalLayoutPlain, CARD, getServerSideProps

import React, { useState, useEffect, useCallback } from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]';
import InternalLayoutPlain from '@/components/layouts/InternalLayoutPlain';
import { useEffect as useEffectRef } from 'react';

const CARD = {
  border: '1px solid rgba(17, 24, 39, 0.10)',
  background: '#FFFFFF',
  boxShadow: '0 10px 22px rgba(0,0,0,0.06)',
  borderRadius: 14,
};

const ORANGE = '#FF7043';

const RANGE_OPTIONS = [
  { label: '7D',  days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
];

function Skeleton({ height = 60 }) {
  return (
    <div
      style={{
        height,
        borderRadius: 12,
        background: 'rgba(17,24,39,0.06)',
      }}
    />
  );
}

function KpiCard({ label, value, delta, deltaGood }) {
  return (
    <div style={{ border: '1px solid rgba(17,24,39,0.10)', borderRadius: 14, padding: '14px 16px' }}>
      <div style={{ fontSize: 10, fontWeight: 900, color: 'rgba(17,24,39,0.55)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ marginTop: 8, fontSize: 26, fontWeight: 950, color: '#111827', lineHeight: 1 }}>
        {value ?? '—'}
      </div>
      {delta != null && (
        <div style={{ marginTop: 6, fontSize: 12, fontWeight: 900, color: deltaGood ? '#22C55E' : '#EF4444' }}>
          {delta}
        </div>
      )}
    </div>
  );
}

// Simple bar chart rendered with canvas — no external lib needed
function BarChart({ data, labels, color = ORANGE, height = 140 }) {
  const canvasRef = React.useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data?.length) return;
    const ctx = canvas.getContext('2d');
    const W   = canvas.offsetWidth;
    const H   = height;
    canvas.width  = W;
    canvas.height = H;

    ctx.clearRect(0, 0, W, H);

    const max     = Math.max(...data, 1);
    const barW    = Math.floor((W - 40) / data.length) - 4;
    const padLeft = 36;
    const padBot  = 24;
    const chartH  = H - padBot - 10;

    // Y grid lines
    ctx.strokeStyle = 'rgba(17,24,39,0.08)';
    ctx.lineWidth   = 1;
    for (let i = 0; i <= 4; i++) {
      const y = 10 + chartH - (i / 4) * chartH;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(W, y);
      ctx.stroke();

      ctx.fillStyle = 'rgba(17,24,39,0.45)';
      ctx.font      = '9px system-ui';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round((i / 4) * max), padLeft - 4, y + 3);
    }

    // Bars
    data.forEach((val, i) => {
      const x    = padLeft + i * (barW + 4);
      const barH = Math.max(2, (val / max) * chartH);
      const y    = 10 + chartH - barH;

      ctx.fillStyle = color + 'CC';
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, [3, 3, 0, 0]);
      ctx.fill();

      if (labels?.[i] && data.length <= 14) {
        ctx.fillStyle = 'rgba(17,24,39,0.45)';
        ctx.font      = '9px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(labels[i], x + barW / 2, H - 6);
      }
    });
  }, [data, labels, color, height]);

  return <canvas ref={canvasRef} style={{ width: '100%', height }} />;
}

// Horizontal bar chart for agent performance
function AgentTable({ agents }) {
  if (!agents?.length) {
    return (
      <div style={{ fontSize: 13, fontWeight: 900, color: 'rgba(17,24,39,0.55)', padding: 8 }}>
        No agent data yet.
      </div>
    );
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          {['Agent', 'Closed', 'SLA%', 'Avg Resolve'].map((h) => (
            <th
              key={h}
              style={{
                textAlign: 'left',
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
                color: 'rgba(17,24,39,0.55)',
                padding: '8px 10px',
                borderBottom: '1px solid rgba(17,24,39,0.10)',
              }}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {agents.map((a, i) => (
          <tr key={i}>
            <td style={{ padding: '10px 10px', borderBottom: '1px solid rgba(17,24,39,0.08)', fontWeight: 900, fontSize: 13 }}>
              {a.name}
            </td>
            <td style={{ padding: '10px 10px', borderBottom: '1px solid rgba(17,24,39,0.08)', fontWeight: 950, fontSize: 13 }}>
              {a.closed}
            </td>
            <td style={{ padding: '10px 10px', borderBottom: '1px solid rgba(17,24,39,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ flex: 1, height: 4, background: 'rgba(17,24,39,0.10)', borderRadius: 2, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${a.slaPct}%`,
                      height: '100%',
                      borderRadius: 2,
                      background: a.slaPct >= 90 ? '#22C55E' : a.slaPct >= 75 ? '#F59E0B' : '#EF4444',
                    }}
                  />
                </div>
                <span style={{ fontSize: 11, fontWeight: 950 }}>{a.slaPct}%</span>
              </div>
            </td>
            <td style={{ padding: '10px 10px', borderBottom: '1px solid rgba(17,24,39,0.08)', fontWeight: 950, fontSize: 13 }}>
              {a.avgResolve}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function Reports({ employee, department, queues: initialQueues }) {
  const [queues, setQueues]           = useState(initialQueues ?? []);
  const [selectedQueue, setSelectedQueue] = useState(initialQueues?.[0]?.id ?? 'all');
  const [range, setRange]             = useState(30);
  const [data, setData]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  const fetchData = useCallback(async (queueId, days) => {
    setLoading(true);
    setError(null);
    try {
      const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const res  = await fetch(`/api/crm/reports/queue?queueId=${queueId}&from=${from}`);
      if (!res.ok) throw new Error(`Failed to load: ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(selectedQueue || 'all', range);
  }, [selectedQueue, range, fetchData]);

  const stats = data?.stats ?? {};

  // Build daily volume data from recentTickets for the bar chart
  const volumeData = React.useMemo(() => {
    if (!data?.recentTickets?.length) return { counts: [], labels: [] };
    const buckets = {};
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      buckets[key] = 0;
    }
    data.recentTickets.forEach((t) => {
      const key = new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (buckets[key] !== undefined) buckets[key]++;
    });
    return {
      counts: Object.values(buckets),
      labels: Object.keys(buckets),
    };
  }, [data, range]);

  const selectedQueueName = queues.find((q) => q.id === selectedQueue)?.name ?? 'All Queues';

  return (
    <InternalLayoutPlain
      activeNav="reports"
      headerTitle="Reports"
      headerSubtitle="Live metrics — real data"
      employee={employee}
      department={department}
      initialHat="seeker"
    >
      {/* ── Controls ── */}
      <section style={{ ...CARD, padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 950, color: 'rgba(17,24,39,0.65)' }}>Queue</div>
            <select
              value={selectedQueue}
              onChange={(e) => setSelectedQueue(e.target.value)}
              style={{
                border: '1px solid rgba(17,24,39,0.18)',
                borderRadius: 12,
                padding: '8px 10px',
                fontSize: 13,
                fontWeight: 950,
                background: '#fff',
                cursor: 'pointer',
                minWidth: 180,
                height: 40,
              }}
            >
              <option value="all">All Queues</option>
              {queues.map((q) => (
                <option key={q.id} value={q.id}>{q.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 4, background: 'rgba(17,24,39,0.06)', borderRadius: 10, padding: 3 }}>
            {RANGE_OPTIONS.map((r) => (
              <button
                key={r.label}
                onClick={() => setRange(r.days)}
                style={{
                  border: 'none',
                  borderRadius: 8,
                  padding: '6px 14px',
                  fontSize: 12,
                  fontWeight: 950,
                  cursor: 'pointer',
                  background: range === r.days ? '#fff' : 'transparent',
                  color: range === r.days ? '#111827' : 'rgba(17,24,39,0.55)',
                  boxShadow: range === r.days ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {error && (
        <div style={{ ...CARD, padding: 14, borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.04)' }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#EF4444' }}>Error: {error}</div>
        </div>
      )}

      {/* ── KPI Row ── */}
      <section style={{ ...CARD, padding: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 950, color: '#111827', marginBottom: 12 }}>
          Summary — {selectedQueueName} — Last {range} days
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 12 }}>
          {loading ? (
            Array(5).fill(0).map((_, i) => <Skeleton key={i} height={80} />)
          ) : (
            <>
              <KpiCard label="Open Tickets"    value={stats.open} />
              <KpiCard label="SLA Compliance"  value={stats.slaCompliancePct != null ? `${stats.slaCompliancePct}%` : '—'} deltaGood={stats.slaCompliancePct >= 90} />
              <KpiCard label="Avg Resolution"  value={stats.avgResolution ?? '—'} />
              <KpiCard label="SLA Breaches"    value={stats.slaBreached} deltaGood={stats.slaBreached === 0} />
              <KpiCard label="Reopen Count"    value={stats.reopen} deltaGood={stats.reopen === 0} />
            </>
          )}
        </div>
      </section>

      {/* ── Charts row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

        {/* Ticket Volume */}
        <section style={{ ...CARD, padding: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 950, color: '#111827', marginBottom: 4 }}>
            Ticket Volume
          </div>
          <div style={{ fontSize: 12, fontWeight: 850, color: 'rgba(17,24,39,0.55)', marginBottom: 12 }}>
            Created per day · last {range} days
          </div>
          {loading ? (
            <Skeleton height={140} />
          ) : (
            <BarChart data={volumeData.counts} labels={volumeData.labels} color={ORANGE} height={140} />
          )}
        </section>

        {/* Status breakdown */}
        <section style={{ ...CARD, padding: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 950, color: '#111827', marginBottom: 4 }}>
            Status Breakdown
          </div>
          <div style={{ fontSize: 12, fontWeight: 850, color: 'rgba(17,24,39,0.55)', marginBottom: 12 }}>
            Current open tickets
          </div>
          {loading ? (
            <Skeleton height={140} />
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {[
                { label: 'Open',           value: stats.open,        color: '#3B82F6' },
                { label: 'Unassigned',     value: stats.unassigned,  color: '#F59E0B' },
                { label: 'On Hold',        value: stats.onHold,      color: '#8B5CF6' },
                { label: 'Pending',        value: stats.pending,     color: '#14B8A6' },
                { label: 'Aging > 7 days', value: stats.aging,       color: '#EF4444' },
                { label: 'SLA Breached',   value: stats.slaBreached, color: '#DC2626' },
              ].map((row) => {
                const max = Math.max(stats.open ?? 1, 1);
                const pct = Math.min(100, Math.round(((row.value ?? 0) / max) * 100));
                return (
                  <div key={row.label} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 36px', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 900, color: 'rgba(17,24,39,0.70)' }}>{row.label}</div>
                    <div style={{ height: 6, background: 'rgba(17,24,39,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: row.color, borderRadius: 3 }} />
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 950, textAlign: 'right' }}>{row.value ?? '—'}</div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* ── SLA + Resolution row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

        {/* SLA compliance gauge */}
        <section style={{ ...CARD, padding: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 950, color: '#111827', marginBottom: 12 }}>
            SLA Compliance
          </div>
          {loading ? (
            <Skeleton height={100} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              {/* Big number */}
              <div
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  background: `conic-gradient(${stats.slaCompliancePct >= 90 ? '#22C55E' : stats.slaCompliancePct >= 75 ? '#F59E0B' : '#EF4444'} ${(stats.slaCompliancePct ?? 0) * 3.6}deg, rgba(17,24,39,0.08) 0deg)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    width: 74,
                    height: 74,
                    borderRadius: '50%',
                    background: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    fontWeight: 950,
                  }}
                >
                  {stats.slaCompliancePct ?? '—'}{stats.slaCompliancePct != null ? '%' : ''}
                </div>
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 900 }}>
                  <span style={{ color: 'rgba(17,24,39,0.55)' }}>Breached: </span>
                  <span style={{ color: '#EF4444', fontWeight: 950 }}>{stats.slaBreached ?? '—'}</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 900 }}>
                  <span style={{ color: 'rgba(17,24,39,0.55)' }}>Aging: </span>
                  <span style={{ fontWeight: 950 }}>{stats.aging ?? '—'}</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 900 }}>
                  <span style={{ color: 'rgba(17,24,39,0.55)' }}>Target: </span>
                  <span style={{ fontWeight: 950 }}>90%</span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Resolution + Fulfillment */}
        <section style={{ ...CARD, padding: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 950, color: '#111827', marginBottom: 12 }}>
            Resolution Times
          </div>
          {loading ? (
            <Skeleton height={100} />
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ border: '1px solid rgba(17,24,39,0.10)', borderRadius: 12, padding: '12px 16px' }}>
                <div style={{ fontSize: 10, fontWeight: 900, color: 'rgba(17,24,39,0.55)', letterSpacing: '0.10em', textTransform: 'uppercase' }}>
                  Avg Resolution (Incidents)
                </div>
                <div style={{ marginTop: 6, fontSize: 24, fontWeight: 950, color: '#111827' }}>
                  {stats.avgResolution ?? '—'}
                </div>
                <div style={{ marginTop: 4, fontSize: 11, fontWeight: 900, color: 'rgba(17,24,39,0.55)' }}>
                  This period · all resolved tickets
                </div>
              </div>
              <div style={{ border: '1px solid rgba(17,24,39,0.10)', borderRadius: 12, padding: '12px 16px' }}>
                <div style={{ fontSize: 10, fontWeight: 900, color: 'rgba(17,24,39,0.55)', letterSpacing: '0.10em', textTransform: 'uppercase' }}>
                  Avg Fulfillment (SCTASKs)
                </div>
                <div style={{ marginTop: 6, fontSize: 24, fontWeight: 950, color: '#111827' }}>
                  {stats.avgFulfillment ?? '—'}
                </div>
                <div style={{ marginTop: 4, fontSize: 11, fontWeight: 900, color: 'rgba(17,24,39,0.55)' }}>
                  This period · closed SCTASKs only
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* ── Export targets ── */}
      <section style={{ ...CARD, padding: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 950, color: '#111827', marginBottom: 10 }}>Export</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { label: 'Export CSV',       href: `/api/crm/reports/export?queueId=${selectedQueue}&format=csv` },
            { label: 'View All Tickets', href: `/internal/tickets?queueId=${selectedQueue}` },
          ].map((btn) => (
            <a
              key={btn.label}
              href={btn.href}
              style={{
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 950,
                padding: '8px 16px',
                borderRadius: 12,
                border: '1px solid rgba(17,24,39,0.18)',
                background: '#fff',
                color: '#111827',
              }}
            >
              {btn.label}
            </a>
          ))}
        </div>
        <div style={{ marginTop: 12, fontSize: 12, fontWeight: 850, color: 'rgba(17,24,39,0.55)' }}>
          Full CSV export route coming in the next phase.
        </div>
      </section>
    </InternalLayoutPlain>
  );
}

export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session?.user) {
    return { redirect: { destination: '/auth/signin', permanent: false } };
  }

  const employee   = Boolean(session?.user?.employee);
  const department = session?.user?.department || '';

  let queues = [];
  try {
    const { prisma } = await import('@/lib/prisma');
    queues = await prisma.queue.findMany({
      where:   { isActive: true },
      orderBy: { name: 'asc' },
      select:  { id: true, name: true, color: true },
    });
  } catch (e) {
    console.error('[Reports SSR] Failed to load queues:', e.message);
  }

  return { props: { employee, department, queues } };
}