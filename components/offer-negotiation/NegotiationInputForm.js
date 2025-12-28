// components/offer-negotiation/NegotiationInputForm.js

import React, { useState } from 'react';

const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship', 'Other'];
const industries = ['Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing', 'Other'];

const priorityOptions = [
  { value: '', label: 'Select priority' },
  { value: 'base_salary', label: 'Base salary' },
  { value: 'total_comp', label: 'Total compensation' },
  { value: 'equity', label: 'Equity' },
  { value: 'sign_on', label: 'Sign-on bonus' },
  { value: 'bonus', label: 'Annual bonus' },
  { value: 'remote_flex', label: 'Remote work / flexibility' },
  { value: 'title_level', label: 'Title / level' },
  { value: 'growth', label: 'Growth / mentorship' },
  { value: 'benefits', label: 'Benefits (health, PTO, etc.)' },
  { value: 'start_date', label: 'Start date' },
  { value: 'schedule', label: 'Schedule (hours, on-call, shifts)' },
  { value: 'stability', label: 'Stability / risk profile' },
];

export default function NegotiationInputForm({ onSubmit }) {
  const [form, setForm] = useState({
    // Core
    jobDescription: '',
    currentJobTitle: '',
    currentSalary: '',
    isNewJob: 'yes',
    location: '',
    targetSalaryMin: '',
    targetSalaryMax: '',
    desiredBenefits: '',
    jobType: '',
    industry: '',

    // Evidence / signal
    skillsCertsExperience: '',
    yearsRelevantExperience: '',
    portfolioLinks: '',
    notableProjectsEvidence: '',

    // Offer snapshot (if there is an offer)
    hasOffer: 'no', // yes/no
    offerCompany: '',
    offerRoleTitle: '',
    offerBaseSalary: '',
    offerBonus: '',
    offerSignOn: '',
    offerEquity: '',
    offerBenefitsNotes: '',
    offerDeadline: '',
    offerWorkMode: '', // on-site / hybrid / remote
    offerOtherComp: '',

    // Leverage / alternatives
    competingOffers: 'no', // yes/no
    competingOffersCount: '',
    bestAlternativeNotes: '',

    // Preferences / constraints
    preferredWorkMode: '', // on-site / hybrid / remote
    willingnessToRelocate: 'no', // yes/no
    mustHaves: '',
    dealBreakers: '',
    topPriority: '',
    secondPriority: '',
    thirdPriority: '',
    desiredStartDate: '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.jobDescription.trim()) newErrors.jobDescription = 'Job description/title is required';
    if (!form.currentJobTitle.trim()) newErrors.currentJobTitle = 'Current job title is required';
    if (!form.currentSalary || Number(form.currentSalary) <= 0)
      newErrors.currentSalary = 'Current salary must be a positive number';
    if (!form.location.trim()) newErrors.location = 'Location is required';
    if (!form.isNewJob) newErrors.isNewJob = 'Please select if this is a new job or current job';
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    onSubmit(form);
  };

  const showOfferFields = String(form.hasOffer || '').toLowerCase() === 'yes';
  const showCompetingFields = String(form.competingOffers || '').toLowerCase() === 'yes';

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-3xl mx-auto bg-white p-6 md:p-7 rounded-lg shadow space-y-5"
    >
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-[#FF7043]">Negotiation Input Form</h2>
        <p className="text-sm text-gray-600 mt-1">
          Add details that help us judge role-fit, leverage, and market alignment.
        </p>
      </div>

      {/* CORE */}
      <div className="border border-gray-200 rounded-lg p-4 md:p-5 space-y-4">
        <div className="font-semibold text-gray-900">Core details</div>

        {/* Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="jobDescription" className="block font-semibold mb-1">
              Job Description or Target Role <span className="text-red-600">*</span>
            </label>
            <textarea
              id="jobDescription"
              name="jobDescription"
              value={form.jobDescription}
              onChange={handleChange}
              rows="3"
              className={`w-full border rounded px-3 py-2 ${
                errors.jobDescription ? 'border-red-600' : 'border-gray-300'
              }`}
              placeholder="Paste the job description or describe the role you want"
            />
            {errors.jobDescription && (
              <p className="text-red-600 text-sm mt-1">{errors.jobDescription}</p>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="currentJobTitle" className="block font-semibold mb-1">
                Current Job Title <span className="text-red-600">*</span>
              </label>
              <input
                id="currentJobTitle"
                name="currentJobTitle"
                type="text"
                value={form.currentJobTitle}
                onChange={handleChange}
                className={`w-full border rounded px-3 py-2 ${
                  errors.currentJobTitle ? 'border-red-600' : 'border-gray-300'
                }`}
              />
              {errors.currentJobTitle && (
                <p className="text-red-600 text-sm mt-1">{errors.currentJobTitle}</p>
              )}
            </div>

            <div>
              <label htmlFor="location" className="block font-semibold mb-1">
                Location <span className="text-red-600">*</span>
              </label>
              <input
                id="location"
                name="location"
                type="text"
                value={form.location}
                onChange={handleChange}
                placeholder="City, State or Region"
                className={`w-full border rounded px-3 py-2 ${
                  errors.location ? 'border-red-600' : 'border-gray-300'
                }`}
              />
              {errors.location && <p className="text-red-600 text-sm mt-1">{errors.location}</p>}
            </div>
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold mb-1">
              Is this a new job or current job? <span className="text-red-600">*</span>
            </label>
            <div
              className={`border rounded px-3 py-2 ${
                errors.isNewJob ? 'border-red-600' : 'border-gray-300'
              }`}
            >
              <div className="flex items-center gap-5">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="isNewJob"
                    value="yes"
                    checked={form.isNewJob === 'yes'}
                    onChange={handleChange}
                  />
                  <span>New Job</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="isNewJob"
                    value="no"
                    checked={form.isNewJob === 'no'}
                    onChange={handleChange}
                  />
                  <span>Current Job</span>
                </label>
              </div>
            </div>
            {errors.isNewJob && <p className="text-red-600 text-sm mt-1">{errors.isNewJob}</p>}
          </div>

          <div>
            <label htmlFor="currentSalary" className="block font-semibold mb-1">
              Current Salary ($) <span className="text-red-600">*</span>
            </label>
            <input
              id="currentSalary"
              name="currentSalary"
              type="number"
              min="0"
              value={form.currentSalary}
              onChange={handleChange}
              className={`w-full border rounded px-3 py-2 ${
                errors.currentSalary ? 'border-red-600' : 'border-gray-300'
              }`}
            />
            {errors.currentSalary && (
              <p className="text-red-600 text-sm mt-1">{errors.currentSalary}</p>
            )}
          </div>
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold mb-1">Target Salary Range (optional)</label>
            <div className="grid grid-cols-2 gap-3">
              <input
                name="targetSalaryMin"
                type="number"
                min="0"
                value={form.targetSalaryMin}
                onChange={handleChange}
                placeholder="Min"
                className="w-full border rounded px-3 py-2 border-gray-300"
              />
              <input
                name="targetSalaryMax"
                type="number"
                min="0"
                value={form.targetSalaryMax}
                onChange={handleChange}
                placeholder="Max"
                className="w-full border rounded px-3 py-2 border-gray-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label htmlFor="jobType" className="block font-semibold mb-1">
                Job Type (optional)
              </label>
              <select
                id="jobType"
                name="jobType"
                value={form.jobType}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 border-gray-300"
              >
                <option value="">Select job type</option>
                {jobTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="industry" className="block font-semibold mb-1">
                Industry/Sector (optional)
              </label>
              <select
                id="industry"
                name="industry"
                value={form.industry}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 border-gray-300"
              >
                <option value="">Select industry</option>
                {industries.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* EVIDENCE */}
      <div className="border border-gray-200 rounded-lg p-4 md:p-5 space-y-4">
        <div className="font-semibold text-gray-900">Evidence (skills and proof)</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="yearsRelevantExperience" className="block font-semibold mb-1">
              Years of relevant experience (optional)
            </label>
            <input
              id="yearsRelevantExperience"
              name="yearsRelevantExperience"
              type="number"
              min="0"
              value={form.yearsRelevantExperience}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 border-gray-300"
              placeholder="Example: 0, 1, 2, 5"
            />
          </div>

          <div>
            <label htmlFor="portfolioLinks" className="block font-semibold mb-1">
              Portfolio links (optional)
            </label>
            <input
              id="portfolioLinks"
              name="portfolioLinks"
              type="text"
              value={form.portfolioLinks}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 border-gray-300"
              placeholder="GitHub, website, LinkedIn projects, etc."
            />
          </div>
        </div>

        <div>
          <label htmlFor="skillsCertsExperience" className="block font-semibold mb-1">
            Skills, certifications, or experience relevant to the role (optional)
          </label>
          <textarea
            id="skillsCertsExperience"
            name="skillsCertsExperience"
            rows="3"
            value={form.skillsCertsExperience}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 border-gray-300"
            placeholder="Example: Next.js, React, SQL, AWS cert, bootcamp, degree, internships, freelance work, etc."
          />
        </div>

        <div>
          <label htmlFor="notableProjectsEvidence" className="block font-semibold mb-1">
            Notable projects or proof of impact (optional)
          </label>
          <textarea
            id="notableProjectsEvidence"
            name="notableProjectsEvidence"
            rows="3"
            value={form.notableProjectsEvidence}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 border-gray-300"
            placeholder="Describe 1-3 projects with outcomes. Example: Built X, deployed to Y, improved Z, users served, revenue impact, performance gains, etc."
          />
        </div>
      </div>

      {/* OFFER SNAPSHOT */}
      <div className="border border-gray-200 rounded-lg p-4 md:p-5 space-y-4">
        <div className="font-semibold text-gray-900">Offer snapshot (if you have one)</div>

        <div>
          <label className="block font-semibold mb-1">Do you already have an offer?</label>
          <div className="border rounded px-3 py-2 border-gray-300">
            <div className="flex items-center gap-5">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="hasOffer"
                  value="yes"
                  checked={form.hasOffer === 'yes'}
                  onChange={handleChange}
                />
                <span>Yes</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="hasOffer"
                  value="no"
                  checked={form.hasOffer === 'no'}
                  onChange={handleChange}
                />
                <span>No</span>
              </label>
            </div>
          </div>
        </div>

        {showOfferFields && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="offerCompany" className="block font-semibold mb-1">
                  Company (optional)
                </label>
                <input
                  id="offerCompany"
                  name="offerCompany"
                  type="text"
                  value={form.offerCompany}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2 border-gray-300"
                />
              </div>

              <div>
                <label htmlFor="offerRoleTitle" className="block font-semibold mb-1">
                  Offered role title (optional)
                </label>
                <input
                  id="offerRoleTitle"
                  name="offerRoleTitle"
                  type="text"
                  value={form.offerRoleTitle}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2 border-gray-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="offerBaseSalary" className="block font-semibold mb-1">
                  Offer base salary (optional)
                </label>
                <input
                  id="offerBaseSalary"
                  name="offerBaseSalary"
                  type="number"
                  min="0"
                  value={form.offerBaseSalary}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2 border-gray-300"
                />
              </div>

              <div>
                <label htmlFor="offerBonus" className="block font-semibold mb-1">
                  Offer annual bonus (optional)
                </label>
                <input
                  id="offerBonus"
                  name="offerBonus"
                  type="text"
                  value={form.offerBonus}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2 border-gray-300"
                  placeholder="Example: 10% or 5000"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="offerSignOn" className="block font-semibold mb-1">
                  Offer sign-on bonus (optional)
                </label>
                <input
                  id="offerSignOn"
                  name="offerSignOn"
                  type="number"
                  min="0"
                  value={form.offerSignOn}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2 border-gray-300"
                />
              </div>

              <div>
                <label htmlFor="offerEquity" className="block font-semibold mb-1">
                  Offer equity (optional)
                </label>
                <input
                  id="offerEquity"
                  name="offerEquity"
                  type="text"
                  value={form.offerEquity}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2 border-gray-300"
                  placeholder="Example: 0.05%, 10k RSUs, options, etc."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="offerWorkMode" className="block font-semibold mb-1">
                  Offer work mode (optional)
                </label>
                <select
                  id="offerWorkMode"
                  name="offerWorkMode"
                  value={form.offerWorkMode}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2 border-gray-300"
                >
                  <option value="">Select work mode</option>
                  <option value="on-site">On-site</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="remote">Remote</option>
                </select>
              </div>

              <div>
                <label htmlFor="offerDeadline" className="block font-semibold mb-1">
                  Offer deadline (optional)
                </label>
                <input
                  id="offerDeadline"
                  name="offerDeadline"
                  type="text"
                  value={form.offerDeadline}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2 border-gray-300"
                  placeholder="Example: 2026-01-15 or Friday EOD"
                />
              </div>
            </div>

            <div>
              <label htmlFor="offerBenefitsNotes" className="block font-semibold mb-1">
                Offer benefits notes (optional)
              </label>
              <textarea
                id="offerBenefitsNotes"
                name="offerBenefitsNotes"
                rows="2"
                value={form.offerBenefitsNotes}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 border-gray-300"
                placeholder="PTO, health, 401k match, remote stipend, on-call, etc."
              />
            </div>

            <div>
              <label htmlFor="offerOtherComp" className="block font-semibold mb-1">
                Other compensation details (optional)
              </label>
              <textarea
                id="offerOtherComp"
                name="offerOtherComp"
                rows="2"
                value={form.offerOtherComp}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 border-gray-300"
                placeholder="Commission, stipend, education budget, relocation, severance, etc."
              />
            </div>
          </>
        )}
      </div>

      {/* LEVERAGE + PREFERENCES */}
      <div className="border border-gray-200 rounded-lg p-4 md:p-5 space-y-4">
        <div className="font-semibold text-gray-900">Leverage and preferences</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold mb-1">Do you have competing offers?</label>
            <div className="border rounded px-3 py-2 border-gray-300">
              <div className="flex items-center gap-5">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="competingOffers"
                    value="yes"
                    checked={form.competingOffers === 'yes'}
                    onChange={handleChange}
                  />
                  <span>Yes</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="competingOffers"
                    value="no"
                    checked={form.competingOffers === 'no'}
                    onChange={handleChange}
                  />
                  <span>No</span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="preferredWorkMode" className="block font-semibold mb-1">
              Preferred work mode (optional)
            </label>
            <select
              id="preferredWorkMode"
              name="preferredWorkMode"
              value={form.preferredWorkMode}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 border-gray-300"
            >
              <option value="">Select preference</option>
              <option value="on-site">On-site</option>
              <option value="hybrid">Hybrid</option>
              <option value="remote">Remote</option>
            </select>
          </div>
        </div>

        {showCompetingFields && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="competingOffersCount" className="block font-semibold mb-1">
                  Number of competing offers (optional)
                </label>
                <input
                  id="competingOffersCount"
                  name="competingOffersCount"
                  type="number"
                  min="0"
                  value={form.competingOffersCount}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2 border-gray-300"
                />
              </div>

              <div>
                <label htmlFor="bestAlternativeNotes" className="block font-semibold mb-1">
                  Best alternative notes (optional)
                </label>
                <input
                  id="bestAlternativeNotes"
                  name="bestAlternativeNotes"
                  type="text"
                  value={form.bestAlternativeNotes}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2 border-gray-300"
                  placeholder="Example: Another offer at 65k, remote, better PTO"
                />
              </div>
            </div>
          </>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold mb-1">Willing to relocate? (optional)</label>
            <div className="border rounded px-3 py-2 border-gray-300">
              <div className="flex items-center gap-5">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="willingnessToRelocate"
                    value="yes"
                    checked={form.willingnessToRelocate === 'yes'}
                    onChange={handleChange}
                  />
                  <span>Yes</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="willingnessToRelocate"
                    value="no"
                    checked={form.willingnessToRelocate === 'no'}
                    onChange={handleChange}
                  />
                  <span>No</span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="desiredStartDate" className="block font-semibold mb-1">
              Desired start date (optional)
            </label>
            <input
              id="desiredStartDate"
              name="desiredStartDate"
              type="text"
              value={form.desiredStartDate}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 border-gray-300"
              placeholder="Example: ASAP, 2 weeks, 2026-02-01"
            />
          </div>
        </div>

        <div>
          <label htmlFor="desiredBenefits" className="block font-semibold mb-1">
            Desired benefits/perks (optional)
          </label>
          <textarea
            id="desiredBenefits"
            name="desiredBenefits"
            rows="2"
            value={form.desiredBenefits}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 border-gray-300"
            placeholder="Example: remote, flexible schedule, more PTO, education stipend"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="topPriority" className="block font-semibold mb-1">
              Priority 1 (optional)
            </label>
            <select
              id="topPriority"
              name="topPriority"
              value={form.topPriority}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 border-gray-300"
            >
              {priorityOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="secondPriority" className="block font-semibold mb-1">
              Priority 2 (optional)
            </label>
            <select
              id="secondPriority"
              name="secondPriority"
              value={form.secondPriority}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 border-gray-300"
            >
              {priorityOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="thirdPriority" className="block font-semibold mb-1">
              Priority 3 (optional)
            </label>
            <select
              id="thirdPriority"
              name="thirdPriority"
              value={form.thirdPriority}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 border-gray-300"
            >
              {priorityOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="mustHaves" className="block font-semibold mb-1">
            Must-haves (optional)
          </label>
          <textarea
            id="mustHaves"
            name="mustHaves"
            rows="2"
            value={form.mustHaves}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 border-gray-300"
            placeholder="Example: minimum base salary, remote days, title, visa support, etc."
          />
        </div>

        <div>
          <label htmlFor="dealBreakers" className="block font-semibold mb-1">
            Deal-breakers (optional)
          </label>
          <textarea
            id="dealBreakers"
            name="dealBreakers"
            rows="2"
            value={form.dealBreakers}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 border-gray-300"
            placeholder="Example: on-call requirements, low PTO, non-negotiable in-office, etc."
          />
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          className="bg-[#FF7043] text-white px-6 py-3 rounded hover:bg-[#F4511E] transition font-semibold"
        >
          Generate my Negotiation Results
        </button>
      </div>
    </form>
  );
}
