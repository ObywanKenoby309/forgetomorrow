// components/layouts/SeekerLayout.js
import React from 'react';
import Head from 'next/head';
import SeekerSidebar from '@/components/SeekerSidebar';
import SeekerHeader from '@/components/seeker/SeekerHeader';
import useSidebarCounts from '@/components/hooks/useSidebarCounts';

export default function SeekerLayout({
  title = 'ForgeTomorrow — Seeker',
  left,
  header,
  right,
  children,
  activeNav,
}) {
  const counts = useSidebarCounts(); // ← NEW

  return (
    <>
      <Head><title>{title}</title></Head>
      <SeekerHeader />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '240px minmax(640px, 1fr) 240px',
          gridTemplateRows: 'auto 1fr',
          gridTemplateAreas: `
            "left header right"
            "left content right"
          `,
          gap: 20,
          padding: '30px',
          alignItems: 'start',
        }}
      >
        {/* LEFT — Sidebar */}
        <aside style={{ gridArea: 'left', alignSelf: 'start' }}>
          {left || <SeekerSidebar active={activeNav} counts={counts} />}
        </aside>

        {/* HEADER */}
        <header
          style={{
            gridArea: 'header',
            alignSelf: 'start',
            marginTop: 0,
            paddingTop: 0,
            minWidth: 0,
          }}
        >
          {header}
        </header>

        {/* RIGHT — Dark Rail */}
        <aside
          style={{
            gridArea: 'right',
            alignSelf: 'start',
            background: '#2a2a2a',
            border: '1px solid #3a3a3a',
            borderRadius: 12,
            padding: 16,
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
            minHeight: 120,
            boxSizing: 'border-box',
            width: 240,
            minWidth: 240,
            maxWidth: 240,
            minInlineSize: 0,
          }}
        >
          {right}
        </aside>

        {/* CONTENT */}
        <main
          style={{
            gridArea: 'content',
            minWidth: 0,
          }}
        >
          <div style={{ display: 'grid', gap: 20, width: '100%', minWidth: 0 }}>
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
