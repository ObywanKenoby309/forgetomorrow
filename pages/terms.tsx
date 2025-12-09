// pages/terms.tsx
import Head from 'next/head';
import Link from 'next/link';

export default function Terms() {
  return (
    <>
      <Head>
        <title>Terms of Service | Forge Tomorrow</title>
        <meta name="description" content="Forge Tomorrow Terms of Service" />
      </Head>

      <main
        className="min-h-screen bg-gray-50 py-12 px-4"
        aria-labelledby="terms-of-service-heading"
      >
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <h1
            id="terms-of-service-heading"
            className="text-4xl md:text-5xl font-bold text-orange-600 mb-4"
          >
            FORGE TOMORROW – TERMS OF SERVICE
          </h1>
          <p className="text-gray-600 mb-10">Last Updated: December 2025</p>

          <div className="prose prose-lg max-w-none text-gray-700 space-y-8">
            {/* 1. Introduction */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">1. Introduction</h2>
              <p className="mt-4">
                Welcome to Forge Tomorrow (“we,” “us,” “our”). These Terms of Service
                (“Terms”) govern your access to and use of the Forge Tomorrow platform,
                including our website, messaging tools, AI-powered features, and
                related services (collectively, the “Services”).
              </p>
              <p className="mt-4">
                By creating an account or using our Services, you agree to these Terms.
                If you do not agree, you may not use the Services.
              </p>
              <p className="mt-4">
                Forge Tomorrow is a professional networking and career development
                platform that allows users to create profiles, share professional
                information, upload content, interact with others, and access
                AI-powered analytics and recommendations.
              </p>
            </section>

            {/* 2. Eligibility */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">2. Eligibility</h2>
              <p className="mt-4">To use the Services, you must:</p>
              <ul className="list-disc pl-8 mt-4 space-y-2">
                <li>
                  Be at least 16 years old (or the minimum digital consent age in your
                  region).
                </li>
                <li>Provide accurate and truthful account information.</li>
                <li>Not be prohibited by applicable laws from using our Services.</li>
                <li>Have authority to bind an entity if registering on its behalf.</li>
              </ul>
              <p className="mt-4">
                We do not knowingly permit individuals under the age of 16 to create an
                account or use the Services. By using the Services, you represent and
                warrant that you meet this minimum age requirement. If we learn that an
                account has been created by someone under 16, we may suspend or
                terminate the account and take reasonable steps to delete associated
                personal information, consistent with our Privacy Policy and applicable
                law.
              </p>
            </section>

            {/* 3. Account Types */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                3. Account Types
              </h2>
              <h3 className="text-xl font-medium mt-6">
                3.1 Free Accounts (“Free Members”)
              </h3>
              <p className="mt-2">
                Free Members can create an account and use essential platform features
                with certain limitations.
              </p>

              <h3 className="text-xl font-medium mt-6">
                3.2 Paid Accounts (“Premium Members”)
              </h3>
              <p className="mt-2">
                Premium Members gain access to expanded features, analytics,
                AI-powered tools, and additional networking capabilities.
              </p>
              <p className="mt-2">Account features may evolve over time.</p>
            </section>

            {/* 4. Subscriptions, Billing, and Refunds */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                4. Subscriptions, Billing, and Refunds
              </h2>
              <p className="mt-4">
                Premium subscriptions are billed through authorized third-party
                processors (e.g., Stripe).
              </p>
              <ul className="list-disc pl-8 mt-4 space-y-2">
                <li>
                  Subscriptions renew automatically unless canceled before the renewal
                  date.
                </li>
                <li>Prices may change with advance notice.</li>
                <li>Except where required by law, payments are non-refundable.</li>
                <li>
                  Canceling stops future charges but does not refund prior payments.
                </li>
              </ul>
              <p className="mt-4">
                Forge Tomorrow does not store full payment card information.
              </p>
            </section>

            {/* 5. Account Security */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                5. Account Security
              </h2>
              <p className="mt-4">
                You are responsible for maintaining the confidentiality of your login
                credentials and for all activity within your account. Notify us
                immediately of unauthorized access or security concerns.
              </p>
              <p className="mt-4">
                We may suspend or terminate accounts posing security or safety risks.
              </p>
            </section>

            {/* 6. User-Generated Content */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                6. User-Generated Content
              </h2>
              <h3 className="text-xl font-medium mt-6">6.1 Ownership</h3>
              <p className="mt-2">You retain ownership of your User Content.</p>
              <p className="mt-2">
                You grant Forge Tomorrow a worldwide, non-exclusive, royalty-free
                license to host, process, display, and transmit your User Content
                solely to provide and improve the Services.
              </p>

              <h3 className="text-xl font-medium mt-6">6.2 Prohibited Content</h3>
              <p className="mt-2">You agree not to upload or transmit content that is:</p>
              <ul className="list-disc pl-8 mt-4 space-y-1">
                <li>illegal or infringing</li>
                <li>hateful or discriminatory</li>
                <li>harassing or abusive</li>
                <li>sexually explicit</li>
                <li>fraudulent or misleading</li>
                <li>malware or harmful code</li>
                <li>spam or unauthorized advertising</li>
              </ul>
              <p className="mt-4">
                We may remove content that violates these Terms or applicable laws.
              </p>
            </section>

            {/* 7. Acceptable Use */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                7. Acceptable Use
              </h2>
              <p className="mt-4">
                You agree to use the Services only for lawful, professional purposes
                and to respect the rights and safety of other users.
              </p>
              <p className="mt-4">
                You may not attempt to circumvent security, scrape large volumes of
                data, or misuse the platform for harassment, spam, or discrimination.
              </p>
            </section>

            {/* 8. AI Features */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">8. AI Features</h2>
              <p className="mt-4">
                Forge Tomorrow provides AI-powered tools to assist with career
                insights, profile optimization, analytics, and recommendations.
              </p>
              <p className="mt-4">
                AI outputs are suggestions only and should not be interpreted as
                guarantees, legal advice, or financial advice. You are responsible for
                evaluating information and making your own decisions.
              </p>
              <p className="mt-4">
                You agree not to use AI outputs to generate unlawful, discriminatory,
                hateful, or misleading content.
              </p>
            </section>

            {/* 9. Intellectual Property */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                9. Intellectual Property
              </h2>
              <p className="mt-4">
                The Services, including our logos, trademarks, layouts, designs,
                software, and content (excluding User Content), are owned by or
                licensed to Forge Tomorrow and are protected by intellectual property
                laws.
              </p>
              <p className="mt-4">
                You may not copy, modify, distribute, or create derivative works from
                our proprietary materials without prior written consent.
              </p>
            </section>

            {/* 10. Third-Party Services */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                10. Third-Party Services
              </h2>
              <p className="mt-4">
                Our Services may integrate with or link to third-party sites,
                applications, or services. We are not responsible for their content,
                policies, or availability.
              </p>
              <p className="mt-4">
                Your use of third-party services is governed by their own terms and
                privacy policies.
              </p>
            </section>

            {/* 11. Disclaimers */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">11. Disclaimers</h2>
              <p className="mt-4">
                The Services are provided on an “as is” and “as available” basis without
                warranties of any kind, whether express or implied, including
                warranties of merchantability, fitness for a particular purpose, or
                non-infringement.
              </p>
              <p className="mt-4">
                We do not guarantee that the Services will be uninterrupted, secure, or
                error-free, or that results obtained through the Services will be
                accurate or reliable.
              </p>
            </section>

            {/* 12. Limitation of Liability */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                12. Limitation of Liability
              </h2>
              <p className="mt-4">
                To the fullest extent permitted by law, Forge Tomorrow and its
                directors, officers, employees, and affiliates will not be liable for
                any indirect, incidental, special, consequential, or punitive damages,
                or any loss of profits or revenues, arising out of or related to your
                use of the Services.
              </p>
              <p className="mt-4">
                Our total liability for any claims arising out of or relating to the
                Services is limited to the amount you paid us (if any) for use of the
                Services in the 12 months preceding the event giving rise to the
                claim.
              </p>
            </section>

            {/* 13. Indemnification */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                13. Indemnification
              </h2>
              <p className="mt-4">
                You agree to indemnify and hold harmless Forge Tomorrow and its
                affiliates from any claims, damages, losses, or expenses (including
                reasonable attorneys’ fees) arising out of or related to:
              </p>
              <ul className="list-disc pl-8 mt-4 space-y-1">
                <li>Your use of the Services</li>
                <li>Your User Content</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any law or third-party rights</li>
              </ul>
            </section>

            {/* 14. Termination */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">14. Termination</h2>
              <p className="mt-4">
                We may suspend or terminate your access to the Services at any time,
                with or without notice, if we believe you have violated these Terms,
                posed a security risk, or engaged in fraudulent or harmful activity.
              </p>
              <p className="mt-4">
                You may stop using the Services at any time. Certain provisions of
                these Terms will survive termination, including those relating to
                intellectual property, disclaimers, limitations of liability, and
                indemnification.
              </p>
            </section>

            {/* 15. Governing Law and Dispute Resolution */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                15. Governing Law and Dispute Resolution
              </h2>
              <p className="mt-4">
                These Terms are governed by the laws of the State of Tennessee, USA,
                without regard to conflict of law principles.
              </p>
              <p className="mt-4">
                Any disputes arising out of or relating to these Terms or the Services
                will be resolved through good-faith negotiations. If unresolved, they
                will be submitted to the exclusive jurisdiction of the state and
                federal courts located in Tennessee, USA, unless otherwise required by
                applicable law.
              </p>
            </section>

            {/* 16. Changes to These Terms */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                16. Changes to These Terms
              </h2>
              <p className="mt-4">
                We may update these Terms from time to time. When we make material
                changes, we will provide notice (for example, by email, in-app message,
                or a prominent notice on our site) before the changes take effect.
              </p>
              <p className="mt-4">
                Your continued use of the Services after the updated Terms become
                effective constitutes your acceptance of the changes.
              </p>
            </section>

            {/* 17. Contact */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">17. Contact</h2>
              <p className="mt-4">
                For questions regarding these Terms:
                <br />
                Email:{' '}
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
