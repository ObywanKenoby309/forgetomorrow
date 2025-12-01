'use client';

export default function PersonaChoiceModal({
  open,
  targetName,
  description,
  primaryLabel = "Use Recruiter inbox",
  secondaryLabel = "Use Personal inbox (Signal)",
  onPrimary,
  onSecondary,
  onClose,
}) {
  if (!open) return null;

  const name = targetName || "this member";

  const handleBackgroundClick = (e) => {
    // Only close if they clicked the dimmed backdrop, not the card itself
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40"
      onClick={handleBackgroundClick}
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-slate-200 p-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h2 className="text-lg font-semibold text-slate-900">
            How would you like to contact {name}?
          </h2>
          <button
            type="button"
            onClick={() => onClose?.()}
            className="text-slate-400 hover:text-slate-600 text-sm"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {description && (
          <p className="text-sm text-slate-600 mb-4">{description}</p>
        )}

        <div className="space-y-2 mb-4 text-xs text-slate-500">
          <p>
            <span className="font-semibold">Recruiter inbox</span> keeps this
            thread inside your Recruiter Suite, alongside jobs and pipeline.
          </p>
          <p>
            <span className="font-semibold">Personal inbox (Signal)</span> uses
            your standard ForgeTomorrow profile so you can network as yourself.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <button
            type="button"
            onClick={() => onPrimary?.()}
            className="flex-1 rounded-full bg-[#FF7043] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#F4511E] transition"
          >
            {primaryLabel}
          </button>
          <button
            type="button"
            onClick={() => onSecondary?.()}
            className="flex-1 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition"
          >
            {secondaryLabel}
          </button>
        </div>

        <button
          type="button"
          onClick={() => onClose?.()}
          className="mt-3 w-full text-center text-xs text-slate-400 hover:text-slate-600"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
