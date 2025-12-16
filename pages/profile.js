// pages/profile.js
'use client';

import React from 'react';
import Head from 'next/head';
import SeekerLayout from '@/components/layouts/SeekerLayout';

// HEADER (DO NOT WRAP)
import ProfileHeader from '@/components/profile/ProfileHeader';

// BODY SECTIONS
import ProfileAbout from '@/components/profile/ProfileAbout';
import ProfilePreferences from '@/components/profile/ProfilePreferences';
import ProfileSkills from '@/components/profile/ProfileSkills';
import ProfileLanguages from '@/components/profile/ProfileLanguages';
import ProfileHobbies from '@/components/profile/ProfileHobbies';
import ProfileResumeAttach from '@/components/profile/ProfileResumeAttach';
import ProfileCoverAttach from '@/components/profile/ProfileCoverAttach';

// COLLAPSIBLE WRAPPER (BODY ONLY)
import ProfileSectionRow from '@/components/profile/ProfileSectionRow';

export default function ProfilePage() {
  return (
    <>
      <Head>
        <title>Profile | ForgeTomorrow</title>
      </Head>

      <SeekerLayout
        title="Profile | ForgeTomorrow"
        activeNav="profile"
      >
        {/* =====================================================
            PROFILE HEADER — NEVER COLLAPSIBLE
            ===================================================== */}
        <section aria-label="Profile header">
          <ProfileHeader />
        </section>

        {/* =====================================================
            ABOUT
            ===================================================== */}
        <ProfileSectionRow
          id="about"
          title="About Me"
          hintTitle="About Yourself"
          hintBullets={[
            'Open with a concrete outcome.',
            'Mention your domain and tools.',
            'Say what you want next.'
          ]}
        >
          <ProfileAbout />
        </ProfileSectionRow>

        {/* =====================================================
            WORK PREFERENCES
            ===================================================== */}
        <ProfileSectionRow
          id="preferences"
          title="Work Preferences"
          hintTitle="Preferences help discovery"
          hintBullets={[
            'Select work type.',
            'Add preferred locations.',
            'Relocation is optional.'
          ]}
        >
          <ProfilePreferences />
        </ProfileSectionRow>

        {/* =====================================================
            SKILLS
            ===================================================== */}
        <ProfileSectionRow
          id="skills"
          title="Skills"
          hintTitle="Strengthen your skills"
          hintBullets={[
            'Aim for 8–12 skills.',
            'Match job descriptions.',
            'Include tools and frameworks.'
          ]}
        >
          <ProfileSkills />
        </ProfileSectionRow>

        {/* =====================================================
            LANGUAGES
            ===================================================== */}
        <ProfileSectionRow
          id="languages"
          title="Languages"
          hintTitle="Languages add context"
          hintBullets={[
            'Add spoken or programming languages.',
            'Helpful for global roles.'
          ]}
        >
          <ProfileLanguages />
        </ProfileSectionRow>

        {/* =====================================================
            RESUME + COVER LETTER
            ===================================================== */}
        <ProfileSectionRow
          id="documents"
          title="Documents"
          hintTitle="Make it easy to say yes"
          hintBullets={[
            'Attach a primary resume.',
            'Keep alternates ready.',
            'Same for cover letters.'
          ]}
        >
          <div style={{ display: 'grid', gap: 12 }}>
            <ProfileResumeAttach />
            <ProfileCoverAttach />
          </div>
        </ProfileSectionRow>

        {/* =====================================================
            HOBBIES
            ===================================================== */}
        <ProfileSectionRow
          id="hobbies"
          title="Hobbies & Interests"
        >
          <ProfileHobbies />
        </ProfileSectionRow>
      </SeekerLayout>
    </>
  );
}
