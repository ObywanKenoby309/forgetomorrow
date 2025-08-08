import React, { useState } from 'react';

const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship', 'Other'];
const industries = ['Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing', 'Other'];

export default function NegotiationInputForm({ onSubmit }) {
  const [form, setForm] = useState({
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
    if (!form.currentSalary || Number(form.currentSalary) <= 0) newErrors.currentSalary = 'Current salary must be a positive number';
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

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow space-y-6">
      <h2 className="text-2xl font-semibold text-[#FF7043] mb-4">Negotiation Input Form</h2>

      <div>
        <label htmlFor="jobDescription" className="block font-semibold mb-1">
          Job Description or Title <span className="text-red-600">*</span>
        </label>
        <textarea
          id="jobDescription"
          name="jobDescription"
          value={form.jobDescription}
          onChange={handleChange}
          rows="3"
          className={`w-full border rounded px-3 py-2 ${errors.jobDescription ? 'border-red-600' : 'border-gray-300'}`}
        />
        {errors.jobDescription && <p className="text-red-600 text-sm mt-1">{errors.jobDescription}</p>}
      </div>

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
          className={`w-full border rounded px-3 py-2 ${errors.currentJobTitle ? 'border-red-600' : 'border-gray-300'}`}
        />
        {errors.currentJobTitle && <p className="text-red-600 text-sm mt-1">{errors.currentJobTitle}</p>}
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
          className={`w-full border rounded px-3 py-2 ${errors.currentSalary ? 'border-red-600' : 'border-gray-300'}`}
        />
        {errors.currentSalary && <p className="text-red-600 text-sm mt-1">{errors.currentSalary}</p>}
      </div>

      <div>
        <label className="block font-semibold mb-1">
          Is this a new job or current job? <span className="text-red-600">*</span>
        </label>
        <div className="border rounded p-3">
          <label className="mr-4">
            <input
              type="radio"
              name="isNewJob"
              value="yes"
              checked={form.isNewJob === 'yes'}
              onChange={handleChange}
              className="mr-1"
            />
            New Job
          </label>
          <label>
            <input
              type="radio"
              name="isNewJob"
              value="no"
              checked={form.isNewJob === 'no'}
              onChange={handleChange}
              className="mr-1"
            />
            Current Job
          </label>
        </div>
        {errors.isNewJob && <p className="text-red-600 text-sm mt-1">{errors.isNewJob}</p>}
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
          className={`w-full border rounded px-3 py-2 ${errors.location ? 'border-red-600' : 'border-gray-300'}`}
        />
        {errors.location && <p className="text-red-600 text-sm mt-1">{errors.location}</p>}
      </div>

      <div>
        <label className="block font-semibold mb-1">Target Salary Range (optional)</label>
        <div className="flex space-x-4">
          <input
            name="targetSalaryMin"
            type="number"
            min="0"
            value={form.targetSalaryMin}
            onChange={handleChange}
            placeholder="Min"
            className="w-1/2 border rounded px-3 py-2 border-gray-300"
          />
          <input
            name="targetSalaryMax"
            type="number"
            min="0"
            value={form.targetSalaryMax}
            onChange={handleChange}
            placeholder="Max"
            className="w-1/2 border rounded px-3 py-2 border-gray-300"
          />
        </div>
      </div>

      <div>
        <label htmlFor="desiredBenefits" className="block font-semibold mb-1">Desired Benefits/Perks (optional)</label>
        <textarea
          id="desiredBenefits"
          name="desiredBenefits"
          rows="3"
          value={form.desiredBenefits}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 border-gray-300"
          placeholder="E.g., flexible schedule, remote work, extra vacation days"
        />
      </div>

      <div>
        <label htmlFor="jobType" className="block font-semibold mb-1">Job Type (optional)</label>
        <select
          id="jobType"
          name="jobType"
          value={form.jobType}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 border-gray-300"
        >
          <option value="">Select job type</option>
          {jobTypes.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="industry" className="block font-semibold mb-1">Industry/Sector (optional)</label>
        <select
          id="industry"
          name="industry"
          value={form.industry}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 border-gray-300"
        >
          <option value="">Select industry</option>
          {industries.map((ind) => (
            <option key={ind} value={ind}>{ind}</option>
          ))}
        </select>
      </div>

      <div className="text-right">
        <button
          type="submit"
          className="bg-[#FF7043] text-white px-6 py-3 rounded hover:bg-[#F4511E] transition"
        >
          Generate my Negotiation Strategy
        </button>
      </div>
    </form>
  );
}
