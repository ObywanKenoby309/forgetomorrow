// pages/u/[slug].js
import Head from 'next/head';
import { prisma } from '@/lib/prisma';

// ✅ session gating for PUBLIC vs RECRUITERS_ONLY vs PRIVATE
import { getServerSession } from 'next-auth/next';
import authOptions from '../api/auth/[...nextauth]';

// Safe helpers for parsing skills / languages / education from JSON
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

// Education-safe parsing (keeps objects so we can render school/degree/etc.)
function parseEducationField(raw, fallback = []) {
  if (!raw) return fallback;

  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;

    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => {
          if (!item) return null;

          if (typeof item === 'string') return { school: item };

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
      educationJson: true,

      bannerMode: true,
      bannerHeight: true,
      bannerFocalY: true,
      wallpaperUrl: true,
      corporateBannerKey: true,
      corporateBannerLocked: true,

      // visibility gating fields
      isProfilePublic: true,
      profileVisibility: true, // PRIVATE | PUBLIC | RECRUITERS_ONLY
      role: true,
      email: true,

      // Primary resume
      resumes: {
        where: { isPrimary: true },
        orderBy: { updatedAt: 'desc' },
        take: 1,
        select: { id: true, name: true, updatedAt: true },
      },
    },
  });

  if (!user) return { notFound: true };

  // normalize legacy boolean into enum behavior (back-compat)
  const effectiveVisibility =
    user.profileVisibility || (user.isProfilePublic ? 'PUBLIC' : 'PRIVATE');

  // viewer role lookup (only if logged in)
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

  const allowed =
    effectiveVisibility === 'PUBLIC'
      ? true
      : effectiveVisibility === 'RECRUITERS_ONLY'
      ? isOwner || isAdmin || isRecruiter
      : isOwner || isAdmin;

  if (!allowed) return { notFound: true };

  const { resumes, ...userSafe } = user;
  const primaryResume = resumes && resumes.length > 0 ? resumes[0] : null;

  return {
    props: {
      user: JSON.parse(JSON.stringify(userSafe)),
      primaryResume: primaryResume ? JSON.parse(JSON.stringify(primaryResume)) : null,
      effectiveVisibility,
      viewer: { id: viewerId, role: viewerRole },
    },
  };
}

export default function PublicProfile({ user, primaryResume, effectiveVisibility }) {
  const {
    name,
    firstName,
    lastName,
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
    educationJson,

    bannerMode,
    bannerHeight,
    bannerFocalY,
    wallpaperUrl,
    corporateBannerKey,
    corporateBannerLocked,
  } = user;

  // ✅ Never show "Unknown User" on a portfolio-style public page
  const computedName = String(name || '').trim();
  const computedFirst = String(firstName || '').trim();
  const computedLast = String(lastName || '').trim();
  const fullName = computedName || [computedFirst, computedLast].filter(Boolean).join(' ').trim() || 'ForgeTomorrow Member';

  const profileUrl = `https://forgetomorrow.com/u/${slug}`;

  const skills = parseArrayField(skillsJson, []);
  const languages = parseArrayField(languagesJson, []);
  const education = parseEducationField(educationJson, []);

  const resolvedBannerHeight = typeof bannerHeight === 'number' ? bannerHeight : 260;

  let bannerImage;
  if (corporateBannerLocked && corporateBannerKey) {
    bannerImage = `url(/corporate-banners/${corporateBannerKey}.png)`;
  } else if (coverUrl) {
    bannerImage = `url(${coverUrl})`;
  } else if (wallpaperUrl) {
    bannerImage = `url(${wallpaperUrl})`;
  } else {
    bannerImage = 'linear-gradient(135deg, #112033, #455A64)';
  }

  const bannerPos = typeof bannerFocalY === 'number' ? `center ${bannerFocalY}%` : 'center';

  // IMPORTANT: must show full image (contain) because banners have text
  const bannerFgSize = 'contain';

  // ─────────────────────────────────────────────────────────────
  // ✅ Glass standard (match internal Profile canonical style)
  // ─────────────────────────────────────────────────────────────
  const GLASS_BG = 'rgba(255,255,255,0.72)';      // more “glass” + readability
  const GLASS_BORDER = 'rgba(255,255,255,0.26)';  // slightly clearer edge
  const GLASS_SHADOW = '0 14px 34px rgba(0,0,0,0.14)'; // more premium lift
  const GLASS_BLUR = 'blur(12px)';                // stronger frosted effect

  const TEXT_DARK = '#1F2937';
  const TEXT_MID = '#455A64';
  const ORANGE = '#FF7043';

  const cardBase = {
    border: `1px solid ${GLASS_BORDER}`,
    borderRadius: 14,
    padding: 16,
    background: GLASS_BG,
    backdropFilter: GLASS_BLUR,
    WebkitBackdropFilter: GLASS_BLUR,
    boxShadow: GLASS_SHADOW,
    width: '100%',
  };

  const bannerFrame = {
    borderRadius: 16,
    overflow: 'hidden',
    border: `1px solid ${GLASS_BORDER}`,
    boxShadow: '0 18px 38px rgba(0,0,0,0.18)',
    background: 'rgba(255,255,255,0.18)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    width: '100%',
    position: 'relative',
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
        /* Mobile + polish */
        @media (max-width: 640px) {
          .public-main {
            padding: 0 16px 32px !important;
          }

          .public-banner-frame {
            height: auto !important;
            aspect-ratio: 16 / 9;
          }

          .public-header {
            flex-direction: column !important;
            text-align: center !important;
            align-items: center !important;
          }

          .public-urlrow {
            justify-content: center !important;
          }

          .public-avatar {
            width: 104px !important;
            height: 104px !important;
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
        }}
      >
        {/* subtle cinematic overlay so everything feels intentional */}
        <div
          style={{
            minHeight: '100vh',
            width: '100%',
            background:
              'linear-gradient(180deg, rgba(17,32,51,0.62) 0%, rgba(17,32,51,0.18) 55%, rgba(17,32,51,0.30) 100%)',
            padding: '18px 0',
          }}
        >
          <main
            className="public-main"
            style={{
              maxWidth: 980,
              margin: '0 auto',
              padding: '28px 28px 36px',
              minHeight: '80vh',
            }}
          >
            {/* ─────────────────────────────────────────────────────────────
               ✅ Banner "Top Shelf" Treatment
               - Glass frame
               - Blurred cover background (removes ugly letterbox gaps)
               - Foreground contain (full image always visible)
               ───────────────────────────────────────────────────────────── */}
            <div
              className="public-banner-frame"
              style={{
                ...bannerFrame,
                height: resolvedBannerHeight,
              }}
              aria-label="Profile banner"
            >
              {/* Blurred background fill */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: bannerImage,
                  backgroundSize: 'cover',
                  backgroundPosition: bannerPos,
                  backgroundRepeat: 'no-repeat',
                  filter: 'blur(18px)',
                  transform: 'scale(1.10)',
                  opacity: 0.85,
                }}
              />

              {/* Darken overlay for contrast */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(180deg, rgba(17,32,51,0.55), rgba(17,32,51,0.22))',
                }}
              />

              {/* Foreground banner (full image) */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: bannerImage,
                  backgroundSize: bannerFgSize,
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                }}
              />
            </div>

            {/* Header card (slight overlap onto banner = cohesive “portfolio” stack) */}
            <section
              className="public-header"
              style={{
                ...cardBase,
                display: 'flex',
                gap: 18,
                alignItems: 'center',
                marginTop: -28,
                position: 'relative',
                zIndex: 2,
              }}
              aria-label="Profile header"
            >
              <img
                className="public-avatar"
                src={avatarUrl || '/demo-profile.jpg'}
                alt="Profile photo"
                style={{
                  width: 112,
                  height: 112,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: `4px solid ${ORANGE}`,
                  boxShadow: '0 12px 24px rgba(0,0,0,0.18)',
                  flexShrink: 0,
                }}
              />

              <div style={{ flex: 1, minWidth: 0 }}>
                <h1
                  style={{
                    margin: 0,
                    fontSize: 26,
                    fontWeight: 900,
                    color: TEXT_DARK,
                    letterSpacing: '-0.2px',
                  }}
                >
                  {fullName}
                </h1>

                {pronouns && (
                  <p style={{ margin: '6px 0 0', color: TEXT_MID, fontSize: 13, fontWeight: 700 }}>
                    {pronouns}
                  </p>
                )}

                {headline && (
                  <p
                    style={{
                      margin: '10px 0 0',
                      fontSize: 15,
                      color: TEXT_DARK,
                      fontWeight: 800,
                      lineHeight: 1.35,
                    }}
                  >
                    {headline}
                  </p>
                )}

                {(location || status) && (
                  <p style={{ margin: '10px 0 0', fontSize: 13, color: TEXT_MID, fontWeight: 700 }}>
                    {location && `Location: ${location}`}{' '}
                    {status && `• ${status}`}
                  </p>
                )}

                <div
                  className="public-urlrow"
                  style={{
                    marginTop: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      color: TEXT_MID,
                      background: 'rgba(255,255,255,0.72)',
                      padding: '6px 10px',
                      borderRadius: 10,
                      wordBreak: 'break-all',
                      border: '1px solid rgba(0,0,0,0.06)',
                      fontWeight: 700,
                    }}
                  >
                    {profileUrl}
                  </span>

                  <button
                    onClick={() =>
                      typeof navigator !== 'undefined' && navigator.clipboard?.writeText(profileUrl)
                    }
                    style={{
                      background: ORANGE,
                      color: 'white',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: 10,
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 900,
                      boxShadow: '0 12px 22px rgba(0,0,0,0.12)',
                    }}
                    type="button"
                  >
                    Copy
                  </button>
                </div>

                {effectiveVisibility === 'PUBLIC' && (
                  <div
                    style={{
                      marginTop: 10,
                      fontSize: 12,
                      color: TEXT_MID,
                      fontStyle: 'italic',
                      fontWeight: 700,
                    }}
                  >
                    This is a public{' '}
                    <span style={{ color: ORANGE, fontWeight: 900 }}>ForgeTomorrow</span>{' '}
                    profile.
                  </div>
                )}
              </div>
            </section>

            {/* Professional Summary */}
            {aboutMe && (
              <section style={{ ...cardBase, marginTop: 16 }} aria-label="Professional Summary">
                <h2 style={{ margin: '0 0 10px', fontSize: 18, fontWeight: 900, color: TEXT_DARK }}>
                  Professional Summary
                </h2>
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    lineHeight: 1.75,
                    color: TEXT_DARK,
                    whiteSpace: 'pre-line',
                    fontWeight: 600,
                  }}
                >
                  {aboutMe}
                </p>
              </section>
            )}

            {/* Primary Resume */}
            {primaryResume && (
              <section style={{ ...cardBase, marginTop: 16 }} aria-label="Primary Resume">
                <h2 style={{ margin: '0 0 10px', fontSize: 18, fontWeight: 900, color: TEXT_DARK }}>
                  Primary Resume
                </h2>

                <p style={{ margin: '0 0 6px', fontSize: 14, color: TEXT_DARK, fontWeight: 700 }}>
                  {primaryResume.name || 'Primary resume'} · Last updated{' '}
                  {new Date(primaryResume.updatedAt).toLocaleDateString()}
                </p>

                <a
                  href={`/api/resume/public-download?resumeId=${encodeURIComponent(
                    primaryResume.id
                  )}&slug=${encodeURIComponent(slug)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    marginTop: 10,
                    fontSize: 14,
                    color: ORANGE,
                    textDecoration: 'underline',
                    fontWeight: 900,
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
                aria-label="Skills and Languages"
              >
                {skills.length > 0 && (
                  <div style={cardBase}>
                    <h2 style={{ margin: '0 0 10px', fontSize: 16, fontWeight: 900, color: TEXT_DARK }}>
                      Skills
                    </h2>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                      {skills.map((skill) => (
                        <span
                          key={skill}
                          style={{
                            fontSize: 12,
                            padding: '6px 10px',
                            borderRadius: 999,
                            background: 'rgba(255,255,255,0.72)',
                            color: TEXT_DARK,
                            border: '1px solid rgba(0,0,0,0.06)',
                            fontWeight: 800,
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
                    <h2 style={{ margin: '0 0 10px', fontSize: 16, fontWeight: 900, color: TEXT_DARK }}>
                      Languages
                    </h2>
                    <ul
                      style={{
                        listStyle: 'none',
                        padding: 0,
                        margin: 0,
                        fontSize: 13,
                        color: TEXT_DARK,
                        fontWeight: 700,
                      }}
                    >
                      {languages.map((lang) => (
                        <li key={lang} style={{ marginBottom: 6 }}>
                          {lang}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            )}

            {/* Education */}
            {education.length > 0 && (
              <section style={{ ...cardBase, marginTop: 16 }} aria-label="Education">
                <h2 style={{ margin: '0 0 10px', fontSize: 18, fontWeight: 900, color: TEXT_DARK }}>
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
                          padding: '12px 12px',
                          borderRadius: 14,
                          background: 'rgba(255,255,255,0.62)',
                          border: '1px solid rgba(0,0,0,0.06)',
                        }}
                      >
                        <div style={{ fontSize: 14, fontWeight: 900, color: TEXT_DARK }}>
                          {school || 'Education'}
                        </div>

                        {(line1 || years) && (
                          <div style={{ marginTop: 6, fontSize: 13, color: TEXT_MID, fontWeight: 800 }}>
                            {line1}
                            {line1 && years ? ' • ' : ''}
                            {years}
                          </div>
                        )}

                        {notes && (
                          <div
                            style={{
                              marginTop: 8,
                              fontSize: 13,
                              color: TEXT_DARK,
                              lineHeight: 1.65,
                              whiteSpace: 'pre-line',
                              fontWeight: 600,
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
      </div>
    </>
  );
}
