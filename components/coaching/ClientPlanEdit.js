// components/coaching/ClientPlanEdit.js

import { useState } from "react";
import CommandBrief from "@/components/coaching/clients/CommandBrief";

export default function ClientPlanEdit({ client }) {
  const [mode, setMode] = useState(null);
  // null | "regenerate" | "intelligence" | "edit"

  return (
    <div className="space-y-4">

      {/* Current Draft */}
      <CommandBrief
        mode="edit"
        clientId={client?.id}
        clientName={client?.name}
        generatedAt={client?.strategyGeneratedAt}
        strategyBrief={client?.strategyJson}
		onGenerateStrategy={() => setMode("regenerate")}
		onUpdateIntelligence={() => setMode("intelligence")}
		onEditAllFields={() => setMode("edit")}
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