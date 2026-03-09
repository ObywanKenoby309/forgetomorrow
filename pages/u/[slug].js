// pages/u/[slug].js  —  ForgeTomorrow Public Profile v3
import Head from 'next/head';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import authOptions from '../api/auth/[...nextauth]';

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

export default function PublicProfile({ user, primaryResume, effectiveVisibility }) {
  const {
    name, firstName, lastName, headline, pronouns, location, status,
    avatarUrl, coverUrl, slug, aboutMe,
    skillsJson, languagesJson, educationJson, hobbiesJson,
    bannerMode, bannerHeight, bannerFocalY,
    wallpaperUrl, corporateBannerKey, corporateBannerLocked,
  } = user;

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

  return (
    <>
      <Head>
        <title>{fullName} — ForgeTomorrow</title>
        <meta name="description" content={`Professional portfolio of ${fullName} on ForgeTomorrow.`} />
        <meta property="og:title" content={`${fullName} — ForgeTomorrow`} />
        <meta property="og:description" content={headline || `View the professional profile of ${fullName}.`} />
        {avatarUrl && <meta property="og:image" content={avatarUrl} />}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* ✅ CHANGE 1: Playfair Display + Inter */}
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800;900&family=Inter:wght@300;400;500;600;700&display=swap"
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
          /* ✅ CHANGE 2: Professional font stack */
          --font-display: 'Playfair Display', Georgia, serif;
          --font-body:    'Inter', system-ui, sans-serif;
        }

        body {
          font-family: var(--font-body);
          background: var(--navy);
          color: var(--white);
          -webkit-font-smoothing: antialiased;
        }

        /* ── Animations ── */
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

        .animate-fade-up  { animation: fadeUp 0.6s ease both; }
        .animate-scale-in { animation: scaleIn 0.45s ease both; }
        .delay-1 { animation-delay: 0.08s; }
        .delay-2 { animation-delay: 0.16s; }
        .delay-3 { animation-delay: 0.24s; }
        .delay-4 { animation-delay: 0.32s; }
        .delay-5 { animation-delay: 0.40s; }
        .delay-6 { animation-delay: 0.48s; }

        /* ── Layout ── */
        .ft-page {
          min-height: 100vh;
          width: 100%;
          background-image: ${wallpaperUrl ? `url(${wallpaperUrl})` : 'linear-gradient(135deg, #112033, #1c2a3c)'};
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          background-attachment: fixed;
          position: relative;
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

        /* ── Banner ── */
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
        /* ✅ CHANGE 3: cover fills the full card edge-to-edge */
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

        /* ── Identity card ── */
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
        }
        .ft-avatar {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          background: var(--navy-mid);
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

        /* ── Action row ── */
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

        /* ── Body layout ── */
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

        /* ── Cards ── */
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

        /* ── Summary ── */
        .ft-summary-text {
          font-family: var(--font-body);
          font-size: 15px;
          line-height: 1.9;
          color: rgba(248,244,239,0.88);
          font-weight: 400;
          white-space: pre-line;
        }

        /* ── Skills / chips ── */
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

        /* ── Languages ── */
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

        /* ── Education ── */
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

        /* ── FT Member badge ── */
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

        /* ── Visibility pill ── */
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

        /* ── Footer ── */
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

        /* ── Mobile ── */
        @media (max-width: 900px) {
          .ft-body { grid-template-columns: 1fr; }
          .ft-sidebar { position: static; order: 2; }
          .ft-main-col { order: 1; }
        }
        @media (max-width: 760px) {
          .ft-container { padding: 0 16px 36px; }
          .ft-banner-wrap { height: auto !important; aspect-ratio: 16 / 9; }
          .ft-identity {
            flex-direction: column;
            align-items: center;
            text-align: center;
            margin-top: -28px;
            padding: 18px 16px;
          }
          .ft-avatar-ring { width: 104px; height: 104px; }
          .ft-name { font-size: 28px; }
          .ft-headline { font-size: 14px; }
          .ft-meta-row, .ft-actions-row { justify-content: center; }
          .ft-url-pill { min-width: 0; width: 100%; }
        }

        /* ── Scrollbar ── */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: var(--navy); }
        ::-webkit-scrollbar-thumb { background: rgba(255,112,67,0.3); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,112,67,0.5); }
      `}</style>

      <div className="ft-page">
        <div className="ft-page-overlay">
          <div className="ft-container">

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
              <div className="ft-avatar-ring">
                <img
                  className="ft-avatar"
                  src={avatarUrl || '/demo-profile.jpg'}
                  alt={`${fullName} profile photo`}
                />
              </div>

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
                    onClick={() =>
                      typeof navigator !== 'undefined' && navigator.clipboard?.writeText(profileUrl)
                    }
                    aria-label="Copy profile URL"
                  >
                    <svg width="13" height="13" fill="none" viewBox="0 0 13 13">
                      <rect x="4" y="4" width="8" height="8" rx="1.5" stroke="white" strokeWidth="1.4" />
                      <path d="M3 9H2a1 1 0 01-1-1V2a1 1 0 011-1h6a1 1 0 011 1v1" stroke="white" strokeWidth="1.4" />
                    </svg>
                    Copy Link
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
  );
}