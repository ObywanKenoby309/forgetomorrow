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
        .map((item) => (typeof item === 'string' ? item : item?.name || item?.label || ''))
        .filter(Boolean);
    }

    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.items)) {
      return parsed.items
        .map((item) => (typeof item === 'string' ? item : item?.name || item?.label || ''))
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
      role: true, // SEEKER | COACH | RECRUITER | ADMIN
      email: true, // to determine owner by email

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
  const effectiveVisibility = user.profileVisibility || (user.isProfilePublic ? 'PUBLIC' : 'PRIVATE');

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
      ? isOwner || isAdmin || isRecruiter
      : isOwner || isAdmin; // PRIVATE

  if (!allowed) {
    // stealth 404 so private profiles can't be enumerated
    return { notFound: true };
  }

  const { resumes, ...userSafe } = user;
  const primaryResume = resumes && resumes.length > 0 ? resumes[0] : null;

  return {
    props: {
      user: JSON.parse(JSON.stringify(userSafe)),
      primaryResume: primaryResume ? JSON.parse(JSON.stringify(primaryResume)) : null,
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

  // ✅ More compact + more glass (still legible)
  const CARD_STYLE = {
    width: '100%',
    borderRadius: 12,
    padding: 16, // was 20
    background: 'rgba(255,255,255,0.78)', // more transparent
    border: '1px solid rgba(255,255,255,0.28)',
    boxShadow: '0 10px 24px rgba(0,0,0,0.14)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
  };

  const SECTION_GAP = 14; // was ~18

  const TEXT_DARK = '#0F172A';
  const TEXT_MED = '#1F2937';
  const TEXT_MUTED = '#334155';

  return (
    <>
      <Head>
        <title>{fullName} – ForgeTomorrow Profile</title>
        <meta name="description" content={`View the professional profile of ${fullName} on ForgeTomorrow.`} />
      </Head>

      <style>{`
        @media (max-width: 640px) {
          .public-banner {
            background-size: contain !important;
            background-position: center !important;
            background-repeat: no-repeat !important;
            width: 100% !important;
          }
        }
      `}</style>

      <div
        style={{
          minHeight: '100vh',
          width: '100%',
          backgroundImage: wallpaperUrl ? `url(${wallpaperUrl})` : 'linear-gradient(135deg, #112033, #1c2a3c)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          padding: '16px 0', // slightly tighter
        }}
      >
        <main
          style={{
            maxWidth: 820, // slightly narrower so it feels less “giant”
            margin: '0 auto',
            padding: '0 18px 34px',
            minHeight: '80vh',
          }}
        >
          {/* Banner (LEAVE ALONE) */}
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
              marginBottom: 10, // small gap under banner
              backgroundColor: '#112033',
            }}
          />

          {/* Header card */}
          <section
            style={{
              ...CARD_STYLE,
              display: 'flex',
              gap: 16, // tighter
              marginTop: 8,
            }}
          >
            <img
              src={avatarUrl || '/demo-profile.jpg'}
              alt="Profile photo"
              style={{
                width: 96, // was 120
                height: 96, // was 120
                borderRadius: '50%',
                objectFit: 'cover',
                border: '4px solid #FF7043',
              }}
            />

            <div style={{ flex: 1 }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: 22, // was 26
                  fontWeight: 800,
                  color: TEXT_DARK,
                  lineHeight: 1.15,
                }}
              >
                {fullName}
              </h1>

              {pronouns && <p style={{ margin: '4px 0', color: TEXT_MUTED, fontSize: 13 }}>{pronouns}</p>}

              {headline && (
                <p
                  style={{
                    margin: '6px 0',
                    fontSize: 14, // was 16
                    color: TEXT_MED,
                    fontWeight: 650,
                    lineHeight: 1.35,
                  }}
                >
                  {headline}
                </p>
              )}

              {(location || status) && (
                <p
                  style={{
                    margin: '6px 0',
                    fontSize: 13, // was 14
                    color: TEXT_MUTED,
                  }}
                >
                  {location && `Location: ${location}`} {status && `• ${status}`}
                </p>
              )}

              <div
                style={{
                  marginTop: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  flexWrap: 'wrap',
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    color: TEXT_MUTED,
                    background: 'rgba(255,255,255,0.55)',
                    padding: '4px 8px',
                    borderRadius: 6,
                    wordBreak: 'break-all',
                    border: '1px solid rgba(0,0,0,0.08)',
                  }}
                >
                  {profileUrl}
                </span>

                <button
                  onClick={() =>
                    typeof navigator !== 'undefined' && navigator.clipboard?.writeText(profileUrl)
                  }
                  style={{
                    background: '#FF7043',
                    color: 'white',
                    border: 'none',
                    padding: '6px 10px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                  type="button"
                >
                  Copy
                </button>
              </div>

              {/* Public label inside the header card */}
              {effectiveVisibility === 'PUBLIC' && (
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    color: TEXT_MUTED,
                    fontStyle: 'italic',
                  }}
                >
                  This is a public{' '}
                  <strong style={{ color: '#FF7043', fontStyle: 'normal' }}>ForgeTomorrow</strong> profile.
                </div>
              )}
            </div>
          </section>

          {/* About */}
          {aboutMe && (
            <section
              style={{
                ...CARD_STYLE,
                marginTop: SECTION_GAP,
              }}
            >
              <h2
                style={{
                  margin: '0 0 8px',
                  fontSize: 16, // was 18
                  fontWeight: 850,
                  color: TEXT_DARK,
                }}
              >
                About
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: 13, // was 14
                  lineHeight: 1.6,
                  color: TEXT_MED,
                  whiteSpace: 'pre-line',
                }}
              >
                {aboutMe}
              </p>
            </section>
          )}

          {/* Primary Resume */}
          {primaryResume && (
            <section
              style={{
                ...CARD_STYLE,
                marginTop: SECTION_GAP,
              }}
            >
              <h2
                style={{
                  margin: '0 0 8px',
                  fontSize: 16,
                  fontWeight: 850,
                  color: TEXT_DARK,
                }}
              >
                Primary Resume
              </h2>

              <p
                style={{
                  margin: '0 0 6px',
                  fontSize: 13,
                  color: TEXT_MED,
                }}
              >
                {primaryResume.name || 'Primary resume'} · Last updated{' '}
                {new Date(primaryResume.updatedAt).toLocaleDateString()}
              </p>

              <a
                href={`/api/resume/public-download?slug=${encodeURIComponent(slug)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  marginTop: 8,
                  fontSize: 13,
                  color: '#FF7043',
                  textDecoration: 'underline',
                  fontWeight: 800,
                }}
              >
                Download Resume (PDF)
              </a>
            </section>
          )}

          {/* Skills / Languages */}
          {(skills.length > 0 || languages.length > 0) && (
            <section
              style={{
                marginTop: SECTION_GAP,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 14,
              }}
            >
              {skills.length > 0 && (
                <div style={{ ...CARD_STYLE, padding: 14 }}>
                  <h2
                    style={{
                      margin: '0 0 8px',
                      fontSize: 14,
                      fontWeight: 850,
                      color: TEXT_DARK,
                    }}
                  >
                    Skills
                  </h2>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                    {skills.map((skill) => (
                      <span
                        key={skill}
                        style={{
                          fontSize: 12,
                          padding: '4px 10px',
                          borderRadius: 999,
                          background: 'rgba(255,255,255,0.55)',
                          color: TEXT_DARK,
                          border: '1px solid rgba(0,0,0,0.08)',
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {languages.length > 0 && (
                <div style={{ ...CARD_STYLE, padding: 14 }}>
                  <h2
                    style={{
                      margin: '0 0 8px',
                      fontSize: 14,
                      fontWeight: 850,
                      color: TEXT_DARK,
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
                      color: TEXT_MED,
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
