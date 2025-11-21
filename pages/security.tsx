// pages/security.tsx
import Head from 'next/head';
import Link from 'next/link';

export default function Security() {
  return (
    <>
      <Head>
        <title>Security | Forge Tomorrow</title>
        <meta name="description" content="Forge Tomorrow Security Statement" />
      </Head>

      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <h1 className="text-4xl md:text-5xl font-bold text-orange-600 mb-4">
            FORGE TOMORROW – SECURITY STATEMENT
          </h1>
          <p className="text-gray-600 mb-10">Last Updated: November 2025</p>

          <div className="prose prose-lg max-w-none text-gray-700 space-y-8">

            {/* 1. Infrastructure Security */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                1. Infrastructure Security
              </h2>
              <p className="mt-4">
                ForgeTomorrow operates on secure, modern cloud infrastructure designed with isolation, redundancy,
                and strict access controls to protect all user data.
              </p>
              <ul className="list-disc pl-8 mt-4 space-y-2">
                <li>Hosted on AWS with hardened environments</li>
                <li>Strict IAM roles built on least-privilege principles</li>
                <li>Continuous infrastructure monitoring</li>
                <li>Automated alerting for suspicious events</li>
                <li>Separated production, staging, and development environments</li>
                <li>Encrypted backups with secure retention policies</li>
              </ul>
            </section>

            {/* 2. Data Protection */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                2. Data Protection
              </h2>
              <p className="mt-4">
                We safeguard all personal and sensitive information with strong encryption and industry-leading confidentiality practices.
              </p>
              <ul className="list-disc pl-8 mt-4 space-y-2">
                <li>TLS 1.2+ encryption for all data in transit</li>
                <li>AES-256 encryption for data at rest</li>
                <li>No selling or sharing of personal data with advertisers</li>
                <li>Role-based internal access and audit logging</li>
                <li>Secure credential hashing and salting</li>
              </ul>
            </section>

            {/* 3. Application Security */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                3. Application Security
              </h2>
              <p className="mt-4">
                We design our platform using secure development practices that protect against modern threats.
              </p>
              <ul className="list-disc pl-8 mt-4 space-y-2">
                <li>Automated static and dynamic application security scanning</li>
                <li>Peer-reviewed code before all production merges</li>
                <li>OWASP-aligned secure coding standards</li>
                <li>Rate limiting and bot detection on critical endpoints</li>
                <li>Strict origin checks and HTTPS enforcement</li>
              </ul>
            </section>

            {/* 4. Testing & Vulnerability Management */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                4. Testing & Vulnerability Management
              </h2>
              <p className="mt-4">
                We continuously test and validate the security posture of ForgeTomorrow.
              </p>
              <ul className="list-disc pl-8 mt-4 space-y-2">
                <li>Automated dependency and package vulnerability scanning</li>
                <li>Regular third-party penetration testing</li>
                <li>Scheduled internal security audits</li>
                <li>Rapid patching and remediation for critical CVEs</li>
              </ul>
            </section>

            {/* 5. Access Control & Authentication */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                5. Access Control & Authentication
              </h2>
              <p className="mt-4">
                We take strong measures to secure user authentication and internal production access.
              </p>
              <ul className="list-disc pl-8 mt-4 space-y-2">
                <li>MFA required for all ForgeTomorrow administrative accounts</li>
                <li>Just-in-time access policies for production environments</li>
                <li>Session lifetime enforcement and secure cookies</li>
                <li>No plaintext storage of user credentials</li>
              </ul>
            </section>

            {/* 6. Compliance & Best Practices */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                6. Compliance & Best Practices
              </h2>
              <p className="mt-4">
                ForgeTomorrow aligns with recognized global standards for security and privacy.
              </p>
              <ul className="list-disc pl-8 mt-4 space-y-2">
                <li>SOC 2, ISO 27001, and NIST-aligned controls</li>
                <li>GDPR-respectful data handling policies</li>
                <li>Periodic internal and external audits</li>
                <li>Vendor security assessments for integrated technologies</li>
              </ul>
            </section>

            {/* 7. Reporting Security Issues */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                7. Reporting Security Issues
              </h2>
              <p className="mt-4">
                We welcome responsible disclosure from researchers, users, and partners.
              </p>
              <p className="mt-4">
                If you believe you’ve discovered a vulnerability, please contact us at:{' '}
                <a
                  href="mailto:security@forgetomorrow.com"
                  className="text-orange-600 underline"
                >
                  security@forgetomorrow.com
                </a>
              </p>
              <p className="mt-4">
                Please avoid public disclosure until our team confirms and resolves the issue.
              </p>
            </section>

            {/* 8. Our Commitment */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                8. Our Commitment
              </h2>
              <p className="mt-4">
                Security is an ongoing commitment. As ForgeTomorrow grows, we will continue investing in tools,
                auditing, infrastructure, and processes to keep user information protected.
              </p>
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
