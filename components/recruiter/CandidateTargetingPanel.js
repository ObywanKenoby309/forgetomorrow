// components/recruiter/CandidateTargetingPanel.js
import { useState } from "react";

export default function CandidateTargetingPanel({
  filters,
  setFilters,
  automation,
  onFindCandidates,
  onClearTargeting,
  manualSearching,
  isLoading,
}) {
  const {
    summaryKeywords,
    jobTitle,
    workStatus,
    preferredWorkType,
    willingToRelocate,
    skills,
    languages,
    education,
  } = filters || {};

  const {
    setSummaryKeywords,
    setJobTitle,
    setWorkStatus,
    setPreferredWorkType,
    setWillingToRelocate,
    setSkills,
    setLanguages,
    setEducation,
  } = setFilters || {};

  const {
    enabled: automationEnabled,
    setEnabled: setAutomationEnabled,
    name: automationName,
    setName: setAutomationName,
    saving: automationSaving,
    message: automationMessage,
    onSave: onSaveAutomation,
  } = automation || {};

  const [targetingOpen, setTargetingOpen] = useState(false);

  const GlassPanel = ({ className = "", children }) => {
    return (
      <section
        className={
          "rounded-2xl border border-white/30 bg-white/70 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.10)] " +
          className
        }
      >
        {children}
      </section>
    );
  };

  return (
    <div className="mb-3">
      <GlassPanel className="px-3 py-2">
        <button
          type="button"
          onClick={() => setTargetingOpen((open) => !open)}
          className="flex w-full items-center justify-between rounded-xl border border-white/40 bg-white/60 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 shadow-sm hover:bg-white/70 focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
        >
          <span className="flex flex-col text-left">
            <span className="text-sm font-semibold text-slate-900">
              Targeting and automation
            </span>
            <span className="mt-0.5 text-[11px] font-normal text-slate-600">
              Profile-based filters
            </span>
          </span>

          <span className="ml-3 text-[11px] text-slate-500">
            {targetingOpen ? "Hide" : "Show options"}
          </span>
        </button>

        {targetingOpen && (
          <div className="mt-3">
            <GlassPanel className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Summary keywords
                  </label>
                  <input
                    type="text"
                    value={summaryKeywords || ""}
                    onChange={(e) => setSummaryKeywords?.(e.target.value)}
                    placeholder="e.g., customer success, onboarding, renewals"
                    className="w-full rounded-xl border border-white/40 bg-white/70 px-3 py-2 text-xs sm:text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Job title
                  </label>
                  <input
                    type="text"
                    value={jobTitle || ""}
                    onChange={(e) => setJobTitle?.(e.target.value)}
                    placeholder="e.g., Customer Success Manager"
                    className="w-full rounded-xl border border-white/40 bg-white/70 px-3 py-2 text-xs sm:text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Current work status
                  </label>
                  <select
                    value={workStatus || ""}
                    onChange={(e) => setWorkStatus?.(e.target.value)}
                    className="w-full rounded-xl border border-white/40 bg-white/70 px-3 py-2 text-xs sm:text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
                  >
                    <option value="">Any status</option>
                    <option value="employed">Employed</option>
                    <option value="unemployed">Actively looking</option>
                    <option value="student">Student</option>
                    <option value="contractor">Contractor / Freelance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Preferred work type
                  </label>
                  <select
                    value={preferredWorkType || ""}
                    onChange={(e) => setPreferredWorkType?.(e.target.value)}
                    className="w-full rounded-xl border border-white/40 bg-white/70 px-3 py-2 text-xs sm:text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
                  >
                    <option value="">Any type</option>
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                    <option value="temporary">Temporary</option>
                    <option value="remote-only">Remote only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Willing to relocate
                  </label>
                  <select
                    value={willingToRelocate || ""}
                    onChange={(e) => setWillingToRelocate?.(e.target.value)}
                    className="w-full rounded-xl border border-white/40 bg-white/70 px-3 py-2 text-xs sm:text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
                  >
                    <option value="">Any</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                    <option value="maybe">Maybe</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Skills (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={skills || ""}
                    onChange={(e) => setSkills?.(e.target.value)}
                    placeholder="e.g., Salesforce, SQL, Zendesk"
                    className="w-full rounded-xl border border-white/40 bg-white/70 px-3 py-2 text-xs sm:text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Education (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={education || ""}
                    onChange={(e) => setEducation?.(e.target.value)}
                    placeholder="e.g., Bachelor, Computer Science, MBA, BSN"
                    className="w-full rounded-xl border border-white/40 bg-white/70 px-3 py-2 text-xs sm:text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Languages (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={languages || ""}
                    onChange={(e) => setLanguages?.(e.target.value)}
                    placeholder="e.g., English, Spanish, French"
                    className="w-full rounded-xl border border-white/40 bg-white/70 px-3 py-2 text-xs sm:text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
                  />
                </div>
              </div>

              <div className="mt-4 border-t border-white/40 pt-3 flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div className="flex flex-col gap-2">
                  <div className="flex items-start gap-2">
                    <input
                      id="automationEnabled"
                      type="checkbox"
                      checked={Boolean(automationEnabled)}
                      onChange={(e) => setAutomationEnabled?.(e.target.checked)}
                      className="mt-0.5 h-3 w-3 rounded border-slate-400 text-[#FF7043] focus:ring-[#FF7043]"
                    />
                    <label
                      htmlFor="automationEnabled"
                      className="text-xs text-slate-700"
                    >
                      Enable daily candidate feed using these filters
                    </label>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Automation name (optional)
                    </label>
                    <input
                      type="text"
                      value={automationName || ""}
                      onChange={(e) => setAutomationName?.(e.target.value)}
                      placeholder="e.g., Senior CSM - US remote"
                      className="w-full rounded-xl border border-white/40 bg-white/70 px-3 py-2 text-xs sm:text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
                    />
                  </div>

                  <div className="text-[11px] text-slate-500">
                    Find Candidates runs these targeting settings on demand.
                  </div>
                </div>

                <div className="flex items-center gap-2 md:justify-end">
                  <button
                    type="button"
                    onClick={onFindCandidates}
                    disabled={manualSearching || isLoading}
                    className="rounded-xl border border-[#FF7043] bg-white/70 px-3 py-2 text-xs sm:text-sm font-medium text-[#FF7043] shadow-sm hover:bg-[#FFF3EF] disabled:opacity-60"
                  >
                    {manualSearching ? "Finding..." : "Find Candidates"}
                  </button>

                  <button
                    type="button"
                    onClick={onClearTargeting}
                    className="rounded-xl border border-white/40 bg-white/60 px-3 py-2 text-xs sm:text-sm text-slate-700 shadow-sm hover:bg-white/70"
                  >
                    Clear targeting
                  </button>

                  <button
                    type="button"
                    onClick={onSaveAutomation}
                    disabled={automationSaving}
                    className="rounded-xl bg-[#FF7043] px-3 py-2 text-xs sm:text-sm font-medium text-white shadow-sm hover:bg-[#f45c28] disabled:opacity-60"
                  >
                    {automationSaving ? "Saving..." : "Save automation"}
                  </button>
                </div>
              </div>

              {automationMessage && (
                <p className="mt-2 text-[11px] text-slate-600">
                  {automationMessage}
                </p>
              )}

              <p className="mt-3 text-[11px] text-slate-500">
                ForgeTomorrow never filters candidates by name, hobbies or
                interests, previous employers, birthdays or age, or pronouns.
                Those details may appear in a profile but are not used for search
                or automation.
              </p>
            </GlassPanel>
          </div>
        )}
      </GlassPanel>
    </div>
  );
}
