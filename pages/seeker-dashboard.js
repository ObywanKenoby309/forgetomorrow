// pages/seeker-dashboard.js
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import SeekerRightColumn from '@/components/seeker/SeekerRightColumn';
import PinnedJobsPreview from '@/components/PinnedJobsPreview';
import KpiRow from '@/components/seeker/dashboard/KpiRow';
import FunnelChart from '@/components/seeker/dashboard/FunnelChart';
import ApplicationsOverTime from '@/components/seeker/dashboard/ApplicationsOverTime';

// ISO WEEK HELPERS
const startOfISOWeek = (d) => {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  if (day !== 1) date.setUTCDate(date.getUTCDate() - (day - 1));
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

const weekDiff = (a, b) => {
  const MSWEEK = 7 * 24 * 3600 * 1000;
  return Math.floor((a.getTime() - b.getTime()) / MSWEEK);
};

export default function SeekerDashboard() {
  const router = useRouter();
  const chrome = String(router.query.chrome || '').toLowerCase();
  const withChrome = (path) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

  const [kpi, setKpi] = useState(null);
  const [weeks, setWeeks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        // 🔹 No more client-side redirect.
        // Just try to load dashboard data; fall back gracefully if it fails.
        const res = await fetch('/api/seeker/dashboard-data');

        if (!res.ok) {
          throw new Error(`Failed to load data: ${res.status}`);
        }

        const data = await res.json();
        if (cancelled) return;

        const newKpi = {
          applied: data.applications || 0,
          viewed: data.views || 0,
          interviewing: data.interviews || 0,
          offers: data.offers || 0,
          rejected: 0,
          lastSent: data.lastApplication
            ? new Date(data.lastApplication).toLocaleDateString()
            : '—',
        };
        setKpi(newKpi);

        // Applications over time
        const today = new Date();
        const thisWeek = startOfISOWeek(today);
        const labels = Array.from({ length: 8 }, (_, i) => `W${8 - i}`);
        const buckets = labels.map(() => ({ applied: 0, interviews: 0 }));

        (data.allApplications || []).forEach((app) => {
          const d = new Date(app.appliedAt);
          const wStart = startOfISOWeek(d);
          const diff = weekDiff(thisWeek, wStart);
          if (diff >= 0 && diff < 8) {
            const idx = 8 - diff - 1;
            buckets[idx].applied += 1;
          }
        });

        setWeeks(
          labels.map((label, i) => ({
            label,
            applied: buckets[i].applied,
            interviews: 0,
          }))
        );
      } catch (err) {
        console.error('Dashboard load error:', err);
        if (!cancelled) {
          // 🔹 Fallback: show empty stats but KEEP the user on the page
          setKpi({
            applied: 0,
            viewed: 0,
            interviewing: 0,
            offers: 0,
            rejected: 0,
            lastSent: '—',
          });
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
    // 👇 run ONCE on mount
  }, []);

  const HeaderBox = (
    <section
      aria-label="Job seeker dashboard overview"
      className="bg-white border border-gray-200 rounded-xl p-6 text-center shadow-sm"
    >
      <h1 className="text-2xl md:text-3xl font-bold text-orange-600">
        Your Job Seeker Dashboard
      </h1>
      <p className="text-sm md:text-base text-gray-600 mt-2 max-w-3xl mx-auto">
        You're not alone. Track your momentum, see your wins, and keep moving forward.
      </p>
    </section>
  );

  const RightRail = (
    <div className="grid gap-4">
      {/* Existing seeker shortcuts / common tools */}
      <SeekerRightColumn variant="dashboard" />

      {/* Resume + Cover builder quick access */}
      <section className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">
          Resume & Cover
        </h2>
        <p className="text-xs text-gray-600 mb-3">
          Keep your resume and cover letter updated in one place.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href={withChrome('/resume/create')}
            className="inline-flex items-center justify-center px-3 py-1.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 hover:bg-orange-100"
          >
            Open resume builder
          </Link>
          <Link
            href={withChrome('/cover/create')}
            className="inline-flex items-center justify-center px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-800 hover:bg-slate-100"
          >
            Open cover letter
          </Link>
        </div>
      </section>

      {/* Career roadmap teaser (no broken links) */}
      <section className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">
          Career Roadmap
        </h2>
        <p className="text-xs text-gray-600">
          Soon you&apos;ll be able to map your next 2–3 roles, skills, and
          milestones here. For now, use your dashboard and The Hearth to plan
          your next move.
        </p>
      </section>
    </div>
  );

  if (isLoading) {
    return (
      <>
        <Head>
          <title>Loading… | ForgeTomorrow</title>
        </Head>
        <SeekerLayout title="Loading..." header={HeaderBox} right={RightRail}>
          <div className="flex items-center justify-center h-64 text-gray-500">
            Loading your progress...
          </div>
        </SeekerLayout>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Seeker Dashboard | ForgeTomorrow</title>
      </Head>
      <SeekerLayout
        title="Seeker Dashboard | ForgeTomorrow"
        header={HeaderBox}
        right={RightRail}
        activeNav="dashboard"
      >
        <div className="grid gap-6">
          {/* KPI Row */}
          <section className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-orange-600 mb-3">
              Job Search Snapshot
            </h2>
            {kpi && (
              <KpiRow
                applied={kpi.applied}
                viewed={kpi.viewed}
                interviewing={kpi.interviewing}
                offers={kpi.offers}
                rejected={kpi.rejected}
                lastApplicationSent={kpi.lastSent}
              />
            )}
          </section>

          {/* Pinned Jobs */}
          <section className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-orange-600">
                Your Next Yes
              </h2>
              <Link
                href={withChrome('/seeker/pinned-jobs')}
                className="text-orange-600 font-medium hover:underline"
              >
                View all
              </Link>
            </div>
            <PinnedJobsPreview />
          </section>

          {/* Charts */}
          <section className="grid md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-base font-semibold text-gray-800 mb-3">
                Application Funnel
              </h3>
              {kpi && (
                <FunnelChart
                  data={{
                    applied: kpi.applied,
                    viewed: kpi.viewed,
                    interviewing: kpi.interviewing,
                    offers: kpi.offers,
                    hired: 0,
                  }}
                  showTrackerButton={true}
                />
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-base font-semibold text-gray-800 mb-3">
                Applications Over Time
              </h3>
              <ApplicationsOverTime weeks={weeks} withChrome={withChrome} />
            </div>
          </section>

          {/* Coming Soon */}
          <section className="grid md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-base font-semibold text-gray-800 mb-2">
                Response Speed
              </h3>
              <p className="text-sm text-gray-500">Benchmarks coming soon.</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-base font-semibold text-gray-800 mb-2">
                Top Categories
              </h3>
              <p className="text-sm text-gray-500">Distribution coming soon.</p>
            </div>
          </section>
        </div>
      </SeekerLayout>
    </>
  );
}
