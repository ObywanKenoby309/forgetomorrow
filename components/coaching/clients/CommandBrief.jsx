// components/coaching/clients/CommandBrief.jsx
//
// ForgeTomorrow Coaching Intelligence — Command Brief
//
// Pure presentation component. Receives a saved strategyBrief object and
// renders it as a full-width coaching document. No data fetching.
//
// Props:
//   clientName    — string
//   generatedAt   — ISO string (from strategyBrief.generatedAt, fallback to client.updatedAt)
//   strategyBrief — the full JSON object from strategyJson
//   onEditInputs  — () => void — switch back to input mode
//   onFeedback    — ({ score, feedbackType, feedbackComment }) => void
//   variant       — 'overlay' (default) | reserved for future route use

import React, { useState } from 'react';

function fmtBriefDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });
  } catch { return ''; }
}

export default function CommandBrief({
  clientName,
  generatedAt,
  strategyBrief,
  onEditInputs,
  onFeedback,
}) {
  const [reasoningOpen, setReasoningOpen] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(null); // 'up' | 'down' | null

  if (!strategyBrief) return null;

  const b = strategyBrief;

  const handleUp = async () => {
    await onFeedback?.({ score: 'up' });
    setFeedbackSent('up');
  };

  const handleDown = async () => {
    const feedbackType = prompt('What was wrong?\n- wrong_direction\n- too_generic\n- missed_insight');
    if (!feedbackType) return;
    const feedbackComment = prompt('Optional: what should it have said?');
    await onFeedback?.({ score: 'down', feedbackType, feedbackComment });
    setFeedbackSent('down');
  };

  return (
    <div className="w-full space-y-4">

      {/* ── Document header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-white/30">
        <div>
          <div className="text-[11px] font-bold tracking-[0.10em] text-slate-400 uppercase mb-0.5">
            Coaching Brief
          </div>
          <div className="text-[17px] font-black tracking-tight text-slate-900">
            {clientName || 'Client'}
          </div>
          {generatedAt ? (
            <div className="text-[11px] text-slate-400 mt-0.5">
              Generated {fmtBriefDate(generatedAt)}
            </div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onEditInputs}
          className="self-start sm:self-auto rounded-xl border border-slate-200 bg-white/85 px-3 py-1.5 text-[12px] font-semibold text-slate-600 hover:bg-white shadow-sm transition"
        >
          ← Edit Inputs
        </button>
      </div>

      {/* ── HERO — full width ── */}
      {(b.positioningInsight || b.marketPositionWarning) && (
        <div className="rounded-2xl border-2 border-[rgba(255,112,67,0.30)] bg-white/80 px-5 py-5 shadow-sm">
          {b.positioningInsight && (
            <>
              <div className="text-[10px] font-black tracking-[0.10em] text-[#FF7043] uppercase mb-2">
                Who This Person Is
              </div>
              <div className="text-[17px] font-bold text-slate-900 leading-6 mb-4">
                {b.positioningInsight}
              </div>
            </>
          )}
          {b.marketPositionWarning && (
            <>
              <div className="text-[10px] font-black tracking-[0.10em] text-red-500 uppercase mb-2">
                Market Reality — How They're Being Seen Right Now
              </div>
              <div className="text-[13px] font-medium text-red-800 leading-5">
                {b.marketPositionWarning}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Sector alignment chips ── */}
      {b.themes?.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-4">
          <div className="text-[10px] font-black tracking-[0.10em] text-slate-400 uppercase mb-2.5">
            Sector Alignment
          </div>
          <div className="flex flex-wrap gap-2">
            {b.themes.map((t, i) => (
              <span key={i} className="inline-flex items-center rounded-xl border border-[rgba(255,112,67,0.30)] bg-[rgba(255,112,67,0.07)] px-3 py-1.5 text-[12px] font-medium text-[#993C1D]">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── ROW 1: What Carries Over + Role Lanes ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* What Carries Over — LEFT */}
        {b.transferabilitySignals?.length > 0 && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 px-4 py-4">
            <div className="text-[10px] font-black tracking-[0.10em] text-emerald-700 uppercase mb-2.5">
              What Carries Over
            </div>
            <ul className="space-y-2.5">
              {b.transferabilitySignals.map((s, i) => (
                <li key={i} className="text-sm text-emerald-900 leading-5 flex gap-2.5">
                  <span className="text-emerald-500 shrink-0 mt-0.5 font-bold">✓</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Role Lanes — RIGHT */}
        {b.roleLanes?.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-4">
            <div className="text-[10px] font-black tracking-[0.10em] text-slate-400 uppercase mb-2.5">
              Role Lanes
            </div>
            <ul className="space-y-2">
              {b.roleLanes.map((r, i) => (
                <li key={i} className="text-sm text-slate-700 leading-5">
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ── ROW 2: Narrative Gaps + Target Strategy ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* Narrative Gaps — LEFT */}
        {b.narrativeGaps?.length > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
            <div className="text-[10px] font-black tracking-[0.10em] text-amber-700 uppercase mb-2.5">
              Narrative Gaps
            </div>
            <ul className="space-y-2.5">
              {b.narrativeGaps.map((g, i) => (
                <li key={i} className="text-sm text-amber-900 leading-5 flex gap-2.5">
                  <span className="text-amber-500 shrink-0 mt-0.5">△</span>
                  <span>{g}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Target Strategy: Safe Harbor + Stretch — RIGHT */}
        {(b.safeHarborTargets?.length > 0 || b.stretchTargets?.length > 0) && (
          <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-4 space-y-4">
            {b.safeHarborTargets?.length > 0 && (
              <div>
                <div className="text-[10px] font-black tracking-[0.10em] text-slate-400 uppercase mb-2">
                  Safe Harbor Targets
                </div>
                <ul className="space-y-2">
                  {b.safeHarborTargets.map((t, i) => (
                    <li key={i} className="text-sm text-slate-700 leading-5 flex gap-2">
                      <span className="text-emerald-500 shrink-0">→</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {b.stretchTargets?.length > 0 && (
              <div>
                <div className="text-[10px] font-black tracking-[0.10em] text-slate-400 uppercase mb-2">
                  Stretch Targets
                </div>
                <ul className="space-y-2">
                  {b.stretchTargets.map((t, i) => (
                    <li key={i} className="text-sm text-slate-700 leading-5 flex gap-2">
                      <span className="text-[#FF7043] shrink-0">↑</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── EXECUTION PLAN — full width, primary action ── */}
      {b.executionPlan?.length > 0 && (
        <div className="rounded-2xl border border-[rgba(255,112,67,0.25)] bg-[rgba(255,112,67,0.06)] px-5 py-5">
          <div className="text-[10px] font-black tracking-[0.10em] text-[#FF7043] uppercase mb-3">
            This Week's Execution Plan
          </div>
          <div className="space-y-3">
            {b.executionPlan.map((step, i) => (
              <div key={i} className="flex gap-3">
                <div className="text-[#FF7043] font-black text-sm shrink-0 w-5">{i + 1}.</div>
                <div className="text-sm text-slate-800 leading-5">{step}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Next Step + Session Focus — two column ── */}
      {(b.nextStep || b.sessionFocus) && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {b.nextStep && (
            <div className="rounded-2xl border border-[rgba(255,112,67,0.25)] bg-[rgba(255,112,67,0.06)] px-4 py-4">
              <div className="text-[10px] font-black tracking-[0.10em] text-[#FF7043] uppercase mb-1.5">
                Next Step
              </div>
              <div className="text-[13px] font-semibold text-slate-900 leading-5">{b.nextStep}</div>
            </div>
          )}
          {b.sessionFocus && (
            <div className="rounded-2xl border border-slate-200 bg-[rgba(51,65,85,0.05)] px-4 py-4">
              <div className="text-[10px] font-black tracking-[0.10em] text-slate-500 uppercase mb-1.5">
                Session Focus
              </div>
              <div className="text-[13px] font-semibold text-slate-800 leading-5">{b.sessionFocus}</div>
            </div>
          )}
        </div>
      )}

      {/* ── Reasoning — collapsible ── */}
      {b.reasoning?.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white/60">
          <button
            type="button"
            onClick={() => setReasoningOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-left"
          >
            <span className="text-[10px] font-black tracking-[0.10em] text-slate-400 uppercase">
              Why This Strategy
            </span>
            <span className="text-slate-400 text-sm">{reasoningOpen ? '▲' : '▼'}</span>
          </button>
          {reasoningOpen && (
            <div className="px-4 pb-4">
              <ul className="space-y-2">
                {b.reasoning.map((r, i) => (
                  <li key={i} className="text-[12px] text-slate-600 leading-5 flex gap-2">
                    <span className="text-slate-400 shrink-0 font-black">{i + 1}.</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── Footer: feedback + edit ── */}
      <div className="flex items-center justify-between pt-2 border-t border-white/30">
        <div className="flex items-center gap-2">
          {feedbackSent ? (
            <span className="text-[11px] text-slate-400">
              {feedbackSent === 'up' ? 'Thanks for the feedback 👍' : 'Feedback noted 👎'}
            </span>
          ) : (
            <>
              <span className="text-[11px] text-slate-400 mr-1">Was this useful?</span>
              <button
                type="button"
                onClick={handleUp}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white/80 text-slate-700 text-xs hover:bg-white transition"
              >
                👍 Useful
              </button>
              <button
                type="button"
                onClick={handleDown}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white/80 text-slate-700 text-xs hover:bg-white transition"
              >
                👎 Needs Work
              </button>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={onEditInputs}
          className="text-[12px] font-semibold text-slate-400 hover:text-[#FF7043] transition"
        >
          ← Edit inputs & regenerate
        </button>
      </div>

    </div>
  );
}
