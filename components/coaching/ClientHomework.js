import { useState } from "react";

export default function ClientHomework({ client }) {
  const [selectedHomework, setSelectedHomework] = useState(0);

  const mockHomework = [
    {
      title: "Rewrite Executive Summary",
      status: "In Progress",
      due: "Tomorrow",
      progress: 40,
    },
    {
      title: "Complete Portfolio Verification",
      status: "Assigned",
      due: "Friday",
      progress: 0,
    },
    {
      title: "Practice STAR Stories",
      status: "Completed",
      due: "Completed",
      progress: 100,
    },
    {
      title: "Research Target Companies",
      status: "Assigned",
      due: "Next Week",
      progress: 0,
    },
  ];

  const assignment = mockHomework[selectedHomework];

  return (
    <div className="grid grid-cols-[280px_minmax(0,1fr)_300px] gap-4">

      {/* LEFT */}

      <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">

        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-slate-800">
            Homework
          </h3>

          <button className="rounded-lg bg-[#FF7043] px-3 py-1 text-sm font-bold text-white hover:opacity-90">
            +
          </button>
        </div>

        <div className="space-y-2">

          {mockHomework.map((item, index) => (

            <button
              key={index}
              onClick={() => setSelectedHomework(index)}
              className={`w-full rounded-xl border p-3 text-left transition ${
                selectedHomework === index
                  ? "border-[#FF7043] bg-[rgba(255,112,67,0.08)]"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >

              <div className="font-semibold text-sm">
                {item.title}
              </div>

              <div className="mt-1 text-xs text-slate-500">
                {item.status}
              </div>

            </button>

          ))}

        </div>

      </div>

      {/* CENTER */}

      <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">

        <h2 className="text-lg font-black text-slate-800 mb-5">
          Homework Details
        </h2>

        <div className="space-y-5">

          <div>

            <div className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">
              Assignment
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              {assignment.title}
            </div>

          </div>

          <div>

            <div className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">
              Instructions
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 min-h-[120px]">
              Homework instructions and coach guidance will appear here.
            </div>

          </div>

          <div className="grid grid-cols-2 gap-4">

            <div>

              <div className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">
                Status
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                {assignment.status}
              </div>

            </div>

            <div>

              <div className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">
                Due Date
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                {assignment.due}
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* RIGHT */}

      <div className="space-y-4">

        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">

          <h3 className="font-black mb-3">
            Coach Notes
          </h3>

          <div className="rounded-lg border border-dashed border-slate-300 p-3 text-sm">
            Notes about this assignment will appear here.
          </div>

        </div>

        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">

          <h3 className="font-black mb-3">
            Assignment Progress
          </h3>

          <div className="space-y-3">

            <div>

              <div className="flex justify-between text-sm mb-1">

                <span>Completion</span>

                <span>{assignment.progress}%</span>

              </div>

              <div className="h-2 rounded-full bg-slate-200">

                <div
                  className="h-2 rounded-full bg-[#FF7043]"
                  style={{ width: `${assignment.progress}%` }}
                />

              </div>

            </div>

            <div className="text-sm text-slate-600">
              Related goals and completion history will appear here.
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}