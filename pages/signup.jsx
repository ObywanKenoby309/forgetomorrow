// pages/signup.jsx
import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import dynamic from "next/dynamic";

// Dynamically import ReCAPTCHA to avoid SSR issues
const ReCAPTCHA = dynamic(() => import("react-google-recaptcha"), {
  ssr: false,
});

export default function Signup() {
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState("form"); // 'form' | 'sent'
  const [error, setError] = useState("");
  const [captchaToken, setCaptchaToken] = useState(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    newsletter: true,
    agree: false,
  });

  const onChange = (field) => (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (loading) return;

    if (!form.agree) {
      setError("Please agree to the Terms of Use and Privacy Policy.");
      return;
    }

    if (!captchaToken) {
      setError("Please complete the verification step before continuing.");
      return;
    }

    if (!form.email || !form.password || !form.firstName || !form.lastName) {
      setError("Please fill in all required fields.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/auth/preverify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          password: form.password,
          plan: "FREE",
          newsletter: !!form.newsletter,
          captchaToken,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        const message =
          json?.error ||
          json?.message ||
          (res.status === 500
            ? "Database error (user lookup). Please try again in a few minutes."
            : "Something went wrong. Please try again.");
        setError(message);
        return;
      }

      // Success -> move to "check your email" screen
      setPhase("sent");
    } catch (err) {
      console.error("[signup] submit error:", err);
      setError(
        "We couldn't send your verification email yet. Please try again shortly."
      );
    } finally {
      setLoading(false);
    }
  }

  const HeaderCopy = (
    <div
      style={{
        background: "rgba(255, 255, 255, 0.92)",
        borderRadius: 16,
        padding: 16,
        border: "1px solid #eee",
        boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
        textAlign: "center",
      }}
    >
      <h1
        style={{
          margin: 0,
          color: "#FF7043",
          fontSize: 28,
          fontWeight: 800,
        }}
      >
        Create your ForgeTomorrow account
      </h1>
      <p
        style={{
          margin: "8px auto 0",
          maxWidth: 520,
          fontSize: 14,
          lineHeight: 1.5,
          color: "#374151",
        }}
      >
        Professional networking without the noise — with all the tools.
        Start with a free Seeker account, then upgrade when you're ready.
      </p>
    </div>
  );

  return (
    <>
      <Head>
        <title>Sign up — ForgeTomorrow</title>
      </Head>

      <main className="min-h-screen bg-[#0B1724] text-slate-900 flex items-center justify-center px-4 py-10">
        <div className="max-w-5xl w-full grid md:grid-cols-2 gap-8 items-stretch">
          {/* Left side – hero / message */}
          <div className="flex flex-col justify-center space-y-4 text-white">
            <div className="text-sm uppercase tracking-wide text-[#FFB199]">
              Early Access • Seeker Suite
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold">
              Your next chapter
              <span className="block text-[#FF7043]">starts here.</span>
            </h2>
            <p className="text-sm md:text-base text-slate-200 leading-relaxed">
              ForgeTomorrow is built for real job seekers and real recruiters —
              no algorithmic suppression, no spam, just tools that help you move
              faster toward the work you’re called to do.
            </p>
            <ul className="mt-2 space-y-2 text-sm text-slate-200">
              <li>• Create a free profile in minutes.</li>
              <li>• Build and export ATS-ready resumes.</li>
              <li>• Get AI-assisted insight without losing control.</li>
            </ul>
            <p className="text-xs text-slate-400 mt-4">
              Already verified an account?{" "}
              <Link
                href="/login"
                className="text-[#FFB199] hover:text-[#FF7043] underline"
              >
                Log in here
              </Link>
              .
            </p>
          </div>

          {/* Right side – card */}
          <div className="bg-[#F5F7FA] rounded-2xl shadow-xl border border-slate-200 p-6 md:p-7">
            {HeaderCopy}

            {phase === "form" ? (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {error && (
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      First name
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
                      value={form.firstName}
                      onChange={onChange("firstName")}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Last name
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
                      value={form.lastName}
                      onChange={onChange("lastName")}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
                    value={form.email}
                    onChange={onChange("email")}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
                      value={form.password}
                      onChange={onChange("password")}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Confirm password
                    </label>
                    <input
                      type="password"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
                      value={form.confirmPassword}
                      onChange={onChange("confirmPassword")}
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <label className="flex items-center gap-2 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.newsletter}
                      onChange={onChange("newsletter")}
                      className="h-3 w-3 rounded border-slate-400 text-[#FF7043] focus:ring-[#FF7043]"
                    />
                    <span>Send me early access updates and tips.</span>
                  </label>
                </div>

                <div className="mt-2">
                  <ReCAPTCHA
                    sitekey={
                      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ||
                      "no-site-key-configured"
                    }
                    onChange={(token) => setCaptchaToken(token)}
                  />
                </div>

                <div className="flex items-start gap-2 mt-2">
                  <input
                    id="agree"
                    type="checkbox"
                    checked={form.agree}
                    onChange={onChange("agree")}
                    className="mt-0.5 h-3 w-3 rounded border-slate-400 text-[#FF7043] focus:ring-[#FF7043]"
                  />
                  <label
                    htmlFor="agree"
                    className="text-[11px] leading-snug text-slate-600"
                  >
                    I agree to the{" "}
                    <Link
                      href="/legal/terms"
                      className="text-[#FF7043] hover:underline"
                    >
                      Terms of Use
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/legal/privacy"
                      className="text-[#FF7043] hover:underline"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-4 w-full rounded-md bg-[#FF7043] px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-[#f45c28] disabled:opacity-60"
                >
                  {loading ? "Sending verification link…" : "Create your account"}
                </button>
              </form>
            ) : (
              <div className="mt-6 space-y-4 text-sm text-slate-700">
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                  We’ve sent a verification link to{" "}
                  <span className="font-semibold">{form.email}</span>. Click the
                  link in your inbox to complete setup. The link is time-limited
                  for security.
                </div>
                <p>
                  Once verified, you’ll be able to log in and finish your profile.
                </p>
                <p className="text-xs text-slate-500">
                  Didn’t get the email? Check your spam folder or try again with a
                  different address.
                </p>
                <button
                  type="button"
                  onClick={() => setPhase("form")}
                  className="text-xs text-[#FF7043] hover:underline"
                >
                  Go back and try a different email
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
