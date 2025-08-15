// components/layouts/RecruiterLayout.js
import React from 'react';
import Head from 'next/head';
import RecruiterHeader from '@/components/recruiter/RecruiterHeader';
import RecruiterSidebar from '@/components/recruiter/RecruiterSidebar';

export default function RecruiterLayout({
  title = 'ForgeTomorrow — Recruiter',
  header,
  right,
  children,
}) {
  return (
    <>
      <Head><title>{title}</title></Head>
      <RecruiterHeader />

      {/* Page grid without footer inside */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '300px minmax(860px, 1fr) 280px',
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
        {/* LEFT — Sidebar */}
        <aside style={{ gridArea: 'left', alignSelf: 'start' }}>
          <RecruiterSidebar />
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
          {header}
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
          {right}
        </aside>

        {/* CONTENT */}
        <main style={{ gridArea: 'content' }}>
          <div className="mx-auto px-0 py-0 space-y-6" style={{ width: '100%' }}>
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
