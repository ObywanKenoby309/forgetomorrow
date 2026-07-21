import { useState } from "react";

export default function ClientGoals({ client }) {
  const [selectedGoal, setSelectedGoal] = useState(0);

  const mockGoals = [
    {
      title: "Executive Narrative",
      status: "In Progress",
      progress: 70,
    },
    {
      title: "Resume Modernization",
      status: "Completed",
      progress: 100,
    },
    {
      title: "Interview Preparation",
      status: "In Progress",
      progress: 40,
    },
    {
      title: "Portfolio Verification",
      status: "Not Started",
      progress: 0,
    },
  ];

  const goal = mockGoals[selectedGoal];

  return (
    <div className="grid grid-cols-[280px_minmax(0,1fr)_300px] gap-4">

      {/* LEFT COLUMN */}

      <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">

        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-slate-800">
            Goals
          </h3>

          <button className="rounded-lg bg-[#FF7043] px-3 py-1 text-sm font-bold text-white hover:opacity-90">
            +
          </button>
        </div>

        <div className="space-y-2">

          {mockGoals.map((g, index) => (

            <button
              key={index}
              onClick={() => setSelectedGoal(index)}
              className={`w-full rounded-xl border p-3 text-left transition ${
                selectedGoal === index
                  ? "border-[#FF7043] bg-[rgba(255,112,67,0.08)]"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >

              <div className="font-semibold text-sm">
                {g.title}
              </div>

              <div className="mt-1 text-xs text-slate-500">
                {g.status}
              </div>

            </button>

          ))}

        </div>

      </div>

      {/* CENTER */}

      <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">

        <h2 className="text-lg font-black text-slate-800 mb-5">
          Goal Details
        </h2>

        <div className="space-y-5">

          <div>

            <div className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">
              Goal
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              {goal.title}
            </div>

          </div>

          <div>

            <div className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">
              Description
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 min-h-[120px]">
              Goal description placeholder.
            </div>

          </div>

          <div className="grid grid-cols-2 gap-4">

            <div>

              <div className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">
                Status
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                {goal.status}
              </div>

            </div>

            <div>

              <div className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">
                Target Date
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                July 31, 2026
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* RIGHT */}

      <div className="space-y-4">

        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">

          <h3 className="font-black mb-3">
            Forge Intelligence
          </h3>

          <div className="space-y-2 text-sm">

            <div className="rounded-lg border border-dashed border-slate-300 p-3">
              Recommended goals will appear here.
            </div>

          </div>

        </div>

        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">

          <h3 className="font-black mb-3">
            Goal Progress
          </h3>

          <div className="space-y-3">

            <div>

              <div className="flex justify-between text-sm mb-1">

                <span>Completion</span>

                <span>{goal.progress}%</span>

              </div>

              <div className="h-2 rounded-full bg-slate-200">

                <div
                  className="h-2 rounded-full bg-[#FF7043]"
                  style={{ width: `${goal.progress}%` }}
                />

              </div>

            </div>

            <div className="text-sm text-slate-600">
              Related homework and coaching progress will appear here.
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}