// components/coaching/ClientPlanEdit.js

import { useState } from "react";
import CommandBrief from "@/components/coaching/clients/CommandBrief";

export default function ClientPlanEdit({ client }) {
  const [mode, setMode] = useState(null);
  // null | "intelligence" | "edit"

  return (
    <div className="space-y-4">

      {/* Editor Actions */}
      <div className="flex flex-wrap items-center justify-end gap-2">

        <button
          type="button"
          className="rounded-xl bg-[#FF7043] px-3 py-1.5 text-[12px] font-semibold text-white hover:opacity-90 transition"
        >
          Generate New Strategy
        </button>

        <button
          type="button"
          onClick={() => setMode("intelligence")}
          className="rounded-xl border border-slate-200 bg-white/85 px-3 py-1.5 text-[12px] font-semibold text-slate-600 hover:bg-white shadow-sm transition"
        >
          Update Intelligence Data
        </button>

        <button
          type="button"
          onClick={() => setMode("edit")}
          className="rounded-xl border border-slate-200 bg-white/85 px-3 py-1.5 text-[12px] font-semibold text-slate-600 hover:bg-white shadow-sm transition"
        >
          Edit All Fields
        </button>

      </div>

      {/* Current Draft */}
      <CommandBrief
        mode="edit"
        clientId={client?.id}
        clientName={client?.name}
        generatedAt={client?.strategyGeneratedAt}
        strategyBrief={client?.strategyJson}
      />

      {/* Intelligence Panel */}
      {mode === "intelligence" && (
        <div className="rounded-2xl border border-slate-200 p-6">
          <h3 className="font-bold mb-4">
            Update Intelligence Data
          </h3>

          <p className="text-sm text-slate-500">
            Existing Target Strategy inputs will be moved here.
          </p>
        </div>
      )}

      {/* Free Edit Mode */}
      {mode === "edit" && (
        <div className="rounded-2xl border border-slate-200 p-6">
          <h3 className="font-bold mb-4">
            Edit Coaching Plan
          </h3>

          <p className="text-sm text-slate-500">
            Editable version of the Command Brief will render here.
          </p>
        </div>
      )}

    </div>
  );
}