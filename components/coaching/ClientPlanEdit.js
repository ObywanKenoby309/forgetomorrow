import CommandBrief from "@/components/coaching/clients/CommandBrief";

export default function ClientPlanEdit({ client }) {
  return (
    <div className="space-y-4">

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Plan Editor</h2>
          <p className="text-sm text-slate-500">
            Review and edit the coaching plan before publishing.
          </p>
        </div>

        <button
          className="rounded-xl bg-[#FF7043] px-5 py-2 font-bold text-white"
        >
          Generate New Strategy
        </button>
      </div>

      <CommandBrief
        clientId={client?.id}
        clientName={client?.name}
        generatedAt={client?.strategyGeneratedAt}
        strategyBrief={client?.strategyJson}
      />

    </div>
  );
}