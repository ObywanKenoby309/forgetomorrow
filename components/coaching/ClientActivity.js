import { useState } from "react";

export default function ClientActivity({ client }) {
  const [selectedActivity, setSelectedActivity] = useState(0);

  const mockActivity = [
    {
      title: "Coaching Session Completed",
      type: "Session",
      date: "Today · 10:30 AM",
    },
    {
      title: "Homework Submitted",
      type: "Homework",
      date: "Yesterday",
    },
    {
      title: "Strategy Regenerated",
      type: "Strategy",
      date: "Jul 18",
    },
    {
      title: "Resume Updated",
      type: "Document",
      date: "Jul 16",
    },
  ];

  const activity = mockActivity[selectedActivity];

  return (
    <div className="grid grid-cols-[280px_minmax(0,1fr)_300px] gap-4">

      {/* LEFT */}

      <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">

        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-slate-800">
            Activity
          </h3>
        </div>

        <div className="space-y-2">

          {mockActivity.map((item, index) => (

            <button
              key={index}
              onClick={() => setSelectedActivity(index)}
              className={`w-full rounded-xl border p-3 text-left transition ${
                selectedActivity === index
                  ? "border-[#FF7043] bg-[rgba(255,112,67,0.08)]"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >

              <div className="font-semibold text-sm">
                {item.title}
              </div>

              <div className="mt-1 text-xs text-slate-500">
                {item.type}
              </div>

            </button>

          ))}

        </div>

      </div>

      {/* CENTER */}

      <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">

        <h2 className="text-lg font-black text-slate-800 mb-5">
          Activity Details
        </h2>

        <div className="space-y-5">

          <div>

            <div className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">
              Activity
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              {activity.title}
            </div>

          </div>

          <div>

            <div className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">
              Summary
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 min-h-[120px]">
              Timeline details, coach notes, uploads, homework completion,
              session summaries, and other activity information will appear here.
            </div>

          </div>

          <div className="grid grid-cols-2 gap-4">

            <div>

              <div className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">
                Activity Type
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                {activity.type}
              </div>

            </div>

            <div>

              <div className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">
                Date
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                {activity.date}
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* RIGHT */}

      <div className="space-y-4">

        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">

          <h3 className="font-black mb-3">
            Related Items
          </h3>

          <div className="rounded-lg border border-dashed border-slate-300 p-3 text-sm">
            Related goals, homework, coaching plans, sessions, and files will
            appear here.
          </div>

        </div>

        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">

          <h3 className="font-black mb-3">
            Coach Actions
          </h3>

          <div className="space-y-2">

            <button className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50 transition">
              View Related Goal
            </button>

            <button className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50 transition">
              Open Homework
            </button>

            <button className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50 transition">
              View Session Notes
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}