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
import AtsDepthPanel from '@/components/resume-form/AtsDepthPanel';

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
  if (!jdText || !String(jdText).trim()) return null;

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
