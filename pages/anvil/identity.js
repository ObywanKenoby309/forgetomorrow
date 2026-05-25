import Head from 'next/head';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import SeekerLayout from '@/components/layouts/SeekerLayout';

const ORANGE = '#FF7043';
const DARK = '#1E293B';
const SLATE = '#334155';

const GLASS = {
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.58)',
  boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};

const WHITE_CARD = {
  borderRadius: 12,
  border: '1px solid rgba(0,0,0,0.08)',
  background: 'rgba(255,255,255,0.92)',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
};

const INPUT = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid rgba(0,0,0,0.14)',
  borderRadius: 10,
  fontSize: 13,
  color: DARK,
  background: 'rgba(255,255,255,0.92)',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};

const TEXTAREA = {
  ...INPUT,
  minHeight: 92,
  resize: 'vertical',
  lineHeight: 1.5,
};

const SECTION_HDR = {
  padding: '10px 14px',
  background:
    'linear-gradient(180deg, rgba(38,50,56,0.92), rgba(38,50,56,0.70))',
  color: 'white',
  fontWeight: 900,
  fontSize: 12,
  letterSpacing: 0.4,
  borderRadius: '12px 12px 0 0',
};

function getChromeFromAsPath(asPath) {
  try {
    const s = String(asPath || '');
    if (!s.includes('chrome=')) return '';

    const qIndex = s.indexOf('?');
    if (qIndex === -1) return '';

    const query = s.slice(qIndex + 1);
    const params = new URLSearchParams(query);

    return String(params.get('chrome') || '').toLowerCase();
  } catch {
    return '';
  }
}

function toList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return [];
}

function Pill({ children, tone = 'orange' }) {
  const colors = {
    orange: [
      'rgba(255,112,67,0.10)',
      ORANGE,
      'rgba(255,112,67,0.24)',
    ],
    green: [
      'rgba(22,163,74,0.10)',
      '#15803D',
      'rgba(22,163,74,0.24)',
    ],
    blue: [
      'rgba(14,165,233,0.10)',
      '#0369A1',
      'rgba(14,165,233,0.24)',
    ],
    amber: [
      'rgba(245,158,11,0.12)',
      '#92400E',
      'rgba(245,158,11,0.26)',
    ],
    slate: [
      'rgba(15,23,42,0.08)',
      '#334155',
      'rgba(15,23,42,0.14)',
    ],
  };

  const [bg, color, border] = colors[tone] || colors.orange;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        width: 'fit-content',
        borderRadius: 999,
        padding: '5px 9px',
        fontSize: 11,
        fontWeight: 900,
        background: bg,
        color,
        border: `1px solid ${border}`,
      }}
    >
      {children}
    </span>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <span
        style={{
          fontSize: 12,
          fontWeight: 900,
          color: SLATE,
        }}
      >
        {label}
      </span>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={INPUT}
      >
        <option value="">Choose one…</option>

        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  minHeight = 92,
}) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <span
        style={{
          fontSize: 12,
          fontWeight: 900,
          color: SLATE,
        }}
      >
        {label}
      </span>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          ...TEXTAREA,
          minHeight,
        }}
      />
    </label>
  );
}

function BulletList({ items, color = ORANGE }) {
  const arr = Array.isArray(items) ? items.filter(Boolean) : [];

  if (!arr.length) {
    return (
      <div
        style={{
          fontSize: 12,
          color: '#94A3B8',
          fontStyle: 'italic',
        }}
      >
        —
      </div>
    );
  }

  return (
    <ul
      style={{
        margin: 0,
        padding: 0,
        listStyle: 'none',
        display: 'grid',
        gap: 7,
      }}
    >
      {arr.map((item, idx) => (
        <li
          key={`${idx}-${item}`}
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'flex-start',
            fontSize: 12,
            color: SLATE,
            lineHeight: 1.5,
          }}
        >
          <span
            style={{
              color,
              fontWeight: 900,
              marginTop: 1,
            }}
          >
            •
          </span>

          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function ResultCard({
  title,
  tone = 'orange',
  children,
}) {
  const hdr =
    tone === 'green'
      ? 'rgba(22,163,74,0.86)'
      : tone === 'blue'
      ? 'rgba(14,165,233,0.86)'
      : tone === 'amber'
      ? 'rgba(245,158,11,0.90)'
      : tone === 'slate'
      ? 'rgba(51,65,85,0.92)'
      : 'rgba(255,112,67,0.90)';

  return (
    <section style={{ ...WHITE_CARD, overflow: 'hidden' }}>
      <div style={{ ...SECTION_HDR, background: hdr }}>
        {title}
      </div>

      <div style={{ padding: 14 }}>
        {children}
      </div>
    </section>
  );
}

export default function IdentityPage() {
  const router = useRouter();

  const chrome =
    String(router.query.chrome || '').toLowerCase() ||
    getChromeFromAsPath(router.asPath);

  const withChrome = (path) =>
    chrome
      ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}`
      : path;

  const [form, setForm] = useState({
    energy: '',
    autonomy: '',
    ambiguity: '',
    pressure: '',
    communication: '',
    growth: '',

    learningStyle: '',
    challengeStyle: '',
    motivation: '',
    recognitionStyle: '',
    careerHope: '',
    idealImpact: '',
    stressTrigger: '',
    supportNeed: '',

    recentWin: '',
    drain: '',
    goal: '',
  });

  const [snapshot, setSnapshot] = useState(null);

  const [error, setError] = useState('');
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const [shareSettings, setShareSettings] = useState({
    showOnPortfolio: false,
    shareWithCoach: false,
    includeInHiringPacket: false,
  });

  useEffect(() => {
    let active = true;

    const loadSaved = async () => {
      try {
        setLoadingSaved(true);

        const res = await fetch('/api/anvil/identity', {
          method: 'GET',
          credentials: 'include',
        });

        const data = await res.json().catch(() => ({}));

        if (!active) return;

        if (res.ok && data?.profile) {
          if (data.profile.answersJson) {
            setForm((prev) => ({
              ...prev,
              ...data.profile.answersJson,
            }));
          }

          if (data.profile.snapshotJson) {
            setSnapshot(data.profile.snapshotJson);
          }

          setShareSettings({
            showOnPortfolio: Boolean(data.profile.showOnPortfolio),
            shareWithCoach: Boolean(data.profile.shareWithCoach),
            includeInHiringPacket: Boolean(
              data.profile.includeInHiringPacket
            ),
          });
        }
      } catch {
        // non-blocking
      } finally {
        if (active) setLoadingSaved(false);
      }
    };

    loadSaved();

    return () => {
      active = false;
    };
  }, []);
  
  const completion = useMemo(() => {
    const required = [
      'energy',
      'autonomy',
      'ambiguity',
      'pressure',
      'communication',
      'growth',
      'learningStyle',
      'challengeStyle',
      'motivation',
      'careerHope',
    ];

    const complete = required.filter(
      (key) => Boolean(form[key])
    ).length;

    return Math.round(
      (complete / required.length) * 100
    );
  }, [form]);

  const setField = (key, value) => {
    setError('');
    setSaveMessage('');

    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const setShareField = (key, value) => {
    setSaveMessage('');

    setShareSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const generateSnapshot = async () => {
    const required = [
      'energy',
      'autonomy',
      'ambiguity',
      'pressure',
      'communication',
      'growth',
      'learningStyle',
      'challengeStyle',
      'motivation',
      'careerHope',
    ];

    const missing = required.filter(
      (key) => !form[key]
    );

    if (missing.length) {
      setError(
        'Complete the required reflection questions first.'
      );
      return;
    }

    setError('');
    setSaveMessage('');

    try {
      const res = await fetch('/api/anvil/identity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          answersJson: form,
          showOnPortfolio:
            shareSettings.showOnPortfolio,
          shareWithCoach:
            shareSettings.shareWithCoach,
          includeInHiringPacket:
            shareSettings.includeInHiringPacket,
          generateOnly: true,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data?.error ||
            'Failed to generate Professional Operating Profile.'
        );
      }

      setSnapshot(data?.snapshot || null);
    } catch (e) {
      setError(
        e?.message ||
          'Failed to generate Professional Operating Profile.'
      );
    }
  };

  const saveProfile = async () => {
    if (!snapshot) {
      setError(
        'Generate your Professional Operating Profile before saving.'
      );
      return;
    }

    setSaving(true);
    setError('');
    setSaveMessage('');

    try {
      const res = await fetch('/api/anvil/identity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          answersJson: form,
          snapshotJson: snapshot,
          showOnPortfolio:
            shareSettings.showOnPortfolio,
          shareWithCoach:
            shareSettings.shareWithCoach,
          includeInHiringPacket:
            shareSettings.includeInHiringPacket,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data?.error ||
            'Failed to save Professional Operating Profile.'
        );
      }

      setSaveMessage(
        'Professional Operating Profile saved.'
      );
    } catch (e) {
      setError(
        e?.message ||
          'Failed to save Professional Operating Profile.'
      );
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setSnapshot(null);
    setError('');
    setSaveMessage('');
  };

  const Header = (
    <section
      aria-label="Professional Operating Profile header"
      style={{
        background: 'white',
        borderRadius: 12,
        padding: 16,
        boxShadow:
          '0 2px 6px rgba(0,0,0,0.06)',
        border: '1px solid #eee',
        textAlign: 'center',
      }}
    >
      <h1
        style={{
          margin: 0,
          color: ORANGE,
          fontSize: 24,
          fontWeight: 900,
        }}
      >
        Professional Operating Profile
      </h1>

      <p
        style={{
          margin: '6px auto 0',
          color: '#607D8B',
          maxWidth: 920,
          lineHeight: 1.5,
        }}
      >
        A voluntary professional reflection
        designed to help explain how you
        operate, learn, process pressure,
        integrate into teams, and perform at
        your best — backed by evidence from
        your portfolio, projects, resume, and
        reflection responses.
      </p>
    </section>
  );

  return (
    <>
      <Head>
        <title>
          Professional Operating Profile |
          The Anvil | ForgeTomorrow
        </title>
      </Head>

      <SeekerLayout
        title="Professional Operating Profile | The Anvil | ForgeTomorrow"
        header={Header}
        right={null}
        activeNav={null}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 1180,
            margin: '0 auto',
            display: 'grid',
            gap: 14,
          }}
        >

          <div style={{ ...GLASS, padding: 16 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <Pill>
                  Voluntary · Evidence-backed · User-controlled
                </Pill>

                <h2
                  style={{
                    margin: '10px 0 4px',
                    color: DARK,
                    fontSize: 20,
                    fontWeight: 900,
                  }}
                >
                  Speak to who you are, not only what you have done
                </h2>

                <p
                  style={{
                    margin: 0,
                    color: '#64748B',
                    fontSize: 13,
                    lineHeight: 1.55,
                    maxWidth: 840,
                  }}
                >
                  This profile is not a personality test,
                  diagnosis, hidden score, or automatic hiring
                  filter. It combines your own reflection with
                  professional evidence to create a defensible
                  operating profile.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  router.push(withChrome('/anvil'))
                }
                style={{
                  border:
                    '1px solid rgba(255,112,67,0.28)',
                  background:
                    'rgba(255,112,67,0.08)',
                  color: ORANGE,
                  borderRadius: 999,
                  padding: '8px 14px',
                  fontSize: 12,
                  fontWeight: 900,
                  cursor: 'pointer',
                }}
              >
                ← Back to The Anvil
              </button>
            </div>
          </div>

          {loadingSaved ? (
            <section
              style={{
                ...GLASS,
                padding: 18,
                color: SLATE,
                fontWeight: 800,
              }}
            >
              Loading saved Professional Operating
              Profile…
            </section>
          ) : !snapshot ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'minmax(0, 1fr) minmax(280px, 340px)',
                gap: 14,
                alignItems: 'start',
              }}
            >
              <section
                style={{
                  ...GLASS,
                  overflow: 'hidden',
                }}
              >
                <div style={SECTION_HDR}>
                  🧭 OPERATING PROFILE REFLECTION
                </div>

                <div
                  style={{
                    padding: 16,
                    display: 'grid',
                    gap: 14,
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 7,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 900,
                          color: SLATE,
                        }}
                      >
                        Completion
                      </span>

                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 900,
                          color: ORANGE,
                        }}
                      >
                        {completion}%
                      </span>
                    </div>

                    <div
                      style={{
                        height: 8,
                        borderRadius: 999,
                        background:
                          'rgba(15,23,42,0.10)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${completion}%`,
                          height: '100%',
                          background: ORANGE,
                          transition:
                            'width 180ms ease',
                        }}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        'repeat(2, minmax(0, 1fr))',
                      gap: 12,
                    }}
                  >

                    <SelectField
                      label="What type of work gives you the most energy?"
                      value={form.energy}
                      onChange={(v) => setField('energy', v)}
                      options={[
                        {
                          value: 'systems',
                          label:
                            'Improving systems, processes, and operations',
                        },
                        {
                          value: 'people',
                          label:
                            'Helping, advising, coaching, or supporting people',
                        },
                        {
                          value: 'execution',
                          label:
                            'Getting things done and moving work forward',
                        },
                        {
                          value: 'strategy',
                          label:
                            'Planning direction, solving complex problems, or shaping vision',
                        },
                      ]}
                    />

                    <SelectField
                      label="How much autonomy helps you do your best work?"
                      value={form.autonomy}
                      onChange={(v) => setField('autonomy', v)}
                      options={[
                        {
                          value: 'high',
                          label:
                            'High autonomy — give me the outcome and trust me',
                        },
                        {
                          value: 'medium',
                          label:
                            'Balanced autonomy with clear check-ins',
                        },
                        {
                          value: 'low',
                          label:
                            'Clear structure, close alignment, and defined steps',
                        },
                      ]}
                    />

                    <SelectField
                      label="How comfortable are you with ambiguity?"
                      value={form.ambiguity}
                      onChange={(v) => setField('ambiguity', v)}
                      options={[
                        {
                          value: 'high',
                          label:
                            'Very comfortable — I can build through uncertainty',
                        },
                        {
                          value: 'medium',
                          label:
                            'Comfortable if priorities are clear',
                        },
                        {
                          value: 'low',
                          label:
                            'I prefer stable expectations and defined scope',
                        },
                      ]}
                    />

                    <SelectField
                      label="How do you usually respond under pressure?"
                      value={form.pressure}
                      onChange={(v) => setField('pressure', v)}
                      options={[
                        {
                          value: 'calm',
                          label:
                            'I get calm and stabilize the situation',
                        },
                        {
                          value: 'direct',
                          label:
                            'I make decisions quickly and act',
                        },
                        {
                          value: 'collaborative',
                          label:
                            'I gather people and coordinate a response',
                        },
                        {
                          value: 'reflective',
                          label:
                            'I pause, assess, and choose carefully',
                        },
                      ]}
                    />

                    <SelectField
                      label="What communication style fits you best?"
                      value={form.communication}
                      onChange={(v) => setField('communication', v)}
                      options={[
                        {
                          value: 'direct',
                          label:
                            'Direct, clear, and low-politics',
                        },
                        {
                          value: 'collaborative',
                          label:
                            'Collaborative, relational, and context-rich',
                        },
                        {
                          value: 'written',
                          label:
                            'Written, thoughtful, and well-structured',
                        },
                      ]}
                    />

                    <SelectField
                      label="What growth opportunity are you most focused on?"
                      value={form.growth}
                      onChange={(v) => setField('growth', v)}
                      options={[
                        {
                          value: 'visibility',
                          label:
                            'Being more visible for the value I create',
                        },
                        {
                          value: 'delegation',
                          label:
                            'Delegating and not carrying too much alone',
                        },
                        {
                          value: 'focus',
                          label:
                            'Improving focus and reducing overload',
                        },
                        {
                          value: 'strategy',
                          label:
                            'Positioning my work more strategically',
                        },
                      ]}
                    />

                    <SelectField
                      label="How do you learn best?"
                      value={form.learningStyle}
                      onChange={(v) => setField('learningStyle', v)}
                      options={[
                        {
                          value: 'hands_on',
                          label:
                            'Hands-on — let me work through the real thing',
                        },
                        {
                          value: 'mentor_guided',
                          label:
                            'Mentor-guided — show me the pattern, then let me try',
                        },
                        {
                          value: 'documentation',
                          label:
                            'Documentation-first — give me the structure and reference material',
                        },
                        {
                          value: 'trial_and_error',
                          label:
                            'Trial and error — I learn by testing and adjusting',
                        },
                      ]}
                    />

                    <SelectField
                      label="How do you usually see challenges?"
                      value={form.challengeStyle}
                      onChange={(v) => setField('challengeStyle', v)}
                      options={[
                        {
                          value: 'builder',
                          label:
                            'As something to build through or improve',
                        },
                        {
                          value: 'solver',
                          label:
                            'As a problem to diagnose and resolve',
                        },
                        {
                          value: 'stabilizer',
                          label:
                            'As something to calm, organize, and stabilize',
                        },
                        {
                          value: 'strategist',
                          label:
                            'As a signal that direction or priorities need review',
                        },
                      ]}
                    />

                    <SelectField
                      label="What most motivates you professionally?"
                      value={form.motivation}
                      onChange={(v) => setField('motivation', v)}
                      options={[
                        {
                          value: 'mission',
                          label:
                            'Mission — doing work that matters',
                        },
                        {
                          value: 'mastery',
                          label:
                            'Mastery — becoming excellent at what I do',
                        },
                        {
                          value: 'impact',
                          label:
                            'Impact — seeing meaningful results from the work',
                        },
                        {
                          value: 'ownership',
                          label:
                            'Ownership — being trusted to carry important work',
                        },
                        {
                          value: 'growth',
                          label:
                            'Growth — building toward a bigger future',
                        },
                      ]}
                    />

                    <SelectField
                      label="What do you hope your career gives you more of?"
                      value={form.careerHope}
                      onChange={(v) => setField('careerHope', v)}
                      options={[
                        {
                          value: 'purpose',
                          label:
                            'Purpose and meaningful contribution',
                        },
                        {
                          value: 'stability',
                          label:
                            'Stability and room to breathe',
                        },
                        {
                          value: 'leadership',
                          label:
                            'Leadership influence and responsibility',
                        },
                        {
                          value: 'craft',
                          label:
                            'A stronger craft and deeper expertise',
                        },
                        {
                          value: 'freedom',
                          label:
                            'Freedom, autonomy, and self-direction',
                        },
                      ]}
                    />
                  </div>

                  <TextField
                    label="Optional: Describe a recent professional win"
                    value={form.recentWin}
                    onChange={(v) =>
                      setField('recentWin', v)
                    }
                    placeholder="Example: improved a process, helped a team, solved a recurring issue, delivered under pressure…"
                  />

                  <TextField
                    label="Optional: What tends to drain you professionally?"
                    value={form.drain}
                    onChange={(v) =>
                      setField('drain', v)
                    }
                    placeholder="Example: disconnected leadership, unclear priorities, constant context switching, politics, repetitive work without ownership…"
                  />

                  <TextField
                    label="Optional: What professional pressure or stress affects you the most?"
                    value={form.stressTrigger}
                    onChange={(v) =>
                      setField('stressTrigger', v)
                    }
                    placeholder="Example: lack of clarity, unstable leadership, constant interruption, no trust, overloaded timelines…"
                  />

                  <TextField
                    label="Optional: What kind of support helps you perform best?"
                    value={form.supportNeed}
                    onChange={(v) =>
                      setField('supportNeed', v)
                    }
                    placeholder="Example: clear priorities, communication, trust, mentorship, room to focus, operational alignment…"
                  />

                  <TextField
                    label="Optional: What kind of impact do you most want your work to create?"
                    value={form.idealImpact}
                    onChange={(v) =>
                      setField('idealImpact', v)
                    }
                    placeholder="Example: helping people, improving systems, creating stability, solving meaningful problems, building something lasting…"
                  />

                  <TextField
                    label="Optional: How do you prefer to be recognized for your work?"
                    value={form.recognitionStyle}
                    onChange={(v) =>
                      setField(
                        'recognitionStyle',
                        v
                      )
                    }
                    placeholder="Example: quiet trust, measurable outcomes, leadership responsibility, compensation, visible appreciation…"
                  />

                  <TextField
                    label="Optional: What are you trying to understand or decide right now?"
                    value={form.goal}
                    onChange={(v) =>
                      setField('goal', v)
                    }
                    placeholder="Example: whether to pivot, lead, specialize, build, scale, or better explain my strengths…"
                  />

                  {error ? (
                    <div
                      style={{
                        padding: 11,
                        borderRadius: 10,
                        background:
                          'rgba(220,38,38,0.10)',
                        border:
                          '1px solid rgba(220,38,38,0.25)',
                        color: '#B91C1C',
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      {error}
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={generateSnapshot}
                    style={{
                      width: '100%',
                      border: 'none',
                      borderRadius: 12,
                      background: ORANGE,
                      color: 'white',
                      padding: 14,
                      fontSize: 14,
                      fontWeight: 900,
                      cursor: 'pointer',
                      boxShadow:
                        '0 4px 14px rgba(255,112,67,0.34)',
                    }}
                  >
                    Generate My Professional Operating Profile
                  </button>
                </div>
              </section>

              <aside
                style={{
                  display: 'grid',
                  gap: 12,
                }}
              >
                <section
                  style={{
                    ...GLASS,
                    padding: 14,
                    background:
                      'rgba(30,41,59,0.88)',
                  }}
                >
                  <div
                    style={{
                      fontWeight: 900,
                      color: ORANGE,
                      fontSize: 14,
                      marginBottom: 6,
                    }}
                  >
                    What this is designed to do
                  </div>

                  <p
                    style={{
                      margin: 0,
                      color:
                        'rgba(255,255,255,0.72)',
                      fontSize: 12,
                      lineHeight: 1.6,
                    }}
                  >
                    Help explain how a person
                    best operates professionally —
                    including motivation, stress
                    processing, learning style,
                    integration needs, operational
                    strengths, and work environment
                    alignment — backed by
                    explainable evidence.
                  </p>
                </section>

                <section
                  style={{
                    ...WHITE_CARD,
                    padding: 14,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 900,
                      color: DARK,
                      fontSize: 13,
                      marginBottom: 8,
                    }}
                  >
                    Evidence model
                  </div>

                  <BulletList
                    items={[
                      'Self-reflection evidence',
                      'Resume evidence',
                      'Portfolio/about evidence',
                      'Project evidence',
                      'Operational intelligence signals',
                    ]}
                  />
                </section>

                <section
                  style={{
                    ...WHITE_CARD,
                    padding: 14,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 900,
                      color: DARK,
                      fontSize: 13,
                      marginBottom: 8,
                    }}
                  >
                    Grounding principle
                  </div>

                  <BulletList
                    items={[
                      'Patterns, not labels.',
                      'Evidence, not assumptions.',
                      'Guidance, not diagnosis.',
                      'User control before sharing.',
                    ]}
                  />
                </section>
              </aside>
            </div>

          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'minmax(280px, 340px) minmax(0, 1fr)',
                gap: 14,
              }}
            >
              <aside
                style={{
                  ...GLASS,
                  padding: 14,
                  alignSelf: 'start',
                  position: 'sticky',
                  top: 16,
                }}
              >
                <Pill tone="green">
                  Profile generated
                </Pill>

                <h2
                  style={{
                    margin: '10px 0 4px',
                    color: DARK,
                    fontSize: 20,
                    fontWeight: 900,
                  }}
                >
                  {snapshot.operatingStyle}
                </h2>

                <p
                  style={{
                    margin: '0 0 12px',
                    color: '#64748B',
                    fontSize: 12,
                    lineHeight: 1.55,
                  }}
                >
                  {snapshot.professionalSummary}
                </p>

                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    flexWrap: 'wrap',
                    marginBottom: 12,
                  }}
                >
                  {toList(snapshot.strengthSignals).map(
                    (s) => (
                      <Pill key={s}>{s}</Pill>
                    )
                  )}
                </div>

                <button
                  type="button"
                  onClick={reset}
                  style={{
                    width: '100%',
                    borderRadius: 999,
                    padding: '8px 14px',
                    border:
                      '1px solid rgba(255,112,67,0.25)',
                    background:
                      'rgba(255,112,67,0.08)',
                    color: ORANGE,
                    fontSize: 12,
                    fontWeight: 900,
                    cursor: 'pointer',
                  }}
                >
                  Edit answers
                </button>
              </aside>

              <section
                style={{
                  display: 'grid',
                  gap: 12,
                }}
              >
                <ResultCard
                  title="👤 THE PERSON"
                  tone="slate"
                >
                  <BulletList
                    items={
                      toList(snapshot.person)
                        .length
                        ? snapshot.person
                        : [
                            snapshot.professionalSummary,
                          ]
                    }
                    color="#334155"
                  />
                </ResultCard>

                <ResultCard
                  title="💼 THE PROFESSIONAL"
                  tone="orange"
                >
                  <BulletList
                    items={
                      toList(snapshot.professional)
                        .length
                        ? snapshot.professional
                        : snapshot.strengthSignals
                    }
                  />
                </ResultCard>

                <ResultCard
                  title="🔥 CORE STRENGTH SIGNALS"
                  tone="orange"
                >
                  <BulletList
                    items={snapshot.strengthSignals}
                  />
                </ResultCard>

                <ResultCard
                  title="🌍 WHERE I THRIVE"
                  tone="blue"
                >
                  <BulletList
                    items={snapshot.thrivesIn}
                    color="#0369A1"
                  />
                </ResultCard>

                <ResultCard
                  title="🧠 HOW I LEARN"
                  tone="blue"
                >
                  <BulletList
                    items={
                      toList(snapshot.learningStyle)
                        .length
                        ? snapshot.learningStyle
                        : snapshot.learningGuidance
                    }
                    color="#0369A1"
                  />
                </ResultCard>

                <ResultCard
                  title="⚡ HOW I PROCESS PRESSURE"
                  tone="amber"
                >
                  <BulletList
                    items={
                      toList(snapshot.stressProcessing)
                        .length
                        ? snapshot.stressProcessing
                        : snapshot.pressureGuidance
                    }
                    color="#92400E"
                  />
                </ResultCard>
				
                <ResultCard
                  title="🎯 WHAT MOTIVATES ME"
                  tone="green"
                >
                  <BulletList
                    items={
                      toList(snapshot.motivationDrivers)
                        .length
                        ? snapshot.motivationDrivers
                        : snapshot.motivation
                    }
                    color="#15803D"
                  />
                </ResultCard>

                <ResultCard
                  title="🧩 HOW I INTEGRATE INTO OPERATIONS"
                  tone="green"
                >
                  <BulletList
                    items={
                      snapshot.integrationGuidance
                    }
                    color="#15803D"
                  />
                </ResultCard>

                <ResultCard
                  title="🤝 WHERE I MAY NEED SUPPORT"
                  tone="amber"
                >
                  <BulletList
                    items={snapshot.supportAreas}
                    color="#92400E"
                  />
                </ResultCard>

                <ResultCard
                  title="🚀 CAREER DIRECTION & HOPE"
                  tone="blue"
                >
                  <BulletList
                    items={
                      toList(snapshot.careerDirection)
                        .length
                        ? snapshot.careerDirection
                        : [
                            form.goal ||
                              'Career direction guidance will strengthen as more evidence is connected.',
                          ]
                    }
                    color="#0369A1"
                  />
                </ResultCard>

                <ResultCard
                  title="🧾 WHY THIS RESULT APPEARED"
                  tone="green"
                >
                  <div
                    style={{
                      display: 'grid',
                      gap: 14,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: 900,
                          color: '#15803D',
                          fontSize: 12,
                          marginBottom: 8,
                        }}
                      >
                        Self-reflection evidence
                      </div>

                      <BulletList
                        items={
                          snapshot?.why
                            ?.selfReflection ||
                          []
                        }
                        color="#15803D"
                      />
                    </div>

                    <div>
                      <div
                        style={{
                          fontWeight: 900,
                          color: '#0369A1',
                          fontSize: 12,
                          marginBottom: 8,
                        }}
                      >
                        Resume evidence
                      </div>

                      <BulletList
                        items={
                          snapshot?.why
                            ?.resumeEvidence || []
                        }
                        color="#0369A1"
                      />
                    </div>

                    <div>
                      <div
                        style={{
                          fontWeight: 900,
                          color: ORANGE,
                          fontSize: 12,
                          marginBottom: 8,
                        }}
                      >
                        Portfolio evidence
                      </div>

                      <BulletList
                        items={
                          snapshot?.why
                            ?.portfolioEvidence ||
                          []
                        }
                      />
                    </div>

                    <div>
                      <div
                        style={{
                          fontWeight: 900,
                          color: '#92400E',
                          fontSize: 12,
                          marginBottom: 8,
                        }}
                      >
                        Project evidence
                      </div>

                      <BulletList
                        items={
                          snapshot?.why
                            ?.projectEvidence || []
                        }
                        color="#92400E"
                      />
                    </div>

                    <div>
                      <div
                        style={{
                          fontWeight: 900,
                          color: '#334155',
                          fontSize: 12,
                          marginBottom: 8,
                        }}
                      >
                        Operational intelligence signals
                      </div>

                      <BulletList
                        items={
                          snapshot?.why
                            ?.intelligenceEvidence ||
                          []
                        }
                        color="#334155"
                      />
                    </div>
                  </div>
                </ResultCard>
				
                <section
                  style={{
                    ...GLASS,
                    padding: 14,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 900,
                      color: ORANGE,
                      fontSize: 13,
                      marginBottom: 8,
                    }}
                  >
                    Save & share controls
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        'repeat(3, minmax(0, 1fr))',
                      gap: 8,
                    }}
                  >
                    <label
                      style={{
                        ...WHITE_CARD,
                        padding: 10,
                        fontSize: 12,
                        fontWeight: 800,
                        color: SLATE,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={
                          shareSettings.showOnPortfolio
                        }
                        onChange={(e) =>
                          setShareField(
                            'showOnPortfolio',
                            e.target.checked
                          )
                        }
                        style={{ marginRight: 7 }}
                      />
                      Show on portfolio
                    </label>

                    <label
                      style={{
                        ...WHITE_CARD,
                        padding: 10,
                        fontSize: 12,
                        fontWeight: 800,
                        color: SLATE,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={
                          shareSettings.shareWithCoach
                        }
                        onChange={(e) =>
                          setShareField(
                            'shareWithCoach',
                            e.target.checked
                          )
                        }
                        style={{ marginRight: 7 }}
                      />
                      Share with coach
                    </label>

                    <label
                      style={{
                        ...WHITE_CARD,
                        padding: 10,
                        fontSize: 12,
                        fontWeight: 800,
                        color: SLATE,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={
                          shareSettings.includeInHiringPacket
                        }
                        onChange={(e) =>
                          setShareField(
                            'includeInHiringPacket',
                            e.target.checked
                          )
                        }
                        style={{ marginRight: 7 }}
                      />
                      Include in hiring packet
                    </label>
                  </div>

                  {error ? (
                    <div
                      style={{
                        marginTop: 10,
                        padding: 11,
                        borderRadius: 10,
                        background:
                          'rgba(220,38,38,0.10)',
                        border:
                          '1px solid rgba(220,38,38,0.25)',
                        color: '#B91C1C',
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      {error}
                    </div>
                  ) : null}

                  {saveMessage ? (
                    <div
                      style={{
                        marginTop: 10,
                        padding: 11,
                        borderRadius: 10,
                        background:
                          'rgba(22,163,74,0.10)',
                        border:
                          '1px solid rgba(22,163,74,0.25)',
                        color: '#15803D',
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      {saveMessage}
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={saveProfile}
                    disabled={saving}
                    style={{
                      width: '100%',
                      marginTop: 12,
                      border: 'none',
                      borderRadius: 12,
                      background: saving
                        ? '#9CA3AF'
                        : ORANGE,
                      color: 'white',
                      padding: 14,
                      fontSize: 14,
                      fontWeight: 900,
                      cursor: saving
                        ? 'not-allowed'
                        : 'pointer',
                      boxShadow: saving
                        ? 'none'
                        : '0 4px 14px rgba(255,112,67,0.34)',
                    }}
                  >
                    {saving
                      ? 'Saving…'
                      : 'Save Professional Operating Profile'}
                  </button>
                </section>
              </section>
            </div>
          )}
        </div>
      </SeekerLayout>
    </>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}