// pages/profile.js
import React, { useState } from 'react';
import Head from 'next/head';
import SeekerLayout from '@/components/layouts/SeekerLayout';

// ⚙️ Quick spacing controls (tweak to taste)
const UI = {
  CARD_PAD: 16,       // section padding
  SECTION_GAP: 16,    // vertical gap between sections
  AVATAR_SIZE: 128,   // profile image size
  INLINE_GAP: 16,     // row spacing in header card
};

export default function ProfilePage() {
  const [historyOpen, setHistoryOpen] = useState(false);

  const HeaderBox = (
    <section
      style={{
        background: 'white',
        border: '1px solid #eee',
        borderRadius: 12,
        padding: UI.CARD_PAD,
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        textAlign: 'center',
      }}
    >
      <h1 style={{ margin: 0, color: '#FF7043', fontSize: 24, fontWeight: 800 }}>
        Your Profile
      </h1>
      <p style={{ margin: '6px auto 0', color: '#607D8B', maxWidth: 720 }}>
        Manage your public info and showcase what makes you, you.
      </p>
    </section>
  );

  const alertSoon = (feature) => () => alert(`${feature} feature coming soon!`);

  // optional: named handler so you can comment near the function if needed
  const openHistory = () => setHistoryOpen(true);

  return (
    <>
      <Head><title>Profile | ForgeTomorrow</title></Head>

      <SeekerLayout
        title="Profile | ForgeTomorrow"
        header={HeaderBox}
        right={null}
        activeNav="profile"
      >
        <div style={{ maxWidth: 860, display: 'grid', gap: UI.SECTION_GAP }}>
          {/* Top: Image + Basics */}
          <section
            style={{
              background: 'white',
              borderRadius: 12,
              padding: UI.CARD_PAD,
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              border: '1px solid #eee',
            }}
          >
            <div style={{ display: 'flex', gap: UI.INLINE_GAP, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Avatar + button */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img
                  src="/demo-profile.jpg"
                  alt="Profile picture"
                  style={{
                    width: UI.AVATAR_SIZE,
                    height: UI.AVATAR_SIZE,
                    objectFit: 'cover',
                    borderRadius: 9999,
                    border: '4px solid #FF7043',
                    boxShadow: '0 0 10px rgba(255,112,67,0.5)',
                  }}
                  onError={(e) => {
                    if (!e.currentTarget.src.includes('/demo-profile.jpg')) {
                      e.currentTarget.src = '/demo-profile.jpg';
                    }
                  }}
                />
                <button
                  onClick={alertSoon('Profile picture update')}
                  aria-label="Update profile picture"
                  style={{
                    marginTop: 10,
                    background: '#FF7043',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: 8,
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = '#F4511E')}
                  onMouseOut={(e) => (e.currentTarget.style.background = '#FF7043')}
                >
                  Update Picture
                </button>
              </div>

              {/* Basic info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 240 }}>
                <h1 style={{ fontSize: 28, fontWeight: 800, color: '#FF7043', margin: 0 }}>
                  Eric James
                </h1>
                <p style={{ color: '#374151', fontSize: 16, margin: 0 }}>He/Him</p>
                <p style={{ color: '#4B5563', fontStyle: 'italic', marginTop: 6, maxWidth: 640 }}>
                  Customer Success Leader & AI Advocate
                </p>
                <div style={{ display: 'flex', gap: 12, color: '#4B5563', marginTop: 6, flexWrap: 'wrap' }}>
                  <span>Location: Nashville, TN</span>
                  <span>Status: Open to Opportunities</span>
                </div>
              </div>
            </div>
          </section>

          {/* About Me */}
          <section
            style={{
              position: 'relative',
              background: 'white',
              borderRadius: 12,
              padding: UI.CARD_PAD,
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              border: '1px solid #eee',
            }}
          >
            <button
              onClick={alertSoon('Edit About Me')}
              aria-label="Edit About Me"
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                background: '#FF7043',
                color: 'white',
                padding: '6px 12px',
                borderRadius: 8,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = '#F4511E')}
              onMouseOut={(e) => (e.currentTarget.style.background = '#FF7043')}
            >
              Edit
            </button>
            <h2 style={{ color: '#FF7043', fontSize: 22, fontWeight: 700, marginTop: 0 }}>
              About Me
            </h2>
            <p style={{ color: '#374151', marginBottom: 0, lineHeight: 1.5 }}>
              Experienced leader with 20+ years in customer success, technical support, and team
              management. Passionate about building authentic professional relationships and
              leveraging AI to empower job seekers.
            </p>
          </section>

          {/* Professional History — opens modal */}
          <section
            role="button"
            tabIndex={0}
            aria-label="Open Professional History"
            onClick={openHistory}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') openHistory();
            }}
            style={{
              background: 'white',
              borderRadius: 12,
              padding: UI.CARD_PAD,
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              border: '1px solid #eee',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <h2 style={{ color: '#FF7043', fontSize: 22, fontWeight: 700, margin: 0 }}>
              Professional History
            </h2>
            <span style={{ color: '#FF7043', fontWeight: 700, fontSize: 18 }}>→</span>
          </section>

          {/* Analytics */}
          <section
            role="button"
            tabIndex={0}
            aria-label="Go to Analytics Dashboard"
            onClick={alertSoon('Analytics dashboard')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') alertSoon('Analytics dashboard')();
            }}
            style={{
              background: 'white',
              borderRadius: 12,
              padding: UI.CARD_PAD,
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              border: '1px solid #eee',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
            }}
          >
            <h2 style={{ color: '#FF7043', fontSize: 22, fontWeight: 700, margin: 0 }}>
              Analytics
            </h2>
            <span style={{ color: '#FF7043', fontWeight: 700, fontSize: 18 }}>→</span>
          </section>
        </div>

        {/* ---------- Modal: Professional History ---------- */}
        {historyOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Professional History"
            onClick={() => setHistoryOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.35)',
              display: 'grid',
              placeItems: 'center',
              zIndex: 50,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: 720,
                background: 'white',
                borderRadius: 12,
                padding: 16,
                border: '1px solid #eee',
                boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
                display: 'grid',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 800, color: '#263238' }}>Professional History</div>
                <button
                  type="button"
                  onClick={() => setHistoryOpen(false)}
                  style={{
                    background: 'white',
                    color: '#FF7043',
                    border: '1px solid #FF7043',
                    borderRadius: 10,
                    padding: '8px 12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>

              <div style={{ color: '#607D8B' }}>
                This is a placeholder modal. We can list roles, timeframes, bullet points, and let you
                add/edit them here. If you prefer a dedicated page, we can route this to
                <code> /professional-history</code> and build a CRUD there.
              </div>
            </div>
          </div>
        )}
        {/* ---------- /Modal ---------- */}
      </SeekerLayout>
    </>
  );
}
