// pages/recruiter/analytics/index.js
// Live Analytics (SQL-backed) + Enterprise FeatureLock + RecruiterHeader
import React, { useEffect, useState, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';

// plan + header
import { usePlan } from '@/context/PlanContext';
import RecruiterHeader from '@/components/recruiter/RecruiterHeader';
import FeatureLock from '@/components/recruiter/FeatureLock';

// shared footer
import Footer from '@/components/Footer';

// your components
import KPICard from '@/components/analytics/KPICard';
import Filters from '@/components/analytics/Filters';
import ApplicationFunnel from '@/components/analytics/charts/ApplicationFunnel';
import SourceBreakdown from '@/components/analytics/charts/SourceBreakdown';
import RecruiterActivity from '@/components/analytics/charts/RecruiterActivity';

// data hook
function useAnalytics(state) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const qs = useMemo(() => {
    const params = new URLSearchParams();
    params.set('range', state.range);
    params.set('jobId', state.jobId);
    params.set('recruiterId', state.recruiterId);
    if (state.range === 'custom') {
      if (state.from) params.set('from', state.from);
      if (state.to) params.set('to', state.to);
    }
    return params.toString();
  }, [state]);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/analytics/recruiter?${qs}`);
        const json = await res.json();
        if (active) setData(json);
      } catch (e) {
        if (active) setError(e);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();
    const id = setInterval(fetchData, 30000);
    return () => { active = false; clearInterval(id); };
  }, [qs]);

  return { data, loading, error };
}

function Body() {
  const [filters, setFilters] = useState({ range: '30d', jobId: 'all', recruiterId: 'all', from: '', to: '' });
  const { data, loading, error } = useAnalytics(filters);
  const { isEnterprise } = usePlan();
  const onChange = (patch) => setFilters((s) => ({ ...s, ...patch }));

  const ChartsBlock = (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ApplicationFunnel data={data?.funnel || []} />
      <SourceBreakdown data={data?.sources || []} />
      <div className="lg:col-span-2">
        <RecruiterActivity data={data?.recruiterActivity || []} />
      </div>
    </section>
  );

  return (
    <>
      <Head><title>Analytics — ForgeTomorrow</title></Head>
      <RecruiterHeader />

      {/* Page grid without footer inside */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '300px 1fr 280px',
          gridTemplateRows: 'auto 1fr',
          gridTemplateAreas: `
            "left header right"
            "left content right"
          `,
          gap: 20,
          padding: '30px 20px 20px',
          minHeight: 'calc(100vh - 200px)', // leave space for footer
          backgroundColor: '#ECEFF1',
        }}
      >
        {/* LEFT */}
        <aside style={{ gridArea: 'left', alignSelf: 'start' }}>
          <Link
            href="/recruiter"
            style={{
              display: 'block',
              backgroundColor: '#FF7043',
              color: 'white',
              fontWeight: 'bold',
              textAlign: 'center',
              padding: '10px 14px',
              borderRadius: '8px',
              marginBottom: '16px',
              textDecoration: 'none',
            }}
          >
            ← Back to Recruiter Hub
          </Link>
        </aside>

        {/* HEADER */}
        <section
          style={{
            gridArea: 'header',
            background: 'white',
            borderRadius: 12,
            padding: '8px 16px',
            border: '1px solid #eee',
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontSize: '2rem', color: '#FF7043', margin: 0, fontWeight: 700 }}>
            Recruiter Analytics
          </h1>
          <p style={{ fontSize: '1rem', color: '#607D8B', margin: '4px 0 0 0' }}>
            Phase 2 — SQL-backed
          </p>
        </section>

        {/* RIGHT */}
        <aside
          style={{
            gridArea: 'right',
            alignSelf: 'start',
            background: 'white',
            border: '1px solid #eee',
            borderRadius: 12,
            padding: 16,
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
            minHeight: 120,
          }}
        >
          <div style={{ fontWeight: 700, color: '#263238', marginBottom: 6 }}>Coming soon</div>
          <div style={{ color: '#90A4AE', fontSize: 14 }}>
            Reserved space for tasteful business promotions.
          </div>
        </aside>

        {/* CONTENT */}
        <main style={{ gridArea: 'content' }}>
          <div className="max-w-7xl mx-auto px-0 py-0 space-y-6">
            {/* Filters */}
            <div className="bg-white border rounded-lg p-4">
              <Filters state={filters} onChange={onChange} />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">{String(error)}</div>
            )}

            {/* KPIs */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard label="Total job views" value={data?.kpis?.totalViews ?? (loading ? '…' : 0)} />
              <KPICard label="Total applies" value={data?.kpis?.totalApplies ?? (loading ? '…' : 0)} />
              <KPICard label="Avg. time-to-fill" value={data ? `${data.kpis.avgTimeToFillDays} days` : (loading ? '…' : '0 days')} />
              <KPICard label="Conversion rate" value={data ? `${data.kpis.conversionRatePct}%` : (loading ? '…' : '0%')} />
            </section>

            {/* Charts */}
            {isEnterprise ? ChartsBlock : <FeatureLock label="Full Analytics">{ChartsBlock}</FeatureLock>}

            {/* Meta */}
            {data?.meta?.refreshedAt && (
              <div className="text-xs text-gray-400 text-right">
                Last updated: {new Date(data.meta.refreshedAt).toLocaleString()} · Source: {data.meta.source?.toUpperCase?.() || 'SQL'}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* FULL-WIDTH FOOTER */}
      <Footer />
    </>
  );
}

export default function RecruiterAnalyticsPage() {
  return <Body />;
}
