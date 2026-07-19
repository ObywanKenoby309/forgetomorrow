// components/coaching/ClientCoachingPlan.js

import { useState } from "react";
import { SectionCard } from "@/components/coaching/clients/ClientProfilePrimitives";
import ClientTargetStrategy from "@/components/coaching/ClientTargetStrategy";
import CommandBrief from "@/components/coaching/clients/CommandBrief";

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
	
	<pre className="text-xs overflow-auto max-h-[400px]">
	  {JSON.stringify(client, null, 2)}
	</pre>
	
<CommandBrief
  clientId={client?.id}
  clientName={client?.name}
  generatedAt={client?.strategyGeneratedAt}
  strategyBrief={client?.strategyJson}
  onEditInputs={() => setView("strategy")}
/>
    )}
  </>
);
}