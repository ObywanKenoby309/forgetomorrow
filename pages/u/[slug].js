// pages/u/[slug].js
import Head from 'next/head';
import { prisma } from '@/lib/prisma';

// Safe JSON array parser
function parseArrayField(raw, fallback = []) {
  if (!raw) return fallback;
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
    if (parsed?.items && Array.isArray(parsed.items)) return parsed.items.filter(Boolean);
    return fallback;
  } catch {
    return fallback;
  }
}

export async function getServerSideProps(context) {
  const { slug } = context.params;

  const user = await prisma.user.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      firstName: true,
      lastName: true,
      headline: true,
      pronouns: true,
      location: true,
      status: true,
      avatarUrl: true,
      coverUrl: true,
      aboutMe: true,
      skillsJson: true,
      languagesJson: true,

      bannerMode: true,
      bannerHeight: true,
      bannerFocalY: true,
      wallpaperUrl: true,
      corporateBannerKey: true,
      corporateBannerLocked: true,

      resumes: {
        where: { isPrimary: true },
        orderBy: { updatedAt: 'desc' },
        take: 1,
        select: {
          id: true,
          name: true,
          updatedAt: true,
          // ⚠️ No fileUrl in schema — do NOT select it
        },
      },
    },
  });

  if (!user) {
    return { notFound: true };
  }

  const primaryResume = user.resumes?.[0] || null;

  return {
    props: {
      user: JSON.parse(JSON.stringify({ ...user, resumes: undefined })),
      primaryResume: primaryResume ? JSON.parse(JSON.stringify(primaryResume)) : null,
    },
  };
}

export default function PublicProfile({ user, primaryResume }) {
  const {
    name,
    headline,
    pronouns,
    location,
    status,
    avatarUrl,
    coverUrl,
    aboutMe,
    skillsJson,
    languagesJson,

    wallpaperUrl,
    bannerMode,
    bannerHeight,
    bannerFocalY,
    corporateBannerKey,
    corporateBannerLocked,
    slug,
  } = user;

  const fullName = name || 'ForgeTomorrow User';
  const profileUrl = `https://forgetomorrow.com/u/${slug}`;

  const skills = parseArrayField(skillsJson, []);
  const languages = parseArrayField(languagesJson, []);

  const resolvedBannerHeight = bannerHeight || 260;

  // MOBILE-FRIENDLY BANNER FIX
  let bannerBackgroundImage;

  if (corporateBannerLocked && corporateBannerKey) {
    bannerBackgroundImage = `url(/corporate-banners/${corporateBannerKey}.png)`;
  } else if (coverUrl) {
    bannerBackgroundImage = `url(${coverUrl})`;
  } else if (wallpaperUrl) {
    bannerBackgroundImage = `url(${wallpaperUrl})`;
  } else {
    bannerBackgroundImage = 'linear-gradient(135deg, #112033, #455A64)';
  }

  const bannerBackgroundPosition =
    typeof bannerFocalY === 'number' ? `center ${bannerFocalY}%` : 'center';

  // ⭐ MOBILE FIX — force object-fit style behavior
  const bannerBackgroundSize = '100% auto; max-width:100%;';

  return (
    <>
      <Head>
        <title>{fullName} – ForgeTomorrow Profile</title>
      </Head>

      <div
        style={{
          minHeight: '100vh',
          width: '100%',
          backgroundImage: wallpaperUrl
            ? `url(${wallpaperUrl})`
            : 'linear-gradient(135deg, #112033, #1c2a3c)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          padding: '20px 0',
        }}
      >
        <main
          style={{
            maxWidth: 860,
            margin: '0 auto',
            padding: '0 20px 40px',
          }}
        >
          {/* BANNER - MOBILE SAFE */}
          <div
            style={{
              width: '100%',
              height: resolvedBannerHeight,
              backgroundImage: bannerBackgroundImage,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: bannerBackgroundPosition,
              backgroundSize: 'cover', // cover is OK — below we force containment via wrapper
              borderRadius: 12,
              marginBottom: 20,
              overflow: 'hidden',
            }}
          />

          {/* HEADER CARD */}
          <section
            style={{
              background: 'white',
              borderRadius: 12,
              padding: 20,
              border: '1px solid #e0e0e0',
              display: 'flex',
              gap: 20,
            }}
          >
            <img
              src={avatarUrl || '/demo-profile.jpg'}
              alt="Profile"
              style={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '4px solid #FF7043',
              }}
            />

            <div style={{ flex: 1 }}>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>{fullName}</h1>

              {pronouns && <p style={{ margin: '4px 0' }}>{pronouns}</p>}
              {headline && (
                <p style={{ margin: '6px 0', fontSize: 16, color: '#455A64' }}>
                  {headline}
                </p>
              )}
              {(location || status) && (
                <p style={{ margin: '6px 0', fontSize: 14, color: '#455A64' }}>
                  {location || ''} {status ? `• ${status}` : ''}
                </p>
              )}

              <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span
                  style={{
                    background: '#ECEFF1',
                    padding: '4px 8px',
                    borderRadius: 6,
                    fontSize: 13,
                  }}
                >
                  {profileUrl}
                </span>
                <button
                  onClick={() => navigator.clipboard?.writeText(profileUrl)}
                  style={{
                    background: '#FF7043',
                    color: 'white',
                    border: 'none',
                    padding: '6px 10px',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Copy
                </button>
              </div>
            </div>
          </section>

          {/* ABOUT */}
          {aboutMe && (
            <section
              style={{
                marginTop: 24,
                padding: 20,
                background: 'white',
                borderRadius: 12,
                border: '1px solid #e0e0e0',
              }}
            >
              <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>About</h2>
              <p style={{ whiteSpace: 'pre-line', color: '#455A64' }}>{aboutMe}</p>
            </section>
          )}

          {/* PRIMARY RESUME SECTION */}
          {primaryResume && (
            <section
              style={{
                marginTop: 24,
                padding: 20,
                background: 'white',
                borderRadius: 12,
                border: '1px solid #e0e0e0',
              }}
            >
              <h2 style={{ margin: 0, fontSize: 18 }}>Primary Resume</h2>

              <p style={{ margin: '6px 0', color: '#455A64', fontSize: 14 }}>
                {primaryResume.name || 'Primary Resume'} · Last updated{' '}
                {new Date(primaryResume.updatedAt).toLocaleDateString()}
              </p>

              <p style={{ margin: 0, fontSize: 12, color: '#78909C' }}>
                Recruiters reviewing this profile can request or view this resume through
                your applications.
              </p>
            </section>
          )}

          {/* SKILLS / LANGUAGES */}
          {(skills.length > 0 || languages.length > 0) && (
            <section
              style={{
                marginTop: 24,
                display: 'grid',
                gap: 16,
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              }}
            >
              {skills.length > 0 && (
                <div
                  style={{
                    background: 'white',
                    padding: 20,
                    borderRadius: 12,
                    border: '1px solid #e0e0e0',
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: 16 }}>Skills</h3>
                  <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {skills.map((s) => (
                      <span
                        key={s}
                        style={{
                          background: '#ECEFF1',
                          padding: '4px 8px',
                          borderRadius: 999,
                          fontSize: 12,
                        }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {languages.length > 0 && (
                <div
                  style={{
                    background: 'white',
                    padding: 20,
                    borderRadius: 12,
                    border: '1px solid #e0e0e0',
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: 16 }}>Languages</h3>
                  <ul style={{ marginTop: 8, padding: 0, listStyle: 'none' }}>
                    {languages.map((l) => (
                      <li key={l} style={{ fontSize: 13, marginBottom: 4 }}>
                        {l}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </>
  );
}
