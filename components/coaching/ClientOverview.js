// components/coaching/ClientOverview.js

import React from "react";
import { useRouter } from "next/router";
import {
  MetaRow,
  SectionCard,
} from "@/components/coaching/clients/ClientProfilePrimitives";
import {
  initials,
  fmtDateTime,
} from "@/lib/coaching/clientProfileHelpers";

export default function ClientOverview({
  client,
  form,
  profileSubTabs,
  profileSubTab,
  setProfileSubTab,
  isMobile,
  profileWallpaperSrc,
  avatarUrl,
  avatarBg,
  avatarDark,
  cfg,
  isFTUser,
  profileHref,
  sessions,
  notes,
  docs,
  summaryText,
  onChange,
  experienceList,
  projectsList,
  educationList,
  certificationsList,
  skillsList,
  hasWorkPrefs,
  workStatus,
  preferredWorkType,
  willingToRelocate,
  preferredLocations,
  onViewSessions,
  onMessage,
  onOpenProfile,
}) {
  const router = useRouter();

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
                                <button type="button" onClick={onViewSessions} className="rounded-xl border border-white/60 bg-white/90 backdrop-blur-sm px-2.5 py-1.5 text-[13px] font-black text-black shadow-[0_8px_18px_rgba(2,6,23,0.18)] hover:bg-white transition">View Sessions</button>
                                <button type="button" onClick={onMessage} className="rounded-xl border border-white/60 bg-white/90 backdrop-blur-sm px-2.5 py-1.5 text-[13px] font-black text-black shadow-[0_8px_18px_rgba(2,6,23,0.18)] hover:bg-white transition">Message</button>
                                {profileHref ? (
                                  <button type="button" onClick={onOpenProfile} className="rounded-xl border border-white/60 bg-white/90 backdrop-blur-sm px-2.5 py-1.5 text-[13px] font-black text-black shadow-[0_8px_18px_rgba(2,6,23,0.18)] hover:bg-white transition">View Profile</button>
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
