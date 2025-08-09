// components/resume/ResumeSelector.js
import React, { useContext, useMemo, useState } from 'react';
import { ResumeContext } from '../../context/ResumeContext';

// ---- simple, file-local usage tracking (monthly) ----
const LIMITS = { free: 1, paid: 3 };

function monthKey() {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}
function getStore() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem('ft_usage_limits');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function setStore(obj) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('ft_usage_limits', JSON.stringify(obj));
  } catch {/* ignore */}
}
function getUsed(plan = 'free') {
  const store = getStore();
  const key = monthKey();
  return store?.[key]?.[plan] ?? 0;
}
function getRemaining(plan = 'free') {
  const cap = LIMITS[plan] ?? LIMITS.free;
  return Math.max(0, cap - getUsed(plan));
}
export function recordAnalysis(plan = 'free') {
  const store = getStore();
  const key = monthKey();
  if (!store[key]) store[key] = {};
  store[key][plan] = (store[key][plan] ?? 0) + 1;
  setStore(store);
}
// -----------------------------------------------------

export default function ResumeSelector({
  plan = 'free',            // 'free' | 'paid' (wire to your plan source later)
  onConfirm,                // function(resumeId) => void
  onExhausted,              // optional callback if user is at limit
  className = '',
}) {
  const { resumes = [] } = useContext(ResumeContext);
  const [selectedId, setSelectedId] = useState(null);

  const remaining = useMemo(() => getRemaining(plan), [plan]);
  const canGenerate = remaining > 0;

  const getTitle = (r) =>
    r?.title || r?.name || r?.formData?.fullName || r?.fullName || 'Untitled Resume';

  const getSummary = (r) => {
    const s = r?.summary || r?.formData?.summary || '';
    return typeof s === 'string' ? s : '';
  };

  const getStamp = (r) => {
    const raw = r?.updatedAt || r?.updated_at || r?.lastModified;
    if (!raw) return null;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d.toLocaleString();
  };

  const handleConfirm = () => {
    if (!canGenerate) {
      if (onExhausted) onExhausted();
      return;
    }
    if (selectedId && onConfirm) onConfirm(selectedId);
  };

  if (!resumes || resumes.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <h2 className="text-xl font-semibold mb-2">Select a Resume</h2>
        <p className="text-gray-600">
          No saved resumes found. Create a resume first, then return to analyze it.
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow p-6 space-y-4 ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Select a Resume to Analyze</h2>
          <p className="text-gray-600 text-sm">
            Plan: <span className="font-medium uppercase">{plan}</span> • Remaining this month:{' '}
            <span className="font-semibold">{remaining}</span>
          </p>
        </div>
        {!canGenerate && (
          <div className="text-sm text-red-600 font-medium">
            You’ve used all analyses for this month.
          </div>
        )}
      </div>

      <div className="border rounded-lg divide-y">
        {resumes.map((r, idx) => {
          const id = r?.id ?? `resume-${idx}`;
          const title = getTitle(r);
          const stamp = getStamp(r);
          const summary = getSummary(r);
          return (
            <label
              key={String(id)}
              className={`flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50 ${
                selectedId === id ? 'bg-gray-50' : ''
              }`}
            >
              <input
                type="radio"
                name="resume-choice"
                value={String(id)}
                checked={selectedId === id}
                onChange={() => setSelectedId(id)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium">{title}</div>
                {stamp && <div className="text-xs text-gray-500 mb-1">Updated: {stamp}</div>}
                <div className="text-sm text-gray-600 line-clamp-2">
                  {summary ? summary.slice(0, 140) : 'No summary'}
                </div>
              </div>
            </label>
          );
        })}
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!selectedId || !canGenerate}
          className={`px-4 py-2 rounded-lg text-white ${
            !selectedId || !canGenerate
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-[#FF7043] hover:opacity-90'
          }`}
        >
          Use Selected Resume
        </button>
      </div>

      <p className="text-xs text-gray-500">
        Limits: Free 1/mo, Paid 3/mo. We’ll decrement after a successful analysis run.
      </p>
    </div>
  );
}
