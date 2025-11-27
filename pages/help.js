import Head from "next/head";

export default function Help() {
  return (
    <>
      <Head>
        <title>Help & Support — ForgeTomorrow</title>
      </Head>

      <div className="relative min-h-[80vh] py-10">
        {/* Decorative background layer — low opacity, no text on top */}
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          aria-hidden="true"
          style={{
            backgroundImage:
              "radial-gradient(circle at top left, rgba(255,112,67,0.12), transparent 55%), radial-gradient(circle at bottom right, rgba(17,32,51,0.28), transparent 55%)",
            backgroundColor: "#ECEFF1",
          }}
        />

        {/* Foreground content */}
        <main className="relative max-w-4xl mx-auto px-6 text-slate-900">
          <h1 className="text-3xl font-bold text-[#FF7043] mb-4">
            Help &amp; Support
          </h1>
          <p className="text-slate-700 mb-8 leading-relaxed max-w-3xl">
            This Help Center is for anyone who needs assistance with ForgeTomorrow —
            even if you don&apos;t have an account yet or can&apos;t sign in. You&apos;ll
            find guidance on how to reach us, resolve common issues, and understand
            where to get live support once you&apos;re inside the platform.
          </p>

          {/* How to contact us */}
          <section className="space-y-4 mb-10">
            <article className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-2">
                Contacting Support
              </h2>
              <p className="text-sm text-slate-700 mb-2">
                If you need help and can&apos;t access your account, you can reach our
                team directly by email:
              </p>
              <p className="text-sm mb-3">
                <a
                  href="mailto:support@forgetomorrow.com"
                  className="text-[#FF7043] underline font-medium"
                >
                  support@forgetomorrow.com
                </a>
              </p>
              <p className="text-xs text-slate-500">
                Please include the email you registered with (if applicable) and a
                brief description of what you&apos;re experiencing so we can help you
                faster.
              </p>
            </article>
          </section>

          {/* Common situations */}
          <section className="space-y-4 mb-10">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              Common Situations
            </h2>

            <article className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900 mb-2">
                I can&apos;t sign in
              </h3>
              <p className="text-sm text-slate-700 mb-2">
                If you&apos;re having trouble signing in:
              </p>
              <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                <li>Double-check that you&apos;re using the correct email address.</li>
                <li>
                  If you signed up with a social login (e.g. &quot;Continue with
                  Google&quot;), use the same option again.
                </li>
                <li>
                  Try resetting your password from the sign-in page if that option is
                  available.
                </li>
              </ul>
              <p className="text-xs text-slate-500 mt-3">
                If you still can&apos;t access your account, email us and we&apos;ll
                help you verify your identity and restore access where possible.
              </p>
            </article>

            <article className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900 mb-2">
                I haven&apos;t created an account yet
              </h3>
              <p className="text-sm text-slate-700 mb-2">
                You can create a ForgeTomorrow account from our main site when sign-up
                is available. If you have questions about eligibility, pricing, or how
                it works before you join, feel free to contact us.
              </p>
              <p className="text-sm text-slate-700">
                We can help you understand which role (Seeker, Coach, Recruiter, or
                Admin) is the best fit before you get started.
              </p>
            </article>

            <article className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900 mb-2">
                I have a question about privacy or data
              </h3>
              <p className="text-sm text-slate-700 mb-2">
                For questions about how we handle your data, please review our{" "}
                <a href="/privacy" className="text-[#FF7043] underline">
                  Privacy Policy
                </a>{" "}
                and{" "}
                <a href="/subprocessors" className="text-[#FF7043] underline">
                  Sub-processors
                </a>{" "}
                page.
              </p>
              <p className="text-sm text-slate-700">
                If you still have concerns or need clarification, reach out to us by
                email and we&apos;ll be happy to provide more detail.
              </p>
            </article>
          </section>

          {/* For signed-in users */}
          <section className="space-y-4 mb-4">
            <h2 className="text-xl font-semibold text-slate-900">
              If You Already Have a ForgeTomorrow Account
            </h2>

            <article className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900 mb-2">
                In-app Support
              </h3>
              <p className="text-sm text-slate-700 mb-2">
                When you&apos;re signed in, you&apos;ll see a Support area inside the
                platform where you can get more personalized help and guidance.
              </p>
              <p className="text-sm text-slate-700">
                If you&apos;re unable to access that Support area because you can&apos;t
                log in, this Help Center page and our email address are your best
                options to reach us.
              </p>
            </article>
          </section>
        </main>
      </div>
    </>
  );
}
