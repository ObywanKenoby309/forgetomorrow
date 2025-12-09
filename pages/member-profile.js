// pages/member-profile.js
import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import SeekerRightColumn from '@/components/seeker/SeekerRightColumn';
import { prisma } from '@/lib/prisma';

// Reuse-safe helper for skills/languages parsing
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
  const { userId } = context.query || {};

  if (!userId || typeof userId !== 'string') {
    return {
      notFound: true,
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
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
      isProfilePublic: true,
    },
  });

  if (!user) {
    return { notFound: true };
  }

  const resumes = await prisma.resume.findMany({
    where: { userId: user.id, isPrimary: true },
    orderBy: { updatedAt: 'desc' },
    take: 1,
    select: {
      id: true,
      name: true,
      updatedAt: true,
    },
  });

  const primaryResume = resumes && resumes.length > 0 ? resumes[0] : null;

  return {
    props: {
      user: JSON.parse(JSON.stringify(user)),
      primaryResume: primaryResume
        ? JSON.parse(JSON.stringify(primaryResume))
        : null,
    },
  };
}

export default function MemberProfile({ user, primaryResume }) {
  const router = useRouter();
  const chrome = String(router.query.chrome || '').toLowerCase();
  const withChrome = (path) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

  const {
    id,
    slug,
    name,
    firstName,
    lastName,
    headline,
    pronouns,
    location,
    status,
    avatarUrl,
    coverUrl,
    aboutMe,
    skillsJson,
    languagesJson,
    bannerMode,
    bannerHeight,
    bannerFocalY,
    corporateBannerKey,
    corporateBannerLocked,
    wallpaperUrl,
    isProfilePublic,
  } = user;

  const [connectStatus, setConnectStatus] = useState('idle'); // idle | requested | connected

  const fullName =
    name || [firstName, lastName].filter(Boolean).join(' ') || 'Member';

  const skills = parseArrayField(skillsJson, []);
  const languages = parseArrayField(languagesJson, []);

  const resolvedBannerHeight = bannerHeight || 220;

  let bannerBackgroundImage;

  // Prefer user's wallpaper for a cinematic header, then fall back
  if (wallpaperUrl) {
    bannerBackgroundImage = `url(${wallpaperUrl})`;
  } else if (corporateBannerLocked && corporateBannerKey) {
    bannerBackgroundImage = `url(/corporate-banners/${corporateBannerKey}.png)`;
  } else if (coverUrl) {
    bannerBackgroundImage = `url(${coverUrl})`;
  } else {
    bannerBackgroundImage = 'linear-gradient(135deg, #112033, #455A64)';
  }

  const bannerBackgroundPosition =
    typeof bannerFocalY === 'number' ? `center ${bannerFocalY}%` : 'center';

  const bannerBackgroundSize = bannerMode === 'fit' ? 'contain' : 'cover';

  // Actions
  const handleMessage = () => {
    const params = new URLSearchParams();
    params.set('toId', id);
    params.set('toName', fullName);

    router.push(withChrome(`/seeker/messages?${params.toString()}`));
  };

  const handleConnect = async () => {
    if (connectStatus === 'requested' || connectStatus === 'connected') return;

    try {
      const res = await fetch('/api/contacts/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId: id }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('contacts/request failed:', text);
        alert('We could not send your connection request. Please try again.');
        return;
      }

      const data = await res.json();

      if (data.alreadyConnected) {
        setConnectStatus('connected');
        return;
      }

      if (data.alreadyRequested) {
        setConnectStatus('requested');
        return;
      }

      // Fresh request
      setConnectStatus('requested');
    } catch (err) {
      console.error('contacts/request error:', err);
      alert('We could not send your connection request. Please try again.');
    }
  };

  const HeaderBox = (
    <section
      style={{
        background: 'white',
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        border: '1px solid #eee',
        textAlign: 'center',
      }}
    >
      <h1
        style={{
          margin: 0,
          color: '#FF7043',
          fontSize: 24,
          fontWeight: 800,
        }}
      >
        Member Profile
      </h1>
      <p
        style={{
          margin: '6px auto 0',
          color: '#607D8B',
          maxWidth: 720,
        }}
      >
        View a community member&apos;s profile, resume, and details in a
        read-only view.
      </p>
    </section>
  );

  const RightRail = (
    <div style={{ display: 'grid', gap: 12 }}>
      <SeekerRightColumn variant="contacts" />
    </div>
  );

  return (
    <>
      <Head>
        <title>{fullName} – Member Profile | ForgeTomorrow</title>
        <meta
          name="description"
          content={`View ${fullName}'s member profile on ForgeTomorrow.`}
        />
      </Head>

      <style>{`
        @media (max-width: 640px) {
          .member-banner {
            background-size: contain !important;
            background-position: center !important;
            background-repeat: no-repeat !important;
            width: 100% !important;
          }
        }
      `}</style>

      <SeekerLayout
        title="Member Profile | ForgeTomorrow"
        header={HeaderBox}
        right={RightRail}
        activeNav="contacts"
      >
        <div className="w-full max-w-6xl mx-auto px-4 md:px-6 pb-8 space-y-5">
          {/* Banner */}
          <div
            className="member-banner"
            style={{
              width: '100%',
              height: resolvedBannerHeight,
              backgroundImage: bannerBackgroundImage,
              backgroundSize: bannerBackgroundSize,
              backgroundPosition: bannerBackgroundPosition,
              backgroundRepeat: 'no-repeat',
              borderRadius: 12,
              marginBottom: 16,
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
              flexWrap: 'wrap',
            }}
            aria-label={`Profile header for ${fullName}`}
          >
            <img
              src={avatarUrl || '/demo-profile.jpg'}
              alt={`Profile photo of ${fullName}`}
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
              <h2
                style={{
                  margin: 0,
                  fontSize: 26,
                  fontWeight: 700,
                  color: '#263238',
                }}
              >
                {fullName}
              </h2>

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

              {/* Actions row */}
              <div
                style={{
                  marginTop: 12,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                <button
                  type="button"
                  onClick={handleMessage}
                  style={{
                    background: '#FF7043',
                    color: 'white',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: 999,
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  Message
                </button>
                <button
                  type="button"
                  onClick={handleConnect}
                  style={{
                    background:
                      connectStatus === 'requested' ||
                      connectStatus === 'connected'
                        ? '#FFE0B2'
                        : 'white',
                    color: '#FF7043',
                    border: '1px solid #FF7043',
                    padding: '8px 14px',
                    borderRadius: 999,
                    cursor:
                      connectStatus === 'requested' ||
                      connectStatus === 'connected'
                        ? 'default'
                        : 'pointer',
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  {connectStatus === 'connected'
                    ? 'Connected'
                    : connectStatus === 'requested'
                    ? 'Requested'
                    : 'Connect'}
                </button>
              </div>
            </div>
          </section>

          {/* Non-public profile notice */}
          {!isProfilePublic && (
            <section
              style={{
                marginTop: 8,
                padding: 16,
                borderRadius: 12,
                border: '1px dashed #FFCC80',
                background: '#FFF8E1',
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: '#BF360C',
                }}
              >
                This member has set their public profile to private. Send a
                message or connection request to start a conversation.
              </p>
            </section>
          )}

          {/* About */}
          {aboutMe && (
            <section
              style={{
                marginTop: 8,
                padding: 20,
                borderRadius: 12,
                background: 'white',
                border: '1px solid #e0e0e0',
              }}
            >
              <h3
                style={{
                  margin: '0 0 8px',
                  fontSize: 18,
                  fontWeight: 600,
                  color: '#263238',
                }}
              >
                About
              </h3>
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

          {/* Primary Resume (only if profile is public and slug exists) */}
          {isProfilePublic && primaryResume && slug && (
            <section
              style={{
                marginTop: 8,
                padding: 20,
                borderRadius: 12,
                background: 'white',
                border: '1px solid #e0e0e0',
              }}
            >
              <h3
                style={{
                  margin: '0 0 8px',
                  fontSize: 18,
                  fontWeight: 600,
                  color: '#263238',
                }}
              >
                Primary Resume
              </h3>

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
                  fontWeight: 600,
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
                marginTop: 8,
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
                  <h3
                    style={{
                      margin: '0 0 8px',
                      fontSize: 16,
                      fontWeight: 600,
                      color: '#263238',
                    }}
                  >
                    Skills
                  </h3>
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
                  <h3
                    style={{
                      margin: '0 0 8px',
                      fontSize: 16,
                      fontWeight: 600,
                      color: '#263238',
                    }}
                  >
                    Languages
                  </h3>
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
        </div>
      </SeekerLayout>
    </>
  );
}
