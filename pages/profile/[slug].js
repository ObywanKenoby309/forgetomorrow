// pages/profile/[slug].js  —  ForgeTomorrow Internal Profile
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import authOptions from '../api/auth/[...nextauth]';
import InternalLayout from '@/components/layouts/InternalLayout';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';
import MemberAvatarActions from '@/components/member/MemberAvatarActions';

// ─── Safe parsers ─────────────────────────────────────────────────────────────

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

// ─── Data fetching ────────────────────────────────────────────────────────────

export async function getServerSideProps(context) {
  const { slug } = context.params;
  const session = await getServerSession(context.req, context.res, authOptions);
  const viewerEmail = session?.user?.email ? String(session.user.email) : null;

  const user = await prisma.user.findUnique({
    where: { slug },
    select: {
      id: true, slug: true, name: true, firstName: true, lastName: true,
      headline: true, pronouns: true, location: true, status: true,
      avatarUrl: true, coverUrl: true, aboutMe: true,
      skillsJson: true, languagesJson: true, educationJson: true, hobbiesJson: true,
      bannerMode: true, bannerHeight: true, bannerFocalY: true,
      wallpaperUrl: true, corporateBannerKey: true, corporateBannerLocked: true,
      isProfilePublic: true, profileVisibility: true, role: true, email: true,
      resumes: {
        where: { isPrimary: true },
        orderBy: { updatedAt: 'desc' },
        take: 1,
        select: { id: true, name: true, updatedAt: true },
      },
    },
  });

  if (!user) return { notFound: true };

  const effectiveVisibility =
    user.profileVisibility || (user.isProfilePublic ? 'PUBLIC' : 'PRIVATE');

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
    Boolean(viewerEmail) && Boolean(user.email) &&
    String(user.email).toLowerCase() === String(viewerEmail).toLowerCase();
  const isAdmin = viewerRole === 'ADMIN';
  const isRecruiter = viewerRole === 'RECRUITER';

  const allowed =
    effectiveVisibility === 'PUBLIC' ? true
      : effectiveVisibility === 'RECRUITERS_ONLY' ? isOwner || isAdmin || isRecruiter
        : isOwner || isAdmin;

  if (!allowed) return { notFound: true };

  const { resumes, ...userSafe } = user;
  const primaryResume = resumes?.length > 0 ? resumes[0] : null;

  return {
    props: {
      user: JSON.parse(JSON.stringify(userSafe)),
      primaryResume: primaryResume ? JSON.parse(JSON.stringify(primaryResume)) : null,
      effectiveVisibility,
      viewer: { id: viewerId, role: viewerRole },
    },
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PublicProfile({ user, primaryResume, effectiveVisibility, viewer }) {
  const [mobileTab, setMobileTab] = useState('about');
  const [copied, setCopied] = useState(false);
  const [mobileSkillsReady, setMobileSkillsReady] = useState(false);

  const {
    id: profileUserId,
    name, firstName, lastName, headline, pronouns, location, status,
    avatarUrl, coverUrl, slug, aboutMe,
    skillsJson, languagesJson, educationJson, hobbiesJson,
    bannerMode, bannerHeight, bannerFocalY,
    wallpaperUrl, corporateBannerKey, corporateBannerLocked,
  } = user;

  const isOwnProfile = Boolean(viewer?.id) && Boolean(profileUserId) && String(viewer.id) === String(profileUserId);

  const computedName = String(name || '').trim();
  const computedFirst = String(firstName || '').trim();
  const computedLast = String(lastName || '').trim();
  const fullName =
    computedName ||
    [computedFirst, computedLast].filter(Boolean).join(' ').trim() ||
    'ForgeTomorrow Member';

  const profileUrl = `https://forgetomorrow.com/u/${slug}`;

  const skills = parseArrayField(skillsJson, []);
  const languages = parseArrayField(languagesJson, []);
  const hobbies = parseArrayField(hobbiesJson, []);
  const education = parseEducationField(educationJson, []);

  let bannerImage;
  if (corporateBannerLocked && corporateBannerKey) {
    bannerImage = `url(/corporate-banners/${corporateBannerKey}.png)`;
  } else if (coverUrl) {
    bannerImage = `url(${coverUrl})`;
  } else {
    bannerImage = 'linear-gradient(135deg, #0D1B2A 0%, #1a3048 50%, #0D1B2A 100%)';
  }

  const bannerPos = typeof bannerFocalY === 'number' ? `center ${bannerFocalY}%` : 'center 30%';
  const resolvedBannerHeight = typeof bannerHeight === 'number' ? bannerHeight : 300;

  useEffect(() => {
    if (mobileTab === 'skills') {
      const t = setTimeout(() => setMobileSkillsReady(true), 120);
      return () => clearTimeout(t);
    }
  }, [mobileTab]);

  async function handleCopyProfileUrl() {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(profileUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }
    } catch {
      // no-op
    }
  }

  const AvatarWrap = ({ children }) => {
    if (!profileUserId || isOwnProfile) return children;

    return (
      <MemberAvatarActions
        targetUserId={profileUserId}
        targetName={fullName}
        showMessage
      >
        {children}
      </MemberAvatarActions>
    );
  };

  return (
    <InternalLayout
      title={`${fullName} — ForgeTomorrow`}
      activeNav="profile"
      header={null}
      right={<RightRailPlacementManager />}
      rightVariant="dark"
    >
      <>
        <Head>
          <meta name="description" content={`Professional portfolio of ${fullName} on ForgeTomorrow.`} />
          <meta property="og:title" content={`${fullName} — ForgeTomorrow`} />
          <meta property="og:description" content={headline || `View the professional profile of ${fullName}.`} />
          {avatarUrl && <meta property="og:image" content={avatarUrl} />}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800;900&family=Inter:wght@300;400;500;600;700&family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap"
            rel="stylesheet"
          />
        </Head>

        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

          :root {
            --navy:        #0D1B2A;
            --navy-mid:    #162336;
            --navy-light:  #1E3250;
            --orange:      #FF7043;
            --orange-dim:  rgba(255,112,67,0.18);
            --orange-glow: rgba(255,112,67,0.35);
            --white:       #F8F4EF;
            --muted:       #A8B7C7;
            --border:      rgba(255,255,255,0.14);
            --card-bg:     rgba(13,27,42,0.56);
            --card-bg-hi:  rgba(13,27,42,0.66);
            --blur:        blur(12px);
            --radius-lg:   20px;
            --radius-md:   14px;
            --radius-sm:   10px;
            --shadow-lg:   0 24px 64px rgba(0,0,0,0.42);
            --shadow-md:   0 12px 32px rgba(0,0,0,0.28);
            --shadow-sm:   0 4px 16px rgba(0,0,0,0.20);
            --font-display: 'Playfair Display', Georgia, serif;
            --font-body:    'Inter', system-ui, sans-serif;

            --forge-dark:   #0e0d0c;
            --forge-card:   rgba(22,20,18,0.82);
            --forge-surface: rgba(30,27,24,0.82);
            --forge-border: rgba(255,255,255,0.07);
            --forge-orange: #e8601c;
            --forge-amber:  #f0922b;
            --forge-text:   #f0ece6;
            --forge-muted:  #8a7f74;
            --forge-subtle: #3a3530;
          }

          html, body {
            max-width: 100%;
            overflow-x: hidden;
          }

          body {
            font-family: var(--font-body);
            background: var(--navy);
            color: var(--white);
            -webkit-font-smoothing: antialiased;
          }

          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(20px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.96); }
            to   { opacity: 1; transform: scale(1); }
          }
          @keyframes pulseRing {
            0%   { box-shadow: 0 0 0 0 var(--orange-glow); }
            70%  { box-shadow: 0 0 0 12px rgba(255,112,67,0); }
            100% { box-shadow: 0 0 0 0 rgba(255,112,67,0); }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50%      { transform: translateY(-4px); }
          }
          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }

          .animate-fade-up  { animation: fadeUp 0.6s ease both; }
          .animate-scale-in { animation: scaleIn 0.45s ease both; }
          .delay-1 { animation-delay: 0.08s; }
          .delay-2 { animation-delay: 0.16s; }
          .delay-3 { animation-delay: 0.24s; }
          .delay-4 { animation-delay: 0.32s; }
          .delay-5 { animation-delay: 0.40s; }
          .delay-6 { animation-delay: 0.48s; }

          .ft-page {
            min-height: 100vh;
            width: 100%;
            background-image: ${wallpaperUrl ? `url(${wallpaperUrl})` : 'linear-gradient(135deg, #112033, #1c2a3c)'};
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            background-attachment: fixed;
            position: relative;
            border-radius: 18px;
            overflow: hidden;
          }
          .ft-page-overlay {
            min-height: 100vh;
            background: linear-gradient(
              180deg,
              rgba(17,32,51,0.62) 0%,
              rgba(17,32,51,0.18) 55%,
              rgba(17,32,51,0.30) 100%
            );
            padding: 18px 0 28px;
          }
          .ft-container {
            max-width: 1160px;
            margin: 0 auto;
            padding: 0 28px 40px;
          }

          .ft-banner-wrap {
            position: relative;
            width: 100%;
            overflow: hidden;
            border-radius: 18px;
            border: 1px solid rgba(255,255,255,0.18);
            box-shadow: 0 18px 38px rgba(0,0,0,0.18);
            background: rgba(255,255,255,0.08);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
          }
          .ft-banner-blur {
            position: absolute;
            inset: 0;
            background-size: cover;
            background-position: ${bannerPos};
            background-repeat: no-repeat;
            filter: blur(18px);
            transform: scale(1.10);
            opacity: 0.85;
          }
          .ft-banner-fg {
            position: absolute;
            inset: 0;
            background-size: cover;
            background-position: ${bannerPos};
            background-repeat: no-repeat;
          }
          .ft-banner-vignette {
            position: absolute;
            inset: 0;
            background: linear-gradient(
              180deg,
              rgba(17,32,51,0.55),
              rgba(17,32,51,0.22)
            );
          }

          .ft-identity {
            display: flex;
            gap: 22px;
            align-items: center;
            margin-top: 18px;
            position: relative;
            z-index: 10;
            padding: 18px 20px;
            border: 1px solid rgba(255,255,255,0.18);
            border-radius: 18px;
            background: rgba(13,27,42,0.58);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            box-shadow: var(--shadow-lg);
          }
          .ft-avatar-ring {
            flex-shrink: 0;
            position: relative;
            width: 122px;
            height: 122px;
            border-radius: 50%;
            padding: 3px;
            background: linear-gradient(135deg, var(--orange), #FF8A65, #FF5722);
            box-shadow: 0 0 0 4px rgba(13,27,42,0.85), var(--shadow-lg);
            animation: float 6s ease-in-out infinite;
            cursor: pointer;
          }
          .ft-avatar {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            object-fit: cover;
            background: var(--navy-mid);
            display: block;
          }
          .ft-identity-info {
            flex: 1;
            min-width: 0;
          }
          .ft-name {
            font-family: var(--font-display);
            font-size: clamp(28px, 4vw, 40px);
            font-weight: 700;
            color: var(--white);
            letter-spacing: -0.3px;
            line-height: 1.05;
            text-shadow: 0 2px 12px rgba(0,0,0,0.35);
          }
          .ft-pronouns {
            font-family: var(--font-body);
            font-size: 11px;
            font-weight: 600;
            color: var(--orange);
            letter-spacing: 0.10em;
            text-transform: uppercase;
            margin-top: 6px;
          }
          .ft-headline {
            font-family: var(--font-body);
            font-size: 15px;
            font-weight: 500;
            color: rgba(248,244,239,0.92);
            margin-top: 10px;
            line-height: 1.5;
            max-width: 860px;
          }
          .ft-meta-row {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            margin-top: 12px;
            align-items: center;
          }
          .ft-meta-chip {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            font-family: var(--font-body);
            font-size: 12px;
            font-weight: 500;
            color: rgba(248,244,239,0.86);
            background: rgba(255,255,255,0.08);
            border: 1px solid rgba(255,255,255,0.14);
            border-radius: 999px;
            padding: 5px 11px;
          }
          .ft-meta-chip svg { flex-shrink: 0; }

          .ft-actions-row {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
            margin-top: 14px;
          }
          .ft-url-pill {
            font-family: var(--font-body);
            font-size: 12px;
            font-weight: 500;
            color: rgba(248,244,239,0.70);
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.14);
            border-radius: var(--radius-sm);
            padding: 7px 12px;
            word-break: break-all;
            flex: 1;
            min-width: 220px;
          }
          .ft-copy-btn,
          .ft-resume-top-btn {
            flex-shrink: 0;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 7px;
            border-radius: var(--radius-sm);
            cursor: pointer;
            font-family: var(--font-body);
            font-size: 13px;
            font-weight: 600;
            letter-spacing: 0.02em;
            transition: transform 0.15s, box-shadow 0.15s, background 0.15s, border-color 0.15s;
            text-decoration: none;
            min-height: 38px;
            white-space: nowrap;
            padding: 8px 16px;
          }
          .ft-copy-btn {
            background: var(--orange);
            color: #fff;
            border: none;
            box-shadow: 0 6px 18px rgba(255,112,67,0.38);
          }
          .ft-copy-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 10px 24px rgba(255,112,67,0.5);
            background: #FF8A65;
          }
          .ft-resume-top-btn {
            background: rgba(255,112,67,0.14);
            color: var(--orange);
            border: 1px solid rgba(255,112,67,0.38);
            box-shadow: 0 6px 18px rgba(0,0,0,0.14);
          }
          .ft-resume-top-btn:hover {
            background: rgba(255,112,67,0.24);
            transform: translateY(-1px);
            box-shadow: 0 10px 24px rgba(255,112,67,0.22);
          }
          .ft-copy-btn:active,
          .ft-resume-top-btn:active { transform: scale(0.98); }

          .ft-body {
            display: grid;
            grid-template-columns: 300px minmax(0, 1fr);
            gap: 24px;
            margin-top: 22px;
            align-items: start;
          }
          .ft-sidebar {
            position: sticky;
            top: 24px;
            align-self: start;
          }
          .ft-main-col { min-width: 0; }

          .ft-card {
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            backdrop-filter: var(--blur);
            -webkit-backdrop-filter: var(--blur);
            box-shadow: var(--shadow-md);
            overflow: hidden;
            transition: box-shadow 0.2s, border-color 0.2s, transform 0.2s;
          }
          .ft-card:hover {
            box-shadow: var(--shadow-lg);
            border-color: rgba(255,255,255,0.18);
            transform: translateY(-1px);
          }
          .ft-card + .ft-card { margin-top: 18px; }
          .ft-card-inner { padding: 22px; }

          .ft-section-label {
            display: flex;
            align-items: center;
            gap: 10px;
            font-family: var(--font-body);
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            color: var(--orange);
            margin-bottom: 16px;
          }
          .ft-section-label::after {
            content: '';
            flex: 1;
            height: 1px;
            background: linear-gradient(to right, var(--orange-dim), transparent);
            border-radius: 1px;
          }

          .ft-summary-text {
            font-family: var(--font-body);
            font-size: 15px;
            line-height: 1.9;
            color: rgba(248,244,239,0.88);
            font-weight: 400;
            white-space: pre-line;
          }

          .ft-chips {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }
          .ft-chip {
            font-family: var(--font-body);
            font-size: 12px;
            font-weight: 500;
            padding: 7px 13px;
            border-radius: 999px;
            background: rgba(255,255,255,0.08);
            border: 1px solid rgba(255,255,255,0.12);
            color: rgba(248,244,239,0.88);
            transition: background 0.15s, border-color 0.15s, color 0.15s, transform 0.15s;
            cursor: default;
          }
          .ft-chip:hover {
            background: var(--orange-dim);
            border-color: var(--orange);
            color: var(--orange);
            transform: translateY(-1px);
          }
          .ft-chip-accent {
            background: rgba(255,112,67,0.14);
            border-color: rgba(255,112,67,0.30);
            color: var(--orange);
          }

          .ft-lang-list { list-style: none; }
          .ft-lang-list li {
            display: flex;
            align-items: center;
            gap: 8px;
            font-family: var(--font-body);
            font-size: 13px;
            font-weight: 500;
            color: rgba(248,244,239,0.84);
            padding: 7px 0;
            border-bottom: 1px solid rgba(255,255,255,0.08);
          }
          .ft-lang-list li:last-child { border-bottom: none; }
          .ft-lang-list li::before {
            content: '';
            display: inline-block;
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background: var(--orange);
            flex-shrink: 0;
          }

          .ft-edu-item {
            position: relative;
            padding: 18px 16px 18px 20px;
            border-radius: var(--radius-md);
            background: var(--card-bg-hi);
            border: 1px solid rgba(255,255,255,0.10);
            transition: border-color 0.2s, transform 0.2s;
          }
          .ft-edu-item:hover {
            border-color: rgba(255,112,67,0.28);
            transform: translateY(-1px);
          }
          .ft-edu-item + .ft-edu-item { margin-top: 10px; }
          .ft-edu-school {
            font-family: var(--font-display);
            font-size: 15px;
            font-weight: 700;
            color: var(--white);
          }
          .ft-edu-sub {
            font-family: var(--font-body);
            font-size: 13px;
            color: var(--muted);
            margin-top: 5px;
            font-weight: 500;
          }
          .ft-edu-notes {
            font-family: var(--font-body);
            font-size: 13px;
            color: rgba(248,244,239,0.76);
            margin-top: 9px;
            line-height: 1.7;
            white-space: pre-line;
          }
          .ft-edu-accent-bar {
            position: absolute;
            left: 0;
            top: 16px;
            bottom: 16px;
            width: 3px;
            background: linear-gradient(to bottom, var(--orange), #FF5722);
            border-radius: 0 2px 2px 0;
          }

          .ft-member-badge {
            display: flex;
            align-items: center;
            gap: 12px;
            background: linear-gradient(135deg, rgba(255,112,67,0.18), rgba(255,112,67,0.08));
            border: 1px solid rgba(255,112,67,0.28);
            border-radius: var(--radius-md);
            padding: 14px 16px;
            text-decoration: none;
            box-shadow: var(--shadow-sm);
            transition: border-color 0.2s, background 0.2s;
          }
          .ft-member-badge:hover {
            border-color: rgba(255,112,67,0.45);
            background: rgba(255,112,67,0.20);
          }
          .ft-member-badge-icon {
            width: 36px;
            height: 36px;
            border-radius: 10px;
            background: var(--orange);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            box-shadow: 0 4px 14px rgba(255,112,67,0.4);
          }
          .ft-member-badge-title {
            font-family: var(--font-display);
            font-size: 13px;
            font-weight: 700;
            color: var(--orange);
          }
          .ft-member-badge-sub {
            font-family: var(--font-body);
            font-size: 11px;
            color: var(--muted);
            font-weight: 500;
            margin-top: 2px;
          }

          .ft-visibility-pill {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            font-family: var(--font-body);
            font-size: 11px;
            font-weight: 500;
            color: rgba(248,244,239,0.65);
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.12);
            border-radius: 999px;
            padding: 5px 10px;
            margin-top: 12px;
          }

          .ft-footer {
            margin-top: 40px;
            text-align: center;
            font-family: var(--font-body);
            font-size: 12px;
            color: rgba(248,244,239,0.45);
            font-weight: 400;
            padding-bottom: 12px;
          }
          .ft-footer a {
            color: var(--orange);
            opacity: 0.82;
            text-decoration: none;
            transition: opacity 0.15s;
          }
          .ft-footer a:hover { opacity: 1; }

          .ft-mobile-only { display: none; }
          .ft-desktop-only { display: block; }

          .ft-mobile-shell {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            background: rgba(10,9,8,0.34);
            backdrop-filter: blur(6px);
            -webkit-backdrop-filter: blur(6px);
          }
          .ft-mobile-profile {
            flex: 1;
            display: flex;
            flex-direction: column;
            background: rgba(14,13,12,0.58);
            border: 1px solid rgba(255,255,255,0.07);
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 18px 40px rgba(0,0,0,0.32);
          }
          .ft-mobile-banner {
            width: 100%;
            height: 160px;
            flex-shrink: 0;
            position: relative;
            overflow: hidden;
            background-color: #180800;
          }
          .ft-mobile-banner-bg,
          .ft-mobile-banner-blur {
            position: absolute;
            inset: 0;
            background-image: ${bannerImage};
            background-position: ${bannerPos};
            background-repeat: no-repeat;
          }
          .ft-mobile-banner-blur {
            background-size: cover;
            filter: blur(22px);
            transform: scale(1.08);
            opacity: 0.8;
          }
          .ft-mobile-banner-bg {
            background-size: contain;
          }
          .ft-mobile-banner-overlay {
            position: absolute;
            inset: 0;
            background:
              radial-gradient(ellipse at 75% 35%, rgba(196,74,10,0.55) 0%, transparent 55%),
              radial-gradient(ellipse at 20% 65%, rgba(122,40,0,0.45) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 10%, rgba(232,96,28,0.30) 0%, transparent 40%),
              linear-gradient(to bottom, transparent 40%, rgba(14,13,12,0.96) 100%);
          }
          .ft-mobile-role {
            position: absolute;
            top: 14px;
            right: 14px;
            background: rgba(0,0,0,0.45);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.12);
            border-radius: 20px;
            padding: 4px 11px;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 1.8px;
            color: var(--forge-amber);
            text-transform: uppercase;
            z-index: 2;
          }
          .ft-mobile-identity {
            display: flex;
            align-items: flex-end;
            gap: 14px;
            padding: 0 16px;
            margin-top: -38px;
            position: relative;
            z-index: 2;
            flex-shrink: 0;
          }
          .ft-mobile-avatar {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            border: 3px solid var(--forge-orange);
            background: var(--forge-subtle);
            overflow: hidden;
            flex-shrink: 0;
            box-shadow: 0 6px 24px rgba(232,96,28,0.35);
            cursor: pointer;
          }
          .ft-mobile-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
          }
          .ft-mobile-identity-text {
            flex: 1;
            padding-bottom: 4px;
            min-width: 0;
          }
          .ft-mobile-pronoun {
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 1.8px;
            color: var(--forge-orange);
            text-transform: uppercase;
          }
          .ft-mobile-name {
            font-family: 'Cormorant Garamond', serif;
            font-size: 26px;
            font-weight: 700;
            color: var(--forge-text);
            letter-spacing: -0.5px;
            line-height: 1.1;
          }
          .ft-mobile-sub {
            font-size: 12px;
            color: var(--forge-muted);
            margin-top: 2px;
            line-height: 1.35;
            white-space: normal;
            overflow: visible;
            text-overflow: unset;
            word-break: break-word;
          }
          .ft-mobile-tab-bar {
            display: flex;
            gap: 0;
            margin: 16px 16px 0;
            background: var(--forge-surface);
            border-radius: 12px;
            padding: 3px;
            flex-shrink: 0;
          }
          .ft-mobile-tab-btn {
            flex: 1;
            padding: 8px 4px;
            border: none;
            background: transparent;
            border-radius: 9px;
            font-family: 'DM Sans', sans-serif;
            font-size: 11px;
            font-weight: 600;
            color: var(--forge-muted);
            cursor: pointer;
            transition: all 0.18s;
            letter-spacing: 0.2px;
          }
          .ft-mobile-tab-btn.active {
            background: rgba(22,20,18,0.98);
            color: var(--forge-text);
            box-shadow: 0 1px 4px rgba(0,0,0,0.4);
          }
          .ft-mobile-tab-dot {
            display: inline-block;
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background: transparent;
            margin-right: 4px;
            vertical-align: middle;
            margin-top: -2px;
            transition: background 0.18s;
          }
          .ft-mobile-tab-btn.active .ft-mobile-tab-dot {
            background: var(--forge-orange);
          }

          .ft-mobile-panels {
            flex: 1;
            position: relative;
            overflow: hidden;
            margin-top: 12px;
            min-height: 420px;
          }
          .ft-mobile-panel {
            position: absolute;
            inset: 0;
            overflow-y: auto;
            padding: 0 16px 20px;
            opacity: 0;
            transform: translateX(16px);
            pointer-events: none;
            transition: opacity 0.22s ease, transform 0.22s ease;
            scrollbar-width: none;
            -webkit-overflow-scrolling: touch;
            padding-bottom: 92px;
          }
          .ft-mobile-panel::-webkit-scrollbar { display: none; }
          .ft-mobile-panel.active {
            opacity: 1;
            transform: translateX(0);
            pointer-events: all;
          }

          .ft-mobile-live-badge {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            background: rgba(34,197,94,0.1);
            border: 1px solid rgba(34,197,94,0.22);
            border-radius: 20px;
            padding: 3px 10px;
            font-size: 10px;
            font-weight: 600;
            color: #4ade80;
            margin-bottom: 12px;
          }
          .ft-mobile-live-dot {
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background: #4ade80;
            animation: blink 2s infinite;
          }

          .ft-mobile-stats-row {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            margin-bottom: 10px;
          }
          .ft-mobile-stat {
            background: var(--forge-card);
            border: 1px solid var(--forge-border);
            border-radius: 14px;
            padding: 12px 8px;
            text-align: center;
          }
          .ft-mobile-stat-n {
            font-family: 'Cormorant Garamond', serif;
            font-size: 24px;
            font-weight: 700;
            color: var(--forge-text);
            line-height: 1;
          }
          .ft-mobile-stat-n em {
            color: var(--forge-orange);
            font-style: normal;
            font-size: 15px;
          }
          .ft-mobile-stat-l {
            font-size: 10px;
            color: var(--forge-muted);
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-top: 3px;
            font-weight: 500;
          }

          .ft-mobile-card {
            background: var(--forge-card);
            border: 1px solid var(--forge-border);
            border-radius: 16px;
            padding: 16px;
            margin-bottom: 10px;
          }
          .ft-mobile-card-label {
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: var(--forge-orange);
            margin-bottom: 9px;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .ft-mobile-card-label::after {
            content: '';
            flex: 1;
            height: 1px;
            background: var(--forge-border);
          }
          .ft-mobile-card-text {
            font-size: 13px;
            line-height: 1.75;
            color: rgba(240,236,230,0.78);
            font-weight: 300;
            white-space: pre-line;
          }

          .ft-mobile-skill-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
          }
          .ft-mobile-skill {
            background: var(--forge-card);
            border: 1px solid var(--forge-border);
            border-radius: 12px;
            padding: 12px;
            position: relative;
            overflow: hidden;
            min-height: 64px;
          }
          .ft-mobile-skill-name {
            font-size: 12px;
            font-weight: 600;
            color: var(--forge-text);
            margin-bottom: 2px;
          }
          .ft-mobile-skill-cat {
            font-size: 10px;
            color: var(--forge-muted);
            text-transform: uppercase;
            letter-spacing: 0.7px;
          }
          .ft-mobile-skill-bar {
            position: absolute;
            bottom: 0;
            left: 0;
            height: 2px;
            background: linear-gradient(90deg, var(--forge-orange), var(--forge-amber));
            transition: width 0.9s cubic-bezier(0.23,1,0.32,1);
            border-radius: 0 0 12px 12px;
          }

          .ft-mobile-contact-row {
            display: flex;
            align-items: center;
            gap: 12px;
            width: 100%;
            padding: 13px;
            background: var(--forge-card);
            border: 1px solid var(--forge-border);
            border-radius: 14px;
            margin-bottom: 8px;
            text-decoration: none;
            text-align: left;
            transition: all 0.14s;
          }
          .ft-mobile-contact-row[type="button"] {
            appearance: none;
            -webkit-appearance: none;
            border: 1px solid var(--forge-border);
            background: var(--forge-card);
            font: inherit;
            color: inherit;
          }
          .ft-mobile-contact-row:active {
            transform: scale(0.98);
            background: var(--forge-surface);
          }
          .ft-mobile-contact-icon {
            width: 38px;
            height: 38px;
            border-radius: 11px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            flex-shrink: 0;
          }
          .ft-mobile-contact-copy {
            cursor: pointer;
          }
          .ft-mobile-contact-label {
            font-size: 10px;
            color: var(--forge-muted);
            text-transform: uppercase;
            letter-spacing: 0.8px;
            font-weight: 600;
          }
          .ft-mobile-contact-value {
            font-size: 12px;
            color: var(--forge-text);
            margin-top: 1px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .ft-mobile-contact-arrow {
            color: var(--forge-muted);
            font-size: 16px;
            margin-left: auto;
            flex-shrink: 0;
          }

          .ft-mobile-footer {
            position: absolute;
            left: 16px;
            right: 16px;
            bottom: 16px;
            display: flex;
            gap: 8px;
            z-index: 3;
          }
          .ft-mobile-footer-btn {
            flex: 1;
            background: rgba(30,27,24,0.96);
            border: 1px solid rgba(255,255,255,0.08);
            color: #f0ece6;
            padding: 12px;
            border-radius: 12px;
            font-family: 'DM Sans', sans-serif;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            transition: all 0.15s;
            text-decoration: none;
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
          }
          .ft-mobile-footer-btn.primary {
            background: #e8601c;
            border-color: #e8601c;
            color: white;
          }
          .ft-mobile-footer-btn:active {
            transform: scale(0.97);
          }

          @media (max-width: 900px) {
            .ft-body { grid-template-columns: 1fr; }
            .ft-sidebar { position: static; order: 2; }
            .ft-main-col { order: 1; }
          }

          @media (max-width: 760px) {
            .ft-page {
              background-attachment: scroll;
              border-radius: 16px;
            }
            .ft-page-overlay {
              padding: 10px 0 18px;
              background: linear-gradient(
                180deg,
                rgba(10,9,8,0.24) 0%,
                rgba(10,9,8,0.14) 50%,
                rgba(10,9,8,0.24) 100%
              );
            }
            .ft-container {
              padding: 0 12px 20px;
              max-width: 430px;
            }
            .ft-desktop-only {
              display: none;
            }
            .ft-mobile-only {
              display: block;
            }
            .ft-footer {
              display: none;
            }
          }

          ::-webkit-scrollbar { width: 6px; }
          ::-webkit-scrollbar-track { background: var(--navy); }
          ::-webkit-scrollbar-thumb { background: rgba(255,112,67,0.3); border-radius: 3px; }
          ::-webkit-scrollbar-thumb:hover { background: rgba(255,112,67,0.5); }
        `}</style>

        <div className="ft-page">
          <div className="ft-page-overlay">
            <div className="ft-container">

              <div className="ft-desktop-only">
                {/* ── Banner ── */}
                <div
                  className="ft-banner-wrap animate-scale-in"
                  style={{ height: resolvedBannerHeight }}
                  aria-label="Profile banner"
                >
                  <div
                    className="ft-banner-blur"
                    style={{ backgroundImage: bannerImage }}
                    aria-hidden="true"
                  />
                  <div className="ft-banner-vignette" aria-hidden="true" />
                  <div
                    className="ft-banner-fg"
                    style={{ backgroundImage: bannerImage }}
                  />
                </div>

                {/* ── Identity ── */}
                <div className="ft-identity animate-fade-up delay-1">
                  <AvatarWrap>
                    <div className="ft-avatar-ring">
                      <img
                        className="ft-avatar"
                        src={avatarUrl || '/demo-profile.jpg'}
                        alt={`${fullName} profile photo`}
                      />
                    </div>
                  </AvatarWrap>

                  <div className="ft-identity-info">
                    <h1 className="ft-name">{fullName}</h1>

                    {pronouns && (
                      <p className="ft-pronouns">{pronouns}</p>
                    )}

                    {headline && (
                      <p className="ft-headline">{headline}</p>
                    )}

                    <div className="ft-meta-row">
                      {location && (
                        <span className="ft-meta-chip">
                          <svg width="11" height="13" fill="none" viewBox="0 0 11 13" style={{ opacity: 0.75 }}>
                            <path d="M5.5 0A4.5 4.5 0 001 4.5C1 8.25 5.5 13 5.5 13S10 8.25 10 4.5A4.5 4.5 0 005.5 0zm0 6.25A1.75 1.75 0 113.75 4.5 1.752 1.752 0 015.5 6.25z" fill="currentColor" />
                          </svg>
                          {location}
                        </span>
                      )}
                      {status && (
                        <span
                          className="ft-meta-chip"
                          style={{ color: 'rgba(255,112,67,0.95)', borderColor: 'rgba(255,112,67,0.24)' }}
                        >
                          <span style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: 'var(--orange)', flexShrink: 0, display: 'inline-block',
                          }} />
                          {status}
                        </span>
                      )}
                    </div>

                    <div className="ft-actions-row">
                      <span className="ft-url-pill">{profileUrl}</span>

                      <button
                        className="ft-copy-btn"
                        type="button"
                        onClick={handleCopyProfileUrl}
                        aria-label="Copy profile URL"
                      >
                        <svg width="13" height="13" fill="none" viewBox="0 0 13 13">
                          <rect x="4" y="4" width="8" height="8" rx="1.5" stroke="white" strokeWidth="1.4" />
                          <path d="M3 9H2a1 1 0 01-1-1V2a1 1 0 011-1h6a1 1 0 011 1v1" stroke="white" strokeWidth="1.4" />
                        </svg>
                        {copied ? 'Copied' : 'Copy Link'}
                      </button>

                      {primaryResume && (
                        <a
                          className="ft-resume-top-btn"
                          href={`/api/resume/public-download?resumeId=${encodeURIComponent(primaryResume.id)}&slug=${encodeURIComponent(slug)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <svg width="14" height="14" fill="none" viewBox="0 0 14 14">
                            <path d="M7 1v8M4 7l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Download Resume
                        </a>
                      )}
                    </div>

                    {effectiveVisibility === 'PUBLIC' && (
                      <span className="ft-visibility-pill">
                        <svg width="10" height="10" fill="none" viewBox="0 0 10 10">
                          <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.2" />
                          <path d="M1 5h8M5 1c-1.5 1.2-2 2.5-2 4s.5 2.8 2 4M5 1c1.5 1.2 2 2.5 2 4s-.5 2.8-2 4" stroke="currentColor" strokeWidth="1.2" />
                        </svg>
                        Public profile
                      </span>
                    )}
                  </div>
                </div>

                {/* ── Body ── */}
                <div className="ft-body">

                  {/* ── Sidebar ── */}
                  <aside className="ft-sidebar animate-fade-up delay-2">

                    <a href="https://forgetomorrow.com" className="ft-member-badge" target="_blank" rel="noopener noreferrer">
                      <div className="ft-member-badge-icon">
                        <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
                          <path d="M10 2C8 5 6 6 7 9c.5 1.5 0 2.5-1.5 3C7 14 8 16 10 17c2-1 3-3 4.5-5-.5 0-1-.5-1.5-1.5C14 8.5 13 6 10 2z" fill="white" />
                          <path d="M10 17c0 0 2-2 2-4s-2-2-2-2-2 0-2 2 2 4 2 4z" fill="rgba(255,255,255,0.5)" />
                        </svg>
                      </div>
                      <div>
                        <div className="ft-member-badge-title">ForgeTomorrow</div>
                        <div className="ft-member-badge-sub">Verified Member</div>
                      </div>
                    </a>

                    {skills.length > 0 && (
                      <div className="ft-card" style={{ marginTop: 18 }}>
                        <div className="ft-card-inner">
                          <p className="ft-section-label">Skills</p>
                          <div className="ft-chips">
                            {skills.map((skill, i) => (
                              <span key={skill} className={`ft-chip${i < 3 ? ' ft-chip-accent' : ''}`}>
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {languages.length > 0 && (
                      <div className="ft-card" style={{ marginTop: 18 }}>
                        <div className="ft-card-inner">
                          <p className="ft-section-label">Languages</p>
                          <ul className="ft-lang-list">
                            {languages.map((lang) => (
                              <li key={lang}>{lang}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {hobbies.length > 0 && (
                      <div className="ft-card" style={{ marginTop: 18 }}>
                        <div className="ft-card-inner">
                          <p className="ft-section-label">Interests</p>
                          <div className="ft-chips">
                            {hobbies.map((h) => (
                              <span key={h} className="ft-chip">{h}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                  </aside>

                  {/* ── Main column ── */}
                  <div className="ft-main-col">

                    {aboutMe && (
                      <div className="ft-card animate-fade-up delay-3">
                        <div className="ft-card-inner">
                          <p className="ft-section-label">Professional Summary</p>
                          <p className="ft-summary-text">{aboutMe}</p>
                        </div>
                      </div>
                    )}

                    {education.length > 0 && (
                      <div className="ft-card animate-fade-up delay-5">
                        <div className="ft-card-inner">
                          <p className="ft-section-label">Education</p>
                          <div>
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
                                  className="ft-edu-item"
                                >
                                  <div className="ft-edu-accent-bar" />
                                  <div className="ft-edu-school">{school || 'Education'}</div>
                                  {(line1 || years) && (
                                    <div className="ft-edu-sub">
                                      {line1}{line1 && years ? ' · ' : ''}{years}
                                    </div>
                                  )}
                                  {notes && (
                                    <div className="ft-edu-notes">{notes}</div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              </div>

              {/* ── Mobile only redesign ── */}
              <div className="ft-mobile-only">
                <div className="ft-mobile-shell">
                  <div className="ft-mobile-profile animate-scale-in">
                    <div className="ft-mobile-banner">
                      <div className="ft-mobile-banner-blur" aria-hidden="true" />
                      <div className="ft-mobile-banner-bg" aria-hidden="true" />
                      <div className="ft-mobile-banner-overlay" aria-hidden="true" />
                      {status && (
                        <div className="ft-mobile-role">{status}</div>
                      )}
                    </div>

                    <div className="ft-mobile-identity">
                      <AvatarWrap>
                        <div className="ft-mobile-avatar">
                          <img
                            src={avatarUrl || '/demo-profile.jpg'}
                            alt={`${fullName} profile photo`}
                          />
                        </div>
                      </AvatarWrap>

                      <div className="ft-mobile-identity-text">
                        <div className="ft-mobile-name">{fullName}</div>

                        {pronouns && (
                          <div className="ft-mobile-pronoun">{pronouns}</div>
                        )}

                        <div className="ft-mobile-sub">
                          {headline || location || 'ForgeTomorrow Member'}
                        </div>
                      </div>
                    </div>

                    <div className="ft-mobile-tab-bar">
                      <button
                        type="button"
                        className={`ft-mobile-tab-btn${mobileTab === 'about' ? ' active' : ''}`}
                        onClick={() => setMobileTab('about')}
                      >
                        <span className="ft-mobile-tab-dot" />
                        About
                      </button>
                      <button
                        type="button"
                        className={`ft-mobile-tab-btn${mobileTab === 'skills' ? ' active' : ''}`}
                        onClick={() => setMobileTab('skills')}
                      >
                        <span className="ft-mobile-tab-dot" />
                        Skills
                      </button>
                      <button
                        type="button"
                        className={`ft-mobile-tab-btn${mobileTab === 'education' ? ' active' : ''}`}
                        onClick={() => setMobileTab('education')}
                      >
                        <span className="ft-mobile-tab-dot" />
                        Education
                      </button>
                      <button
                        type="button"
                        className={`ft-mobile-tab-btn${mobileTab === 'more' ? ' active' : ''}`}
                        onClick={() => setMobileTab('more')}
                      >
                        <span className="ft-mobile-tab-dot" />
                        More
                      </button>
                      <button
                        type="button"
                        className={`ft-mobile-tab-btn${mobileTab === 'connect' ? ' active' : ''}`}
                        onClick={() => setMobileTab('connect')}
                      >
                        <span className="ft-mobile-tab-dot" />
                        Connect
                      </button>
                    </div>

                    <div className="ft-mobile-panels">
                      <div className={`ft-mobile-panel${mobileTab === 'about' ? ' active' : ''}`}>
                        {effectiveVisibility === 'PUBLIC' && (
                          <div className="ft-mobile-live-badge">
                            <div className="ft-mobile-live-dot" />
                            Public Profile
                          </div>
                        )}

                        <div className="ft-mobile-stats-row">
                          <div className="ft-mobile-stat">
                            <div className="ft-mobile-stat-n">{skills.length}<em>+</em></div>
                            <div className="ft-mobile-stat-l">Skills</div>
                          </div>
                          <div className="ft-mobile-stat">
                            <div className="ft-mobile-stat-n">{education.length}<em>+</em></div>
                            <div className="ft-mobile-stat-l">Education</div>
                          </div>
                          <div className="ft-mobile-stat">
                            <div className="ft-mobile-stat-n">{languages.length}<em>+</em></div>
                            <div className="ft-mobile-stat-l">Languages</div>
                          </div>
                        </div>

                        {(aboutMe || headline) && (
                          <div className="ft-mobile-card">
                            <div className="ft-mobile-card-label">Summary</div>
                            <div className="ft-mobile-card-text">{aboutMe || headline}</div>
                          </div>
                        )}

                        {(location || status) && (
                          <div className="ft-mobile-card">
                            <div className="ft-mobile-card-label">Details</div>
                            <div className="ft-mobile-card-text">
                              {location ? `Location: ${location}` : ''}
                              {location && status ? '\n' : ''}
                              {status ? `Status: ${status}` : ''}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className={`ft-mobile-panel${mobileTab === 'skills' ? ' active' : ''}`}>
                        {skills.length > 0 ? (
                          <div className="ft-mobile-skill-grid">
                            {skills.map((skill, idx) => {
                              const width = 72 + ((idx * 7) % 24);
                              return (
                                <div key={skill} className="ft-mobile-skill">
                                  <div className="ft-mobile-skill-name">{skill}</div>
                                  <div className="ft-mobile-skill-cat">Capability</div>
                                  <div
                                    className="ft-mobile-skill-bar"
                                    style={{ width: mobileSkillsReady ? `${Math.min(width, 98)}%` : '0%' }}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="ft-mobile-card">
                            <div className="ft-mobile-card-label">Skills</div>
                            <div className="ft-mobile-card-text">No skills added yet.</div>
                          </div>
                        )}
                      </div>

                      <div className={`ft-mobile-panel${mobileTab === 'education' ? ' active' : ''}`}>
                        {education.length > 0 ? (
                          education.map((edu, idx) => {
                            const school = edu?.school || '';
                            const degree = edu?.degree || '';
                            const field = edu?.field || '';
                            const startYear = edu?.startYear || '';
                            const endYear = edu?.endYear || '';
                            const notes = edu?.notes || '';
                            const line1 = [degree, field].filter(Boolean).join(' — ');
                            const years = [startYear, endYear].filter(Boolean).join(' – ');

                            return (
                              <div key={`${school || line1 || 'edu-mobile'}-${idx}`} className="ft-mobile-card">
                                <div className="ft-mobile-card-label">Education</div>
                                <div className="ft-mobile-card-text">
                                  <strong style={{ color: 'var(--forge-text)', fontWeight: 600 }}>{school || 'Education'}</strong>
                                  {(line1 || years) ? `\n${line1}${line1 && years ? ' · ' : ''}${years}` : ''}
                                  {notes ? `\n\n${notes}` : ''}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="ft-mobile-card">
                            <div className="ft-mobile-card-label">Education</div>
                            <div className="ft-mobile-card-text">No education added yet.</div>
                          </div>
                        )}
                      </div>

                      <div className={`ft-mobile-panel${mobileTab === 'more' ? ' active' : ''}`}>
                        {languages.length > 0 && (
                          <div className="ft-mobile-card">
                            <div className="ft-mobile-card-label">Languages</div>
                            <div className="ft-chips">
                              {languages.map((lang) => (
                                <span key={lang} className="ft-chip">{lang}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {hobbies.length > 0 && (
                          <div className="ft-mobile-card">
                            <div className="ft-mobile-card-label">Interests</div>
                            <div className="ft-chips">
                              {hobbies.map((hobby) => (
                                <span key={hobby} className="ft-chip">{hobby}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {languages.length === 0 && hobbies.length === 0 && (
                          <div className="ft-mobile-card">
                            <div className="ft-mobile-card-label">More</div>
                            <div className="ft-mobile-card-text">No additional details added yet.</div>
                          </div>
                        )}
                      </div>

                      <div className={`ft-mobile-panel${mobileTab === 'connect' ? ' active' : ''}`}>
                        <button
                          type="button"
                          className="ft-mobile-contact-row ft-mobile-contact-copy"
                          onClick={handleCopyProfileUrl}
                        >
                          <div
                            className="ft-mobile-contact-icon"
                            style={{ background: 'rgba(232,96,28,0.14)', color: '#e8601c' }}
                          >
                            ⎘
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div className="ft-mobile-contact-label">Profile</div>
                            <div className="ft-mobile-contact-value">{profileUrl.replace('https://', '')}</div>
                          </div>
                          <div className="ft-mobile-contact-arrow">{copied ? '✓' : '›'}</div>
                        </button>

                        {location && (
                          <div className="ft-mobile-contact-row">
                            <div
                              className="ft-mobile-contact-icon"
                              style={{ background: 'rgba(59,130,246,0.14)', color: '#60a5fa' }}
                            >
                              ⌖
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div className="ft-mobile-contact-label">Location</div>
                              <div className="ft-mobile-contact-value">{location}</div>
                            </div>
                            <div className="ft-mobile-contact-arrow">›</div>
                          </div>
                        )}

                        {primaryResume && (
                          <a
                            className="ft-mobile-contact-row"
                            href={`/api/resume/public-download?resumeId=${encodeURIComponent(primaryResume.id)}&slug=${encodeURIComponent(slug)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <div
                              className="ft-mobile-contact-icon"
                              style={{ background: 'rgba(34,197,94,0.14)', color: '#4ade80' }}
                            >
                              ↓
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div className="ft-mobile-contact-label">Resume</div>
                              <div className="ft-mobile-contact-value">Download primary resume</div>
                            </div>
                            <div className="ft-mobile-contact-arrow">›</div>
                          </a>
                        )}
                      </div>

                      <div className="ft-mobile-footer">
                        <button
                          type="button"
                          className="ft-mobile-footer-btn"
                          onClick={handleCopyProfileUrl}
                        >
                          ⎘ {copied ? 'Copied' : 'Copy Link'}
                        </button>

                        {primaryResume && (
                          <a
                            className="ft-mobile-footer-btn primary"
                            href={`/api/resume/public-download?resumeId=${encodeURIComponent(primaryResume.id)}&slug=${encodeURIComponent(slug)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            ↓ Download Resume
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <footer className="ft-footer animate-fade-up delay-6">
                <p>
                  This profile is powered by{' '}
                  <a href="https://forgetomorrow.com" target="_blank" rel="noopener noreferrer">
                    ForgeTomorrow
                  </a>
                  {' '}— The future of careers and networking.
                </p>
              </footer>

            </div>
          </div>
        </div>
      </>
    </InternalLayout>
  );
}