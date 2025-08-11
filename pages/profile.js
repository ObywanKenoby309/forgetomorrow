// pages/profile.js
import Head from 'next/head';
import GenericSidebar from '../components/GenericSidebar';

export default function Profile() {
  const alertFeatureComingSoon = (feature) => () => alert(`${feature} feature coming soon!`);

  return (
    <>
      <Head>
        <title>ForgeTomorrow - Profile</title>
      </Head>

      {/* Mirror Seeker Dashboard layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '300px 1fr',
          gap: '20px',
          padding: '120px 20px 20px',
          minHeight: '100vh',
          backgroundColor: '#ECEFF1',
        }}
      >
        {/* Sidebar column (300px) */}
        <GenericSidebar />

        {/* Main content column (fixed inner width to preserve right margin) */}
        <main style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ maxWidth: 860 }}>
            {/* Top Section: Image and Basic Info */}
            <section
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              }}
            >
              <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Profile Picture + Button */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <img
                    src="/demo-profile.jpg"
                    alt="Profile picture"
                    aria-label="User profile picture"
                    style={{
                      width: 140,
                      height: 140,
                      objectFit: 'cover',
                      borderRadius: '9999px',
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
                    onClick={alertFeatureComingSoon('Profile picture update')}
                    aria-label="Update profile picture"
                    style={{
                      marginTop: 12,
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

                {/* Basic Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <h1 style={{ fontSize: 32, fontWeight: 700, color: '#FF7043', margin: 0 }}>
                    Eric James
                  </h1>
                  <p style={{ color: '#374151', fontSize: 18, margin: 0 }}>He/Him</p>
                  <p style={{ color: '#4B5563', fontStyle: 'italic', marginTop: 8, maxWidth: 640 }}>
                    Customer Success Leader & AI Advocate
                  </p>
                  <div style={{ display: 'flex', gap: 16, color: '#4B5563', marginTop: 8 }}>
                    <span>Location: Nashville, TN</span>
                    <span>Status: Open to Opportunities</span>
                  </div>
                </div>
              </div>
            </section>

            {/* About Me Section */}
            <section
              style={{
                position: 'relative',
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              }}
            >
              <button
                onClick={alertFeatureComingSoon('Edit About Me')}
                aria-label="Edit About Me"
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
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
              <h2 style={{ color: '#FF7043', fontSize: 24, fontWeight: 600, marginTop: 0 }}>
                About Me
              </h2>
              <p style={{ color: '#374151', marginBottom: 0 }}>
                Experienced leader with 20+ years in customer success, technical support, and team
                management. Passionate about building authentic professional relationships and
                leveraging AI to empower job seekers.
              </p>
            </section>

            {/* Professional History Link */}
            <section
              role="button"
              tabIndex={0}
              aria-label="Go to Professional History"
              onClick={alertFeatureComingSoon('Professional History section')}
              onKeyPress={(e) => {
                if (e.key === 'Enter') alertFeatureComingSoon('Professional History section')();
              }}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
            >
              <h2 style={{ color: '#FF7043', fontSize: 24, fontWeight: 600, margin: 0 }}>
                Professional History
              </h2>
              <span style={{ color: '#FF7043', fontWeight: 700, fontSize: 20 }}>→</span>
            </section>

            {/* Analytics Link */}
            <section
              role="button"
              tabIndex={0}
              aria-label="Go to Analytics Dashboard"
              onClick={alertFeatureComingSoon('Analytics dashboard')}
              onKeyPress={(e) => {
                if (e.key === 'Enter') alertFeatureComingSoon('Analytics dashboard')();
              }}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
            >
              <h2 style={{ color: '#FF7043', fontSize: 24, fontWeight: 600, margin: 0 }}>
                Analytics
              </h2>
              <span style={{ color: '#FF7043', fontWeight: 700, fontSize: 20 }}>→</span>
            </section>
          </div>
        </main>
      </div>
    </>
  );
}
