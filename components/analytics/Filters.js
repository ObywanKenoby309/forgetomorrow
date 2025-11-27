// components/analytics/Filters.js
// Filters: Time Range, Job Posting, Recruiter, Company
import React from "react";

export default function Filters({ state, onChange }) {
  const { range, jobId, recruiterId, companyId, from, to } = state;

  return (
    <div className="bg-white rounded-2xl shadow p-5 border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Time Range */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">Time Range</label>
        <select
          className="w-full border rounded-xl p-2"
          value={range}
          onChange={(e) => onChange({ range: e.target.value })}
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      {/* Job Posting */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">Job Posting</label>
        <select
          className="w-full border rounded-xl p-2"
          value={jobId}
          onChange={(e) => onChange({ jobId: e.target.value })}
        >
          {/* Phase 2: real job options from org */}
          <option value="all">All job postings</option>
        </select>
      </div>

      {/* Recruiter */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">Recruiter</label>
        <select
          className="w-full border rounded-xl p-2"
          value={recruiterId}
          onChange={(e) => onChange({ recruiterId: e.target.value })}
        >
          {/* Phase 2: real recruiter list. For now, just "All". */}
          <option value="all">All recruiters</option>
        </select>
      </div>

      {/* Company / Organization */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">
          Company / Organization
        </label>
        <select
          className="w-full border rounded-xl p-2"
          value={companyId}
          onChange={(e) => onChange({ companyId: e.target.value })}
        >
          {/* Phase 2: per-company list (per org / tenant).
              "All companies" = all the companies this user is allowed to see. */}
          <option value="all">All companies</option>
        </select>
      </div>

      {/* Custom date range fields */}
      {range === "custom" && (
        <div className="md:col-span-4 grid grid-cols-1 sm:grid-cols-2 gap-3 items-end mt-1">
          <div>
            <label className="block text-sm text-gray-600 mb-1">From</label>
            <input
              type="date"
              className="w-full border rounded-xl p-2"
              value={from || ""}
              onChange={(e) => onChange({ from: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">To</label>
            <input
              type="date"
              className="w-full border rounded-xl p-2"
              value={to || ""}
              onChange={(e) => onChange({ to: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
