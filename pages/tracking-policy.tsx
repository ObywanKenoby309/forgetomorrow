import Head from "next/head";
import Link from "next/link";

export default function TrackingPolicy() {
  return (
    <>
      <Head>
        <title>Tracking & Cookies Policy | Forge Tomorrow</title>
        <meta
          name="description"
          content="How Forge Tomorrow uses cookies and tracking technologies to improve user experience."
        />
      </Head>

      <main
        className="min-h-screen bg-gray-50 py-12 px-4"
        aria-labelledby="tracking-cookies-heading"
      >
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <h1
            id="tracking-cookies-heading"
            className="text-4xl md:text-5xl font-bold text-orange-600 mb-4"
          >
            FORGE TOMORROW – TRACKING &amp; COOKIES POLICY
          </h1>
          <p className="text-gray-600 mb-10">Last Updated: November 2025</p>

          <div className="prose prose-lg max-w-none text-gray-700 space-y-8">
            {/* 1. Overview */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                1. Overview
              </h2>
              <p className="mt-4">
                This Tracking &amp; Cookies Policy explains how Forge Tomorrow (“we,”
                “us,” “our”) uses cookies and similar tracking technologies to
                provide, secure, and improve our Services.
              </p>
            </section>

            {/* 2. What Are Cookies */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                2. What Are Cookies?
              </h2>
              <p className="mt-4">
                Cookies are small text files that are stored on your device when
                you visit a website. They help us remember your preferences,
                analyze how you use the platform, and enhance your experience.
              </p>
            </section>

            {/* 3. Types of Cookies We Use */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                3. Types of Cookies We Use
              </h2>

              <h3 className="text-xl font-medium mt-6">3.1 Essential Cookies</h3>
              <p className="mt-2">
                Required for the platform to function. These cannot be disabled.
              </p>

              <h3 className="text-xl font-medium mt-6">3.2 Performance Cookies</h3>
              <p className="mt-2">
                Help us understand how users navigate the site to improve
                functionality.
              </p>

              <h3 className="text-xl font-medium mt-6">3.3 Analytics Cookies</h3>
              <p className="mt-2">
                Used to measure traffic, usage patterns, and site performance.
                For example: page views, session duration, and user flow.
              </p>

              <h3 className="text-xl font-medium mt-6">3.4 Preference Cookies</h3>
              <p className="mt-2">
                Store your settings such as theme, language, or account
                preferences.
              </p>

              <h3 className="text-xl font-medium mt-6">3.5 Security Cookies</h3>
              <p className="mt-2">
                Used to detect and prevent malicious activity, including
                unauthorized login attempts.
              </p>
            </section>

            {/* 4. Third-Party Cookies */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                4. Third-Party Cookies
              </h2>
              <p className="mt-4">
                We may use trusted third-party services (such as analytics or
                payment processors) that place their own cookies or tracking
                scripts. These parties are bound by their own privacy policies.
              </p>
            </section>

            {/* 5. Pixels, Tags, and Other Tracking */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                5. Pixels, Tags, and Other Tracking
              </h2>
              <p className="mt-4">
                We may use pixels or tags to measure engagement, confirm email
                deliverability, or evaluate feature usage. This data is
                aggregated and not used to personally identify users.
              </p>
            </section>

            {/* 6. Your Choices */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                6. Your Choices &amp; Controls
              </h2>
              <p className="mt-4">
                You may disable non-essential cookies in your browser settings.
                Essential cookies cannot be disabled, as they are required for
                core site functionality.
              </p>
            </section>

            {/* 7. Updates */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                7. Updates to This Policy
              </h2>
              <p className="mt-4">
                We may update this Policy to reflect changes in law or
                technology. If updates are significant, we will provide notice.
              </p>
            </section>

            {/* 8. Contact */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                8. Contact
              </h2>
              <p className="mt-4">
                For questions about this Policy:
                <br />
                Email:{" "}
                <a
                  href="mailto:legal@forgetomorrow.com"
                  className="text-orange-600 underline"
                >
                  legal@forgetomorrow.com
                </a>
              </p>
            </section>
          </div>

          <div className="mt-16 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
            <Link href="/" className="text-orange-600 hover:underline">
              ← Back to Forge Tomorrow
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
