// pages/subprocessors.tsx
import Head from 'next/head';
import Link from 'next/link';

export default function Subprocessors() {
  return (
    <>
      <Head>
        <title>Sub-processors | Forge Tomorrow</title>
        <meta
          name="description"
          content="List of third-party sub-processors used by Forge Tomorrow to operate the platform."
        />
      </Head>

      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-bold text-orange-600 mb-4">
            Forge Tomorrow – Sub-processors
          </h1>
          <p className="text-gray-600 mb-6">
            Last updated: <span className="font-medium">November 26, 2025</span>
          </p>

          <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
            <section>
              <p>
                We work with carefully selected third-party service providers
                (&quot;sub-processors&quot;) to help us operate, secure, and improve
                the Forge Tomorrow platform. These sub-processors may process limited
                personal data on our behalf and are contractually required to:
              </p>
              <ul className="list-disc pl-8 mt-3 space-y-1">
                <li>Use the data only to provide services to Forge Tomorrow</li>
                <li>Maintain appropriate security and confidentiality measures</li>
                <li>Comply with applicable privacy and data protection laws</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                Current Sub-processors
              </h2>
              <p className="mt-3">
                The table below lists our current sub-processors, the purpose of their
                processing, the type of data involved, and their primary processing
                locations.
              </p>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-gray-900">
                        Service
                      </th>
                      <th className="px-4 py-3 font-semibold text-gray-900">
                        Purpose
                      </th>
                      <th className="px-4 py-3 font-semibold text-gray-900">
                        Data processed
                      </th>
                      <th className="px-4 py-3 font-semibold text-gray-900">
                        Location
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-gray-200">
                      <td className="px-4 py-3 align-top">Vercel</td>
                      <td className="px-4 py-3 align-top">
                        Frontend hosting &amp; serverless functions
                      </td>
                      <td className="px-4 py-3 align-top">
                        Logs, IP addresses, request metadata
                      </td>
                      <td className="px-4 py-3 align-top">USA</td>
                    </tr>
                    <tr className="border-t border-gray-200">
                      <td className="px-4 py-3 align-top">Railway</td>
                      <td className="px-4 py-3 align-top">
                        Background jobs &amp; scheduled tasks
                      </td>
                      <td className="px-4 py-3 align-top">
                        Job payloads (limited to task requirements)
                      </td>
                      <td className="px-4 py-3 align-top">USA</td>
                    </tr>
                    <tr className="border-t border-gray-200">
                      <td className="px-4 py-3 align-top">Supabase</td>
                      <td className="px-4 py-3 align-top">
                        Database &amp; file storage
                      </td>
                      <td className="px-4 py-3 align-top">
                        Application data, including user records and files (encrypted
                        at rest)
                      </td>
                      <td className="px-4 py-3 align-top">USA</td>
                    </tr>
                    <tr className="border-t border-gray-200">
                      <td className="px-4 py-3 align-top">Stripe</td>
                      <td className="px-4 py-3 align-top">Payment processing</td>
                      <td className="px-4 py-3 align-top">
                        Billing information, transaction details (no full card numbers)
                      </td>
                      <td className="px-4 py-3 align-top">USA</td>
                    </tr>
                    <tr className="border-t border-gray-200">
                      <td className="px-4 py-3 align-top">OpenAI</td>
                      <td className="px-4 py-3 align-top">
                        AI features (resume builder, insights, support, etc.)
                      </td>
                      <td className="px-4 py-3 align-top">
                        Only the text and content you explicitly send to AI features
                      </td>
                      <td className="px-4 py-3 align-top">USA</td>
                    </tr>
                    <tr className="border-t border-gray-200">
                      <td className="px-4 py-3 align-top">Grok / xAI</td>
                      <td className="px-4 py-3 align-top">
                        Optional / experimental AI features
                      </td>
                      <td className="px-4 py-3 align-top">
                        Only the text you explicitly send to experimental AI features
                      </td>
                      <td className="px-4 py-3 align-top">USA</td>
                    </tr>
                    <tr className="border-t border-gray-200">
                      <td className="px-4 py-3 align-top">Groq</td>
                      <td className="px-4 py-3 align-top">
                        AI inference (performance and speed testing)
                      </td>
                      <td className="px-4 py-3 align-top">
                        Only the text you explicitly send to AI features using Groq
                      </td>
                      <td className="px-4 py-3 align-top">USA</td>
                    </tr>
                    <tr className="border-t border-gray-200">
                      <td className="px-4 py-3 align-top">
                        Zoho Mail / Zoho Workplace
                      </td>
                      <td className="px-4 py-3 align-top">
                        Company &amp; transactional email
                      </td>
                      <td className="px-4 py-3 align-top">
                        Email addresses, message content, metadata
                      </td>
                      <td className="px-4 py-3 align-top">USA / India</td>
                    </tr>
                    <tr className="border-t border-gray-200">
                      <td className="px-4 py-3 align-top">
                        Brevo (formerly Sendinblue)
                      </td>
                      <td className="px-4 py-3 align-top">
                        Newsletters &amp; marketing emails
                      </td>
                      <td className="px-4 py-3 align-top">
                        Email addresses, subscription status, engagement metrics
                      </td>
                      <td className="px-4 py-3 align-top">EU</td>
                    </tr>
                    <tr className="border-t border-gray-200">
                      <td className="px-4 py-3 align-top">EmailJS</td>
                      <td className="px-4 py-3 align-top">
                        Contact forms &amp; system emails
                      </td>
                      <td className="px-4 py-3 align-top">
                        Email addresses, form content, basic metadata
                      </td>
                      <td className="px-4 py-3 align-top">USA</td>
                    </tr>
                    <tr className="border-t border-gray-200">
                      <td className="px-4 py-3 align-top">Cookie-Script.com</td>
                      <td className="px-4 py-3 align-top">
                        Cookie consent management
                      </td>
                      <td className="px-4 py-3 align-top">
                        Consent preferences, country / region signals
                      </td>
                      <td className="px-4 py-3 align-top">EU</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                Changes to This Sub-processor List
              </h2>
              <p className="mt-3">
                We may add or remove sub-processors as our platform evolves. When we
                make material changes to this list that affect how your personal data is
                processed, we will update this page and, where required by law or our
                agreements, notify you in advance or provide an opportunity to object.
              </p>
              <p className="mt-3">
                We review each sub-processor&apos;s security, privacy practices, and
                compliance posture before engagement and periodically thereafter.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                Questions or Concerns
              </h2>
              <p className="mt-3">
                If you have questions about any sub-processor listed here, or how your
                data is shared with them, contact us at{' '}
                <a
                  href="mailto:privacy@forgetomorrow.com"
                  className="text-orange-600 underline"
                >
                  privacy@forgetomorrow.com
                </a>
                .
              </p>
            </section>
          </div>

          <div className="mt-16 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
            <Link href="/privacy" className="text-orange-600 hover:underline">
              ← Back to Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
