// components/roadmap/ProfileDevelopment.js
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import SeekerRightColumn from '@/components/seeker/SeekerRightColumn';

const ORANGE = '#FF7043';
const SLATE = '#334155';

function safeArray(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter(Boolean);
  // handle { items: [] } shape if any callers use it
  if (typeof v === 'object' && Array.isArray(v.items)) return v.items.filter(Boolean);
  // handle JSON strings
  if (typeof v === 'string') {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function skillNamesFromAny(skillsJson) {
  const arr = safeArray(skillsJson);
  return arr
    .map((x) => (typeof x === 'string' ? x : (x?.name || x?.label || x?.value || '')))
    .map((s) => String(s || '').trim())
    .filter(Boolean);
}

// IMPORTANT:
// We store skillsJson as an array of strings, not [{ name }] objects.
// This prevents UI from rendering JSON blobs and keeps the data shape consistent.
function listToSkillObjects(names) {
  return (names || [])
    .map((s) => String(s || '').trim())
    .filter(Boolean)
    .slice(0, 50);
}

function normalizeHeadlineSuggestion(text) {
  return String(text || '').trim().replace(/\s+/g, ' ').slice(0, 120);
}

function normalizeSummarySuggestion(text) {
  return String(text || '').trim().replace(/\n{3,}/g, '\n\n').slice(0, 1200);
}

function splitSkills(text) {
  // accept commas / newlines / bullets
  const raw = String(text || '')
    .replace(/[•·]/g, ',')
    .replace(/\n/g, ',')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  // de-dupe (case-insensitive)
  const seen = new Set();
  const out = [];
  for (const s of raw) {
    const key = s.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(s);
    }
  }
  return out.slice(0, 30);
}

function ModalShell({ open, onClose, title, children }) {
  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.55)',
        display: 'grid',
        placeItems: 'center',
        padding: 18,
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: 'min(920px, 96vw)',
          background: 'white',
          borderRadius: 14,
          boxShadow: '0 18px 60px rgba(0,0,0,0.35)',
          border: '1px solid rgba(0,0,0,0.08)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            borderBottom: '1px solid #e5e7eb',
            background: 'linear-gradient(180deg, #fff, #fafafa)',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#64748b' }}>AI Assist</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {title}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: '1px solid #e5e7eb',
              background: 'white',
              borderRadius: 10,
              padding: '8px 10px',
              cursor: 'pointer',
              fontWeight: 900,
              color: '#111827',
            }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div style={{ padding: 16 }}>{children}</div>
      </div>
    </div>
  );
}

export default function ProfileDevelopment({ onNext }) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [details, setDetails] = useState(null);
  const [primaryResume, setPrimaryResume] = useState(null);
  const [resumes, setResumes] = useState([]);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalField, setModalField] = useState(null); // 'headline' | 'aboutMe' | 'skills'
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState([]); // array of strings
  const [draftValue, setDraftValue] = useState(''); // user-editable final
  const [notes, setNotes] = useState(''); // optional: extra context for AI

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [dRes, pRes, rRes] = await Promise.all([
        fetch('/api/profile/details'),
        fetch('/api/profile/primaries'),
        fetch('/api/profile/resume'),
      ]);

      const dJson = await dRes.json();
      const pJson = await pRes.json();
      const rJson = await rRes.json();

      // /api/profile/details returns { details, ...details }
      const merged = dJson?.details || dJson || null;
      setDetails(merged || null);

      setPrimaryResume(pJson?.primaryResume || null);

      // resume endpoint returns { resumes, primary }
      setResumes(Array.isArray(rJson?.resumes) ? rJson.resumes : []);
    } catch (e) {
      console.error('[ProfileDevelopment] fetchAll error', e);
      setDetails(null);
      setPrimaryResume(null);
      setResumes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const computed = useMemo(() => {
    const headline = String(details?.headline || '').trim();
    const aboutMe = String(details?.aboutMe || '').trim();
    const skills = skillNamesFromAny(details?.skillsJson);
    const languages = safeArray(details?.languagesJson);

    const hasHeadline = headline.length >= 8;
    const hasSummary = aboutMe.length >= 120; // investor-friendly: "not a sentence"
    const hasSkills = skills.length >= 8;
    const hasLanguages = safeArray(languages).length >= 1;
    const hasPrimaryResume = Boolean(primaryResume?.id);

    const total = 5;
    const completed =
      (hasHeadline ? 1 : 0) +
      (hasSummary ? 1 : 0) +
      (hasSkills ? 1 : 0) +
      (hasLanguages ? 1 : 0) +
      (hasPrimaryResume ? 1 : 0);

    const progress = Math.round((completed / total) * 100);

    const items = [
      {
        key: 'headline',
        title: 'Professional headline',
        status: hasHeadline ? 'Complete' : 'Missing',
        why:
          'Recruiters scan headline first. A clear role + impact increases profile clicks and search relevance.',
        fixLabel: hasHeadline ? 'Improve' : 'Add headline',
        ai: true,
      },
      {
        key: 'aboutMe',
        title: 'Professional summary',
        status: hasSummary ? 'Complete' : 'Missing',
        why:
          'A strong summary turns curiosity into action: connection requests, recruiter outreach, and interviews.',
        fixLabel: hasSummary ? 'Improve' : 'Add summary',
        ai: true,
      },
      {
        key: 'skills',
        title: 'Skills (8+)',
        status: hasSkills ? 'Complete' : `Needs ${Math.max(0, 8 - skills.length)} more`,
        why:
          'Skills power recruiter search filters. More relevant skills = more matches and better ranking.',
        fixLabel: 'Update skills',
        ai: true,
      },
      {
        key: 'languages',
        title: 'Languages (1+)',
        status: hasLanguages ? 'Complete' : 'Missing',
        why:
          'Languages are a recruiter filter and a signal of eligibility for global or bilingual roles.',
        fixLabel: 'Add languages',
        ai: false,
      },
      {
        key: 'resume',
        title: 'Primary resume',
        status: hasPrimaryResume ? 'Complete' : 'Missing',
        why:
          'Your resume anchors credibility and allows fast sharing with recruiters from your public profile.',
        fixLabel: hasPrimaryResume ? 'Manage resumes' : 'Upload resume',
        ai: false,
      },
    ];

    return {
      headline,
      aboutMe,
      skills,
      languages,
      hasHeadline,
      hasSummary,
      hasSkills,
      hasLanguages,
      hasPrimaryResume,
      progress,
      completed,
      total,
      items,
    };
  }, [details, primaryResume]);

  const openAiModal = (field) => {
    setModalField(field);
    setAiError('');
    setAiSuggestions([]);
    setNotes('');

    if (field === 'headline') setDraftValue(computed.headline || '');
    if (field === 'aboutMe') setDraftValue(computed.aboutMe || '');
    if (field === 'skills') setDraftValue(computed.skills.join(', '));

    setModalOpen(true);
  };

  const closeModal = () => {
    if (aiBusy || saving) return;
    setModalOpen(false);
    setModalField(null);
    setAiSuggestions([]);
    setDraftValue('');
    setAiError('');
    setNotes('');
  };

  const callAi = async () => {
    if (!modalField) return;

    setAiBusy(true);
    setAiError('');
    setAiSuggestions([]);

    try {
      const primary = resumes.find((r) => r.isPrimary) || resumes[0] || null;
      const resumeContent = primary?.content ? String(primary.content) : '';

      const payload = {
        field: modalField,
        profile: {
          name: details?.name || null,
          headline: computed.headline || null,
          aboutMe: computed.aboutMe || null,
          skills: computed.skills || [],
          languages: safeArray(details?.languagesJson)
            .map((x) => (typeof x === 'string' ? x : (x?.name || x?.label || '')))
            .filter(Boolean),
          location: details?.location || null,
        },
        resume: resumeContent ? { name: primary?.name || 'Primary Resume', content: resumeContent } : null,
        notes: notes || null,
      };

      const resp = await fetch('/api/ai/profile-development', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        throw new Error(json?.error || 'AI request failed');
      }

      const suggestions = Array.isArray(json?.suggestions) ? json.suggestions : [];
      if (!suggestions.length) {
        throw new Error('No suggestions returned');
      }

      setAiSuggestions(suggestions);

      // Pre-fill draft with first suggestion (good UX)
      if (modalField === 'headline') setDraftValue(normalizeHeadlineSuggestion(suggestions[0]));
      if (modalField === 'aboutMe') setDraftValue(normalizeSummarySuggestion(suggestions[0]));
      if (modalField === 'skills') setDraftValue(splitSkills(suggestions[0]).join(', '));
    } catch (e) {
      console.error('[ProfileDevelopment] callAi error', e);
      setAiError(String(e?.message || 'AI error'));
    } finally {
      setAiBusy(false);
    }
  };

  const applyToProfile = async () => {
    if (!modalField) return;

    setSaving(true);
    setAiError('');

    try {
      const data = {};

      if (modalField === 'headline') {
        const v = normalizeHeadlineSuggestion(draftValue);
        if (!v) throw new Error('Headline cannot be empty.');
        data.headline = v;
      }

      if (modalField === 'aboutMe') {
        const v = normalizeSummarySuggestion(draftValue);
        if (v.length < 80) throw new Error('Summary is too short. Add a bit more substance.');
        data.aboutMe = v;
      }

      if (modalField === 'skills') {
        const names = splitSkills(draftValue);
        if (names.length < 6) throw new Error('Add at least 6 skills.');
        // Store as string[] so profile UI never renders object JSON blobs
        data.skillsJson = listToSkillObjects(names);
      }

      const resp = await fetch('/api/profile/details', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(json?.error || 'Failed to apply changes');

      // refresh data + close
      await fetchAll();
      closeModal();
    } catch (e) {
      setAiError(String(e?.message || 'Failed to apply'));
    } finally {
      setSaving(false);
    }
  };

  const goFix = (key) => {
    // Keep this dead-simple and non-breaking.
    // If you want exact routes later, we can tighten it — but this won’t crash anything.
    if (key === 'resume') return router.push('/resume/create').catch(() => router.push('/resume'));
    return router.push('/profile').catch(() => router.push('/seeker-dashboard'));
  };

  const canProceed = computed.completed >= computed.total; // all 5

  const HeaderBox = (
    <section
      style={{
        background: 'white',
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        border: '1px solid #eee',
        textAlign: 'center',
        marginBottom: 16,
      }}
    >
      <h1 style={{ margin: 0, color: ORANGE, fontSize: 24, fontWeight: 900 }}>
        Profile Development
      </h1>
      <p style={{ margin: '6px auto 0', color: '#607D8B', maxWidth: 760, lineHeight: 1.5 }}>
        Not everyone is a professional profile writer. This tool identifies recruiter-facing
        gaps and helps you strengthen them quickly and strategically.
      </p>
    </section>
  );

  const PromptsBlock = (
    <section
      style={{
        background: 'white',
        borderRadius: 12,
        padding: 24,
        border: '1px solid #eee',
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        display: 'grid',
        gap: 18,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, color: ORANGE, fontSize: 20, fontWeight: 900 }}>
            Profile Checklist (Recruiter-Relevant)
          </h2>
          <div style={{ marginTop: 6, fontSize: 13, color: '#64748b', fontWeight: 700 }}>
            Step 1 of 3: Profile Development
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, color: '#64748b', fontWeight: 900 }}>Progress</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: SLATE }}>
            {computed.completed}/{computed.total}
          </div>
        </div>
      </div>

      <div style={{ background: '#e2e8f0', borderRadius: 999, height: 7, overflow: 'hidden' }}>
        <div style={{ background: ORANGE, height: 7, width: `${computed.progress}%`, transition: 'width 0.25s' }} />
      </div>

      <ul style={{ display: 'grid', gap: 12, listStyle: 'none', padding: 0, margin: 0 }}>
        {computed.items.map((item) => {
          const isComplete = item.status === 'Complete';
          return (
            <li
              key={item.key}
              style={{
                borderRadius: 12,
                border: '1px solid #e5e7eb',
                padding: 14,
                display: 'grid',
                gap: 10,
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#111827' }}>
                    {item.title}
                  </div>
                  <div style={{ marginTop: 4, fontSize: 13, color: '#64748b', lineHeight: 1.45 }}>
                    {item.why}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 900,
                      padding: '4px 10px',
                      borderRadius: 999,
                      background: isComplete ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)',
                      color: isComplete ? '#15803d' : '#92400e',
                      border: `1px solid ${isComplete ? 'rgba(34,197,94,0.25)' : 'rgba(245,158,11,0.25)'}`,
                    }}
                  >
                    {item.status}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => goFix(item.key)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1px solid #e5e7eb',
                    background: 'white',
                    cursor: 'pointer',
                    fontWeight: 900,
                    color: '#111827',
                  }}
                >
                  {item.fixLabel}
                </button>

                {item.ai && (
                  <button
                    type="button"
                    onClick={() => openAiModal(item.key)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: 'none',
                      background: ORANGE,
                      cursor: 'pointer',
                      fontWeight: 900,
                      color: 'white',
                    }}
                  >
                    AI Assist
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div
        style={{
          marginTop: 12,
          padding: 12,
          borderRadius: 10,
          background: '#F8FAFC',
          border: '1px solid #E5E7EB',
          fontSize: 13,
          color: '#475569',
          lineHeight: 1.45,
        }}
      >
        <strong>Guidance note:</strong> This tool provides structured, AI-assisted guidance based on your
        profile and resume. It is designed to support your thinking and preparation, not to replace live
        coaching or mentorship. We encourage you to work with a coach or mentor through Spotlight to
        refine your strategy, positioning, and next steps.
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, alignItems: 'center' }}>
        <button
          type="button"
          onClick={fetchAll}
          disabled={loading}
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid #e5e7eb',
            background: 'white',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 900,
            color: '#111827',
            opacity: loading ? 0.6 : 1,
          }}
        >
          Refresh
        </button>

        <button
          onClick={onNext}
          disabled={!canProceed}
          type="button"
          style={{
            padding: '12px 18px',
            borderRadius: 10,
            border: 'none',
            fontWeight: 900,
            cursor: canProceed ? 'pointer' : 'not-allowed',
            fontSize: 14,
            opacity: canProceed ? 1 : 0.55,
            background: canProceed ? ORANGE : '#e5e7eb',
            color: canProceed ? 'white' : '#64748b',
          }}
        >
          Next: Offer Negotiation
        </button>
      </div>
    </section>
  );

  const modalTitle =
    modalField === 'headline'
      ? 'Improve your headline'
      : modalField === 'aboutMe'
      ? 'Improve your professional summary'
      : 'Improve your skills list';

  const modalHint =
    modalField === 'headline'
      ? 'We will generate recruiter-friendly headline options (role + strength + credibility).'
      : modalField === 'aboutMe'
      ? 'We will generate a clear 2–4 paragraph summary that reads human, confident, and recruiter-relevant.'
      : 'We will generate a relevant skills set (no fluff). You choose what to keep.';

  return (
    <>
      {HeaderBox}

      {loading ? (
        <section
          style={{
            background: 'white',
            borderRadius: 12,
            padding: 20,
            border: '1px solid #eee',
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
            color: '#64748b',
            fontWeight: 800,
          }}
        >
          Loading your profile checklist…
        </section>
      ) : (
        PromptsBlock
      )}

      <ModalShell open={modalOpen} onClose={closeModal} title={modalTitle}>
        <div style={{ display: 'grid', gap: 12 }}>
          <div
            style={{
              padding: 12,
              borderRadius: 12,
              border: '1px solid #e5e7eb',
              background: '#fff7ed',
              color: '#9a3412',
              fontWeight: 800,
              lineHeight: 1.45,
              fontSize: 13,
            }}
          >
            {modalHint}
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            <label style={{ fontSize: 12, fontWeight: 900, color: '#334155' }}>
              Optional notes (helps the AI stay specific)
            </label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Example: targeting Customer Success roles, remote/hybrid, enterprise SaaS…"
              style={{
                width: '100%',
                borderRadius: 10,
                border: '1px solid #e5e7eb',
                padding: 12,
                outline: 'none',
                fontWeight: 700,
                color: '#111827',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              onClick={callAi}
              disabled={aiBusy}
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                border: 'none',
                background: ORANGE,
                color: 'white',
                fontWeight: 900,
                cursor: aiBusy ? 'not-allowed' : 'pointer',
                opacity: aiBusy ? 0.7 : 1,
              }}
            >
              {aiBusy ? 'Generating…' : 'Generate suggestions'}
            </button>

            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 800 }}>
              Uses your stored profile + primary resume (if available).
            </div>
          </div>

          {aiError ? (
            <div
              style={{
                padding: 12,
                borderRadius: 12,
                border: '1px solid rgba(239,68,68,0.25)',
                background: 'rgba(239,68,68,0.08)',
                color: '#991b1b',
                fontWeight: 900,
                fontSize: 13,
              }}
            >
              {aiError}
            </div>
          ) : null}

          {aiSuggestions.length > 0 && (
            <div style={{ display: 'grid', gap: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: '#334155' }}>
                Suggestions (click to load)
              </div>

              <div style={{ display: 'grid', gap: 10 }}>
                {aiSuggestions.slice(0, 3).map((s, idx) => (
                  <button
                    key={`${idx}-${String(s).slice(0, 12)}`}
                    type="button"
                    onClick={() => {
                      if (modalField === 'headline') setDraftValue(normalizeHeadlineSuggestion(s));
                      if (modalField === 'aboutMe') setDraftValue(normalizeSummarySuggestion(s));
                      if (modalField === 'skills') setDraftValue(splitSkills(s).join(', '));
                    }}
                    style={{
                      textAlign: 'left',
                      padding: 12,
                      borderRadius: 12,
                      border: '1px solid #e5e7eb',
                      background: 'white',
                      cursor: 'pointer',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 900, color: '#64748b' }}>
                      Option {idx + 1}
                    </div>
                    <div style={{ marginTop: 6, fontSize: 13, fontWeight: 800, color: '#111827', lineHeight: 1.55, whiteSpace: 'pre-line' }}>
                      {String(s).trim()}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gap: 10 }}>
            <label style={{ fontSize: 12, fontWeight: 900, color: '#334155' }}>
              Final (you can edit before applying)
            </label>

            {modalField === 'aboutMe' ? (
              <textarea
                value={draftValue}
                onChange={(e) => setDraftValue(e.target.value)}
                rows={9}
                style={{
                  width: '100%',
                  borderRadius: 12,
                  border: '1px solid #e5e7eb',
                  padding: 12,
                  outline: 'none',
                  fontWeight: 700,
                  color: '#111827',
                  lineHeight: 1.5,
                }}
              />
            ) : (
              <input
                value={draftValue}
                onChange={(e) => setDraftValue(e.target.value)}
                style={{
                  width: '100%',
                  borderRadius: 12,
                  border: '1px solid #e5e7eb',
                  padding: 12,
                  outline: 'none',
                  fontWeight: 800,
                  color: '#111827',
                }}
              />
            )}

            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 800 }}>
              {modalField === 'skills'
                ? 'Tip: separate skills with commas.'
                : modalField === 'headline'
                ? 'Tip: include role + strength + credibility (example: “Client Success Leader | Enterprise SaaS | Operational Excellence”).'
                : 'Tip: 120+ characters minimum; keep it human and specific.'}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={closeModal}
              disabled={saving || aiBusy}
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid #e5e7eb',
                background: 'white',
                cursor: saving || aiBusy ? 'not-allowed' : 'pointer',
                fontWeight: 900,
                color: '#111827',
                opacity: saving || aiBusy ? 0.7 : 1,
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={applyToProfile}
              disabled={saving || aiBusy}
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                border: 'none',
                background: ORANGE,
                color: 'white',
                cursor: saving || aiBusy ? 'not-allowed' : 'pointer',
                fontWeight: 900,
                opacity: saving || aiBusy ? 0.75 : 1,
              }}
            >
              {saving ? 'Applying…' : 'Apply to Profile'}
            </button>
          </div>
        </div>
      </ModalShell>
    </>
  );
}
