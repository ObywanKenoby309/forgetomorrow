// pages/u/[slug].js
import Head from 'next/head';
import { prisma } from '@/lib/prisma';

// ✅ NEW: session gating for PUBLIC vs RECRUITERS_ONLY vs PRIVATE
import { getServerSession } from 'next-auth/next';
import authOptions from '../api/auth/[...nextauth]';

// Safe helpers for parsing skills / languages / education from JSON
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

// NEW: Education-safe parsing (keeps objects so we can render school/degree/etc.)
function parseEducationField(raw, fallback = []) {
  if (!raw) return fallback;

  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;

    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => {
          if (!item) return null;

          // allow array of strings too
          if (typeof item === 'string') {
            return { school: item };
          }

          if (typeof item === 'object') {
            return {
              school: item.school || item.institution || item.name || '',
              degree: item.degree || item.program || '',
              field: item.field || item.major || '',
              startYear: item.startYear || item.start || '',
              endYear: item.endYear || item.end || '',
              notes: item.notes || item.details || '',
            };
          }

          return null;
        })
        .filter((x) => x && (x.school || x.degree || x.field || x.notes));
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

      // ✅ NEW: education
      educationJson: true,

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

    // ✅ NEW: education
    educationJson,

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
  const education = parseEducationField(educationJson, []);

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

  // Glass + layout constants (single source for this page)
  const CARD_BG = 'rgba(255,255,255,0.82)'; // glassy but readable
  const CARD_BORDER = 'rgba(255,255,255,0.35)';
  const CARD_SHADOW = '0 10px 28px rgba(0,0,0,0.22)';
  const TEXT_DARK = '#1F2937';
  const TEXT_MID = '#334155';
  const ORANGE = '#FF7043';

  const cardBase = {
    border: `1px solid ${CARD_BORDER}`,
    borderRadius: 12,
    padding: 20,
    background: CARD_BG,
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    boxShadow: CARD_SHADOW,
    width: '100%',
  };

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
          padding: '18px 0',
        }}
      >
        <main
          style={{
            maxWidth: 760, // smaller = less “overwhelming”
            margin: '0 auto',
            padding: '0 18px 36px',
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
              marginBottom: 12, // small gap between banner and name card
              backgroundColor: '#112033',
            }}
          />

          {/* Header card (moved down; glass) */}
          <section
            style={{
              ...cardBase,
              display: 'flex',
              gap: 20,
              alignItems: 'center',
              marginTop: 6,
            }}
          >
            <img
              src={avatarUrl || '/demo-profile.jpg'}
              alt="Profile photo"
              style={{
                width: 108,
                height: 108,
                borderRadius: '50%',
                objectFit: 'cover',
                border: `4px solid ${ORANGE}`,
                flexShrink: 0,
              }}
            />

            <div style={{ flex: 1, minWidth: 0 }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: 24,
                  fontWeight: 800,
                  color: TEXT_DARK,
                }}
              >
                {fullName}
              </h1>

              {pronouns && (
                <p style={{ margin: '4px 0', color: TEXT_MID, fontSize: 13 }}>
                  {pronouns}
                </p>
              )}

              {headline && (
                <p
                  style={{
                    margin: '6px 0',
                    fontSize: 15,
                    color: TEXT_MID,
                    fontWeight: 600,
                  }}
                >
                  {headline}
                </p>
              )}

              {(location || status) && (
                <p
                  style={{
                    margin: '6px 0',
                    fontSize: 13,
                    color: TEXT_MID,
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
                    color: TEXT_MID,
                    background: 'rgba(236,239,241,0.75)',
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
                    background: ORANGE,
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

              {/* ✅ Move PUBLIC ribbon into the name card (with ForgeTomorrow orange) */}
              {effectiveVisibility === 'PUBLIC' && (
                <div
                  style={{
                    marginTop: 10,
                    fontSize: 12,
                    color: TEXT_MID,
                    fontStyle: 'italic',
                  }}
                >
                  This is a public{' '}
                  <span style={{ color: ORANGE, fontWeight: 800 }}>
                    ForgeTomorrow
                  </span>{' '}
                  profile.
                </div>
              )}
            </div>
          </section>

          {/* Professional Summary (formerly About) */}
          {aboutMe && (
            <section
              style={{
                ...cardBase,
                marginTop: 16,
              }}
            >
              <h2
                style={{
                  margin: '0 0 8px',
                  fontSize: 18,
                  fontWeight: 800,
                  color: TEXT_DARK,
                }}
              >
                Professional Summary
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: TEXT_DARK, // darker for legibility on glass
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
                ...cardBase,
                marginTop: 16,
              }}
            >
              <h2
                style={{
                  margin: '0 0 8px',
                  fontSize: 18,
                  fontWeight: 800,
                  color: TEXT_DARK,
                }}
              >
                Primary Resume
              </h2>

              <p
                style={{
                  margin: '0 0 6px',
                  fontSize: 14,
                  color: TEXT_DARK,
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
                  color: ORANGE,
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
                marginTop: 16,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 16,
              }}
            >
              {skills.length > 0 && (
                <div style={cardBase}>
                  <h2
                    style={{
                      margin: '0 0 8px',
                      fontSize: 16,
                      fontWeight: 800,
                      color: TEXT_DARK,
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
                          padding: '4px 10px',
                          borderRadius: 999,
                          background: 'rgba(236,239,241,0.7)',
                          color: TEXT_DARK,
                          border: '1px solid rgba(0,0,0,0.06)',
                          fontWeight: 600,
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {languages.length > 0 && (
                <div style={cardBase}>
                  <h2
                    style={{
                      margin: '0 0 8px',
                      fontSize: 16,
                      fontWeight: 800,
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
                      color: TEXT_DARK,
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

          {/* Education (public) — below Skills/Languages */}
          {education.length > 0 && (
            <section
              style={{
                ...cardBase,
                marginTop: 16,
              }}
            >
              <h2
                style={{
                  margin: '0 0 8px',
                  fontSize: 18,
                  fontWeight: 800,
                  color: TEXT_DARK,
                }}
              >
                Education
              </h2>

              <div style={{ display: 'grid', gap: 10 }}>
                {education.map((edu, idx) => {
                  const school = edu?.school || '';
                  const degree = edu?.degree || '';
                  const field = edu?.field || '';
                  const startYear = edu?.startYear || '';
                  const endYear = edu?.endYear || '';
                  const notes = edu?.notes || '';

                  const line1 = [degree, field].filter(Boolean).join(' — ');
                  const years = [startYear, endYear].filter(Boolean).join(' – ');

                  return (
                    <div
                      key={`${school || line1 || 'edu'}-${idx}`}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 12,
                        background: 'rgba(236,239,241,0.55)',
                        border: '1px solid rgba(0,0,0,0.06)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 800,
                          color: TEXT_DARK,
                        }}
                      >
                        {school || 'Education'}
                      </div>

                      {(line1 || years) && (
                        <div
                          style={{
                            marginTop: 4,
                            fontSize: 13,
                            color: TEXT_MID,
                            fontWeight: 600,
                          }}
                        >
                          {line1}
                          {line1 && years ? ' • ' : ''}
                          {years}
                        </div>
                      )}

                      {notes && (
                        <div
                          style={{
                            marginTop: 6,
                            fontSize: 13,
                            color: TEXT_DARK,
                            lineHeight: 1.6,
                            whiteSpace: 'pre-line',
                          }}
                        >
                          {notes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </main>
      </div>
    </>
  );
}
