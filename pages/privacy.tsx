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

      <main
        className="min-h-screen bg-gray-50 py-12 px-4"
        aria-labelledby="privacy-policy-heading"
      >
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <h1
            id="privacy-policy-heading"
            className="text-4xl md:text-5xl font-bold text-orange-600 mb-4"
          >
            FORGE TOMORROW – PRIVACY POLICY
          </h1>
          <p className="text-gray-600 mb-10">Last Updated: December 2025</p>

          <div className="prose prose-lg max-w-none text-gray-700 space-y-10">
            {/* 1. Introduction */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">1. Introduction</h2>
              <p className="mt-4">
                This Privacy Policy explains how Forge Tomorrow (&quot;we,&quot;
                &quot;us,&quot; &quot;our&quot;) collects, uses, stores, shares,
                and protects your personal information when you use our website,
                applications, and services (the &quot;Services&quot;).
              </p>
              <p className="mt-4 font-medium">
                We respect your privacy and{' '}
                <span className="text-orange-600">
                  do not sell your personal data
                </span>
                , including as &quot;sale&quot; or &quot;sharing&quot; is defined
                under the GDPR, UK GDPR, or CCPA/CPRA.
              </p>
              <p className="mt-4">
                We also do <strong>not</strong> use behavioral or tracking-based
                advertising. Any ads on our platform are{' '}
                <strong>contextual only</strong> and never involve the sale or
                disclosure of your personal data to advertisers.
              </p>
              <p className="mt-4">This Policy applies to all users worldwide.</p>
            </section>

            {/* 2. Data We Collect */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                2. Data We Collect
              </h2>

              <h3 className="text-xl font-medium mt-6">
                2.1 Information You Provide
              </h3>
              <ul className="list-disc pl-8 mt-3 space-y-1">
                <li>Account data (name, email address, hashed password)</li>
                <li>
                  Professional profile details (bio, skills, work history, links)
                </li>
                <li>
                  Uploaded content (documents, résumé files, portfolios, posts,
                  images)
                </li>
                <li>Messages and communications with other users</li>
                <li>
                  Billing information (processed by PCI-compliant payment
                  processors)
                </li>
              </ul>

              <h3 className="text-xl font-medium mt-6">
                2.2 Automatically Collected Data
              </h3>
              <ul className="list-disc pl-8 mt-3 space-y-1">
                <li>IP address and approximate region</li>
                <li>Browser, device, and operating system details</li>
                <li>Log data and interaction patterns</li>
                <li>Cookies, session tokens, and authentication data</li>
                <li>Anonymous or aggregated usage analytics</li>
              </ul>

              <h3 className="text-xl font-medium mt-6">2.3 Sensitive Data</h3>
              <p className="mt-4">
                Forge Tomorrow does <strong>not</strong> request, collect, or
                process sensitive personal data, including:
              </p>
              <ul className="list-disc pl-8 mt-3 space-y-1">
                <li>Health or medical information (PHI)</li>
                <li>Biometric identifiers (face data, fingerprints, voiceprints)</li>
                <li>Genetic data</li>
                <li>Sexual orientation</li>
                <li>Religious or philosophical beliefs</li>
                <li>Racial or ethnic origin</li>
                <li>Precise geolocation</li>
                <li>Union membership</li>
              </ul>
              <p className="mt-4">
                We do not use facial recognition, voice recognition, or other
                biometric authentication systems. Users should not upload medical
                records or similarly sensitive documents to the platform.
              </p>
            </section>

            {/* 3. How We Use Your Data */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                3. How We Use Your Data
              </h2>
              <p className="mt-4">
                We use your personal data only for legitimate and clearly defined
                purposes:
              </p>
              <ul className="list-disc pl-8 mt-3 space-y-1">
                <li>To provide, operate, and improve the Services</li>
                <li>To enable messaging, networking, and collaboration</li>
                <li>
                  To deliver AI-powered insights, content summaries, and
                  opportunity recommendations
                </li>
                <li>To personalize your experience within the platform</li>
                <li>To process payments and manage subscriptions</li>
                <li>
                  To detect, prevent, and investigate fraud, abuse, or security
                  incidents
                </li>
                <li>To comply with legal obligations</li>
              </ul>

              <h3 className="text-xl font-medium mt-6">
                3.1 Contextual, Non-Tracking Ads
              </h3>
              <p className="mt-4">
                Forge Tomorrow may display{' '}
                <strong>contextual, non-behavioral ads</strong> based solely on the
                page or feature you are using (for example, showing résumé services
                while you are using the Résumé Builder).
              </p>
              <p className="mt-4">These ads:</p>
              <ul className="list-disc pl-8 mt-3 space-y-1">
                <li>Do not use personal or behavioral profiling</li>
                <li>Do not track you across sites or sessions</li>
                <li>Do not use third-party ad pixels or tracking scripts</li>
                <li>Do not share or sell personal data to advertisers</li>
              </ul>
              <p className="mt-4 font-medium text-orange-600">
                We never use interest-based or behavioral advertising.
              </p>
            </section>

            {/* 4. Legal Bases */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                4. Legal Bases for Processing (GDPR &amp; UK GDPR)
              </h2>
              <p className="mt-4">
                Where required by European or UK law, we rely on the following legal
                bases:
              </p>
              <ul className="list-disc pl-8 mt-3 space-y-1">
                <li>
                  <strong>Performance of a contract</strong> – to provide and support
                  the Services you request.
                </li>
                <li>
                  <strong>Your consent</strong> – for optional features such as certain
                  AI tools or non-essential cookies.
                </li>
                <li>
                  <strong>Legitimate interests</strong> – such as securing our
                  Services, preventing fraud, improving functionality, and supporting
                  business operations, when these interests are not overridden by your
                  rights.
                </li>
                <li>
                  <strong>Compliance with legal obligations</strong> – for example,
                  financial record-keeping and responding to lawful requests.
                </li>
              </ul>
            </section>

            {/* 5. Messaging Privacy */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                5. Messaging Privacy
              </h2>
              <p className="mt-4">
                Messages you send through Forge Tomorrow are private and encrypted in
                transit.
              </p>
              <p className="mt-4">
                Automated systems may scan message content only for security, spam, or
                violations of our acceptable use policies.
              </p>
              <p className="mt-4 font-medium">
                We do <span className="text-orange-600">not</span> sell, share, or use
                private messages for advertising or training external AI models.
              </p>
            </section>

            {/* 6. Cookies */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                6. Cookies &amp; Tracking Technologies
              </h2>
              <p className="mt-4">
                We use cookies and similar technologies primarily for:
              </p>
              <ul className="list-disc pl-8 mt-3 space-y-1">
                <li>Authentication and keeping you signed in</li>
                <li>Session management and load balancing</li>
                <li>Security and fraud prevention</li>
                <li>Basic, privacy-preserving performance analytics</li>
              </ul>
              <p className="mt-4">
                We do <strong>not</strong> use third-party advertising or cross-site
                tracking cookies.
              </p>
              <p className="mt-4">
                Users in the EU, UK, and other applicable regions will see a cookie
                consent banner where required by law.
              </p>
            </section>

            {/* 7. AI Data Processing */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                7. AI Data Processing
              </h2>
              <p className="mt-4">
                Our AI features may analyze your profile, posts, and uploaded documents
                to generate insights, summaries, recommendations, or to help match you
                with opportunities. This occurs only when you use those AI features.
              </p>
              <p className="mt-4">
                We minimize the use of identifiable personal data and never train
                third-party generative AI models on your personal data without your
                explicit, opt-in consent.
              </p>
            </section>

            {/* 8. Sharing of Personal Data */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                8. Sharing of Personal Data
              </h2>
              <p className="mt-4">
                We do not sell your personal data and we do not share it for
                advertising or cross-context behavioral advertising purposes under any
                privacy law.
              </p>
              <p className="mt-4">
                We only disclose personal data in the following limited cases:
              </p>
              <ul className="list-disc pl-8 mt-3 space-y-1">
                <li>
                  <strong>Service providers and sub-processors</strong> – trusted
                  third parties under contract with us, who process data solely to
                  help us operate the Services, such as:
                  <ul className="list-disc pl-8 mt-3 space-y-1">
                    <li>
                      Cloud hosting, storage, and infrastructure (e.g., Vercel,
                      Railway, Supabase)
                    </li>
                    <li>Payment and billing processors (e.g., Stripe)</li>
                    <li>
                      Email delivery and messaging (e.g., Zoho Mail / Workplace,
                      Brevo, EmailJS)
                    </li>
                    <li>
                      AI model inference (e.g., OpenAI, Grok/xAI, Groq) – only when
                      you actively use AI features and only with the minimum necessary
                      data
                    </li>
                    <li>
                      Security, cookie consent, and analytics tools (e.g., privacy-
                      preserving analytics, Cookie-Script)
                    </li>
                    <li>
                      Professional advisors (lawyers, accountants, auditors) bound by
                      confidentiality obligations
                    </li>
                  </ul>
                  <p className="mt-3">
                    A complete, up-to-date list of our current sub-processors and the
                    limited data each receives is available at{' '}
                    <Link
                      href="/subprocessors"
                      className="text-orange-600 underline"
                    >
                      forgetomorrow.com/subprocessors
                    </Link>{' '}
                    or by emailing{' '}
                    <a
                      href="mailto:privacy@forgetomorrow.com"
                      className="text-orange-600 underline"
                    >
                      privacy@forgetomorrow.com
                    </a>
                    .
                  </p>
                </li>
                <li>
                  <strong>Other Forge Tomorrow users</strong> – when you choose to
                  interact with them (for example, messaging, sending a connection
                  request, applying to a job, or making your profile or posts public).
                </li>
                <li>
                  <strong>Legal and safety reasons</strong> – when required by law, in
                  response to valid legal process, or to protect the rights, property,
                  or safety of Forge Tomorrow, our users, or the public.
                </li>
                <li>
                  <strong>Corporate transactions</strong> – in connection with a
                  merger, acquisition, financing, or sale of all or part of our
                  business. Where legally feasible, we will provide notice before your
                  data is transferred or becomes subject to a different privacy
                  policy.
                </li>
              </ul>
            </section>

            {/* 9. International Transfers */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                9. International Data Transfers
              </h2>
              <p className="mt-4">
                Your personal data may be transferred to and processed in countries
                other than your own, including the United States. These countries may
                have data protection laws that are different from those in your
                country.
              </p>
              <p className="mt-4">
                Whenever we transfer personal data internationally, we use appropriate
                safeguards such as:
              </p>
              <ul className="list-disc pl-8 mt-3 space-y-1">
                <li>
                  Standard Contractual Clauses (SCCs) approved by the European
                  Commission
                </li>
                <li>
                  Data Privacy Framework participation by certain service providers
                  (where applicable)
                </li>
                <li>
                  Contractual and technical protections with our sub-processors to
                  safeguard your information
                </li>
              </ul>
            </section>

            {/* 10. Data Retention */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                10. Data Retention
              </h2>
              <p className="mt-4">
                We retain personal data only for as long as necessary to fulfill the
                purposes described in this Policy or as required by law.
              </p>
              <p className="mt-4">Typical retention periods include:</p>
              <ul className="list-disc pl-8 mt-3 space-y-1">
                <li>
                  <strong>Account data</strong>: retained while your account is active
                  and for up to 180 days after deletion, to allow for audit, fraud
                  prevention, and backup integrity.
                </li>
                <li>
                  <strong>Messages</strong>: typically retained for up to 2 years
                  after your last activity, to help investigate abuse or security
                  issues.
                </li>
                <li>
                  <strong>Billing records</strong>: retained for up to 7 years to meet
                  tax, audit, and legal requirements.
                </li>
              </ul>
              <p className="mt-4">
                After these periods, data is either securely deleted or irreversibly
                anonymized.
              </p>
            </section>

            {/* 11. Security & MFA */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                11. Security &amp; Multi-Factor Authentication
              </h2>
              <p className="mt-4">
                We use industry-standard technical and organizational measures to
                protect your personal data, including encryption in transit, access
                controls, and infrastructure monitoring.
              </p>
              <p className="mt-4">
                We may offer optional multi-factor authentication (MFA) to add an
                extra layer of security to your account. MFA may use email-based
                verification codes or time-based one-time passcodes (TOTP) generated
                by an authentication app. MFA does not require biometrics or other
                sensitive personal data.
              </p>
            </section>

            {/* 12. Your Privacy Rights */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                12. Your Privacy Rights
              </h2>
              <p className="mt-4">
                Depending on your location and applicable law, you may have some or all
                of the following rights:
              </p>
              <ul className="list-disc pl-8 mt-3 space-y-1">
                <li>Access your personal data</li>
                <li>Correct inaccurate or incomplete data</li>
                <li>Delete your personal data</li>
                <li>Restrict or object to certain processing</li>
                <li>Request data portability</li>
                <li>
                  Withdraw consent where processing is based on consent (this does not
                  affect the lawfulness of processing before withdrawal)
                </li>
                <li>Opt out of AI training use where applicable</li>
                <li>
                  Lodge a complaint with a supervisory authority if you believe your
                  rights have been violated
                </li>
              </ul>
              <p className="mt-4">
                To exercise these rights, contact us at{' '}
                <a
                  href="mailto:privacy@forgetomorrow.com"
                  className="text-orange-600 underline"
                >
                  privacy@forgetomorrow.com
                </a>
                . We will respond within 30 days or within the timeframe required by
                applicable law.
              </p>
              <p className="mt-4">
                <strong>California residents:</strong> You have additional rights under
                the CCPA/CPRA. We do not &quot;sell&quot; or &quot;share&quot; your
                personal information as those terms are defined by the CCPA/CPRA.
              </p>
            </section>

            {/* 13. Children */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">13. Children</h2>
              <p className="mt-4">
                Our Services are not directed to individuals under 16 years of age, and
                we do not knowingly collect personal data from children under 16. When
                you register for an account, you are asked to confirm that you are at
                least 16 years of age. If we learn that we have collected personal data
                from a child under 16, we will take steps to delete that information as
                soon as possible and may suspend or terminate the associated account.
              </p>
              <p className="mt-4">
                If you are a parent or legal guardian and believe that your child has
                provided personal data to us in violation of this Policy, please
                contact us at{' '}
                <a
                  href="mailto:privacy@forgetomorrow.com"
                  className="text-orange-600 underline"
                >
                  privacy@forgetomorrow.com
                </a>{' '}
                so we can review and, where appropriate, delete the information.
              </p>
            </section>

            {/* 14. Changes to This Policy */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                14. Changes to This Policy
              </h2>
              <p className="mt-4">
                We may update this Privacy Policy from time to time to reflect changes
                in our practices, technologies, legal requirements, or other factors.
              </p>
              <p className="mt-4">
                When we make material changes, we will notify you by email, in-app
                notification, or a prominent notice on our website before the changes
                take effect. Where required by law, we will obtain your consent to
                significant changes.
              </p>
            </section>

            {/* 15. Contact Information */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                15. Contact Information
              </h2>
              <p className="mt-4">
                If you have questions, concerns, or requests related to this Privacy
                Policy or your personal data, you can contact us at:
              </p>
              <p className="mt-3">
                Email:{' '}
                <a
                  href="mailto:privacy@forgetomorrow.com"
                  className="text-orange-600 underline"
                >
                  privacy@forgetomorrow.com
                </a>
              </p>
              <p className="mt-3">
                Legal entity: Forge Tomorrow, Inc.
                <br />
                Registered address: PO Box 1034, White House, TN, 37188, USA
              </p>
              <p className="mt-3">
                <span className="font-semibold">Effective Date:</span> December 2025
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
