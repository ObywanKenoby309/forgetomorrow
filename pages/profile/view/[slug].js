// pages/profile/view/[slug].js  —  ForgeTomorrow Portfolio (View + Inline Edit)
// ─────────────────────────────────────────────────────────────────────────────
// TEMP PATH: /profile/view/[slug]
// Cut over to /profile/[slug] when approach is confirmed.
//
// Architecture:
//   - View mode: identical to /profile/[slug].js for all visitors
//   - Edit mode: owner only, toggled via "Edit Portfolio" button
//   - Inline editing: sections transform in place, no navigation away
//   - Saves: same /api/profile/header + /api/profile/details endpoints
//   - State: hydrated from getServerSideProps data on mount, no extra fetches
// ─────────────────────────────────────────────────────────────────────────────

import Head from 'next/head';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import authOptions from '../../api/auth/[...nextauth]';
import InternalLayout from '@/components/layouts/InternalLayout';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';
import MemberAvatarActions from '@/components/member/MemberAvatarActions';

// ── Edit-mode section components ─────────────────────────────────────────────
import ProfileAbout       from '@/components/profile/ProfileAbout';
import ProfileSkills      from '@/components/profile/ProfileSkills';
import ProfileLanguages   from '@/components/profile/ProfileLanguages';
import ProfilePreferences from '@/components/profile/ProfilePreferences';
import ProfileEducation   from '@/components/profile/ProfileEducation';
import ProfileHobbies     from '@/components/profile/ProfileHobbies';
import ProfileResumeAttach from '@/components/profile/ProfileResumeAttach';

// ── Asset libraries ───────────────────────────────────────────────────────────
import { profileBanners    } from '@/lib/profileBanners';
import { profileWallpapers } from '@/lib/profileWallpapers';

// ─── Constants ────────────────────────────────────────────────────────────────
const ORANGE     = '#FF7043';
const NAVY       = '#0D1B2A';
const SAVE_DELAY = 900;

const PRESET_AVATARS = [
  { label: 'Default',      url: '/profile-avatars/avatar-default-forge.png'      },
  { label: 'Professional', url: '/profile-avatars/avatar-professional-path.png'  },
  { label: 'Creator',      url: '/profile-avatars/avatar-creator-spectrum.png'   },
  { label: 'Tech',         url: '/profile-avatars/avatar-tech-nexus.png'         },
  { label: 'Coach',        url: '/profile-avatars/avatar-coach-beacon.png'       },
];

const SOCIAL_FIELDS = [
  { key: 'github',    label: 'GitHub',    placeholder: 'github.com/username',    icon: '⌥' },
  { key: 'x',         label: 'X',         placeholder: 'x.com/username',         icon: '✕' },
  { key: 'youtube',   label: 'YouTube',   placeholder: 'youtube.com/@channel',   icon: '▶' },
  { key: 'instagram', label: 'Instagram', placeholder: 'instagram.com/username', icon: '◉' },
];

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
  } catch { return fallback; }
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
              school:    item.school || item.institution || item.name || '',
              degree:    item.degree || item.program || '',
              field:     item.field  || item.major    || '',
              startYear: item.startYear || item.start || '',
              endYear:   item.endYear   || item.end   || '',
              notes:     item.notes     || item.details || '',
            };
          }
          return null;
        })
        .filter((x) => x && (x.school || x.degree || x.field || x.notes));
    }
    return fallback;
  } catch { return fallback; }
}

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

// ─── Data fetching ────────────────────────────────────────────────────────────
export async function getServerSideProps(context) {
  const { slug } = context.params;
  const session  = await getServerSession(context.req, context.res, authOptions);
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
      socialLinks: true,
      workPreferences: true,
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
  let viewerId   = null;
  if (viewerEmail) {
    const viewer = await prisma.user.findUnique({
      where: { email: viewerEmail },
      select: { id: true, role: true, email: true },
    });
    viewerRole = viewer?.role || null;
    viewerId   = viewer?.id   || null;
  }

  const isOwner =
    Boolean(viewerEmail) && Boolean(user.email) &&
    String(user.email).toLowerCase() === String(viewerEmail).toLowerCase();
  const isAdmin     = viewerRole === 'ADMIN';
  const isRecruiter = viewerRole === 'RECRUITER';

  const allowed =
    effectiveVisibility === 'PUBLIC'           ? true
    : effectiveVisibility === 'RECRUITERS_ONLY' ? isOwner || isAdmin || isRecruiter
    : isOwner || isAdmin;

  if (!allowed) return { notFound: true };

  const { resumes, ...userSafe } = user;
  const primaryResume = resumes?.length > 0 ? resumes[0] : null;

  return {
    props: {
      user:               JSON.parse(JSON.stringify(userSafe)),
      primaryResume:      primaryResume ? JSON.parse(JSON.stringify(primaryResume)) : null,
      effectiveVisibility,
      viewer:             { id: viewerId, role: viewerRole },
      isOwner,
    },
  };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function PortfolioViewPage({
  user, primaryResume, effectiveVisibility, viewer, isOwner,
}) {
  // ── Edit mode toggle ──────────────────────────────────────────────────────
  const [editMode, setEditMode] = useState(false);

  // ── Mobile ────────────────────────────────────────────────────────────────
  const [mobileTab, setMobileTab] = useState('about');
  const [mobileSkillsReady, setMobileSkillsReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const [siderailsCollapsed, setSiderailsCollapsed] = useState(false);

  // ── Unpack server data ────────────────────────────────────────────────────
  const {
    id: profileUserId,
    slug, name, firstName, lastName,
    avatarUrl:    serverAvatarUrl,
    coverUrl:     serverCoverUrl,
    wallpaperUrl: serverWallpaperUrl,
    headline: serverHeadline, pronouns: serverPronouns,
    location: serverLocation, status:   serverStatus,
    aboutMe:  serverAboutMe,
    skillsJson, languagesJson, educationJson, hobbiesJson,
    bannerMode: serverBannerMode, bannerHeight: serverBannerH,
    bannerFocalY: serverFocalY,
    corporateBannerKey, corporateBannerLocked,
    socialLinks: serverSocialLinks,
    workPreferences: serverWorkPrefs,
  } = user;

  const DEFAULT_WALLPAPER = '/images/profile-fallbacks/profile-default-wallpaper.png';

  // ── Edit state — hydrated from server data ────────────────────────────────
  const [avatarUrl,     setAvatarUrl]     = useState(serverAvatarUrl     || '');
  const [coverUrl,      setCoverUrl]      = useState(serverCoverUrl      || '');
  const [wallpaperUrl,  setWallpaperUrl]  = useState(serverWallpaperUrl  || '');
  const [headline,      setHeadline]      = useState(serverHeadline      || '');
  const [pronouns,      setPronouns]      = useState(serverPronouns      || '');
  const [location,      setLocation]      = useState(serverLocation      || '');
  const [status,        setStatus]        = useState(serverStatus        || '');
  const [aboutMe,       setAboutMe]       = useState(serverAboutMe       || '');
  const [bannerMode,    setBannerMode]    = useState(serverBannerMode === 'fit' ? 'fit' : 'cover');
  const [bannerH,       setBannerH]       = useState(clamp(serverBannerH ?? 300, 80, 400));
  const [focalY,        setFocalY]        = useState(clamp(serverFocalY  ?? 30, 0, 100));
  const [skills,        setSkills]        = useState(parseArrayField(skillsJson,    []));
  const [languages,     setLanguages]     = useState(parseArrayField(languagesJson, []));
  const [hobbies,       setHobbies]       = useState(parseArrayField(hobbiesJson,   []));
  const [education,     setEducation]     = useState(parseEducationField(educationJson, []));
  const [socialLinks,   setSocialLinks]   = useState(
    serverSocialLinks && typeof serverSocialLinks === 'object'
      ? serverSocialLinks
      : { github: '', x: '', youtube: '', instagram: '' }
  );
  const updateSocial = (key, val) => setSocialLinks(prev => ({ ...prev, [key]: val }));

  // Work preferences
  const wp = serverWorkPrefs || {};
  const [prefStatus,    setPrefStatus]    = useState(wp.workStatus || '');
  const [prefWorkType,  setPrefWorkType]  = useState(wp.workType   || '');
  const [prefLocations, setPrefLocations] = useState(Array.isArray(wp.locations) ? wp.locations : []);
  const [prefStart,     setPrefStart]     = useState(wp.startDate  || '');
  const [prefRelocate,  setPrefRelocate]  = useState(
    typeof wp.willingToRelocate === 'boolean' ? (wp.willingToRelocate ? 'Yes' : 'No') : ''
  );

  // Avatar upload
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Banner/wallpaper expand
  const [bannerMoreOpen,    setBannerMoreOpen]    = useState(false);
  const [wallpaperMoreOpen, setWallpaperMoreOpen] = useState(false);

  // Save state
  const [saveState,    setSaveState]    = useState('idle');
  const saveTimerRef = useRef(null);
  const [serverLoaded, setServerLoaded] = useState(true); // already loaded from SSR

  // ── Derived display values ────────────────────────────────────────────────
  const fullName = useMemo(() => {
    const n  = String(name        || '').trim();
    const fn = String(firstName   || '').trim();
    const ln = String(lastName    || '').trim();
    return n || [fn, ln].filter(Boolean).join(' ').trim() || 'ForgeTomorrow Member';
  }, [name, firstName, lastName]);

  const initials = useMemo(() => {
    const parts = fullName.split(/\s+/).filter(Boolean);
    return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || 'FT';
  }, [fullName]);

  const profileUrl      = `https://forgetomorrow.com/u/${slug}`;
  const effectiveWallpaper = wallpaperUrl || DEFAULT_WALLPAPER;

  let bannerImage;
  if (corporateBannerLocked && corporateBannerKey) {
    bannerImage = `url(/corporate-banners/${corporateBannerKey}.png)`;
  } else if (coverUrl) {
    bannerImage = `url(${coverUrl})`;
  } else {
    bannerImage = `linear-gradient(135deg, ${NAVY} 0%, #1a3048 50%, ${NAVY} 100%)`;
  }

  const bannerPos            = `center ${focalY}%`;
  const resolvedBannerHeight = bannerH;

  // ── Mobile skills animation ───────────────────────────────────────────────
  useEffect(() => {
    if (mobileTab === 'skills') {
      const t = setTimeout(() => setMobileSkillsReady(true), 120);
      return () => clearTimeout(t);
    }
    setMobileSkillsReady(false);
  }, [mobileTab]);

  // ── Copy URL ─────────────────────────────────────────────────────────────
  async function handleCopyProfileUrl() {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(profileUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }
    } catch { /* no-op */ }
  }

  // ── Avatar upload ─────────────────────────────────────────────────────────
  const handleAvatarFileChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please choose an image file.');
      e.target.value = '';
      return;
    }
    setAvatarUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const dataUrl = reader.result;
        if (typeof dataUrl !== 'string') throw new Error('Failed to read.');
        setAvatarUrl(dataUrl); // optimistic
        const res  = await fetch('/api/profile/avatar', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatarDataUrl: dataUrl }),
        });
        const json = await res.json();
        if (!res.ok) { alert(json.error || 'Failed to upload.'); setAvatarUrl(serverAvatarUrl || ''); return; }
        setAvatarUrl(json.avatarUrl || '');
      } catch { alert('Something went wrong.'); setAvatarUrl(serverAvatarUrl || ''); }
      finally   { setAvatarUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
    };
    reader.readAsDataURL(file);
  }, [serverAvatarUrl]);

  const handleAvatarRemove = useCallback(async () => {
    const res = await fetch('/api/profile/avatar', { method: 'DELETE' });
    if (!res.ok) { alert('Failed to remove photo.'); return; }
    setAvatarUrl('');
  }, []);

  // ── Debounced save ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!editMode) return;
    if (avatarUrl.startsWith('data:')) return;

    const controller = new AbortController();
    setSaveState('saving');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(async () => {
      try {
        const [hRes, dRes] = await Promise.all([
          fetch('/api/profile/header', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              avatarUrl:    avatarUrl    || null,
              coverUrl:     coverUrl     || null,
              wallpaperUrl: wallpaperUrl || null,
              bannerMode, bannerHeight: bannerH, bannerFocalY: focalY,
              socialLinks,
            }),
            signal: controller.signal,
          }),
          fetch('/api/profile/details', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pronouns, headline, location, status,
              avatarUrl: avatarUrl || null,
              coverUrl:  coverUrl  || null,
              aboutMe:   aboutMe   || '',
              workPreferences: {
                workStatus: prefStatus || '', workType: prefWorkType || '',
                locations:  prefLocations || [], startDate: prefStart || '',
                willingToRelocate:
                  prefRelocate === 'Yes' ? true :
                  prefRelocate === 'No'  ? false : null,
              },
              skillsJson:    skills    || [],
              languagesJson: languages || [],
              hobbiesJson:   hobbies   || [],
              educationJson: education || [],
            }),
            signal: controller.signal,
          }),
        ]);

        if (hRes.ok && dRes.ok) {
          setSaveState('saved');
          setTimeout(() => setSaveState('idle'), 2500);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('profileHeaderUpdated', {
              detail: { wallpaperUrl: wallpaperUrl || null },
            }));
          }
        } else {
          setSaveState('error');
        }
      } catch (err) {
        if (err?.name === 'AbortError') return;
        setSaveState('error');
      }
    }, SAVE_DELAY);

    return () => {
      controller.abort();
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [
    editMode, avatarUrl, coverUrl, wallpaperUrl, bannerMode, bannerH, focalY,
    socialLinks, pronouns, headline, location, status, aboutMe,
    prefStatus, prefWorkType, prefLocations, prefStart, prefRelocate,
    skills, languages, hobbies, education,
  ]);

  // ── AvatarWrap — for non-owners on view mode ──────────────────────────────
  const AvatarWrap = ({ children }) => {
    if (!profileUserId || isOwner) return children;
    return (
      <MemberAvatarActions
        targetUserId={profileUserId} targetUserSlug={slug}
        targetName={fullName} showMessage>
        {children}
      </MemberAvatarActions>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <InternalLayout
      title={`${fullName} — ForgeTomorrow`}
      activeNav="profile"
      header={null}
      right={!editMode ? <RightRailPlacementManager /> : null}
      rightVariant="dark"
      backgroundOverrideUrl={effectiveWallpaper}
      collapseSiderails={siderailsCollapsed}
      onToggleSiderails={() => setSiderailsCollapsed(s => !s)}
    >
      <>
        <Head>
          <meta name="description"        content={`Professional portfolio of ${fullName} on ForgeTomorrow.`} />
          <meta property="og:title"       content={`${fullName} — ForgeTomorrow`} />
          <meta property="og:description" content={headline || `View the professional portfolio of ${fullName}.`} />
          {avatarUrl && <meta property="og:image" content={avatarUrl} />}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800;900&family=Inter:wght@300;400;500;600;700&family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap"
            rel="stylesheet"
          />
        </Head>

        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

          :root {
            --navy:        #0D1B2A;
            --navy-mid:    #162336;
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
            --forge-card:   rgba(22,20,18,0.82);
            --forge-surface: rgba(30,27,24,0.82);
            --forge-border: rgba(255,255,255,0.07);
            --forge-orange: #e8601c;
            --forge-amber:  #f0922b;
            --forge-text:   #f0ece6;
            --forge-muted:  #8a7f74;
            --forge-subtle: #3a3530;
          }

          html, body { max-width: 100%; overflow-x: hidden; }
          body { font-family: var(--font-body); background: var(--navy); color: var(--white); -webkit-font-smoothing: antialiased; }

          @keyframes fadeUp   { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes scaleIn  { from { opacity: 0; transform: scale(0.96); }     to { opacity: 1; transform: scale(1); }     }
          @keyframes float    { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
          @keyframes blink    { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
          @keyframes pulseDot { 0%,100% { box-shadow: 0 0 0 0 rgba(255,112,67,0.5); } 70% { box-shadow: 0 0 0 8px rgba(255,112,67,0); } }

          .animate-fade-up  { animation: fadeUp  0.6s  ease both; }
          .animate-scale-in { animation: scaleIn 0.45s ease both; }
          .delay-1 { animation-delay: 0.08s; } .delay-2 { animation-delay: 0.16s; }
          .delay-3 { animation-delay: 0.24s; } .delay-4 { animation-delay: 0.32s; }
          .delay-5 { animation-delay: 0.40s; } .delay-6 { animation-delay: 0.48s; }

          /* ── Page shell ── */
          .ft-page { min-height: 100vh; width: 100%; position: relative; border-radius: 18px; overflow: hidden; }
          .ft-page-overlay {
            min-height: 100vh;
            background: linear-gradient(180deg, rgba(17,32,51,0.62) 0%, rgba(17,32,51,0.18) 55%, rgba(17,32,51,0.30) 100%);
            padding: 18px 0 28px;
          }
          .ft-container { max-width: 1160px; margin: 0 auto; padding: 0 28px 40px; }

          /* ── Edit mode overlay ── */
          .ft-edit-mode .ft-page-overlay {
            background: linear-gradient(180deg, rgba(17,32,51,0.72) 0%, rgba(17,32,51,0.35) 55%, rgba(17,32,51,0.50) 100%);
          }

          /* ── Edit mode toolbar ── */
          .ft-edit-toolbar {
            position: sticky; top: 0; z-index: 50;
            display: flex; align-items: center; justify-content: space-between;
            padding: 10px 16px;
            background: rgba(13,27,42,0.82);
            backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
            border-bottom: 1px solid rgba(255,255,255,0.12);
            margin-bottom: 18px;
            gap: 12px; flex-wrap: wrap;
          }
          .ft-edit-toolbar-left { display: flex; align-items: center; gap: 10px; }
          .ft-edit-pill {
            display: inline-flex; align-items: center; gap: 6px;
            padding: 5px 12px; border-radius: 999px;
            background: rgba(255,112,67,0.18); border: 1px solid rgba(255,112,67,0.40);
            font-size: 11px; font-weight: 700; color: ${ORANGE}; letter-spacing: 0.04em;
          }
          .ft-edit-pill-dot {
            width: 6px; height: 6px; border-radius: 50%; background: ${ORANGE};
            animation: pulseDot 2s infinite;
          }
          .ft-save-status {
            display: flex; align-items: center; gap: 6px;
            font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.55);
          }
          .ft-save-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
          .ft-done-btn {
            padding: 8px 20px; border-radius: 999px;
            background: ${ORANGE}; border: none; color: white;
            font-size: 13px; font-weight: 700; cursor: pointer;
            font-family: inherit; transition: background 0.15s, transform 0.1s;
            box-shadow: 0 4px 14px rgba(255,112,67,0.40);
          }
          .ft-done-btn:hover  { background: #FF8A65; }
          .ft-done-btn:active { transform: scale(0.97); }

          /* ── Banner ── */
          .ft-banner-wrap {
            position: relative; width: 100%; overflow: hidden; border-radius: 18px;
            border: 1px solid rgba(255,255,255,0.18);
            box-shadow: 0 18px 38px rgba(0,0,0,0.18);
            background: rgba(255,255,255,0.08);
            backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
          }
          .ft-banner-blur {
            position: absolute; inset: 0; background-size: cover;
            background-position: ${bannerPos}; background-repeat: no-repeat;
            filter: blur(18px); transform: scale(1.10); opacity: 0.85;
          }
          .ft-banner-fg {
            position: absolute; inset: 0; background-size: cover;
            background-position: ${bannerPos}; background-repeat: no-repeat;
          }
          .ft-banner-vignette {
            position: absolute; inset: 0;
            background: linear-gradient(180deg, rgba(17,32,51,0.55), rgba(17,32,51,0.22));
          }

          /* ── Edit banner overlay ── */
          .ft-banner-edit-overlay {
            position: absolute; inset: 0; z-index: 10;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            gap: 10px; opacity: 0; transition: opacity 0.2s;
            background: rgba(13,27,42,0.55);
            cursor: pointer;
          }
          .ft-banner-wrap:hover .ft-banner-edit-overlay { opacity: 1; }
          .ft-banner-edit-btn {
            padding: 8px 18px; border-radius: 999px;
            background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.30);
            color: white; font-size: 13px; font-weight: 700; cursor: pointer;
            font-family: inherit; backdrop-filter: blur(8px);
            transition: background 0.15s;
          }
          .ft-banner-edit-btn:hover { background: rgba(255,255,255,0.25); }

          /* ── Banner edit panel ── */
          .ft-banner-panel {
            background: rgba(13,27,42,0.90); border: 1px solid rgba(255,255,255,0.14);
            border-radius: 14px; padding: 16px; margin-top: 10px;
            backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
          }
          .ft-panel-label {
            font-size: 10px; font-weight: 800; letter-spacing: 0.14em;
            text-transform: uppercase; color: ${ORANGE};
            margin-bottom: 12px; display: flex; align-items: center; gap: 8px;
          }
          .ft-panel-label::after {
            content: ''; flex: 1; height: 1px;
            background: linear-gradient(to right, rgba(255,112,67,0.30), transparent);
          }
          .ft-asset-rail {
            display: flex; gap: 8px; align-items: center;
            overflow-x: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch;
            padding-bottom: 4px;
          }
          .ft-asset-rail::-webkit-scrollbar { display: none; }
          .ft-asset-chip {
            border-radius: 999px; padding: 2px; border: 2px solid rgba(255,255,255,0.15);
            background: rgba(255,255,255,0.08); cursor: pointer; flex-shrink: 0;
            transition: border-color 0.15s;
          }
          .ft-asset-chip.selected { border-color: ${ORANGE}; }
          .ft-asset-chip img { width: 64px; height: 32px; border-radius: 999px; object-fit: cover; display: block; }
          .ft-asset-none {
            padding: 5px 12px; border-radius: 999px; flex-shrink: 0;
            border: 1px solid rgba(255,255,255,0.20); background: rgba(255,255,255,0.08);
            color: rgba(255,255,255,0.70); font-size: 12px; font-weight: 600;
            cursor: pointer; font-family: inherit; white-space: nowrap;
            transition: background 0.15s;
          }
          .ft-asset-none.selected { border-color: ${ORANGE}; color: ${ORANGE}; }
          .ft-asset-none:hover:not(.selected) { background: rgba(255,255,255,0.14); }
          .ft-slider-row { display: grid; gap: 6px; margin-top: 12px; }
          .ft-slider-label { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.60); }
          .ft-slider { width: 100%; accent-color: ${ORANGE}; }

          /* ── Identity ── */
          .ft-identity {
            display: flex; gap: 22px; align-items: center; margin-top: 18px;
            position: relative; z-index: 10; padding: 18px 20px;
            border: 1px solid rgba(255,255,255,0.18); border-radius: 18px;
            background: rgba(13,27,42,0.58);
            backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
            box-shadow: var(--shadow-lg);
            transition: border-color 0.2s;
          }
          .ft-identity.editing { border-color: rgba(255,112,67,0.35); }

          .ft-avatar-ring {
            flex-shrink: 0; position: relative; width: 122px; height: 122px;
            border-radius: 50%; padding: 3px;
            background: linear-gradient(135deg, var(--orange), #FF8A65, #FF5722);
            box-shadow: 0 0 0 4px rgba(13,27,42,0.85), var(--shadow-lg);
            animation: float 6s ease-in-out infinite;
          }
          .ft-avatar {
            width: 100%; height: 100%; border-radius: 50%; object-fit: cover;
            background: var(--navy-mid); display: block;
          }
          .ft-avatar-edit-overlay {
            position: absolute; inset: 0; border-radius: 50%;
            background: rgba(13,27,42,0.65);
            display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;
            opacity: 0; transition: opacity 0.2s; cursor: pointer; z-index: 2;
          }
          .ft-avatar-ring:hover .ft-avatar-edit-overlay { opacity: 1; }
          .ft-avatar-edit-overlay span { font-size: 10px; font-weight: 700; color: white; }

          .ft-identity-info { flex: 1; min-width: 0; }

          /* ── Inline editable fields ── */
          .ft-inline-field {
            position: relative; cursor: text;
            transition: background 0.15s; border-radius: 6px;
          }
          .ft-inline-field:hover::after {
            content: '✎';
            position: absolute; right: -18px; top: 50%; transform: translateY(-50%);
            font-size: 11px; color: rgba(255,112,67,0.70); pointer-events: none;
          }
          .ft-inline-input {
            background: rgba(255,255,255,0.10) !important;
            border: 1px solid rgba(255,112,67,0.45) !important;
            border-radius: 6px !important; outline: none !important;
            color: inherit !important; font: inherit !important;
            width: 100% !important; padding: 4px 8px !important;
            box-shadow: 0 0 0 3px rgba(255,112,67,0.12) !important;
          }
          .ft-inline-textarea {
            background: rgba(255,255,255,0.10) !important;
            border: 1px solid rgba(255,112,67,0.45) !important;
            border-radius: 8px !important; outline: none !important;
            color: rgba(248,244,239,0.88) !important;
            font-family: var(--font-body) !important; font-size: 15px !important;
            line-height: 1.9 !important; width: 100% !important;
            padding: 8px 12px !important; resize: vertical !important;
            box-shadow: 0 0 0 3px rgba(255,112,67,0.12) !important;
            min-height: 120px !important;
          }

          .ft-name { font-family: var(--font-display); font-size: clamp(28px, 4vw, 40px); font-weight: 700; color: var(--white); letter-spacing: -0.3px; line-height: 1.05; text-shadow: 0 2px 12px rgba(0,0,0,0.35); }
          .ft-pronouns { font-size: 11px; font-weight: 600; color: var(--orange); letter-spacing: 0.10em; text-transform: uppercase; margin-top: 6px; }
          .ft-headline { font-size: 15px; font-weight: 500; color: rgba(248,244,239,0.92); margin-top: 10px; line-height: 1.5; max-width: 860px; }
          .ft-meta-row { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 12px; align-items: center; }
          .ft-meta-chip { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 500; color: rgba(248,244,239,0.86); background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.14); border-radius: 999px; padding: 5px 11px; }
          .ft-actions-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 14px; }
          .ft-url-pill { font-size: 12px; font-weight: 500; color: rgba(248,244,239,0.70); background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.14); border-radius: var(--radius-sm); padding: 7px 12px; word-break: break-all; flex: 1; min-width: 220px; }
          .ft-copy-btn, .ft-resume-top-btn, .ft-edit-portfolio-btn {
            flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; gap: 7px;
            border-radius: var(--radius-sm); cursor: pointer; font-family: var(--font-body);
            font-size: 13px; font-weight: 600; letter-spacing: 0.02em;
            transition: transform 0.15s, box-shadow 0.15s, background 0.15s;
            text-decoration: none; min-height: 38px; white-space: nowrap; padding: 8px 16px;
          }
          .ft-copy-btn { background: var(--orange); color: #fff; border: none; box-shadow: 0 6px 18px rgba(255,112,67,0.38); }
          .ft-copy-btn:hover { transform: translateY(-1px); box-shadow: 0 10px 24px rgba(255,112,67,0.5); background: #FF8A65; }
          .ft-resume-top-btn, .ft-edit-portfolio-btn {
            background: rgba(255,112,67,0.14); color: var(--orange);
            border: 1px solid rgba(255,112,67,0.38); box-shadow: 0 6px 18px rgba(0,0,0,0.14);
          }
          .ft-resume-top-btn:hover, .ft-edit-portfolio-btn:hover { background: rgba(255,112,67,0.24); transform: translateY(-1px); }
          .ft-copy-btn:active, .ft-resume-top-btn:active, .ft-edit-portfolio-btn:active { transform: scale(0.98); }
          .ft-visibility-pill { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 500; color: rgba(248,244,239,0.65); background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 999px; padding: 5px 10px; margin-top: 12px; }

          /* ── Body layout ── */
          .ft-body { display: grid; grid-template-columns: 300px minmax(0, 1fr); gap: 24px; margin-top: 22px; align-items: start; }
          .ft-sidebar { position: sticky; top: 24px; align-self: start; }
          .ft-main-col { min-width: 0; }

          /* ── Cards ── */
          .ft-card {
            background: var(--card-bg); border: 1px solid var(--border);
            border-radius: var(--radius-lg); backdrop-filter: var(--blur);
            -webkit-backdrop-filter: var(--blur); box-shadow: var(--shadow-md);
            overflow: hidden; transition: box-shadow 0.2s, border-color 0.2s, transform 0.2s;
          }
          .ft-card:hover { box-shadow: var(--shadow-lg); border-color: rgba(255,255,255,0.18); transform: translateY(-1px); }
          .ft-card.editing { border-color: rgba(255,112,67,0.30); }
          .ft-card + .ft-card { margin-top: 18px; }
          .ft-card-inner { padding: 22px; }
          .ft-card-edit-body { padding: 16px 22px 22px; border-top: 1px solid rgba(255,255,255,0.08); }

          .ft-section-label { display: flex; align-items: center; gap: 10px; font-size: 10px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: var(--orange); margin-bottom: 16px; }
          .ft-section-label::after { content: ''; flex: 1; height: 1px; background: linear-gradient(to right, var(--orange-dim), transparent); border-radius: 1px; }

          .ft-summary-text { font-size: 15px; line-height: 1.9; color: rgba(248,244,239,0.88); font-weight: 400; white-space: pre-line; }
          .ft-chips { display: flex; flex-wrap: wrap; gap: 8px; }
          .ft-chip { font-size: 12px; font-weight: 500; padding: 7px 13px; border-radius: 999px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); color: rgba(248,244,239,0.88); transition: background 0.15s, border-color 0.15s, color 0.15s, transform 0.15s; cursor: default; }
          .ft-chip:hover { background: var(--orange-dim); border-color: var(--orange); color: var(--orange); transform: translateY(-1px); }
          .ft-chip-accent { background: rgba(255,112,67,0.14); border-color: rgba(255,112,67,0.30); color: var(--orange); }
          .ft-lang-list { list-style: none; }
          .ft-lang-list li { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; color: rgba(248,244,239,0.84); padding: 7px 0; border-bottom: 1px solid rgba(255,255,255,0.08); }
          .ft-lang-list li:last-child { border-bottom: none; }
          .ft-lang-list li::before { content: ''; display: inline-block; width: 5px; height: 5px; border-radius: 50%; background: var(--orange); flex-shrink: 0; }
          .ft-edu-item { position: relative; padding: 18px 16px 18px 20px; border-radius: var(--radius-md); background: var(--card-bg-hi); border: 1px solid rgba(255,255,255,0.10); transition: border-color 0.2s, transform 0.2s; }
          .ft-edu-item:hover { border-color: rgba(255,112,67,0.28); transform: translateY(-1px); }
          .ft-edu-item + .ft-edu-item { margin-top: 10px; }
          .ft-edu-school { font-family: var(--font-display); font-size: 15px; font-weight: 700; color: var(--white); }
          .ft-edu-sub { font-size: 13px; color: var(--muted); margin-top: 5px; font-weight: 500; }
          .ft-edu-notes { font-size: 13px; color: rgba(248,244,239,0.76); margin-top: 9px; line-height: 1.7; white-space: pre-line; }
          .ft-edu-accent-bar { position: absolute; left: 0; top: 16px; bottom: 16px; width: 3px; background: linear-gradient(to bottom, var(--orange), #FF5722); border-radius: 0 2px 2px 0; }

          /* ── Edit section inputs ── */
          .ft-edit-input {
            background: rgba(255,255,255,0.08) !important; border: 1px solid rgba(255,255,255,0.18) !important;
            border-radius: 8px !important; color: var(--white) !important;
            font-family: var(--font-body) !important; font-size: 14px !important;
            outline: none !important; padding: 8px 12px !important; width: 100% !important;
            box-sizing: border-box !important; transition: border-color 0.15s !important;
          }
          .ft-edit-input:focus { border-color: rgba(255,112,67,0.55) !important; box-shadow: 0 0 0 3px rgba(255,112,67,0.12) !important; }
          .ft-edit-input::placeholder { color: rgba(255,255,255,0.30) !important; }

          /* Child component override in edit mode */
          .ft-edit-section input[type="text"],
          .ft-edit-section input[type="url"],
          .ft-edit-section input[type="number"],
          .ft-edit-section textarea,
          .ft-edit-section select {
            background: rgba(255,255,255,0.08) !important;
            border: 1px solid rgba(255,255,255,0.18) !important;
            color: #F0ECE6 !important; border-radius: 8px !important;
          }
          .ft-edit-section input:focus,
          .ft-edit-section textarea:focus,
          .ft-edit-section select:focus {
            border-color: rgba(255,112,67,0.55) !important;
            box-shadow: 0 0 0 3px rgba(255,112,67,0.12) !important;
            outline: none !important;
          }
          .ft-edit-section label,
          .ft-edit-section p,
          .ft-edit-section span { color: rgba(255,255,255,0.70); }
          .ft-edit-section button { font-family: inherit; }

          /* ── Member badge ── */
          .ft-member-badge { display: flex; align-items: center; gap: 12px; background: linear-gradient(135deg, rgba(255,112,67,0.18), rgba(255,112,67,0.08)); border: 1px solid rgba(255,112,67,0.28); border-radius: var(--radius-md); padding: 14px 16px; text-decoration: none; box-shadow: var(--shadow-sm); transition: border-color 0.2s, background 0.2s; }
          .ft-member-badge:hover { border-color: rgba(255,112,67,0.45); background: rgba(255,112,67,0.20); }
          .ft-member-badge-icon { width: 36px; height: 36px; border-radius: 10px; background: var(--orange); display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 4px 14px rgba(255,112,67,0.4); }
          .ft-member-badge-title { font-family: var(--font-display); font-size: 13px; font-weight: 700; color: var(--orange); }
          .ft-member-badge-sub { font-size: 11px; color: var(--muted); font-weight: 500; margin-top: 2px; }

          /* ── Footer ── */
          .ft-footer { margin-top: 40px; text-align: center; font-size: 12px; color: rgba(248,244,239,0.45); padding-bottom: 12px; }
          .ft-footer a { color: var(--orange); opacity: 0.82; text-decoration: none; transition: opacity 0.15s; }
          .ft-footer a:hover { opacity: 1; }

          /* ── Avatar edit panel ── */
          .ft-avatar-panel {
            position: absolute; top: calc(100% + 12px); left: 0; z-index: 20;
            background: rgba(13,27,42,0.95); border: 1px solid rgba(255,255,255,0.14);
            border-radius: 14px; padding: 16px; width: 320px; max-width: 90vw;
            backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
            box-shadow: 0 24px 48px rgba(0,0,0,0.50);
          }
          .ft-avatar-row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
          .ft-avatar-option {
            border-radius: 50%; padding: 2px; border: 2px solid transparent;
            background: transparent; cursor: pointer; transition: border-color 0.15s; flex-shrink: 0;
          }
          .ft-avatar-option.selected { border-color: ${ORANGE}; }
          .ft-avatar-option img { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; display: block; }
          .ft-avatar-action {
            width: 44px; height: 44px; border-radius: 50%; display: flex; flex-direction: column;
            align-items: center; justify-content: center; gap: 1px; cursor: pointer;
            flex-shrink: 0; font-family: inherit; transition: all 0.15s;
          }
          .ft-avatar-action .ai { font-size: 14px; line-height: 1; }
          .ft-avatar-action .al { font-size: 8px; font-weight: 800; }

          /* ── Social links in edit mode ── */
          .ft-social-grid { display: grid; gap: 10px; }
          .ft-social-row { display: flex; align-items: center; gap: 10px; }
          .ft-social-icon { font-size: 14px; width: 20px; text-align: center; flex-shrink: 0; opacity: 0.70; }

          /* ── Visibility pills ── */
          .ft-vis-group { display: flex; gap: 8px; flex-wrap: wrap; }
          .ft-vis-pill {
            padding: 6px 14px; border-radius: 999px;
            border: 1px solid rgba(255,255,255,0.20); background: rgba(255,255,255,0.08);
            color: rgba(255,255,255,0.65); font-size: 12px; font-weight: 700;
            cursor: pointer; transition: all 0.15s; font-family: inherit;
          }
          .ft-vis-pill.active { background: ${ORANGE}; border-color: ${ORANGE}; color: white; }
          .ft-vis-pill:hover:not(.active) { background: rgba(255,255,255,0.14); color: white; }

          /* ── Mobile ── */
          .ft-mobile-only  { display: none; }
          .ft-desktop-only { display: block; }

          .ft-mobile-shell { min-height: 100vh; display: flex; flex-direction: column; background: rgba(10,9,8,0.34); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); }
          .ft-mobile-profile { flex: 1; display: flex; flex-direction: column; background: rgba(14,13,12,0.58); border: 1px solid rgba(255,255,255,0.07); border-radius: 20px; overflow: hidden; box-shadow: 0 18px 40px rgba(0,0,0,0.32); }
          .ft-mobile-banner { width: 100%; height: 160px; flex-shrink: 0; position: relative; overflow: hidden; background-color: #180800; }
          .ft-mobile-banner-bg, .ft-mobile-banner-blur { position: absolute; inset: 0; background-image: ${bannerImage}; background-position: ${bannerPos}; background-repeat: no-repeat; }
          .ft-mobile-banner-blur { background-size: cover; filter: blur(22px); transform: scale(1.08); opacity: 0.8; }
          .ft-mobile-banner-bg  { background-size: contain; }
          .ft-mobile-banner-overlay { position: absolute; inset: 0; background: radial-gradient(ellipse at 75% 35%, rgba(196,74,10,0.55) 0%, transparent 55%), radial-gradient(ellipse at 20% 65%, rgba(122,40,0,0.45) 0%, transparent 50%), linear-gradient(to bottom, transparent 40%, rgba(14,13,12,0.96) 100%); }
          .ft-mobile-role { position: absolute; top: 14px; right: 14px; background: rgba(0,0,0,0.45); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.12); border-radius: 20px; padding: 4px 11px; font-size: 10px; font-weight: 700; letter-spacing: 1.8px; color: var(--forge-amber); text-transform: uppercase; z-index: 2; }
          .ft-mobile-identity { display: flex; align-items: flex-end; gap: 14px; padding: 0 16px; margin-top: -38px; position: relative; z-index: 2; flex-shrink: 0; }
          .ft-mobile-avatar { width: 80px; height: 80px; border-radius: 50%; border: 3px solid var(--forge-orange); background: var(--forge-subtle); overflow: hidden; flex-shrink: 0; box-shadow: 0 6px 24px rgba(232,96,28,0.35); cursor: pointer; }
          .ft-mobile-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
          .ft-mobile-identity-text { flex: 1; padding-bottom: 4px; min-width: 0; }
          .ft-mobile-pronoun { font-size: 9px; font-weight: 700; letter-spacing: 1.8px; color: var(--forge-orange); text-transform: uppercase; }
          .ft-mobile-name { font-family: 'Cormorant Garamond', serif; font-size: 26px; font-weight: 700; color: var(--forge-text); letter-spacing: -0.5px; line-height: 1.1; }
          .ft-mobile-sub { font-size: 12px; color: var(--forge-muted); margin-top: 2px; line-height: 1.35; white-space: normal; word-break: break-word; }
          .ft-mobile-tab-bar { display: flex; margin: 16px 16px 0; background: var(--forge-surface); border-radius: 12px; padding: 3px; flex-shrink: 0; }
          .ft-mobile-tab-btn { flex: 1; padding: 8px 4px; border: none; background: transparent; border-radius: 9px; font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 600; color: var(--forge-muted); cursor: pointer; transition: all 0.18s; }
          .ft-mobile-tab-btn.active { background: rgba(22,20,18,0.98); color: var(--forge-text); box-shadow: 0 1px 4px rgba(0,0,0,0.4); }
          .ft-mobile-tab-dot { display: inline-block; width: 4px; height: 4px; border-radius: 50%; background: transparent; margin-right: 4px; vertical-align: middle; margin-top: -2px; transition: background 0.18s; }
          .ft-mobile-tab-btn.active .ft-mobile-tab-dot { background: var(--forge-orange); }
          .ft-mobile-panels { flex: 1; position: relative; overflow: hidden; margin-top: 12px; min-height: 420px; }
          .ft-mobile-panel { position: absolute; inset: 0; overflow-y: auto; padding: 0 16px 92px; opacity: 0; transform: translateX(16px); pointer-events: none; transition: opacity 0.22s ease, transform 0.22s ease; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
          .ft-mobile-panel::-webkit-scrollbar { display: none; }
          .ft-mobile-panel.active { opacity: 1; transform: translateX(0); pointer-events: all; }
          .ft-mobile-live-badge { display: inline-flex; align-items: center; gap: 5px; background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.22); border-radius: 20px; padding: 3px 10px; font-size: 10px; font-weight: 600; color: #4ade80; margin-bottom: 12px; }
          .ft-mobile-live-dot { width: 5px; height: 5px; border-radius: 50%; background: #4ade80; animation: blink 2s infinite; }
          .ft-mobile-stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 10px; }
          .ft-mobile-stat { background: var(--forge-card); border: 1px solid var(--forge-border); border-radius: 14px; padding: 12px 8px; text-align: center; }
          .ft-mobile-stat-n { font-family: 'Cormorant Garamond', serif; font-size: 24px; font-weight: 700; color: var(--forge-text); line-height: 1; }
          .ft-mobile-stat-n em { color: var(--forge-orange); font-style: normal; font-size: 15px; }
          .ft-mobile-stat-l { font-size: 10px; color: var(--forge-muted); text-transform: uppercase; letter-spacing: 0.8px; margin-top: 3px; font-weight: 500; }
          .ft-mobile-card { background: var(--forge-card); border: 1px solid var(--forge-border); border-radius: 16px; padding: 16px; margin-bottom: 10px; }
          .ft-mobile-card-label { font-size: 9px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--forge-orange); margin-bottom: 9px; display: flex; align-items: center; gap: 6px; }
          .ft-mobile-card-label::after { content: ''; flex: 1; height: 1px; background: var(--forge-border); }
          .ft-mobile-card-text { font-size: 13px; line-height: 1.75; color: rgba(240,236,230,0.78); font-weight: 300; white-space: pre-line; }
          .ft-mobile-skill-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
          .ft-mobile-skill { background: var(--forge-card); border: 1px solid var(--forge-border); border-radius: 12px; padding: 12px; position: relative; overflow: hidden; min-height: 64px; }
          .ft-mobile-skill-name { font-size: 12px; font-weight: 600; color: var(--forge-text); margin-bottom: 2px; }
          .ft-mobile-skill-cat { font-size: 10px; color: var(--forge-muted); text-transform: uppercase; letter-spacing: 0.7px; }
          .ft-mobile-skill-bar { position: absolute; bottom: 0; left: 0; height: 2px; background: linear-gradient(90deg, var(--forge-orange), var(--forge-amber)); transition: width 0.9s cubic-bezier(0.23,1,0.32,1); border-radius: 0 0 12px 12px; }
          .ft-mobile-contact-row { display: flex; align-items: center; gap: 12px; width: 100%; padding: 13px; background: var(--forge-card); border: 1px solid var(--forge-border); border-radius: 14px; margin-bottom: 8px; text-decoration: none; text-align: left; transition: all 0.14s; }
          .ft-mobile-contact-row[type="button"] { appearance: none; -webkit-appearance: none; font: inherit; color: inherit; }
          .ft-mobile-contact-row:active { transform: scale(0.98); background: var(--forge-surface); }
          .ft-mobile-contact-icon { width: 38px; height: 38px; border-radius: 11px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
          .ft-mobile-contact-label { font-size: 10px; color: var(--forge-muted); text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600; }
          .ft-mobile-contact-value { font-size: 12px; color: var(--forge-text); margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .ft-mobile-contact-arrow { color: var(--forge-muted); font-size: 16px; margin-left: auto; flex-shrink: 0; }
          .ft-mobile-footer { position: absolute; left: 16px; right: 16px; bottom: 16px; display: flex; gap: 8px; z-index: 3; }
          .ft-mobile-footer-btn { flex: 1; background: rgba(30,27,24,0.96); border: 1px solid rgba(255,255,255,0.08); color: #f0ece6; padding: 12px; border-radius: 12px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.15s; text-decoration: none; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
          .ft-mobile-footer-btn.primary { background: #e8601c; border-color: #e8601c; color: white; }
          .ft-mobile-footer-btn:active { transform: scale(0.97); }

          @media (max-width: 900px) { .ft-body { grid-template-columns: 1fr; } .ft-sidebar { position: static; order: 2; } .ft-main-col { order: 1; } }
          @media (max-width: 760px) {
            .ft-page { background-attachment: scroll; border-radius: 16px; }
            .ft-page-overlay { padding: 10px 0 18px; background: linear-gradient(180deg, rgba(10,9,8,0.24) 0%, rgba(10,9,8,0.14) 50%, rgba(10,9,8,0.24) 100%); }
            .ft-container { padding: 0 12px 20px; max-width: 430px; }
            .ft-desktop-only { display: none; }
            .ft-mobile-only  { display: block; }
            .ft-footer { display: none; }
          }

          ::-webkit-scrollbar { width: 6px; }
          ::-webkit-scrollbar-track { background: var(--navy); }
          ::-webkit-scrollbar-thumb { background: rgba(255,112,67,0.3); border-radius: 3px; }
          ::-webkit-scrollbar-thumb:hover { background: rgba(255,112,67,0.5); }
        `}</style>

        <div className={`ft-page${editMode ? ' ft-edit-mode' : ''}`}>
          <div className="ft-page-overlay">
            <div className="ft-container">

              {/* ══════════════════════════════════════════════════════════════
                  DESKTOP
              ══════════════════════════════════════════════════════════════ */}
              <div className="ft-desktop-only">

                {/* Edit mode toolbar */}
                {editMode && (
                  <div className="ft-edit-toolbar">
                    <div className="ft-edit-toolbar-left">
                      <div className="ft-edit-pill">
                        <span className="ft-edit-pill-dot" />
                        Editing portfolio
                      </div>
                      <SaveStatusIndicator state={saveState} />
                    </div>
                    <button type="button" className="ft-done-btn"
                      onClick={() => setEditMode(false)}>
                      Done editing
                    </button>
                  </div>
                )}

                {/* ── Banner ── */}
                <BannerSection
                  editMode={editMode}
                  bannerImage={bannerImage} bannerPos={bannerPos}
                  resolvedBannerHeight={resolvedBannerHeight}
                  coverUrl={coverUrl} setCoverUrl={setCoverUrl}
                  wallpaperUrl={wallpaperUrl} setWallpaperUrl={setWallpaperUrl}
                  bannerMode={bannerMode} setBannerMode={setBannerMode}
                  bannerH={bannerH} setBannerH={setBannerH}
                  focalY={focalY} setFocalY={setFocalY}
                  bannerMoreOpen={bannerMoreOpen} setBannerMoreOpen={setBannerMoreOpen}
                  wallpaperMoreOpen={wallpaperMoreOpen} setWallpaperMoreOpen={setWallpaperMoreOpen}
                />

                {/* ── Identity ── */}
                <IdentitySection
                  editMode={editMode}
                  avatarUrl={avatarUrl} avatarUploading={avatarUploading}
                  initials={initials} fullName={fullName}
                  pronouns={pronouns} setPronouns={setPronouns}
                  headline={headline} setHeadline={setHeadline}
                  location={location} setLocation={setLocation}
                  status={status} setStatus={setStatus}
                  slug={slug} profileUrl={profileUrl}
                  copied={copied} handleCopyProfileUrl={handleCopyProfileUrl}
                  primaryResume={primaryResume}
                  effectiveVisibility={effectiveVisibility}
                  isOwner={isOwner}
                  onEditClick={() => setEditMode(true)}
                  fileInputRef={fileInputRef}
                  handleAvatarFileChange={handleAvatarFileChange}
                  handleAvatarRemove={handleAvatarRemove}
                  setAvatarUrl={setAvatarUrl}
                  AvatarWrap={AvatarWrap}
                  socialLinks={socialLinks} updateSocial={updateSocial}
                />

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

                    {/* Skills sidebar card */}
                    <SidebarCard
                      label="Skills" editMode={editMode}
                      viewContent={
                        skills.length > 0 ? (
                          <div className="ft-chips">
                            {skills.map((s, i) => (
                              <span key={s} className={`ft-chip${i < 3 ? ' ft-chip-accent' : ''}`}>{s}</span>
                            ))}
                          </div>
                        ) : null
                      }
                      editContent={
                        <div className="ft-edit-section">
                          <ProfileSkills skills={skills} setSkills={setSkills} />
                        </div>
                      }
                    />

                    {/* Languages sidebar card */}
                    <SidebarCard
                      label="Languages" editMode={editMode}
                      viewContent={
                        languages.length > 0 ? (
                          <ul className="ft-lang-list">
                            {languages.map(l => <li key={l}>{l}</li>)}
                          </ul>
                        ) : null
                      }
                      editContent={
                        <div className="ft-edit-section">
                          <ProfileLanguages languages={languages} setLanguages={setLanguages} />
                        </div>
                      }
                    />

                    {/* Hobbies sidebar card */}
                    <SidebarCard
                      label="Interests" editMode={editMode}
                      viewContent={
                        hobbies.length > 0 ? (
                          <div className="ft-chips">
                            {hobbies.map(h => <span key={h} className="ft-chip">{h}</span>)}
                          </div>
                        ) : null
                      }
                      editContent={
                        <div className="ft-edit-section">
                          <ProfileHobbies hobbies={hobbies} setHobbies={setHobbies} />
                        </div>
                      }
                    />

                    {/* Work preferences — edit only */}
                    {editMode && (
                      <div className="ft-card editing" style={{ marginTop: 18 }}>
                        <div className="ft-card-inner">
                          <p className="ft-section-label">Work preferences</p>
                          <div className="ft-edit-section">
                            <ProfilePreferences
                              prefStatus={prefStatus}       setPrefStatus={setPrefStatus}
                              prefWorkType={prefWorkType}   setPrefWorkType={setPrefWorkType}
                              prefRelocate={prefRelocate}   setPrefRelocate={setPrefRelocate}
                              prefLocations={prefLocations} setPrefLocations={setPrefLocations}
                              prefStart={prefStart}         setPrefStart={setPrefStart}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </aside>

                  {/* ── Main column ── */}
                  <div className="ft-main-col">

                    {/* About / Summary */}
                    <MainCard
                      label="Professional Summary" editMode={editMode}
                      animClass="animate-fade-up delay-3"
                      viewContent={
                        aboutMe ? <p className="ft-summary-text">{aboutMe}</p> : null
                      }
                      editContent={
                        <div className="ft-edit-section">
                          <ProfileAbout about={aboutMe} setAbout={setAboutMe} />
                        </div>
                      }
                    />

                    {/* Education */}
                    <MainCard
                      label="Education" editMode={editMode}
                      animClass="animate-fade-up delay-5"
                      viewContent={
                        education.length > 0 ? (
                          <div>
                            {education.map((edu, idx) => {
                              const school = edu?.school || '';
                              const line1  = [edu?.degree, edu?.field].filter(Boolean).join(' — ');
                              const years  = [edu?.startYear, edu?.endYear].filter(Boolean).join(' – ');
                              return (
                                <div key={`${school}-${idx}`} className="ft-edu-item">
                                  <div className="ft-edu-accent-bar" />
                                  <div className="ft-edu-school">{school || 'Education'}</div>
                                  {(line1 || years) && (
                                    <div className="ft-edu-sub">
                                      {line1}{line1 && years ? ' · ' : ''}{years}
                                    </div>
                                  )}
                                  {edu?.notes && <div className="ft-edu-notes">{edu.notes}</div>}
                                </div>
                              );
                            })}
                          </div>
                        ) : null
                      }
                      editContent={
                        <div className="ft-edit-section">
                          <ProfileEducation education={education} setEducation={setEducation} />
                        </div>
                      }
                    />

                    {/* Resume — edit only */}
                    {editMode && (
                      <div className="ft-card editing animate-fade-up">
                        <div className="ft-card-inner">
                          <p className="ft-section-label">Resume</p>
                          <div className="ft-edit-section">
                            <ProfileResumeAttach withChrome={p => p} />
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                </div>

              </div>
              {/* end desktop */}

              {/* ══════════════════════════════════════════════════════════════
                  MOBILE — view only for now, edit via link to /profile/edit
              ══════════════════════════════════════════════════════════════ */}
              <div className="ft-mobile-only">
                <div className="ft-mobile-shell">
                  <div className="ft-mobile-profile animate-scale-in">
                    <div className="ft-mobile-banner">
                      <div className="ft-mobile-banner-blur" aria-hidden="true" />
                      <div className="ft-mobile-banner-bg"  aria-hidden="true" />
                      <div className="ft-mobile-banner-overlay" aria-hidden="true" />
                      {status && <div className="ft-mobile-role">{status}</div>}
                    </div>

                    <div className="ft-mobile-identity">
                      <AvatarWrap>
                        <div className="ft-mobile-avatar">
                          <img src={avatarUrl || '/demo-profile.jpg'} alt={`${fullName} portfolio photo`} />
                        </div>
                      </AvatarWrap>
                      <div className="ft-mobile-identity-text">
                        <div className="ft-mobile-name">{fullName}</div>
                        {pronouns && <div className="ft-mobile-pronoun">{pronouns}</div>}
                        <div className="ft-mobile-sub">{headline || location || 'ForgeTomorrow Member'}</div>
                      </div>
                    </div>

                    <div className="ft-mobile-tab-bar">
                      {['about','skills','education','more','connect'].map(tab => (
                        <button key={tab} type="button"
                          className={`ft-mobile-tab-btn${mobileTab === tab ? ' active' : ''}`}
                          onClick={() => setMobileTab(tab)}>
                          <span className="ft-mobile-tab-dot" />
                          {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                      ))}
                    </div>

                    <div className="ft-mobile-panels">

                      {/* About panel */}
                      <div className={`ft-mobile-panel${mobileTab === 'about' ? ' active' : ''}`}>
                        {effectiveVisibility === 'PUBLIC' && (
                          <div className="ft-mobile-live-badge">
                            <div className="ft-mobile-live-dot" />
                            Public Portfolio
                          </div>
                        )}
                        <div className="ft-mobile-stats-row">
                          <div className="ft-mobile-stat"><div className="ft-mobile-stat-n">{skills.length}<em>+</em></div><div className="ft-mobile-stat-l">Skills</div></div>
                          <div className="ft-mobile-stat"><div className="ft-mobile-stat-n">{education.length}<em>+</em></div><div className="ft-mobile-stat-l">Education</div></div>
                          <div className="ft-mobile-stat"><div className="ft-mobile-stat-n">{languages.length}<em>+</em></div><div className="ft-mobile-stat-l">Languages</div></div>
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
                              {location ? `Location: ${location}` : ''}{location && status ? '\n' : ''}{status ? `Status: ${status}` : ''}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Skills panel */}
                      <div className={`ft-mobile-panel${mobileTab === 'skills' ? ' active' : ''}`}>
                        {skills.length > 0 ? (
                          <div className="ft-mobile-skill-grid">
                            {skills.map((skill, idx) => {
                              const width = 72 + ((idx * 7) % 24);
                              return (
                                <div key={skill} className="ft-mobile-skill">
                                  <div className="ft-mobile-skill-name">{skill}</div>
                                  <div className="ft-mobile-skill-cat">Capability</div>
                                  <div className="ft-mobile-skill-bar" style={{ width: mobileSkillsReady ? `${Math.min(width, 98)}%` : '0%' }} />
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="ft-mobile-card"><div className="ft-mobile-card-label">Skills</div><div className="ft-mobile-card-text">No skills added yet.</div></div>
                        )}
                      </div>

                      {/* Education panel */}
                      <div className={`ft-mobile-panel${mobileTab === 'education' ? ' active' : ''}`}>
                        {education.length > 0 ? education.map((edu, idx) => {
                          const school = edu?.school || '';
                          const line1  = [edu?.degree, edu?.field].filter(Boolean).join(' — ');
                          const years  = [edu?.startYear, edu?.endYear].filter(Boolean).join(' – ');
                          return (
                            <div key={`${school}-${idx}`} className="ft-mobile-card">
                              <div className="ft-mobile-card-label">Education</div>
                              <div className="ft-mobile-card-text">
                                <strong style={{ color: 'var(--forge-text)', fontWeight: 600 }}>{school || 'Education'}</strong>
                                {(line1 || years) ? `\n${line1}${line1 && years ? ' · ' : ''}${years}` : ''}
                                {edu?.notes ? `\n\n${edu.notes}` : ''}
                              </div>
                            </div>
                          );
                        }) : (
                          <div className="ft-mobile-card"><div className="ft-mobile-card-label">Education</div><div className="ft-mobile-card-text">No education added yet.</div></div>
                        )}
                      </div>

                      {/* More panel */}
                      <div className={`ft-mobile-panel${mobileTab === 'more' ? ' active' : ''}`}>
                        {languages.length > 0 && (
                          <div className="ft-mobile-card">
                            <div className="ft-mobile-card-label">Languages</div>
                            <div className="ft-chips">{languages.map(l => <span key={l} className="ft-chip">{l}</span>)}</div>
                          </div>
                        )}
                        {hobbies.length > 0 && (
                          <div className="ft-mobile-card">
                            <div className="ft-mobile-card-label">Interests</div>
                            <div className="ft-chips">{hobbies.map(h => <span key={h} className="ft-chip">{h}</span>)}</div>
                          </div>
                        )}
                        {languages.length === 0 && hobbies.length === 0 && (
                          <div className="ft-mobile-card"><div className="ft-mobile-card-label">More</div><div className="ft-mobile-card-text">No additional details added yet.</div></div>
                        )}
                      </div>

                      {/* Connect panel */}
                      <div className={`ft-mobile-panel${mobileTab === 'connect' ? ' active' : ''}`}>
                        <button type="button" className="ft-mobile-contact-row" onClick={handleCopyProfileUrl}>
                          <div className="ft-mobile-contact-icon" style={{ background: 'rgba(232,96,28,0.14)', color: '#e8601c' }}>⎘</div>
                          <div style={{ minWidth: 0 }}>
                            <div className="ft-mobile-contact-label">Portfolio</div>
                            <div className="ft-mobile-contact-value">{profileUrl.replace('https://', '')}</div>
                          </div>
                          <div className="ft-mobile-contact-arrow">{copied ? '✓' : '›'}</div>
                        </button>
                        {location && (
                          <div className="ft-mobile-contact-row">
                            <div className="ft-mobile-contact-icon" style={{ background: 'rgba(59,130,246,0.14)', color: '#60a5fa' }}>⌖</div>
                            <div style={{ minWidth: 0 }}>
                              <div className="ft-mobile-contact-label">Location</div>
                              <div className="ft-mobile-contact-value">{location}</div>
                            </div>
                            <div className="ft-mobile-contact-arrow">›</div>
                          </div>
                        )}
                        {primaryResume && (
                          <a className="ft-mobile-contact-row"
                            href={`/api/resume/public-download?resumeId=${encodeURIComponent(primaryResume.id)}&slug=${encodeURIComponent(slug)}`}
                            target="_blank" rel="noopener noreferrer">
                            <div className="ft-mobile-contact-icon" style={{ background: 'rgba(34,197,94,0.14)', color: '#4ade80' }}>↓</div>
                            <div style={{ minWidth: 0 }}>
                              <div className="ft-mobile-contact-label">Resume</div>
                              <div className="ft-mobile-contact-value">Download primary resume</div>
                            </div>
                            <div className="ft-mobile-contact-arrow">›</div>
                          </a>
                        )}
                      </div>

                      {/* Mobile footer */}
                      <div className="ft-mobile-footer">
                        <button type="button" className="ft-mobile-footer-btn" onClick={handleCopyProfileUrl}>
                          ⎘ {copied ? 'Copied' : 'Copy Link'}
                        </button>
                        {isOwner ? (
                          <Link href="/profile/edit" className="ft-mobile-footer-btn primary">
                            ✎ Edit Portfolio
                          </Link>
                        ) : primaryResume ? (
                          <a className="ft-mobile-footer-btn primary"
                            href={`/api/resume/public-download?resumeId=${encodeURIComponent(primaryResume.id)}&slug=${encodeURIComponent(slug)}`}
                            target="_blank" rel="noopener noreferrer">
                            ↓ Download Resume
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* end mobile */}

              <footer className="ft-footer animate-fade-up delay-6">
                <p>
                  This portfolio is powered by{' '}
                  <a href="https://forgetomorrow.com" target="_blank" rel="noopener noreferrer">ForgeTomorrow</a>
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

// ─────────────────────────────────────────────────────────────────────────────
// BannerSection — handles view + edit inline
// ─────────────────────────────────────────────────────────────────────────────
function BannerSection({
  editMode, bannerImage, bannerPos, resolvedBannerHeight,
  coverUrl, setCoverUrl, wallpaperUrl, setWallpaperUrl,
  bannerMode, setBannerMode, bannerH, setBannerH,
  focalY, setFocalY, bannerMoreOpen, setBannerMoreOpen,
  wallpaperMoreOpen, setWallpaperMoreOpen,
}) {
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => { if (!editMode) setShowPanel(false); }, [editMode]);

  return (
    <div>
      <div className="ft-banner-wrap animate-scale-in" style={{ height: resolvedBannerHeight }} aria-label="Portfolio banner">
        <div className="ft-banner-blur" style={{ backgroundImage: bannerImage }} aria-hidden="true" />
        <div className="ft-banner-vignette" aria-hidden="true" />
        <div className="ft-banner-fg" style={{ backgroundImage: bannerImage }} />
        {editMode && (
          <div className="ft-banner-edit-overlay" onClick={() => setShowPanel(v => !v)}>
            <button type="button" className="ft-banner-edit-btn">
              {showPanel ? 'Close banner options' : '✎ Change banner'}
            </button>
          </div>
        )}
      </div>

      {/* Banner + wallpaper edit panel */}
      {editMode && showPanel && (
        <div className="ft-banner-panel">
          <div className="ft-panel-label">Portfolio banner</div>
          <div className="ft-asset-rail" style={{ marginBottom: 12 }}>
            <button type="button" className={`ft-asset-none${!coverUrl ? ' selected' : ''}`} onClick={() => setCoverUrl('')}>None</button>
            {profileBanners.map(b => (
              <button key={b.key} type="button" className={`ft-asset-chip${coverUrl === b.src ? ' selected' : ''}`} onClick={() => setCoverUrl(b.src)}>
                <img src={b.src} alt={b.name} />
              </button>
            ))}
          </div>

          {coverUrl && (
            <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.60)' }}>Mode</span>
                {['cover','fit'].map(m => (
                  <button key={m} type="button" onClick={() => setBannerMode(m)}
                    style={{ padding: '4px 12px', borderRadius: 999, fontFamily: 'inherit',
                      border: `1px solid ${bannerMode === m ? ORANGE : 'rgba(255,255,255,0.20)'}`,
                      background: bannerMode === m ? 'rgba(255,112,67,0.18)' : 'rgba(255,255,255,0.08)',
                      color: bannerMode === m ? ORANGE : 'rgba(255,255,255,0.60)',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize' }}>
                    {m}
                  </button>
                ))}
              </div>
              <div className="ft-slider-row">
                <div className="ft-slider-label">Height — {bannerH}px</div>
                <input type="range" min={80} max={400} value={bannerH} className="ft-slider" onChange={e => setBannerH(Number(e.target.value))} />
              </div>
              {bannerMode === 'cover' && (
                <div className="ft-slider-row">
                  <div className="ft-slider-label">Vertical focus — {focalY}%</div>
                  <input type="range" min={0} max={100} value={focalY} className="ft-slider" onChange={e => setFocalY(Number(e.target.value))} />
                </div>
              )}
            </div>
          )}

          <div className="ft-panel-label">Page wallpaper</div>
          <div className="ft-asset-rail">
            <button type="button" className={`ft-asset-none${!wallpaperUrl ? ' selected' : ''}`} onClick={() => setWallpaperUrl('')}>Default</button>
            {profileWallpapers.map(w => (
              <button key={w.key} type="button" className={`ft-asset-chip${wallpaperUrl === w.src ? ' selected' : ''}`} onClick={() => setWallpaperUrl(w.src)}>
                <img src={w.src} alt={w.name} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// IdentitySection — name, headline, pronouns, location, status + avatar
// ─────────────────────────────────────────────────────────────────────────────
function IdentitySection({
  editMode, avatarUrl, avatarUploading, initials, fullName,
  pronouns, setPronouns, headline, setHeadline,
  location, setLocation, status, setStatus,
  slug, profileUrl, copied, handleCopyProfileUrl,
  primaryResume, effectiveVisibility, isOwner,
  onEditClick, fileInputRef, handleAvatarFileChange,
  handleAvatarRemove, setAvatarUrl, AvatarWrap,
  socialLinks, updateSocial,
}) {
  const [showAvatarPanel, setShowAvatarPanel] = useState(false);

  useEffect(() => { if (!editMode) setShowAvatarPanel(false); }, [editMode]);

  return (
    <div className={`ft-identity animate-fade-up delay-1${editMode ? ' editing' : ''}`}>

      {/* Avatar */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        {editMode ? (
          <div className="ft-avatar-ring" style={{ cursor: 'pointer' }} onClick={() => setShowAvatarPanel(v => !v)}>
            {avatarUrl ? (
              <img className="ft-avatar" src={avatarUrl} alt="Portfolio photo" />
            ) : (
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', display: 'grid', placeItems: 'center', background: `linear-gradient(135deg, ${ORANGE}, #F4511E)`, color: '#fff', fontWeight: 900, fontSize: 28 }}>{initials}</div>
            )}
            <div className="ft-avatar-edit-overlay">
              <span style={{ fontSize: 20 }}>↑</span>
              <span>Change photo</span>
            </div>
          </div>
        ) : (
          <AvatarWrap>
            <div className="ft-avatar-ring">
              {avatarUrl ? (
                <img className="ft-avatar" src={avatarUrl || '/demo-profile.jpg'} alt={`${fullName} portfolio photo`} />
              ) : (
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', display: 'grid', placeItems: 'center', background: `linear-gradient(135deg, ${ORANGE}, #F4511E)`, color: '#fff', fontWeight: 900, fontSize: 28 }}>{initials}</div>
              )}
            </div>
          </AvatarWrap>
        )}

        {/* Avatar panel */}
        {editMode && showAvatarPanel && (
          <div className="ft-avatar-panel">
            <div className="ft-panel-label">Portfolio photo</div>
            <div className="ft-avatar-row">
              <button type="button" className="ft-avatar-action"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                style={{ border: '2px dashed rgba(255,112,67,0.55)', background: 'rgba(255,112,67,0.08)', color: ORANGE }}>
                <span className="ai">{avatarUploading ? '◌' : '↑'}</span>
                <span className="al">Upload</span>
              </button>
              {PRESET_AVATARS.map(opt => (
                <button key={opt.url} type="button" className={`ft-avatar-option${avatarUrl === opt.url ? ' selected' : ''}`}
                  onClick={() => { setAvatarUrl(opt.url); setShowAvatarPanel(false); }}>
                  <img src={opt.url} alt={opt.label} />
                </button>
              ))}
              {avatarUrl && (
                <button type="button" className="ft-avatar-action"
                  onClick={() => { handleAvatarRemove(); setShowAvatarPanel(false); }}
                  style={{ border: '2px solid rgba(211,47,47,0.35)', background: 'rgba(211,47,47,0.08)', color: '#EF9A9A' }}>
                  <span className="ai">✕</span>
                  <span className="al">Remove</span>
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarFileChange} />
            </div>
          </div>
        )}
      </div>

      {/* Identity info */}
      <div className="ft-identity-info">
        <h1 className="ft-name">{fullName}</h1>

        {/* Pronouns */}
        {editMode ? (
          <div style={{ marginTop: 6 }}>
            <input className="ft-inline-input" value={pronouns}
              onChange={e => setPronouns(e.target.value)}
              placeholder="Pronouns (e.g. they/them)"
              style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.10em', textTransform: 'uppercase' }} />
          </div>
        ) : pronouns ? (
          <p className="ft-pronouns">{pronouns}</p>
        ) : null}

        {/* Headline */}
        {editMode ? (
          <div style={{ marginTop: 10 }}>
            <input className="ft-inline-input" value={headline}
              onChange={e => setHeadline(e.target.value)}
              placeholder="Your headline — role, company, mission"
              maxLength={160}
              style={{ fontSize: 15, fontWeight: 500 }} />
          </div>
        ) : headline ? (
          <p className="ft-headline">{headline}</p>
        ) : null}

        {/* Location + Status */}
        {editMode ? (
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <input className="ft-inline-input" value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Location"
              style={{ flex: 1, minWidth: 140, fontSize: 12 }} />
            <input className="ft-inline-input" value={status}
              onChange={e => setStatus(e.target.value)}
              placeholder="Status (e.g. Open to work)"
              style={{ flex: 1, minWidth: 140, fontSize: 12 }} />
          </div>
        ) : (
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
              <span className="ft-meta-chip" style={{ color: 'rgba(255,112,67,0.95)', borderColor: 'rgba(255,112,67,0.24)' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--orange)', flexShrink: 0, display: 'inline-block' }} />
                {status}
              </span>
            )}
          </div>
        )}

        {/* Social links in edit mode */}
        {editMode && (
          <div className="ft-social-grid" style={{ marginTop: 14 }}>
            {SOCIAL_FIELDS.map(f => (
              <div key={f.key} className="ft-social-row">
                <span className="ft-social-icon">{f.icon}</span>
                <input className="ft-inline-input" type="url"
                  value={socialLinks[f.key] || ''}
                  onChange={e => updateSocial(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  style={{ fontSize: 12 }} />
              </div>
            ))}
          </div>
        )}

        {/* Actions row */}
        <div className="ft-actions-row">
          <span className="ft-url-pill">{profileUrl}</span>

          <button className="ft-copy-btn" type="button" onClick={handleCopyProfileUrl} aria-label="Copy portfolio URL">
            <svg width="13" height="13" fill="none" viewBox="0 0 13 13">
              <rect x="4" y="4" width="8" height="8" rx="1.5" stroke="white" strokeWidth="1.4" />
              <path d="M3 9H2a1 1 0 01-1-1V2a1 1 0 011-1h6a1 1 0 011 1v1" stroke="white" strokeWidth="1.4" />
            </svg>
            {copied ? 'Copied' : 'Copy Link'}
          </button>

          {isOwner && !editMode && (
            <button type="button" className="ft-edit-portfolio-btn" onClick={onEditClick}>
              <svg width="14" height="14" fill="none" viewBox="0 0 14 14">
                <path d="M9.916 1.75a1.237 1.237 0 011.75 1.75l-6.5 6.5-2.333.583.583-2.333 6.5-6.5z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M8.75 2.917l2.333 2.333" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Edit Portfolio
            </button>
          )}

          {primaryResume && !editMode && (
            <a className="ft-resume-top-btn"
              href={`/api/resume/public-download?resumeId=${encodeURIComponent(primaryResume.id)}&slug=${encodeURIComponent(slug)}`}
              target="_blank" rel="noopener noreferrer">
              <svg width="14" height="14" fill="none" viewBox="0 0 14 14">
                <path d="M7 1v8M4 7l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Download Resume
            </a>
          )}
        </div>

        {effectiveVisibility === 'PUBLIC' && !editMode && (
          <span className="ft-visibility-pill">
            <svg width="10" height="10" fill="none" viewBox="0 0 10 10">
              <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.2" />
              <path d="M1 5h8M5 1c-1.5 1.2-2 2.5-2 4s.5 2.8 2 4M5 1c1.5 1.2 2 2.5 2 4s-.5 2.8-2 4" stroke="currentColor" strokeWidth="1.2" />
            </svg>
            Public portfolio
          </span>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SidebarCard — view content + edit content in same card
// ─────────────────────────────────────────────────────────────────────────────
function SidebarCard({ label, editMode, viewContent, editContent, animClass = 'animate-fade-up delay-2' }) {
  const hasViewContent = !!viewContent;
  if (!editMode && !hasViewContent) return null;

  return (
    <div className={`ft-card${editMode ? ' editing' : ''} ${animClass}`} style={{ marginTop: 18 }}>
      <div className="ft-card-inner">
        <p className="ft-section-label">{label}</p>
        {editMode ? editContent : viewContent}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MainCard — view content + edit content in same card
// ─────────────────────────────────────────────────────────────────────────────
function MainCard({ label, editMode, viewContent, editContent, animClass = '' }) {
  const hasViewContent = !!viewContent;
  if (!editMode && !hasViewContent) return null;

  return (
    <div className={`ft-card${editMode ? ' editing' : ''} ${animClass}`}>
      <div className="ft-card-inner">
        <p className="ft-section-label">{label}</p>
        {editMode ? editContent : viewContent}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SaveStatusIndicator
// ─────────────────────────────────────────────────────────────────────────────
function SaveStatusIndicator({ state }) {
  const map = {
    idle:   { dot: 'rgba(255,255,255,0.20)', text: 'Changes save automatically', color: 'rgba(255,255,255,0.35)' },
    saving: { dot: '#FFB74D',                text: 'Saving…',                   color: 'rgba(255,255,255,0.55)' },
    saved:  { dot: '#66BB6A',                text: 'All changes saved',         color: 'rgba(255,255,255,0.55)' },
    error:  { dot: '#EF5350',                text: 'Save failed',               color: '#EF9A9A'                 },
  };
  const c = map[state] || map.idle;
  return (
    <div className="ft-save-status">
      <div className="ft-save-dot" style={{ background: c.dot }} />
      <span style={{ color: c.color }}>{c.text}</span>
    </div>
  );
}