// pages/accessibility.tsx  ← FINAL, A11Y-ENHANCED
import Head from "next/head";

export default function Accessibility() {
  return (
    <>
      <Head>
        <title>Accessibility at Forge Tomorrow</title>
        <meta
          name="description"
          content="Forge Tomorrow is committed to WCAG 2.2 AA compliance and building a platform everyone can use."
        />
      </Head>

      <main
        className="min-h-screen bg-gray-50 py-20 px-6"
        aria-labelledby="accessibility-heading"
      >
        <div className="max-w-4xl mx-auto">
          <h1
            id="accessibility-heading"
            className="text-5xl md:text-6xl font-bold text-[#FF7043] mb-8"
          >
            Accessibility at Forge Tomorrow
          </h1>

          <section className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-10 prose prose-lg max-w-none">
            <p className="text-xl text-gray-700 leading-relaxed mb-8">
              We believe every job seeker deserves a fair shot — regardless of ability.
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Our Commitment
            </h2>
            <p className="text-gray-700 text-lg leading-relaxed mb-8">
              Forge Tomorrow is designed from the ground up to meet <strong>WCAG 2.2 Level AA</strong> standards — and we’re pushing toward <strong>400% zoom compliance</strong> per EU EN 301 549. 
              This isn’t a checkbox. It’s core to who we are.
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              What We’re Doing Today
            </h2>
            <ul className="list-disc pl-8 space-y-4 text-lg text-gray-700 mb-8">
              <li>Semantic HTML and proper ARIA labels on every interactive element</li>
              <li>Full keyboard navigation (no mouse required)</li>
              <li>High-contrast mode and color-blind safe palettes</li>
              <li>Alt text for all meaningful images and icons</li>
              <li>Resizable text up to 400% without breaking layout</li>
              <li>Screen reader tested with VoiceOver, NVDA, and JAWS</li>
            </ul>

            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              What’s Coming
            </h2>
            <ul className="list-disc pl-8 space-y-4 text-lg text-gray-700 mb-10">
              <li>Dark mode toggle (Q1 2026)</li>
              <li>User-controlled text spacing and font options</li>
              <li>Sign-language video guides for key features</li>
              <li>Third-party accessibility audit and VPAT (2026)</li>
            </ul>

            <div className="bg-orange-50 border-l-4 border-[#FF7043] p-6 rounded-r-lg">
              <p className="text-lg font-medium text-gray-900">
                Have feedback or need help using Forge Tomorrow?
              </p>
              <p className="text-gray-700 mt-2">
                Email us anytime at{" "}
                <a
                  href="mailto:accessibility@forgetomorrow.com"
                  className="text-[#FF7043] underline font-medium"
                >
                  accessibility@forgetomorrow.com
                </a>
              </p>
            </div>
          </section>

          <p className="text-center text-gray-600 italic">
            Last updated: November 2025
          </p>
        </div>
      </main>
    </>
  );
}
