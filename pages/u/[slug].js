// pages/u/[slug].js
import Head from 'next/head';
import { prisma } from '@/lib/prisma';

// ✅ NEW: session gating for PUBLIC vs RECRUITERS_ONLY vs PRIVATE
import { getServerSession } from 'next-auth/next';
import authOptions from '../api/auth/[...nextauth]';

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

  // ✅ NEW: who is trying to view?
  const session = await getServerSession(context.req, context.res, authOptions);
  const viewerEmail = session?.user?.email ? String(session.user.email) : null;

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

      // ✅ NEW: visibility gating fields
      isProfilePublic: true,
      profileVisibility: true, // enum: PRIVATE | PUBLIC | RECRUITERS_ONLY
      role: true,              // SEEKER | COACH | RECRUITER | ADMIN
      email: true,             // to determine owner by email

      // Primary resume
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
    return { notFound: true };
  }

  // ✅ NEW: normalize legacy boolean into enum behavior (back-compat)
  const effectiveVisibility =
    user.profileVisibility || (user.isProfilePublic ? 'PUBLIC' : 'PRIVATE');

  // ✅ NEW: viewer role lookup (only if logged in)
  let viewerRole = null;
  let viewerId = null;
  if (viewerEmail) {
    const viewer = await prisma.user.findUnique({
      where: { email: viewerEmail },
      select: { id: true, role: true, email: true },
    });
    viewerRole = viewer?.role || null;
    viewerId = viewer?.id || null;
  }

  const isOwner =
    Boolean(viewerEmail) &&
    Boolean(user.email) &&
    String(user.email).toLowerCase() === String(viewerEmail).toLowerCase();

  const isAdmin = viewerRole === 'ADMIN';
  const isRecruiter = viewerRole === 'RECRUITER';

  // ✅ NEW: enforce visibility rules
  const allowed =
    effectiveVisibility === 'PUBLIC'
      ? true
      : effectiveVisibility === 'RECRUITERS_ONLY'
      ? (isOwner || isAdmin || isRecruiter)
      : (isOwner || isAdmin); // PRIVATE

  if (!allowed) {
    // stealth 404 so private profiles can't be enumerated
    return { notFound: true };
  }

  const { resumes, ...userSafe } = user;
  const primaryResume = resumes && resumes.length > 0 ? resumes[0] : null;

  return {
    props: {
      user: JSON.parse(JSON.stringify(userSafe)),
      primaryResume: primaryResume
        ? JSON.parse(JSON.stringify(primaryResume))
        : null,
      effectiveVisibility,
      viewer: {
        id: viewerId,
        role: viewerRole,
      },
    },
  };
}

export default function PublicProfile({ user, primaryResume, effectiveVisibility }) {
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

      <style>{`
        @media (max-width: 640px) {
          .public-banner {
            background-size: contain !important;
            background-position: center !important;
            background-repeat: no-repeat !important;
            width: 100% !important;
          }
          .ft-grid {
            grid-template-columns: 1fr !important;
          }
          .ft-headerRow {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
        }
      `}</style>

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
          {/* Banner (STRONG / unchanged content, layout only below) */}
          <div
            className="public-banner"
            style={{
              width: '100%',
              height: resolvedBannerHeight,
              backgroundImage: bannerBackgroundImage,
              backgroundSize: bannerBackgroundSize,
              backgroundPosition: bannerBackgroundPosition,
              backgroundRepeat: 'no-repeat',
              borderRadius: 12,
              marginBottom: 0, // layout: we will overlap glass cards
              backgroundColor: '#112033',
              position: 'relative',
              overflow: 'hidden',
            }}
          />

          {/* LAYOUT: Overlap zone + glass blocks */}
          <div style={{ position: 'relative' }}>
            {/* FLOATING RIBBON (moved up into banner-adjacent whitespace) */}
            {effectiveVisibility === 'PUBLIC' && (
              <div
                style={{
                  position: 'absolute',
                  right: 16,
                  top: -48,
                  zIndex: 5,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  borderRadius: 999,
                  border: '1px solid rgba(255,255,255,0.18)',
                  background: 'rgba(17, 32, 51, 0.35)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
                  textShadow: '0 1px 3px rgba(0,0,0,0.45)',
                  fontSize: 12,
                  color: '#ECEFF1',
                }}
              >
                <span>This is a public</span>
                <span
                  style={{
                    color: '#FF7043',
                    fontWeight: 900,
                    letterSpacing: 0.2,
                  }}
                >
                  ForgeTomorrow
                </span>
                <span>profile.</span>
              </div>
            )}

            {/* HEADER CARD (glass) – same content, new layout */}
            <section
              style={{
                marginTop: -54, // overlap banner
                borderRadius: 14,
                padding: 20,
                display: 'flex',
                gap: 20,
                alignItems: 'center',
                position: 'relative',
                zIndex: 4,

                // GLASS
                background: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.55)',
                boxShadow: '0 22px 60px rgba(0,0,0,0.22)',
              }}
              className="ft-headerRow"
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
                  flexShrink: 0,
                }}
              />

              <div style={{ flex: 1, minWidth: 0 }}>
                <h1
                  style={{
                    margin: 0,
                    fontSize: 26,
                    fontWeight: 800,
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
                      background: 'rgba(236, 239, 241, 0.85)',
                      padding: '4px 8px',
                      borderRadius: 6,
                      wordBreak: 'break-all',
                      border: '1px solid rgba(0,0,0,0.06)',
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
                      fontWeight: 700,
                    }}
                    type="button"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </section>

            {/* CONTENT GRID (same sections, just laid out + glass) */}
            <div
              className="ft-grid"
              style={{
                marginTop: 18,
                display: 'grid',
                gridTemplateColumns: '1.35fr 0.65fr',
                gap: 16,
                alignItems: 'start',
              }}
            >
              {/* LEFT COLUMN: About + Primary Resume */}
              <div style={{ display: 'grid', gap: 16 }}>
                {/* About (same content, new container style) */}
                {aboutMe && (
                  <section
                    style={{
                      padding: 20,
                      borderRadius: 14,

                      // GLASS
                      background: 'rgba(255, 255, 255, 0.86)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255,255,255,0.55)',
                      boxShadow: '0 18px 48px rgba(0,0,0,0.18)',
                    }}
                  >
                    <h2
                      style={{
                        margin: '0 0 8px',
                        fontSize: 18,
                        fontWeight: 700,
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

                {/* Primary Resume (same content, new container style) */}
                {primaryResume && (
                  <section
                    style={{
                      padding: 20,
                      borderRadius: 14,

                      // GLASS
                      background: 'rgba(255, 255, 255, 0.86)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255,255,255,0.55)',
                      boxShadow: '0 18px 48px rgba(0,0,0,0.18)',
                    }}
                  >
                    <h2
                      style={{
                        margin: '0 0 8px',
                        fontSize: 18,
                        fontWeight: 700,
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

                    <a
                      href={`/api/resume/public-download?slug=${encodeURIComponent(
                        slug
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-block',
                        marginTop: 10,
                        fontSize: 14,
                        color: '#FF7043',
                        textDecoration: 'underline',
                        fontWeight: 700,
                      }}
                    >
                      Download Resume (PDF)
                    </a>
                  </section>
                )}
              </div>

              {/* RIGHT COLUMN: Skills / Languages (same content, stacked) */}
              {(skills.length > 0 || languages.length > 0) && (
                <div style={{ display: 'grid', gap: 16 }}>
                  {skills.length > 0 && (
                    <section
                      style={{
                        padding: 20,
                        borderRadius: 14,

                        // GLASS
                        background: 'rgba(255, 255, 255, 0.86)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255,255,255,0.55)',
                        boxShadow: '0 18px 48px rgba(0,0,0,0.18)',
                      }}
                    >
                      <h2
                        style={{
                          margin: '0 0 8px',
                          fontSize: 16,
                          fontWeight: 700,
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
                              background: 'rgba(236, 239, 241, 0.9)',
                              color: '#37474F',
                              border: '1px solid rgba(0,0,0,0.06)',
                            }}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </section>
                  )}

                  {languages.length > 0 && (
                    <section
                      style={{
                        padding: 20,
                        borderRadius: 14,

                        // GLASS
                        background: 'rgba(255, 255, 255, 0.86)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255,255,255,0.55)',
                        boxShadow: '0 18px 48px rgba(0,0,0,0.18)',
                      }}
                    >
                      <h2
                        style={{
                          margin: '0 0 8px',
                          fontSize: 16,
                          fontWeight: 700,
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
                    </section>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
