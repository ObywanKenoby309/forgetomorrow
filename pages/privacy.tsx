// pages/privacy.tsx
import Head from 'next/head';
import Link from 'next/link';

export default function Privacy() {
  return (
    <>
      <Head>
        <title>Privacy Policy | Forge Tomorrow</title>
        <meta
          name="description"
          content="Forge Tomorrow Privacy Policy – We never sell your data, never use behavioral ads, and never train external AI models on your personal information."
        />
      </Head>

      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <h1 className="text-4xl md:text-5xl font-bold text-orange-600 mb-4">
            FORGE TOMORROW – PRIVACY POLICY
          </h1>
          <p className="text-gray-600 mb-10">Last Updated: November 27, 2025</p>

          <div className="prose prose-lg max-w-none text-gray-700 space-y-10">

            {/* 1. Introduction */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">1. Introduction</h2>
              <p className="mt-4">
                This Privacy Policy explains how Forge Tomorrow (“we,” “us,” “our”) 
                collects, uses, stores, shares, and protects your personal information 
                when you use our website, applications, and services (the “Services”).
              </p>
              <p className="mt-4 font-medium">
                We respect your privacy and 
                <span className="text-orange-600"> do not sell your personal data</span>, 
                including as “sale” or “sharing” is defined by privacy laws such as 
                the GDPR, UK GDPR, and CCPA/CPRA.
              </p>
              <p className="mt-4">
                We also do not use tracking-based or behavioral advertising. 
                All ads on Forge Tomorrow are contextual, non-tracking, and never 
                involve the transfer or sale of personal data.
              </p>
              <p className="mt-4">
                This Policy applies to all users worldwide.
              </p>
            </section>

            {/* 2. Data We Collect */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">2. Data We Collect</h2>

              {/* 2.1 Provided Data */}
              <h3 className="text-xl font-medium mt-6">2.1 Information You Provide</h3>
              <ul className="list-disc pl-8 mt-3 space-y-1">
                <li>Account data (name, email, hashed password)</li>
                <li>Professional profile information</li>
                <li>Uploaded content (résumés, documents, portfolios, posts)</li>
                <li>Messages and communications</li>
                <li>Billing and subscription information (processed by PCI-compliant vendors)</li>
              </ul>

              {/* 2.2 Automatically Collected */}
              <h3 className="text-xl font-medium mt-6">2.2 Automatically Collected Data</h3>
              <ul className="list-disc pl-8 mt-3 space-y-1">
                <li>IP address and approximate region</li>
                <li>Device, operating system, and browser details</li>
                <li>Log data and usage patterns</li>
                <li>Cookies and authentication tokens</li>
                <li>Anonymous or aggregated analytics</li>
              </ul>

              {/* 2.3 Sensitive Data */}
              <h3 className="text-xl font-medium mt-6">2.3 Sensitive Data</h3>
              <p className="mt-4">
                Forge Tomorrow does <strong>not</strong> request, collect, or process 
                sensitive categories of personal data, including:
              </p>
              <ul className="list-disc pl-8 mt-3 space-y-1">
                <li>Health or medical information (PHI)</li>
                <li>Biometric identifiers (face templates, fingerprints, voiceprints)</li>
                <li>Genetic data</li>
                <li>Sexual orientation or gender identity data</li>
                <li>Racial or ethnic origin</li>
                <li>Religious or philosophical beliefs</li>
                <li>Precise geolocation</li>
                <li>Union membership</li>
              </ul>
              <p className="mt-4">
                We do not use facial recognition, voice recognition, or other biometric 
                authentication systems. Users should not upload health records or 
                similar sensitive information to the platform.
              </p>
            </section>

            {/* 3. How We Use Your Data */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">3. How We Use Your Data</h2>

              <p className="mt-4">
                We use personal data only for legitimate and clearly defined purposes:
              </p>
              <ul className="list-disc pl-8 mt-3 space-y-1">
                <li>Providing and improving the Services</li>
                <li>Enabling networking, messaging, and collaboration</li>
                <li>Delivering AI insights, summaries, and recommendations</li>
                <li>Processing payments and managing subscriptions</li>
                <li>Preventing fraud, abuse, and security threats</li>
                <li>Complying with legal obligations</li>
              </ul>

              {/* Ads Clarification */}
              <h3 className="text-xl font-medium mt-6">3.1 Contextual, Non-Tracking Ads</h3>
              <p className="mt-4">
                Forge Tomorrow may display <strong>contextual, non-behavioral ads</strong> 
                based solely on the page or feature you are viewing (for example, showing 
                résumé services while using the Résumé Builder).
              </p>
              <p className="mt-4">
                These ads:
              </p>
              <ul className="list-disc pl-8 mt-3 space-y-1">
                <li>Use no personal or behavioral data</li>
                <li>Do not track you across pages or sessions</li>
                <li>Do not involve external ad networks or third-party pixels</li>
                <li>Never share or sell personal data to advertisers</li>
              </ul>

              <p className="mt-6 font-medium text-orange-600">
                We never use behavioral tracking or targeted advertising.
              </p>
            </section>

            {/* 4. Legal Bases (GDPR) */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                4. Legal Bases for Processing (GDPR & UK GDPR)
              </h2>
              <p className="mt-4">
                Where required by law, we rely on:
              </p>
              <ul className="list-disc pl-8 mt-3 space-y-1">
                <li>Performance of a contract</li>
                <li>Your consent (e.g., optional AI or cookies)</li>
                <li>Legitimate interests (e.g., security, fraud prevention)</li>
                <li>Compliance with legal obligations</li>
              </ul>
            </section>

            {/* 5. Messaging Privacy */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">5. Messaging Privacy</h2>
              <p className="mt-4">Messages are private and encrypted in transit.</p>
              <p className="mt-4">
                Automated systems may scan messages only for spam, abuse, and 
                security violations.
              </p>
              <p className="mt-4 font-medium">
                We do <span className="text-orange-600">not</span> sell, share, or 
                use private messages for advertising or training AI.
              </p>
            </section>

            {/* 6. Cookies */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">6. Cookies & Tracking</h2>
              <p className="mt-4">
                We use cookies only for authentication, session management, and 
                security. We do not use tracking or advertising cookies.
              </p>
            </section>

            {/* 7. AI Processing */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">7. AI Data Processing</h2>
              <p className="mt-4">
                AI features may analyze your profile, documents, or posts only 
                when you explicitly use those tools.
              </p>
              <p className="mt-4">
                We <strong>never</strong> use your personal data to train external 
                AI models unless you provide explicit opt-in consent.
              </p>
            </section>

            {/* 8. Sharing Data */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                8. Sharing of Personal Data
              </h2>

              <p className="mt-4">
                We do not sell or share your personal data for advertising. Any 
                ads displayed on Forge Tomorrow are contextual and non-tracking.
              </p>

              <p className="mt-4">
                We disclose personal data only to vetted sub-processors who are 
                contractually required to use data solely to operate our platform:
              </p>

              <ul className="list-disc pl-8 mt-3 space-y-1">
                <li>Cloud hosting (Vercel, Railway, Supabase)</li>
                <li>Payment processing (Stripe)</li>
                <li>Email communication (Zoho Mail, Brevo, EmailJS)</li>
                <li>AI inference (OpenAI, Grok/xAI, Groq)</li>
                <li>Security and cookie consent tools (Cookie-Script)</li>
                <li>Professional advisors (legal, accounting)</li>
              </ul>

              <p className="mt-4">
                A complete, up-to-date list is available at:{' '}
                <a
                  href="/subprocessors"
                  className="text-orange-600 underline"
                >
                  forgetomorrow.com/subprocessors
                </a>
              </p>
            </section>

            {/* 9–15 – kept identical to your draft */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">9. International Transfers</h2>
              <p>… (unchanged from your policy)</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900">10. Data Retention</h2>
              <p>… (unchanged)</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900">11. Security & MFA</h2>
              <p className="mt-4">
                We use industry-standard security, encryption, and access controls.
              </p>
              <p className="mt-4">
                We may offer optional multi-factor authentication (MFA). MFA may use 
                email verification or time-based one-time passcodes (TOTP). 
                MFA does not require biometric or sensitive personal data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900">12. Your Privacy Rights</h2>
              <p>… (unchanged)</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900">13. Children</h2>
              <p>… (unchanged)</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900">14. Changes</h2>
              <p>… (unchanged)</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900">15. Contact</h2>
              <p>… (unchanged)</p>
            </section>

          </div>

          <div className="mt-16 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
            <Link href="/" className="text-orange-600 hover:underline">
              ← Back to Forge Tomorrow
            </Link>
          </div>

        </div>
      </div>
    </>
  );
}
