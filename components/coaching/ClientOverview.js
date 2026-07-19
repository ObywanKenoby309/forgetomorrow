// components/coaching/ClientOverview.js

import React from 'react';
import { useRouter } from 'next/router';
import { profileWallpapers } from '@/lib/profileWallpapers';
import { MetaRow, SectionCard } from '@/components/coaching/clients/ClientProfilePrimitives';
import { useClientProfile, useClientWorkspaceProfile } from '@/hooks/useClientProfile';
import { avatarColor, initials, fmtDateTime, toStringArray, toEducationObjects, getExperienceList, STATUS, defaultStatus } from '@/lib/coaching/clientProfileHelpers';

function resolveProfileWallpaperSrc(source = {}) {
  const directCandidates = [
    source.wallpaperUrl,
    source.profileWallpaperUrl,
    source.profileWallpaperSrc,
    source.wallpaperSrc,
    source.wallpaperImage,
    source.backgroundUrl,
    source.backgroundImage,
    source.coverWallpaperUrl,
    source.portfolioWallpaperUrl,
    source.selectedWallpaperUrl,
    source.wallpaper?.src,
    source.wallpaper?.url,
    source.profileWallpaper?.src,
    source.profileWallpaper?.url,
    source.background?.src,
    source.background?.url,
  ];

  for (const value of directCandidates) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }

  const wallpaperKeyCandidates = [
    source.wallpaperKey,
    source.profileWallpaperKey,
    source.selectedWallpaperKey,
    source.backgroundKey,
    source.wallpaper,
    source.profileWallpaper,
  ];

  for (const value of wallpaperKeyCandidates) {
    if (typeof value !== 'string' || !value.trim()) continue;
    const trimmed = value.trim();
    if (trimmed.startsWith('/') || trimmed.startsWith('http')) return trimmed;
    const found = profileWallpapers.find((item) => item.key === trimmed);
    if (found?.src) return found.src;
  }

  return '';
}

export default function ClientOverview({ client: selectedClient }) {
  const router = useRouter();

const {
  client,
  profileData,
  form,
  loading,
  error,
  sessions,
  notes,
  docs,
  avatarUrl,
  onChange,
} = useClientWorkspaceProfile(selectedClient);
  
  const [profileSubTab, setProfileSubTab] = React.useState("overview");
  const [isMobile, setIsMobile] = React.useState(false);
  
  React.useEffect(() => {
  const check = () => setIsMobile(window.innerWidth < 768);
  check();
  window.addEventListener("resize", check);
  return () => window.removeEventListener("resize", check);
}, []);

React.useEffect(() => {
  setProfileSubTab("overview");
}, [client?.id]);

if (loading) {
  return <div>Loading client...</div>;
}

if (error || !client || !form) {
  return <div>Client not found.</div>;
}

// ── Derived render values ──────────────────────────────────────────────────
  const source = { ...(client || {}), ...(profileData || {}) };
  const isFTUser = Boolean(profileData);
  const profileWallpaperSrc = isFTUser ? resolveProfileWallpaperSrc(source) : '';
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

  const certificationsList = isFTUser && Array.isArray(source.certifications) ? source.certifications : [];
  const projectsList = isFTUser && Array.isArray(source.projects) ? source.projects : [];

  const profileSubTabs = [
    { id: 'overview',         label: 'Overview' },
    { id: 'experience',       label: 'Experience' },
    { id: 'education',        label: 'Education' },
    { id: 'skills',           label: 'Skills' },
    { id: 'preferences',      label: 'Preferences' },
  ];

  return (
                <div className="space-y-3">
                  <div className="flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none]">
                    {profileSubTabs.map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setProfileSubTab(tab.id)}
                        className={`shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-black transition ${
                          profileSubTab === tab.id
                            ? 'border-[#FF7043] bg-[#FF7043] text-white shadow-sm'
                            : 'border-slate-200 bg-white/85 text-slate-700 hover:bg-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-center gap-1.5 -mt-1 pb-1" aria-label="Profile section position">
                    {profileSubTabs.map((tab) => (
                      <button
                        key={`dot-${tab.id}`}
                        type="button"
                        onClick={() => setProfileSubTab(tab.id)}
                        className={`h-1.5 rounded-full border-0 p-0 transition-all ${
                          profileSubTab === tab.id
                            ? 'w-5 bg-[#FF7043]'
                            : 'w-1.5 bg-slate-300/75'
                        }`}
                        aria-label={`Go to ${tab.label}`}
                      />
                    ))}
                  </div>

                  {profileSubTab === 'overview' ? (
					<>
					  <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-3">
						<div className="space-y-3">
                        {isMobile ? (
                          <div
                            className="relative overflow-hidden rounded-[20px] border border-white/45 shadow-[0_16px_34px_rgba(15,23,42,0.22)]"
                            style={{
                              minHeight: 380,
                              backgroundImage: profileWallpaperSrc
                                ? `linear-gradient(180deg, rgba(2,6,23,0.18), rgba(2,6,23,0.48)), url("${profileWallpaperSrc}")`
                                : 'linear-gradient(135deg, rgba(15,23,42,0.98), rgba(30,41,59,0.94))',
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                            }}
                          >
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,112,67,0.18),transparent_42%)]" />
                            <div className="absolute inset-x-0 bottom-0 h-[48%] bg-gradient-to-t from-slate-950/70 via-slate-950/24 to-transparent" />
                            <div className="relative z-[1] flex min-h-[380px] flex-col items-center justify-end gap-2 px-3 pb-3 pt-7 text-center">
                              <div
                                style={{
                                  width: 74, height: 74, borderRadius: '999px',
                                  background: avatarUrl ? 'rgba(15,23,42,0.45)' : `linear-gradient(135deg, ${avatarBg}, ${avatarDark})`,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  color: 'white', fontWeight: 900, fontSize: 25,
                                  boxShadow: '0 14px 34px rgba(2,6,23,0.42)',
                                  outline: '3px solid rgba(255,255,255,0.70)', outlineOffset: 3, overflow: 'hidden',
                                }}
                              >
                                {avatarUrl ? (
                                  <img src={avatarUrl} alt={client.name || 'Client avatar'} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                ) : (
                                  initials(client.name)
                                )}
                              </div>
                              <div className="w-full px-2 text-white [text-shadow:_0_2px_8px_rgba(2,6,23,0.90)]">
                                <div className="text-[17px] font-black tracking-tight leading-tight">{client.name}</div>
                                <div className="mt-1 text-[12px] font-bold text-white/90 break-words">{client.email || 'No email on file'}</div>
                              </div>
                              <div className="flex flex-wrap items-center justify-center gap-2">
                                <span className="rounded-full border border-white/35 bg-white/92 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide shadow-sm" style={{ color: cfg.color }}>{form.status}</span>
                                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide shadow-sm ${isFTUser ? 'border-orange-200/60 bg-orange-500/82 text-white' : 'border-white/30 bg-slate-950/42 text-white/92 backdrop-blur-sm'}`}>{isFTUser ? 'ForgeTomorrow User' : 'External Client'}</span>
                              </div>
                              <div className="grid w-full grid-cols-1 gap-2 pt-1">
                                <button type="button" onClick={() => router.push('/dashboard/coaching/sessions')} className="rounded-xl border border-white/60 bg-white/90 backdrop-blur-sm px-2.5 py-1.5 text-[13px] font-black text-black shadow-[0_8px_18px_rgba(2,6,23,0.18)] hover:bg-white transition">View Sessions</button>
                                <button type="button" onClick={() => router.push('/coaching/messaging')} className="rounded-xl border border-white/60 bg-white/90 backdrop-blur-sm px-2.5 py-1.5 text-[13px] font-black text-black shadow-[0_8px_18px_rgba(2,6,23,0.18)] hover:bg-white transition">Message</button>
                                {profileHref ? (
                                  <button type="button" onClick={openProfile} className="rounded-xl border border-white/60 bg-white/90 backdrop-blur-sm px-2.5 py-1.5 text-[13px] font-black text-black shadow-[0_8px_18px_rgba(2,6,23,0.18)] hover:bg-white transition">View Profile</button>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        ) : (
                        <SectionCard title="Client Snapshot">
                          <div
                            className="relative overflow-hidden rounded-[20px] border border-white/45 shadow-[0_16px_34px_rgba(15,23,42,0.22)]"
                            style={{
                              minHeight: 326,
                              backgroundImage: profileWallpaperSrc
                                ? `linear-gradient(180deg, rgba(2,6,23,0.18), rgba(2,6,23,0.48)), url("${profileWallpaperSrc}")`
                                : 'linear-gradient(135deg, rgba(15,23,42,0.98), rgba(30,41,59,0.94))',
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                            }}
                          >
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,112,67,0.18),transparent_42%)]" />
                            <div className="absolute inset-x-0 bottom-0 h-[48%] bg-gradient-to-t from-slate-950/70 via-slate-950/24 to-transparent" />

                            <div className="relative z-[1] flex min-h-[326px] flex-col items-center justify-end gap-2 px-3 pb-3 pt-7 text-center">
                              <div
                                style={{
                                  width: 74, height: 74, borderRadius: '999px',
                                  background: avatarUrl ? 'rgba(15,23,42,0.45)' : `linear-gradient(135deg, ${avatarBg}, ${avatarDark})`,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  color: 'white', fontWeight: 900, fontSize: 25,
                                  boxShadow: '0 14px 34px rgba(2,6,23,0.42)',
                                  outline: '3px solid rgba(255,255,255,0.70)', outlineOffset: 3, overflow: 'hidden',
                                }}
                              >
                                {avatarUrl ? (
                                  <img src={avatarUrl} alt={client.name || 'Client avatar'} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                ) : (
                                  initials(client.name)
                                )}
                              </div>

                              <div className="w-full px-2 text-white [text-shadow:_0_2px_8px_rgba(2,6,23,0.90)]">
                                <div className="text-[17px] font-black tracking-tight leading-tight">{client.name}</div>
                                <div className="mt-1 text-[12px] font-bold text-white/90 break-words">{client.email || 'No email on file'}</div>
                              </div>

                              <div className="flex flex-wrap items-center justify-center gap-2">
                                <span
                                  className="rounded-full border border-white/35 bg-white/92 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide shadow-sm"
                                  style={{ color: cfg.color }}
                                >
                                  {form.status}
                                </span>
                                <span
                                  className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide shadow-sm ${
                                    isFTUser
                                      ? 'border-orange-200/60 bg-orange-500/82 text-white'
                                      : 'border-white/30 bg-slate-950/42 text-white/92 backdrop-blur-sm'
                                  }`}
                                >
                                  {isFTUser ? 'ForgeTomorrow User' : 'External Client'}
                                </span>
                              </div>

                              <div className="grid w-full grid-cols-1 gap-2 pt-1">
                                <button type="button" onClick={() => router.push('/dashboard/coaching/sessions')} className="rounded-xl border border-white/60 bg-white/90 backdrop-blur-sm px-2.5 py-1.5 text-[13px] font-black text-black shadow-[0_8px_18px_rgba(2,6,23,0.18)] hover:bg-white transition">
                                  View Sessions
                                </button>
                                <button type="button" onClick={() => router.push('/coaching/messaging')} className="rounded-xl border border-white/60 bg-white/90 backdrop-blur-sm px-2.5 py-1.5 text-[13px] font-black text-black shadow-[0_8px_18px_rgba(2,6,23,0.18)] hover:bg-white transition">
                                  Message
                                </button>
                                {profileHref ? (
                                  <button type="button" onClick={openProfile} className="rounded-xl border border-white/60 bg-white/90 backdrop-blur-sm px-2.5 py-1.5 text-[13px] font-black text-black shadow-[0_8px_18px_rgba(2,6,23,0.18)] hover:bg-white transition">
                                    View Profile
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </SectionCard>
                        )}
                      </div>

                      <div className="space-y-3">
                        <SectionCard title="Summary">
                          {isFTUser ? (
                            summaryText ? (
                              <div className="text-[13px] leading-6 text-slate-700 whitespace-pre-line max-h-[260px] overflow-y-auto pr-1">{summaryText}</div>
                            ) : (
                              <div className="text-sm text-slate-500">No profile summary available yet.</div>
                            )
                          ) : (
                            <textarea className="border border-slate-200 rounded-2xl px-3 py-2 w-full min-h-[150px] text-sm bg-white/88" placeholder="Enter client summary..." value={form.manualSummary || ''} onChange={onChange('manualSummary')} />
                          )}
                        </SectionCard>
                      </div>
                    </div>
					
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-3">
  <SectionCard title="Career Snapshot">
    Placeholder
  </SectionCard>

  <SectionCard title="Coaching Snapshot">
    Placeholder
  </SectionCard>

  <SectionCard title="Progress Snapshot">
    Placeholder
  </SectionCard>
</div>
</>
                  ) : null}

                  {profileSubTab === 'experience' ? (
                    <div className="space-y-3">
                      <SectionCard title="Experience">
                        {isFTUser ? (
                          experienceList.length > 0 ? (
                            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                              {experienceList.map((exp, idx) => (
                                <div key={`${exp.title}-${idx}`} className="border-b border-slate-100 last:border-0 pb-3">
                                  <div className="font-semibold text-slate-900 break-words">
                                    {[exp.title, exp.company].filter(Boolean).join(' — ') || 'Experience'}
                                  </div>
                                  {exp.range ? <div className="text-xs text-slate-500 mt-1">{exp.range}</div> : null}
                                  {exp.highlights?.length ? (
                                    <ul className="mt-2 space-y-1">
                                      {exp.highlights.slice(0, 5).map((item, itemIdx) => (
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
                          <textarea className="border border-slate-200 rounded-2xl px-3 py-2 w-full min-h-[220px] text-sm bg-white/88" placeholder="Enter experience manually..." value={form.manualExperience || ''} onChange={onChange('manualExperience')} />
                        )}
                      </SectionCard>

                      {isFTUser && projectsList.length > 0 ? (
                        <SectionCard title="Projects">
                          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                            {projectsList.map((proj) => {
                              const years = [proj.startYear, proj.endYear].filter(Boolean).join(' – ');
                              return (
                                <div key={proj.id} className="border-b border-slate-100 last:border-0 pb-3">
                                  <div className="font-semibold text-slate-900 break-words">{proj.name}</div>
                                  {(proj.organization || years) ? (
                                    <div className="text-xs text-slate-500 mt-1">{[proj.organization, years].filter(Boolean).join(' • ')}</div>
                                  ) : null}
                                  {proj.notes ? <div className="text-sm text-slate-600 mt-1 break-words whitespace-pre-line">{proj.notes}</div> : null}
                                  {proj.url ? <a href={proj.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#FF7043] font-semibold mt-1 inline-block break-all">{proj.url}</a> : null}
                                </div>
                              );
                            })}
                          </div>
                        </SectionCard>
                      ) : null}
                    </div>
                  ) : null}

                  {profileSubTab === 'education' ? (
                    <div className="space-y-3">
                      <SectionCard title="Education">
                        {isFTUser ? (
                          educationList.length > 0 ? (
                            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
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
                          <textarea className="border border-slate-200 rounded-2xl px-3 py-2 w-full min-h-[220px] text-sm bg-white/88" placeholder="Enter education manually..." value={form.manualEducation || ''} onChange={onChange('manualEducation')} />
                        )}
                      </SectionCard>

                      {isFTUser && certificationsList.length > 0 ? (
                        <SectionCard title="Certifications">
                          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                            {certificationsList.map((cert) => (
                              <div key={cert.id} className="border-b border-slate-100 last:border-0 pb-3">
                                <div className="font-semibold text-slate-900 break-words">{cert.name}</div>
                                {(cert.issuer || cert.year) ? (
                                  <div className="text-xs text-slate-500 mt-1">{[cert.issuer, cert.year].filter(Boolean).join(' • ')}</div>
                                ) : null}
                                {cert.notes ? <div className="text-sm text-slate-600 mt-1 break-words whitespace-pre-line">{cert.notes}</div> : null}
                              </div>
                            ))}
                          </div>
                        </SectionCard>
                      ) : null}
                    </div>
                  ) : null}

                  {profileSubTab === 'skills' ? (
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
                  ) : null}

                  {profileSubTab === 'preferences' ? (
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
                  ) : null}
                </div>
  );
}
