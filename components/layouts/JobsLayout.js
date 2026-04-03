import React, { useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { usePlan } from '@/context/PlanContext';

// Chrome components
import SeekerHeader from '@/components/seeker/SeekerHeader';
import CoachingHeader from '@/components/coaching/CoachingHeader';
import RecruiterHeader from '@/components/recruiter/RecruiterHeader';

import SeekerSidebar from '@/components/SeekerSidebar';
import CoachingSidebar from '@/components/coaching/CoachingSidebar';
import RecruiterSidebar from '@/components/recruiter/RecruiterSidebar';

const ALLOWED_MODES = new Set(['seeker', 'coach', 'recruiter-smb', 'recruiter-ent']);

function normalizeChrome(input) {
  const raw = String(input || '').toLowerCase().trim();
  if (!raw) return '';

  if (ALLOWED_MODES.has(raw)) return raw;

  if (raw.startsWith('recruiter')) {
    if (raw.includes('ent')) return 'recruiter-ent';
    return 'recruiter-smb';
  }

  if (raw === 'coach') return 'coach';
  return 'seeker';
}

export default function JobsLayout({
  title = 'ForgeTomorrow - Jobs',
  children,
  activeNav = 'jobs'
}) {
  const router = useRouter();
  const { plan, role } = usePlan();

  // 🔥 SAME ROLE-AWARE LOGIC — but simplified
  const chromeMode = useMemo(() => {
    const urlChrome = normalizeChrome(router.query?.chrome);

    if (urlChrome) return urlChrome;

    const dbRole = String(role || '').toLowerCase();
    const dbPlan = String(plan || '').toLowerCase();

    if (dbRole === 'coach') return 'coach';

    if (
      dbRole === 'recruiter' ||
      dbRole === 'admin' ||
      dbRole === 'owner'
    ) {
      return dbPlan === 'enterprise' ? 'recruiter-ent' : 'recruiter-smb';
    }

    return 'seeker';
  }, [router.query?.chrome, role, plan]);

  // 🔥 HEADER + SIDEBAR SWITCH
  const { HeaderComp, SidebarComp, sidebarProps } = useMemo(() => {
    switch (chromeMode) {
      case 'coach':
        return {
          HeaderComp: CoachingHeader,
          SidebarComp: CoachingSidebar,
          sidebarProps: { active: activeNav }
        };
      case 'recruiter-smb':
        return {
          HeaderComp: RecruiterHeader,
          SidebarComp: RecruiterSidebar,
          sidebarProps: { active: activeNav, variant: 'smb' }
        };
      case 'recruiter-ent':
        return {
          HeaderComp: RecruiterHeader,
          SidebarComp: RecruiterSidebar,
          sidebarProps: { active: activeNav, variant: 'enterprise' }
        };
      default:
        return {
          HeaderComp: SeekerHeader,
          SidebarComp: SeekerSidebar,
          sidebarProps: { active: activeNav }
        };
    }
  }, [chromeMode, activeNav]);

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>

      {/* HEADER */}
      <HeaderComp />

      {/* 🔥 TIGHT DASHBOARD GRID */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '240px 1fr 260px',
          gap: 12,
          padding: '16px',
          alignItems: 'start',
          maxWidth: '100vw',
          boxSizing: 'border-box'
        }}
      >
        {/* LEFT SIDEBAR */}
        <aside style={{ position: 'relative' }}>
          <SidebarComp {...sidebarProps} />
        </aside>

        {/* MAIN CONTENT */}
        <main style={{ width: '100%', minWidth: 0 }}>
          {children}
        </main>

        {/* RIGHT (SPONSORED - TIGHT) */}
        <aside
          style={{
            borderRadius: 14,
            border: '1px solid rgba(255,255,255,0.22)',
            background: 'rgba(255,255,255,0.58)',
            padding: 16,
            backdropFilter: 'blur(10px)',
            boxShadow: '0 10px 24px rgba(0,0,0,0.12)'
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Sponsored</div>
        </aside>
      </div>
    </>
  );
}