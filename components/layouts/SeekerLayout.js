import React from 'react';
import Head from 'next/head';
import SeekerSidebar from '@/components/SeekerSidebar';
import SeekerHeader from '@/components/seeker/SeekerHeader';

export default function SeekerLayout({ title = 'ForgeTomorrow — Seeker', left, header, right, children, activeNav }) {
  return (
    <>
      <Head><title>{title}</title></Head>
      <SeekerHeader />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '240px minmax(740px, 1fr) 280px', // reduced sidebar width
          gridTemplateRows: 'auto 1fr',
          gridTemplateAreas: `
            "left header right"
            "left content right"
          `,
          gap: 20,
          padding: '30px',
        }}
      >
        {/* LEFT — Sidebar */}
        <aside style={{ gridArea: 'left', alignSelf: 'start' }}>
          {left || <SeekerSidebar active={activeNav} />}
        </aside>

        {/* HEADER */}
        <header style={{ gridArea: 'header', alignSelf: 'center' }}>
          {header}
        </header>

        {/* RIGHT — matches top header bar color */}
        <aside
          style={{
            gridArea: 'right',
            alignSelf: 'start',
            background: '#2a2a2a', // same as site header
            border: '1px solid #3a3a3a',
            borderRadius: 12,
            padding: 16,
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
            minHeight: 120,
          }}
        >
          {right}
        </aside>

        {/* CONTENT */}
        <main style={{ gridArea: 'content' }}>
          <div style={{ display: 'grid', gap: 20, width: '100%' }}>
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
