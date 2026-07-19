import { SectionCard } from "@/components/coaching/clients/ClientProfilePrimitives";

export default function ClientTargetStrategy() {
  return (
    <SectionCard
      title="Target Strategy"
      helperText="AI Recommendation"
    >
      <div className="space-y-3">

        <div>
          <label className="block text-sm font-bold mb-2">
            Target Companies
          </label>

          <textarea
            className="w-full min-h-[120px] rounded-xl border border-slate-200 p-3"
            placeholder="Enter target companies..."
          />
        </div>

        <div>
          <label className="block text-sm font-bold mb-2">
            Coaching Context
          </label>

          <textarea
            className="w-full min-h-[180px] rounded-xl border border-slate-200 p-3"
            placeholder="Describe what the AI should know..."
          />
        </div>

        <div className="flex justify-end">
          <button
            className="rounded-xl bg-[#FF7043] px-5 py-2 text-white font-bold"
          >
            Generate Strategy
          </button>
        </div>

      </div>
    </SectionCard>
  );
}