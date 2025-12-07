// pages/u/[slug].js
import Head from 'next/head';
import { prisma } from '@/lib/prisma';

// Safe helpers for parsing skills / languages from JSON
function parseArrayField(raw, fallback = []) {
  if (!raw) return fallback;

  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;

    if (Array.isArray(parsed)) {
      return parsed
        .map((item) =>
          typeof item === 'string' ? item : item?.name || item?.label || ''
        )
        .filter(Boolean);
    }

    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.items)) {
      return parsed.items
        .map((item) =>
          typeof item === 'string' ? item : item?.name || item?.label || ''
        )
        .filter(Boolean);
    }

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

      // 👇 primary resume (if any)
      resumes: {
        where: { isPrimary: true },
        orderBy: { updatedAt: 'desc' },
        take: 1,
        select: {
          id: true,
          name: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!user) {
    return {
      notFound: true,
    };
  }

  const { resumes, ...userSafe } = user;
  const primaryResume = resumes && resumes.length > 0 ? resumes[0] : null;

  return {
    props: {
      user: JSON.parse(JSON.stringify(userSafe)),
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
    slug,
    aboutMe,
    skillsJson,
    languagesJson,
    bannerMode,
    bannerHeight,
    bannerFocalY,
    wallpaperUrl,
    corporateBannerKey,
    corporateBannerLocked,
  } = user;

  const fullName = name || 'Unknown User';
  const profileUrl = `https://forgetomorrow.com/u/${slug}`;

  const skills = parseArrayField(skillsJson, []);
  const languages = parseArrayField(languagesJson, []);

  const resolvedBannerHeight = bannerHeight || 260;

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

  const bannerBackgroundSize = bannerMode === 'fit' ? 'contain' : 'cover';

  return (
    <>
      <Head>
        <title>{fullName} – ForgeTomorrow Profile</title>
        <meta
          name="description"
          content={`View the professional profile of ${fullName} on ForgeTomorrow.`}
        />
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
          backgroundRepeat: 'no-repeat',
          padding: '20px 0',
        }}
      >
        <main
          style={{
            maxWidth: 860,
            margin: '0 auto',
            padding: '0 20px 40px',
            minHeight: '80vh',
          }}
        >
          {/* Banner */}
          <div
            style={{
              width: '100%',
              height: resolvedBannerHeight,
              backgroundImage: bannerBackgroundImage,
              backgroundSize: bannerBackgroundSize,
              backgroundPosition: bannerBackgroundPosition,
              backgroundRepeat: 'no-repeat',
              borderRadius: 12,
              marginBottom: 20,
              backgroundColor: '#112033',
            }}
          />

          {/* Header card */}
          <section
            style={{
              border: '1px solid #e0e0e0',
              borderRadius: 12,
              padding: 20,
              background: 'white',
              display: 'flex',
              gap: 20,
            }}
          >
            <img
              src={avatarUrl || '/demo-profile.jpg'}
              alt="Profile photo"
              style={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '4px solid #FF7043',
              }}
            />

            <div style={{ flex: 1 }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: 26,
                  fontWeight: 700,
                  color: '#263238',
                }}
              >
                {fullName}
              </h1>

              {pronouns && (
                <p style={{ margin: '4px 0', color: '#607D8B' }}>{pronouns}</p>
              )}

              {headline && (
                <p
                  style={{
                    margin: '6px 0',
                    fontSize: 16,
                    color: '#455A64',
                  }}
                >
                  {headline}
                </p>
              )}

              {(location || status) && (
                <p
                  style={{
                    margin: '6px 0',
                    fontSize: 14,
                    color: '#455A64',
                  }}
                >
                  {location && `Location: ${location}`}{' '}
                  {status && `• ${status}`}
                </p>
              )}

              <div
                style={{
                  marginTop: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  flexWrap: 'wrap',
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    color: '#455A64',
                    background: '#ECEFF1',
                    padding: '4px 8px',
                    borderRadius: 6,
                    wordBreak: 'break-all',
                  }}
                >
                  {profileUrl}
                </span>

                <button
                  onClick={() =>
                    typeof navigator !== 'undefined' &&
                    navigator.clipboard?.writeText(profileUrl)
                  }
                  style={{
                    background: '#FF7043',
                    color: 'white',
                    border: 'none',
                    padding: '5px 10px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                  type="button"
                >
                  Copy
                </button>
              </div>
            </div>
          </section>

          {/* Public ribbon */}
          <div
            style={{
              marginTop: 16,
              fontSize: 12,
              color: '#ECEFF1',
              textAlign: 'center',
              textShadow: '0 1px 3px rgba(0,0,0,0.5)',
            }}
          >
            This is a public ForgeTomorrow profile.
          </div>

          {/* About */}
          {aboutMe && (
            <section
              style={{
                marginTop: 24,
                padding: 20,
                borderRadius: 12,
                background: 'white',
                border: '1px solid #e0e0e0',
              }}
            >
              <h2
                style={{
                  margin: '0 0 8px',
                  fontSize: 18,
                  fontWeight: 600,
                  color: '#263238',
                }}
              >
                About
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: '#455A64',
                  whiteSpace: 'pre-line',
                }}
              >
                {aboutMe}
              </p>
            </section>
          )}

          {/* Primary Resume (public) */}
          {primaryResume && (
            <section
              style={{
                marginTop: 24,
                padding: 20,
                borderRadius: 12,
                background: 'white',
                border: '1px solid #e0e0e0',
              }}
            >
              <h2
                style={{
                  margin: '0 0 8px',
                  fontSize: 18,
                  fontWeight: 600,
                  color: '#263238',
                }}
              >
                Primary Resume
              </h2>
              <p
                style={{
                  margin: '0 0 6px',
                  fontSize: 14,
                  color: '#455A64',
                }}
              >
                {primaryResume.name || 'Primary resume'} · Last updated{' '}
                {new Date(primaryResume.updatedAt).toLocaleDateString()}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: '#78909C',
                }}
              >
                This resume is currently marked as primary in ForgeTomorrow and is used
                across recruiter views and applications.
              </p>
            </section>
          )}

          {/* Skills / Languages */}
          {(skills.length > 0 || languages.length > 0) && (
            <section
              style={{
                marginTop: 24,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 16,
              }}
            >
              {skills.length > 0 && (
                <div
                  style={{
                    padding: 20,
                    borderRadius: 12,
                    background: 'white',
                    border: '1px solid #e0e0e0',
                  }}
                >
                  <h2
                    style={{
                      margin: '0 0 8px',
                      fontSize: 16,
                      fontWeight: 600,
                      color: '#263238',
                    }}
                  >
                    Skills
                  </h2>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 8,
                      marginTop: 6,
                    }}
                  >
                    {skills.map((skill) => (
                      <span
                        key={skill}
                        style={{
                          fontSize: 12,
                          padding: '4px 8px',
                          borderRadius: 999,
                          background: '#ECEFF1',
                          color: '#37474F',
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {languages.length > 0 && (
                <div
                  style={{
                    padding: 20,
                    borderRadius: 12,
                    background: 'white',
                    border: '1px solid #e0e0e0',
                  }}
                >
                  <h2
                    style={{
                      margin: '0 0 8px',
                      fontSize: 16,
                      fontWeight: 600,
                      color: '#263238',
                    }}
                  >
                    Languages
                  </h2>
                  <ul
                    style={{
                      listStyle: 'none',
                      padding: 0,
                      margin: 0,
                      fontSize: 13,
                      color: '#455A64',
                    }}
                  >
                    {languages.map((lang) => (
                      <li key={lang} style={{ marginBottom: 4 }}>
                        {lang}
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
