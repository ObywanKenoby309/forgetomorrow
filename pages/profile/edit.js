// pages/profile/edit.js  —  ForgeTomorrow Portfolio Editor (v3 + surgical fixes)
// ─────────────────────────────────────────────────────────────────────────────
// Surgical changes from v3:
//   FIX 1: Grid alignment — removed marginTop:-18, right rail top:0 (was top:2)
//   FIX 2: Avatar order — Upload first, presets middle, Remove last
//   FIX 3: Mobile — larger touch targets, horizontal avatar scroll, mobile padding
//   FIX 4: "Profile" → "Portfolio" in all user-facing text (no path changes)
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';

// ── Existing section components ───────────────────────────────────────────────
import ProfileAbout from '@/components/profile/ProfileAbout';
import ProfileSkills from '@/components/profile/ProfileSkills';
import ProfileLanguages from '@/components/profile/ProfileLanguages';
import ProfilePreferences from '@/components/profile/ProfilePreferences';
import ProfileEducation from '@/components/profile/ProfileEducation';
import ProfileHobbies from '@/components/profile/ProfileHobbies';
import ProfileResumeAttach from '@/components/profile/ProfileResumeAttach';
import LivePreviewCard from '@/components/profile/LivePreviewCard';
import MobilePreviewStrip from '@/components/profile/MobilePreviewStrip';
import ProfileCertifications from '@/components/profile/ProfileCertifications';
import ProfileProjects from '@/components/profile/ProfileProjects';

// ── Asset libraries ───────────────────────────────────────────────────────────
import { profileBanners } from '@/lib/profileBanners';
import { profileWallpapers } from '@/lib/profileWallpapers';

// ── Hooks ─────────────────────────────────────────────────────────────────────
import { useCurrentUserAvatar } from '@/hooks/useCurrentUserAvatar';

// ─── Constants ────────────────────────────────────────────────────────────────
const ORANGE = '#FF7043';
const GAP = 14;
const RIGHT_COL_WIDTH = 280;
const SAVE_DELAY = 900;

const GLASS = {
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.58)',
  boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};

const DARK_RAIL = {
  background: '#2a2a2a',
  border: '1px solid #3a3a3a',
  borderRadius: 12,
  padding: 16,
  boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
  boxSizing: 'border-box',
  overflow: 'hidden',
  alignSelf: 'start',
};

const PRESET_AVATARS = [
  { label: 'Default', url: '/profile-avatars/avatar-default-forge.png' },
  { label: 'Professional', url: '/profile-avatars/avatar-professional-path.png' },
  { label: 'Creator', url: '/profile-avatars/avatar-creator-spectrum.png' },
  { label: 'Tech', url: '/profile-avatars/avatar-tech-nexus.png' },
  { label: 'Coach', url: '/profile-avatars/avatar-coach-beacon.png' },
];

const SOCIAL_FIELDS = [
  { key: 'github', label: 'GitHub', placeholder: 'github.com/username', icon: '⌥' },
  { key: 'x', label: 'X', placeholder: 'x.com/username', icon: '✕' },
  { key: 'youtube', label: 'YouTube', placeholder: 'youtube.com/@channel', icon: '▶' },
  { key: 'instagram', label: 'Instagram', placeholder: 'instagram.com/username', icon: '◉' },
];

const TABS = [
  { id: 'style', label: "What's my style", icon: '◎' },
  { id: 'who', label: 'Who Am I', icon: '◈' },
  { id: 'bring', label: 'What I Bring', icon: '◇' },
  { id: 'been', label: "Where I've Been", icon: '◻' },
];

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
export default function ProfileEditPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const chrome = String(router.query.chrome || '').toLowerCase();
  const withChrome = (path) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

  const [isMobile, setIsMobile] = useState(true);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 900);
    fn();
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  const [activeTab, setActiveTab] = useState('style');
  const [serverLoaded, setServerLoaded] = useState(false);

  // ── Avatar ────────────────────────────────────────────────────────────────
  const { avatarUrl: resolvedAvatarUrl } = useCurrentUserAvatar();
  const sessionAvatarUrl = useMemo(() => {
    const u = session?.user || null;
    return u ? (u.avatarUrl || u.image || '') : '';
  }, [session]);

  const [avatarUrl, setAvatarUrl] = useState(sessionAvatarUrl || '');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef(null);

  // ── Identity / appearance ─────────────────────────────────────────────────
  const [name, setName] = useState(''); // READ-ONLY
  const [pronouns, setPronouns] = useState('');
  const [headline, setHeadline] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('');
  const [slug, setSlug] = useState('');
  const [visibility, setVisibility] = useState('private');
  const [coverUrl, setCoverUrl] = useState('');
  const [wallpaperUrl, setWallpaperUrl] = useState('');
  const [bannerH, setBannerH] = useState(220);
  const [bannerMode, setBannerMode] = useState('cover');
  const [focalY, setFocalY] = useState(50);

  // ── Social links ──────────────────────────────────────────────────────────
  const [socialLinks, setSocialLinks] = useState({
    github: '',
    x: '',
    youtube: '',
    instagram: '',
  });
  const updateSocial = (key, val) => setSocialLinks((prev) => ({ ...prev, [key]: val }));

  // ── Content ───────────────────────────────────────────────────────────────
  const [about, setAbout] = useState('');
  const [skills, setSkills] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [hobbies, setHobbies] = useState([]);
  const [education, setEducation] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [projects, setProjects] = useState([]);
  const [prefStatus, setPrefStatus] = useState('');
  const [prefWorkType, setPrefWorkType] = useState('');
  const [prefLocations, setPrefLocations] = useState([]);
  const [prefStart, setPrefStart] = useState('');
  const [prefRelocate, setPrefRelocate] = useState('');

  // ── Banner expand ─────────────────────────────────────────────────────────
  const [bannerMoreOpen, setBannerMoreOpen] = useState(false);
  const [wallpaperMoreOpen, setWallpaperMoreOpen] = useState(false);

  // ── Save indicator ────────────────────────────────────────────────────────
  const [saveState, setSaveState] = useState('idle');
  const saveTimerRef = useRef(null);

  // ─────────────────────────────────────────────────────────────────────────
  // Load from server
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [hRes, dRes] = await Promise.all([
          fetch('/api/profile/header'),
          fetch('/api/profile/details'),
        ]);

        if (hRes.ok) {
          const hData = await hRes.json();
          const hUser = hData.user || hData;
          if (!cancelled) {
            const fullName =
              hUser.name || [hUser.firstName, hUser.lastName].filter(Boolean).join(' ');
            setName(fullName || '');
            setPronouns(hUser.pronouns || '');
            setHeadline(hUser.headline || '');
            setSlug(hUser.slug || '');
            const serverAvatar = typeof hUser.avatarUrl === 'string' ? hUser.avatarUrl : '';
            setAvatarUrl(sessionAvatarUrl || resolvedAvatarUrl || serverAvatar || '');
            const corp = hData.corporateBanner || hUser.corporateBanner || null;
            setCoverUrl((corp?.bannerSrc) || hUser.coverUrl || '');
            setWallpaperUrl(hUser.wallpaperUrl || '');
            setBannerH(clamp(hUser.bannerHeight ?? 220, 80, 400));
            setBannerMode(hUser.bannerMode === 'fit' ? 'fit' : 'cover');
            setFocalY(clamp(hUser.bannerFocalY ?? 50, 0, 100));

            const pv = String(hUser.profileVisibility || '').toUpperCase();
            setVisibility(
              pv === 'PUBLIC'
                ? 'public'
                : pv === 'RECRUITERS_ONLY'
                ? 'recruiters'
                : hUser.isProfilePublic
                ? 'public'
                : 'private'
            );

            if (hUser.socialLinks && typeof hUser.socialLinks === 'object') {
              setSocialLinks((prev) => ({ ...prev, ...hUser.socialLinks }));
            }
          }
        }

        if (dRes.ok) {
          const dData = await dRes.json();
          const u = dData.user || dData.details || dData || {};
          if (!cancelled) {
            if (typeof u.location === 'string') setLocation(u.location);
            if (typeof u.status === 'string') setStatus(u.status);
            if (typeof u.aboutMe === 'string') setAbout(u.aboutMe);

            const wp = u.workPreferences || {};
            if (wp.workStatus) setPrefStatus(wp.workStatus);
            if (wp.workType) setPrefWorkType(wp.workType);
            if (Array.isArray(wp.locations)) setPrefLocations(wp.locations);
            if (wp.startDate) setPrefStart(wp.startDate);
            if (typeof wp.willingToRelocate === 'boolean') {
              setPrefRelocate(wp.willingToRelocate ? 'Yes' : 'No');
            }

            if (Array.isArray(u.skillsJson)) setSkills(u.skillsJson);
            if (Array.isArray(u.languagesJson)) setLanguages(u.languagesJson);
            if (Array.isArray(u.hobbiesJson)) setHobbies(u.hobbiesJson);
            if (Array.isArray(u.educationJson)) setEducation(u.educationJson);
            if (Array.isArray(u.certificationsJson)) setCertifications(u.certificationsJson);
            if (Array.isArray(u.projectsJson)) setProjects(u.projectsJson);
          }
        }
      } catch (err) {
        console.error('Failed to load portfolio:', err);
      } finally {
        if (!cancelled) setServerLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionAvatarUrl, resolvedAvatarUrl]);

  // ─────────────────────────────────────────────────────────────────────────
  // Debounced save
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!serverLoaded) return;
    if (avatarUrl.startsWith('data:')) return;

    const controller = new AbortController();
    setSaveState('saving');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(async () => {
      try {
        const cleanSlug = slug.trim().toLowerCase().replace(/\s+/g, '-');
        const profileVisibility =
          visibility === 'public'
            ? 'PUBLIC'
            : visibility === 'recruiters'
            ? 'RECRUITERS_ONLY'
            : 'PRIVATE';

        const [hRes, dRes] = await Promise.all([
          fetch('/api/profile/header', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              avatarUrl: avatarUrl || null,
              coverUrl: coverUrl || null,
              wallpaperUrl: wallpaperUrl || null,
              bannerMode,
              bannerHeight: bannerH,
              bannerFocalY: focalY,
              slug: cleanSlug,
              profileVisibility,
              isProfilePublic: profileVisibility === 'PUBLIC',
              socialLinks,
            }),
            signal: controller.signal,
          }),
          fetch('/api/profile/details', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pronouns,
              headline,
              location,
              status,
              avatarUrl: avatarUrl || null,
              coverUrl: coverUrl || null,
              aboutMe: about || '',
              workPreferences: {
                workStatus: prefStatus || '',
                workType: prefWorkType || '',
                locations: prefLocations || [],
                startDate: prefStart || '',
                willingToRelocate:
                  prefRelocate === 'Yes' ? true : prefRelocate === 'No' ? false : null,
              },
              skillsJson: skills || [],
              languagesJson: languages || [],
              hobbiesJson: hobbies || [],
              educationJson: education || [],
              certificationsJson: certifications || [],
              projectsJson: projects || [],
            }),
            signal: controller.signal,
          }),
        ]);

        if (hRes.ok && dRes.ok) {
          setSaveState('saved');
          setTimeout(() => setSaveState('idle'), 2500);

          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('profileHeaderUpdated', {
                detail: { wallpaperUrl: wallpaperUrl || null },
              })
            );
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
    serverLoaded,
    pronouns,
    headline,
    location,
    status,
    slug,
    visibility,
    avatarUrl,
    coverUrl,
    wallpaperUrl,
    bannerMode,
    bannerH,
    focalY,
    socialLinks,
    about,
    prefStatus,
    prefWorkType,
    prefRelocate,
    prefLocations,
    prefStart,
    skills,
    languages,
    hobbies,
    education,
    certifications,
    projects,
  ]);

  // ─────────────────────────────────────────────────────────────────────────
  // Avatar upload — optimistic blob preview
  // ─────────────────────────────────────────────────────────────────────────
  const handleAvatarFileChange = useCallback(
    async (e) => {
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
          if (typeof dataUrl !== 'string') throw new Error('Failed to read image.');

          setAvatarUrl(dataUrl); // ✅ Optimistic — show immediately

          const res = await fetch('/api/profile/avatar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ avatarDataUrl: dataUrl }),
          });

          const json = await res.json();
          if (!res.ok) {
            alert(json.error || 'Failed to upload photo.');
            setAvatarUrl(sessionAvatarUrl || resolvedAvatarUrl || '');
            return;
          }

          setAvatarUrl(json.avatarUrl || ''); // ✅ Replace blob with CDN URL
        } catch (err) {
          alert('Something went wrong uploading your photo.');
          setAvatarUrl(sessionAvatarUrl || resolvedAvatarUrl || '');
        } finally {
          setAvatarUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };

      reader.readAsDataURL(file);
    },
    [sessionAvatarUrl, resolvedAvatarUrl]
  );

  const handleAvatarRemove = useCallback(async () => {
    const res = await fetch('/api/profile/avatar', { method: 'DELETE' });
    if (!res.ok) {
      alert('Failed to remove photo.');
      return;
    }
    setAvatarUrl('');
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────
  const initials = useMemo(() => {
    const n = String(name || '').trim();
    if (!n) return 'FT';
    const parts = n.split(/\s+/).filter(Boolean);
    return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || 'FT';
  }, [name]);

  const profileUrl = slug ? `https://forgetomorrow.com/u/${slug}` : null;
  const bannerPos = `center ${focalY}%`;

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <Head>
        {/* FIX 4 — "Profile" → "Portfolio" in page title */}
        <title>Portfolio Editor | ForgeTomorrow</title>
      </Head>

      <style jsx global>{`
        /* ── Shared input theming for child components ── */
        .pe-section input[type='text'],
        .pe-section input[type='url'],
        .pe-section input[type='email'],
        .pe-section input[type='number'],
        .pe-section textarea,
        .pe-section select {
          background: rgba(255, 255, 255, 0.88) !important;
          border: 1px solid rgba(0, 0, 0, 0.12) !important;
          color: #1f2a33 !important;
          border-radius: 8px !important;
        }
        .pe-section input:focus,
        .pe-section textarea:focus,
        .pe-section select:focus {
          border-color: rgba(255, 112, 67, 0.55) !important;
          box-shadow: 0 0 0 3px rgba(255, 112, 67, 0.12) !important;
          outline: none !important;
        }
        .pe-tab-rail {
          display: flex;
          gap: 4px;
          overflow-x: auto;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
          padding-bottom: 2px;
        }
        .pe-tab-rail::-webkit-scrollbar {
          display: none;
        }
        .pe-tab-btn {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 9px 18px;
          border-radius: 999px;
          border: 1px solid rgba(0, 0, 0, 0.12);
          background: rgba(255, 255, 255, 0.74);
          color: #37474f;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
          font-family: inherit;
        }
        .pe-tab-btn:hover {
          background: rgba(255, 255, 255, 0.92);
          color: #1f2a33;
        }
        .pe-tab-btn.active {
          background: ${ORANGE};
          border-color: ${ORANGE};
          color: #fff;
          box-shadow: 0 4px 14px rgba(255, 112, 67, 0.35);
        }

        /* FIX 3 — Mobile: larger touch targets on tabs */
        @media (max-width: 899px) {
          .pe-tab-btn {
            padding: 11px 20px;
            font-size: 14px;
            min-height: 44px;
          }
        }

        .pe-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .pe-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: #455a64;
        }
        .pe-input,
        .pe-textarea,
        .pe-select {
          padding: 10px 12px;
          background: rgba(255, 255, 255, 0.88);
          border: 1px solid rgba(0, 0, 0, 0.12);
          border-radius: 8px;
          color: #1f2a33;
          font-size: 14px;
          font-family: inherit;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          width: 100%;
          box-sizing: border-box;
        }
        .pe-input:focus,
        .pe-textarea:focus,
        .pe-select:focus {
          border-color: rgba(255, 112, 67, 0.55);
          box-shadow: 0 0 0 3px rgba(255, 112, 67, 0.12);
        }
        .pe-input.locked {
          background: rgba(0, 0, 0, 0.04);
          color: #607d8b;
          cursor: not-allowed;
        }
        .pe-textarea {
          min-height: 90px;
          resize: vertical;
          line-height: 1.6;
        }
        .pe-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        .pe-grid-2 .full {
          grid-column: 1 / -1;
        }
        @media (max-width: 540px) {
          .pe-grid-2 {
            grid-template-columns: 1fr;
          }
          .pe-grid-2 .full {
            grid-column: 1;
          }
        }
        .pe-section-label {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: ${ORANGE};
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .pe-section-label::after {
          content: '';
          flex: 1;
          height: 1px;
          background: linear-gradient(to right, rgba(255, 112, 67, 0.25), transparent);
        }
        .pe-asset-rail {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
        }
        .pe-asset-chip {
          border-radius: 999px;
          padding: 2px;
          border: 2px solid transparent;
          background: white;
          cursor: pointer;
          transition: border-color 0.15s;
          flex-shrink: 0;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
        }
        .pe-asset-chip.selected {
          border-color: ${ORANGE};
        }
        .pe-asset-chip img {
          width: 64px;
          height: 32px;
          border-radius: 999px;
          object-fit: cover;
          display: block;
        }
        .pe-asset-btn {
          padding: 6px 14px;
          border-radius: 999px;
          border: 1px solid rgba(0, 0, 0, 0.14);
          background: rgba(255, 255, 255, 0.84);
          color: #37474f;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
          font-family: inherit;
        }
        .pe-asset-btn.selected {
          border-color: ${ORANGE};
          color: ${ORANGE};
          background: rgba(255, 112, 67, 0.06);
        }
        .pe-asset-btn:hover:not(.selected) {
          background: rgba(255, 255, 255, 0.96);
        }
        .pe-asset-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 10px;
          margin-top: 10px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.54);
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 10px;
        }
        .pe-asset-grid-item {
          border-radius: 10px;
          padding: 6px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          background: white;
          cursor: pointer;
          text-align: left;
          display: grid;
          gap: 5px;
          transition: border-color 0.15s;
          font-family: inherit;
        }
        .pe-asset-grid-item.selected {
          border-color: ${ORANGE};
          background: rgba(255, 112, 67, 0.04);
        }
        .pe-asset-grid-item img {
          width: 100%;
          height: 52px;
          object-fit: cover;
          border-radius: 6px;
          display: block;
        }
        .pe-asset-grid-item-name {
          font-size: 11px;
          font-weight: 700;
          color: #1f2a33;
        }
        .pe-asset-grid-item-desc {
          font-size: 10px;
          color: #546e7a;
          line-height: 1.35;
        }
        .pe-vis-group {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .pe-vis-pill {
          padding: 7px 16px;
          border-radius: 999px;
          border: 1px solid rgba(0, 0, 0, 0.14);
          background: rgba(255, 255, 255, 0.84);
          color: #37474f;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
          font-family: inherit;
        }
        .pe-vis-pill.active {
          background: ${ORANGE};
          border-color: ${ORANGE};
          color: #fff;
        }
        .pe-vis-pill:hover:not(.active) {
          background: rgba(255, 255, 255, 0.96);
          color: #1f2a33;
        }

        /* FIX 2 — Avatar option base styles */
        .pe-avatar-option {
          border-radius: 50%;
          padding: 2px;
          border: 2px solid transparent;
          background: transparent;
          cursor: pointer;
          transition: border-color 0.15s;
          flex-shrink: 0;
        }
        .pe-avatar-option.selected {
          border-color: ${ORANGE};
        }
        .pe-avatar-option img {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          object-fit: cover;
          display: block;
        }

        /* FIX 2 — Upload / Remove action buttons */
        .pe-avatar-action-btn {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1px;
          cursor: pointer;
          transition: all 0.15s;
          font-family: inherit;
          flex-shrink: 0;
        }
        .pe-avatar-action-btn .btn-icon {
          font-size: 15px;
          line-height: 1;
        }
        .pe-avatar-action-btn .btn-label {
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 0.03em;
          line-height: 1;
        }

        /* FIX 3 — Avatar row: horizontal scroll on mobile */
        .pe-avatar-row {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }
        @media (max-width: 899px) {
          .pe-avatar-row {
            flex-wrap: nowrap;
            overflow-x: auto;
            scrollbar-width: none;
            -webkit-overflow-scrolling: touch;
            padding-bottom: 6px;
          }
          .pe-avatar-row::-webkit-scrollbar {
            display: none;
          }
          .pe-avatar-option img {
            width: 52px;
            height: 52px;
          }
          .pe-avatar-action-btn {
            width: 52px;
            height: 52px;
          }
          .pe-avatar-action-btn .btn-icon {
            font-size: 17px;
          }
          .pe-avatar-action-btn .btn-label {
            font-size: 9px;
          }
        }

        .pe-slider {
          width: 100%;
          accent-color: ${ORANGE};
        }
        @keyframes pe-fade-in {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .pe-fade-in {
          animation: pe-fade-in 0.22s ease both;
        }
        @keyframes pe-spin {
          to {
            transform: rotate(360deg);
          }
        }
        .pe-spin {
          animation: pe-spin 0.8s linear infinite;
          display: inline-block;
        }

        /* Preview panel */
        .pe-preview-name {
          font-size: 15px;
          font-weight: 800;
          color: #f8f4ef;
          line-height: 1.2;
        }
        .pe-preview-chip {
          font-size: 9px;
          font-weight: 500;
          padding: 2px 8px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.16);
          color: rgba(248, 244, 239, 0.82);
        }
        .pe-preview-chip.orange {
          background: rgba(255, 112, 67, 0.2);
          border-color: rgba(255, 112, 67, 0.38);
          color: #ff7043;
        }
        .pe-preview-skill {
          font-size: 9px;
          font-weight: 500;
          padding: 2px 8px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: rgba(248, 244, 239, 0.8);
        }
      `}</style>

      <SeekerLayout title="Portfolio Editor | ForgeTomorrow" activeNav="profile">

        {/* ══════════════════════════════════════════════════════════════════════
            MOBILE RENDER — completely separate from desktop, native-app feel
            Glass/light aesthetic matching the app shell (not the dark portfolio)
            Bottom tab bar always visible, panels scroll independently
        ══════════════════════════════════════════════════════════════════════ */}
        {isMobile && (
          <MobileEditor
            // appearance
            avatarUrl={avatarUrl} avatarUploading={avatarUploading}
            initials={initials} coverUrl={coverUrl} wallpaperUrl={wallpaperUrl}
            bannerH={bannerH} bannerMode={bannerMode} focalY={focalY}
            bannerMoreOpen={bannerMoreOpen} wallpaperMoreOpen={wallpaperMoreOpen}
            setBannerMoreOpen={setBannerMoreOpen} setWallpaperMoreOpen={setWallpaperMoreOpen}
            setCoverUrl={setCoverUrl} setWallpaperUrl={setWallpaperUrl}
            setBannerH={setBannerH} setBannerMode={setBannerMode} setFocalY={setFocalY}
            fileInputRef={fileInputRef} handleAvatarFileChange={handleAvatarFileChange}
            handleAvatarRemove={handleAvatarRemove} setAvatarUrl={setAvatarUrl}
            // identity
            name={name} pronouns={pronouns} headline={headline}
            location={location} status={status} slug={slug} visibility={visibility}
            setPronouns={setPronouns} setHeadline={setHeadline}
            setLocation={setLocation} setStatus={setStatus}
            setSlug={setSlug} setVisibility={setVisibility}
            socialLinks={socialLinks} updateSocial={updateSocial}
            // content
            about={about} setAbout={setAbout}
            skills={skills} setSkills={setSkills}
            languages={languages} setLanguages={setLanguages}
            hobbies={hobbies} setHobbies={setHobbies}
            education={education} setEducation={setEducation}
            certifications={certifications} setCertifications={setCertifications}
            projects={projects} setProjects={setProjects}
            prefStatus={prefStatus} setPrefStatus={setPrefStatus}
            prefWorkType={prefWorkType} setPrefWorkType={setPrefWorkType}
            prefLocations={prefLocations} setPrefLocations={setPrefLocations}
            prefStart={prefStart} setPrefStart={setPrefStart}
            prefRelocate={prefRelocate} setPrefRelocate={setPrefRelocate}
            // meta
            saveState={saveState} profileUrl={profileUrl}
            bannerPos={bannerPos} withChrome={withChrome}
          />
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            DESKTOP RENDER — unchanged from v3+fixes
        ══════════════════════════════════════════════════════════════════════ */}
        {!isMobile && (
        <div style={{ width: '100%' }}>
          {/* ── Internal grid: content col + right rail ── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : `minmax(0,1fr) ${RIGHT_COL_WIDTH}px`,
              gap: GAP,
              width: '100%',
              alignItems: 'start',
            }}
          >
            {/* ══════════════════════════════════════════════════════════════
                COL 1 — Edit forms
            ══════════════════════════════════════════════════════════════ */}
            <div style={{ display: 'grid', gap: GAP, minWidth: 0 }}>
              {/* Title card — desktop only */}
              <section style={{ ...GLASS, padding: '18px 20px', textAlign: 'center' }}>
                {/* FIX 4 — "Profile Editor" → "Portfolio Editor" */}
                <h1 style={{ margin: 0, color: ORANGE, fontSize: 22, fontWeight: 900 }}>
                  Portfolio Editor
                </h1>

                <p
                  style={{
                    margin: '6px auto 0',
                    color: '#37474F',
                    fontSize: 13,
                    fontWeight: 700,
                    maxWidth: 500,
                  }}
                >
                  Avatar, banner, wallpaper — all update in the preview instantly
                </p>

                <div
                  style={{
                    marginTop: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    flexWrap: 'wrap',
                  }}
                >
                  <SaveIndicator state={saveState} />
                  {slug && (
                    <Link
                      href={`/u/${slug}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '7px 16px',
                        borderRadius: 999,
                        border: `1px solid rgba(255,112,67,0.40)`,
                        background: 'rgba(255,112,67,0.08)',
                        color: ORANGE,
                        fontSize: 12,
                        fontWeight: 700,
                        textDecoration: 'none',
                        minHeight: 40,
                      }}
                    >
                      {/* FIX 4 — "View live profile" → "View live portfolio" */}
                      View live portfolio →
                    </Link>
                  )}
                </div>
              </section>

              {/* Tab rail */}
              <div className="pe-tab-rail">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    className={`pe-tab-btn${activeTab === tab.id ? ' active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                    type="button"
                  >
                    <span style={{ fontSize: 11, opacity: 0.8 }}>{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* ── Tab: What's my style ── */}
              {activeTab === 'style' && (
                <div className="pe-fade-in" style={{ display: 'grid', gap: GAP }}>
                  {/* Avatar */}
                  <section className="pe-section" style={{ ...GLASS, padding: 20 }}>
                    {/* FIX 4 — "Profile photo" → "Portfolio photo" */}
                    <div className="pe-section-label">Portfolio photo</div>
                    <div
                      style={{
                        display: 'flex',
                        gap: 14,
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        marginBottom: 16,
                      }}
                    >
                      <div
                        style={{
                          width: 68,
                          height: 68,
                          borderRadius: '50%',
                          border: `3px solid ${ORANGE}`,
                          overflow: 'hidden',
                          flexShrink: 0,
                          background: 'rgba(0,0,0,0.06)',
                          position: 'relative',
                        }}
                      >
                        {avatarUploading && (
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              background: 'rgba(255,255,255,0.7)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              zIndex: 1,
                            }}
                          >
                            <span className="pe-spin" style={{ fontSize: 18, color: ORANGE }}>
                              ◌
                            </span>
                          </div>
                        )}

                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt="Current photo"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              display: 'block',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              display: 'grid',
                              placeItems: 'center',
                              background: `linear-gradient(135deg, ${ORANGE}, #F4511E)`,
                              color: '#fff',
                              fontWeight: 900,
                              fontSize: 20,
                            }}
                          >
                            {initials}
                          </div>
                        )}
                      </div>

                      <div>
                        <div
                          style={{ fontSize: 13, fontWeight: 700, color: '#1F2A33', marginBottom: 3 }}
                        >
                          Current photo
                        </div>
                        <div style={{ fontSize: 12, color: '#455A64', lineHeight: 1.5 }}>
                          Updates instantly when you pick a new one
                        </div>
                      </div>
                    </div>

                    {/*
                      FIX 2 — Order: Upload → Presets → Remove
                      FIX 3 — pe-avatar-row scrolls horizontally on mobile
                    */}
                    <div className="pe-avatar-row">

                      {/* 1. Upload — FIRST */}
                      <button
                        type="button"
                        className="pe-avatar-action-btn"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={avatarUploading}
                        title="Upload your own photo"
                        style={{
                          background: 'rgba(255,112,67,0.08)',
                          border: '2px dashed rgba(255,112,67,0.55)',
                          color: ORANGE,
                        }}
                      >
                        <span className="btn-icon">{avatarUploading ? '…' : '↑'}</span>
                        <span className="btn-label">{avatarUploading ? 'Wait' : 'Upload'}</span>
                      </button>

                      {/* 2. Presets — MIDDLE */}
                      {PRESET_AVATARS.map((opt) => (
                        <button
                          key={opt.url}
                          type="button"
                          className={`pe-avatar-option${avatarUrl === opt.url ? ' selected' : ''}`}
                          onClick={() => setAvatarUrl(opt.url)}
                          title={opt.label}
                        >
                          <img src={opt.url} alt={opt.label} />
                        </button>
                      ))}

                      {/* 3. Remove — LAST */}
                      {avatarUrl && (
                        <button
                          type="button"
                          className="pe-avatar-action-btn"
                          onClick={handleAvatarRemove}
                          title="Remove photo — use initials instead"
                          style={{
                            background: 'rgba(211,47,47,0.07)',
                            border: '2px solid rgba(211,47,47,0.28)',
                            color: '#C62828',
                          }}
                        >
                          <span className="btn-icon">✕</span>
                          <span className="btn-label">Remove</span>
                        </button>
                      )}

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleAvatarFileChange}
                      />
                    </div>

                    <div style={{ fontSize: 11, color: '#546E7A', marginTop: 8 }}>
                      Upload your own photo, pick a preset, or remove it to use your initials.
                    </div>
                  </section>

                  {/* Banner */}
                  <section className="pe-section" style={{ ...GLASS, padding: 20 }}>
                    {/* FIX 4 — "Profile banner" → "Portfolio banner" */}
                    <div className="pe-section-label">Portfolio banner</div>
                    <div className="pe-asset-rail" style={{ marginBottom: 10 }}>
                      <button
                        type="button"
                        className={`pe-asset-btn${!coverUrl ? ' selected' : ''}`}
                        onClick={() => setCoverUrl('')}
                      >
                        None
                      </button>

                      {profileBanners.slice(0, 4).map((b) => (
                        <button
                          key={b.key}
                          type="button"
                          className={`pe-asset-chip${coverUrl === b.src ? ' selected' : ''}`}
                          onClick={() => setCoverUrl(b.src)}
                        >
                          <img src={b.src} alt={b.name} />
                        </button>
                      ))}

                      <button
                        type="button"
                        className="pe-asset-btn"
                        onClick={() => setBannerMoreOpen((v) => !v)}
                      >
                        {bannerMoreOpen ? 'Less ↑' : 'More...'}
                      </button>
                    </div>

                    {bannerMoreOpen && (
                      <div className="pe-asset-grid">
                        {profileBanners.map((b) => (
                          <button
                            key={b.key}
                            type="button"
                            className={`pe-asset-grid-item${coverUrl === b.src ? ' selected' : ''}`}
                            onClick={() => setCoverUrl(b.src)}
                          >
                            <img src={b.src} alt={b.name} />
                            <div className="pe-asset-grid-item-name">{b.name}</div>
                            <div className="pe-asset-grid-item-desc">{b.desc}</div>
                          </button>
                        ))}
                      </div>
                    )}

                    {coverUrl && (
                      <div
                        style={{
                          display: 'grid',
                          gap: 12,
                          marginTop: 14,
                          padding: '14px 0 0',
                          borderTop: '1px solid rgba(0,0,0,0.08)',
                        }}
                      >
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#37474F' }}>
                            Display mode
                          </span>
                          {['cover', 'fit'].map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setBannerMode(m)}
                              style={{
                                padding: '5px 14px',
                                borderRadius: 999,
                                fontFamily: 'inherit',
                                border: `1px solid ${bannerMode === m ? ORANGE : 'rgba(0,0,0,0.14)'}`,
                                background:
                                  bannerMode === m
                                    ? 'rgba(255,112,67,0.08)'
                                    : 'rgba(255,255,255,0.80)',
                                color: bannerMode === m ? ORANGE : '#37474F',
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                                textTransform: 'capitalize',
                              }}
                            >
                              {m}
                            </button>
                          ))}
                        </div>

                        <div className="pe-field">
                          <label className="pe-label">Banner height — {bannerH}px</label>
                          <input
                            type="range"
                            min={80}
                            max={400}
                            value={bannerH}
                            className="pe-slider"
                            onChange={(e) => setBannerH(Number(e.target.value))}
                          />
                        </div>

                        {bannerMode === 'cover' && (
                          <div className="pe-field">
                            <label className="pe-label">Vertical focus — {focalY}%</label>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              value={focalY}
                              className="pe-slider"
                              onChange={(e) => setFocalY(Number(e.target.value))}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </section>

                  {/* Wallpaper */}
                  <section className="pe-section" style={{ ...GLASS, padding: 20 }}>
                    <div className="pe-section-label">Page wallpaper</div>
                    <div className="pe-asset-rail" style={{ marginBottom: 10 }}>
                      <button
                        type="button"
                        className={`pe-asset-btn${!wallpaperUrl ? ' selected' : ''}`}
                        onClick={() => setWallpaperUrl('')}
                      >
                        Default
                      </button>

                      {profileWallpapers.slice(0, 4).map((w) => (
                        <button
                          key={w.key}
                          type="button"
                          className={`pe-asset-chip${wallpaperUrl === w.src ? ' selected' : ''}`}
                          onClick={() => setWallpaperUrl(w.src)}
                        >
                          <img src={w.src} alt={w.name} />
                        </button>
                      ))}

                      <button
                        type="button"
                        className="pe-asset-btn"
                        onClick={() => setWallpaperMoreOpen((v) => !v)}
                      >
                        {wallpaperMoreOpen ? 'Less ↑' : 'More...'}
                      </button>
                    </div>

                    {wallpaperMoreOpen && (
                      <div className="pe-asset-grid">
                        {profileWallpapers.map((w) => (
                          <button
                            key={w.key}
                            type="button"
                            className={`pe-asset-grid-item${
                              wallpaperUrl === w.src ? ' selected' : ''
                            }`}
                            onClick={() => setWallpaperUrl(w.src)}
                          >
                            <img src={w.src} alt={w.name} />
                            <div className="pe-asset-grid-item-name">{w.name}</div>
                            <div className="pe-asset-grid-item-desc">{w.desc}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </section>

                  {/* Profile URL + Visibility */}
                  <section className="pe-section" style={{ ...GLASS, padding: 20 }}>
                    {/* FIX 4 — "Your profile URL" → "Your portfolio URL" */}
                    <div className="pe-section-label">Your portfolio URL</div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0,
                        background: 'rgba(255,255,255,0.88)',
                        border: '1px solid rgba(0,0,0,0.12)',
                        borderRadius: 8,
                        overflow: 'hidden',
                        marginBottom: 6,
                      }}
                    >
                      <span
                        style={{
                          padding: '9px 12px',
                          fontSize: 13,
                          color: '#546E7A',
                          background: 'rgba(0,0,0,0.04)',
                          borderRight: '1px solid rgba(0,0,0,0.10)',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                          fontWeight: 700,
                        }}
                      >
                        forgetomorrow.com/u/
                      </span>

                      <input
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        placeholder="your-name"
                        style={{
                          flex: 1,
                          padding: '9px 12px',
                          border: 'none',
                          background: 'none',
                          outline: 'none',
                          fontSize: 14,
                          fontWeight: 700,
                          color: ORANGE,
                          fontFamily: 'inherit',
                          minWidth: 0,
                        }}
                      />
                    </div>

                    <div style={{ fontSize: 11, color: '#546E7A', marginBottom: 18 }}>
                      Letters, numbers, and hyphens only
                    </div>

                    <div className="pe-section-label">Visibility</div>
                    <div className="pe-vis-group" style={{ marginBottom: 8 }}>
                      {[
                        { id: 'private', label: 'Private' },
                        { id: 'public', label: 'Public' },
                        { id: 'recruiters', label: 'Recruiters only' },
                      ].map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          className={`pe-vis-pill${visibility === v.id ? ' active' : ''}`}
                          onClick={() => setVisibility(v.id)}
                        >
                          {v.label}
                        </button>
                      ))}
                    </div>

                    {/* FIX 4 — "profile" → "portfolio" in visibility descriptions */}
                    <div style={{ fontSize: 11, color: '#455A64', fontWeight: 600 }}>
                      {visibility === 'public'
                        ? 'Anyone with your link can view your portfolio.'
                        : visibility === 'recruiters'
                        ? 'Only approved recruiters can find you.'
                        : 'Only you can see your portfolio.'}
                    </div>
                  </section>

                  {/* Social links */}
                  <section className="pe-section" style={{ ...GLASS, padding: 20 }}>
                    <div className="pe-section-label">Social links</div>
                    <div style={{ display: 'grid', gap: 12 }}>
                      {SOCIAL_FIELDS.map((f) => (
                        <div key={f.key} className="pe-field">
                          <label
                            className="pe-label"
                            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                          >
                            <span style={{ fontSize: 13, opacity: 0.8 }}>{f.icon}</span>
                            {f.label}
                          </label>
                          <input
                            className="pe-input"
                            type="url"
                            value={socialLinks[f.key] || ''}
                            onChange={(e) => updateSocial(f.key, e.target.value)}
                            placeholder={f.placeholder}
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              )}

              {/* ── Tab: Who Am I ── */}
              {activeTab === 'who' && (
                <div className="pe-fade-in" style={{ display: 'grid', gap: GAP }}>
                  {/* Identity — name locked */}
                  <section className="pe-section" style={{ ...GLASS, padding: 20 }}>
                    <div className="pe-section-label">Identity</div>
                    <div className="pe-grid-2">
                      <div className="pe-field">
                        <label className="pe-label">Display name</label>
                        <input
                          className="pe-input locked"
                          value={name}
                          readOnly
                          title="To update your name, contact support"
                        />
                        <span style={{ fontSize: 11, color: '#546E7A', fontWeight: 600 }}>
                          Name changes go through{' '}
                          <Link
                            href="/support"
                            style={{ color: ORANGE, textDecoration: 'none', fontWeight: 700 }}
                          >
                            Support Center
                          </Link>
                        </span>
                      </div>

                      <div className="pe-field">
                        <label className="pe-label">Pronouns</label>
                        <input
                          className="pe-input"
                          value={pronouns}
                          onChange={(e) => setPronouns(e.target.value)}
                          placeholder="e.g. they/them"
                        />
                      </div>

                      <div className="pe-field full">
                        <label className="pe-label">Headline</label>
                        <input
                          className="pe-input"
                          value={headline}
                          onChange={(e) => setHeadline(e.target.value)}
                          placeholder="Founder & CEO of ForgeTomorrow | Building Human-First Careers"
                          maxLength={160}
                        />
                      </div>

                      <div className="pe-field">
                        <label className="pe-label">Location</label>
                        <input
                          className="pe-input"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="City, State or Remote"
                        />
                      </div>

                      <div className="pe-field">
                        <label className="pe-label">Status</label>
                        <input
                          className="pe-input"
                          value={status}
                          onChange={(e) => setStatus(e.target.value)}
                          placeholder="e.g. Open to work"
                        />
                      </div>
                    </div>
                  </section>

                  {/* About */}
                  <section className="pe-section" style={{ ...GLASS, padding: 20 }}>
                    <div className="pe-section-label">About / Summary</div>
                    <ProfileAbout about={about || ''} setAbout={setAbout} />
                  </section>

                  {/* Work preferences */}
                  <section className="pe-section" style={{ ...GLASS, padding: 20 }}>
                    <div className="pe-section-label">Work preferences</div>
                    <ProfilePreferences
                      prefStatus={prefStatus}
                      setPrefStatus={setPrefStatus}
                      prefWorkType={prefWorkType}
                      setPrefWorkType={setPrefWorkType}
                      prefRelocate={prefRelocate}
                      setPrefRelocate={setPrefRelocate}
                      prefLocations={prefLocations}
                      setPrefLocations={setPrefLocations}
                      prefStart={prefStart}
                      setPrefStart={setPrefStart}
                    />
                  </section>

                  {/* Hobbies */}
                  <section className="pe-section" style={{ ...GLASS, padding: 20 }}>
                    <div className="pe-section-label">Hobbies & interests</div>
                    <ProfileHobbies hobbies={hobbies} setHobbies={setHobbies} />
                  </section>
                </div>
              )}

              {/* ── Tab: What I Bring ── */}
              {activeTab === 'bring' && (
                <div className="pe-fade-in" style={{ display: 'grid', gap: GAP }}>
                  <section className="pe-section" style={{ ...GLASS, padding: 20 }}>
                    <div className="pe-section-label">Skills</div>
                    <ProfileSkills skills={skills} setSkills={setSkills} />
                  </section>

                  <section className="pe-section" style={{ ...GLASS, padding: 20 }}>
                    <div className="pe-section-label">Languages</div>
                    <ProfileLanguages languages={languages} setLanguages={setLanguages} />
                  </section>

                  <section className="pe-section" style={{ ...GLASS, padding: 20 }}>
                    <div className="pe-section-label">Certifications</div>
                    <ProfileCertifications
                      certifications={certifications}
                      setCertifications={setCertifications}
                    />
                  </section>

                  <section className="pe-section" style={{ ...GLASS, padding: 20 }}>
                    <div className="pe-section-label">Education</div>
                    <ProfileEducation education={education} setEducation={setEducation} />
                  </section>
                </div>
              )}

              {/* ── Tab: Where I've Been ── */}
              {activeTab === 'been' && (
                <div className="pe-fade-in" style={{ display: 'grid', gap: GAP }}>
                  <section className="pe-section" style={{ ...GLASS, padding: 20 }}>
                    <div className="pe-section-label">Resume</div>
                    <p
                      style={{
                        fontSize: 13,
                        color: '#37474F',
                        fontWeight: 600,
                        marginBottom: 16,
                        lineHeight: 1.6,
                      }}
                    >
                      {/* FIX 4 — "profile" → "portfolio" in resume description */}
                      Your primary resume is the cornerstone of your ForgeTomorrow portfolio.
                      Recruiters can download it directly from your public portfolio page.
                    </p>
                    <ProfileResumeAttach withChrome={withChrome} />
                  </section>

                  <section className="pe-section" style={{ ...GLASS, padding: 20 }}>
                    <div className="pe-section-label">Projects</div>
                    <ProfileProjects projects={projects} setProjects={setProjects} />
                  </section>
                </div>
              )}
            </div>

            {/* ══════════════════════════════════════════════════════════════
                COL 2 — Right rail (desktop only)
                FIX 1 — top: 0 (was top: 2), starts flush with sidebar
            ══════════════════════════════════════════════════════════════ */}
            {!isMobile && (
              <div
                style={{
                  display: 'grid',
                  gap: GAP,
                  alignSelf: 'start',
                  position: 'sticky',
                  top: 0,
                }}
              >
                {/* Ad slot */}
                <aside style={DARK_RAIL}>
                  <RightRailPlacementManager surfaceId="profile" />
                </aside>

                {/* Live preview */}
                <aside style={DARK_RAIL}>
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 800,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: '#A7B3BA',
                      marginBottom: 10,
                    }}
                  >
                    Live preview
                  </div>

                  <LivePreviewCard
                    avatarUrl={avatarUrl}
                    name={name}
                    pronouns={pronouns}
                    headline={headline}
                    location={location}
                    status={status}
                    initials={initials}
                    coverUrl={coverUrl}
                    bannerPos={bannerPos}
                    wallpaperUrl={wallpaperUrl}
                    profileUrl={profileUrl}
                    skills={skills}
                    languages={languages}
                    hobbies={hobbies}
                    visibility={visibility}
                    slug={slug}
                  />

                  {slug && (
                    <Link
                      href={`/u/${slug}`}
                      style={{
                        display: 'block',
                        marginTop: 10,
                        textAlign: 'center',
                        fontSize: 11,
                        fontWeight: 700,
                        color: ORANGE,
                        textDecoration: 'none',
                      }}
                    >
                      {/* FIX 4 — "See full profile" → "See full portfolio" */}
                      See full portfolio →
                    </Link>
                  )}
                </aside>
              </div>
            )}
          </div>
        </div>
        )} {/* end desktop */}

      </SeekerLayout>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MobileEditor — full native-app mobile layout
// Glass/light aesthetic, sticky bottom tab bar, independent scrolling panels
// ─────────────────────────────────────────────────────────────────────────────
function MobileEditor(props) {
  const {
    avatarUrl, avatarUploading, initials, coverUrl, wallpaperUrl,
    bannerH, bannerMode, focalY, bannerMoreOpen, wallpaperMoreOpen,
    setBannerMoreOpen, setWallpaperMoreOpen,
    setCoverUrl, setWallpaperUrl, setBannerH, setBannerMode, setFocalY,
    fileInputRef, handleAvatarFileChange, handleAvatarRemove, setAvatarUrl,
    name, pronouns, headline, location, status, slug, visibility,
    setPronouns, setHeadline, setLocation, setStatus, setSlug, setVisibility,
    socialLinks, updateSocial,
    about, setAbout, skills, setSkills, languages, setLanguages,
    hobbies, setHobbies, education, setEducation,
    certifications, setCertifications, projects, setProjects,
    prefStatus, setPrefStatus, prefWorkType, setPrefWorkType,
    prefLocations, setPrefLocations, prefStart, setPrefStart,
    prefRelocate, setPrefRelocate,
    saveState, profileUrl, bannerPos, withChrome,
  } = props;

  const [activeTab, setActiveTab] = useState('style');
  // Track which accordion sections are open within each tab
  const [openSections, setOpenSections] = useState({
    photo: true, banner: false, wallpaper: false, url: false, social: false,
    identity: true, about: false, prefs: false, hobbies: false,
    skills: true, languages: false, certs: false, education: false,
    resume: true, projects: false,
  });

  const toggleSection = (key) =>
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  const MOBILE_TABS = [
    { id: 'style', label: 'Style',   icon: '◎' },
    { id: 'who',   label: 'Who',     icon: '◈' },
    { id: 'bring', label: 'Bring',   icon: '◇' },
    { id: 'been',  label: "Been",    icon: '◻' },
  ];

  // Save toast slide-up
  const [toastVisible, setToastVisible] = useState(false);
  const toastRef = useRef(null);
  useEffect(() => {
    if (saveState === 'saved') {
      setToastVisible(true);
      if (toastRef.current) clearTimeout(toastRef.current);
      toastRef.current = setTimeout(() => setToastVisible(false), 2200);
    }
    if (saveState === 'error') setToastVisible(true);
    return () => { if (toastRef.current) clearTimeout(toastRef.current); };
  }, [saveState]);

  const bannerImage = coverUrl ? `url(${coverUrl})` : null;

  return (
    <>
      <style jsx global>{`
        /* ── Mobile Editor Shell ── */
        .me-shell {
          display: flex;
          flex-direction: column;
          width: 100%;
          /* bottom tab bar is 64px — panels get padding-bottom to clear it */
        }

        /* ── Live preview strip at top ── */
        .me-preview-strip {
          border-radius: 14px;
          overflow: hidden;
          margin-bottom: 12px;
          border: 1px solid rgba(255,255,255,0.22);
          box-shadow: 0 10px 24px rgba(0,0,0,0.12);
          position: relative;
        }

        /* ── Tab panels ── */
        .me-panels { position: relative; width: 100%; }
        .me-panel {
          display: none;
          padding-bottom: 88px; /* clear bottom tab bar */
        }
        .me-panel.active { display: block; }

        /* ── Accordion section ── */
        .me-accordion {
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.22);
          background: rgba(255,255,255,0.58);
          box-shadow: 0 4px 14px rgba(0,0,0,0.08);
          backdropFilter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          overflow: hidden;
          margin-bottom: 10px;
        }
        .me-accordion-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          cursor: pointer;
          user-select: none;
          -webkit-user-select: none;
          gap: 10px;
          min-height: 52px;
        }
        .me-accordion-header:active { background: rgba(255,255,255,0.30); }
        .me-accordion-title {
          font-size: 13px;
          font-weight: 800;
          color: #1F2A33;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .me-accordion-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: ${ORANGE}; flex-shrink: 0;
          box-shadow: 0 0 0 3px rgba(255,112,67,0.18);
        }
        .me-accordion-chevron {
          font-size: 12px; color: #90A4AE;
          transition: transform 0.2s; flex-shrink: 0;
        }
        .me-accordion-chevron.open { transform: rotate(180deg); }
        .me-accordion-body {
          padding: 0 16px 16px;
          border-top: 1px solid rgba(0,0,0,0.07);
        }
        .me-accordion-body-pad { padding-top: 14px; }

        /* ── Bottom tab bar ── */
        .me-tab-bar {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          height: 64px;
          background: rgba(255,255,255,0.88);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-top: 1px solid rgba(0,0,0,0.10);
          display: flex;
          align-items: stretch;
          z-index: 100;
          box-shadow: 0 -4px 20px rgba(0,0,0,0.10);
        }
        .me-tab-btn {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.15s;
          -webkit-tap-highlight-color: transparent;
          padding: 0;
        }
        .me-tab-btn:active { background: rgba(255,112,67,0.06); }
        .me-tab-icon {
          font-size: 18px;
          line-height: 1;
          color: #90A4AE;
          transition: color 0.15s, transform 0.15s;
        }
        .me-tab-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.03em;
          color: #90A4AE;
          transition: color 0.15s;
        }
        .me-tab-btn.active .me-tab-icon { color: ${ORANGE}; transform: scale(1.15); }
        .me-tab-btn.active .me-tab-label { color: ${ORANGE}; }
        .me-tab-pip {
          width: 4px; height: 4px; border-radius: 50%;
          background: transparent; margin-top: 1px;
          transition: background 0.15s;
        }
        .me-tab-btn.active .me-tab-pip { background: ${ORANGE}; }

        /* ── Avatar carousel row ── */
        .me-avatar-carousel {
          display: flex; gap: 12px; align-items: center;
          overflow-x: auto; scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
          padding: 4px 2px 8px;
        }
        .me-avatar-carousel::-webkit-scrollbar { display: none; }

        /* ── Asset carousel ── */
        .me-asset-carousel {
          display: flex; gap: 8px; align-items: center;
          overflow-x: auto; scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
          padding: 4px 2px 8px;
        }
        .me-asset-carousel::-webkit-scrollbar { display: none; }

        /* ── Save toast ── */
        .me-toast {
          position: fixed;
          bottom: 76px;
          left: 50%;
          transform: translateX(-50%) translateY(20px);
          background: rgba(30,30,30,0.92);
          color: white;
          font-size: 13px;
          font-weight: 700;
          padding: 10px 22px;
          border-radius: 999px;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          opacity: 0;
          transition: opacity 0.25s, transform 0.25s;
          pointer-events: none;
          white-space: nowrap;
          z-index: 200;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .me-toast.visible {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
        .me-toast-dot {
          width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
        }

        /* ── View portfolio pill at top ── */
        .me-view-pill {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          background: rgba(255,255,255,0.58);
          border: 1px solid rgba(255,255,255,0.22);
          border-radius: 14px;
          box-shadow: 0 4px 14px rgba(0,0,0,0.08);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          margin-bottom: 12px;
          text-decoration: none;
        }
        .me-section-hint {
          font-size: 12px;
          color: #546E7A;
          line-height: 1.55;
          padding: 8px 12px;
          background: rgba(255,112,67,0.06);
          border-radius: 8px;
          border-left: 3px solid rgba(255,112,67,0.35);
          margin-bottom: 12px;
        }
      `}</style>

      <div className="me-shell">

        {/* ── Top: mini live preview ── */}
        <div className="me-preview-strip" style={{
          background: wallpaperUrl
            ? `url(${wallpaperUrl}) center/cover no-repeat`
            : 'linear-gradient(135deg, #f5f0eb 0%, #ede8e2 100%)',
        }}>
          <div style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.55) 100%)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            padding: '12px 14px',
          }}>
            {/* Banner strip */}
            {coverUrl && (
              <div style={{
                height: 48, borderRadius: 10, overflow: 'hidden',
                marginBottom: 10, position: 'relative',
                border: '1px solid rgba(255,255,255,0.30)',
              }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  backgroundImage: bannerImage,
                  backgroundSize: 'cover',
                  backgroundPosition: bannerPos,
                }} />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(180deg,rgba(0,0,0,0.25),rgba(0,0,0,0.05))',
                }} />
              </div>
            )}

            {/* Identity row */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                border: `2.5px solid ${ORANGE}`,
                overflow: 'hidden', background: 'rgba(0,0,0,0.08)',
                boxShadow: '0 2px 8px rgba(255,112,67,0.30)',
              }}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                ) : (
                  <div style={{
                    width: '100%', height: '100%', display: 'grid', placeItems: 'center',
                    background: `linear-gradient(135deg, ${ORANGE}, #F4511E)`,
                    color: '#fff', fontWeight: 900, fontSize: 14,
                  }}>{initials}</div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#1F2A33',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {name || 'Your Name'}
                </div>
                {headline && (
                  <div style={{ fontSize: 11, color: '#546E7A', marginTop: 1,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {headline}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 4, marginTop: 3, flexWrap: 'wrap' }}>
                  {location && (
                    <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 7px',
                      borderRadius: 999, background: 'rgba(0,0,0,0.07)', color: '#455A64' }}>
                      {location}
                    </span>
                  )}
                  {status && (
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px',
                      borderRadius: 999, background: 'rgba(255,112,67,0.12)',
                      color: ORANGE, border: '1px solid rgba(255,112,67,0.25)' }}>
                      ● {status}
                    </span>
                  )}
                </div>
              </div>
              {/* Portfolio Editor label */}
              <div style={{ flexShrink: 0, textAlign: 'right' }}>
                <div style={{ fontSize: 10, fontWeight: 900, color: ORANGE, lineHeight: 1 }}>
                  Portfolio
                </div>
                <div style={{ fontSize: 10, fontWeight: 900, color: ORANGE }}>
                  Editor
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── View live portfolio link ── */}
        {slug && (
          <Link href={`/u/${slug}`} className="me-view-pill">
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1F2A33' }}>
              View live portfolio
            </span>
            <span style={{ fontSize: 13, fontWeight: 900, color: ORANGE }}>→</span>
          </Link>
        )}

        {/* ════════════════════════════════════════════════════════
            PANELS — one per tab, stack in DOM, show/hide via CSS
        ════════════════════════════════════════════════════════ */}
        <div className="me-panels">

          {/* ── Style panel ── */}
          <div className={`me-panel${activeTab === 'style' ? ' active' : ''}`}>

            {/* Photo */}
            <MeAccordion
              label="Portfolio photo" open={openSections.photo}
              onToggle={() => toggleSection('photo')}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  border: `3px solid ${ORANGE}`, overflow: 'hidden',
                  flexShrink: 0, background: 'rgba(0,0,0,0.06)', position: 'relative',
                }}>
                  {avatarUploading && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.8)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 20, color: ORANGE }}>◌</span>
                    </div>
                  )}
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="avatar"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center',
                      background: `linear-gradient(135deg, ${ORANGE}, #F4511E)`,
                      color: '#fff', fontWeight: 900, fontSize: 22 }}>
                      {initials}
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1F2A33', marginBottom: 2 }}>
                    Current photo
                  </div>
                  <div style={{ fontSize: 12, color: '#455A64' }}>Updates instantly</div>
                </div>
              </div>

              {/* Upload first, presets, remove last */}
              <div className="me-avatar-carousel">
                <button type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUploading}
                  style={{
                    width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                    border: `2px dashed rgba(255,112,67,0.60)`,
                    background: 'rgba(255,112,67,0.07)', color: ORANGE,
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', gap: 1, cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                  <span style={{ fontSize: 18, lineHeight: 1 }}>↑</span>
                  <span style={{ fontSize: 8, fontWeight: 800 }}>Upload</span>
                </button>

                {PRESET_AVATARS.map(opt => (
                  <button key={opt.url} type="button"
                    onClick={() => setAvatarUrl(opt.url)}
                    style={{
                      width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                      padding: 2, border: `2px solid ${avatarUrl === opt.url ? ORANGE : 'transparent'}`,
                      background: 'transparent', cursor: 'pointer',
                    }}>
                    <img src={opt.url} alt={opt.label}
                      style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
                  </button>
                ))}

                {avatarUrl && (
                  <button type="button" onClick={handleAvatarRemove}
                    style={{
                      width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                      border: '2px solid rgba(211,47,47,0.30)',
                      background: 'rgba(211,47,47,0.07)', color: '#C62828',
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      justifyContent: 'center', gap: 1, cursor: 'pointer', fontFamily: 'inherit',
                    }}>
                    <span style={{ fontSize: 16, lineHeight: 1 }}>✕</span>
                    <span style={{ fontSize: 8, fontWeight: 800 }}>Remove</span>
                  </button>
                )}

                <input ref={fileInputRef} type="file" accept="image/*"
                  style={{ display: 'none' }} onChange={handleAvatarFileChange} />
              </div>
            </MeAccordion>

            {/* Portfolio banner */}
            <MeAccordion
              label="Portfolio banner" open={openSections.banner}
              onToggle={() => toggleSection('banner')}>
              <div className="me-asset-carousel" style={{ marginBottom: 6 }}>
                <button type="button"
                  className={`pe-asset-btn${!coverUrl ? ' selected' : ''}`}
                  onClick={() => setCoverUrl('')} style={{ flexShrink: 0 }}>
                  None
                </button>
                {profileBanners.map(b => (
                  <button key={b.key} type="button"
                    className={`pe-asset-chip${coverUrl === b.src ? ' selected' : ''}`}
                    onClick={() => setCoverUrl(b.src)} style={{ flexShrink: 0 }}>
                    <img src={b.src} alt={b.name} />
                  </button>
                ))}
              </div>
              {coverUrl && (
                <div style={{ display: 'grid', gap: 12, paddingTop: 10,
                  borderTop: '1px solid rgba(0,0,0,0.07)' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#37474F' }}>Mode</span>
                    {['cover', 'fit'].map(m => (
                      <button key={m} type="button" onClick={() => setBannerMode(m)}
                        style={{
                          padding: '5px 14px', borderRadius: 999, fontFamily: 'inherit',
                          border: `1px solid ${bannerMode === m ? ORANGE : 'rgba(0,0,0,0.14)'}`,
                          background: bannerMode === m ? 'rgba(255,112,67,0.08)' : 'rgba(255,255,255,0.80)',
                          color: bannerMode === m ? ORANGE : '#37474F',
                          fontSize: 12, fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize',
                          minHeight: 36,
                        }}>{m}</button>
                    ))}
                  </div>
                  <div className="pe-field">
                    <label className="pe-label">Height — {bannerH}px</label>
                    <input type="range" min={80} max={400} value={bannerH}
                      className="pe-slider" onChange={e => setBannerH(Number(e.target.value))} />
                  </div>
                  {bannerMode === 'cover' && (
                    <div className="pe-field">
                      <label className="pe-label">Vertical focus — {focalY}%</label>
                      <input type="range" min={0} max={100} value={focalY}
                        className="pe-slider" onChange={e => setFocalY(Number(e.target.value))} />
                    </div>
                  )}
                </div>
              )}
            </MeAccordion>

            {/* Wallpaper */}
            <MeAccordion
              label="Page wallpaper" open={openSections.wallpaper}
              onToggle={() => toggleSection('wallpaper')}>
              <div className="me-section-hint">
                Your wallpaper is the background of your public portfolio page.
              </div>
              <div className="me-asset-carousel">
                <button type="button"
                  className={`pe-asset-btn${!wallpaperUrl ? ' selected' : ''}`}
                  onClick={() => setWallpaperUrl('')} style={{ flexShrink: 0 }}>
                  Default
                </button>
                {profileWallpapers.map(w => (
                  <button key={w.key} type="button"
                    className={`pe-asset-chip${wallpaperUrl === w.src ? ' selected' : ''}`}
                    onClick={() => setWallpaperUrl(w.src)} style={{ flexShrink: 0 }}>
                    <img src={w.src} alt={w.name} />
                  </button>
                ))}
              </div>
            </MeAccordion>

            {/* URL + visibility */}
            <MeAccordion
              label="Portfolio URL & visibility" open={openSections.url}
              onToggle={() => toggleSection('url')}>
              <div style={{ display: 'flex', alignItems: 'center',
                background: 'rgba(255,255,255,0.88)', border: '1px solid rgba(0,0,0,0.12)',
                borderRadius: 8, overflow: 'hidden', marginBottom: 6 }}>
                <span style={{ padding: '9px 10px', fontSize: 11, color: '#546E7A',
                  background: 'rgba(0,0,0,0.04)', borderRight: '1px solid rgba(0,0,0,0.10)',
                  whiteSpace: 'nowrap', flexShrink: 0, fontWeight: 700 }}>
                  forgetomorrow.com/u/
                </span>
                <input value={slug} onChange={e => setSlug(e.target.value)}
                  placeholder="your-name"
                  style={{ flex: 1, padding: '9px 10px', border: 'none', background: 'none',
                    outline: 'none', fontSize: 14, fontWeight: 700, color: ORANGE,
                    fontFamily: 'inherit', minWidth: 0 }} />
              </div>
              <div style={{ fontSize: 11, color: '#546E7A', marginBottom: 14 }}>
                Letters, numbers, and hyphens only
              </div>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
                letterSpacing: '0.07em', color: '#455A64', marginBottom: 8 }}>
                Visibility
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { id: 'private',    label: 'Private'         },
                  { id: 'public',     label: 'Public'          },
                  { id: 'recruiters', label: 'Recruiters only' },
                ].map(v => (
                  <button key={v.id} type="button"
                    className={`pe-vis-pill${visibility === v.id ? ' active' : ''}`}
                    onClick={() => setVisibility(v.id)} style={{ minHeight: 40 }}>
                    {v.label}
                  </button>
                ))}
              </div>
            </MeAccordion>

            {/* Social */}
            <MeAccordion
              label="Social links" open={openSections.social}
              onToggle={() => toggleSection('social')}>
              <div style={{ display: 'grid', gap: 10 }}>
                {SOCIAL_FIELDS.map(f => (
                  <div key={f.key} className="pe-field">
                    <label className="pe-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ fontSize: 12, opacity: 0.7 }}>{f.icon}</span>
                      {f.label}
                    </label>
                    <input className="pe-input" type="url"
                      value={socialLinks[f.key] || ''}
                      onChange={e => updateSocial(f.key, e.target.value)}
                      placeholder={f.placeholder} />
                  </div>
                ))}
              </div>
            </MeAccordion>
          </div>

          {/* ── Who Am I panel ── */}
          <div className={`me-panel${activeTab === 'who' ? ' active' : ''}`}>

            <MeAccordion label="Identity" open={openSections.identity}
              onToggle={() => toggleSection('identity')}>
              <div style={{ display: 'grid', gap: 12 }}>
                <div className="pe-field">
                  <label className="pe-label">Display name</label>
                  <input className="pe-input locked" value={name} readOnly
                    title="To update your name, contact support" />
                  <span style={{ fontSize: 11, color: '#546E7A', fontWeight: 600 }}>
                    Name changes go through{' '}
                    <Link href="/support" style={{ color: ORANGE, textDecoration: 'none', fontWeight: 700 }}>
                      Support Center
                    </Link>
                  </span>
                </div>
                <div className="pe-field">
                  <label className="pe-label">Pronouns</label>
                  <input className="pe-input" value={pronouns}
                    onChange={e => setPronouns(e.target.value)} placeholder="e.g. they/them" />
                </div>
                <div className="pe-field">
                  <label className="pe-label">Headline</label>
                  <input className="pe-input" value={headline}
                    onChange={e => setHeadline(e.target.value)}
                    placeholder="Your headline" maxLength={160} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="pe-field">
                    <label className="pe-label">Location</label>
                    <input className="pe-input" value={location}
                      onChange={e => setLocation(e.target.value)} placeholder="City or Remote" />
                  </div>
                  <div className="pe-field">
                    <label className="pe-label">Status</label>
                    <input className="pe-input" value={status}
                      onChange={e => setStatus(e.target.value)} placeholder="Open to work" />
                  </div>
                </div>
              </div>
            </MeAccordion>

            <MeAccordion label="About / Summary" open={openSections.about}
              onToggle={() => toggleSection('about')}>
              <div className="pe-section">
                <ProfileAbout about={about || ''} setAbout={setAbout} />
              </div>
            </MeAccordion>

            <MeAccordion label="Work preferences" open={openSections.prefs}
              onToggle={() => toggleSection('prefs')}>
              <div className="pe-section">
                <ProfilePreferences
                  prefStatus={prefStatus}       setPrefStatus={setPrefStatus}
                  prefWorkType={prefWorkType}   setPrefWorkType={setPrefWorkType}
                  prefRelocate={prefRelocate}   setPrefRelocate={setPrefRelocate}
                  prefLocations={prefLocations} setPrefLocations={setPrefLocations}
                  prefStart={prefStart}         setPrefStart={setPrefStart}
                />
              </div>
            </MeAccordion>

            <MeAccordion label="Hobbies & interests" open={openSections.hobbies}
              onToggle={() => toggleSection('hobbies')}>
              <div className="pe-section">
                <ProfileHobbies hobbies={hobbies} setHobbies={setHobbies} />
              </div>
            </MeAccordion>
          </div>

          {/* ── What I Bring panel ── */}
          <div className={`me-panel${activeTab === 'bring' ? ' active' : ''}`}>

            <MeAccordion label="Skills" open={openSections.skills}
              onToggle={() => toggleSection('skills')}>
              <div className="pe-section">
                <ProfileSkills skills={skills} setSkills={setSkills} />
              </div>
            </MeAccordion>

            <MeAccordion label="Languages" open={openSections.languages}
              onToggle={() => toggleSection('languages')}>
              <div className="pe-section">
                <ProfileLanguages languages={languages} setLanguages={setLanguages} />
              </div>
            </MeAccordion>

            <MeAccordion label="Certifications" open={openSections.certs}
              onToggle={() => toggleSection('certs')}>
              <div className="pe-section">
                <ProfileCertifications certifications={certifications} setCertifications={setCertifications} />
              </div>
            </MeAccordion>

            <MeAccordion label="Education" open={openSections.education}
              onToggle={() => toggleSection('education')}>
              <div className="pe-section">
                <ProfileEducation education={education} setEducation={setEducation} />
              </div>
            </MeAccordion>
          </div>

          {/* ── Where I've Been panel ── */}
          <div className={`me-panel${activeTab === 'been' ? ' active' : ''}`}>

            <MeAccordion label="Resume" open={openSections.resume}
              onToggle={() => toggleSection('resume')}>
              <p style={{ fontSize: 13, color: '#37474F', fontWeight: 600, marginBottom: 14, lineHeight: 1.6 }}>
                Your primary resume is the cornerstone of your ForgeTomorrow portfolio.
                Recruiters download it directly from your public portfolio page.
              </p>
              <div className="pe-section">
                <ProfileResumeAttach withChrome={withChrome} />
              </div>
            </MeAccordion>

            <MeAccordion label="Projects" open={openSections.projects}
              onToggle={() => toggleSection('projects')}>
              <div className="pe-section">
                <ProfileProjects projects={projects} setProjects={setProjects} />
              </div>
            </MeAccordion>
          </div>

        </div>{/* end panels */}

      </div>{/* end me-shell */}

      {/* ── Sticky bottom tab bar ── */}
      <nav className="me-tab-bar" role="tablist" aria-label="Portfolio editor sections">
        {MOBILE_TABS.map(tab => (
          <button key={tab.id} type="button"
            className={`me-tab-btn${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            role="tab" aria-selected={activeTab === tab.id}>
            <span className="me-tab-icon">{tab.icon}</span>
            <span className="me-tab-label">{tab.label}</span>
            <span className="me-tab-pip" />
          </button>
        ))}
      </nav>

      {/* ── Save toast ── */}
      <div className={`me-toast${toastVisible ? ' visible' : ''}`}>
        <div className="me-toast-dot" style={{
          background: saveState === 'error' ? '#EF5350' : '#66BB6A',
        }} />
        {saveState === 'error' ? 'Save failed' : 'All changes saved'}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MeAccordion — mobile accordion section
// ─────────────────────────────────────────────────────────────────────────────
function MeAccordion({ label, open, onToggle, children }) {
  return (
    <div className="me-accordion">
      <div className="me-accordion-header" onClick={onToggle} role="button"
        aria-expanded={open}>
        <div className="me-accordion-title">
          {open && <span className="me-accordion-dot" />}
          {label}
        </div>
        <span className={`me-accordion-chevron${open ? ' open' : ''}`}>▼</span>
      </div>
      {open && (
        <div className="me-accordion-body">
          <div className="me-accordion-body-pad">{children}</div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SaveIndicator
// ─────────────────────────────────────────────────────────────────────────────
function SaveIndicator({ state }) {
  const map = {
    idle: { dot: 'transparent', text: '', color: 'transparent' },
    saving: { dot: '#FFB74D', text: 'Saving…', color: '#546E7A' },
    saved: { dot: '#66BB6A', text: 'All changes saved', color: '#546E7A' },
    error: { dot: '#EF5350', text: 'Save failed', color: '#D32F2F' },
  };

  const c = map[state] || map.idle;
  if (state === 'idle') return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: c.dot,
          flexShrink: 0,
        }}
      />
      <span style={{ fontSize: 12, fontWeight: 700, color: c.color }}>{c.text}</span>
    </div>
  );
}