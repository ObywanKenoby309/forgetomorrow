// components/coaching/StrategyIntelligenceForm.js

export default function StrategyIntelligenceForm({
  client,
  form,
  onChange,
  handleGenerateStrategy,
  generatingStrategy,
  isFTUser = false,
}) {
  return (
    <div className="flex flex-col gap-3">

      {/* Context */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[12px] text-slate-600 leading-5">
        {isFTUser ? (
          <>
            <span className="font-semibold text-slate-700">
              ForgeTomorrow member
            </span>{" "}
            — we'll pull {client?.name?.split(" ")[0]}'s profile summary,
            skills, and work preferences automatically. Just add their
            target companies and any coaching context below.
          </>
        ) : (
          <>
            <span className="font-semibold text-slate-700">
              External client
            </span>{" "}
            — the more context you provide, the stronger the generated
            coaching strategy will be.
          </>
        )}
      </div>

      {/* Target Companies */}
      <div>
        <label className="block text-sm font-bold mb-2">
          Target Companies
        </label>

        <textarea
          className="border border-slate-200 rounded-2xl px-3 py-2 w-full min-h-[110px] text-sm bg-white/88"
          placeholder="Paste target companies or categories..."
          value={form.targetCompanies || ""}
          onChange={onChange("targetCompanies")}
        />
      </div>

      {/* Coaching Context */}
      <div>
        <label className="block text-sm font-bold mb-2">
          Coaching Context
        </label>

        <textarea
          className="border border-slate-200 rounded-2xl px-3 py-2 w-full min-h-[150px] text-sm bg-white/88"
          placeholder="Add background, strengths, concerns, or anything you want ForgeTomorrow Intelligence to consider..."
          value={form.strategyBackground || ""}
          onChange={onChange("strategyBackground")}
        />
      </div>

      {/* Error */}
      {form.strategyError ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
          {form.strategyError}
        </div>
      ) : null}

      {/* CTA */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleGenerateStrategy}
          disabled={
            generatingStrategy ||
            !form.targetCompanies?.trim()
          }
          className="rounded-xl bg-[#FF7043] px-5 py-2 text-sm font-semibold text-white hover:bg-[#F4511E] transition disabled:opacity-50"
        >
          {generatingStrategy
            ? "Generating..."
            : "Generate Strategy"}
        </button>
      </div>

    </div>
  );
}