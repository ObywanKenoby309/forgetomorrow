// components/coaching/ClientPlanEdit.js

import { useState } from "react";
import CommandBrief from "@/components/coaching/clients/CommandBrief";
import StrategyIntelligenceForm from "@/components/coaching/StrategyIntelligenceForm";

export default function ClientPlanEdit({ client }) {
  const [mode, setMode] = useState(null);
  // null | "regenerate" | "intelligence" | "edit"
  const [showIntelligenceModal, setShowIntelligenceModal] = useState(false);

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
		onUpdateIntelligence={() => setShowIntelligenceModal(true)}
		onEditAllFields={() => setMode("edit")}
      />


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

{showIntelligenceModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">

    <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl">

      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <div>
          <div className="text-lg font-bold">
            Update Intelligence
          </div>

          <div className="text-sm text-slate-500">
            Update the information ForgeTomorrow Intelligence will use when generating this coaching strategy.
          </div>
        </div>

        <button
          onClick={() => setShowIntelligenceModal(false)}
          className="text-slate-400 hover:text-slate-700 text-xl"
        >
          ✕
        </button>
      </div>

      <div className="p-6">
        <StrategyIntelligenceForm
          client={client}
          form={{
            targetCompanies: client?.targetCompanies || "",
            strategyBackground: client?.strategyBackground || "",
            strategyError: "",
          }}
          onChange={() => {}}
          handleGenerateStrategy={() => {}}
          generatingStrategy={false}
          isFTUser={!!client?.clientId}
        />
      </div>

    </div>

  </div>
)}

    </div>
  );
}