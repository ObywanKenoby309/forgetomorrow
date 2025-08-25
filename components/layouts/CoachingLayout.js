// components/layouts/CoachingLayout.js

import React from 'react';
import Head from 'next/head';
import CoachingHeader from '@/components/coaching/CoachingHeader';
import CoachingSidebar from '@/components/coaching/CoachingSidebar';

export default function CoachingLayout({
  title = 'ForgeTomorrow — Coaching',
  headerTitle = '',
  headerDescription = '',
  left,
  right,
  children,
  activeNav = 'overview',
}) {
  return (
    <>
      <Head><title>{title}</title></Head>
      <CoachingHeader />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '240px minmax(740px, 1fr) 280px',
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
          {left || <CoachingSidebar active={activeNav} />}
        </aside>

        {/* HEADER — centered title box */}
        <header style={{ gridArea: 'header', alignSelf: 'center' }}>
          <section
            style={{
              background: 'white',
              border: '1px solid #eee',
              borderRadius: 12,
              padding: 16,
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              textAlign: 'center',
            }}
          >
            <h1
              style={{
                color: '#FF7043',
                fontSize: 28,
                fontWeight: 800,
                margin: 0,
              }}
            >
              {headerTitle}
            </h1>
            {headerDescription && (
              <p
                style={{
                  marginTop: 8,
                  color: '#546E7A',
                  fontSize: 14,
                }}
              >
                {headerDescription}
              </p>
            )}
          </section>
        </header>

        {/* RIGHT — dark rail like site header */}
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
