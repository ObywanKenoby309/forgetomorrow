import Head from "next/head";

export default function Help() {
  return (
    <>
      <Head>
        <title>Help & Support — ForgeTomorrow</title>
      </Head>

      <div className="relative min-h-[80vh] py-10">
        {/* Decorative background layer — not announced */}
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          aria-hidden="true"
          style={{
            backgroundImage:
              "radial-gradient(circle at top left, rgba(255,112,67,0.12), transparent 55%), radial-gradient(circle at bottom right, rgba(17,32,51,0.28), transparent 55%)",
            backgroundColor: "#ECEFF1",
          }}
        />

        {/* Foreground */}
        <main
          className="relative max-w-4xl mx-auto px-6 text-slate-900"
          aria-labelledby="help-center-heading"
        >
          <header className="mb-6">
            <h1
              id="help-center-heading"
              className="text-3xl font-bold text-[#FF7043] mb-4"
            >
              Help &amp; Support
            </h1>
            <p className="text-slate-700 mb-8 leading-relaxed max-w-3xl">
              This Help Center is for anyone who needs assistance with
              ForgeTomorrow — even if you don&apos;t have an account yet or
              can&apos;t sign in. You&apos;ll find guidance on how to reach us,
              resolve common issues, and understand where to get live support
              once you&apos;re inside the platform.
            </p>
          </header>

          {/* Contacting support */}
          <section
            className="space-y-4 mb-10"
            role="region"
            aria-labelledby="contacting-support"
          >
            <h2
              id="contacting-support"
              className="text-xl font-semibold text-slate-900 mb-2"
            >
              Contacting Support
            </h2>

            <article className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Email Support
              </h3>
              <p className="text-sm text-slate-700 mb-2">
                If you need help and can&apos;t access your account, you can
                reach our team directly by email:
              </p>
              <p className="text-sm mb-3">
                <a
                  href="mailto:support@forgetomorrow.com"
                  className="text-[#FF7043] underline font-medium focus:outline-none focus:ring-2 focus:ring-[#FF7043] focus:ring-offset-2 focus:ring-offset-white rounded-sm"
                >
                  support@forgetomorrow.com
                </a>
              </p>
              <p className="text-xs text-slate-500">
                Please include your registered email (if applicable) and a brief
                description of the issue so we can assist you faster.
              </p>
            </article>
          </section>

          {/* Common situations */}
          <section
            className="space-y-4 mb-10"
            role="region"
            aria-labelledby="common-situations"
          >
            <h2
              id="common-situations"
              className="text-xl font-semibold text-slate-900 mb-2"
            >
              Common Situations
            </h2>

            {/* Can't sign in */}
            <article className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900 mb-2">
                I can&apos;t sign in
              </h3>
              <p className="text-sm text-slate-700 mb-2">
                If you&apos;re having trouble signing in:
              </p>
              <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                <li>Double-check your email address.</li>
                <li>
                  If you signed up with a social login (e.g. Continue with
                  Google), use the same method again.
                </li>
                <li>Try resetting your password if available.</li>
              </ul>
              <p className="text-xs text-slate-500 mt-3">
                If issues persist, email us and we&apos;ll help verify your
                identity and restore access if possible.
              </p>
            </article>

            {/* No account yet */}
            <article className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900 mb-2">
                I haven&apos;t created an account yet
              </h3>
              <p className="text-sm text-slate-700 mb-2">
                You can create a ForgeTomorrow account from our main site when
                sign-up is available. If you have questions about eligibility,
                pricing, or how it works, feel free to contact us.
              </p>
              <p className="text-sm text-slate-700">
                We can also help you choose the best role — Seeker, Coach,
                Recruiter, or Admin.
              </p>
            </article>

            {/* Privacy */}
            <article className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900 mb-2">
                I have a question about privacy or data
              </h3>
              <p className="text-sm text-slate-700 mb-2">
                For questions about how we handle your data, please review our{" "}
                <a
                  href="/privacy"
                  className="text-[#FF7043] underline font-medium focus:outline-none focus:ring-2 focus:ring-[#FF7043] focus:ring-offset-2 focus:ring-offset-white rounded-sm"
                >
                  Privacy Policy
                </a>{" "}
                and{" "}
                <a
                  href="/subprocessors"
                  className="text-[#FF7043] underline font-medium focus:outline-none focus:ring-2 focus:ring-[#FF7043] focus:ring-offset-2 focus:ring-offset-white rounded-sm"
                >
                  Sub-processors
                </a>{" "}
                pages.
              </p>
              <p className="text-sm text-slate-700">
                If you still have concerns, reach out and we&apos;ll provide
                clarity.
              </p>
            </article>
          </section>

          {/* Signed-in users */}
          <section
            className="space-y-4 mb-4"
            role="region"
            aria-labelledby="signed-in-users"
          >
            <h2
              id="signed-in-users"
              className="text-xl font-semibold text-slate-900"
            >
              If You Already Have a ForgeTomorrow Account
            </h2>

            <article className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900 mb-2">
                In-app Support
              </h3>
              <p className="text-sm text-slate-700 mb-2">
                When you&apos;re signed in, you&apos;ll see a Support area inside
                the platform where you can get personalized help.
              </p>
              <p className="text-sm text-slate-700">
                If you can&apos;t access it due to login issues, use this Help
                Center or email us.
              </p>
            </article>
          </section>
        </main>
      </div>
    </>
  );
}
