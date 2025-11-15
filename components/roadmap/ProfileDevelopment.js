// components/roadmap/ProfileDevelopment.js
import React, { useState, useEffect } from 'react';
import SeekerRightColumn from '@/components/seeker/SeekerRightColumn';

export default function ProfileDevelopment({ onNext, setActiveModule }) {
  const [prompts, setPrompts] = useState([]);
  const [progress, setProgress] = useState(0);

  // === KEYS FROM profile.js ===
  const NAME_KEY = 'profile_name_v1';
  const TITLE_KEY = 'profile_title_v1';
  const ABOUT_KEY = 'profile_about_v1';
  const SKL_KEY = 'profile_skills_v1';
  const RESUME_KEY = 'profile_resume_v1';

  // === LOAD PROFILE FROM localStorage ===
  const loadProfile = () => {
    try {
      const name = localStorage.getItem(NAME_KEY) || '';
      const headline = localStorage.getItem(TITLE_KEY) || '';
      const about = localStorage.getItem(ABOUT_KEY) || '';
      const skills = JSON.parse(localStorage.getItem(SKL_KEY) || '[]');
      const resume = JSON.parse(localStorage.getItem(RESUME_KEY) || 'null');

      return { name, headline, about, skills, resume };
    } catch (err) {
      return { name: '', headline: '', about: '', skills: [], resume: null };
    }
  };

  // === GENERATE AI PROMPTS BASED ON GAPS ===
  const generatePrompts = (profile) => {
    const newPrompts = [];

    if (!profile.name) newPrompts.push('Add your full name');
    if (!profile.headline) newPrompts.push('Add a professional headline');
    if (!profile.about || profile.about.length < 50) newPrompts.push('Write a 2–3 sentence bio');
    if (profile.skills.length < 6) newPrompts.push(`Add ${6 - profile.skills.length} more skills`);
    if (!profile.resume) newPrompts.push('Upload your resume');

    setPrompts(newPrompts.map((text, i) => ({ id: i + 1, text, applied: false })));
  };

  // === INITIAL LOAD + LIVE SYNC ===
  useEffect(() => {
    const profile = loadProfile();
    generatePrompts(profile);

    const handleStorageChange = () => {
      const updated = loadProfile();
      generatePrompts(updated);
    };

    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 1000); // fallback

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // === UPDATE PROGRESS ===
  useEffect(() => {
    const profile = loadProfile();
    const total = 5;
    let completed = 0;
    if (profile.name) completed++;
    if (profile.headline) completed++;
    if (profile.about && profile.about.length >= 50) completed++;
    if (profile.skills.length >= 6) completed++;
    if (profile.resume) completed++;

    setProgress((completed / total) * 100);
  }, [prompts]);

  // === TOGGLE APPLIED ===
  const toggleApplied = (id) => {
    setPrompts(prev =>
      prev.map(p => (p.id === id ? { ...p, applied: !p.applied } : p))
    );
  };

  const allApplied = prompts.length > 0 && prompts.every(p => p.applied);

  // === HEADER BLOCK ===
  const HeaderBox = (
    <section style={{
      background: 'white',
      borderRadius: 12,
      padding: 16,
      boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
      border: '1px solid #eee',
      textAlign: 'center',
      marginBottom: 16
    }}>
      <h1 style={{ margin: 0, color: '#FF7043', fontSize: 24, fontWeight: 800 }}>
        Profile Development
      </h1>
      <p style={{ margin: '6px auto 0', color: '#607D8B', maxWidth: 720, lineHeight: 1.5 }}>
        Complete your profile to unlock AI-powered insights and job matches.
      </p>
    </section>
  );

  // === RIGHT RAIL ===
  const RightRail = (
    <div style={{ display: 'grid', gap: 12 }}>
      <SeekerRightColumn variant="roadmap" />
    </div>
  );

  // === PROMPTS BLOCK ===
  const PromptsBlock = (
    <section style={{
      background: 'white',
      borderRadius: 12,
      padding: 24,
      border: '1px solid #eee',
      boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
      display: 'grid',
      gap: 24
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, color: '#FF7043', fontSize: 20, fontWeight: 700 }}>
          AI-Powered Profile Prompts
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 800, padding: '2px 8px', borderRadius: 999, background: '#F1F5F9', color: '#334155' }}>
            {prompts.length}
          </span>
        </div>
      </div>

      <div style={{ background: '#e2e8f0', borderRadius: 999, height: 6, overflow: 'hidden' }}>
        <div style={{ background: '#FF7043', height: 6, width: `${progress}%`, transition: 'width 0.3s' }} />
      </div>
      <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#4a5568' }}>
        Step 1 of 3: Profile Development
      </p>

      <ul style={{ display: 'grid', gap: 12, listStyle: 'none', padding: 0 }}>
        {prompts.map(({ id, text, applied }) => (
          <li key={id} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'white',
            padding: 16,
            borderRadius: 8,
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <span style={{ fontSize: '1rem', lineHeight: 1.5, color: applied ? '#a0aec0' : '#2d3748' }}>
              {text}
            </span>
            <button
              onClick={() => toggleApplied(id)}
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.875rem',
                minWidth: 120
              }}
              className={applied ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-700'}
            >
              {applied ? 'Applied' : 'Apply Suggestion'}
            </button>
          </li>
        ))}
      </ul>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={onNext}
          disabled={!allApplied}
          style={{
            padding: '12px 32px',
            borderRadius: 8,
            border: 'none',
            fontWeight: 600,
            cursor: allApplied ? 'pointer' : 'not-allowed',
            fontSize: '1rem',
            opacity: allApplied ? 1 : 0.6
          }}
          className={allApplied ? 'bg-[#FF7043] hover:bg-[#F4511E] text-white' : 'bg-gray-300 text-gray-500'}
        >
          Next: Offer Negotiation
        </button>
      </div>
    </section>
  );

  return (
    <>
      {HeaderBox}
      {PromptsBlock}
    </>
  );
}