// components/coaching/ClientCoachingPlan.js

import { useState } from "react";
import { SectionCard } from "@/components/coaching/clients/ClientProfilePrimitives";
import ClientTargetStrategy from "@/components/coaching/ClientTargetStrategy";

export default function ClientCoachingPlan({ client }) {
	const [view, setView] = useState("plan");
	
  return (
  <>
    <div className="flex justify-center mb-4">
      <div className="inline-flex rounded-xl border border-slate-200 overflow-hidden">
        <button
          type="button"
          onClick={() => setView("plan")}
          className={`px-5 py-2 text-sm font-bold transition ${
            view === "plan"
              ? "bg-[#FF7043] text-white"
              : "bg-white text-slate-700"
          }`}
        >
          Plan
        </button>

        <button
          type="button"
          onClick={() => setView("strategy")}
          className={`px-5 py-2 text-sm font-bold transition ${
            view === "strategy"
              ? "bg-[#FF7043] text-white"
              : "bg-white text-slate-700"
          }`}
        >
          Target Strategy
        </button>
      </div>
    </div>
	
	{view === "strategy" ? (
	  <ClientTargetStrategy client={client} />
	) : (

    <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-3">
      {/* Left Column */}
      <div className="space-y-3">
        <SectionCard title="Coaching Objective">
          <div className="text-sm text-slate-500">
            Coaching objective will appear here.
          </div>
        </SectionCard>

        <SectionCard title="Desired Outcome">
          <div className="text-sm text-slate-500">
            Desired outcome will appear here.
          </div>
        </SectionCard>
      </div>

      {/* Strategy */}
      <SectionCard title="Coaching Strategy">
        <div className="min-h-[420px] text-sm text-slate-500">
          Coaching strategy will appear here.
        </div>
      </SectionCard>

      {/* Bottom Row */}
      <div className="lg:col-span-2 grid grid-cols-1 lg:grid-cols-3 gap-3">
        <SectionCard title="Current Priorities">
          <div className="text-sm text-slate-500">
            Current priorities will appear here.
          </div>
        </SectionCard>

        <SectionCard title="Success Indicators">
          <div className="text-sm text-slate-500">
            Success indicators will appear here.
          </div>
        </SectionCard>

        <SectionCard title="Risks / Watch Items">
          <div className="text-sm text-slate-500">
            Risks and watch items will appear here.
          </div>
        </SectionCard>
      </div>
    </div>
    )}
  </>
);
}