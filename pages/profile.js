// pages/profile.js
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import SeekerLayout from '@/components/layouts/SeekerLayout';

import ExperienceList from '@/components/profile/ExperienceList';
import GenericSectionList from '@/components/profile/GenericSectionList';
import ProfileAddModal from '@/components/profile/ProfileAddModal';

const UI = { CARD_PAD: 16, SECTION_GAP: 16, AVATAR_SIZE: 128, INLINE_GAP: 16 };

/* ---------------- LocalStorage keys ---------------- */
const EXP_KEY     = 'profile_experience_v1';
const EDU_KEY     = 'profile_education_v1';
const SKL_KEY     = 'profile_skills_v1';
const PROJ_KEY    = 'profile_projects_v1';
const CERT_KEY    = 'profile_certifications_v1';
const LANG_KEY    = 'profile_languages_v1';
const VOL_KEY     = 'profile_volunteer_v1';
const CUSTOM_KEY  = 'profile_custom_sections_v1';

const NAME_KEY    = 'profile_name_v1';
const PRONOUNS_KEY= 'profile_pronouns_v1';
const TITLE_KEY   = 'profile_title_v1';
const LOC_KEY     = 'profile_location_v1';
const STATUS_KEY  = 'profile_status_v1';
const AVATAR_KEY  = 'profile_avatar_v1';
const ABOUT_KEY   = 'profile_about_v1';

/* ---------------- Component ---------------- */
export default function ProfilePage() {
  // Header fields
  const [name, setName] = useState('Eric James');
  const [pronouns, setPronouns] = useState('He/Him');
  const [headline, setHeadline] = useState('Customer Success Leader & AI Advocate');
  const [location, setLocation] = useState('Nashville, TN');
  const [status, setStatus] = useState('Open to Opportunities');
  const [avatarUrl, setAvatarUrl] = useState('/demo-profile.jpg');

  // About Me
  const [about, setAbout] = useState(
    'Experienced leader with 20+ years in customer success, technical support, and team management. ' +
    'Passionate about building authentic professional relationships and leveraging AI to empower job seekers.'
  );

  // Other sections
  const [experience, setExperience] = useState([]);
  const [education, setEducation]   = useState([]);
  const [skills, setSkills]         = useState([]);
  const [projects, setProjects]     = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [languages, setLanguages]   = useState([]);
  const [volunteer, setVolunteer]   = useState([]);
  const [customSections, setCustomSections] = useState({});

  // Global add modal
  const [addOpen, setAddOpen] = useState(false);
  const [initialFocus, setInitialFocus] = useState('');

  // Edit modals
  const [editHeaderOpen, setEditHeaderOpen] = useState(false);
  const [editAboutOpen, setEditAboutOpen] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const read = (k, fb) => JSON.parse(localStorage.getItem(k) ?? fb);
      const readStr = (k, fb) => localStorage.getItem(k) ?? fb;

      // Structured lists
      const e  = read(EXP_KEY, '[]');          if (Array.isArray(e))  setExperience(e);
      const ed = read(EDU_KEY, '[]');          if (Array.isArray(ed)) setEducation(ed);
      const sk = read(SKL_KEY, '[]');          if (Array.isArray(sk)) setSkills(sk);
      const pj = read(PROJ_KEY, '[]');         if (Array.isArray(pj)) setProjects(pj);
      const ct = read(CERT_KEY, '[]');         if (Array.isArray(ct)) setCertifications(ct);
      const lg = read(LANG_KEY, '[]');         if (Array.isArray(lg)) setLanguages(lg);
      const vo = read(VOL_KEY, '[]');          if (Array.isArray(vo)) setVolunteer(vo);
      const cs = read(CUSTOM_KEY, '{}');       if (cs && typeof cs === 'object') setCustomSections(cs);

      // Header fields / about
      setName(readStr(NAME_KEY, 'Eric James'));
      setPronouns(readStr(PRONOUNS_KEY, 'He/Him'));
      setHeadline(readStr(TITLE_KEY, 'Customer Success Leader & AI Advocate'));
      setLocation(readStr(LOC_KEY, 'Nashville, TN'));
      setStatus(readStr(STATUS_KEY, 'Open to Opportunities'));
      setAvatarUrl(readStr(AVATAR_KEY, '/demo-profile.jpg'));
      setAbout(readStr(ABOUT_KEY, about));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist changes
  useEffect(() => { try { localStorage.setItem(NAME_KEY, name); } catch {} }, [name]);
  useEffect(() => { try { localStorage.setItem(PRONOUNS_KEY, pronouns); } catch {} }, [pronouns]);
  useEffect(() => { try { localStorage.setItem(TITLE_KEY, headline); } catch {} }, [headline]);
  useEffect(() => { try { localStorage.setItem(LOC_KEY, location); } catch {} }, [location]);
  useEffect(() => { try { localStorage.setItem(STATUS_KEY, status); } catch {} }, [status]);
  useEffect(() => { try { localStorage.setItem(AVATAR_KEY, avatarUrl); } catch {} }, [avatarUrl]);
  useEffect(() => { try { localStorage.setItem(ABOUT_KEY, about); } catch {} }, [about]);

  useEffect(() => { try { localStorage.setItem(EXP_KEY, JSON.stringify(experience)); } catch {} }, [experience]);
  useEffect(() => { try { localStorage.setItem(EDU_KEY, JSON.stringify(education)); } catch {} }, [education]);
  useEffect(() => { try { localStorage.setItem(SKL_KEY, JSON.stringify(skills)); } catch {} }, [skills]);
  useEffect(() => { try { localStorage.setItem(PROJ_KEY, JSON.stringify(projects)); } catch {} }, [projects]);
  useEffect(() => { try { localStorage.setItem(CERT_KEY, JSON.stringify(certifications)); } catch {} }, [certifications]);
  useEffect(() => { try { localStorage.setItem(LANG_KEY, JSON.stringify(languages)); } catch {} }, [languages]);
  useEffect(() => { try { localStorage.setItem(VOL_KEY, JSON.stringify(volunteer)); } catch {} }, [volunteer]);
  useEffect(() => { try { localStorage.setItem(CUSTOM_KEY, JSON.stringify(customSections)); } catch {} }, [customSections]);

  /* ------------- Add handlers (existing) ------------- */
  const openGlobalAdd = () => { setInitialFocus(''); setAddOpen(true); };
  const openAdd = (focus) => () => { setInitialFocus(focus); setAddOpen(true); };

  const uid = () => `${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;

  const handleAdd = (section, payload) => {
    switch (section) {
      case 'experience':      setExperience(prev => [{ id: uid(), ...payload }, ...prev]); break;
      case 'education':       setEducation(prev => [{ id: uid(), ...payload }, ...prev]); break;
      case 'skills':          setSkills(prev => Array.from(new Set([...(payload || []), ...prev]))); break;
      case 'languages':       setLanguages(prev => Array.from(new Set([...(payload || []), ...prev]))); break;
      case 'projects':        setProjects(prev => [{ id: uid(), ...payload }, ...prev]); break;
      case 'certifications':  setCertifications(prev => [{ id: uid(), ...payload }, ...prev]); break;
      case 'volunteer':       setVolunteer(prev => [{ id: uid(), ...prev }]); break;
      case 'custom': {
        const { sectionName, item } = payload || {};
        if (!sectionName) return;
        setCustomSections(prev => {
          const arr = prev[sectionName] || [];
          return { ...prev, [sectionName]: [{ id: uid(), ...item }, ...arr] };
        });
        break;
      }
      default: break;
    }
    setAddOpen(false);
  };

  /* ------------- Header Edit modal local state ------------- */
  const [draft, setDraft] = useState({
    name: '', pronouns: '', headline: '', location: '', status: '', avatarUrl: ''
  });

  const openHeaderEditor = () => {
    setDraft({ name, pronouns, headline, location, status, avatarUrl });
    setEditHeaderOpen(true);
  };
  const saveHeader = () => {
    setName(draft.name.trim() || ''); 
    setPronouns(draft.pronouns.trim());
    setHeadline(draft.headline.trim());
    setLocation(draft.location.trim());
    setStatus(draft.status.trim());
    setAvatarUrl(draft.avatarUrl.trim() || '/demo-profile.jpg');
    setEditHeaderOpen(false);
  };

  /* ---------------- Header box ---------------- */
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, color: '#FF7043', fontSize: 24, fontWeight: 800 }}>Your Profile</h1>
          <p style={{ margin: '6px auto 0', color: '#607D8B', maxWidth: 720 }}>
            Manage your public info and showcase what makes you, you.
          </p>
        </div>
        <button
          type="button"
          onClick={openHeaderEditor}
          style={{
            background: '#FF7043', color: 'white', border: 'none', borderRadius: 10,
            padding: '10px 12px', fontWeight: 700, cursor: 'pointer', justifySelf: 'end',
          }}
          aria-label="Edit profile header"
        >
          Edit Profile
        </button>
      </div>
    </section>
  );

  const alertSoon = (feature) => () => alert(`${feature} feature coming soon!`);

  return (
    <>
      <Head><title>Profile | ForgeTomorrow</title></Head>

      <SeekerLayout title="Profile | ForgeTomorrow" header={HeaderBox} right={null} activeNav="profile">
        <div style={{ maxWidth: 860, display: 'grid', gap: UI.SECTION_GAP }}>
          {/* --------- Top card: Avatar + identity lines --------- */}
          <section
            style={{
              background: 'white', borderRadius: 12, padding: UI.CARD_PAD,
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)', border: '1px solid #eee',
            }}
          >
            <div style={{ display: 'flex', gap: UI.INLINE_GAP, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img
                  src={avatarUrl || '/demo-profile.jpg'}
                  alt="Profile picture"
                  style={{
                    width: UI.AVATAR_SIZE, height: UI.AVATAR_SIZE, objectFit: 'cover',
                    borderRadius: 9999, border: '4px solid #FF7043', boxShadow: '0 0 10px rgba(255,112,67,0.5)',
                  }}
                  onError={(e) => {
                    if (!e.currentTarget.src.includes('/demo-profile.jpg')) {
                      e.currentTarget.src = '/demo-profile.jpg';
                    }
                  }}
                />
                <button
                  onClick={openHeaderEditor}
                  aria-label="Update profile picture"
                  style={{
                    marginTop: 10, background: '#FF7043', color: 'white',
                    padding: '8px 16px', borderRadius: 8, fontWeight: 600, border: 'none', cursor: 'pointer',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = '#F4511E')}
                  onMouseOut={(e) => (e.currentTarget.style.background = '#FF7043')}
                >
                  Update Picture
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 240 }}>
                <h1 style={{ fontSize: 28, fontWeight: 800, color: '#FF7043', margin: 0 }}>{name || 'Unnamed'}</h1>
                {!!pronouns && <p style={{ color: '#374151', fontSize: 16, margin: 0 }}>{pronouns}</p>}
                {!!headline && (
                  <p style={{ color: '#4B5563', fontStyle: 'italic', marginTop: 6, maxWidth: 640 }}>
                    {headline}
                  </p>
                )}
                <div style={{ display: 'flex', gap: 12, color: '#4B5563', marginTop: 6, flexWrap: 'wrap' }}>
                  {!!location && <span>Location: {location}</span>}
                  {!!status && <span>Status: {status}</span>}
                </div>
              </div>
            </div>
          </section>

          {/* --------- About Me (editable) --------- */}
          <section
            style={{
              position: 'relative', background: 'white', borderRadius: 12, padding: UI.CARD_PAD,
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)', border: '1px solid #eee',
            }}
          >
            <button
              onClick={() => setEditAboutOpen(true)}
              aria-label="Edit About Me"
              style={{ position: 'absolute', top: 12, right: 12, background: '#FF7043', color: 'white',
                padding: '6px 12px', borderRadius: 8, fontWeight: 600, border: 'none', cursor: 'pointer' }}
              onMouseOver={(e) => (e.currentTarget.style.background = '#F4511E')}
              onMouseOut={(e) => (e.currentTarget.style.background = '#FF7043')}
            >
              Edit
            </button>
            <h2 style={{ color: '#FF7043', fontSize: 22, fontWeight: 700, marginTop: 0 }}>About Me</h2>
            <p style={{ color: '#374151', marginBottom: 0, lineHeight: 1.5 }}>
              {about || 'Tell the world about yourself...'}
            </p>
          </section>

          {/* --------- Experience --------- */}
          <ExperienceList
            items={experience}
            onAddClick={openAdd('experience')}
            onDelete={(id) => setExperience(prev => prev.filter(x => x.id !== id))}
          />

          {/* --------- Projects --------- */}
          <GenericSectionList
            title="Projects"
            addLabel="+ Add Project"
            items={projects}
            onAddClick={openAdd('projects')}
            onDelete={(id) => setProjects(prev => prev.filter(x => x.id !== id))}
            labelFields={(x) => x.title || 'Untitled project'}
            subLabel={(x) => [x.org, joinDates(x.startDate, x.endDate)].filter(Boolean).join(' • ')}
            description={(x) => x.description || ''}
          />

          {/* --------- Certifications --------- */}
          <GenericSectionList
            title="Certifications"
            addLabel="+ Add Certification"
            items={certifications}
            onAddClick={openAdd('certifications')}
            onDelete={(id) => setCertifications(prev => prev.filter(x => x.id !== id))}
            labelFields={(x) => x.name || 'Certification'}
            subLabel={(x) =>
              [x.issuer, dateYM(x.issueDate), x.expireDate ? `expires ${dateYM(x.expireDate)}` : '']
                .filter(Boolean).join(' • ')
            }
          />

          {/* --------- Volunteer --------- */}
          <GenericSectionList
            title="Volunteer"
            addLabel="+ Add Volunteer"
            items={volunteer}
            onAddClick={openAdd('volunteer')}
            onDelete={(id) => setVolunteer(prev => prev.filter(x => x.id !== id))}
            labelFields={(x) => x.role || 'Volunteer role'}
            subLabel={(x) => [x.org, joinDates(x.startDate, x.endDate)].filter(Boolean).join(' • ')}
            description={(x) => x.description || ''}
          />

          {/* --------- Skills & Languages (chips) --------- */}
          <ChipsCard title="Skills" data={skills} onAdd={openAdd('skills')} addLabel="+ Add Skill" />
          <ChipsCard title="Languages" data={languages} onAdd={openAdd('languages')} addLabel="+ Add Language" />

          {/* --------- Custom sections --------- */}
          {Object.keys(customSections).map((name) => (
            <GenericSectionList
              key={name}
              title={name}
              addLabel={`+ Add ${name.slice(0,1).toUpperCase()}${name.slice(1)}`}
              items={customSections[name]}
              onAddClick={openAdd('custom')}
              onDelete={(id) => {
                setCustomSections(prev => {
                  const arr = (prev[name] || []).filter(x => x.id !== id);
                  return { ...prev, [name]: arr };
                });
              }}
              labelFields={(x) => x.title || 'Untitled'}
              subLabel={(x) => x.date ? dateYM(x.date) : ''}
              description={(x) => x.description || ''}
            />
          ))}

          {/* --------- Analytics link --------- */}
          <Link
            href="/profile-analytics"
            style={{
              background: 'white', borderRadius: 12, padding: UI.CARD_PAD, boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              border: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              textDecoration: 'none',
            }}
            aria-label="Go to Profile Analytics"
          >
            <h2 style={{ color: '#FF7043', fontSize: 22, fontWeight: 700, margin: 0 }}>Analytics</h2>
            <span style={{ color: '#FF7043', fontWeight: 700, fontSize: 18 }}>→</span>
          </Link>
        </div>

        {/* --------- Add Profile Section Modal (existing) --------- */}
        {addOpen && (
          <ProfileAddModal
            open={addOpen}
            initialFocus={initialFocus}
            onClose={() => setAddOpen(false)}
            onSave={handleAdd}
          />
        )}

        {/* --------- Edit Header Modal --------- */}
        {editHeaderOpen && (
          <Dialog onClose={() => setEditHeaderOpen(false)} title="Edit Profile">
            <div style={{ display: 'grid', gap: 10 }}>
              <label style={labelStyle}>
                <span>Name</span>
                <input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  style={inputStyle}
                  maxLength={80}
                  required
                />
              </label>

              <label style={labelStyle}>
                <span>Pronouns</span>
                <input
                  value={draft.pronouns}
                  onChange={(e) => setDraft({ ...draft, pronouns: e.target.value })}
                  style={inputStyle}
                  placeholder="e.g., She/Her"
                  maxLength={24}
                />
              </label>

              <label style={labelStyle}>
                <span>Title (headline)</span>
                <input
                  value={draft.headline}
                  onChange={(e) => setDraft({ ...draft, headline: e.target.value })}
                  style={inputStyle}
                  placeholder="Short summary"
                  maxLength={120}
                />
              </label>

              <label style={labelStyle}>
                <span>Location</span>
                <input
                  value={draft.location}
                  onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                  style={inputStyle}
                  placeholder="City, State"
                  maxLength={120}
                />
              </label>

              <label style={labelStyle}>
                <span>Status</span>
                <select
                  value={draft.status}
                  onChange={(e) => setDraft({ ...draft, status: e.target.value })}
                  style={inputStyle}
                >
                  <option>Open to Opportunities</option>
                  <option>Not Looking</option>
                  <option>Freelance / Consulting</option>
                </select>
              </label>

              <label style={labelStyle}>
                <span>Avatar URL</span>
                <input
                  value={draft.avatarUrl}
                  onChange={(e) => setDraft({ ...draft, avatarUrl: e.target.value })}
                  style={inputStyle}
                  placeholder="/demo-profile.jpg"
                />
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
              <button onClick={() => setEditHeaderOpen(false)} style={btnSecondary}>Cancel</button>
              <button onClick={saveHeader} style={btnPrimary}>Save</button>
            </div>
          </Dialog>
        )}

        {/* --------- Edit About Me Modal --------- */}
        {editAboutOpen && (
          <Dialog onClose={() => setEditAboutOpen(false)} title="Edit About Me">
            <textarea
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              rows={8}
              style={{ ...inputStyle, resize: 'vertical' }}
              maxLength={2000}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <small style={{ color: '#607D8B' }}>{about.length}/2000</small>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setEditAboutOpen(false)} style={btnSecondary}>Cancel</button>
                <button onClick={() => setEditAboutOpen(false)} style={btnPrimary}>Save</button>
              </div>
            </div>
          </Dialog>
        )}
      </SeekerLayout>
    </>
  );
}

/* ---------------- Small bits ---------------- */
function ChipsCard({ title, data = [], onAdd, addLabel = '+ Add' }) {
  return (
    <section
      style={{
        background: 'white', borderRadius: 12, padding: 16, boxShadow: '0 2px 6px rgba(0,0,0,0.06)', border: '1px solid #eee',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <h2 style={{ color: '#FF7043', fontSize: 22, fontWeight: 700, margin: 0 }}>{title}</h2>
        <button
          type="button"
          onClick={onAdd}
          style={{
            background: 'white', color: '#FF7043', border: '1px solid #FF7043',
            borderRadius: 10, padding: '8px 12px', fontWeight: 700, cursor: 'pointer',
          }}
        >
          {addLabel}
        </button>
      </div>
      {data.length === 0 ? (
        <div style={{ color: '#607D8B' }}>No {title.toLowerCase()} yet.</div>
      ) : (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {data.map((t, i) => (
            <span key={`${t}-${i}`} style={{ fontSize: 12, background: '#FFF3E0', color: '#E65100', padding: '6px 10px', borderRadius: 999 }}>
              {t}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

function Dialog({ children, onClose, title }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
        display: 'grid', placeItems: 'center', zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 640, background: 'white', borderRadius: 12,
          padding: 16, border: '1px solid #eee', boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
          display: 'grid', gap: 12,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 800, color: '#263238' }}>{title}</div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'white', color: '#FF7043', border: '1px solid #FF7043',
              borderRadius: 10, padding: '6px 10px', fontWeight: 700, cursor: 'pointer' }}
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---- form styles + helpers ---- */
const labelStyle = { display: 'grid', gap: 6, color: '#455A64', fontWeight: 600, fontSize: 13 };
const inputStyle = {
  border: '1px solid #ddd', borderRadius: 10, padding: '10px 12px', outline: 'none', background: 'white', width: '100%',
};
const btnPrimary = { background: '#FF7043', color: 'white', border: 'none', borderRadius: 10, padding: '10px 12px', fontWeight: 700, cursor: 'pointer' };
const btnSecondary = { background: 'white', color: '#FF7043', border: '1px solid #FF7043', borderRadius: 10, padding: '10px 12px', fontWeight: 700, cursor: 'pointer' };

function dateYM(ym) {
  if (!ym) return '';
  try {
    const [y, m] = ym.split('-').map(Number);
    const d = new Date(y, (m || 1) - 1, 1);
    return d.toLocaleString(undefined, { month: 'short', year: 'numeric' });
  } catch { return ym; }
}
function joinDates(start, end) {
  const a = dateYM(start);
  const b = end ? dateYM(end) : 'Present';
  return (a || b) ? `${a || ''}${a ? ' — ' : ''}${b || ''}` : '';
}
