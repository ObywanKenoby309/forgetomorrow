'use client';

/**
 * THE FORGE HAMMER — LOCKED
 * Do not modify without explicit approval from Eric.
 *
 * Purpose:
 * - Keep The Hammer isolated from pages/resume/create.js
 * - Reduce risk of accidental rewrites during page edits
 * - Provide a single import boundary for The Hammer UI/logic
 */

import React from 'react';

export default function ForgeHammerPanel({
  jdText,
  resumeData,
  summary,
  skills,
  experiences,
  education,
  jobMeta = null,
  onAddSkill,
  onAddSummary,
  onAddBullet,
}) {
  // ✅ HARD SSR KILL SWITCH — Turbopack was still pulling AtsDepthPanel into SSR graph
  if (typeof window === 'undefined') return null;

  if (!jdText || !String(jdText).trim()) return null;

  // ✅ LAZY LOAD — prevents server build graph from importing AtsDepthPanel at module load time
  // eslint-disable-next-line global-require
  const AtsDepthPanel = require('@/components/resume-form/AtsDepthPanel').default;

  return (
    <AtsDepthPanel
      jdText={jdText}
      resumeData={resumeData}
      summary={summary}
      skills={skills}
      experiences={experiences}
      education={education}
      jobMeta={jobMeta || null}
      onAddSkill={onAddSkill}
      onAddSummary={onAddSummary}
      onAddBullet={onAddBullet}
    />
  );
}
