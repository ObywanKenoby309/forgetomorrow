// pages/profile.js
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import SeekerLayout from '@/components/layouts/SeekerLayout';

import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileAbout from '@/components/profile/ProfileAbout';
import ProfileLanguages from '@/components/profile/ProfileLanguages';
import ProfilePreferences from '@/components/profile/ProfilePreferences';
import ProfileResumeAttach from '@/components/profile/ProfileResumeAttach';
import ProfileSkills from '@/components/profile/ProfileSkills';
import ProfileHobbies from '@/components/profile/ProfileHobbies';
import ProfileCoverAttach from '@/components/profile/ProfileCoverAttach';
import ProfileEducation from '@/components/profile/ProfileEducation';

import ProfileSectionRow from '@/components/profile/ProfileSectionRow';

const UI = { CARD_PAD: 14 };

// LocalStorage keys (legacy cache)
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
const EDU_KEY = 'profile_education_v1';
const WELCOME_DISMISS_KEY = 'profile_welcome_dismissed_v1';

export default function ProfilePage() {
  const router = useRouter();
  const chrome = String(router.query.chrome || '').toLowerCase();
  const withChrome = (path) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

  const [name, setName] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [headline, setHeadline] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('');

  const [avatarUrl, setAvatarUrl] = useState('/profile-avatars/demo-avatar.png');
  const [coverUrl, setCoverUrl] = useState('');
  const [about, setAbout] = useState(null);

  const [skills, setSkills] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [prefLocations, setPrefLocations] = useState([]);
  const [prefWorkType, setPrefWorkType] = useState('');
  const [prefStatus, setPrefStatus] = useState('');
  const [prefRelocate, setPrefRelocate] = useState('');
  const [prefStart, setPrefStart] = useState('');
  const [hobbies, setHobbies] = useState([]);
  const [resume, setResume] = useState(null);

  // NEW: education
  const [education, setEducation] = useState([]);

  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);
  const [serverLoaded, setServerLoaded] = useState(false);

  // ---------------- Load from localStorage (legacy cache) ----------------
  useEffect(() => {
    try {
      const read = (k, fb) => JSON.parse(localStorage.getItem(k) ?? fb);
      const readStr = (k, fb) => localStorage.getItem(k) ?? fb;

      setName(readStr(NAME_KEY, ''));
      setPronouns(readStr(PRONOUNS_KEY, ''));
      setHeadline(readStr(TITLE_KEY, ''));
      setLocation(readStr(LOC_KEY, ''));
      setStatus(readStr(STATUS_KEY, ''));

      setAvatarUrl(readStr(AVATAR_KEY, '/profile-avatars/demo-avatar.png'));
      setCoverUrl(readStr(COVER_KEY, ''));

      const storedAbout = localStorage.getItem(ABOUT_KEY);
      setAbout(storedAbout == null ? null : storedAbout);

      setSkills(read(SKL_KEY, '[]'));
      setLanguages(read(LANG_KEY, '[]'));
      setPrefLocations(read(PREF_LOC_KEY, '[]'));
      setPrefWorkType(readStr(PREF_TYPE_KEY, ''));
      setPrefStatus(readStr(PREF_STATUS_KEY, ''));
      setPrefRelocate(readStr(PREF_RELOC_KEY, ''));
      setPrefStart(readStr(PREF_START_KEY, ''));
      setHobbies(read(HOB_KEY, '[]'));
      setResume(read(RESUME_KEY, null));

      setEducation(read(EDU_KEY, '[]'));
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

        // NEW: education (only if your API supports it)
        if (Array.isArray(u.educationJson)) setEducation(u.educationJson);

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
      if (!dismissed) setShowWelcomeBanner(true);
    }
  }, [router.query.verified]);

  const dismissWelcome = () => {
    try {
      localStorage.setItem(WELCOME_DISMISS_KEY, '1');
    } catch {}
    setShowWelcomeBanner(false);
  };

  // ---------------- Persist to localStorage (legacy cache) ----------------
  useEffect(() => { try { localStorage.setItem(NAME_KEY, name); } catch {} }, [name]);
  useEffect(() => { try { localStorage.setItem(PRONOUNS_KEY, pronouns); } catch {} }, [pronouns]);
  useEffect(() => { try { localStorage.setItem(TITLE_KEY, headline); } catch {} }, [headline]);
  useEffect(() => { try { localStorage.setItem(LOC_KEY, location); } catch {} }, [location]);
  useEffect(() => { try { localStorage.setItem(STATUS_KEY, status); } catch {} }, [status]);
  useEffect(() => { try { localStorage.setItem(AVATAR_KEY, avatarUrl); } catch {} }, [avatarUrl]);
  useEffect(() => { try { localStorage.setItem(COVER_KEY, coverUrl); } catch {} }, [coverUrl]);

  useEffect(() => {
    try {
      if (about == null) return;
      localStorage.setItem(ABOUT_KEY, about);
    } catch {}
  }, [about]);

  useEffect(() => { try { localStorage.setItem(SKL_KEY, JSON.stringify(skills)); } catch {} }, [skills]);
  useEffect(() => { try { localStorage.setItem(LANG_KEY, JSON.stringify(languages)); } catch {} }, [languages]);
  useEffect(() => { try { localStorage.setItem(PREF_LOC_KEY, JSON.stringify(prefLocations)); } catch {} }, [prefLocations]);
  useEffect(() => { try { localStorage.setItem(PREF_TYPE_KEY, prefWorkType); } catch {} }, [prefWorkType]);
  useEffect(() => { try { localStorage.setItem(PREF_STATUS_KEY, prefStatus); } catch {} }, [prefStatus]);
  useEffect(() => { try { localStorage.setItem(PREF_RELOC_KEY, prefRelocate); } catch {} }, [prefRelocate]);
  useEffect(() => { try { localStorage.setItem(PREF_START_KEY, prefStart); } catch {} }, [prefStart]);
  useEffect(() => { try { localStorage.setItem(HOB_KEY, JSON.stringify(hobbies)); } catch {} }, [hobbies]);
  useEffect(() => { try { localStorage.setItem(RESUME_KEY, JSON.stringify(resume)); } catch {} }, [resume]);
  useEffect(() => { try { localStorage.setItem(EDU_KEY, JSON.stringify(education)); } catch {} }, [education]);

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
              prefRelocate === 'Yes' ? true : prefRelocate === 'No' ? false : null,
          },
          skillsJson: skills || [],
          languagesJson: languages || [],
          hobbiesJson: hobbies || [],

          // NEW: education (requires /api/profile/details to accept it)
          educationJson: education || [],
        };

        const res = await fetch('/api/profile/details', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!res.ok) console.error('Failed to save profile details');
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('Error saving profile details:', err);
      }
    }, 900);

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
    education,
  ]);

  const HeaderBox = (
    <section
      style={{
        borderRadius: 14,
        padding: UI.CARD_PAD,
        textAlign: 'center',
        border: '1px solid rgba(255,255,255,0.22)',
        background: 'rgba(255,255,255,0.58)',
        boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
      aria-label="Profile overview"
    >
      <h1 style={{ margin: 0, color: '#FF7043', fontSize: 22, fontWeight: 900 }}>
        Your Profile
      </h1>
      <p style={{ margin: '6px auto 0', color: '#455A64', maxWidth: 760, fontWeight: 600 }}>
        Clear, human overview. Your resume carries the deep detail.
      </p>
      <div style={{ marginTop: 10 }}>
        <Link
          href={withChrome('/profile-analytics')}
          style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,0.75)',
            color: '#FF7043',
            border: '1px solid rgba(255,112,67,0.55)',
            borderRadius: 999,
            padding: '8px 12px',
            fontWeight: 900,
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

      <SeekerLayout title="Profile | ForgeTomorrow" header={HeaderBox} right={null} activeNav="profile">
        {showWelcomeBanner && (
          <section
            className="relative mb-6 p-6 bg-gradient-to-r from-orange-500 to-pink-600 text-white rounded-3xl shadow-2xl text-center max-w-4xl mx-auto"
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
            <h2 className="text-3xl md:text-4xl font-bold mb-2">Welcome to ForgeTomorrow!</h2>
            <p className="text-lg md:text-xl opacity-95">
              Your email is verified. Complete your profile below and start getting discovered.
            </p>
          </section>
        )}

        <div className="w-full max-w-6xl mx-auto px-3 md:px-5 grid gap-3 md:gap-4">
          {/* Profile Header (glass wrapper stays) */}
          <section
            aria-label="Profile header section"
            style={{
              overflow: 'visible',
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.22)',
              background: 'rgba(255,255,255,0.58)',
              boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              padding: 10,
            }}
          >
           <ProfileHeader />
</section>

<ProfileSectionRow
  id="about"
  title="About"
  subtitle="Your story in 6-10 lines"
  hintTitle="About yourself"
  hintBullets={[
    'Open with a concrete outcome (example: reduced churn 18% in 6 months).',
    'Mention your domain and tools (industries, platforms, stacks).',
    'Say what you want next so people know how to help.',
  ]}
>
  <ProfileAbout about={about || ''} setAbout={setAbout} />
</ProfileSectionRow>

<ProfileSectionRow
  id="preferences"
  title="Work preferences"
  subtitle="Discovery settings"
  hintTitle="Preferences help discovery"
  hintBullets={[
    'Select work type (remote, onsite, hybrid).',
    'Add preferred locations to appear in local searches.',
    'Optional: earliest start date and relocation.',
  ]}
>
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
</ProfileSectionRow>

<ProfileSectionRow
  id="skills"
  title="Skills"
  subtitle="8-12 is the sweet spot"
  hintTitle="Strengthen your skills"
  hintBullets={[
    'Aim for 8-12 core skills.',
    'Match target job descriptions.',
    'Include tools and frameworks.',
  ]}
>
  <ProfileSkills skills={skills} setSkills={setSkills} />
</ProfileSectionRow>

<ProfileSectionRow
  id="languages"
  title="Languages"
  subtitle="Spoken or programming"
  hintTitle="Languages add context"
  hintBullets={[
    'Add spoken or programming languages.',
    'Helps with multilingual or global roles.',
  ]}
>
  <ProfileLanguages languages={languages} setLanguages={setLanguages} />
</ProfileSectionRow>

{/* Education (moved BELOW Skills + Languages) */}
<ProfileSectionRow
  id="education"
  title="Education"
  subtitle="Degrees, certificates, programs"
  hintTitle="Education"
  hintBullets={[
    'List your school/program and degree (or certificate).',
    'Add a field/major if it helps recruiters understand your path.',
    'Keep it clean and factual.',
  ]}
>
  <ProfileEducation education={education} setEducation={setEducation} />
</ProfileSectionRow>

<ProfileSectionRow
  id="docs"
  title="Resume and cover letter"
  subtitle="Make it easy to say yes"
  hintTitle="Make it easy to say yes"
  hintBullets={[
    'Keep one primary resume linked to your profile.',
    'Save alternates for different roles.',
    'Do the same with cover letters so recruiters instantly see fit.',
    'Manage everything in the builder - change primaries anytime.',
  ]}
>
  <div style={{ display: 'grid', gap: 12 }}>
    <ProfileResumeAttach withChrome={withChrome} />
    <ProfileCoverAttach withChrome={withChrome} />
  </div>
</ProfileSectionRow>

<ProfileSectionRow
  id="hobbies"
  title="Hobbies"
  subtitle="Optional, but human"
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
</SeekerLayout>
</>
);
}

