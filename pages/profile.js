// pages/profile.js
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import SeekerLayout from '@/components/layouts/SeekerLayout';

// Self-contained components
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileAbout from '@/components/profile/ProfileAbout';
import ProfileLanguages from '@/components/profile/ProfileLanguages';
import ProfilePreferences from '@/components/profile/ProfilePreferences';
import ProfileResumeAttach from '@/components/profile/ProfileResumeAttach';
import ProfileSkills from '@/components/profile/ProfileSkills';
import ProfileHobbies from '@/components/profile/ProfileHobbies';

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
const PREF_START_KEY = 'profile_pref_start_v1';
const HOB_KEY = 'profile_hobbies_v1';

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
  const [prefStart, setPrefStart] = useState('');
  const [hobbies, setHobbies] = useState([]);

  // ---------------- Load from localStorage ----------------
  useEffect(() => {
    try {
      const read = (k, fb) => JSON.parse(localStorage.getItem(k) ?? fb);
      const readStr = (k, fb) => localStorage.getItem(k) ?? fb;

      setName(readStr(NAME_KEY, 'Eric James'));
      setPronouns(readStr(PRONOUNS_KEY, 'He/Him'));
      setHeadline(readStr(TITLE_KEY, 'Customer Success Leader & AI Advocate'));
      setLocation(readStr(LOC_KEY, 'Nashville, TN'));
      setStatus(readStr(STATUS_KEY, 'Open to Opportunities'));
      setAvatarUrl(readStr(AVATAR_KEY, '/demo-profile.jpg'));
      setCoverUrl(readStr(COVER_KEY, ''));
      setAbout(readStr(ABOUT_KEY, ''));

      setSkills(read(SKL_KEY, '[]'));
      setLanguages(read(LANG_KEY, '[]'));
      setPrefLocations(read(PREF_LOC_KEY, '[]'));
      setPrefWorkType(readStr(PREF_TYPE_KEY, ''));
      setPrefStart(readStr(PREF_START_KEY, ''));
      setHobbies(read(HOB_KEY, '[]'));
    } catch {}
  }, []);

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
  useEffect(() => { try { localStorage.setItem(PREF_START_KEY, prefStart); } catch {} }, [prefStart]);
  useEffect(() => { try { localStorage.setItem(HOB_KEY, JSON.stringify(hobbies)); } catch {} }, [hobbies]);

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
    >
      <h1 style={{ margin: 0, color: '#FF7043', fontSize: 24, fontWeight: 800 }}>
        Your Profile
      </h1>
      <p style={{ margin: '6px auto 0', color: '#607D8B', maxWidth: 720 }}>
        Give the community a clear, human overview — your resume provides the deep detail.
      </p>
    </section>
  );

  return (
    <>
      <Head><title>Profile | ForgeTomorrow</title></Head>

      <SeekerLayout title="Profile | ForgeTomorrow" header={HeaderBox} right={null} activeNav="profile">
        <div style={{ maxWidth: 1200, width: '100%', display: 'grid', gap: UI.SECTION_GAP }}>
          <ProfileHeader
            name={name} pronouns={pronouns} headline={headline}
            location={location} status={status}
            avatarUrl={avatarUrl} coverUrl={coverUrl}
            setName={setName} setPronouns={setPronouns} setHeadline={setHeadline}
            setLocation={setLocation} setStatus={setStatus}
            setAvatarUrl={setAvatarUrl} setCoverUrl={setCoverUrl}
          />

          <ProfileAbout about={about} setAbout={setAbout} />
          <ProfileResumeAttach withChrome={withChrome} />

          <ProfilePreferences
            prefLocations={prefLocations} setPrefLocations={setPrefLocations}
            prefWorkType={prefWorkType} setPrefWorkType={setPrefWorkType}
            prefStart={prefStart} setPrefStart={setPrefStart}
          />

          <ProfileSkills skills={skills} setSkills={setSkills} />
          <ProfileLanguages languages={languages} setLanguages={setLanguages} />
          <ProfileHobbies hobbies={hobbies} setHobbies={setHobbies} />
        </div>
      </SeekerLayout>
    </>
  );
}
