// components/settings/DeleteDataAndAccountSection.tsx
import { useState } from "react";

type Mode = "clear" | "delete";

export default function DeleteDataAndAccountSection() {
  const [mode, setMode] = useState<Mode | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!mode) return;

    setError(null);
    setMessage(null);

    if (confirmText !== "DELETE") {
      setError('Please type "DELETE" exactly to confirm.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: mode, confirm: "DELETE" }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      if (mode === "clear") {
        setMessage("Your personal data has been cleared. Your account remains active.");
        setConfirmText("");
        setMode(null);
      } else {
        setMessage("Your account and data have been deleted. You will be signed out.");
        // optional: redirect after short delay
        window.location.href = "/goodbye";
      }
    } catch (err: any) {
      setError(err.message || "Unable to complete request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-10 border border-red-200 rounded-lg p-4 bg-red-50">
      <h2 className="text-lg font-semibold text-red-800">Danger zone</h2>
      <p className="mt-2 text-sm text-red-900">
        These actions are permanent. Please read carefully before you continue.
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {/* Option 1: Clear data */}
        <button
          type="button"
          onClick={() => setMode("clear")}
          className={`text-left border rounded-lg p-3 text-sm ${
            mode === "clear"
              ? "border-red-600 bg-white"
              : "border-red-200 bg-red-100 hover:bg-red-100"
          }`}
        >
          <h3 className="font-semibold text-red-700">Clear my data, keep my account</h3>
          <p className="mt-1 text-xs text-red-900">
            This will delete your messages, job applications, saved jobs, resumes, and other
            personal content. Your login and basic account will remain, and you can continue using
            ForgeTomorrow.
          </p>
        </button>

        {/* Option 2: Delete everything */}
        <button
          type="button"
          onClick={() => setMode("delete")}
          className={`text-left border rounded-lg p-3 text-sm ${
            mode === "delete"
              ? "border-red-700 bg-white"
              : "border-red-200 bg-red-100 hover:bg-red-100"
          }`}
        >
          <h3 className="font-semibold text-red-800">Delete my account & data</h3>
          <p className="mt-1 text-xs text-red-900">
            This will permanently delete your account and associated personal data. Certain records
            that we are legally required to keep (for example, payments or security logs) may be
            retained in a limited, anonymized form.
          </p>
        </button>
      </div>

      {mode && (
        <div className="mt-5 border-t border-red-200 pt-4">
          <p className="text-sm font-semibold text-red-800">
            ⚠️ You are about to{" "}
            {mode === "clear"
              ? "clear your personal data but keep your account."
              : "delete your entire account and personal data."}
          </p>
          <p className="mt-1 text-xs text-red-900">
            This action cannot be undone. Type <span className="font-mono font-bold">DELETE</span> and
            press the button to continue.
          </p>

          <div className="mt-3 flex flex-col gap-2 max-w-xs">
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="border rounded px-3 py-2 text-sm"
            />

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="inline-flex items-center justify-center px-4 py-2 rounded text-sm font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
            >
              {loading
                ? "Processing..."
                : mode === "clear"
                ? "Yes, clear my data"
                : "Yes, delete my account"}
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      {message && <p className="mt-3 text-sm text-green-700">{message}</p>}
    </section>
  );
}
