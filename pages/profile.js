// pages/profile.js ← FINAL VERSION WITH SERVER SYNC + WORK STATUS / RELOCATE + A11Y TWEAKS
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import SeekerLayout from '@/components/layouts/SeekerLayout';

// Self-contained components
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileAbout from '@/components/profile/ProfileAbout';
import ProfileLanguages from '@/components/profile/ProfileLanguages';
import ProfilePreferences from '@/components/profile/ProfilePreferences';
import ProfileResumeAttach from '@/components/profile/ProfileResumeAttach';
import ProfileSkills from '@/components/profile/ProfileSkills';
import ProfileHobbies from '@/components/profile/ProfileHobbies';
import ProfileCoverAttach from '@/components/profile/ProfileCoverAttach';

// Helper shown beside sections
import SectionHint from '@/components/SectionHint';

const UI = { CARD_PAD: 16, SECTION_GAP: 16 };

// LocalStorage keys
const NAME_KEY = 'profile_name_v1';
const PRONOUNS_KEY = 'profile_pronouns_v1';
const TITLE_KEY = 'profile_title_v1';
const LOC_KEY = 'profile_location_v1';
const STATUS_KEY = 'profile_status_v1';
const AVATAR_KEY = 'profile_avatar_v1';
const COVER_KEY = 'profile_cover_v1';
const ABOUT_KEY = 'profile_about_v1';
const SKL_KEY = 'profile_skills_v1';
const LANG_KEY = 'profile_languages_v1';
const PREF_LOC_KEY = 'profile_pref_locations_v1';
const PREF_TYPE_KEY = 'profile_pref_worktype_v1';
const PREF_STATUS_KEY = 'profile_pref_status_v1';
const PREF_RELOC_KEY = 'profile_pref_relocate_v1';
const PREF_START_KEY = 'profile_pref_start_v1';
const HOB_KEY = 'profile_hobbies_v1';
const RESUME_KEY = 'profile_resume_v1';
const WELCOME_DISMISS_KEY = 'profile_welcome_dismissed_v1';

export default function ProfilePage() {
  const router = useRouter();
  const chrome = String(router.query.chrome || '').toLowerCase();
  const withChrome = (path) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

  // ---------------- State ----------------
  const [name, setName] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [headline, setHeadline] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('/demo-profile.jpg');
  const [coverUrl, setCoverUrl] = useState('');
  const [about, setAbout] = useState('');
  const [skills, setSkills] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [prefLocations, setPrefLocations] = useState([]);
  const [prefWorkType, setPrefWorkType] = useState('');
  const [prefStatus, setPrefStatus] = useState('');      // NEW
  const [prefRelocate, setPrefRelocate] = useState('');  // NEW ("Yes" | "No")
  const [prefStart, setPrefStart] = useState('');
  const [hobbies, setHobbies] = useState([]);
  const [resume, setResume] = useState(null);

  // control for welcome banner visibility
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);

  // track server load so we don’t save before initial GET
  const [serverLoaded, setServerLoaded] = useState(false);

  // ---------------- Load from localStorage ----------------
  useEffect(() => {
    try {
      const read = (k, fb) => JSON.parse(localStorage.getItem(k) ?? fb);
      const readStr = (k, fb) => localStorage.getItem(k) ?? fb;

      // LIVE SAFE DEFAULTS:
      // Use neutral/blank fallbacks so we never imply identity/location/etc.
      setName(readStr(NAME_KEY, ''));
      setPronouns(readStr(PRONOUNS_KEY, ''));
      setHeadline(readStr(TITLE_KEY, ''));
      setLocation(readStr(LOC_KEY, ''));
      setStatus(readStr(STATUS_KEY, ''));

      // Keep safe placeholders for images
      setAvatarUrl(readStr(AVATAR_KEY, '/demo-profile.jpg'));
      setCoverUrl(readStr(COVER_KEY, ''));

      setAbout(readStr(ABOUT_KEY, ''));
      setSkills(read(SKL_KEY, '[]'));
      setLanguages(read(LANG_KEY, '[]'));
      setPrefLocations(read(PREF_LOC_KEY, '[]'));
      setPrefWorkType(readStr(PREF_TYPE_KEY, ''));
      setPrefStatus(readStr(PREF_STATUS_KEY, ''));
      setPrefRelocate(readStr(PREF_RELOC_KEY, ''));
      setPrefStart(readStr(PREF_START_KEY, ''));
      setHobbies(read(HOB_KEY, '[]'));
      setResume(read(RESUME_KEY, null));
    } catch (err) {
      console.error('Failed to load from localStorage:', err);
    }
  }, []);

  // ---------------- Load from server (/api/profile/details) ----------------
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/profile/details');
        if (!res.ok) {
          setServerLoaded(true);
          return;
        }

        const data = await res.json();
        if (cancelled) return;

        const u = data.user || {};

        // About
        if (typeof u.aboutMe === 'string' && u.aboutMe.length > 0) {
          setAbout(u.aboutMe);
        }

        // Work preferences JSON blob
        const wp = u.workPreferences || {};
        if (wp.workStatus) setPrefStatus(wp.workStatus);
        if (wp.workType) setPrefWorkType(wp.workType);
        if (Array.isArray(wp.locations)) setPrefLocations(wp.locations);
        if (wp.startDate) setPrefStart(wp.startDate);
        if (typeof wp.willingToRelocate === 'boolean') {
          setPrefRelocate(wp.willingToRelocate ? 'Yes' : 'No');
        }

        // Skills / languages / hobbies (JSON fields)
        if (Array.isArray(u.skillsJson)) setSkills(u.skillsJson);
        if (Array.isArray(u.languagesJson)) setLanguages(u.languagesJson);
        if (Array.isArray(u.hobbiesJson)) setHobbies(u.hobbiesJson);

        setServerLoaded(true);
      } catch (err) {
        console.error('Failed to load profile details from server:', err);
        setServerLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // ---------------- Welcome banner logic ----------------
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (router.query.verified === '1') {
      const dismissed = localStorage.getItem(WELCOME_DISMISS_KEY) === '1';
      if (!dismissed) {
        setShowWelcomeBanner(true);
      }
    }
  }, [router.query.verified]);

  const dismissWelcome = () => {
    try {
      localStorage.setItem(WELCOME_DISMISS_KEY, '1');
    } catch {}
    setShowWelcomeBanner(false);
  };

  // ---------------- Persist to localStorage ----------------
  useEffect(() => { try { localStorage.setItem(NAME_KEY, name); } catch {} }, [name]);
  useEffect(() => { try { localStorage.setItem(PRONOUNS_KEY, pronouns); } catch {} }, [pronouns]);
  useEffect(() => { try { localStorage.setItem(TITLE_KEY, headline); } catch {} }, [headline]);
  useEffect(() => { try { localStorage.setItem(LOC_KEY, location); } catch {} }, [location]);
  useEffect(() => { try { localStorage.setItem(STATUS_KEY, status); } catch {} }, [status]);
  useEffect(() => { try { localStorage.setItem(AVATAR_KEY, avatarUrl); } catch {} }, [avatarUrl]);
  useEffect(() => { try { localStorage.setItem(COVER_KEY, coverUrl); } catch {} }, [coverUrl]);
  useEffect(() => { try { localStorage.setItem(ABOUT_KEY, about); } catch {} }, [about]);
  useEffect(() => { try { localStorage.setItem(SKL_KEY, JSON.stringify(skills)); } catch {} }, [skills]);
  useEffect(() => { try { localStorage.setItem(LANG_KEY, JSON.stringify(languages)); } catch {} }, [languages]);
  useEffect(() => { try { localStorage.setItem(PREF_LOC_KEY, JSON.stringify(prefLocations)); } catch {} }, [prefLocations]);
  useEffect(() => { try { localStorage.setItem(PREF_TYPE_KEY, prefWorkType); } catch {} }, [prefWorkType]);
  useEffect(() => { try { localStorage.setItem(PREF_STATUS_KEY, prefStatus); } catch {} }, [prefStatus]);
  useEffect(() => { try { localStorage.setItem(PREF_RELOC_KEY, prefRelocate); } catch {} }, [prefRelocate]);
  useEffect(() => { try { localStorage.setItem(PREF_START_KEY, prefStart); } catch {} }, [prefStart]);
  useEffect(() => { try { localStorage.setItem(HOB_KEY, JSON.stringify(hobbies)); } catch {} }, [hobbies]);
  useEffect(() => { try { localStorage.setItem(RESUME_KEY, JSON.stringify(resume)); } catch {} }, [resume]);

  // ---------------- Debounced save to server ----------------
  useEffect(() => {
    if (!serverLoaded) return;

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        const body = {
          aboutMe: about || '',
          workPreferences: {
            workStatus: prefStatus || '',
            workType: prefWorkType || '',
            locations: prefLocations || [],
            startDate: prefStart || '',
            willingToRelocate:
              prefRelocate === 'Yes'
                ? true
                : prefRelocate === 'No'
                ? false
                : null,
          },
          skillsJson: skills || [],
          languagesJson: languages || [],
          hobbiesJson: hobbies || [],
        };

        const res = await fetch('/api/profile/details', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!res.ok) {
          console.error('Failed to save profile details');
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('Error saving profile details:', err);
      }
    }, 1000); // 1s debounce

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [
    serverLoaded,
    about,
    prefStatus,
    prefWorkType,
    prefRelocate,
    prefLocations,
    prefStart,
    skills,
    languages,
    hobbies,
  ]);

  // -------- Derived flags --------
  const hasSummary = Boolean(about?.trim());
  const hasSkills = (skills?.length || 0) >= 6;
  const hasLocations = (prefLocations?.length || 0) > 0;
  const hasWorkType = Boolean(prefWorkType);
  const hasLanguages = (languages?.length || 0) > 0;

  // ---------------- Header text ----------------
  const HeaderBox = (
    <section
      style={{
        background: 'white',
        border: '1px solid #eee',
        borderRadius: 12,
        padding: UI.CARD_PAD,
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        textAlign: 'center',
      }}
      aria-label="Profile overview"
    >
      <h1
        style={{
          margin: 0,
          color: '#FF7043',
          fontSize: 24,
          fontWeight: 800,
        }}
      >
        Your Profile
      </h1>
      <p
        style={{
          margin: '6px auto 0',
          color: '#607D8B',
          maxWidth: 720,
        }}
      >
        Give the community a clear, human overview - your resume provides the deep detail.
      </p>
      <div style={{ marginTop: 10 }}>
        <Link
          href={withChrome('/profile-analytics')}
          style={{
            display: 'inline-block',
            background: 'white',
            color: '#FF7043',
            border: '1px solid #FF7043',
            borderRadius: 10,
            padding: '8px 12px',
            fontWeight: 700,
            textDecoration: 'none',
          }}
          aria-label="View Profile Analytics"
        >
          View Profile Analytics
        </Link>
      </div>
    </section>
  );

  return (
    <>
      <Head>
        <title>Profile | ForgeTomorrow</title>
      </Head>
      <SeekerLayout
        title="Profile | ForgeTomorrow"
        header={HeaderBox}
        right={null}
        activeNav="profile"
      >
        {/* EMAIL VERIFIED WELCOME BANNER — DISMISSIBLE, ONLY SHOWS ONCE */}
        {showWelcomeBanner && (
          <section
            className="relative mb-10 p-8 bg-gradient-to-r from-orange-500 to-pink-600 text-white rounded-3xl shadow-2xl text-center max-w-4xl mx-auto"
            role="status"
            aria-live="polite"
            aria-label="Welcome to ForgeTomorrow"
          >
            <button
              type="button"
              onClick={dismissWelcome}
              aria-label="Close welcome message"
              className="absolute top-3 right-3 text-white/80 hover:text-white text-xl leading-none"
            >
              ×
            </button>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Welcome to ForgeTomorrow!
            </h2>
            <p className="text-xl md:text-2xl opacity-95">
              Your email is verified. Complete your profile below and start getting discovered.
            </p>
          </section>
        )}

        <div className="w-full max-w-7xl mx-auto px-4 md:px-6 grid gap-4 md:gap-5">
          {/* Header backer */}
          <section
            className="bg-white border border-gray-200 border-t-0 rounded-xl shadow-sm overflow-hidden pt-0 px-0 pb-0"
            aria-label="Profile header section"
          >
            <ProfileHeader
              name={name}
              pronouns={pronouns}
              headline={headline}
              location={location}
              status={status}
              avatarUrl={avatarUrl}
              coverUrl={coverUrl}
              setName={setName}
              setPronouns={setPronouns}
              setHeadline={setHeadline}
              setLocation={setLocation}
              setStatus={setStatus}
              setAvatarUrl={setAvatarUrl}
              setCoverUrl={setCoverUrl}
            />
          </section>

          {/* ABOUT */}
          <div className="grid md:grid-cols-3 items-start gap-4">
            <div className="md:col-span-2">
              <ProfileAbout about={about} setAbout={setAbout} />
            </div>
            <SectionHint
              title="About Yourself"
              bullets={[
                'Open with a concrete outcome (e.g., “reduced churn 18% in 6 months”).',
                'Mention your domain + tools (industries, platforms, or stacks).',
                'Say what you want next so people know how to help.',
              ]}
            />
          </div>

          {/* PREFERENCES */}
          <div className="grid md:grid-cols-3 items-start gap-4">
            <div className="md:col-span-2">
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
            </div>
            <div className="space-y-4">
              <SectionHint
                title="Preferences help discovery"
                bullets={[
                  'Select work type (remote, onsite, hybrid).',
                  'Add preferred locations to appear in local searches.',
                  'Optional: earliest start date & relocation.',
                ]}
              />
            </div>
          </div>

          {/* SKILLS */}
          <div className="grid md:grid-cols-3 items-start gap-4">
            <div className="md:col-span-2">
              <ProfileSkills
                skills={skills}
                setSkills={setSkills}
                defaultOpen={true}
                initialOpen={true}
              />
            </div>
            {!hasSkills && (
              <SectionHint
                title="Strengthen your skills"
                bullets={[
                  'Aim for 8–12 core skills.',
                  'Match target job descriptions.',
                  'Include tools & frameworks.',
                ]}
              />
            )}
          </div>

          {/* LANGUAGES */}
          <div className="grid md:grid-cols-3 items-start gap-4">
            <div className="md:col-span-2">
              <ProfileLanguages
                languages={languages}
                setLanguages={setLanguages}
                defaultOpen={true}
                initialOpen={true}
              />
            </div>
            {!hasLanguages && (
              <SectionHint
                title="Languages add context"
                bullets={[
                  'Add spoken or programming languages.',
                  'Helps with multilingual or global roles.',
                ]}
              />
            )}
          </div>

          {/* RESUME + COVER */}
          <div className="grid md:grid-cols-3 items-start gap-4">
            <div className="md:col-span-2 space-y-4">
              <ProfileResumeAttach withChrome={withChrome} />
              <ProfileCoverAttach withChrome={withChrome} />
            </div>
            <SectionHint
              title="Make it easy to say yes"
              bullets={[
                'Keep one primary resume linked to your profile.',
                'Save up to 4 alternates for different roles.',
                'Do the same with cover letters so recruiters instantly see your best fit.',
                'Manage all your resumes and cover letters in the builder - you can change your primaries anytime from there.',
              ]}
            />
          </div>

          {/* HOBBIES */}
          <ProfileHobbies hobbies={hobbies} setHobbies={setHobbies} />
        </div>
      </SeekerLayout>
    </>
  );
}
