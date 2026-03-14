// pages/profile/edit.js
// ─────────────────────────────────────────────────────────────────────────────
//  ForgeTomorrow — Profile Editor (upgraded)
//
//  What's new vs the old edit.js:
//  1. Dark navy aesthetic matches the portfolio page ([slug].js) exactly.
//  2. Tab nav: Who I Am / What I Bring / Where I've Been / Your Documents
//     • Desktop: tabs across top, selected section renders full-width below
//     • Mobile:  carousel-style swipeable tab bar (matches other FT pages)
//  3. Live preview panel (right rail, desktop only) — full portfolio identity
//     card with real wallpaper bg, banner, avatar, name, headline updating
//     in real time as the user edits. No save required to see changes.
//  4. Avatar instant preview — blob URL shown immediately on file select,
//     replaced with CDN URL when the upload resolves. (Handled by lifting
//     avatarUrl state to this page and passing handleAvatarChange down.)
//  5. Wallpaper + banner real-time — state lifted to this page and fed into
//     both the editor and the preview panel simultaneously.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import SeekerLayout from '@/components/layouts/SeekerLayout';

// ── Profile section components (unchanged internals) ─────────────────────────
import ProfileAbout        from '@/components/profile/ProfileAbout';
import ProfileLanguages    from '@/components/profile/ProfileLanguages';
import ProfilePreferences  from '@/components/profile/ProfilePreferences';
import ProfileResumeAttach from '@/components/profile/ProfileResumeAttach';
import ProfileSkills       from '@/components/profile/ProfileSkills';
import ProfileHobbies      from '@/components/profile/ProfileHobbies';
import ProfileCoverAttach  from '@/components/profile/ProfileCoverAttach';
import ProfileEducation    from '@/components/profile/ProfileEducation';
import ProfileSectionRow   from '@/components/profile/ProfileSectionRow';

// ── Avatar selector ───────────────────────────────────────────────────────────
import ProfileAvatarSelector from '@/components/profile/ProfileAvatarSelector';

// ── Banner / wallpaper data ───────────────────────────────────────────────────
import { profileBanners    } from '@/lib/profileBanners';
import { profileWallpapers } from '@/lib/profileWallpapers';

// ─────────────────────────────────────────────────────────────────────────────
//  Design tokens — matches [slug].js exactly
// ─────────────────────────────────────────────────────────────────────────────
const ORANGE        = '#FF7043';
const ORANGE_DIM    = 'rgba(255,112,67,0.18)';
const ORANGE_BORDER = 'rgba(255,112,67,0.38)';
const NAVY          = '#0D1B2A';
const WHITE         = '#F8F4EF';
const MUTED         = '#A8B7C7';
const BORDER        = 'rgba(255,255,255,0.14)';
const CARD_BG       = 'rgba(13,27,42,0.72)';
const BLUR          = 'blur(14px)';
const GAP           = 14;
const PREVIEW_W     = 310;

const TABS = [
  { id: 'who',       label: 'Who I Am',        icon: '◈' },
  { id: 'bring',     label: 'What I Bring',    icon: '◇' },
  { id: 'been',      label: "Where I've Been", icon: '◉' },
  { id: 'documents', label: 'Your Documents',  icon: '◫' },
];

const DOCS_HINT = {
  title: 'Make it easy to say yes',
  bullets: [
    'Keep one primary resume linked to your profile.',
    'Save alternates for different roles.',
    'Do the same with cover letters so recruiters instantly see fit.',
    'Manage everything in the builder — change primaries anytime.',
  ],
};

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

// ─────────────────────────────────────────────────────────────────────────────
//  Page component
// ─────────────────────────────────────────────────────────────────────────────
export default function ProfileEditPage() {
  const router = useRouter();
  const chrome = String(router.query.chrome || '').toLowerCase();
  const withChrome = (path) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

  // ── Responsive ──────────────────────────────────────────────────────────────
  const [isMobile, setIsMobile] = useState(true);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 900);
    fn();
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  // ── Active tab ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('who');

  // ── Server load gate ────────────────────────────────────────────────────────
  const [serverLoaded, setServerLoaded] = useState(false);

  // ── Identity ────────────────────────────────────────────────────────────────
  const [name,      setName]      = useState('');
  const [pronouns,  setPronouns]  = useState('');
  const [headline,  setHeadline]  = useState('');
  const [location,  setLocation]  = useState('');
  const [status,    setStatus]    = useState('');
  const [slug,      setSlug]      = useState('');
  const [slugValue, setSlugValue] = useState('');

  // ── Visual (lifted from ProfileHeader — drives both editor + live preview) ──
  const [avatarUrl,    setAvatarUrl]    = useState('');
  const [coverUrl,     setCoverUrl]     = useState('');
  const [wallpaperUrl, setWallpaperUrl] = useState('');
  const [bannerH,      setBannerH]      = useState(220);
  const [bannerMode,   setBannerMode]   = useState('cover');
  const [focalY,       setFocalY]       = useState(50);
  const [visibility,   setVisibility]   = useState('private');

  // ── Content sections ────────────────────────────────────────────────────────
  const [about,         setAbout]         = useState('');
  const [skills,        setSkills]        = useState([]);
  const [languages,     setLanguages]     = useState([]);
  const [hobbies,       setHobbies]       = useState([]);
  const [education,     setEducation]     = useState([]);
  const [prefStatus,    setPrefStatus]    = useState('');
  const [prefWorkType,  setPrefWorkType]  = useState('');
  const [prefRelocate,  setPrefRelocate]  = useState('');
  const [prefLocations, setPrefLocations] = useState([]);
  const [prefStart,     setPrefStart]     = useState('');

  // ── Docs UX ─────────────────────────────────────────────────────────────────
  const [docsFocus, setDocsFocus] = useState('resume');

  // ── Picker expand state ──────────────────────────────────────────────────────
  const [bannerMoreOpen,    setBannerMoreOpen]    = useState(false);
  const [wallpaperMoreOpen, setWallpaperMoreOpen] = useState(false);

  // ── Header save state ────────────────────────────────────────────────────────
  const [headerSaving,  setHeaderSaving]  = useState(false);
  const [headerSaveMsg, setHeaderSaveMsg] = useState('');

  // ─────────────────────────────────────────────────────────────────────────
  //  Load from server
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [hRes, dRes] = await Promise.all([
          fetch('/api/profile/header'),
          fetch('/api/profile/details'),
        ]);

        if (!cancelled && hRes.ok) {
          const hData = await hRes.json();
          const u = hData.user || hData;

          const fullName = u.name || [u.firstName, u.lastName].filter(Boolean).join(' ');
          if (fullName)    setName(fullName);
          if (u.pronouns)  setPronouns(u.pronouns);
          if (u.headline)  setHeadline(u.headline);
          if (u.location)  setLocation(u.location);
          if (u.status)    setStatus(u.status);
          if (u.slug)      { setSlug(u.slug); setSlugValue(u.slug); }
          if (u.avatarUrl) setAvatarUrl(u.avatarUrl);

          const cb = hData.corporateBanner || u.corporateBanner;
          setCoverUrl((cb && cb.bannerSrc) || u.coverUrl || '');
          setWallpaperUrl(u.wallpaperUrl || '');
          setBannerH(clamp(u.bannerHeight ?? 220, 80, 400));
          setBannerMode(u.bannerMode === 'fit' ? 'fit' : 'cover');
          setFocalY(clamp(u.bannerFocalY ?? 50, 0, 100));

          const pv = String(u.profileVisibility || '').toUpperCase();
          if      (pv === 'PUBLIC')           setVisibility('public');
          else if (pv === 'RECRUITERS_ONLY')  setVisibility('recruiters');
          else if (u.isProfilePublic)         setVisibility('public');
          else                                setVisibility('private');
        }

        if (!cancelled && dRes.ok) {
          const dData = await dRes.json();
          const u = dData.user || dData.details || dData || {};

          if (typeof u.aboutMe === 'string')  setAbout(u.aboutMe);
          if (Array.isArray(u.skillsJson))    setSkills(u.skillsJson);
          if (Array.isArray(u.languagesJson)) setLanguages(u.languagesJson);
          if (Array.isArray(u.hobbiesJson))   setHobbies(u.hobbiesJson);
          if (Array.isArray(u.educationJson)) setEducation(u.educationJson);

          const wp = u.workPreferences || {};
          if (wp.workStatus)   setPrefStatus(wp.workStatus);
          if (wp.workType)     setPrefWorkType(wp.workType);
          if (wp.startDate)    setPrefStart(wp.startDate);
          if (Array.isArray(wp.locations)) setPrefLocations(wp.locations);
          if (typeof wp.willingToRelocate === 'boolean')
            setPrefRelocate(wp.willingToRelocate ? 'Yes' : 'No');
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        if (!cancelled) setServerLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  //  Debounced auto-save for content fields
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!serverLoaded) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        await fetch('/api/profile/details', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            name, pronouns, headline, location, status,
            aboutMe: about,
            workPreferences: {
              workStatus: prefStatus,
              workType: prefWorkType,
              locations: prefLocations,
              startDate: prefStart,
              willingToRelocate:
                prefRelocate === 'Yes' ? true
                : prefRelocate === 'No' ? false
                : null,
            },
            skillsJson:   skills,
            languagesJson: languages,
            hobbiesJson:  hobbies,
            educationJson: education,
          }),
        });
      } catch (err) {
        if (err?.name !== 'AbortError') console.error('Auto-save failed:', err);
      }
    }, 900);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [
    serverLoaded,
    name, pronouns, headline, location, status, about,
    prefStatus, prefWorkType, prefRelocate, prefLocations, prefStart,
    skills, languages, hobbies, education,
  ]);

  // ─────────────────────────────────────────────────────────────────────────
  //  Header save — avatar, banner, wallpaper, slug, visibility
  //  This is explicit (user hits "Save appearance") so visual changes are
  //  committed to DB. The live preview updates instantly without this.
  // ─────────────────────────────────────────────────────────────────────────
  const handleHeaderSave = useCallback(async () => {
    setHeaderSaving(true);
    setHeaderSaveMsg('');
    const cleanSlug = slugValue.trim().toLowerCase().replace(/\s+/g, '-');
    const profileVisibility =
      visibility === 'public'      ? 'PUBLIC'
      : visibility === 'recruiters' ? 'RECRUITERS_ONLY'
      : 'PRIVATE';
    try {
      const res = await fetch('/api/profile/header', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatarUrl:    avatarUrl || null,
          coverUrl:     coverUrl || null,
          wallpaperUrl: wallpaperUrl || null,
          bannerMode,
          bannerHeight: bannerH,
          bannerFocalY: focalY,
          slug:         cleanSlug,
          profileVisibility,
          isProfilePublic: profileVisibility === 'PUBLIC',
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      const data = await res.json();
      const u = data.user || data;
      if (u.slug) { setSlug(u.slug); setSlugValue(u.slug); }
      setHeaderSaveMsg('Appearance saved ✓');
      // Notify layout (wallpaper background update)
      window.dispatchEvent(new CustomEvent('profileHeaderUpdated', {
        detail: { wallpaperUrl: u.wallpaperUrl ?? wallpaperUrl },
      }));
    } catch (err) {
      console.error(err);
      setHeaderSaveMsg('Save failed — try again');
    } finally {
      setHeaderSaving(false);
      setTimeout(() => setHeaderSaveMsg(''), 3000);
    }
  }, [avatarUrl, coverUrl, wallpaperUrl, bannerMode, bannerH, focalY, slugValue, visibility]);

  // ─────────────────────────────────────────────────────────────────────────
  //  Avatar change handler — instant blob preview + CDN swap
  //
  //  ProfileAvatarSelector calls onChange with either:
  //    (a) a preset URL string  → show immediately
  //    (b) a data: URL          → show immediately as blob preview
  //    (c) a CDN URL            → show after upload resolves (replaces (b))
  //    (d) null                 → removed, fall back to initials
  //
  //  Because avatarUrl is now lifted to this page, both the avatar preview
  //  strip and the live preview panel update the moment onChange fires —
  //  even before the upload completes.
  // ─────────────────────────────────────────────────────────────────────────
  const handleAvatarChange = useCallback((url) => {
    setAvatarUrl(url || '');
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  //  Derived values
  // ─────────────────────────────────────────────────────────────────────────
  const initials = useMemo(() => {
    const n = String(name || '').trim();
    if (!n) return 'FT';
    const parts = n.split(/\s+/).filter(Boolean);
    return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || 'FT';
  }, [name]);

  const profileHref = slug ? `/u/${slug}` : '/profile';

  const DEFAULT_WALLPAPER = '/images/profile-fallbacks/profile-default-wallpaper.png';
  const effectiveWallpaper = wallpaperUrl || DEFAULT_WALLPAPER;
  const bannerImage = coverUrl
    ? `url(${coverUrl})`
    : 'linear-gradient(135deg, #0D1B2A 0%, #1a3048 50%, #0D1B2A 100%)';
  const bannerPos = `center ${focalY}%`;

  // ─────────────────────────────────────────────────────────────────────────
  //  Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <Head>
        <title>Edit Profile | ForgeTomorrow</title>
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800;900&family=Inter:wght@300;400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </Head>

      <GlobalStyles />

      <SeekerLayout title="Edit Profile | ForgeTomorrow" activeNav="profile">
        <div className="ep-page">

          {/* ── Top bar ── */}
          <div className="ep-topbar">
            <div className="ep-topbar-left">
              <span className="ep-topbar-title">Editing your profile</span>
              {slug && (
                <Link href={profileHref} className="ep-view-link">
                  View live profile →
                </Link>
              )}
            </div>
            <div className="ep-topbar-right">
              {headerSaveMsg && (
                <span className={`ep-save-msg ${headerSaveMsg.includes('✓') ? 'ok' : 'err'}`}>
                  {headerSaveMsg}
                </span>
              )}
              <button
                className="ep-btn-primary"
                onClick={handleHeaderSave}
                disabled={headerSaving}
              >
                {headerSaving ? 'Saving…' : 'Save appearance'}
              </button>
            </div>
          </div>

          {/* ── Tab nav ── */}
          <nav className="ep-tabs" aria-label="Profile sections">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`ep-tab ${activeTab === t.id ? 'active' : ''}`}
                onClick={() => setActiveTab(t.id)}
              >
                <span className="ep-tab-icon" aria-hidden="true">{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </nav>

          {/* ── Body: editor col + preview rail ── */}
          <div className="ep-body">

            {/* ────────── EDITOR COL ────────── */}
            <div className="ep-editor-col">

              {/* ══ WHO I AM ══ */}
              {activeTab === 'who' && (
                <div className="ep-section-stack">

                  {/* Appearance card */}
                  <EditorCard
                    title="Appearance"
                    subtitle="Avatar, banner, wallpaper — all update in the preview instantly"
                    accent
                  >
                    {/* Avatar with instant preview */}
                    <Field label="Profile photo">
                      <div className="ep-avatar-row">
                        <div className="ep-avatar-now-ring">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt="Your current avatar" className="ep-avatar-now-img" />
                          ) : (
                            <div className="ep-avatar-now-initials">{initials}</div>
                          )}
                        </div>
                        <div>
                          <div className="ep-avatar-now-title">Current photo</div>
                          <div className="ep-avatar-now-sub">Updates instantly when you pick a new one</div>
                        </div>
                      </div>
                      <ProfileAvatarSelector value={avatarUrl} onChange={handleAvatarChange} />
                    </Field>

                    <HRule />

                    {/* Banner */}
                    <Field label="Profile banner">
                      <BannerPicker
                        coverUrl={coverUrl}
                        setCoverUrl={setCoverUrl}
                        bannerMoreOpen={bannerMoreOpen}
                        setBannerMoreOpen={setBannerMoreOpen}
                      />
                      <div className="ep-sub-controls">
                        <ModeToggle value={bannerMode} onChange={setBannerMode} />
                        <span className="ep-hint">{bannerH}px</span>
                        <input
                          type="range" min={80} max={400} step={4} value={bannerH}
                          onChange={(e) => setBannerH(Number(e.target.value))}
                          className="ep-range"
                        />
                      </div>
                      {bannerMode === 'cover' && (
                        <div className="ep-sub-controls" style={{ marginTop: 6 }}>
                          <span className="ep-hint">Vertical focus</span>
                          <input
                            type="range" min={0} max={100} value={focalY}
                            onChange={(e) => setFocalY(Number(e.target.value))}
                            className="ep-range"
                          />
                          <span className="ep-hint">{focalY}%</span>
                        </div>
                      )}
                    </Field>

                    <HRule />

                    {/* Wallpaper */}
                    <Field label="Page wallpaper">
                      <WallpaperPicker
                        wallpaperUrl={wallpaperUrl}
                        setWallpaperUrl={setWallpaperUrl}
                        wallpaperMoreOpen={wallpaperMoreOpen}
                        setWallpaperMoreOpen={setWallpaperMoreOpen}
                      />
                    </Field>

                    <HRule />

                    {/* Slug */}
                    <Field label="Your profile URL">
                      <div className="ep-slug-row">
                        <span className="ep-slug-prefix">forgetomorrow.com/u/</span>
                        <input
                          className="ep-input ep-slug-input"
                          value={slugValue}
                          onChange={(e) => setSlugValue(e.target.value)}
                          placeholder="your-name"
                        />
                      </div>
                    </Field>

                    {/* Visibility */}
                    <Field label="Visibility">
                      <div className="ep-pill-row">
                        {[
                          { v: 'private',    l: 'Private'         },
                          { v: 'public',     l: 'Public'          },
                          { v: 'recruiters', l: 'Recruiters only' },
                        ].map(({ v, l }) => (
                          <button
                            key={v}
                            type="button"
                            className={`ep-pill ${visibility === v ? 'active' : ''}`}
                            onClick={() => setVisibility(v)}
                          >
                            {l}
                          </button>
                        ))}
                      </div>
                    </Field>

                    <div className="ep-card-save-row">
                      {headerSaveMsg && (
                        <span className={`ep-save-msg ${headerSaveMsg.includes('✓') ? 'ok' : 'err'}`}>
                          {headerSaveMsg}
                        </span>
                      )}
                      <button
                        className="ep-btn-primary"
                        onClick={handleHeaderSave}
                        disabled={headerSaving}
                      >
                        {headerSaving ? 'Saving…' : 'Save appearance'}
                      </button>
                    </div>
                  </EditorCard>

                  {/* Identity text fields */}
                  <EditorCard title="Identity" subtitle="Name, headline, location">
                    <div className="ep-two-col">
                      <Field label="Display name">
                        <input className="ep-input" value={name}
                          onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
                      </Field>
                      <Field label="Pronouns">
                        <input className="ep-input" value={pronouns}
                          onChange={(e) => setPronouns(e.target.value)} placeholder="e.g. they/them" />
                      </Field>
                      <Field label="Headline" full>
                        <input className="ep-input" value={headline}
                          onChange={(e) => setHeadline(e.target.value)}
                          placeholder="e.g. Senior Product Designer at Acme" maxLength={120} />
                      </Field>
                      <Field label="Location">
                        <input className="ep-input" value={location}
                          onChange={(e) => setLocation(e.target.value)} placeholder="City, State or Remote" />
                      </Field>
                      <Field label="Status">
                        <input className="ep-input" value={status}
                          onChange={(e) => setStatus(e.target.value)} placeholder="e.g. Open to work" />
                      </Field>
                    </div>
                    <p className="ep-autosave-note">✦ Changes save automatically</p>
                  </EditorCard>

                </div>
              )}

              {/* ══ WHAT I BRING ══ */}
              {activeTab === 'bring' && (
                <div className="ep-section-stack">
                  <ProfileSectionRow
                    id="about" title="About" subtitle="Your story in 6–10 lines"
                    hintTitle="About yourself"
                    hintBullets={[
                      'Open with a concrete outcome (e.g. reduced churn 18%).',
                      'Mention your domain and tools.',
                      'Say what you want next so people know how to help.',
                    ]}
                  >
                    <ProfileAbout about={about} setAbout={setAbout} />
                  </ProfileSectionRow>

                  <ProfileSectionRow
                    id="preferences" title="Work preferences" subtitle="Discovery settings"
                    hintTitle="Preferences help discovery"
                    hintBullets={[
                      'Select work type (remote, onsite, hybrid).',
                      'Add preferred locations to appear in local searches.',
                      'Optional: earliest start date and relocation.',
                    ]}
                  >
                    <ProfilePreferences
                      prefStatus={prefStatus}       setPrefStatus={setPrefStatus}
                      prefWorkType={prefWorkType}   setPrefWorkType={setPrefWorkType}
                      prefRelocate={prefRelocate}   setPrefRelocate={setPrefRelocate}
                      prefLocations={prefLocations} setPrefLocations={setPrefLocations}
                      prefStart={prefStart}         setPrefStart={setPrefStart}
                    />
                  </ProfileSectionRow>

                  <ProfileSectionRow
                    id="skills" title="Skills" subtitle="8–12 is the sweet spot"
                    hintTitle="Strengthen your skills"
                    hintBullets={[
                      'Aim for 8–12 core skills.',
                      'Match target job descriptions.',
                      'Include tools and frameworks.',
                    ]}
                  >
                    <ProfileSkills skills={skills} setSkills={setSkills} />
                  </ProfileSectionRow>

                  <ProfileSectionRow
                    id="languages" title="Languages" subtitle="Spoken or programming"
                    hintTitle="Languages add context"
                    hintBullets={[
                      'Add spoken or programming languages.',
                      'Helps with multilingual or global roles.',
                    ]}
                  >
                    <ProfileLanguages languages={languages} setLanguages={setLanguages} />
                  </ProfileSectionRow>
                </div>
              )}

              {/* ══ WHERE I'VE BEEN ══ */}
              {activeTab === 'been' && (
                <div className="ep-section-stack">
                  <ProfileSectionRow
                    id="education" title="Education" subtitle="Degrees, certificates, programs"
                    hintTitle="Education"
                    hintBullets={[
                      'List your school/program and degree.',
                      "Add a field/major if it helps recruiters understand your path.",
                      'Keep it clean and factual.',
                    ]}
                  >
                    <ProfileEducation education={education} setEducation={setEducation} />
                  </ProfileSectionRow>

                  <ProfileSectionRow
                    id="hobbies" title="Hobbies" subtitle="Optional, but human"
                    hintTitle="Hobbies (optional)"
                    hintBullets={[
                      'Keep it professional-friendly.',
                      'One or two is enough.',
                      'Adds personality without distracting from the resume.',
                    ]}
                  >
                    <ProfileHobbies hobbies={hobbies} setHobbies={setHobbies} />
                  </ProfileSectionRow>
                </div>
              )}

              {/* ══ YOUR DOCUMENTS ══ */}
              {activeTab === 'documents' && (
                <div className="ep-section-stack">
                  <ProfileSectionRow
                    id="docs"
                    title="Resume and cover letter"
                    subtitle="Make it easy to say yes"
                    hintTitle={DOCS_HINT.title}
                    hintBullets={DOCS_HINT.bullets}
                  >
                    <div className={`ep-docs-wrap ${isMobile ? 'stacked' : ''}`}>
                      <DocFocusCard
                        title="Primary Resume"
                        active={docsFocus === 'resume'}
                        onActivate={() => setDocsFocus('resume')}
                        stacked={isMobile}
                      >
                        <ProfileResumeAttach withChrome={withChrome} />
                      </DocFocusCard>

                      <DocFocusCard
                        title="Primary Cover Letter"
                        active={docsFocus === 'cover'}
                        onActivate={() => setDocsFocus('cover')}
                        stacked={isMobile}
                      >
                        <ProfileCoverAttach withChrome={withChrome} />
                      </DocFocusCard>
                    </div>
                  </ProfileSectionRow>
                </div>
              )}

            </div>{/* /ep-editor-col */}

            {/* ────────── LIVE PREVIEW RAIL (desktop only) ────────── */}
            {!isMobile && (
              <aside className="ep-preview-rail" aria-label="Live profile preview">
                <div className="ep-preview-header">
                  <span className="ep-preview-live-dot" />
                  <span className="ep-preview-live-label">Live preview</span>
                </div>

                <LivePreviewCard
                  wallpaperUrl={effectiveWallpaper}
                  bannerImage={bannerImage}
                  bannerPos={bannerPos}
                  bannerH={bannerH}
                  bannerMode={bannerMode}
                  avatarUrl={avatarUrl}
                  initials={initials}
                  name={name}
                  pronouns={pronouns}
                  headline={headline}
                  location={location}
                  status={status}
                  skills={skills}
                  languages={languages}
                  hobbies={hobbies}
                  slug={slug}
                />

                {slug && (
                  <Link href={profileHref} className="ep-preview-open-btn">
                    Open full profile →
                  </Link>
                )}
              </aside>
            )}

          </div>{/* /ep-body */}
        </div>{/* /ep-page */}
      </SeekerLayout>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  LivePreviewCard
//  Mirrors [slug].js identity block at preview scale.
//  Updates in real time as the user edits — no save needed.
// ─────────────────────────────────────────────────────────────────────────────
function LivePreviewCard({
  wallpaperUrl, bannerImage, bannerPos, bannerH, bannerMode,
  avatarUrl, initials, name, pronouns, headline, location, status,
  skills, languages, hobbies, slug,
}) {
  const previewBannerH = Math.round(bannerH * 0.265);
  const safeStr = (v) => (typeof v === 'string' ? v : v?.name || v?.label || '');

  return (
    <div className="lp-card">
      {/* Wallpaper */}
      <div className="lp-wallpaper" style={{ backgroundImage: `url(${wallpaperUrl})` }} />
      <div className="lp-overlay" />

      <div className="lp-inner">
        {/* Banner */}
        <div
          className="lp-banner"
          style={{
            backgroundImage: bannerImage,
            backgroundPosition: bannerPos,
            backgroundSize: bannerMode === 'fit' ? 'contain' : 'cover',
            height: previewBannerH,
          }}
        />

        {/* Identity */}
        <div className="lp-identity">
          <div className="lp-avatar-ring">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="lp-avatar-img" />
            ) : (
              <div className="lp-avatar-initials">{initials}</div>
            )}
          </div>
          <div className="lp-id-text">
            <div className="lp-name">{name || 'Your Name'}</div>
            {pronouns && <div className="lp-pronouns">{pronouns}</div>}
            {headline  && <div className="lp-headline">{headline}</div>}
            <div className="lp-chips-row">
              {location && (
                <span className="lp-chip">
                  <svg width="6" height="8" viewBox="0 0 11 13" fill="currentColor" style={{flexShrink:0}}>
                    <path d="M5.5 0A4.5 4.5 0 001 4.5C1 8.25 5.5 13 5.5 13S10 8.25 10 4.5A4.5 4.5 0 005.5 0zm0 6.25A1.75 1.75 0 113.75 4.5 1.752 1.752 0 015.5 6.25z"/>
                  </svg>
                  {location}
                </span>
              )}
              {status && (
                <span className="lp-chip lp-chip-orange">
                  <span className="lp-status-dot" />{status}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Skills */}
        {skills.length > 0 && (
          <div className="lp-section">
            <div className="lp-section-label">Skills</div>
            <div className="lp-tags">
              {skills.slice(0, 8).map((s, i) => {
                const label = safeStr(s);
                return label ? (
                  <span key={i} className={`lp-tag ${i < 3 ? 'accent' : ''}`}>{label}</span>
                ) : null;
              })}
            </div>
          </div>
        )}

        {/* Languages */}
        {languages.length > 0 && (
          <div className="lp-section">
            <div className="lp-section-label">Languages</div>
            <div className="lp-tags">
              {languages.slice(0, 4).map((l, i) => {
                const label = safeStr(l);
                return label ? <span key={i} className="lp-tag">{label}</span> : null;
              })}
            </div>
          </div>
        )}

        {/* Hobbies */}
        {hobbies.length > 0 && (
          <div className="lp-section">
            <div className="lp-section-label">Interests</div>
            <div className="lp-tags">
              {hobbies.slice(0, 4).map((h, i) => {
                const label = safeStr(h);
                return label ? <span key={i} className="lp-tag">{label}</span> : null;
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="lp-footer">
          <span className="lp-ft-mark">ForgeTomorrow</span>
          {slug && <span className="lp-slug">forgetomorrow.com/u/{slug}</span>}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  BannerPicker
// ─────────────────────────────────────────────────────────────────────────────
function BannerPicker({ coverUrl, setCoverUrl, bannerMoreOpen, setBannerMoreOpen }) {
  return (
    <div className="picker-wrap">
      <div className="picker-row">
        <button type="button"
          className={`picker-none ${!coverUrl ? 'active' : ''}`}
          onClick={() => setCoverUrl('')}
        >None</button>

        {profileBanners.slice(0, 4).map((b) => (
          <button key={b.key} type="button"
            className={`picker-thumb ${coverUrl === b.src ? 'active' : ''}`}
            onClick={() => setCoverUrl(b.src)} title={b.name}
          >
            <img src={b.src} alt={b.name} />
          </button>
        ))}

        <button type="button" className="picker-more"
          onClick={() => setBannerMoreOpen(v => !v)}
        >{bannerMoreOpen ? 'Less' : 'More…'}</button>
      </div>

      {bannerMoreOpen && (
        <div className="picker-grid">
          {profileBanners.map((b) => (
            <button key={b.key} type="button"
              className={`picker-grid-item ${coverUrl === b.src ? 'active' : ''}`}
              onClick={() => setCoverUrl(b.src)}
            >
              <img src={b.src} alt={b.name} />
              <span>{b.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  WallpaperPicker
// ─────────────────────────────────────────────────────────────────────────────
function WallpaperPicker({ wallpaperUrl, setWallpaperUrl, wallpaperMoreOpen, setWallpaperMoreOpen }) {
  return (
    <div className="picker-wrap">
      <div className="picker-row">
        <button type="button"
          className={`picker-none ${!wallpaperUrl ? 'active' : ''}`}
          onClick={() => setWallpaperUrl('')}
        >Default</button>

        {profileWallpapers.slice(0, 4).map((w) => (
          <button key={w.key} type="button"
            className={`picker-thumb ${wallpaperUrl === w.src ? 'active' : ''}`}
            onClick={() => setWallpaperUrl(w.src)} title={w.name}
          >
            <img src={w.src} alt={w.name} />
          </button>
        ))}

        <button type="button" className="picker-more"
          onClick={() => setWallpaperMoreOpen(v => !v)}
        >{wallpaperMoreOpen ? 'Less' : 'More…'}</button>
      </div>

      {wallpaperMoreOpen && (
        <div className="picker-grid">
          {profileWallpapers.map((w) => (
            <button key={w.key} type="button"
              className={`picker-grid-item ${wallpaperUrl === w.src ? 'active' : ''}`}
              onClick={() => setWallpaperUrl(w.src)}
            >
              <img src={w.src} alt={w.name} />
              <span>{w.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  DocFocusCard — reskinned for dark theme
// ─────────────────────────────────────────────────────────────────────────────
function DocFocusCard({ title, active, onActivate, stacked = false, children }) {
  return (
    <div
      className={`ep-doc-card ${active ? 'active' : ''} ${stacked ? 'stacked' : ''}`}
      onClick={() => !active && onActivate()}
      role={!active ? 'button' : undefined}
      tabIndex={!active ? 0 : undefined}
      onKeyDown={(e) => {
        if (!active && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onActivate();
        }
      }}
      aria-label={active ? `${title} expanded` : `${title} — click to expand`}
    >
      <div className="ep-doc-header">
        <div className={`ep-doc-dot ${active ? 'active' : ''}`} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="ep-doc-title">{title}</div>
          <div className="ep-doc-sub">{active ? 'Expanded' : 'Click to expand'}</div>
        </div>
        {!active && (
          <button
            type="button"
            className="ep-doc-expand-btn"
            onClick={(e) => { e.stopPropagation(); onActivate(); }}
          >Expand →</button>
        )}
      </div>

      <div className="ep-doc-body" style={{ maxHeight: active ? 1600 : 200 }}>
        {children}
        {!active && <div className="ep-doc-fade" />}
      </div>

      {!active && (
        <div className="ep-doc-footer">
          <span>Click to expand and manage.</span>
          <button
            type="button"
            className="ep-btn-primary small"
            onClick={(e) => { e.stopPropagation(); onActivate(); }}
          >Expand</button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Tiny layout helpers
// ─────────────────────────────────────────────────────────────────────────────
function EditorCard({ title, subtitle, accent = false, children }) {
  return (
    <div className={`ep-card ${accent ? 'accent' : ''}`}>
      <div className="ep-card-head">
        <div className="ep-card-title">{title}</div>
        {subtitle && <div className="ep-card-sub">{subtitle}</div>}
      </div>
      <div className="ep-card-body">{children}</div>
    </div>
  );
}

function Field({ label, full = false, children }) {
  return (
    <div className={`ep-field ${full ? 'full' : ''}`}>
      <label className="ep-field-label">{label}</label>
      {children}
    </div>
  );
}

function HRule() {
  return <div className="ep-hrule" />;
}

function ModeToggle({ value, onChange }) {
  return (
    <div className="ep-mode-toggle">
      {['cover', 'fit'].map((v) => (
        <button
          key={v}
          type="button"
          className={`ep-mode-btn ${value === v ? 'active' : ''}`}
          onClick={() => onChange(v)}
        >
          {v === 'cover' ? 'Cover' : 'Fit'}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Global styles — dark navy matching [slug].js exactly
// ─────────────────────────────────────────────────────────────────────────────
function GlobalStyles() {
  return (
    <style jsx global>{`
      body { font-family: 'DM Sans', 'Inter', system-ui, sans-serif; }

      /* ── Page shell ── */
      .ep-page {
        display: flex; flex-direction: column;
        gap: ${GAP}px; min-height: 100vh;
      }

      /* ── Top bar ── */
      .ep-topbar {
        display: flex; align-items: center; justify-content: space-between;
        gap: 12px; flex-wrap: wrap;
        padding: 14px 20px;
        background: ${CARD_BG};
        border: 1px solid ${BORDER};
        border-radius: 16px;
        backdrop-filter: ${BLUR};
        -webkit-backdrop-filter: ${BLUR};
        box-shadow: 0 8px 24px rgba(0,0,0,0.22);
      }
      .ep-topbar-left  { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
      .ep-topbar-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
      .ep-topbar-title {
        font-family: 'Playfair Display', Georgia, serif;
        font-size: 19px; font-weight: 700;
        color: ${WHITE}; letter-spacing: -0.2px;
      }
      .ep-view-link {
        font-size: 13px; font-weight: 500;
        color: ${ORANGE}; text-decoration: none;
        border: 1px solid ${ORANGE_BORDER};
        border-radius: 999px; padding: 5px 13px;
        transition: background 0.15s;
      }
      .ep-view-link:hover { background: ${ORANGE_DIM}; }

      /* ── Buttons ── */
      .ep-btn-primary {
        background: ${ORANGE}; color: white;
        border: none; border-radius: 10px;
        padding: 9px 18px;
        font-size: 13px; font-weight: 600;
        font-family: 'DM Sans', sans-serif;
        cursor: pointer; white-space: nowrap;
        transition: background 0.15s, transform 0.1s, opacity 0.15s;
      }
      .ep-btn-primary:hover:not(:disabled) { background: #FF8A65; }
      .ep-btn-primary:active:not(:disabled) { transform: scale(0.97); }
      .ep-btn-primary:disabled { opacity: 0.6; cursor: default; }
      .ep-btn-primary.small { padding: 6px 12px; font-size: 12px; }

      /* ── Save message ── */
      .ep-save-msg {
        font-size: 12px; font-weight: 500;
        padding: 4px 10px; border-radius: 999px;
      }
      .ep-save-msg.ok  { background: rgba(34,197,94,0.14); color: #4ade80; }
      .ep-save-msg.err { background: rgba(239,68,68,0.14);  color: #f87171; }

      /* ── Tab nav ── */
      .ep-tabs {
        display: flex; gap: 4px;
        overflow-x: auto; scrollbar-width: none;
        padding: 4px;
        background: ${CARD_BG};
        border: 1px solid ${BORDER};
        border-radius: 16px;
        backdrop-filter: ${BLUR};
        -webkit-backdrop-filter: ${BLUR};
      }
      .ep-tabs::-webkit-scrollbar { display: none; }
      .ep-tab {
        flex: 1; min-width: 90px;
        display: flex; align-items: center; justify-content: center; gap: 7px;
        padding: 10px 12px;
        border: 1px solid transparent;
        background: transparent;
        border-radius: 11px;
        font-family: 'DM Sans', sans-serif;
        font-size: 13px; font-weight: 500;
        color: ${MUTED}; cursor: pointer;
        transition: background 0.18s, color 0.18s, border-color 0.18s;
        white-space: nowrap;
      }
      .ep-tab:hover { background: rgba(255,255,255,0.06); color: ${WHITE}; }
      .ep-tab.active {
        background: ${ORANGE_DIM};
        color: ${ORANGE};
        border-color: ${ORANGE_BORDER};
      }
      .ep-tab-icon { font-size: 13px; }

      /* ── Body grid ── */
      .ep-body {
        display: grid;
        grid-template-columns: minmax(0, 1fr) ${PREVIEW_W}px;
        gap: ${GAP}px;
        align-items: start;
      }
      @media (max-width: 899px) {
        .ep-body { grid-template-columns: 1fr; }
      }

      .ep-editor-col { display: flex; flex-direction: column; gap: ${GAP}px; min-width: 0; }
      .ep-section-stack { display: flex; flex-direction: column; gap: ${GAP}px; }

      /* ── Editor card ── */
      .ep-card {
        background: ${CARD_BG};
        border: 1px solid ${BORDER};
        border-radius: 18px;
        backdrop-filter: ${BLUR};
        -webkit-backdrop-filter: ${BLUR};
        overflow: hidden;
        box-shadow: 0 8px 24px rgba(0,0,0,0.20);
      }
      .ep-card.accent { border-color: ${ORANGE_BORDER}; }
      .ep-card-head {
        padding: 18px 22px 14px;
        border-bottom: 1px solid ${BORDER};
      }
      .ep-card-title {
        font-family: 'Playfair Display', Georgia, serif;
        font-size: 16px; font-weight: 700; color: ${WHITE};
      }
      .ep-card-sub { font-size: 12px; color: ${MUTED}; margin-top: 3px; }
      .ep-card-body { padding: 20px 22px; display: flex; flex-direction: column; gap: 20px; }
      .ep-card-save-row {
        display: flex; align-items: center; justify-content: flex-end;
        gap: 10px; padding-top: 4px;
      }

      /* ── Fields ── */
      .ep-two-col {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
      }
      @media (max-width: 560px) { .ep-two-col { grid-template-columns: 1fr; } }

      .ep-field { display: flex; flex-direction: column; gap: 6px; }
      .ep-field.full { grid-column: 1 / -1; }
      .ep-field-label {
        font-size: 11px; font-weight: 600;
        letter-spacing: 0.08em; text-transform: uppercase; color: ${MUTED};
      }
      .ep-input {
        background: rgba(255,255,255,0.06);
        border: 1px solid ${BORDER};
        border-radius: 10px;
        padding: 9px 13px;
        font-size: 14px; font-family: 'DM Sans', sans-serif; color: ${WHITE};
        outline: none; width: 100%;
        transition: border-color 0.15s, background 0.15s;
      }
      .ep-input:focus {
        border-color: ${ORANGE_BORDER};
        background: rgba(255,255,255,0.09);
      }
      .ep-input::placeholder { color: ${MUTED}; opacity: 0.55; }
      .ep-hint { font-size: 11px; color: ${MUTED}; white-space: nowrap; }
      .ep-hrule { height: 1px; background: ${BORDER}; }
      .ep-autosave-note { font-size: 11px; color: ${MUTED}; opacity: 0.65; margin-top: -4px; }

      /* ── Avatar row ── */
      .ep-avatar-row {
        display: flex; align-items: center; gap: 14px;
        padding: 12px 14px;
        background: rgba(255,255,255,0.04);
        border: 1px solid ${BORDER};
        border-radius: 12px;
        margin-bottom: 10px;
      }
      .ep-avatar-now-ring {
        width: 58px; height: 58px; border-radius: 50%;
        border: 2px solid ${ORANGE}; overflow: hidden; flex-shrink: 0;
        box-shadow: 0 0 0 3px ${ORANGE_DIM};
      }
      .ep-avatar-now-img  { width:100%; height:100%; object-fit:cover; display:block; }
      .ep-avatar-now-initials {
        width:100%; height:100%; display:grid; place-items:center;
        background: linear-gradient(135deg, ${ORANGE}, #FF5722);
        color: white; font-weight: 700; font-size: 18px;
      }
      .ep-avatar-now-title { font-size: 13px; font-weight: 500; color: ${WHITE}; }
      .ep-avatar-now-sub   { font-size: 11px; color: ${MUTED}; margin-top: 2px; }

      /* ── Sub-controls row ── */
      .ep-sub-controls {
        display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
        margin-top: 10px;
      }
      .ep-range { flex: 1; min-width: 80px; accent-color: ${ORANGE}; }
      .ep-mode-toggle { display: flex; gap: 6px; }
      .ep-mode-btn {
        padding: 5px 12px; border-radius: 8px;
        border: 1px solid ${BORDER}; background: transparent;
        color: ${MUTED}; font-size: 12px; font-weight: 600;
        font-family: 'DM Sans', sans-serif; cursor: pointer;
        transition: all 0.15s;
      }
      .ep-mode-btn.active { border-color: ${ORANGE_BORDER}; color: ${ORANGE}; background: ${ORANGE_DIM}; }

      /* ── Slug row ── */
      .ep-slug-row { display: flex; align-items: center; }
      .ep-slug-prefix {
        font-size: 12px; color: ${MUTED}; white-space: nowrap;
        padding: 9px 10px;
        background: rgba(255,255,255,0.04); border: 1px solid ${BORDER};
        border-right: none; border-radius: 10px 0 0 10px;
      }
      .ep-slug-input { border-radius: 0 10px 10px 0 !important; }

      /* ── Pill rows (visibility) ── */
      .ep-pill-row { display: flex; gap: 8px; flex-wrap: wrap; }
      .ep-pill {
        padding: 6px 14px; border-radius: 999px;
        border: 1px solid ${BORDER}; background: transparent;
        color: ${MUTED}; font-size: 12px; font-weight: 600;
        font-family: 'DM Sans', sans-serif; cursor: pointer;
        transition: all 0.15s;
      }
      .ep-pill.active { background: ${ORANGE}; border-color: ${ORANGE}; color: white; }

      /* ── Pickers ── */
      .picker-wrap { display: flex; flex-direction: column; gap: 10px; }
      .picker-row  { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
      .picker-none, .picker-more {
        padding: 5px 12px; border-radius: 999px;
        border: 1px solid ${BORDER}; background: transparent;
        color: ${MUTED}; font-size: 12px; font-weight: 600;
        font-family: 'DM Sans', sans-serif; cursor: pointer; white-space: nowrap;
        transition: all 0.15s;
      }
      .picker-none:hover, .picker-more:hover { color: ${WHITE}; border-color: rgba(255,255,255,0.28); }
      .picker-none.active { border-color: ${ORANGE_BORDER}; color: ${ORANGE}; background: ${ORANGE_DIM}; }
      .picker-thumb {
        padding: 2px; border-radius: 999px;
        border: 2px solid transparent; background: transparent;
        cursor: pointer; line-height: 0; transition: border-color 0.15s;
      }
      .picker-thumb img {
        width: 60px; height: 30px; border-radius: 999px;
        object-fit: cover; display: block;
      }
      .picker-thumb.active { border-color: ${ORANGE}; }
      .picker-grid {
        display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        gap: 8px; padding: 12px;
        background: rgba(255,255,255,0.03);
        border: 1px solid ${BORDER}; border-radius: 12px;
      }
      .picker-grid-item {
        display: flex; flex-direction: column; gap: 5px;
        padding: 6px; border-radius: 10px;
        border: 1px solid transparent; background: transparent;
        cursor: pointer; text-align: left; transition: all 0.15s;
      }
      .picker-grid-item img {
        width: 100%; height: 48px; object-fit: cover;
        border-radius: 7px; display: block;
      }
      .picker-grid-item span { font-size: 10px; color: ${MUTED}; font-weight: 500; }
      .picker-grid-item:hover { border-color: ${BORDER}; background: rgba(255,255,255,0.04); }
      .picker-grid-item.active { border-color: ${ORANGE_BORDER}; background: ${ORANGE_DIM}; }
      .picker-grid-item.active span { color: ${ORANGE}; }

      /* ── Docs layout ── */
      .ep-docs-wrap { display: flex; gap: ${GAP}px; align-items: stretch; width: 100%; }
      .ep-docs-wrap.stacked { flex-direction: column; }

      /* ── Doc card ── */
      .ep-doc-card {
        flex: 1; border-radius: 18px;
        border: 1px solid rgba(255,255,255,0.10);
        background: rgba(255,255,255,0.04);
        backdrop-filter: ${BLUR}; -webkit-backdrop-filter: ${BLUR};
        overflow: hidden; cursor: pointer;
        transition: border-color 0.2s, box-shadow 0.2s;
      }
      .ep-doc-card.active {
        border-color: ${ORANGE_BORDER}; cursor: default;
        box-shadow: 0 8px 28px rgba(255,112,67,0.12);
      }
      .ep-doc-header {
        display: flex; align-items: center; gap: 10px;
        padding: 14px 16px;
        border-bottom: 1px solid rgba(255,255,255,0.07);
      }
      .ep-doc-dot {
        width: 8px; height: 8px; border-radius: 50%;
        background: ${MUTED}; flex-shrink: 0;
        transition: background 0.2s, box-shadow 0.2s;
      }
      .ep-doc-dot.active { background: ${ORANGE}; box-shadow: 0 0 0 3px ${ORANGE_DIM}; }
      .ep-doc-title { font-size: 14px; font-weight: 600; color: ${WHITE}; }
      .ep-doc-sub   { font-size: 11px; color: ${MUTED}; margin-top: 2px; }
      .ep-doc-expand-btn {
        margin-left: auto; border-radius: 999px;
        padding: 5px 12px;
        background: rgba(255,255,255,0.08);
        border: 1px solid ${ORANGE_BORDER};
        color: ${ORANGE}; font-weight: 700; font-size: 12px;
        font-family: 'DM Sans', sans-serif; cursor: pointer; flex-shrink: 0;
      }
      .ep-doc-body {
        overflow: hidden; transition: max-height 280ms ease; position: relative;
      }
      .ep-doc-fade {
        height: 60px; margin-top: -60px;
        background: linear-gradient(to bottom, rgba(13,27,42,0), rgba(13,27,42,0.88));
        pointer-events: none;
      }
      .ep-doc-footer {
        display: flex; align-items: center; justify-content: space-between;
        gap: 10px; padding: 10px 16px;
        border-top: 1px solid rgba(255,255,255,0.07);
        font-size: 12px; color: ${MUTED};
      }

      /* ── Preview rail ── */
      .ep-preview-rail {
        position: sticky; top: 24px; align-self: start;
        display: flex; flex-direction: column; gap: 10px;
        width: ${PREVIEW_W}px;
      }
      .ep-preview-header { display: flex; align-items: center; gap: 7px; }
      .ep-preview-live-dot {
        width: 7px; height: 7px; border-radius: 50%;
        background: #4ade80; flex-shrink: 0;
        animation: epLivePulse 2s ease-in-out infinite;
      }
      @keyframes epLivePulse {
        0%,100% { opacity: 1; box-shadow: 0 0 0 0 rgba(74,222,128,0.5); }
        50%      { opacity: 0.45; box-shadow: 0 0 0 5px rgba(74,222,128,0); }
      }
      .ep-preview-live-label {
        font-size: 11px; font-weight: 600;
        letter-spacing: 0.08em; text-transform: uppercase; color: ${MUTED};
      }
      .ep-preview-open-btn {
        display: block; text-align: center;
        font-size: 12px; font-weight: 600; color: ${ORANGE};
        text-decoration: none; padding: 8px;
        border: 1px solid ${ORANGE_BORDER}; border-radius: 10px;
        transition: background 0.15s;
      }
      .ep-preview-open-btn:hover { background: ${ORANGE_DIM}; }

      /* ── Live preview card ── */
      .lp-card {
        position: relative; border-radius: 14px; overflow: hidden;
        border: 1px solid ${BORDER}; background: ${NAVY}; min-height: 180px;
      }
      .lp-wallpaper {
        position: absolute; inset: 0;
        background-size: cover; background-position: center;
        opacity: 0.5; transition: background-image 0.3s;
      }
      .lp-overlay {
        position: absolute; inset: 0;
        background: linear-gradient(
          180deg,
          rgba(13,27,42,0.55) 0%,
          rgba(13,27,42,0.20) 55%,
          rgba(13,27,42,0.42) 100%
        );
      }
      .lp-inner { position: relative; z-index: 2; display: flex; flex-direction: column; }
      .lp-banner {
        width: 100%; flex-shrink: 0; background-repeat: no-repeat;
        border-radius: 14px 14px 0 0;
        transition: height 0.2s, background-position 0.2s;
        min-height: 4px;
      }
      .lp-identity {
        display: flex; gap: 9px; align-items: center;
        padding: 10px 11px 8px;
        background: rgba(13,27,42,0.60);
        backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
        border-bottom: 1px solid ${BORDER};
      }
      .lp-avatar-ring {
        width: 38px; height: 38px; border-radius: 50%;
        border: 2px solid ${ORANGE}; overflow: hidden; flex-shrink: 0;
        box-shadow: 0 0 0 2px rgba(255,112,67,0.22);
      }
      .lp-avatar-img { width:100%; height:100%; object-fit:cover; display:block; }
      .lp-avatar-initials {
        width:100%; height:100%; display:grid; place-items:center;
        background: linear-gradient(135deg, ${ORANGE}, #FF5722);
        color: white; font-size: 12px; font-weight: 700;
      }
      .lp-id-text { flex: 1; min-width: 0; }
      .lp-name {
        font-family: 'Playfair Display', Georgia, serif;
        font-size: 12px; font-weight: 700; color: ${WHITE};
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .lp-pronouns {
        font-size: 9px; font-weight: 600; color: ${ORANGE};
        letter-spacing: 0.08em; text-transform: uppercase; margin-top: 1px;
      }
      .lp-headline {
        font-size: 10px; color: rgba(248,244,239,0.78); margin-top: 2px;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .lp-chips-row { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 4px; }
      .lp-chip {
        display: inline-flex; align-items: center; gap: 3px;
        font-size: 9px; font-weight: 500;
        color: rgba(248,244,239,0.72);
        background: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.10);
        border-radius: 999px; padding: 2px 7px;
      }
      .lp-chip-orange { color: ${ORANGE}; border-color: rgba(255,112,67,0.22); }
      .lp-status-dot {
        width: 4px; height: 4px; border-radius: 50%;
        background: ${ORANGE}; display: inline-block;
      }
      .lp-section {
        padding: 7px 11px 4px;
        border-bottom: 1px solid rgba(255,255,255,0.05);
      }
      .lp-section-label {
        font-size: 8px; font-weight: 700;
        letter-spacing: 0.12em; text-transform: uppercase;
        color: ${ORANGE}; margin-bottom: 5px;
      }
      .lp-tags { display: flex; flex-wrap: wrap; gap: 4px; }
      .lp-tag {
        font-size: 9px; font-weight: 500; padding: 2px 7px;
        border-radius: 999px;
        background: rgba(255,255,255,0.07);
        border: 1px solid rgba(255,255,255,0.10);
        color: rgba(248,244,239,0.78);
      }
      .lp-tag.accent {
        background: rgba(255,112,67,0.14);
        border-color: rgba(255,112,67,0.28);
        color: ${ORANGE};
      }
      .lp-footer {
        display: flex; align-items: center; justify-content: space-between;
        padding: 7px 11px; gap: 6px;
      }
      .lp-ft-mark { font-size: 9px; font-weight: 700; color: ${ORANGE}; letter-spacing: 0.04em; }
      .lp-slug {
        font-size: 9px; color: ${MUTED};
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 170px;
      }

      /* ── Mobile ── */
      @media (max-width: 767px) {
        .ep-topbar { padding: 11px 14px; }
        .ep-topbar-title { font-size: 16px; }
        .ep-tab { min-width: 76px; padding: 8px 9px; font-size: 12px; }
        .ep-tab-icon { display: none; }
        .ep-card-body { padding: 15px 16px; gap: 16px; }
        .ep-card-head { padding: 14px 16px 10px; }
      }
    `}</style>
  );
}