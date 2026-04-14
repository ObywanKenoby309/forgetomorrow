// pages/dashboard/coaching/clients/profile.js
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import CoachingLayout from '@/components/layouts/CoachingLayout';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';
import { MetaRow, SectionCard, TabButton } from '@/components/coaching/clients/ClientProfilePrimitives';
import { useClientProfile } from '@/hooks/useClientProfile';
import {
  avatarColor,
  initials,
  fmtDate,
  fmtDateTime,
  toDateInputValue,
  toStringArray,
  toEducationObjects,
  getExperienceList,
  STATUS,
  defaultStatus,
  shimmerCSS,
} from '@/lib/coaching/clientProfileHelpers';

export default function ClientProfileUpdatePage() {
  const router = useRouter();

  const {
    client, setClient,
    profileData,
    form, setForm,
    loading, error,
    saving, saved, handleSave,
    newNote, setNewNote, savingNote, handleAddNote, handleDeleteNote,
    docTitle, setDocTitle,
    docUrl, setDocUrl,
    docType, setDocType,
    savingDoc, showDocForm, setShowDocForm,
    handleAddDoc, handleDeleteDoc,
    planInput, setPlanInput, planItems, addPlanItem, removePlanItem,
    activeTab, setActiveTab,
    strategyView, setStrategyView,
    generatingStrategy, handleGenerateStrategy,
    sessions, notes, docs, avatarUrl, recentActivity,
    onChange,
  } = useClientProfile();

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <CoachingLayout
        title="Client Profile | ForgeTomorrow"
        activeNav="clients"
        contentFullBleed
        sidebarInitialOpen={{ coaching: true, seeker: false }}
      >
        <style>{shimmerCSS}</style>
        <div style={{ display: 'grid', gap: 14 }}>
          {[200, 300, 180].map((h, i) => (
            <div
              key={i}
              style={{
                height: h,
                borderRadius: 14,
                background: 'linear-gradient(90deg,#F5F7F9 25%,#ECEFF1 50%,#F5F7F9 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.4s infinite',
              }}
            />
          ))}
        </div>
      </CoachingLayout>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error || !client || !form) {
    return (
      <CoachingLayout
        title="Client Profile | ForgeTomorrow"
        activeNav="clients"
        contentFullBleed
        sidebarInitialOpen={{ coaching: true, seeker: false }}
      >
        <SectionCard title="Client Not Found">
          <p className="text-sm text-slate-500 mb-4">
            {error || 'No client found for the provided email.'}
          </p>
          <Link href="/dashboard/coaching/clients" className="text-sm font-semibold text-[#FF7043]">
            ← Back to Clients
          </Link>
        </SectionCard>
      </CoachingLayout>
    );
  }

  // ── Derived render values ──────────────────────────────────────────────────
  const source    = profileData || client;
  const isFTUser  = Boolean(profileData);
  const [avatarBg, avatarDark] = avatarColor(client.name);
  const cfg = STATUS[form.status] || defaultStatus;

  const profileHref =
    (typeof source.profileUrl === 'string' && source.profileUrl.trim()) ||
    (typeof form.profileUrl === 'string' && form.profileUrl.trim()) ||
    (typeof client.profileUrl === 'string' && client.profileUrl.trim()) ||
    (typeof source.slug === 'string' && source.slug.trim() ? `/profile/${source.slug.trim()}` : '') ||
    (typeof client.profileSlug === 'string' && client.profileSlug.trim()
      ? `/profile/${client.profileSlug.trim()}`
      : '') ||
    (client.clientId ? `/member-profile?userId=${client.clientId}` : '');

  const summaryText = isFTUser
    ? source.summary?.trim?.() || source.aboutMe?.trim?.() || source.profileSummary?.trim?.() || source.headline?.trim?.() || ''
    : form.manualSummary?.trim() || '';

  const skillsList = isFTUser
    ? toStringArray(source.skills || source.skillsJson || source.skillsProfile || source.topSkills || source.resumeSkills)
    : toStringArray(form.manualSkills || '');

  const experienceList = isFTUser
    ? getExperienceList(source.experience || source.workHistory || source.profileExperience || source.resumeExperience)
    : [];

  const educationList = isFTUser
    ? toEducationObjects(source.education || source.educationJson || source.profileEducation)
    : [];

  const preferredLocations = isFTUser
    ? toStringArray(source.preferredLocations || source.workPreferences?.preferredLocations || source.workPreferences?.locations)
    : toStringArray(form.manualPreferredLocations || '');

  const workStatus = isFTUser
    ? source.workStatus || source.workPreferences?.workStatus || source.workPreferences?.status || ''
    : form.manualWorkStatus || '';

  const preferredWorkType = isFTUser
    ? source.preferredWorkType || source.workPreferences?.preferredWorkType || source.workPreferences?.workType || ''
    : form.manualPreferredWorkType || '';

  const willingToRelocate = isFTUser
    ? source.willingToRelocate ?? source.workPreferences?.willingToRelocate ?? source.workPreferences?.relocate ?? ''
    : form.manualWillingToRelocate || '';

  const hasWorkPrefs = Boolean(
    workStatus || preferredWorkType || preferredLocations.length || String(willingToRelocate || '').trim()
  );

  const openProfile = () => {
    if (!profileHref) return;
    if (/^https?:\/\//i.test(profileHref)) {
      window.open(profileHref, '_blank', 'noopener,noreferrer');
      return;
    }
    router.push(profileHref);
  };

  const tabBadges = {
    profile: null,
    coaching: notes.length + sessions.length,
    documents: docs.length || null,
  };

  const strategyHasResults = Boolean(form.strategyBrief);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <CoachingLayout
      title={`${client.name} | ForgeTomorrow`}
      activeNav="clients"
      contentFullBleed
      sidebarInitialOpen={{ coaching: true, seeker: false }}
    >
      <style>{shimmerCSS}</style>

      <div className="w-full pr-3 box-border">
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_260px] gap-3 w-full min-w-0">
          <section className="rounded-[22px] border border-white/24 bg-[rgba(248,250,252,0.80)] shadow-[0_20px_50px_rgba(2,6,23,0.16)] backdrop-blur-xl overflow-hidden xl:col-[1/2]">

            {/* ── Page header ── */}
            <div className="px-3 py-3 sm:px-4 sm:py-4 border-b border-white/30 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(248,250,252,0.78))]">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[16px] font-black tracking-tight text-slate-900 truncate">
                    {client.name || 'Client'}
                  </div>
                  <div className="mt-1 text-[13px] text-slate-600 truncate">
                    Coaching Client • {client.email || 'No email on file'}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Link
                    href="/dashboard/coaching/clients"
                    className="rounded-xl border border-slate-200 bg-white/85 px-2.5 py-1.5 text-[13px] font-medium text-slate-700 shadow-sm hover:bg-white transition"
                  >
                    Back
                  </Link>

                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-xl border border-[#FF7043] bg-[#FF7043] px-2.5 py-1.5 text-[13px] font-medium text-white shadow-sm hover:bg-[#F4511E] transition disabled:opacity-70"
                  >
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>

                  {saved ? (
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
                      Saved
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mt-3">
                <TabButton id="profile"   label="Profile"   activeTab={activeTab} setActiveTab={setActiveTab} badge={tabBadges.profile} />
                <TabButton id="coaching"  label="Coaching"  activeTab={activeTab} setActiveTab={setActiveTab} badge={tabBadges.coaching} />
                <TabButton id="documents" label="Documents" activeTab={activeTab} setActiveTab={setActiveTab} badge={tabBadges.documents} />
              </div>
            </div>

            {/* ── Tab content ── */}
            <div className="p-3 sm:p-3.5 bg-[linear-gradient(180deg,rgba(248,250,252,0.24),rgba(241,245,249,0.38))]">

              {/* ── Profile tab ── */}
              {activeTab === 'profile' ? (
                <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-3">
                  <div className="space-y-3">
                    <SectionCard title="Client Snapshot">
                      <div className="flex flex-col items-center text-center gap-3">
                        <div
                          style={{
                            width: 64, height: 64, borderRadius: '999px',
                            background: avatarUrl ? 'transparent' : `linear-gradient(135deg, ${avatarBg}, ${avatarDark})`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontWeight: 800, fontSize: 24,
                            boxShadow: `0 8px 24px ${avatarBg}55`,
                            outline: `3px solid ${cfg.ring}45`, outlineOffset: 3, overflow: 'hidden',
                          }}
                        >
                          {avatarUrl ? (
                            <img src={avatarUrl} alt={client.name || 'Client avatar'} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          ) : (
                            initials(client.name)
                          )}
                        </div>

                        <div>
                          <div className="text-[16px] font-black tracking-tight text-slate-900">{client.name}</div>
                          <div className="mt-1 text-sm text-slate-500">{client.email || 'No email on file'}</div>
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-2">
                          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 999, background: cfg.bg, color: cfg.color }}>
                            {form.status}
                          </span>
                          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                            {isFTUser ? 'ForgeTomorrow User' : 'External Client'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 gap-2 w-full pt-1">
                          <button type="button" onClick={() => router.push('/dashboard/coaching/sessions')} className="rounded-xl border border-slate-200 bg-white/85 px-2.5 py-1.5 text-[13px] font-medium text-slate-700 shadow-sm hover:bg-white transition">
                            View Sessions
                          </button>
                          <button type="button" onClick={() => router.push('/coaching/messaging')} className="rounded-xl border border-slate-200 bg-white/85 px-2.5 py-1.5 text-[13px] font-medium text-slate-700 shadow-sm hover:bg-white transition">
                            Message
                          </button>
                          {profileHref ? (
                            <button type="button" onClick={openProfile} className="rounded-xl border border-slate-200 bg-white/85 px-2.5 py-1.5 text-[13px] font-medium text-slate-700 shadow-sm hover:bg-white transition">
                              View Profile
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </SectionCard>

                    <SectionCard title="Command Snapshot">
                      <div className="divide-y divide-slate-100">
                        <MetaRow label="Status"       value={form.status} />
                        <MetaRow label="Next session" value={form.nextSession ? fmtDateTime(form.nextSession) : ''} />
                        <MetaRow label="Last contact" value={form.lastContact ? fmtDateTime(form.lastContact) : ''} />
                        <MetaRow label="Sessions"     value={sessions.length} />
                        <MetaRow label="Notes"        value={notes.length} />
                        <MetaRow label="Documents"    value={docs.length} />
                      </div>
                    </SectionCard>
                  </div>

                  <div className="space-y-3">
                    <SectionCard title="Summary">
                      {isFTUser ? (
                        summaryText ? (
                          <div className="text-[13px] leading-6 text-slate-700 whitespace-pre-line">{summaryText}</div>
                        ) : (
                          <div className="text-sm text-slate-500">No profile summary available yet.</div>
                        )
                      ) : (
                        <textarea className="border border-slate-200 rounded-2xl px-3 py-2 w-full min-h-[150px] text-sm bg-white/88" placeholder="Enter client summary..." value={form.manualSummary || ''} onChange={onChange('manualSummary')} />
                      )}
                    </SectionCard>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                      <SectionCard title="Experience">
                        {isFTUser ? (
                          experienceList.length > 0 ? (
                            <div className="space-y-3 max-h-[240px] overflow-y-auto pr-1">
                              {experienceList.map((exp, idx) => (
                                <div key={`${exp.title}-${idx}`} className="border-b border-slate-100 last:border-0 pb-3">
                                  <div className="font-semibold text-slate-900 break-words">
                                    {[exp.title, exp.company].filter(Boolean).join(' — ') || 'Experience'}
                                  </div>
                                  {exp.range ? <div className="text-xs text-slate-500 mt-1">{exp.range}</div> : null}
                                  {exp.highlights?.length ? (
                                    <ul className="mt-2 space-y-1">
                                      {exp.highlights.slice(0, 3).map((item, itemIdx) => (
                                        <li key={`${item}-${itemIdx}`} className="text-sm text-slate-700 leading-6">• {item}</li>
                                      ))}
                                    </ul>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-slate-500">No experience is available on this client yet.</div>
                          )
                        ) : (
                          <textarea className="border border-slate-200 rounded-2xl px-3 py-2 w-full min-h-[180px] text-sm bg-white/88" placeholder="Enter experience manually..." value={form.manualExperience || ''} onChange={onChange('manualExperience')} />
                        )}
                      </SectionCard>

                      <SectionCard title="Education">
                        {isFTUser ? (
                          educationList.length > 0 ? (
                            <div className="space-y-3 max-h-[240px] overflow-y-auto pr-1">
                              {educationList.map((edu, idx) => (
                                <div key={`${edu.school}-${idx}`} className="border-b border-slate-100 last:border-0 pb-3">
                                  <div className="font-semibold text-slate-900 break-words">
                                    {[edu.degree, edu.field].filter(Boolean).join(' in ') || 'Education'}
                                  </div>
                                  <div className="text-sm text-slate-600 mt-1 break-words">{edu.school || 'School not listed'}</div>
                                  {(edu.startYear || edu.endYear) ? (
                                    <div className="text-xs text-slate-500 mt-1">{[edu.startYear, edu.endYear].filter(Boolean).join(' - ')}</div>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-slate-500">No education details are available yet.</div>
                          )
                        ) : (
                          <textarea className="border border-slate-200 rounded-2xl px-3 py-2 w-full min-h-[180px] text-sm bg-white/88" placeholder="Enter education manually..." value={form.manualEducation || ''} onChange={onChange('manualEducation')} />
                        )}
                      </SectionCard>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                      <SectionCard title="Skills" helperText={isFTUser ? 'Read-only profile context for coaching.' : 'Coach-managed profile context for non-FT clients.'}>
                        {isFTUser ? (
                          skillsList.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {skillsList.map((skill, idx) => (
                                <span key={`${skill}-${idx}`} className="text-xs px-2 py-[6px] rounded-xl border bg-slate-100 text-slate-700 border-slate-300">{skill}</span>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-slate-500">No skills are available on this client yet.</div>
                          )
                        ) : (
                          <input className="border border-slate-200 rounded-xl px-3 py-2 text-sm w-full bg-white/88" placeholder="Enter skills (comma separated)" value={form.manualSkills || ''} onChange={onChange('manualSkills')} />
                        )}
                      </SectionCard>

                      <SectionCard title="Work Preferences">
                        {isFTUser ? (
                          hasWorkPrefs ? (
                            <div className="divide-y divide-slate-100">
                              <MetaRow label="Status" value={workStatus} />
                              <MetaRow label="Work type" value={preferredWorkType} />
                              <MetaRow label="Willing to relocate" value={typeof willingToRelocate === 'boolean' ? (willingToRelocate ? 'Yes' : 'No') : String(willingToRelocate || '').trim()} />
                              {preferredLocations.length > 0 ? (
                                <div className="py-2">
                                  <div className="text-xs text-slate-500 mb-2">Preferred locations</div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {preferredLocations.map((loc, idx) => (
                                      <span key={`${loc}-${idx}`} className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-700">{loc}</span>
                                    ))}
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          ) : (
                            <div className="text-sm text-slate-500">No work preferences are available for this client yet.</div>
                          )
                        ) : (
                          <div className="space-y-3">
                            <input className="border border-slate-200 rounded-xl px-3 py-2 text-sm w-full bg-white/88" placeholder="Work status" value={form.manualWorkStatus || ''} onChange={onChange('manualWorkStatus')} />
                            <input className="border border-slate-200 rounded-xl px-3 py-2 text-sm w-full bg-white/88" placeholder="Preferred work type" value={form.manualPreferredWorkType || ''} onChange={onChange('manualPreferredWorkType')} />
                            <input className="border border-slate-200 rounded-xl px-3 py-2 text-sm w-full bg-white/88" placeholder="Preferred locations (comma separated)" value={form.manualPreferredLocations || ''} onChange={onChange('manualPreferredLocations')} />
                            <input className="border border-slate-200 rounded-xl px-3 py-2 text-sm w-full bg-white/88" placeholder="Willing to relocate" value={form.manualWillingToRelocate || ''} onChange={onChange('manualWillingToRelocate')} />
                          </div>
                        )}
                      </SectionCard>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* ── Coaching tab ── */}
              {activeTab === 'coaching' ? (
                <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1fr)_minmax(0,0.9fr)] gap-3 items-stretch">
                  <div className="flex flex-col gap-3 h-full">
                    <SectionCard title="Coach Controls" className="min-h-[420px] flex-1" bodyClassName="h-full flex flex-col">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1.5">Name</label>
                          <input className="border border-slate-200 rounded-xl px-3 py-2 text-sm w-full bg-white/88" value={form.name} onChange={onChange('name')} />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1.5">Email</label>
                          <input className="border border-slate-200 rounded-xl px-3 py-2 text-sm w-full bg-white/88" value={form.email} onChange={onChange('email')} />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1.5">Status</label>
                          <select className="border border-slate-200 rounded-xl px-3 py-2 text-sm w-full bg-white/88" value={form.status} onChange={onChange('status')}>
                            <option value="Active">Active</option>
                            <option value="At Risk">At Risk</option>
                            <option value="New Intake">New Intake</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1.5">Next Session</label>
                          <input className="border border-slate-200 rounded-xl px-3 py-2 text-sm w-full bg-white/88" type="datetime-local" value={toDateInputValue(form.nextSession)} onChange={onChange('nextSession')} />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1.5">Last Contact</label>
                          <input className="border border-slate-200 rounded-xl px-3 py-2 text-sm w-full bg-white/88" type="datetime-local" value={toDateInputValue(form.lastContact)} onChange={onChange('lastContact')} />
                        </div>
                      </div>
                    </SectionCard>

                    <SectionCard title="Focus Areas / Plan" helperText="Private to the coach." className="min-h-[160px]" bodyClassName="h-full flex flex-col">
                      <div className="flex-1 min-h-0 flex flex-col">
                        <div className="flex flex-wrap gap-2 mb-3">
                          {planItems.length > 0 ? (
                            planItems.map((item, i) => (
                              <span key={`${item}-${i}`} className="text-xs px-2 py-[6px] rounded-xl border bg-slate-100 text-slate-700 border-slate-300 flex items-center gap-1 break-words">
                                {item}
                                <button type="button" onClick={() => removePlanItem(i)} className="ml-1 text-slate-500 hover:text-slate-700">×</button>
                              </span>
                            ))
                          ) : (
                            <div className="text-sm text-slate-500">No plan items added yet.</div>
                          )}
                        </div>
                        <div className="mt-auto flex items-center gap-2">
                          <input
                            className="border border-slate-200 rounded-xl px-3 py-2 text-sm w-full bg-white/88"
                            placeholder="Add a plan item…"
                            value={planInput}
                            onChange={(e) => setPlanInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addPlanItem(); } }}
                          />
                          <button type="button" onClick={addPlanItem} className="px-2.5 py-1.5 rounded-xl text-sm text-white bg-[#FF7043] hover:bg-[#F4511E] shadow-sm transition">Add</button>
                        </div>
                      </div>
                    </SectionCard>
                  </div>

                  <div className="flex flex-col gap-3 h-full">
                    <SectionCard
                      title="Target Strategy"
                      helperText="Convert target companies into role direction and coaching plan"
                      className="min-h-[420px] flex-1"
                      bodyClassName="h-full flex flex-col"
                      action={
                        <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white/85 p-1 shadow-sm">
                          <button type="button" onClick={() => setStrategyView('input')} className={`rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition ${strategyView === 'input' ? 'bg-[rgba(255,112,67,0.14)] text-[#FF7043]' : 'text-slate-600 hover:text-slate-800'}`}>
                            Target Strategy
                          </button>
                          <button type="button" onClick={() => { if (strategyHasResults) setStrategyView('results'); }} disabled={!strategyHasResults} className={`rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition ${strategyView === 'results' ? 'bg-[rgba(255,112,67,0.14)] text-[#FF7043]' : 'text-slate-600 hover:text-slate-800'} disabled:opacity-45 disabled:cursor-not-allowed`}>
                            Results
                          </button>
                        </div>
                      }
                    >
                      <div className="flex-1 min-h-0">
                        {strategyView === 'input' ? (
                          <div className="h-full flex flex-col gap-3">
                            {/* Contextual help */}
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[12px] text-slate-600 leading-5">
                              {isFTUser ? (
                                <>
                                  <span className="font-semibold text-slate-700">ForgeTomorrow member</span> — we'll pull {client.name?.split(' ')[0]}'s profile summary, skills, and work preferences automatically. Just add their target companies and any coaching context below.
                                </>
                              ) : (
                                <>
                                  <span className="font-semibold text-slate-700">External client</span> — fill in their background on the{' '}
                                  <button type="button" onClick={() => setActiveTab('profile')} className="text-[#FF7043] font-semibold underline-offset-2 hover:underline">
                                    Profile tab
                                  </button>{' '}
                                  first. The more context you add, the sharper the strategy.
                                </>
                              )}
                            </div>
                            <textarea className="border border-slate-200 rounded-2xl px-3 py-2 w-full min-h-[104px] text-sm bg-white/88" placeholder="Paste target companies or categories..." value={form.targetCompanies || ''} onChange={onChange('targetCompanies')} />
                            <textarea className="border border-slate-200 rounded-2xl px-3 py-2 w-full min-h-[104px] text-sm bg-white/88" placeholder="Add quick background summary, strengths, or role clues..." value={form.strategyBackground || ''} onChange={onChange('strategyBackground')} />
                            {form.strategyError ? (
                              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">{form.strategyError}</div>
                            ) : null}
                            <div className="mt-auto flex justify-end">
                              <button
                                type="button"
                                onClick={handleGenerateStrategy}
                                disabled={generatingStrategy || !form.targetCompanies?.trim()}
                                className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-[#FF7043] hover:bg-[#F4511E] shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                {generatingStrategy ? 'Generating…' : 'Generate Strategy'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="h-full overflow-y-auto pr-1 space-y-3">
                            {!form.strategyBrief ? (
                              <div className="text-sm text-slate-500 py-4 text-center">No strategy generated yet. Switch to the input view to get started.</div>
                            ) : (
                              <>
                                {/* Themes — chips */}
                                {form.strategyBrief.themes?.length > 0 && (
                                  <div className="rounded-2xl border border-slate-200 bg-white/70 px-3 py-3">
                                    <div className="text-[10px] font-black tracking-[0.10em] text-slate-400 uppercase mb-2">Sector Alignment</div>
                                    <div className="flex flex-wrap gap-2">
                                      {form.strategyBrief.themes.map((t, i) => (
                                        <span key={i} className="inline-flex items-center rounded-xl border border-[rgba(255,112,67,0.30)] bg-[rgba(255,112,67,0.07)] px-2.5 py-1 text-[12px] font-medium text-[#993C1D]">{t}</span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Role Lanes — chips */}
                                {form.strategyBrief.roleLanes?.length > 0 && (
                                  <div className="rounded-2xl border border-slate-200 bg-white/70 px-3 py-3">
                                    <div className="text-[10px] font-black tracking-[0.10em] text-slate-400 uppercase mb-2">Role Lanes</div>
                                    <div className="flex flex-wrap gap-2">
                                      {form.strategyBrief.roleLanes.map((r, i) => (
                                        <span key={i} className="inline-flex items-center rounded-xl border border-slate-300 bg-slate-100 px-2.5 py-1 text-[12px] text-slate-700">{r}</span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Transferability + Gaps — side by side */}
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                                  {form.strategyBrief.transferabilitySignals?.length > 0 && (
                                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 px-3 py-3">
                                      <div className="text-[10px] font-black tracking-[0.10em] text-emerald-700 uppercase mb-2">What Carries Over</div>
                                      <ul className="space-y-1.5">
                                        {form.strategyBrief.transferabilitySignals.map((s, i) => (
                                          <li key={i} className="text-[12px] text-emerald-900 leading-5 flex gap-2">
                                            <span className="text-emerald-500 shrink-0 mt-0.5">✓</span>
                                            <span>{s}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {form.strategyBrief.narrativeGaps?.length > 0 && (
                                    <div className="rounded-2xl border border-amber-200 bg-amber-50/60 px-3 py-3">
                                      <div className="text-[10px] font-black tracking-[0.10em] text-amber-700 uppercase mb-2">Narrative Gaps</div>
                                      <ul className="space-y-1.5">
                                        {form.strategyBrief.narrativeGaps.map((g, i) => (
                                          <li key={i} className="text-[12px] text-amber-900 leading-5 flex gap-2">
                                            <span className="text-amber-500 shrink-0 mt-0.5">△</span>
                                            <span>{g}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>

                                {/* Stretch + Safe Harbor */}
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                                  {form.strategyBrief.stretchTargets?.length > 0 && (
                                    <div className="rounded-2xl border border-slate-200 bg-white/70 px-3 py-3">
                                      <div className="text-[10px] font-black tracking-[0.10em] text-slate-400 uppercase mb-2">Stretch Targets</div>
                                      <ul className="space-y-1.5">
                                        {form.strategyBrief.stretchTargets.map((t, i) => (
                                          <li key={i} className="text-[12px] text-slate-700 leading-5">↑ {t}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {form.strategyBrief.safeHarborTargets?.length > 0 && (
                                    <div className="rounded-2xl border border-slate-200 bg-white/70 px-3 py-3">
                                      <div className="text-[10px] font-black tracking-[0.10em] text-slate-400 uppercase mb-2">Safe Harbor Targets</div>
                                      <ul className="space-y-1.5">
                                        {form.strategyBrief.safeHarborTargets.map((t, i) => (
                                          <li key={i} className="text-[12px] text-slate-700 leading-5">→ {t}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>

                                {/* Next Step — strong block */}
                                {form.strategyBrief.nextStep && (
                                  <div className="rounded-2xl border border-[rgba(255,112,67,0.25)] bg-[rgba(255,112,67,0.06)] px-3 py-3">
                                    <div className="text-[10px] font-black tracking-[0.10em] text-[#FF7043] uppercase mb-1.5">Next Step</div>
                                    <div className="text-[13px] font-semibold text-slate-900 leading-5">{form.strategyBrief.nextStep}</div>
                                  </div>
                                )}

                                {/* Session Focus — strong block */}
                                {form.strategyBrief.sessionFocus && (
                                  <div className="rounded-2xl border border-slate-200 bg-[rgba(51,65,85,0.05)] px-3 py-3">
                                    <div className="text-[10px] font-black tracking-[0.10em] text-slate-500 uppercase mb-1.5">Session Focus</div>
                                    <div className="text-[13px] font-semibold text-slate-800 leading-5">{form.strategyBrief.sessionFocus}</div>
                                  </div>
                                )}

                                {/* Reasoning — separated */}
                                {form.strategyBrief.reasoning?.length > 0 && (
                                  <div className="rounded-2xl border border-slate-200 bg-white/60 px-3 py-3">
                                    <div className="text-[10px] font-black tracking-[0.10em] text-slate-400 uppercase mb-2">Why This Strategy</div>
                                    <ul className="space-y-2">
                                      {form.strategyBrief.reasoning.map((r, i) => (
                                        <li key={i} className="text-[12px] text-slate-600 leading-5 flex gap-2">
                                          <span className="text-slate-400 shrink-0 font-black">{i + 1}.</span>
                                          <span>{r}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Regenerate nudge */}
                                <div className="flex justify-end pt-1">
                                  <button type="button" onClick={() => setStrategyView('input')} className="text-[12px] font-semibold text-slate-500 hover:text-[#FF7043] transition">
                                    ← Edit inputs & regenerate
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </SectionCard>

                    <SectionCard title="Session History" helperText="Coaching timeline and recent sessions" className="min-h-[160px]" bodyClassName="h-full flex flex-col">
                      <div className="flex-1 min-h-0">
                        {sessions.length === 0 ? (
                          <div className="text-sm text-slate-500">
                            No sessions recorded yet.
                            <span className="block text-xs text-slate-400 mt-1">Once sessions are created, they will appear here.</span>
                          </div>
                        ) : (
                          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                            {sessions.map((s) => {
                              const sessionStatus =
                                s.status === 'Completed' ? { bg: '#E8F5E9', color: '#2E7D32' }
                                : s.status === 'Cancelled' ? { bg: '#FDECEA', color: '#C62828' }
                                : { bg: '#E3F2FD', color: '#1565C0' };
                              return (
                                <div key={s.id} className="border-b border-slate-100 last:border-0 pb-3">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <div className="font-semibold text-slate-900 break-words">{s.type || 'Session'}</div>
                                      <div className="text-slate-500 break-words text-sm">{fmtDateTime(s.startAt)} • {s.durationMin} min</div>
                                    </div>
                                    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', padding: '4px 8px', borderRadius: 999, background: sessionStatus.bg, color: sessionStatus.color, whiteSpace: 'nowrap' }}>
                                      {s.status}
                                    </span>
                                  </div>
                                  {(s.notes || s.followUpDueAt) ? (
                                    <div className="mt-2 text-sm text-slate-700 space-y-1">
                                      {s.notes ? <div>{s.notes}</div> : null}
                                      {s.followUpDueAt ? (
                                        <div className="text-xs text-slate-500">Follow-up: {s.followUpDone ? 'Done' : `Due ${fmtDate(s.followUpDueAt)}`}</div>
                                      ) : null}
                                    </div>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </SectionCard>
                  </div>

                  <div className="flex flex-col gap-3 h-full">
                    <SectionCard title="Coach Notes" helperText="Pinned context plus timestamped note log" className="min-h-[420px] flex-1" bodyClassName="h-full flex flex-col">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1.5">Pinned Context</label>
                          <textarea className="border border-slate-200 rounded-2xl px-3 py-2 w-full min-h-[120px] text-sm bg-white/88" placeholder="Pinned client context visible to you…" value={form.notes} onChange={onChange('notes')} />
                          <div className="mt-1 text-[11px] text-slate-400">This stays private to the coach workspace.</div>
                        </div>

                        <div className="border-t border-slate-100 pt-4">
                          <div className="text-sm font-semibold text-slate-900 mb-2">Add Note</div>
                          <div className="flex flex-col gap-2 mb-3">
                            <textarea className="border border-slate-200 rounded-2xl px-3 py-2 w-full min-h-[84px] text-sm bg-white/88" placeholder="Add a timestamped coaching note…" value={newNote} onChange={(e) => setNewNote(e.target.value)} />
                            <div className="flex justify-end">
                              <button type="button" onClick={handleAddNote} disabled={savingNote || !newNote.trim()} className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-[#FF7043] hover:bg-[#F4511E] shadow-sm transition disabled:opacity-50">
                                {savingNote ? 'Adding…' : 'Add Note'}
                              </button>
                            </div>
                          </div>

                          {notes.length > 0 ? (
                            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                              {notes.map((note) => (
                                <div key={note.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 flex gap-3">
                                  <div className="flex-1">
                                    <div className="text-sm text-slate-700 whitespace-pre-wrap">{note.body}</div>
                                    <div className="text-[11px] text-slate-400 mt-2">{fmtDateTime(note.createdAt)}</div>
                                  </div>
                                  <button type="button" onClick={() => handleDeleteNote(note.id)} className="text-slate-400 hover:text-slate-700 text-sm">✕</button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-slate-500">No note history yet.</div>
                          )}
                        </div>
                      </div>
                    </SectionCard>

                    <SectionCard title="Recent Coaching Activity" className="min-h-[160px]" bodyClassName="h-full flex flex-col">
                      {recentActivity.length === 0 ? (
                        <div className="text-sm text-slate-500">No recent coaching activity yet.</div>
                      ) : (
                        <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1">
                          {recentActivity.map((item, idx) => (
                            <div key={`${item.label}-${idx}`} className="text-sm">
                              <div className="font-semibold text-slate-900 break-words">{item.label}</div>
                              <div className="text-slate-500 break-words">{fmtDateTime(item.ts)}</div>
                              {item.detail ? <div className="text-slate-600 mt-1 break-words">{item.detail}</div> : null}
                            </div>
                          ))}
                        </div>
                      )}
                    </SectionCard>
                  </div>
                </div>
              ) : null}

              {/* ── Documents tab ── */}
              {activeTab === 'documents' ? (
                <SectionCard
                  title="Documents"
                  helperText="Resumes, plans, resources, and supporting materials"
                  action={
                    <button type="button" onClick={() => setShowDocForm((v) => !v)} className="rounded-xl border border-slate-200 bg-white/85 px-2.5 py-1.5 text-[13px] font-medium text-slate-700 shadow-sm hover:bg-white transition">
                      {showDocForm ? 'Cancel' : '+ Add Document'}
                    </button>
                  }
                >
                  {showDocForm ? (
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_180px_auto] gap-3 mb-4">
                      <input className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white/88" value={docTitle} onChange={(e) => setDocTitle(e.target.value)} placeholder="Document title" />
                      <input className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white/88" value={docUrl} onChange={(e) => setDocUrl(e.target.value)} placeholder="https://..." />
                      <select className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white/88" value={docType} onChange={(e) => setDocType(e.target.value)}>
                        <option value="Resume">Resume</option>
                        <option value="Cover">Cover Letter</option>
                        <option value="Notes">Notes</option>
                        <option value="Other">Other</option>
                      </select>
                      <button type="button" onClick={handleAddDoc} disabled={savingDoc || !docTitle.trim() || !docUrl.trim()} className="px-2.5 py-1.5 rounded-xl text-sm text-white bg-[#FF7043] hover:bg-[#F4511E] shadow-sm disabled:opacity-50 transition">
                        {savingDoc ? 'Adding…' : 'Add'}
                      </button>
                    </div>
                  ) : null}

                  {docs.length === 0 ? (
                    <div className="text-sm text-slate-500">No documents attached yet.</div>
                  ) : (
                    <div className="space-y-2">
                      {docs.map((doc) => (
                        <div key={doc.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                          <div className="w-9 h-9 rounded-lg bg-[rgba(255,112,67,0.10)] flex items-center justify-center text-base shrink-0">📄</div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-slate-900 truncate">{doc.title}</div>
                            <div className="text-xs text-slate-500 mt-1">{doc.type} • Added {fmtDate(doc.uploadedAt)}</div>
                          </div>
                          <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-[#FF7043] whitespace-nowrap">View →</a>
                          <button type="button" onClick={() => handleDeleteDoc(doc.id)} className="text-slate-400 hover:text-slate-700 text-sm">✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>
              ) : null}
            </div>
          </section>

          {/* ── Right rail ── */}
          <aside className="hidden xl:flex xl:flex-col gap-3 xl:col-[2/3] xl:row-[1/2]">
            <div className="min-h-[150px]">
              <RightRailPlacementManager slot="right_rail_1" />
            </div>
            <SectionCard title="Quick Snapshot">
              <div className="divide-y divide-slate-100">
                <MetaRow label="Current tab"  value={activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} />
                <MetaRow label="Status"       value={form.status} />
                <MetaRow label="Next session" value={form.nextSession ? fmtDateTime(form.nextSession) : '—'} />
                <MetaRow label="Documents"    value={docs.length} />
              </div>
            </SectionCard>
          </aside>
        </div>
      </div>
    </CoachingLayout>
  );
}