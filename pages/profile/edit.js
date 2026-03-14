// pages/profile/edit.js  —  ForgeTomorrow Profile Editor (v3)
// ─────────────────────────────────────────────────────────────────────────────
// Layout: SeekerLayout (left nav) | main content col | right rail
// Tabs:   What's my style / Who Am I / What I Bring / Where I've Been
// Theme:  Glass/light matching recruiter dashboard + seeker dashboard
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
        console.error('Failed to load profile:', err);
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

          setAvatarUrl(dataUrl);

          const res = await fetch('/api/profile/avatar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ avatarDataUrl: dataUrl }),
          });

          const json = await res.json();
          if (!res.ok) {
            alert(json.error || 'Failed to upload avatar.');
            setAvatarUrl(sessionAvatarUrl || resolvedAvatarUrl || '');
            return;
          }

          setAvatarUrl(json.avatarUrl || '');
        } catch (err) {
          alert('Something went wrong uploading your avatar.');
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
      alert('Failed to remove avatar.');
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
        <title>Edit Profile | ForgeTomorrow</title>
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
          padding: 9px 12px;
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
        .pe-avatar-upload-btn {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          border: 2px dashed rgba(255, 112, 67, 0.55);
          background: rgba(255, 112, 67, 0.06);
          color: ${ORANGE};
          font-size: 10px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.15s;
          flex-shrink: 0;
          font-family: inherit;
        }
        .pe-avatar-upload-btn:hover {
          background: rgba(255, 112, 67, 0.14);
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

      <SeekerLayout title="Edit Profile | ForgeTomorrow" activeNav="profile">
        <div
          style={{
            width: '100%',
            marginTop: isMobile ? 0 : -18,
          }}
        >
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
              {/* Title card */}
              <section style={{ ...GLASS, padding: '18px 20px', textAlign: 'center' }}>
                {isMobile && (
                  <MobilePreviewStrip
                    avatarUrl={avatarUrl}
                    name={name}
                    headline={headline}
                    location={location}
                    status={status}
                    initials={initials}
                    coverUrl={coverUrl}
                    bannerPos={bannerPos}
                    wallpaperUrl={wallpaperUrl}
                    profileUrl={profileUrl}
                    slug={slug}
                  />
                )}

                <h1 style={{ margin: 0, color: ORANGE, fontSize: 22, fontWeight: 900 }}>
                  Profile Editor
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
                      }}
                    >
                      View live profile →
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
                    <div className="pe-section-label">Profile photo</div>
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
                            alt="Current avatar"
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
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: '#1F2A33',
                            marginBottom: 3,
                          }}
                        >
                          Current photo
                        </div>
                        <div style={{ fontSize: 12, color: '#455A64', lineHeight: 1.5 }}>
                          Updates instantly when you pick a new one
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
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

                      <button
                        type="button"
                        className="pe-avatar-upload-btn"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={avatarUploading}
                      >
                        {avatarUploading ? '…' : 'Custom'}
                      </button>

                      {avatarUrl && (
                        <button
                          type="button"
                          className="pe-avatar-upload-btn"
                          onClick={handleAvatarRemove}
                          style={{
                            borderColor: 'rgba(211,47,47,0.4)',
                            background: 'rgba(211,47,47,0.06)',
                            color: '#D32F2F',
                          }}
                        >
                          Remove
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
                      Pick a preset, upload your own photo, or remove it to use your initials.
                    </div>
                  </section>

                  {/* Banner */}
                  <section className="pe-section" style={{ ...GLASS, padding: 20 }}>
                    <div className="pe-section-label">Profile banner</div>
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
                                border: `1px solid ${
                                  bannerMode === m ? ORANGE : 'rgba(0,0,0,0.14)'
                                }`,
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
                    <div className="pe-section-label">Your profile URL</div>

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

                    <div style={{ fontSize: 11, color: '#455A64', fontWeight: 600 }}>
                      {visibility === 'public'
                        ? 'Anyone with your link can view your profile.'
                        : visibility === 'recruiters'
                        ? 'Only approved recruiters can find you.'
                        : 'Only you can see your profile.'}
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
                      Your primary resume is the cornerstone of your ForgeTomorrow portfolio.
                      Recruiters can download it directly from your public profile.
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
            ══════════════════════════════════════════════════════════════ */}
            {!isMobile && (
              <div
                style={{
                  display: 'grid',
                  gap: GAP,
                  alignSelf: 'start',
                  position: 'sticky',
                  top: 2,
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
                      See full profile →
                    </Link>
                  )}
                </aside>
              </div>
            )}
          </div>
        </div>
      </SeekerLayout>
    </>
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
