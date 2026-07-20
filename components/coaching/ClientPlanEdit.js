// components/coaching/ClientPlanEdit.js

import { useState } from "react";
import CommandBrief from "@/components/coaching/clients/CommandBrief";

export default function ClientPlanEdit({ client }) {
  const [mode, setMode] = useState(null);
  // null | "intelligence" | "edit"

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="border-b border-slate-200 pb-3">
        <div className="text-[11px] font-bold tracking-[0.10em] text-slate-400 uppercase">
          Coaching Brief
        </div>

        <div className="text-[18px] font-black text-slate-900">
          {client?.name}
        </div>

        {client?.strategyGeneratedAt && (
          <div className="text-xs text-slate-500 mt-1">
            Last Updated{" "}
            {new Date(client.strategyGeneratedAt).toLocaleString()}
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap gap-3">

        <button
          type="button"
          className="rounded-xl bg-[#FF7043] px-4 py-2 text-white font-semibold"
        >
          Generate New Strategy
        </button>

        <button
          type="button"
          onClick={() => setMode("intelligence")}
          className="rounded-xl border border-slate-300 px-4 py-2 font-semibold"
        >
          Update Intelligence Data
        </button>

        <button
          type="button"
          onClick={() => setMode("edit")}
          className="rounded-xl border border-slate-300 px-4 py-2 font-semibold"
        >
          Edit Plan
        </button>

      </div>

      {/* Default View */}
      {mode === null && (
        <CommandBrief
          clientId={client?.id}
          clientName={client?.name}
          generatedAt={client?.strategyGeneratedAt}
          strategyBrief={client?.strategyJson}
        />
      )}

      {/* Intelligence Mode */}
      {mode === "intelligence" && (
        <div className="rounded-2xl border border-slate-200 p-6">
          <h3 className="font-bold mb-4">
            Update Intelligence Data
          </h3>

          <p className="text-sm text-slate-500">
            Existing Target Strategy tool goes here.
          </p>
        </div>
      )}

      {/* Edit Mode */}
      {mode === "edit" && (
        <div className="rounded-2xl border border-slate-200 p-6">
          <h3 className="font-bold mb-4">
            Edit Coaching Plan
          </h3>

          <p className="text-sm text-slate-500">
            Editable Command Brief goes here.
          </p>
        </div>
      )}

    </div>
  );
}