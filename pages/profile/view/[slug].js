// pages/profile/view/[slug].js  —  ForgeTomorrow Portfolio v3
// ─────────────────────────────────────────────────────────────────────────────
// v3 layout changes:
//   - Signals bar: full-width scannable strip below identity (availability, work type, relocation, locations)
//   - 3-panel body: Skills+Languages | Summary | Education — equal start, no sidebar domination
//   - Work preferences: updated schema fields from Sora's card (workStatus, workType, schedule,
//     willingToRelocate, startDate, scheduleAvailability, preferredLocations)
//   - Edit mode: work prefs edit inline via signals bar click-to-edit
//   - Layout adapts: siderails collapsed = panels use more width; tablet = 2-col; mobile = sheets
// ─────────────────────────────────────────────────────────────────────────────

import Head from 'next/head';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../api/auth/[...nextauth]';
import InternalLayout from '@/components/layouts/InternalLayout';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';
import MemberAvatarActions from '@/components/member/MemberAvatarActions';
import ProfileResumeAttach    from '@/components/profile/ProfileResumeAttach';
import ProfileCertifications  from '@/components/profile/ProfileCertifications';
import ProfileProjects        from '@/components/profile/ProfileProjects';

import { profileBanners    } from '@/lib/profileBanners';
import { profileWallpapers } from '@/lib/profileWallpapers';

const ORANGE     = '#FF7043';
const NAVY       = '#0D1B2A';
const SAVE_DELAY = 900;
const MAX_PX     = 800;
const JPEG_Q     = 0.82;

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

// Work status → color signal
const STATUS_COLOR = {
  'Actively Looking': { bg: 'rgba(34,197,94,0.14)', border: 'rgba(34,197,94,0.35)', color: '#4ade80', dot: '#4ade80' },
  'Open to Offers':   { bg: 'rgba(251,191,36,0.14)', border: 'rgba(251,191,36,0.35)', color: '#fbbf24', dot: '#fbbf24' },
  'Not Looking':      { bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.25)', color: '#94a3b8', dot: '#94a3b8' },
};

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onloadend = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_PX || height > MAX_PX) {
          if (width > height) { height = Math.round((height / width) * MAX_PX); width = MAX_PX; }
          else                { width  = Math.round((width / height) * MAX_PX); height = MAX_PX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', JPEG_Q));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function parseArrayField(raw, fallback = []) {
  if (!raw) return fallback;
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (Array.isArray(parsed))
      return parsed.map(i => (typeof i === 'string' ? i : i?.name || i?.label || '')).filter(Boolean);
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.items))
      return parsed.items.map(i => (typeof i === 'string' ? i : i?.name || i?.label || '')).filter(Boolean);
    return fallback;
  } catch { return fallback; }
}

function parseEducationField(raw, fallback = []) {
  if (!raw) return fallback;
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (Array.isArray(parsed)) {
      return parsed.map(item => {
        if (!item) return null;
        if (typeof item === 'string') return { school: item };
        if (typeof item === 'object') return {
          school: item.school || item.institution || item.name || '',
          degree: item.degree || item.program || '',
          field:  item.field  || item.major    || '',
          startYear: item.startYear || item.start || '',
          endYear:   item.endYear   || item.end   || '',
          notes:     item.notes     || item.details || '',
        };
        return null;
      }).filter(x => x && (x.school || x.degree || x.field || x.notes));
    }
    return fallback;
  } catch { return fallback; }
}

function parseStructuredArrayField(raw, fallback = []) {
  if (!raw) return fallback;
  try {
    if (Array.isArray(raw)) return raw;
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : fallback;
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
      certificationsJson: true, projectsJson: true,
      bannerMode: true, bannerHeight: true, bannerFocalY: true,
      wallpaperUrl: true, corporateBannerKey: true, corporateBannerLocked: true,
      isProfilePublic: true, profileVisibility: true, role: true, email: true,
      workPreferences: true,
      resumes: {
        where: { isPrimary: true }, orderBy: { updatedAt: 'desc' }, take: 1,
        select: { id: true, name: true, updatedAt: true },
      },
    },
  });

  if (!user) return { notFound: true };

  const effectiveVisibility = user.profileVisibility || (user.isProfilePublic ? 'PUBLIC' : 'PRIVATE');

  let viewerRole = null, viewerId = null;
  if (viewerEmail) {
    const viewer = await prisma.user.findUnique({
      where: { email: viewerEmail }, select: { id: true, role: true, email: true },
    });
    viewerRole = viewer?.role || null;
    viewerId   = viewer?.id   || null;
  }

  const isOwner     = Boolean(viewerEmail) && Boolean(user.email) && String(user.email).toLowerCase() === String(viewerEmail).toLowerCase();
  const isAdmin     = viewerRole === 'ADMIN';
  const isRecruiter = viewerRole === 'RECRUITER';
  const allowed =
    effectiveVisibility === 'PUBLIC'            ? true
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

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
export default function PortfolioViewPage({ user, primaryResume, effectiveVisibility, viewer, isOwner }) {
  const [editMode,           setEditMode]           = useState(false);
  const [mobileTab,          setMobileTab]          = useState('about');
  const [mobileSkillsReady,  setMobileSkillsReady]  = useState(false);
  const [copied,             setCopied]             = useState(false);
  const [siderailsCollapsed, setSiderailsCollapsed] = useState(false);
  const [mobileSheet,        setMobileSheet]        = useState(null);
  const [showPrefsEdit,      setShowPrefsEdit]      = useState(false); // inline prefs edit panel

  const {
    id: profileUserId, slug, name, firstName, lastName,
    avatarUrl: serverAvatarUrl, coverUrl: serverCoverUrl, wallpaperUrl: serverWallpaperUrl,
    headline: serverHeadline, pronouns: serverPronouns,
    location: serverLocation, status: serverStatus, aboutMe: serverAboutMe,
    skillsJson, languagesJson, educationJson, hobbiesJson,
    bannerMode: serverBannerMode, bannerHeight: serverBannerH, bannerFocalY: serverFocalY,
    corporateBannerKey, corporateBannerLocked,
    workPreferences: serverWorkPrefs,
  } = user;

  const DEFAULT_WALLPAPER = '/images/profile-fallbacks/profile-default-wallpaper.png';

  // Visual state
  const [avatarUrl,    setAvatarUrl]    = useState(serverAvatarUrl    || '');
  const [coverUrl,     setCoverUrl]     = useState(serverCoverUrl     || '');
  const [wallpaperUrl, setWallpaperUrl] = useState(serverWallpaperUrl || '');
  const [headline,     setHeadline]     = useState(serverHeadline     || '');
  const [pronouns,     setPronouns]     = useState(serverPronouns     || '');
  const [location,     setLocation]     = useState(serverLocation     || '');
  const [status,       setStatus]       = useState(serverStatus       || '');
  const [aboutMe,      setAboutMe]      = useState(serverAboutMe      || '');
  const [bannerMode,   setBannerMode]   = useState(serverBannerMode === 'fit' ? 'fit' : 'cover');
  const [bannerH,      setBannerH]      = useState(clamp(serverBannerH ?? 300, 80, 400));
  const [focalY,       setFocalY]       = useState(clamp(serverFocalY  ?? 30,  0, 100));
  const [skills,          setSkills]          = useState(parseArrayField(skillsJson,    []));
  const [languages,       setLanguages]       = useState(parseArrayField(languagesJson, []));
  const [hobbies,         setHobbies]         = useState(parseArrayField(hobbiesJson,   []));
  const [education,       setEducation]       = useState(parseEducationField(educationJson, []));
  const [certifications,  setCertifications]  = useState(parseStructuredArrayField(user.certificationsJson, []));
  const [projects,        setProjects]        = useState(parseStructuredArrayField(user.projectsJson, []));
  const [socialLinks,     setSocialLinks]     = useState({ github: '', x: '', youtube: '', instagram: '' });
  const [avatarUploading, setAvatarUploading] = useState(false);
  const updateSocial = (key, val) => setSocialLinks(p => ({ ...p, [key]: val }));

  // Work preferences — expanded schema from Sora's card
  const wp = serverWorkPrefs || {};
  const [prefWorkStatus,          setPrefWorkStatus]          = useState(wp.workStatus            || '');
  const [prefWorkType,            setPrefWorkType]            = useState(wp.workType              || '');
  const [prefSchedule,            setPrefSchedule]            = useState(wp.schedule              || '');
  const [prefWillingToRelocate,   setPrefWillingToRelocate]   = useState(wp.willingToRelocate     || '');
  const [prefStartDate,           setPrefStartDate]           = useState(wp.startDate             || '');
  const [prefScheduleAvailability,setPrefScheduleAvailability]= useState(wp.scheduleAvailability  || '');
  const [prefLocations,           setPrefLocations]           = useState(Array.isArray(wp.locations) ? wp.locations : []);
  const [prefLocationInput,       setPrefLocationInput]       = useState('');

  // Chip/draft helpers
  const [skillInput,  setSkillInput]  = useState('');
  const [langInput,   setLangInput]   = useState('');
  const [hobbyInput,  setHobbyInput]  = useState('');
  const blankEdu = () => ({ school: '', degree: '', field: '', startYear: '', endYear: '', notes: '' });
  const [eduDraft, setEduDraft] = useState(blankEdu());

  const [resumeModalOpen,  setResumeModalOpen]  = useState(false);
  const [allResumes,       setAllResumes]        = useState([]);
  const [resumesLoading,   setResumesLoading]    = useState(false);

  const openResumeModal = async () => {
    setResumeModalOpen(true);
    setResumesLoading(true);
    try {
      const res  = await fetch('/api/profile/resume');
      const json = await res.json();
      setAllResumes(Array.isArray(json?.resumes) ? json.resumes : []);
    } catch { setAllResumes([]); }
    finally  { setResumesLoading(false); }
  };

  const setPrimaryResumeFn = async (resumeId) => {
    try {
      await fetch('/api/profile/resume', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId, isPrimary: true }),
      });
      setAllResumes(prev => prev.map(r => ({ ...r, isPrimary: r.id === resumeId })));
    } catch { /* silent */ }
  };
  const fileInputRef = useRef(null);
  const [saveState,  setSaveState]  = useState('idle');
  const saveTimerRef = useRef(null);

  // Derived
  const fullName = useMemo(() => {
    const n  = String(name      || '').trim();
    const fn = String(firstName || '').trim();
    const ln = String(lastName  || '').trim();
    return n || [fn, ln].filter(Boolean).join(' ').trim() || 'ForgeTomorrow Member';
  }, [name, firstName, lastName]);

  const initials = useMemo(() => {
    const parts = fullName.split(/\s+/).filter(Boolean);
    return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || 'FT';
  }, [fullName]);

  const profileUrl         = `https://forgetomorrow.com/u/${slug}`;
  const effectiveWallpaper = wallpaperUrl || DEFAULT_WALLPAPER;

  let bannerImage;
  if (corporateBannerLocked && corporateBannerKey) bannerImage = `url(/corporate-banners/${corporateBannerKey}.png)`;
  else if (coverUrl) bannerImage = `url(${coverUrl})`;
  else bannerImage = `linear-gradient(135deg, ${NAVY} 0%, #1a3048 50%, ${NAVY} 100%)`;

  const bannerPos            = `center ${focalY}%`;
  const resolvedBannerHeight = bannerH;

  useEffect(() => {
    if (mobileTab === 'skills') { const t = setTimeout(() => setMobileSkillsReady(true), 120); return () => clearTimeout(t); }
    setMobileSkillsReady(false);
  }, [mobileTab]);

  async function handleCopyProfileUrl() {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(profileUrl);
        setCopied(true); setTimeout(() => setCopied(false), 1200);
      }
    } catch { /* no-op */ }
  }

  const handleAvatarFileChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Please choose an image file.'); e.target.value = ''; return; }
    setAvatarUploading(true);
    try {
      const compressed = await compressImage(file);
      setAvatarUrl(compressed);
      const res  = await fetch('/api/profile/avatar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ avatarDataUrl: compressed }) });
      const json = await res.json();
      if (!res.ok) { alert(json.error || 'Failed to upload.'); setAvatarUrl(serverAvatarUrl || ''); return; }
      setAvatarUrl(json.avatarUrl || '');
    } catch (err) { alert('Something went wrong uploading your photo. Please try again.'); setAvatarUrl(serverAvatarUrl || ''); }
    finally { setAvatarUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  }, [serverAvatarUrl]);

  const handleAvatarRemove = useCallback(async () => {
    const res = await fetch('/api/profile/avatar', { method: 'DELETE' });
    if (!res.ok) { alert('Failed to remove photo.'); return; }
    setAvatarUrl('');
  }, []);

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
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ avatarUrl: avatarUrl || null, coverUrl: coverUrl || null, wallpaperUrl: wallpaperUrl || null, bannerMode, bannerHeight: bannerH, bannerFocalY: focalY, socialLinks }),
            signal: controller.signal,
          }),
          fetch('/api/profile/details', {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pronouns, headline, location, status,
              avatarUrl: avatarUrl || null, coverUrl: coverUrl || null, aboutMe: aboutMe || '',
              workPreferences: {
                workStatus: prefWorkStatus || '',
                workType: prefWorkType || '',
                schedule: prefSchedule || '',
                willingToRelocate: prefWillingToRelocate || '',
                startDate: prefStartDate || '',
                scheduleAvailability: prefScheduleAvailability || '',
                locations: prefLocations || [],
              },
              skillsJson: skills || [], languagesJson: languages || [],
              hobbiesJson: hobbies || [], educationJson: education || [],
              certificationsJson: certifications || [], projectsJson: projects || [],
            }),
            signal: controller.signal,
          }),
        ]);
        if (hRes.ok && dRes.ok) {
          setSaveState('saved'); setTimeout(() => setSaveState('idle'), 2500);
          if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('profileHeaderUpdated', { detail: { wallpaperUrl: wallpaperUrl || null } }));
        } else { setSaveState('error'); }
      } catch (err) { if (err?.name === 'AbortError') return; setSaveState('error'); }
    }, SAVE_DELAY);
    return () => { controller.abort(); if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [
    editMode, avatarUrl, coverUrl, wallpaperUrl, bannerMode, bannerH, focalY,
    socialLinks, pronouns, headline, location, status, aboutMe,
    prefWorkStatus, prefWorkType, prefSchedule, prefWillingToRelocate,
    prefStartDate, prefScheduleAvailability, prefLocations,
    skills, languages, hobbies, education, certifications, projects,
  ]);

  const AvatarWrap = ({ children }) => {
    if (!profileUserId || isOwner) return children;
    return (
      <MemberAvatarActions targetUserId={profileUserId} targetUserSlug={slug} targetName={fullName} showMessage>
        {children}
      </MemberAvatarActions>
    );
  };

  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') { setMobileSheet(null); setShowPrefsEdit(false); } };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, []);

  useEffect(() => { if (!editMode) { setShowPrefsEdit(false); } }, [editMode]);

  // Build signals for the signals bar
  const signals = [
    prefWorkStatus && { key: 'status', label: prefWorkStatus, type: 'status' },
    prefWorkType   && { key: 'type',   label: prefWorkType,   type: 'neutral', icon: '◎' },
    prefSchedule   && { key: 'sched',  label: prefSchedule,   type: 'neutral', icon: '⏱' },
    prefWillingToRelocate && { key: 'reloc', label: prefWillingToRelocate === 'Yes' ? 'Open to Relocation' : prefWillingToRelocate === 'No' ? 'No Relocation' : 'Relocation: Maybe', type: 'neutral', icon: '✈' },
    prefStartDate  && { key: 'start',  label: `Available ${prefStartDate}`, type: 'neutral', icon: '📅' },
    prefScheduleAvailability && { key: 'avail', label: prefScheduleAvailability, type: 'neutral', icon: '🗓' },
    ...prefLocations.map((loc, i) => ({ key: `loc-${i}`, label: loc, type: 'location', icon: '📍' })),
  ].filter(Boolean);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <InternalLayout
      title={`${fullName} — ForgeTomorrow`} activeNav="profile" header={null}
      right={editMode ? <ProfileStrengthRail /> : <RightRailPlacementManager />}
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
          <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800;900&family=Inter:wght@300;400;500;600;700&family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
        </Head>

        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          :root {
            --navy: #0D1B2A; --navy-mid: #162336; --orange: #FF7043;
            --orange-dim: rgba(255,112,67,0.18); --orange-glow: rgba(255,112,67,0.35);
            --white: #F8F4EF; --muted: #A8B7C7; --border: rgba(255,255,255,0.14);
            --card-bg: rgba(13,27,42,0.56); --card-bg-hi: rgba(13,27,42,0.66);
            --blur: blur(12px); --radius-lg: 20px; --radius-md: 14px; --radius-sm: 10px;
            --shadow-lg: 0 24px 64px rgba(0,0,0,0.42); --shadow-md: 0 12px 32px rgba(0,0,0,0.28);
            --shadow-sm: 0 4px 16px rgba(0,0,0,0.20);
            --font-display: 'Playfair Display', Georgia, serif;
            --font-body: 'Inter', system-ui, sans-serif;
            --forge-card: rgba(22,20,18,0.82); --forge-surface: rgba(30,27,24,0.82);
            --forge-border: rgba(255,255,255,0.07); --forge-orange: #e8601c;
            --forge-amber: #f0922b; --forge-text: #f0ece6;
            --forge-muted: #8a7f74; --forge-subtle: #3a3530;
          }
          html, body { max-width: 100%; overflow-x: hidden; }
          body { font-family: var(--font-body); background: var(--navy); color: var(--white); -webkit-font-smoothing: antialiased; }

          @keyframes fadeUp   { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
          @keyframes scaleIn  { from { opacity:0; transform:scale(0.96); }     to { opacity:1; transform:scale(1); }     }
          @keyframes float    { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-4px); } }
          @keyframes blink    { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
          @keyframes pulseDot { 0%,100% { box-shadow:0 0 0 0 rgba(255,112,67,0.5); } 70% { box-shadow:0 0 0 8px rgba(255,112,67,0); } }
          @keyframes sheetUp  { from { transform:translateY(100%); } to { transform:translateY(0); } }
          @keyframes panelIn  { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }

          .animate-fade-up  { animation: fadeUp  0.5s ease both; }
          .animate-scale-in { animation: scaleIn 0.45s ease both; }
          .delay-1 { animation-delay:0.06s; } .delay-2 { animation-delay:0.12s; }
          .delay-3 { animation-delay:0.18s; } .delay-4 { animation-delay:0.24s; }
          .delay-5 { animation-delay:0.30s; } .delay-6 { animation-delay:0.36s; }

          /* ─── Page shell ─── */
          .ft-page { min-height:100vh; width:100%; position:relative; border-radius:18px; overflow:hidden; }
          .ft-page-overlay { min-height:100vh; background:linear-gradient(180deg, rgba(17,32,51,0.62) 0%, rgba(17,32,51,0.18) 55%, rgba(17,32,51,0.30) 100%); padding:18px 0 28px; }
          .ft-edit-mode .ft-page-overlay { background:linear-gradient(180deg, rgba(17,32,51,0.72) 0%, rgba(17,32,51,0.35) 55%, rgba(17,32,51,0.50) 100%); }
          .ft-container { max-width:${siderailsCollapsed ? '100%' : '1160px'}; margin:0 auto; padding:0 ${siderailsCollapsed ? '40px' : '28px'} 40px; transition:max-width 0.3s ease, padding 0.3s ease; }

          /* ─── Resume modal ─── */
          .ft-modal-backdrop { position:fixed; inset:0; z-index:300; background:rgba(0,0,0,0.65); backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px); display:grid; place-items:center; padding:20px; }
          .ft-modal { width:min(560px,96vw); background:rgba(10,18,30,0.98); border:1px solid rgba(255,255,255,0.14); border-radius:20px; overflow:hidden; box-shadow:0 32px 80px rgba(0,0,0,0.60); animation:scaleIn 0.2s ease both; }
          .ft-modal-head { display:flex; align-items:center; justify-content:space-between; padding:18px 20px; border-bottom:1px solid rgba(255,255,255,0.08); }
          .ft-modal-title { font-size:16px; font-weight:800; color:var(--white); }
          .ft-modal-close { background:rgba(255,255,255,0.08); border:none; color:rgba(255,255,255,0.55); width:30px; height:30px; border-radius:50%; cursor:pointer; font-size:16px; display:flex; align-items:center; justify-content:center; font-family:inherit; transition:background 0.15s; }
          .ft-modal-close:hover { background:rgba(255,255,255,0.15); color:white; }
          .ft-modal-body { padding:20px; max-height:60vh; overflow-y:auto; display:grid; gap:10px; scrollbar-width:thin; scrollbar-color:rgba(255,112,67,0.3) transparent; }
          .ft-resume-row { display:flex; align-items:center; gap:12px; padding:14px 16px; border-radius:14px; border:1px solid rgba(255,255,255,0.10); background:rgba(255,255,255,0.04); transition:border-color 0.15s, background 0.15s; cursor:pointer; }
          .ft-resume-row:hover { border-color:rgba(255,112,67,0.35); background:rgba(255,112,67,0.06); }
          .ft-resume-row.primary { border-color:rgba(255,112,67,0.45); background:rgba(255,112,67,0.10); }
          .ft-resume-name { font-size:14px; font-weight:700; color:var(--white); flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
          .ft-resume-date { font-size:11px; color:var(--muted); margin-top:2px; }
          .ft-resume-primary-badge { font-size:10px; font-weight:800; letter-spacing:0.06em; text-transform:uppercase; padding:3px 9px; border-radius:999px; background:rgba(255,112,67,0.20); border:1px solid rgba(255,112,67,0.40); color:${ORANGE}; flex-shrink:0; }
          .ft-resume-set-btn { padding:6px 12px; border-radius:999px; background:transparent; border:1px solid rgba(255,255,255,0.20); color:rgba(255,255,255,0.60); font-size:11px; font-weight:700; cursor:pointer; font-family:inherit; flex-shrink:0; transition:all 0.15s; }
          .ft-resume-set-btn:hover { border-color:${ORANGE}; color:${ORANGE}; }
          .ft-modal-foot { padding:14px 20px; border-top:1px solid rgba(255,255,255,0.08); display:flex; justify-content:space-between; align-items:center; gap:12px; }

          /* ─── AI strength rail ─── */
          .ft-ai-rail { display:grid; gap:12px; }
          .ft-ai-rail-head { font-size:10px; font-weight:800; letter-spacing:0.14em; text-transform:uppercase; color:${ORANGE}; display:flex; align-items:center; gap:8px; }
          .ft-ai-rail-head::after { content:''; flex:1; height:1px; background:linear-gradient(to right, rgba(255,112,67,0.30), transparent); }
          .ft-ai-progress-bar { height:5px; border-radius:999px; background:rgba(255,255,255,0.10); overflow:hidden; }
          .ft-ai-progress-fill { height:100%; border-radius:999px; background:linear-gradient(to right, ${ORANGE}, #FF8A65); transition:width 0.4s ease; }
          .ft-ai-item { padding:12px 14px; border-radius:12px; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.04); display:grid; gap:8px; transition:border-color 0.15s; }
          .ft-ai-item.complete { border-color:rgba(34,197,94,0.20); background:rgba(34,197,94,0.05); }
          .ft-ai-item-top { display:flex; align-items:center; justify-content:space-between; gap:8px; }
          .ft-ai-item-title { font-size:12px; font-weight:700; color:var(--white); }
          .ft-ai-item-status { font-size:10px; font-weight:800; padding:2px 8px; border-radius:999px; flex-shrink:0; }
          .ft-ai-item-status.ok { background:rgba(34,197,94,0.12); border:1px solid rgba(34,197,94,0.25); color:#4ade80; }
          .ft-ai-item-status.gap { background:rgba(251,191,36,0.12); border:1px solid rgba(251,191,36,0.25); color:#fbbf24; }
          .ft-ai-assist-btn { padding:6px 12px; border-radius:999px; background:rgba(255,112,67,0.16); border:1px solid rgba(255,112,67,0.35); color:${ORANGE}; font-size:11px; font-weight:700; cursor:pointer; font-family:inherit; transition:background 0.15s; display:inline-flex; align-items:center; gap:5px; }
          .ft-ai-assist-btn:hover { background:rgba(255,112,67,0.28); }

          /* ─── Edit toolbar ─── */
          .ft-edit-toolbar { position:sticky; top:0; z-index:50; display:flex; align-items:center; justify-content:space-between; padding:10px 16px; background:rgba(13,27,42,0.88); backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px); border-bottom:1px solid rgba(255,255,255,0.12); margin-bottom:18px; gap:12px; flex-wrap:wrap; }
          .ft-edit-toolbar-left { display:flex; align-items:center; gap:10px; }
          .ft-edit-pill { display:inline-flex; align-items:center; gap:6px; padding:5px 12px; border-radius:999px; background:rgba(255,112,67,0.18); border:1px solid rgba(255,112,67,0.40); font-size:11px; font-weight:700; color:${ORANGE}; letter-spacing:0.04em; }
          .ft-edit-pill-dot { width:6px; height:6px; border-radius:50%; background:${ORANGE}; animation:pulseDot 2s infinite; }
          .ft-save-status { display:flex; align-items:center; gap:6px; font-size:12px; font-weight:600; }
          .ft-save-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
          .ft-done-btn { padding:8px 20px; border-radius:999px; background:${ORANGE}; border:none; color:white; font-size:13px; font-weight:700; cursor:pointer; font-family:inherit; transition:background 0.15s, transform 0.1s; box-shadow:0 4px 14px rgba(255,112,67,0.40); }
          .ft-done-btn:hover { background:#FF8A65; }
          .ft-done-btn:active { transform:scale(0.97); }

          /* ─── Banner ─── */
          .ft-banner-wrap { position:relative; width:100%; overflow:hidden; border-radius:18px; border:1px solid rgba(255,255,255,0.18); box-shadow:0 18px 38px rgba(0,0,0,0.18); background:rgba(255,255,255,0.08); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); }
          .ft-banner-blur { position:absolute; inset:0; background-size:cover; background-position:${bannerPos}; background-repeat:no-repeat; filter:blur(18px); transform:scale(1.10); opacity:0.85; }
          .ft-banner-fg   { position:absolute; inset:0; background-size:cover; background-position:${bannerPos}; background-repeat:no-repeat; }
          .ft-banner-vignette { position:absolute; inset:0; background:linear-gradient(180deg, rgba(17,32,51,0.55), rgba(17,32,51,0.22)); }
          .ft-banner-edit-overlay { position:absolute; inset:0; z-index:10; display:flex; align-items:center; justify-content:center; opacity:0; transition:opacity 0.2s; background:rgba(13,27,42,0.45); cursor:pointer; }
          .ft-banner-wrap:hover .ft-banner-edit-overlay { opacity:1; }
          .ft-banner-edit-btn { padding:8px 18px; border-radius:999px; background:rgba(255,255,255,0.15); border:1px solid rgba(255,255,255,0.30); color:white; font-size:13px; font-weight:700; cursor:pointer; font-family:inherit; backdrop-filter:blur(8px); }
          .ft-banner-panel { background:rgba(10,18,30,0.96); border:1px solid rgba(255,255,255,0.12); border-radius:14px; padding:20px; margin-top:10px; backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px); animation:panelIn 0.2s ease both; }
          .ft-panel-label { font-size:10px; font-weight:800; letter-spacing:0.14em; text-transform:uppercase; color:${ORANGE}; margin-bottom:12px; display:flex; align-items:center; gap:8px; }
          .ft-panel-label::after { content:''; flex:1; height:1px; background:linear-gradient(to right, rgba(255,112,67,0.30), transparent); }
          .ft-asset-rail { display:flex; gap:8px; align-items:center; overflow-x:auto; scrollbar-width:none; -webkit-overflow-scrolling:touch; padding-bottom:4px; }
          .ft-asset-rail::-webkit-scrollbar { display:none; }
          .ft-asset-chip { border-radius:999px; padding:2px; border:2px solid rgba(255,255,255,0.15); background:rgba(255,255,255,0.08); cursor:pointer; flex-shrink:0; transition:border-color 0.15s; }
          .ft-asset-chip.selected { border-color:${ORANGE}; }
          .ft-asset-chip img { width:64px; height:32px; border-radius:999px; object-fit:cover; display:block; }
          .ft-asset-none { padding:5px 12px; border-radius:999px; flex-shrink:0; border:1px solid rgba(255,255,255,0.20); background:rgba(255,255,255,0.08); color:rgba(255,255,255,0.70); font-size:12px; font-weight:600; cursor:pointer; font-family:inherit; white-space:nowrap; transition:background 0.15s; }
          .ft-asset-none.selected { border-color:${ORANGE}; color:${ORANGE}; }
          .ft-asset-none:hover:not(.selected) { background:rgba(255,255,255,0.14); }
          .ft-slider-row { display:grid; gap:6px; margin-top:12px; }
          .ft-slider-label { font-size:11px; font-weight:600; color:rgba(255,255,255,0.60); }
          .ft-slider { width:100%; accent-color:${ORANGE}; }

          /* ─── Identity ─── */
          .ft-identity { display:flex; gap:22px; align-items:center; margin-top:18px; position:relative; z-index:10; padding:18px 20px; border:1px solid rgba(255,255,255,0.18); border-radius:18px; background:rgba(13,27,42,0.58); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); box-shadow:var(--shadow-lg); transition:border-color 0.2s; }
          .ft-identity.editing { border-color:rgba(255,112,67,0.40); }
          .ft-avatar-ring { flex-shrink:0; position:relative; width:122px; height:122px; border-radius:50%; padding:3px; background:linear-gradient(135deg, var(--orange), #FF8A65, #FF5722); box-shadow:0 0 0 4px rgba(13,27,42,0.85), var(--shadow-lg); animation:float 6s ease-in-out infinite; }
          .ft-avatar { width:100%; height:100%; border-radius:50%; object-fit:cover; background:var(--navy-mid); display:block; }
          .ft-avatar-edit-overlay { position:absolute; inset:0; border-radius:50%; background:rgba(13,27,42,0.65); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; opacity:0; transition:opacity 0.2s; cursor:pointer; z-index:2; }
          .ft-avatar-ring:hover .ft-avatar-edit-overlay { opacity:1; }
          .ft-avatar-edit-overlay span { font-size:10px; font-weight:700; color:white; }
          .ft-identity-info { flex:1; min-width:0; }
          .ft-name { font-family:var(--font-display); font-size:clamp(28px,4vw,40px); font-weight:700; color:var(--white); letter-spacing:-0.3px; line-height:1.05; text-shadow:0 2px 12px rgba(0,0,0,0.35); }
          .ft-pronouns { font-size:11px; font-weight:600; color:var(--orange); letter-spacing:0.10em; text-transform:uppercase; margin-top:6px; }
          .ft-headline { font-size:15px; font-weight:500; color:rgba(248,244,239,0.92); margin-top:10px; line-height:1.5; max-width:860px; }
          .ft-meta-row { display:flex; gap:10px; flex-wrap:wrap; margin-top:12px; align-items:center; }
          .ft-meta-chip { display:inline-flex; align-items:center; gap:5px; font-size:12px; font-weight:500; color:rgba(248,244,239,0.86); background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.14); border-radius:999px; padding:5px 11px; }
          .ft-actions-row { display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-top:14px; }
          .ft-url-pill { font-size:12px; font-weight:500; color:rgba(248,244,239,0.70); background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.14); border-radius:var(--radius-sm); padding:7px 12px; word-break:break-all; flex:1; min-width:220px; }
          .ft-copy-btn, .ft-resume-top-btn, .ft-edit-portfolio-btn { flex-shrink:0; display:inline-flex; align-items:center; justify-content:center; gap:7px; border-radius:var(--radius-sm); cursor:pointer; font-family:var(--font-body); font-size:13px; font-weight:600; letter-spacing:0.02em; transition:transform 0.15s, box-shadow 0.15s, background 0.15s; text-decoration:none; min-height:38px; white-space:nowrap; padding:8px 16px; }
          .ft-copy-btn { background:var(--orange); color:#fff; border:none; box-shadow:0 6px 18px rgba(255,112,67,0.38); }
          .ft-copy-btn:hover { transform:translateY(-1px); box-shadow:0 10px 24px rgba(255,112,67,0.5); background:#FF8A65; }
          .ft-resume-top-btn, .ft-edit-portfolio-btn { background:rgba(255,112,67,0.14); color:var(--orange); border:1px solid rgba(255,112,67,0.38); box-shadow:0 6px 18px rgba(0,0,0,0.14); }
          .ft-resume-top-btn:hover, .ft-edit-portfolio-btn:hover { background:rgba(255,112,67,0.24); transform:translateY(-1px); }
          .ft-copy-btn:active, .ft-resume-top-btn:active, .ft-edit-portfolio-btn:active { transform:scale(0.98); }
          .ft-visibility-pill { display:inline-flex; align-items:center; gap:5px; font-size:11px; font-weight:500; color:rgba(248,244,239,0.65); background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); border-radius:999px; padding:5px 10px; margin-top:12px; }

          /* ─── SIGNALS BAR ─── */
          .ft-signals-bar {
            margin-top: 12px;
            padding: 14px 18px;
            background: rgba(13,27,42,0.50);
            border: 1px solid rgba(255,255,255,0.10);
            border-radius: 14px;
            backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
            display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
            transition: border-color 0.2s;
          }
          .ft-signals-bar.editing { border-color: rgba(255,112,67,0.30); cursor: pointer; }
          .ft-signals-bar.editing:hover { border-color: rgba(255,112,67,0.55); background: rgba(13,27,42,0.65); }
          .ft-signals-bar.empty-state { border-style: dashed; border-color: rgba(255,255,255,0.12); cursor: pointer; }
          .ft-signal-chip {
            display: inline-flex; align-items: center; gap: 5px;
            font-size: 12px; font-weight: 600;
            padding: 5px 11px; border-radius: 999px;
            border: 1px solid rgba(255,255,255,0.14);
            background: rgba(255,255,255,0.07);
            color: rgba(248,244,239,0.85);
            white-space: nowrap;
          }
          .ft-signal-chip.status-chip {
            font-weight: 700;
          }
          .ft-signal-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
          .ft-signals-edit-hint { font-size:11px; color:rgba(255,255,255,0.35); font-weight:600; display:flex; align-items:center; gap:5px; margin-left:auto; }

          /* ─── Prefs edit panel (slides in below signals bar) ─── */
          .ft-prefs-panel {
            background: rgba(10,18,30,0.95);
            border: 1px solid rgba(255,112,67,0.25);
            border-radius: 14px; padding: 20px; margin-top: 8px;
            backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
            animation: panelIn 0.2s ease both;
          }
          .ft-prefs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
          .ft-prefs-locs { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }

          /* ─── 3-PANEL BODY ─── */
          .ft-three-col {
            display: grid;
            grid-template-columns: minmax(0,1fr) minmax(0,1.5fr) minmax(0,1fr);
            gap: 18px;
            margin-top: 18px;
            align-items: start;
          }
          /* When siderails are collapsed the grid expands naturally */
          @media (max-width: 1100px) {
            .ft-three-col {
              grid-template-columns: minmax(0,1fr) minmax(0,1.6fr);
              grid-template-rows: auto auto;
            }
            .ft-three-col > :nth-child(3) {
              grid-column: 1 / -1;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 18px;
            }
          }
          @media (max-width: 760px) {
            .ft-three-col { grid-template-columns: 1fr; }
            .ft-three-col > :nth-child(3) { grid-template-columns: 1fr; }
          }

          .ft-col-left   { display: grid; gap: 18px; align-content: start; }
		  .ft-col-center { display: grid; gap: 18px; align-content: start; }
		  .ft-col-right  { display: grid; gap: 18px; align-content: start; }

.ft-bottom-two {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  margin-top: 18px;
  align-items: stretch;
}

.ft-equal-height-card {
  height: 100%;
}

@media (max-width: 760px) {
  .ft-bottom-two {
    grid-template-columns: 1fr;
  }
}

          /* ─── Cards ─── */
          .ft-card { background:var(--card-bg); border:1px solid var(--border); border-radius:var(--radius-lg); backdrop-filter:var(--blur); -webkit-backdrop-filter:var(--blur); box-shadow:var(--shadow-md); overflow:hidden; transition:box-shadow 0.2s, border-color 0.2s, transform 0.2s; }
          .ft-card:hover { box-shadow:var(--shadow-lg); border-color:rgba(255,255,255,0.18); transform:translateY(-1px); }
          .ft-card-inner { padding:22px; }
          .ft-section-label { display:flex; align-items:center; gap:10px; font-size:10px; font-weight:700; letter-spacing:0.16em; text-transform:uppercase; color:var(--orange); margin-bottom:16px; }
          .ft-section-label::after { content:''; flex:1; height:1px; background:linear-gradient(to right, var(--orange-dim), transparent); border-radius:1px; }
          .ft-summary-text { font-size:15px; line-height:1.9; color:rgba(248,244,239,0.88); font-weight:400; white-space:pre-line; }

          /* Skills — 2-col mini grid inside the card */
          .ft-skill-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
          .ft-skill-item { display:flex; align-items:center; gap:6px; font-size:12px; font-weight:500; color:rgba(248,244,239,0.85); padding:5px 0; }
          .ft-skill-item::before { content:''; display:inline-block; width:4px; height:4px; border-radius:50%; background:var(--orange); flex-shrink:0; opacity:0.65; }
          .ft-skill-item.accent { color:${ORANGE}; font-weight:700; }
          .ft-skill-item.accent::before { opacity:1; }
          .ft-show-more { font-size:11px; font-weight:700; color:rgba(255,112,67,0.70); background:none; border:none; cursor:pointer; font-family:inherit; margin-top:8px; padding:0; }
          .ft-show-more:hover { color:${ORANGE}; }

          .ft-chips { display:flex; flex-wrap:wrap; gap:8px; }
          .ft-chip { font-size:12px; font-weight:500; padding:7px 13px; border-radius:999px; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.12); color:rgba(248,244,239,0.88); transition:background 0.15s, border-color 0.15s, color 0.15s, transform 0.15s; cursor:default; }
          .ft-chip:hover { background:var(--orange-dim); border-color:var(--orange); color:var(--orange); transform:translateY(-1px); }
          .ft-chip-accent { background:rgba(255,112,67,0.14); border-color:rgba(255,112,67,0.30); color:var(--orange); }
          .ft-lang-list { list-style:none; }
          .ft-lang-list li { display:flex; align-items:center; gap:8px; font-size:13px; font-weight:500; color:rgba(248,244,239,0.84); padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.07); }
          .ft-lang-list li:last-child { border-bottom:none; }
          .ft-lang-list li::before { content:''; display:inline-block; width:5px; height:5px; border-radius:50%; background:var(--orange); flex-shrink:0; }
          .ft-edu-item { position:relative; padding:16px 14px 16px 18px; border-radius:var(--radius-md); background:var(--card-bg-hi); border:1px solid rgba(255,255,255,0.10); transition:border-color 0.2s, transform 0.2s; }
          .ft-edu-item:hover { border-color:rgba(255,112,67,0.28); transform:translateY(-1px); }
          .ft-edu-item + .ft-edu-item { margin-top:10px; }
          .ft-edu-school { font-family:var(--font-display); font-size:14px; font-weight:700; color:var(--white); }
          .ft-edu-sub { font-size:12px; color:var(--muted); margin-top:4px; font-weight:500; }
          .ft-edu-accent-bar { position:absolute; left:0; top:14px; bottom:14px; width:3px; background:linear-gradient(to bottom, var(--orange), #FF5722); border-radius:0 2px 2px 0; }

          /* Member badge */
          .ft-member-badge { display:flex; align-items:center; gap:12px; background:linear-gradient(135deg, rgba(255,112,67,0.18), rgba(255,112,67,0.08)); border:1px solid rgba(255,112,67,0.28); border-radius:var(--radius-md); padding:14px 16px; text-decoration:none; box-shadow:var(--shadow-sm); transition:border-color 0.2s, background 0.2s; }
          .ft-member-badge:hover { border-color:rgba(255,112,67,0.45); background:rgba(255,112,67,0.20); }
          .ft-member-badge-icon { width:36px; height:36px; border-radius:10px; background:var(--orange); display:flex; align-items:center; justify-content:center; flex-shrink:0; box-shadow:0 4px 14px rgba(255,112,67,0.4); }
          .ft-member-badge-title { font-family:var(--font-display); font-size:13px; font-weight:700; color:var(--orange); }
          .ft-member-badge-sub { font-size:11px; color:var(--muted); font-weight:500; margin-top:2px; }

          /* Footer */
          .ft-footer { margin-top:40px; text-align:center; font-size:12px; color:rgba(248,244,239,0.45); padding-bottom:12px; }
          .ft-footer a { color:var(--orange); opacity:0.82; text-decoration:none; transition:opacity 0.15s; }
          .ft-footer a:hover { opacity:1; }

          /* ─── Dark edit cards & inputs ─── */
          .ft-dark-card { background:rgba(10,18,30,0.92); border:1px solid rgba(255,112,67,0.25); border-radius:var(--radius-lg); backdrop-filter:var(--blur); -webkit-backdrop-filter:var(--blur); box-shadow:var(--shadow-md); overflow:hidden; }
          .ft-dark-card-inner { padding:22px; }
          .ft-dark-section-label { display:flex; align-items:center; gap:10px; font-size:10px; font-weight:800; letter-spacing:0.16em; text-transform:uppercase; color:${ORANGE}; margin-bottom:16px; }
          .ft-dark-section-label::after { content:''; flex:1; height:1px; background:linear-gradient(to right, rgba(255,112,67,0.30), transparent); }
          .ft-dark-input { background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.16); border-radius:8px; color:var(--white); font-family:inherit; font-size:14px; outline:none; padding:9px 12px; width:100%; box-sizing:border-box; transition:border-color 0.15s; }
          .ft-dark-input:focus { border-color:rgba(255,112,67,0.55); box-shadow:0 0 0 3px rgba(255,112,67,0.12); }
          .ft-dark-input::placeholder { color:rgba(255,255,255,0.25); }
          .ft-dark-textarea { background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.16); border-radius:8px; color:var(--white); font-family:inherit; font-size:14px; line-height:1.7; outline:none; padding:10px 12px; width:100%; min-height:120px; box-sizing:border-box; resize:vertical; transition:border-color 0.15s; }
          .ft-dark-textarea:focus { border-color:rgba(255,112,67,0.55); box-shadow:0 0 0 3px rgba(255,112,67,0.12); }
          .ft-dark-textarea::placeholder { color:rgba(255,255,255,0.25); }
          .ft-dark-label { font-size:11px; font-weight:700; letter-spacing:0.07em; text-transform:uppercase; color:rgba(255,255,255,0.55); margin-bottom:6px; display:block; }
          .ft-dark-field { display:grid; gap:6px; }
          .ft-dark-select { background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.16); border-radius:8px; color:var(--white); font-family:inherit; font-size:14px; outline:none; padding:9px 12px; width:100%; box-sizing:border-box; cursor:pointer; }
          .ft-dark-select:focus { border-color:rgba(255,112,67,0.55); box-shadow:0 0 0 3px rgba(255,112,67,0.12); }
          .ft-dark-select option { background:#0D1B2A; }
          .ft-dark-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
          @media (max-width:540px) { .ft-dark-grid-2 { grid-template-columns:1fr; } }
          .ft-chip-input-row { display:flex; gap:8px; align-items:center; }
          .ft-chip-input-row .ft-dark-input { flex:1; }
          .ft-add-btn { padding:8px 16px; border-radius:999px; background:rgba(255,112,67,0.18); border:1px solid rgba(255,112,67,0.40); color:${ORANGE}; font-size:12px; font-weight:700; cursor:pointer; font-family:inherit; white-space:nowrap; transition:background 0.15s; flex-shrink:0; }
          .ft-add-btn:hover { background:rgba(255,112,67,0.28); }
          .ft-dark-chips { display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; }
          .ft-dark-chip { display:inline-flex; align-items:center; gap:5px; font-size:12px; font-weight:500; padding:6px 12px; border-radius:999px; background:rgba(255,112,67,0.12); border:1px solid rgba(255,112,67,0.28); color:rgba(255,255,255,0.85); }
          .ft-dark-chip-x { background:none; border:none; color:rgba(255,255,255,0.45); cursor:pointer; font-size:14px; line-height:1; padding:0 0 0 2px; }
          .ft-dark-chip-x:hover { color:rgba(255,80,80,0.90); }
          .ft-edu-dark-item { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.10); border-radius:10px; padding:14px; margin-bottom:10px; position:relative; }
          .ft-edu-dark-del { position:absolute; top:10px; right:10px; background:rgba(211,47,47,0.15); border:1px solid rgba(211,47,47,0.30); color:#EF9A9A; border-radius:6px; padding:3px 8px; font-size:11px; font-weight:700; cursor:pointer; font-family:inherit; }
          .ft-edu-dark-del:hover { background:rgba(211,47,47,0.28); }
          .ft-pref-pill { padding:6px 14px; border-radius:999px; border:1px solid rgba(255,255,255,0.18); background:rgba(255,255,255,0.07); color:rgba(255,255,255,0.60); font-size:12px; font-weight:600; cursor:pointer; font-family:inherit; transition:all 0.15s; }
          .ft-pref-pill.active { background:${ORANGE}; border-color:${ORANGE}; color:white; }
          .ft-pref-pill:hover:not(.active) { background:rgba(255,255,255,0.12); color:white; }
          .ft-pref-pills { display:flex; gap:8px; flex-wrap:wrap; }
          .ft-inline-input { background:rgba(255,255,255,0.08) !important; border:1px solid rgba(255,112,67,0.40) !important; border-radius:6px !important; outline:none !important; color:var(--white) !important; font-family:inherit !important; width:100% !important; padding:6px 10px !important; transition:border-color 0.15s, box-shadow 0.15s !important; box-sizing:border-box !important; }
          .ft-inline-input:focus { border-color:rgba(255,112,67,0.70) !important; box-shadow:0 0 0 3px rgba(255,112,67,0.14) !important; }
          .ft-inline-input::placeholder { color:rgba(255,255,255,0.28) !important; }
          .ft-social-grid { display:grid; gap:10px; }
          .ft-social-row { display:flex; align-items:center; gap:10px; }
          .ft-social-icon { font-size:14px; width:20px; text-align:center; flex-shrink:0; opacity:0.65; color:var(--white); }
          .ft-avatar-panel { position:absolute; top:calc(100% + 12px); left:0; z-index:20; background:rgba(10,18,30,0.97); border:1px solid rgba(255,255,255,0.14); border-radius:14px; padding:16px; width:320px; max-width:90vw; backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px); box-shadow:0 24px 48px rgba(0,0,0,0.50); }
          .ft-avatar-row { display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
          .ft-avatar-option { border-radius:50%; padding:2px; border:2px solid transparent; background:transparent; cursor:pointer; transition:border-color 0.15s; flex-shrink:0; }
          .ft-avatar-option.selected { border-color:${ORANGE}; }
          .ft-avatar-option img { width:44px; height:44px; border-radius:50%; object-fit:cover; display:block; }
          .ft-avatar-action { width:44px; height:44px; border-radius:50%; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1px; cursor:pointer; flex-shrink:0; font-family:inherit; transition:all 0.15s; }
          .ft-avatar-action .ai { font-size:14px; line-height:1; }
          .ft-avatar-action .al { font-size:8px; font-weight:800; }

          /* ─── Mobile ─── */
          .ft-sheet-backdrop { position:fixed; inset:0; z-index:200; background:rgba(0,0,0,0.60); backdrop-filter:blur(4px); -webkit-backdrop-filter:blur(4px); }
          .ft-sheet { position:fixed; left:0; right:0; bottom:0; z-index:201; background:rgba(10,18,30,0.98); border-top:1px solid rgba(255,255,255,0.12); border-radius:20px 20px 0 0; padding:0 0 env(safe-area-inset-bottom,16px); max-height:88vh; display:flex; flex-direction:column; animation:sheetUp 0.28s cubic-bezier(0.32,0.72,0,1) both; }
          .ft-sheet-handle-row { display:flex; align-items:center; justify-content:space-between; padding:14px 20px 10px; flex-shrink:0; }
          .ft-sheet-handle { width:36px; height:4px; border-radius:2px; background:rgba(255,255,255,0.20); margin:0 auto; }
          .ft-sheet-title { font-size:15px; font-weight:800; color:var(--white); }
          .ft-sheet-close { background:rgba(255,255,255,0.10); border:none; color:rgba(255,255,255,0.60); width:28px; height:28px; border-radius:50%; cursor:pointer; font-size:16px; display:flex; align-items:center; justify-content:center; font-family:inherit; }
          .ft-sheet-body { flex:1; overflow-y:auto; padding:0 20px 24px; scrollbar-width:none; -webkit-overflow-scrolling:touch; }
          .ft-sheet-body::-webkit-scrollbar { display:none; }
          .ft-sheet-save-row { padding:12px 20px; border-top:1px solid rgba(255,255,255,0.08); flex-shrink:0; }
          .ft-sheet-save-btn { width:100%; padding:14px; border-radius:12px; background:${ORANGE}; border:none; color:white; font-size:15px; font-weight:700; cursor:pointer; font-family:inherit; box-shadow:0 4px 14px rgba(255,112,67,0.40); }
          .ft-mobile-only  { display:none; }
          .ft-desktop-only { display:block; }
          .ft-mobile-shell { min-height:100vh; display:flex; flex-direction:column; background:rgba(10,9,8,0.34); backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px); }
          .ft-mobile-profile { flex:1; display:flex; flex-direction:column; background:rgba(14,13,12,0.58); border:1px solid rgba(255,255,255,0.07); border-radius:20px; overflow:hidden; box-shadow:0 18px 40px rgba(0,0,0,0.32); }
          .ft-mobile-banner { width:100%; height:160px; flex-shrink:0; position:relative; overflow:hidden; background-color:#180800; }
          .ft-mobile-banner-bg, .ft-mobile-banner-blur { position:absolute; inset:0; background-image:${bannerImage}; background-position:${bannerPos}; background-repeat:no-repeat; }
          .ft-mobile-banner-blur { background-size:cover; filter:blur(22px); transform:scale(1.08); opacity:0.8; }
          .ft-mobile-banner-bg  { background-size:contain; }
          .ft-mobile-banner-overlay { position:absolute; inset:0; background:radial-gradient(ellipse at 75% 35%, rgba(196,74,10,0.55) 0%, transparent 55%), radial-gradient(ellipse at 20% 65%, rgba(122,40,0,0.45) 0%, transparent 50%), linear-gradient(to bottom, transparent 40%, rgba(14,13,12,0.96) 100%); }
          .ft-mobile-role { position:absolute; top:14px; right:14px; background:rgba(0,0,0,0.45); backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px); border:1px solid rgba(255,255,255,0.12); border-radius:20px; padding:4px 11px; font-size:10px; font-weight:700; letter-spacing:1.8px; color:var(--forge-amber); text-transform:uppercase; z-index:2; }
          .ft-mobile-identity { display:flex; align-items:flex-end; gap:14px; padding:0 16px; margin-top:-38px; position:relative; z-index:2; flex-shrink:0; }
          .ft-mobile-avatar { width:80px; height:80px; border-radius:50%; border:3px solid var(--forge-orange); background:var(--forge-subtle); overflow:hidden; flex-shrink:0; box-shadow:0 6px 24px rgba(232,96,28,0.35); cursor:pointer; }
          .ft-mobile-avatar img { width:100%; height:100%; object-fit:cover; display:block; }
          .ft-mobile-identity-text { flex:1; padding-bottom:4px; min-width:0; }
          .ft-mobile-pronoun { font-size:9px; font-weight:700; letter-spacing:1.8px; color:var(--forge-orange); text-transform:uppercase; }
          .ft-mobile-name { font-family:'Cormorant Garamond',serif; font-size:26px; font-weight:700; color:var(--forge-text); letter-spacing:-0.5px; line-height:1.1; }
          .ft-mobile-sub { font-size:12px; color:var(--forge-muted); margin-top:2px; line-height:1.35; white-space:normal; word-break:break-word; }
          .ft-mobile-signals { display:flex; gap:6px; flex-wrap:wrap; padding:10px 16px 0; flex-shrink:0; }
          .ft-mobile-signal-chip { font-size:10px; font-weight:600; padding:3px 9px; border-radius:999px; border:1px solid rgba(255,255,255,0.12); background:rgba(255,255,255,0.07); color:rgba(240,236,230,0.80); white-space:nowrap; display:inline-flex; align-items:center; gap:4px; }
          .ft-mobile-tab-bar { display:flex; margin:14px 16px 0; background:var(--forge-surface); border-radius:12px; padding:3px; flex-shrink:0; }
          .ft-mobile-tab-btn { flex:1; padding:8px 4px; border:none; background:transparent; border-radius:9px; font-family:'DM Sans',sans-serif; font-size:11px; font-weight:600; color:var(--forge-muted); cursor:pointer; transition:all 0.18s; }
          .ft-mobile-tab-btn.active { background:rgba(22,20,18,0.98); color:var(--forge-text); box-shadow:0 1px 4px rgba(0,0,0,0.4); }
          .ft-mobile-tab-dot { display:inline-block; width:4px; height:4px; border-radius:50%; background:transparent; margin-right:4px; vertical-align:middle; margin-top:-2px; transition:background 0.18s; }
          .ft-mobile-tab-btn.active .ft-mobile-tab-dot { background:var(--forge-orange); }
          .ft-mobile-panels { flex:1; position:relative; overflow:hidden; margin-top:12px; min-height:420px; }
          .ft-mobile-panel { position:absolute; inset:0; overflow-y:auto; padding:0 16px 92px; opacity:0; transform:translateX(16px); pointer-events:none; transition:opacity 0.22s ease, transform 0.22s ease; scrollbar-width:none; -webkit-overflow-scrolling:touch; }
          .ft-mobile-panel::-webkit-scrollbar { display:none; }
          .ft-mobile-panel.active { opacity:1; transform:translateX(0); pointer-events:all; }
          .ft-mobile-live-badge { display:inline-flex; align-items:center; gap:5px; background:rgba(34,197,94,0.1); border:1px solid rgba(34,197,94,0.22); border-radius:20px; padding:3px 10px; font-size:10px; font-weight:600; color:#4ade80; margin-bottom:12px; }
          .ft-mobile-live-dot { width:5px; height:5px; border-radius:50%; background:#4ade80; animation:blink 2s infinite; }
          .ft-mobile-stats-row { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-bottom:10px; }
          .ft-mobile-stat { background:var(--forge-card); border:1px solid var(--forge-border); border-radius:14px; padding:12px 8px; text-align:center; }
          .ft-mobile-stat-n { font-family:'Cormorant Garamond',serif; font-size:24px; font-weight:700; color:var(--forge-text); line-height:1; }
          .ft-mobile-stat-n em { color:var(--forge-orange); font-style:normal; font-size:15px; }
          .ft-mobile-stat-l { font-size:10px; color:var(--forge-muted); text-transform:uppercase; letter-spacing:0.8px; margin-top:3px; font-weight:500; }
          .ft-mobile-card { background:var(--forge-card); border:1px solid var(--forge-border); border-radius:16px; padding:16px; margin-bottom:10px; }
          .ft-mobile-card-label { font-size:9px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:var(--forge-orange); margin-bottom:9px; display:flex; align-items:center; gap:6px; }
          .ft-mobile-card-label::after { content:''; flex:1; height:1px; background:var(--forge-border); }
          .ft-mobile-card-text { font-size:13px; line-height:1.75; color:rgba(240,236,230,0.78); font-weight:300; white-space:pre-line; }
          .ft-mobile-skill-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
          .ft-mobile-skill { background:var(--forge-card); border:1px solid var(--forge-border); border-radius:12px; padding:12px; position:relative; overflow:hidden; min-height:64px; }
          .ft-mobile-skill-name { font-size:12px; font-weight:600; color:var(--forge-text); margin-bottom:2px; }
          .ft-mobile-skill-cat { font-size:10px; color:var(--forge-muted); text-transform:uppercase; letter-spacing:0.7px; }
          .ft-mobile-skill-bar { position:absolute; bottom:0; left:0; height:2px; background:linear-gradient(90deg,var(--forge-orange),var(--forge-amber)); transition:width 0.9s cubic-bezier(0.23,1,0.32,1); border-radius:0 0 12px 12px; }
          .ft-mobile-contact-row { display:flex; align-items:center; gap:12px; width:100%; padding:13px; background:var(--forge-card); border:1px solid var(--forge-border); border-radius:14px; margin-bottom:8px; text-decoration:none; text-align:left; transition:all 0.14s; }
          .ft-mobile-contact-row[type="button"] { appearance:none; -webkit-appearance:none; font:inherit; color:inherit; }
          .ft-mobile-contact-row:active { transform:scale(0.98); background:var(--forge-surface); }
          .ft-mobile-contact-icon { width:38px; height:38px; border-radius:11px; display:flex; align-items:center; justify-content:center; font-size:16px; flex-shrink:0; }
          .ft-mobile-contact-label { font-size:10px; color:var(--forge-muted); text-transform:uppercase; letter-spacing:0.8px; font-weight:600; }
          .ft-mobile-contact-value { font-size:12px; color:var(--forge-text); margin-top:1px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
          .ft-mobile-contact-arrow { color:var(--forge-muted); font-size:16px; margin-left:auto; flex-shrink:0; }
          .ft-mobile-footer { position:absolute; left:16px; right:16px; bottom:16px; display:flex; gap:8px; z-index:3; }
          .ft-mobile-footer-btn { flex:1; background:rgba(30,27,24,0.96); border:1px solid rgba(255,255,255,0.08); color:#f0ece6; padding:12px; border-radius:12px; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; transition:all 0.15s; text-decoration:none; backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); }
          .ft-mobile-footer-btn.primary { background:#e8601c; border-color:#e8601c; color:white; }
          .ft-mobile-footer-btn:active { transform:scale(0.97); }
          .ft-mobile-edit-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
          .ft-mobile-edit-btn { padding:6px 14px; border-radius:999px; background:rgba(255,112,67,0.14); border:1px solid rgba(255,112,67,0.35); color:${ORANGE}; font-size:11px; font-weight:700; cursor:pointer; font-family:inherit; }

          @media (max-width:760px) {
            .ft-page { background-attachment:scroll; border-radius:16px; }
            .ft-page-overlay { padding:10px 0 18px; background:linear-gradient(180deg, rgba(10,9,8,0.24) 0%, rgba(10,9,8,0.14) 50%, rgba(10,9,8,0.24) 100%); }
            .ft-container { padding:0 12px 20px; max-width:430px; }
            .ft-desktop-only { display:none; }
            .ft-mobile-only  { display:block; }
            .ft-footer { display:none; }
          }
          ::-webkit-scrollbar { width:6px; }
          ::-webkit-scrollbar-track { background:var(--navy); }
          ::-webkit-scrollbar-thumb { background:rgba(255,112,67,0.3); border-radius:3px; }
          ::-webkit-scrollbar-thumb:hover { background:rgba(255,112,67,0.5); }
        `}</style>

        <div className={`ft-page${editMode ? ' ft-edit-mode' : ''}`}>
          <div className="ft-page-overlay">
            <div className="ft-container">

              {/* ══════════════ DESKTOP ══════════════ */}
              <div className="ft-desktop-only">

                {editMode && (
                  <div className="ft-edit-toolbar">
                    <div className="ft-edit-toolbar-left">
                      <div className="ft-edit-pill"><span className="ft-edit-pill-dot" />Editing portfolio</div>
                      <SaveStatusIndicator state={saveState} />
                    </div>
                    <button type="button" className="ft-done-btn" onClick={() => setEditMode(false)}>Done editing</button>
                  </div>
                )}

                {/* Banner */}
                <BannerSection
                  editMode={editMode} bannerImage={bannerImage} bannerPos={bannerPos}
                  resolvedBannerHeight={resolvedBannerHeight}
                  coverUrl={coverUrl} setCoverUrl={setCoverUrl}
                  wallpaperUrl={wallpaperUrl} setWallpaperUrl={setWallpaperUrl}
                  bannerMode={bannerMode} setBannerMode={setBannerMode}
                  bannerH={bannerH} setBannerH={setBannerH}
                  focalY={focalY} setFocalY={setFocalY}
                />

                {/* Identity */}
                <IdentitySection
                  editMode={editMode} avatarUrl={avatarUrl} avatarUploading={avatarUploading}
                  initials={initials} fullName={fullName}
                  pronouns={pronouns} setPronouns={setPronouns}
                  headline={headline} setHeadline={setHeadline}
                  location={location} setLocation={setLocation}
                  status={status} setStatus={setStatus}
                  slug={slug} profileUrl={profileUrl}
                  copied={copied} handleCopyProfileUrl={handleCopyProfileUrl}
                  primaryResume={primaryResume} effectiveVisibility={effectiveVisibility}
                  isOwner={isOwner} onEditClick={() => setEditMode(true)}
                  fileInputRef={fileInputRef} handleAvatarFileChange={handleAvatarFileChange}
                  handleAvatarRemove={handleAvatarRemove} setAvatarUrl={setAvatarUrl}
                  AvatarWrap={AvatarWrap} socialLinks={socialLinks} updateSocial={updateSocial}
                  openResumeModal={openResumeModal}
                />

                {/* ── SIGNALS BAR ── */}
                <div
                  className={`ft-signals-bar animate-fade-up delay-2${editMode ? ' editing' : ''}${signals.length === 0 ? ' empty-state' : ''}`}
                  onClick={editMode ? () => setShowPrefsEdit(v => !v) : undefined}
                  role={editMode ? 'button' : undefined}
                  aria-label={editMode ? 'Edit work preferences' : undefined}
                >
                  {signals.length > 0 ? signals.map(sig => {
                    const sc = sig.type === 'status' ? (STATUS_COLOR[sig.label] || STATUS_COLOR['Not Looking']) : null;
                    return (
                      <span key={sig.key} className="ft-signal-chip status-chip"
                        style={sc ? { background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color } : {}}>
                        {sig.type === 'status' && sc && <span className="ft-signal-dot" style={{ background: sc.dot }} />}
                        {sig.type !== 'status' && sig.icon && <span style={{ fontSize: 11 }}>{sig.icon}</span>}
                        {sig.label}
                      </span>
                    );
                  }) : (
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.30)', fontWeight: 600 }}>
                      {editMode ? '✎ Add work availability & preferences…' : 'No availability info set'}
                    </span>
                  )}
                  {editMode && signals.length > 0 && (
                    <span className="ft-signals-edit-hint">
                      <svg width="12" height="12" fill="none" viewBox="0 0 12 12"><path d="M8.5 1a1.06 1.06 0 011.5 1.5L3.5 9 1 9.5 1.5 7l7-6z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      Edit preferences
                    </span>
                  )}
                </div>

                {/* Work prefs edit panel */}
                {editMode && showPrefsEdit && (
                  <div className="ft-prefs-panel">
                    <div className="ft-panel-label">Work Preferences</div>
                    <div className="ft-prefs-grid">
                      <div className="ft-dark-field">
                        <label className="ft-dark-label">Work Status</label>
                        <select className="ft-dark-select" value={prefWorkStatus} onChange={e => setPrefWorkStatus(e.target.value)}>
                          <option value="">Select…</option>
                          <option>Actively Looking</option>
                          <option>Open to Offers</option>
                          <option>Not Looking</option>
                        </select>
                      </div>
                      <div className="ft-dark-field">
                        <label className="ft-dark-label">Work Type</label>
                        <select className="ft-dark-select" value={prefWorkType} onChange={e => setPrefWorkType(e.target.value)}>
                          <option value="">Select…</option>
                          <option>Remote</option>
                          <option>Hybrid</option>
                          <option>On-site</option>
                        </select>
                      </div>
                      <div className="ft-dark-field">
                        <label className="ft-dark-label">Schedule</label>
                        <select className="ft-dark-select" value={prefSchedule} onChange={e => setPrefSchedule(e.target.value)}>
                          <option value="">Select…</option>
                          <option>Full-time</option>
                          <option>Part-time</option>
                          <option>Contract</option>
                          <option>Freelance</option>
                          <option>Internship</option>
                        </select>
                      </div>
                      <div className="ft-dark-field">
                        <label className="ft-dark-label">Willing to Relocate</label>
                        <select className="ft-dark-select" value={prefWillingToRelocate} onChange={e => setPrefWillingToRelocate(e.target.value)}>
                          <option value="">Select…</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                          <option value="Maybe">Maybe</option>
                        </select>
                      </div>
                      <div className="ft-dark-field">
                        <label className="ft-dark-label">Earliest Start Date</label>
                        <input className="ft-dark-input" type="date" value={prefStartDate} onChange={e => setPrefStartDate(e.target.value)} />
                      </div>
                      <div className="ft-dark-field">
                        <label className="ft-dark-label">Schedule Availability</label>
                        <select className="ft-dark-select" value={prefScheduleAvailability} onChange={e => setPrefScheduleAvailability(e.target.value)}>
                          <option value="">Select…</option>
                          <option>Any</option>
                          <option>Weekdays</option>
                          <option>Weekends</option>
                          <option>Flexible</option>
                          <option>Mornings</option>
                          <option>Evenings</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ marginTop: 16 }}>
                      <label className="ft-dark-label">Preferred Locations</label>
                      <div className="ft-chip-input-row" style={{ marginTop: 6 }}>
                        <input className="ft-dark-input" value={prefLocationInput}
                          onChange={e => setPrefLocationInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && prefLocationInput.trim()) { setPrefLocations(p => [...p, prefLocationInput.trim()]); setPrefLocationInput(''); e.preventDefault(); }}}
                          placeholder="e.g. Nashville, TN or Remote" />
                        <button type="button" className="ft-add-btn"
                          onClick={() => { if (prefLocationInput.trim()) { setPrefLocations(p => [...p, prefLocationInput.trim()]); setPrefLocationInput(''); }}}>
                          Add
                        </button>
                      </div>
                      {prefLocations.length > 0 && (
                        <div className="ft-dark-chips">
                          {prefLocations.map((loc, i) => (
                            <span key={loc + i} className="ft-dark-chip">
                              {loc}
                              <button type="button" className="ft-dark-chip-x"
                                onClick={() => setPrefLocations(p => p.filter((_, idx) => idx !== i))}>×</button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ══ 3-PANEL BODY ══ */}
                <div className="ft-three-col">

                  {/* LEFT — Skills + Languages + Interests */}
                  <div className="ft-col-left animate-fade-up delay-3">

                    {/* Skills card */}
                    {editMode ? (
                      <SkillsEditCard
                        skills={skills} setSkills={setSkills}
                        skillInput={skillInput} setSkillInput={setSkillInput} />
                    ) : skills.length > 0 ? (
                      <SkillsViewCard skills={skills} />
                    ) : null}

                    {/* Languages card */}
                    {editMode ? (
                      <LangEditCard
                        languages={languages} setLanguages={setLanguages}
                        langInput={langInput} setLangInput={setLangInput} />
                    ) : languages.length > 0 ? (
                      <div className="ft-card">
                        <div className="ft-card-inner">
                          <p className="ft-section-label">Languages</p>
                          <ul className="ft-lang-list">{languages.map(l => <li key={l}>{l}</li>)}</ul>
                        </div>
                      </div>
                    ) : null}

                    {/* Interests card */}
                    {editMode ? (
                      <InterestsEditCard
                        hobbies={hobbies} setHobbies={setHobbies}
                        hobbyInput={hobbyInput} setHobbyInput={setHobbyInput} />
                    ) : hobbies.length > 0 ? (
                      <div className="ft-card">
                        <div className="ft-card-inner">
                          <p className="ft-section-label">Interests</p>
                          <div className="ft-chips">{hobbies.map(h => <span key={h} className="ft-chip">{h}</span>)}</div>
                        </div>
                      </div>
                    ) : null}

                  </div>
                  {/* end left col */}

                  {/* CENTER — Summary (the user's story, owns this column) */}
                  <div className="ft-col-center animate-fade-up delay-4">
                    {editMode ? (
                      <div className="ft-dark-card">
                        <div className="ft-dark-card-inner">
                          <div className="ft-dark-section-label">Professional Summary</div>
                          <textarea className="ft-dark-textarea" value={aboutMe}
                            onChange={e => setAboutMe(e.target.value)}
                            placeholder="Tell your professional story…"
                            style={{ minHeight: 260, resize: 'vertical' }} />
                        </div>
                      </div>
                    ) : aboutMe ? (
                      <div className="ft-card">
                        <div className="ft-card-inner">
                          <p className="ft-section-label">Professional Summary</p>
                          <p className="ft-summary-text">{aboutMe}</p>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* RIGHT — Education + Certifications */}
                  <div className="ft-col-right animate-fade-up delay-5">

                    {/* Education */}
                    {editMode ? (
                      <EducationEditCard
                        education={education} setEducation={setEducation}
                        eduDraft={eduDraft} setEduDraft={setEduDraft} blankEdu={blankEdu} />
                    ) : (
                      <div className="ft-card">
                        <div className="ft-card-inner">
                          <p className="ft-section-label">Education</p>
                          {education.length > 0 ? education.map((edu, idx) => {
                            const line1 = [edu?.degree, edu?.field].filter(Boolean).join(' — ');
                            const years = [edu?.startYear, edu?.endYear].filter(Boolean).join(' – ');
                            return (
                              <div key={idx} className="ft-edu-item">
                                <div className="ft-edu-accent-bar" />
                                <div className="ft-edu-school">{edu.school || 'Education'}</div>
                                {(line1 || years) && <div className="ft-edu-sub">{line1}{line1 && years ? ' · ' : ''}{years}</div>}
                                {edu?.notes && <div style={{ fontSize: 12, color: 'rgba(248,244,239,0.65)', marginTop: 6, lineHeight: 1.6 }}>{edu.notes}</div>}
                              </div>
                            );
                          }) : (
                            <div style={{ fontSize: 13, color: 'rgba(248,244,239,0.35)', fontStyle: 'italic' }}>No education added yet.</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Certifications */}
                    <div className={editMode ? 'ft-dark-card' : 'ft-card'}>
                      <div className={editMode ? 'ft-dark-card-inner' : 'ft-card-inner'}>
                        {editMode
                          ? <div className="ft-dark-section-label">Certifications</div>
                          : <p className="ft-section-label">Certifications</p>}
                        <ProfileCertifications
  certifications={certifications}
  setCertifications={setCertifications}
  editMode={editMode}
/>
                      </div>
                    </div>

                  </div>
                </div>

{/* ══ BELOW-GRID FULL-WIDTH ROW — Projects + Custom ══ */}
<div className="ft-bottom-two">

  {/* Projects */}
  <div className={`${editMode ? 'ft-dark-card' : 'ft-card'} ft-equal-height-card`}>
    <div className={editMode ? 'ft-dark-card-inner' : 'ft-card-inner'}>
      {editMode
        ? <div className="ft-dark-section-label">Projects</div>
        : <p className="ft-section-label">Projects</p>}
      <ProfileProjects
        projects={projects}
        setProjects={setProjects}
        editMode={editMode}
      />
    </div>
  </div>

  {/* Custom card stub */}
  <div className={`${editMode ? 'ft-dark-card' : 'ft-card'} ft-equal-height-card`}>
    <div className={editMode ? 'ft-dark-card-inner' : 'ft-card-inner'}>
      {editMode
        ? <div className="ft-dark-section-label">Custom Section</div>
        : <p className="ft-section-label">Custom Section</p>}
      <div style={{ fontSize: 13, color: 'rgba(248,244,239,0.30)', fontStyle: 'italic', lineHeight: 1.6 }}>
        Coming soon — add a portfolio spotlight, featured work, press mentions, or anything else that tells your story.
      </div>
    </div>
  </div>

</div>
              {/* end desktop */}

              {/* ══════════════ MOBILE ══════════════ */}
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

                    {/* Mobile signals strip */}
                    {signals.length > 0 && (
                      <div className="ft-mobile-signals">
                        {signals.slice(0, 4).map(sig => {
                          const sc = sig.type === 'status' ? (STATUS_COLOR[sig.label] || STATUS_COLOR['Not Looking']) : null;
                          return (
                            <span key={sig.key} className="ft-mobile-signal-chip"
                              style={sc ? { background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color } : {}}>
                              {sig.type === 'status' && sc && <span style={{ width: 5, height: 5, borderRadius: '50%', background: sc.dot, display: 'inline-block', flexShrink: 0 }} />}
                              {sig.label}
                            </span>
                          );
                        })}
                      </div>
                    )}

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
                      {/* About */}
                      <div className={`ft-mobile-panel${mobileTab === 'about' ? ' active' : ''}`}>
                        {effectiveVisibility === 'PUBLIC' && <div className="ft-mobile-live-badge"><div className="ft-mobile-live-dot" />Public Portfolio</div>}
                        <div className="ft-mobile-stats-row">
                          <div className="ft-mobile-stat"><div className="ft-mobile-stat-n">{skills.length}<em>+</em></div><div className="ft-mobile-stat-l">Skills</div></div>
                          <div className="ft-mobile-stat"><div className="ft-mobile-stat-n">{education.length}<em>+</em></div><div className="ft-mobile-stat-l">Education</div></div>
                          <div className="ft-mobile-stat"><div className="ft-mobile-stat-n">{languages.length}<em>+</em></div><div className="ft-mobile-stat-l">Languages</div></div>
                        </div>
                        {isOwner && <div className="ft-mobile-edit-row"><span style={{ fontSize:12, color:'var(--forge-muted)' }}>Summary</span><button type="button" className="ft-mobile-edit-btn" onClick={() => setMobileSheet('about')}>✎ Edit</button></div>}
                        {(aboutMe || headline) && <div className="ft-mobile-card"><div className="ft-mobile-card-label">Summary</div><div className="ft-mobile-card-text">{aboutMe || headline}</div></div>}
                        {(location || status) && <div className="ft-mobile-card"><div className="ft-mobile-card-label">Details</div><div className="ft-mobile-card-text">{location ? `Location: ${location}` : ''}{location && status ? '\n' : ''}{status ? `Status: ${status}` : ''}</div></div>}
                      </div>

                      {/* Skills */}
                      <div className={`ft-mobile-panel${mobileTab === 'skills' ? ' active' : ''}`}>
                        {isOwner && <div className="ft-mobile-edit-row"><span style={{ fontSize:12, color:'var(--forge-muted)' }}>Skills</span><button type="button" className="ft-mobile-edit-btn" onClick={() => setMobileSheet('skills')}>✎ Edit</button></div>}
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
                        ) : <div className="ft-mobile-card"><div className="ft-mobile-card-label">Skills</div><div className="ft-mobile-card-text">No skills added yet.</div></div>}
                      </div>

                      {/* Education */}
                      <div className={`ft-mobile-panel${mobileTab === 'education' ? ' active' : ''}`}>
                        {isOwner && <div className="ft-mobile-edit-row"><span style={{ fontSize:12, color:'var(--forge-muted)' }}>Education</span><button type="button" className="ft-mobile-edit-btn" onClick={() => setMobileSheet('education')}>✎ Edit</button></div>}
                        {education.length > 0 ? education.map((edu, idx) => {
                          const line1 = [edu?.degree, edu?.field].filter(Boolean).join(' — ');
                          const years = [edu?.startYear, edu?.endYear].filter(Boolean).join(' – ');
                          return (
                            <div key={idx} className="ft-mobile-card">
                              <div className="ft-mobile-card-label">Education</div>
                              <div className="ft-mobile-card-text">
                                <strong style={{ color:'var(--forge-text)', fontWeight:600 }}>{edu.school || 'Education'}</strong>
                                {(line1 || years) ? `\n${line1}${line1 && years ? ' · ' : ''}${years}` : ''}
                                {edu?.notes ? `\n\n${edu.notes}` : ''}
                              </div>
                            </div>
                          );
                        }) : <div className="ft-mobile-card"><div className="ft-mobile-card-label">Education</div><div className="ft-mobile-card-text">No education added yet.</div></div>}
                      </div>

                      {/* More */}
                      <div className={`ft-mobile-panel${mobileTab === 'more' ? ' active' : ''}`}>
                        {isOwner && <div className="ft-mobile-edit-row"><span style={{ fontSize:12, color:'var(--forge-muted)' }}>Languages & Interests</span><button type="button" className="ft-mobile-edit-btn" onClick={() => setMobileSheet('more')}>✎ Edit</button></div>}
                        {languages.length > 0 && <div className="ft-mobile-card"><div className="ft-mobile-card-label">Languages</div><div className="ft-chips">{languages.map(l => <span key={l} className="ft-chip">{l}</span>)}</div></div>}
                        {hobbies.length > 0 && <div className="ft-mobile-card"><div className="ft-mobile-card-label">Interests</div><div className="ft-chips">{hobbies.map(h => <span key={h} className="ft-chip">{h}</span>)}</div></div>}
                        {languages.length === 0 && hobbies.length === 0 && <div className="ft-mobile-card"><div className="ft-mobile-card-label">More</div><div className="ft-mobile-card-text">No additional details added yet.</div></div>}
                      </div>

                      {/* Connect */}
                      <div className={`ft-mobile-panel${mobileTab === 'connect' ? ' active' : ''}`}>
                        <button type="button" className="ft-mobile-contact-row" onClick={handleCopyProfileUrl}>
                          <div className="ft-mobile-contact-icon" style={{ background:'rgba(232,96,28,0.14)', color:'#e8601c' }}>⎘</div>
                          <div style={{ minWidth:0 }}><div className="ft-mobile-contact-label">Portfolio</div><div className="ft-mobile-contact-value">{profileUrl.replace('https://', '')}</div></div>
                          <div className="ft-mobile-contact-arrow">{copied ? '✓' : '›'}</div>
                        </button>
                        {location && <div className="ft-mobile-contact-row"><div className="ft-mobile-contact-icon" style={{ background:'rgba(59,130,246,0.14)', color:'#60a5fa' }}>⌖</div><div style={{ minWidth:0 }}><div className="ft-mobile-contact-label">Location</div><div className="ft-mobile-contact-value">{location}</div></div><div className="ft-mobile-contact-arrow">›</div></div>}
                        {primaryResume && <a className="ft-mobile-contact-row" href={`/api/resume/public-download?resumeId=${encodeURIComponent(primaryResume.id)}&slug=${encodeURIComponent(slug)}`} target="_blank" rel="noopener noreferrer"><div className="ft-mobile-contact-icon" style={{ background:'rgba(34,197,94,0.14)', color:'#4ade80' }}>↓</div><div style={{ minWidth:0 }}><div className="ft-mobile-contact-label">Resume</div><div className="ft-mobile-contact-value">Download primary resume</div></div><div className="ft-mobile-contact-arrow">›</div></a>}
                      </div>

                      {/* Footer */}
                      <div className="ft-mobile-footer">
                        <button type="button" className="ft-mobile-footer-btn" onClick={handleCopyProfileUrl}>⎘ {copied ? 'Copied' : 'Copy Link'}</button>
                        {isOwner ? (
                          <button type="button" className="ft-mobile-footer-btn primary" onClick={() => setMobileSheet('identity')}>✎ Edit Portfolio</button>
                        ) : primaryResume ? (
                          <a className="ft-mobile-footer-btn primary" href={`/api/resume/public-download?resumeId=${encodeURIComponent(primaryResume.id)}&slug=${encodeURIComponent(slug)}`} target="_blank" rel="noopener noreferrer">↓ Download Resume</a>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* end mobile */}

              <footer className="ft-footer animate-fade-up delay-6">
                <p>This portfolio is powered by <a href="https://forgetomorrow.com" target="_blank" rel="noopener noreferrer">ForgeTomorrow</a> — The future of careers and networking.</p>
              </footer>
            </div>
          </div>
        </div>

        {/* ══ MOBILE SHEETS ══ */}
        {mobileSheet && (
          <>
            <div className="ft-sheet-backdrop" onClick={() => setMobileSheet(null)} />
            <div className="ft-sheet">
              <div className="ft-sheet-handle-row">
                <div style={{ width:28 }} />
                <div className="ft-sheet-handle" />
                <button type="button" className="ft-sheet-close" onClick={() => setMobileSheet(null)}>✕</button>
              </div>

              {mobileSheet === 'identity' && (
                <>
                  <div style={{ padding:'0 20px 14px', flexShrink:0, borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
                    <div className="ft-sheet-title">Edit Portfolio</div>
                    <div style={{ fontSize:12, color:'var(--forge-muted)', marginTop:4 }}>Tap a section to edit</div>
                    <div style={{ display:'grid', gap:8, marginTop:14 }}>
                      {[
                        { id:'about',     label:'Summary',              icon:'✍' },
                        { id:'skills',    label:'Skills',               icon:'⚡' },
                        { id:'education', label:'Education',            icon:'🎓' },
                        { id:'more',      label:'Languages & Interests',icon:'🌐' },
                        { id:'prefs',     label:'Work Preferences',     icon:'💼' },
                      ].map(item => (
                        <button key={item.id} type="button" onClick={() => setMobileSheet(item.id)}
                          style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 14px', borderRadius:12, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.10)', color:'var(--white)', font:'inherit', cursor:'pointer', textAlign:'left' }}>
                          <span style={{ fontSize:18 }}>{item.icon}</span>
                          <span style={{ fontSize:14, fontWeight:600 }}>{item.label}</span>
                          <span style={{ marginLeft:'auto', color:'var(--forge-muted)', fontSize:16 }}>›</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="ft-sheet-body" style={{ paddingTop:16 }}>
                    <div style={{ display:'grid', gap:12 }}>
                      <div className="ft-dark-field"><label className="ft-dark-label">Pronouns</label><input className="ft-dark-input" value={pronouns} onChange={e => setPronouns(e.target.value)} placeholder="e.g. they/them" /></div>
                      <div className="ft-dark-field"><label className="ft-dark-label">Headline</label><input className="ft-dark-input" value={headline} onChange={e => setHeadline(e.target.value)} placeholder="Your professional headline" maxLength={160} /></div>
                      <div className="ft-dark-grid-2">
                        <div className="ft-dark-field"><label className="ft-dark-label">Location</label><input className="ft-dark-input" value={location} onChange={e => setLocation(e.target.value)} placeholder="City or Remote" /></div>
                        <div className="ft-dark-field"><label className="ft-dark-label">Status</label><input className="ft-dark-input" value={status} onChange={e => setStatus(e.target.value)} placeholder="Open to work" /></div>
                      </div>
                      <div className="ft-dark-field">
                        <label className="ft-dark-label">Profile Photo</label>
                        <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap', paddingTop:4 }}>
                          <button type="button" onClick={() => fileInputRef.current?.click()} style={{ width:52, height:52, borderRadius:'50%', border:'2px dashed rgba(255,112,67,0.55)', background:'rgba(255,112,67,0.08)', color:ORANGE, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:2, cursor:'pointer', fontFamily:'inherit', flexShrink:0 }}>
                            <span style={{ fontSize:16, lineHeight:1 }}>↑</span><span style={{ fontSize:8, fontWeight:800 }}>Upload</span>
                          </button>
                          {PRESET_AVATARS.map(opt => (
                            <button key={opt.url} type="button" onClick={() => setAvatarUrl(opt.url)} style={{ width:52, height:52, borderRadius:'50%', padding:2, border:`2px solid ${avatarUrl === opt.url ? ORANGE : 'transparent'}`, background:'transparent', cursor:'pointer', flexShrink:0 }}>
                              <img src={opt.url} alt={opt.label} style={{ width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover', display:'block' }} />
                            </button>
                          ))}
                          <input ref={fileInputRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleAvatarFileChange} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="ft-sheet-save-row">
                    <button type="button" className="ft-sheet-save-btn" onClick={() => setMobileSheet(null)}>Save changes</button>
                  </div>
                </>
              )}

              {mobileSheet === 'about' && (
                <><div style={{ padding:'0 20px 14px', flexShrink:0 }}><div className="ft-sheet-title">Professional Summary</div></div>
                <div className="ft-sheet-body"><textarea className="ft-dark-textarea" value={aboutMe} onChange={e => setAboutMe(e.target.value)} placeholder="Tell your professional story…" rows={8} style={{ width:'100%' }} /></div>
                <div className="ft-sheet-save-row"><button type="button" className="ft-sheet-save-btn" onClick={() => setMobileSheet(null)}>Done</button></div></>
              )}

              {mobileSheet === 'skills' && (
                <><div style={{ padding:'0 20px 14px', flexShrink:0 }}><div className="ft-sheet-title">Skills</div></div>
                <div className="ft-sheet-body">
                  <div className="ft-chip-input-row" style={{ marginBottom:4 }}>
                    <input className="ft-dark-input" value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && skillInput.trim()) { setSkills(p => [...p, skillInput.trim()]); setSkillInput(''); e.preventDefault(); }}} placeholder="Add a skill…" />
                    <button type="button" className="ft-add-btn" onClick={() => { if (skillInput.trim()) { setSkills(p => [...p, skillInput.trim()]); setSkillInput(''); }}}>+ Add</button>
                  </div>
                  <div className="ft-dark-chips">{skills.map((s, i) => <span key={s+i} className="ft-dark-chip">{s}<button type="button" className="ft-dark-chip-x" onClick={() => setSkills(p => p.filter((_,idx) => idx !== i))}>×</button></span>)}</div>
                </div>
                <div className="ft-sheet-save-row"><button type="button" className="ft-sheet-save-btn" onClick={() => setMobileSheet(null)}>Done</button></div></>
              )}

              {mobileSheet === 'education' && (
                <><div style={{ padding:'0 20px 14px', flexShrink:0 }}><div className="ft-sheet-title">Education</div></div>
                <div className="ft-sheet-body">
                  {education.map((edu, idx) => (
                    <div key={idx} className="ft-edu-dark-item">
                      <button type="button" className="ft-edu-dark-del" onClick={() => setEducation(p => p.filter((_,i) => i !== idx))}>Remove</button>
                      <div style={{ color:'var(--white)', fontWeight:600 }}>{edu.school}</div>
                      {edu.degree && <div style={{ fontSize:12, color:'var(--forge-muted)' }}>{edu.degree}{edu.field ? ` — ${edu.field}` : ''}</div>}
                    </div>
                  ))}
                  <div style={{ display:'grid', gap:10, marginTop:16 }}>
                    <div className="ft-dark-field"><label className="ft-dark-label">School</label><input className="ft-dark-input" value={eduDraft.school} onChange={e => setEduDraft(p => ({...p, school:e.target.value}))} placeholder="University / College" /></div>
                    <div className="ft-dark-field"><label className="ft-dark-label">Degree</label><input className="ft-dark-input" value={eduDraft.degree} onChange={e => setEduDraft(p => ({...p, degree:e.target.value}))} placeholder="BS, BA, Diploma…" /></div>
                    <div className="ft-dark-field"><label className="ft-dark-label">Field</label><input className="ft-dark-input" value={eduDraft.field} onChange={e => setEduDraft(p => ({...p, field:e.target.value}))} placeholder="Computer Science…" /></div>
                    <div style={{ display:'flex', gap:8 }}>
                      <div className="ft-dark-field" style={{ flex:1 }}><label className="ft-dark-label">Start</label><input className="ft-dark-input" value={eduDraft.startYear} onChange={e => setEduDraft(p => ({...p, startYear:e.target.value}))} placeholder="2018" /></div>
                      <div className="ft-dark-field" style={{ flex:1 }}><label className="ft-dark-label">End</label><input className="ft-dark-input" value={eduDraft.endYear} onChange={e => setEduDraft(p => ({...p, endYear:e.target.value}))} placeholder="2022" /></div>
                    </div>
                    <button type="button" className="ft-add-btn" onClick={() => { if (!eduDraft.school.trim()) return; setEducation(p => [...p, {...eduDraft}]); setEduDraft(blankEdu()); }}>+ Add Education</button>
                  </div>
                </div>
                <div className="ft-sheet-save-row"><button type="button" className="ft-sheet-save-btn" onClick={() => setMobileSheet(null)}>Done</button></div></>
              )}

              {mobileSheet === 'more' && (
                <><div style={{ padding:'0 20px 14px', flexShrink:0 }}><div className="ft-sheet-title">Languages & Interests</div></div>
                <div className="ft-sheet-body">
                  <div className="ft-dark-section-label" style={{ marginBottom:10 }}>Languages</div>
                  <div className="ft-chip-input-row" style={{ marginBottom:4 }}><input className="ft-dark-input" value={langInput} onChange={e => setLangInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && langInput.trim()) { setLanguages(p => [...p, langInput.trim()]); setLangInput(''); e.preventDefault(); }}} placeholder="Add a language…" /><button type="button" className="ft-add-btn" onClick={() => { if (langInput.trim()) { setLanguages(p => [...p, langInput.trim()]); setLangInput(''); }}}>+ Add</button></div>
                  <div className="ft-dark-chips" style={{ marginBottom:20 }}>{languages.map((l,i) => <span key={l+i} className="ft-dark-chip">{l}<button type="button" className="ft-dark-chip-x" onClick={() => setLanguages(p => p.filter((_,idx) => idx !== i))}>×</button></span>)}</div>
                  <div className="ft-dark-section-label" style={{ marginBottom:10 }}>Interests</div>
                  <div className="ft-chip-input-row" style={{ marginBottom:4 }}><input className="ft-dark-input" value={hobbyInput} onChange={e => setHobbyInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && hobbyInput.trim()) { setHobbies(p => [...p, hobbyInput.trim()]); setHobbyInput(''); e.preventDefault(); }}} placeholder="Add an interest…" /><button type="button" className="ft-add-btn" onClick={() => { if (hobbyInput.trim()) { setHobbies(p => [...p, hobbyInput.trim()]); setHobbyInput(''); }}}>+ Add</button></div>
                  <div className="ft-dark-chips">{hobbies.map((h,i) => <span key={h+i} className="ft-dark-chip">{h}<button type="button" className="ft-dark-chip-x" onClick={() => setHobbies(p => p.filter((_,idx) => idx !== i))}>×</button></span>)}</div>
                </div>
                <div className="ft-sheet-save-row"><button type="button" className="ft-sheet-save-btn" onClick={() => setMobileSheet(null)}>Done</button></div></>
              )}

              {mobileSheet === 'prefs' && (
  <>
    <div style={{ padding:'0 20px 14px', flexShrink:0 }}>
      <div className="ft-sheet-title">Work Preferences</div>
    </div>
    <div className="ft-sheet-body">
      <div style={{ display:'grid', gap:14 }}>
        <div className="ft-dark-field">
          <label className="ft-dark-label">Work Status</label>
          <select className="ft-dark-select" value={prefWorkStatus} onChange={e => setPrefWorkStatus(e.target.value)}>
            <option value="">Select…</option>
            <option>Actively Looking</option>
            <option>Open to Offers</option>
            <option>Not Looking</option>
          </select>
        </div>

        <div className="ft-dark-field">
          <label className="ft-dark-label">Work Type</label>
          <select className="ft-dark-select" value={prefWorkType} onChange={e => setPrefWorkType(e.target.value)}>
            <option value="">Select…</option>
            <option>Remote</option>
            <option>Hybrid</option>
            <option>On-site</option>
          </select>
        </div>

        <div className="ft-dark-field">
          <label className="ft-dark-label">Schedule</label>
          <select className="ft-dark-select" value={prefSchedule} onChange={e => setPrefSchedule(e.target.value)}>
            <option value="">Select…</option>
            <option>Full-time</option>
            <option>Part-time</option>
            <option>Contract</option>
            <option>Freelance</option>
          </select>
        </div>

        <div className="ft-dark-field">
          <label className="ft-dark-label">Willing to Relocate</label>
          <select className="ft-dark-select" value={prefWillingToRelocate} onChange={e => setPrefWillingToRelocate(e.target.value)}>
            <option value="">Select…</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
            <option value="Maybe">Maybe</option>
          </select>
        </div>

        <div className="ft-dark-field">
          <label className="ft-dark-label">Earliest Start Date</label>
          <input className="ft-dark-input" type="date" value={prefStartDate} onChange={e => setPrefStartDate(e.target.value)} />
        </div>

        <div className="ft-dark-field">
          <label className="ft-dark-label">Schedule Availability</label>
          <select className="ft-dark-select" value={prefScheduleAvailability} onChange={e => setPrefScheduleAvailability(e.target.value)}>
            <option value="">Select…</option>
            <option>Any</option>
            <option>Weekdays</option>
            <option>Weekends</option>
            <option>Flexible</option>
          </select>
        </div>

        <div className="ft-dark-field">
          <label className="ft-dark-label">Preferred Locations</label>
          <div className="ft-chip-input-row" style={{ marginTop:6 }}>
            <input
              className="ft-dark-input"
              value={prefLocationInput}
              onChange={e => setPrefLocationInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && prefLocationInput.trim()) {
                  setPrefLocations(p => [...p, prefLocationInput.trim()]);
                  setPrefLocationInput('');
                  e.preventDefault();
                }
              }}
              placeholder="e.g. Nashville, TN"
            />
            <button
              type="button"
              className="ft-add-btn"
              onClick={() => {
                if (prefLocationInput.trim()) {
                  setPrefLocations(p => [...p, prefLocationInput.trim()]);
                  setPrefLocationInput('');
                }
              }}
            >
              Add
            </button>
          </div>

          <div className="ft-dark-chips">
            {prefLocations.map((loc, i) => (
              <span key={loc + i} className="ft-dark-chip">
                {loc}
                <button
                  type="button"
                  className="ft-dark-chip-x"
                  onClick={() => setPrefLocations(p => p.filter((_, idx) => idx !== i))}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>

    <div className="ft-sheet-save-row">
      <button type="button" className="ft-sheet-save-btn" onClick={() => setMobileSheet(null)}>
        Done
      </button>
    </div>
  </>
)}

        {/* ══ RESUME SELECTOR MODAL ══ */}
        {resumeModalOpen && (
          <div className="ft-modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setResumeModalOpen(false); }}>
            <div className="ft-modal">
              <div className="ft-modal-head">
                <div>
                  <div className="ft-modal-title">Select Primary Resume</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                    Recruiters see your primary resume on your public portfolio
                  </div>
                </div>
                <button type="button" className="ft-modal-close" onClick={() => setResumeModalOpen(false)}>✕</button>
              </div>

              <div className="ft-modal-body">
                {resumesLoading ? (
                  <div style={{ color: 'var(--muted)', fontSize: 13, fontWeight: 600, padding: '8px 0' }}>Loading your resumes…</div>
                ) : allResumes.length === 0 ? (
                  <div style={{ color: 'var(--muted)', fontSize: 13, fontStyle: 'italic', padding: '8px 0' }}>
                    No resumes found. Upload one in the resume builder.
                  </div>
                ) : allResumes.map(resume => (
                  <div key={resume.id} className={`ft-resume-row${resume.isPrimary ? ' primary' : ''}`}
                    onClick={() => !resume.isPrimary && setPrimaryResumeFn(resume.id)}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="ft-resume-name">{resume.name || 'Untitled Resume'}</div>
                      <div className="ft-resume-date">Updated {new Date(resume.updatedAt).toLocaleDateString()}</div>
                    </div>
                    {resume.isPrimary
                      ? <span className="ft-resume-primary-badge">Primary</span>
                      : <button type="button" className="ft-resume-set-btn" onClick={e => { e.stopPropagation(); setPrimaryResumeFn(resume.id); }}>Set Primary</button>
                    }
                  </div>
                ))}
              </div>

              <div className="ft-modal-foot">
                <a href="/resume/create" style={{ fontSize: 12, color: ORANGE, fontWeight: 700, textDecoration: 'none' }}>
                  + Upload new resume
                </a>
                <button type="button" className="ft-done-btn" onClick={() => setResumeModalOpen(false)}>Done</button>
              </div>
            </div>
          </div>
        )}
      </>
    </InternalLayout>
  );
}

// ─── ProfileStrengthRail — condensed dark-glass version of ProfileDevelopment ──
// Shows in the right rail during edit mode. Same logic, native dark skin.
function ProfileStrengthRail() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const ORANGE = '#FF7043';

  useEffect(() => {
    Promise.all([
      fetch('/api/profile/details').then(r => r.json()).catch(() => ({})),
      fetch('/api/profile/primaries').then(r => r.json()).catch(() => ({})),
    ]).then(([dJson, pJson]) => {
      const details      = dJson?.details || dJson || {};
      const primaryResume = pJson?.primaryResume || null;
      const headline     = String(details?.headline || '').trim();
      const aboutMe      = String(details?.aboutMe  || '').trim();
      const skills       = (Array.isArray(details?.skillsJson) ? details.skillsJson : []).filter(Boolean);
      const languages    = (Array.isArray(details?.languagesJson) ? details.languagesJson : []).filter(Boolean);

      const items = [
        { key: 'headline',  label: 'Headline',        done: headline.length >= 8   },
        { key: 'aboutMe',   label: 'Summary',         done: aboutMe.length >= 120  },
        { key: 'skills',    label: 'Skills (8+)',      done: skills.length >= 8     },
        { key: 'languages', label: 'Languages',        done: languages.length >= 1  },
        { key: 'resume',    label: 'Primary resume',   done: Boolean(primaryResume) },
      ];

      const completed = items.filter(i => i.done).length;
      setData({ items, completed, total: items.length });
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ padding: '16px', color: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: 600 }}>
      Checking profile strength…
    </div>
  );

  if (!data) return null;

  const pct = Math.round((data.completed / data.total) * 100);

  return (
    <div className="ft-ai-rail" style={{ padding: '0 2px' }}>
      <div className="ft-ai-rail-head">Profile Strength</div>

      {/* Progress */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>
            {data.completed} of {data.total} complete
          </span>
          <span style={{ fontSize: 11, color: ORANGE, fontWeight: 800 }}>{pct}%</span>
        </div>
        <div className="ft-ai-progress-bar">
          <div className="ft-ai-progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Checklist items */}
      {data.items.map(item => (
        <div key={item.key} className={`ft-ai-item${item.done ? ' complete' : ''}`}>
          <div className="ft-ai-item-top">
            <span className="ft-ai-item-title">{item.label}</span>
            <span className={`ft-ai-item-status ${item.done ? 'ok' : 'gap'}`}>
              {item.done ? '✓ Done' : 'Gap'}
            </span>
          </div>
          {!item.done && (
            <a href="/profile/edit" style={{ textDecoration: 'none' }}>
              <button type="button" className="ft-ai-assist-btn">
                <svg width="11" height="11" fill="none" viewBox="0 0 12 12">
                  <path d="M6 1l1.2 3.6H11L8.4 6.8l1 3.2L6 8l-3.4 2 1-3.2L1 4.6h3.8L6 1z" fill="currentColor"/>
                </svg>
                AI Assist
              </button>
            </a>
          )}
        </div>
      ))}

      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', lineHeight: 1.55, paddingTop: 4 }}>
        AI suggestions are based on your stored profile and primary resume. For deeper strategy, work with a coach in Spotlight.
      </div>
    </div>
  );
}

function SkillsViewCard({ skills }) {
  return (
    <div className="ft-card">
      <div className="ft-card-inner">
        <p className="ft-section-label">Skills</p>
        <div style={{ maxHeight: 180, overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,112,67,0.3) transparent' }}>
          <div className="ft-skill-grid">
            {skills.map((s, i) => (
              <div key={s} className={`ft-skill-item${i < 3 ? ' accent' : ''}`}>{s}</div>
            ))}
          </div>
        </div>
        {skills.length > 6 && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.30)', marginTop: 8, fontWeight: 600 }}>
            Scroll to see all {skills.length} skills
          </div>
        )}
      </div>
    </div>
  );
}

function SkillsEditCard({ skills, setSkills, skillInput, setSkillInput }) {
  return (
    <div className="ft-dark-card">
      <div className="ft-dark-card-inner">
        <div className="ft-dark-section-label">Skills</div>
        <div className="ft-chip-input-row">
          <input className="ft-dark-input" value={skillInput} onChange={e => setSkillInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && skillInput.trim()) { setSkills(p => [...p, skillInput.trim()]); setSkillInput(''); e.preventDefault(); }}}
            placeholder="Add a skill…" />
          <button type="button" className="ft-add-btn" onClick={() => { if (skillInput.trim()) { setSkills(p => [...p, skillInput.trim()]); setSkillInput(''); }}}>+ Add</button>
        </div>
        {skills.length > 0 && (
          <div style={{ maxHeight: 220, overflowY: 'auto', paddingRight: 4, scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,112,67,0.3) transparent' }}>
            <div className="ft-dark-chips">
              {skills.map((s, i) => (
                <span key={s+i} className="ft-dark-chip">{s}
                  <button type="button" className="ft-dark-chip-x" onClick={() => setSkills(p => p.filter((_,idx) => idx !== i))}>×</button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LangEditCard({ languages, setLanguages, langInput, setLangInput }) {
  return (
    <div className="ft-dark-card">
      <div className="ft-dark-card-inner">
        <div className="ft-dark-section-label">Languages</div>
        <div className="ft-chip-input-row">
          <input className="ft-dark-input" value={langInput} onChange={e => setLangInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && langInput.trim()) { setLanguages(p => [...p, langInput.trim()]); setLangInput(''); e.preventDefault(); }}}
            placeholder="Add a language…" />
          <button type="button" className="ft-add-btn" onClick={() => { if (langInput.trim()) { setLanguages(p => [...p, langInput.trim()]); setLangInput(''); }}}>+ Add</button>
        </div>
        {languages.length > 0 && (
          <div className="ft-dark-chips">
            {languages.map((l, i) => (
              <span key={l+i} className="ft-dark-chip">{l}
                <button type="button" className="ft-dark-chip-x" onClick={() => setLanguages(p => p.filter((_,idx) => idx !== i))}>×</button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InterestsEditCard({ hobbies, setHobbies, hobbyInput, setHobbyInput }) {
  return (
    <div className="ft-dark-card">
      <div className="ft-dark-card-inner">
        <div className="ft-dark-section-label">Interests</div>
        <div className="ft-chip-input-row">
          <input className="ft-dark-input" value={hobbyInput} onChange={e => setHobbyInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && hobbyInput.trim()) { setHobbies(p => [...p, hobbyInput.trim()]); setHobbyInput(''); e.preventDefault(); }}}
            placeholder="Add an interest…" />
          <button type="button" className="ft-add-btn" onClick={() => { if (hobbyInput.trim()) { setHobbies(p => [...p, hobbyInput.trim()]); setHobbyInput(''); }}}>+ Add</button>
        </div>
        {hobbies.length > 0 && (
          <div className="ft-dark-chips">
            {hobbies.map((h, i) => (
              <span key={h+i} className="ft-dark-chip">{h}
                <button type="button" className="ft-dark-chip-x" onClick={() => setHobbies(p => p.filter((_,idx) => idx !== i))}>×</button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EducationEditCard({ education, setEducation, eduDraft, setEduDraft, blankEdu }) {
  return (
    <div className="ft-dark-card">
      <div className="ft-dark-card-inner">
        <div className="ft-dark-section-label">Education</div>
        {education.map((edu, idx) => (
          <div key={idx} className="ft-edu-dark-item">
            <button type="button" className="ft-edu-dark-del" onClick={() => setEducation(p => p.filter((_,i) => i !== idx))}>Remove</button>
            <div style={{ color:'var(--white)', fontWeight:700, fontSize:14 }}>{edu.school || 'School'}</div>
            {edu.degree && <div style={{ fontSize:12, color:'var(--forge-muted)', marginTop:3 }}>{edu.degree}{edu.field ? ` — ${edu.field}` : ''}</div>}
            {(edu.startYear || edu.endYear) && <div style={{ fontSize:12, color:'var(--forge-muted)', marginTop:2 }}>{[edu.startYear, edu.endYear].filter(Boolean).join(' – ')}</div>}
          </div>
        ))}
        <div style={{ display:'grid', gap:10, paddingTop: education.length ? 16 : 0, borderTop: education.length ? '1px solid rgba(255,255,255,0.08)' : 'none', marginTop: education.length ? 8 : 0 }}>
          <div className="ft-dark-grid-2">
            <div className="ft-dark-field"><label className="ft-dark-label">School</label><input className="ft-dark-input" value={eduDraft.school} onChange={e => setEduDraft(p => ({...p, school:e.target.value}))} placeholder="University / College" /></div>
            <div className="ft-dark-field"><label className="ft-dark-label">Degree</label><input className="ft-dark-input" value={eduDraft.degree} onChange={e => setEduDraft(p => ({...p, degree:e.target.value}))} placeholder="BS, BA, Diploma…" /></div>
            <div className="ft-dark-field"><label className="ft-dark-label">Field of Study</label><input className="ft-dark-input" value={eduDraft.field} onChange={e => setEduDraft(p => ({...p, field:e.target.value}))} placeholder="Computer Science…" /></div>
            <div className="ft-dark-field">
              <label className="ft-dark-label">Years</label>
              <div style={{ display:'flex', gap:8 }}>
                <input className="ft-dark-input" value={eduDraft.startYear} onChange={e => setEduDraft(p => ({...p, startYear:e.target.value}))} placeholder="2018" style={{ flex:1 }} />
                <input className="ft-dark-input" value={eduDraft.endYear}   onChange={e => setEduDraft(p => ({...p, endYear:e.target.value}))}   placeholder="2022" style={{ flex:1 }} />
              </div>
            </div>
          </div>
          <button type="button" className="ft-add-btn" style={{ justifySelf:'start' }}
            onClick={() => { if (!eduDraft.school.trim()) return; setEducation(p => [...p, {...eduDraft}]); setEduDraft(blankEdu()); }}>
            + Add Education
          </button>
        </div>
      </div>
    </div>
  );
}

function BannerSection({ editMode, bannerImage, bannerPos, resolvedBannerHeight, coverUrl, setCoverUrl, wallpaperUrl, setWallpaperUrl, bannerMode, setBannerMode, bannerH, setBannerH, focalY, setFocalY }) {
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
            <button type="button" className="ft-banner-edit-btn">{showPanel ? 'Close' : '✎ Change banner'}</button>
          </div>
        )}
      </div>
      {editMode && showPanel && (
        <div className="ft-banner-panel">
          <div className="ft-panel-label">Portfolio banner</div>
          <div className="ft-asset-rail" style={{ marginBottom:12 }}>
            <button type="button" className={`ft-asset-none${!coverUrl ? ' selected' : ''}`} onClick={() => setCoverUrl('')}>None</button>
            {profileBanners.map(b => (
              <button key={b.key} type="button" className={`ft-asset-chip${coverUrl === b.src ? ' selected' : ''}`} onClick={() => setCoverUrl(b.src)}>
                <img src={b.src} alt={b.name} />
              </button>
            ))}
          </div>
          {coverUrl && (
            <div style={{ display:'grid', gap:10, marginBottom:16 }}>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <span style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.60)' }}>Mode</span>
                {['cover','fit'].map(m => (
                  <button key={m} type="button" onClick={() => setBannerMode(m)}
                    style={{ padding:'4px 12px', borderRadius:999, fontFamily:'inherit', border:`1px solid ${bannerMode === m ? ORANGE : 'rgba(255,255,255,0.20)'}`, background: bannerMode === m ? 'rgba(255,112,67,0.18)' : 'rgba(255,255,255,0.08)', color: bannerMode === m ? ORANGE : 'rgba(255,255,255,0.60)', fontSize:12, fontWeight:700, cursor:'pointer', textTransform:'capitalize' }}>
                    {m}
                  </button>
                ))}
              </div>
              <div className="ft-slider-row"><div className="ft-slider-label">Height — {bannerH}px</div><input type="range" min={80} max={400} value={bannerH} className="ft-slider" onChange={e => setBannerH(Number(e.target.value))} /></div>
              {bannerMode === 'cover' && <div className="ft-slider-row"><div className="ft-slider-label">Vertical focus — {focalY}%</div><input type="range" min={0} max={100} value={focalY} className="ft-slider" onChange={e => setFocalY(Number(e.target.value))} /></div>}
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

function IdentitySection({ editMode, avatarUrl, avatarUploading, initials, fullName, pronouns, setPronouns, headline, setHeadline, location, setLocation, status, setStatus, slug, profileUrl, copied, handleCopyProfileUrl, primaryResume, effectiveVisibility, isOwner, onEditClick, fileInputRef, handleAvatarFileChange, handleAvatarRemove, setAvatarUrl, AvatarWrap, socialLinks, updateSocial, openResumeModal }) {
  const [showAvatarPanel, setShowAvatarPanel] = useState(false);
  useEffect(() => { if (!editMode) setShowAvatarPanel(false); }, [editMode]);
  return (
    <div className={`ft-identity animate-fade-up delay-1${editMode ? ' editing' : ''}`}>
      <div style={{ position:'relative', flexShrink:0 }}>
        {editMode ? (
          <div className="ft-avatar-ring" style={{ cursor:'pointer' }} onClick={() => setShowAvatarPanel(v => !v)}>
            {avatarUrl ? <img className="ft-avatar" src={avatarUrl} alt="Portfolio photo" /> : <div style={{ width:'100%', height:'100%', borderRadius:'50%', display:'grid', placeItems:'center', background:`linear-gradient(135deg, ${ORANGE}, #F4511E)`, color:'#fff', fontWeight:900, fontSize:28 }}>{initials}</div>}
            <div className="ft-avatar-edit-overlay"><span style={{ fontSize:20 }}>↑</span><span>Change photo</span></div>
          </div>
        ) : (
          <AvatarWrap>
            <div className="ft-avatar-ring">
              {avatarUrl ? <img className="ft-avatar" src={avatarUrl} alt={`${fullName} portfolio photo`} /> : <div style={{ width:'100%', height:'100%', borderRadius:'50%', display:'grid', placeItems:'center', background:`linear-gradient(135deg, ${ORANGE}, #F4511E)`, color:'#fff', fontWeight:900, fontSize:28 }}>{initials}</div>}
            </div>
          </AvatarWrap>
        )}
        {editMode && showAvatarPanel && (
          <div className="ft-avatar-panel">
            <div className="ft-panel-label">Portfolio photo</div>
            <div className="ft-avatar-row">
              <button type="button" className="ft-avatar-action" onClick={() => fileInputRef.current?.click()} disabled={avatarUploading} style={{ border:'2px dashed rgba(255,112,67,0.55)', background:'rgba(255,112,67,0.08)', color:ORANGE }}>
                <span className="ai">{avatarUploading ? '◌' : '↑'}</span><span className="al">Upload</span>
              </button>
              {PRESET_AVATARS.map(opt => (
                <button key={opt.url} type="button" className={`ft-avatar-option${avatarUrl === opt.url ? ' selected' : ''}`} onClick={() => { setAvatarUrl(opt.url); setShowAvatarPanel(false); }}>
                  <img src={opt.url} alt={opt.label} />
                </button>
              ))}
              {avatarUrl && (
                <button type="button" className="ft-avatar-action" onClick={() => { handleAvatarRemove(); setShowAvatarPanel(false); }} style={{ border:'2px solid rgba(211,47,47,0.35)', background:'rgba(211,47,47,0.08)', color:'#EF9A9A' }}>
                  <span className="ai">✕</span><span className="al">Remove</span>
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleAvatarFileChange} />
            </div>
          </div>
        )}
        {/* FT member micro-tag — swap for ID.me verified badge when identity verification is wired */}
        <div style={{ textAlign:'center', marginTop:8, fontSize:10, fontWeight:700,
          letterSpacing:'0.08em', color:'rgba(255,255,255,0.28)', textTransform:'uppercase' }}>
          ForgeTomorrow
        </div>
      </div>

      <div className="ft-identity-info">
        <h1 className="ft-name">{fullName}</h1>
        {editMode ? <div style={{ marginTop:6 }}><input className="ft-inline-input" value={pronouns} onChange={e => setPronouns(e.target.value)} placeholder="Pronouns (e.g. they/them)" style={{ fontSize:11, letterSpacing:'0.10em', textTransform:'uppercase' }} /></div> : pronouns ? <p className="ft-pronouns">{pronouns}</p> : null}
        {editMode ? <div style={{ marginTop:10 }}><input className="ft-inline-input" value={headline} onChange={e => setHeadline(e.target.value)} placeholder="Your headline — role, company, mission" maxLength={160} style={{ fontSize:15 }} /></div> : headline ? <p className="ft-headline">{headline}</p> : null}
        {editMode ? (
          <div style={{ display:'flex', gap:8, marginTop:12, flexWrap:'wrap' }}>
            <input className="ft-inline-input" value={location} onChange={e => setLocation(e.target.value)} placeholder="Location" style={{ flex:1, minWidth:140, fontSize:12 }} />
          </div>
        ) : (
          <div className="ft-meta-row">
            {location && <span className="ft-meta-chip"><svg width="11" height="13" fill="none" viewBox="0 0 11 13" style={{ opacity:0.75 }}><path d="M5.5 0A4.5 4.5 0 001 4.5C1 8.25 5.5 13 5.5 13S10 8.25 10 4.5A4.5 4.5 0 005.5 0zm0 6.25A1.75 1.75 0 113.75 4.5 1.752 1.752 0 015.5 6.25z" fill="currentColor" /></svg>{location}</span>}
          </div>
        )}
        {editMode && (
          <div className="ft-social-grid" style={{ marginTop:14 }}>
            {SOCIAL_FIELDS.map(f => (
              <div key={f.key} className="ft-social-row">
                <span className="ft-social-icon">{f.icon}</span>
                <input className="ft-inline-input" type="url" value={socialLinks[f.key] || ''} onChange={e => updateSocial(f.key, e.target.value)} placeholder={f.placeholder} style={{ fontSize:12 }} />
              </div>
            ))}
          </div>
        )}
        <div className="ft-actions-row">
          {/* URL pill — shrinks to fit, doesn't flex-grow */}
          <span className="ft-url-pill" style={{ flex: '0 1 auto', minWidth: 0, maxWidth: 280 }}>{profileUrl}</span>

          {/* Copy Link — compact, fixed width */}
          <button className="ft-copy-btn" type="button" onClick={handleCopyProfileUrl} style={{ flexShrink: 0 }}>
            <svg width="13" height="13" fill="none" viewBox="0 0 13 13"><rect x="4" y="4" width="8" height="8" rx="1.5" stroke="white" strokeWidth="1.4" /><path d="M3 9H2a1 1 0 01-1-1V2a1 1 0 011-1h6a1 1 0 011 1v1" stroke="white" strokeWidth="1.4" /></svg>
            {copied ? 'Copied' : 'Copy Link'}
          </button>

          {/* Edit mode: Select Resume CTA */}
          {editMode && (
            <button type="button" className="ft-resume-top-btn" onClick={openResumeModal} style={{ flexShrink: 0 }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 14 14"><path d="M2 4h10M2 7h7M2 10h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
              Select Resume
            </button>
          )}

          {/* View mode owner: Edit Portfolio */}
          {isOwner && !editMode && (
            <button type="button" className="ft-edit-portfolio-btn" onClick={onEditClick} style={{ flexShrink: 0 }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 14 14"><path d="M9.916 1.75a1.237 1.237 0 011.75 1.75l-6.5 6.5-2.333.583.583-2.333 6.5-6.5z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /><path d="M8.75 2.917l2.333 2.333" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Edit Portfolio
            </button>
          )}

          {/* View mode: Download primary resume */}
          {primaryResume && !editMode && (
            <a className="ft-resume-top-btn" href={`/api/resume/public-download?resumeId=${encodeURIComponent(primaryResume.id)}&slug=${encodeURIComponent(slug)}`} target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0 }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 14 14"><path d="M7 1v8M4 7l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Download Resume
            </a>
          )}
        </div>
        {effectiveVisibility === 'PUBLIC' && !editMode && (
          <span className="ft-visibility-pill">
            <svg width="10" height="10" fill="none" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.2" /><path d="M1 5h8M5 1c-1.5 1.2-2 2.5-2 4s.5 2.8 2 4M5 1c1.5 1.2 2 2.5 2 4s-.5 2.8-2 4" stroke="currentColor" strokeWidth="1.2" /></svg>
            Public portfolio
          </span>
        )}
      </div>
    </div>
  );
}

function SaveStatusIndicator({ state }) {
  const map = {
    idle:   { dot:'rgba(255,255,255,0.20)', text:'Changes save automatically', color:'rgba(255,255,255,0.35)' },
    saving: { dot:'#FFB74D', text:'Saving…',           color:'rgba(255,255,255,0.55)' },
    saved:  { dot:'#66BB6A', text:'All changes saved', color:'rgba(255,255,255,0.55)' },
    error:  { dot:'#EF5350', text:'Save failed',       color:'#EF9A9A'                 },
  };
  const c = map[state] || map.idle;
  return (
    <div className="ft-save-status">
      <div className="ft-save-dot" style={{ background:c.dot }} />
      <span style={{ color:c.color }}>{c.text}</span>
    </div>
  );
}