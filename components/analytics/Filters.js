// components/analytics/Filters.js
// Filters: Time Range, Job Posting, Recruiter
import React from 'react';

export default function Filters({ state, onChange }) {
  const { range, jobId, recruiterId, from, to } = state;
  return (
    <div className="bg-white rounded-2xl shadow p-5 border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4">
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

      <div>
        <label className="block text-sm text-gray-600 mb-1">Job Posting</label>
        <select
          className="w-full border rounded-xl p-2"
          value={jobId}
          onChange={(e) => onChange({ jobId: e.target.value })}
        >
          <option value="all">All</option>
          <option value="jr-se">Jr. Software Engineer</option>
          <option value="sr-se">Sr. Software Engineer</option>
          <option value="cx-lead">Customer Success Lead</option>
        </select>
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">Recruiter</label>
        <select
          className="w-full border rounded-xl p-2"
          value={recruiterId}
          onChange={(e) => onChange({ recruiterId: e.target.value })}
        >
          <option value="all">All</option>
          <option value="r1">Alexis</option>
          <option value="r2">Jordan</option>
          <option value="r3">Taylor</option>
        </select>
      </div>

      {range === 'custom' && (
        <div className="grid grid-cols-2 gap-3 items-end">
          <div>
            <label className="block text-sm text-gray-600 mb-1">From</label>
            <input type="date" className="w-full border rounded-xl p-2" value={from || ''} onChange={(e) => onChange({ from: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">To</label>
            <input type="date" className="w-full border rounded-xl p-2" value={to || ''} onChange={(e) => onChange({ to: e.target.value })} />
          </div>
        </div>
      )}
    </div>
  );
}