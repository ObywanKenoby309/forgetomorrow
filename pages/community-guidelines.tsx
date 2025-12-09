// pages/community-guildelines.tsx
import Head from 'next/head';
import Link from 'next/link';

export default function CommunityGuidelines() {
  return (
    <>
      <Head>
        <title>Community Guidelines | Forge Tomorrow</title>
        <meta
          name="description"
          content="Forge Tomorrow Community Guidelines – Expectations for respectful, professional conduct on our platform."
        />
      </Head>

      <main
        className="min-h-screen bg-gray-50 py-12 px-4"
        aria-labelledby="community-guidelines-heading"
      >
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <h1
            id="community-guidelines-heading"
            className="text-4xl md:text-5xl font-bold text-orange-600 mb-4"
          >
            FORGE TOMORROW – COMMUNITY GUIDELINES
          </h1>
          <p className="text-gray-600 mb-10">Last Updated: December 2025</p>

          <div className="prose prose-lg max-w-none text-gray-700 space-y-8">
            {/* 1. Intro / Scope */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">1. Purpose and Scope</h2>
              <p className="mt-4">
                Forge Tomorrow is a professional community built on dignity, respect, and
                opportunity. These Community Guidelines explain the expectations we have
                for how members engage across the platform—today and as we grow into new
                features like video, events, forums, and mentorship programs.
              </p>
              <p className="mt-4">
                These rules protect our users, our mission, and the integrity of the
                platform. They apply to all activity on Forge Tomorrow, including:
              </p>
              <ul className="list-disc pl-8 mt-3 space-y-1">
                <li>Posts, comments, and replies</li>
                <li>1:1 and group messaging</li>
                <li>Images, videos, and other media uploads</li>
                <li>User-created forms (including AI-assisted forms)</li>
                <li>Discussion forums and community spaces</li>
                <li>Mentorship programs</li>
                <li>Community events (virtual or in-person)</li>
              </ul>
              <p className="mt-4">
                These Guidelines work together with our{' '}
                <Link href="/terms" className="text-orange-600 underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-orange-600 underline">
                  Privacy Policy
                </Link>
                . If there is any conflict, the Terms of Service will control.
              </p>
            </section>

            {/* 2. Who Can Use Forge Tomorrow */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">2. Who Forge Tomorrow Is For</h2>
              <p className="mt-4">
                Forge Tomorrow is a professional platform for individuals{' '}
                <strong>16 years of age or older</strong>.
              </p>
              <p className="mt-4">
                By creating an account, you confirm that you are at least 16 years old
                and that you meet the eligibility requirements in our Terms of Service.
                We may suspend or remove accounts that appear to belong to someone under
                16 or that otherwise violate our eligibility rules.
              </p>
            </section>

            {/* 3. Core Principles */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">3. Core Principles</h2>
              <p className="mt-4">
                Everything on Forge Tomorrow should align with three foundational values:
              </p>
              <h3 className="text-xl font-medium mt-4">3.1 Respect</h3>
              <p className="mt-2">
                Treat others with courtesy. Critique ideas, not people. Assume good faith
                where possible and avoid escalation.
              </p>

              <h3 className="text-xl font-medium mt-4">3.2 Professionalism</h3>
              <p className="mt-2">
                Content and conduct should match the tone of a workplace or professional
                networking environment. This is not a general social network.
              </p>

              <h3 className="text-xl font-medium mt-4">3.3 Safety</h3>
              <p className="mt-2">
                No user should feel threatened, harassed, or unsafe while using the
                platform. We take safety reports seriously and may act quickly when
                there is risk of harm.
              </p>
            </section>

            {/* 4. Behaviors Not Allowed */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                4. Behaviors That Are Not Allowed
              </h2>
              <p className="mt-4">
                To maintain a safe, productive, and inclusive environment, the following
                are prohibited across all areas of Forge Tomorrow.
              </p>

              {/* 4.1 Harassment */}
              <h3 className="text-xl font-medium mt-4">
                4.1 Harassment, Bullying, and Abuse
              </h3>
              <p className="mt-2">Absolutely no:</p>
              <ul className="list-disc pl-8 mt-3 space-y-1">
                <li>Personal attacks, insults, or name-calling</li>
                <li>
                  Mocking or shaming someone’s work history, job status, or background
                </li>
                <li>Coordinated harassment or “dogpiling”</li>
                <li>Pressuring or bullying users to remove posts or content</li>
                <li>Stalking, intimidation, or repeated unwanted contact</li>
                <li>
                  Targeting someone in posts or comments to ridicule or humiliate them
                </li>
              </ul>
              <p className="mt-2">
                Disagreement is allowed. Degrading, shaming, or hounding someone is not.
              </p>

              {/* 4.2 Hate / Discrimination */}
              <h3 className="text-xl font-medium mt-4">
                4.2 Hate, Discrimination, or Attacks on Protected Groups
              </h3>
              <p className="mt-2">
                No content that demeans, attacks, or encourages prejudice against people
                based on:
              </p>
              <ul className="list-disc pl-8 mt-3 space-y-1">
                <li>Race or ethnicity</li>
                <li>National origin or immigration status</li>
                <li>Gender or gender identity</li>
                <li>Sexual orientation</li>
                <li>Age</li>
                <li>Disability or medical condition</li>
                <li>Religion or belief</li>
              </ul>
              <p className="mt-2">We have zero tolerance for hate speech.</p>

              {/* 4.3 NSFW / Sexual */}
              <h3 className="text-xl font-medium mt-4">
                4.3 NSFW, Sexual, or Dating Content
              </h3>
              <p className="mt-2">
                Forge Tomorrow is <strong>not</strong> a dating app or adult platform.
                Our moderation follows a strict restricted mode.
              </p>
              <p className="mt-2">Strictly prohibited:</p>
              <ul className="list-disc pl-8 mt-3 space-y-1">
                <li>Nudity or sexually explicit content</li>
                <li>Sexualized images (AI-generated or real)</li>
                <li>Sexual advances or flirtation in posts or messages</li>
                <li>
                  Dating-oriented posts (for example, “DM me if you’re lonely” or
                  seeking romantic relationships)
                </li>
                <li>Fetish content or sexual innuendo</li>
                <li>Soliciting or sharing explicit images</li>
              </ul>

              {/* 4.4 Violence / Harm */}
              <h3 className="text-xl font-medium mt-4">
                4.4 Violence, Threats, or Harmful Behavior
              </h3>
              <p className="mt-2">Forbidden:</p>
              <ul className="list-disc pl-8 mt-3 space-y-1">
                <li>Threats of violence toward any person or group</li>
                <li>Encouraging self-harm or suicide</li>
                <li>Graphic violent content</li>
                <li>Content glorifying physical harm</li>
              </ul>

              {/* 4.5 Scams / Fraud */}
              <h3 className="text-xl font-medium mt-4">
                4.5 Scams, Deception, or Fraud
              </h3>
              <p className="mt-2">
                To protect job seekers and professionals, the following are prohibited:
              </p>
              <ul className="list-disc pl-8 mt-3 space-y-1">
                <li>Fake or misleading job postings</li>
                <li>Attempts to harvest resumes or personal information</li>
                <li>Phishing links or schemes</li>
                <li>Pyramid schemes or MLM recruiting</li>
                <li>
                  “Guaranteed job if you buy my course” or other manipulative claims
                </li>
                <li>Misrepresenting your identity or impersonating someone</li>
              </ul>
              <p className="mt-2">
                Fraud and clear bad-faith behavior may result in immediate and
                permanent removal.
              </p>

              {/* 4.6 Spam */}
              <h3 className="text-xl font-medium mt-4">4.6 Spam and Platform Abuse</h3>
              <p className="mt-2">Not allowed:</p>
              <ul className="list-disc pl-8 mt-3 space-y-1">
                <li>Mass unsolicited DMs or repeated sales pitches</li>
                <li>Posting the same advertisement repeatedly across areas</li>
                <li>Excessive, irrelevant self-promotion</li>
                <li>Automated scraping or data harvesting</li>
                <li>
                  Creating multiple accounts to evade moderation, blocks, or bans
                </li>
              </ul>

              {/* 4.7 Privacy */}
              <h3 className="text-xl font-medium mt-4">4.7 Privacy Violations</h3>
              <p className="mt-2">Strictly prohibited:</p>
              <ul className="list-disc pl-8 mt-3 space-y-1">
                <li>
                  Sharing someone’s private information (addresses, phone numbers,
                  personal email, etc.)
                </li>
                <li>Doxxing or enabling others to find private information</li>
                <li>
                  Posting screenshots of private messages without consent (unless used
                  to report abuse)
                </li>
                <li>
                  Sharing confidential company information or trade secrets that you are
                  not authorized to disclose
                </li>
              </ul>

              {/* 4.8 IP */}
              <h3 className="text-xl font-medium mt-4">
                4.8 Intellectual Property Violations
              </h3>
              <p className="mt-2">Do not post:</p>
              <ul className="list-disc pl-8 mt-3 space-y-1">
                <li>Content you do not own or have rights to use</li>
                <li>Pirated materials, full copyrighted articles, or stolen designs</li>
                <li>
                  AI-generated images of real people without their consent, especially
                  when misleading or harmful
                </li>
              </ul>
            </section>

            {/* 5. Rules for Specific Features */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                5. Rules for Specific Features
              </h2>

              <h3 className="text-xl font-medium mt-4">5.1 Posts and Comments</h3>
              <ul className="list-disc pl-8 mt-3 space-y-1">
                <li>Keep discussions professional and career-adjacent</li>
                <li>Provide constructive feedback rather than personal attacks</li>
                <li>
                  Avoid “callout” posts targeting individuals, especially other users
                </li>
              </ul>

              <h3 className="text-xl font-medium mt-4">5.2 Messaging</h3>
              <p className="mt-2">
                Private messages are still subject to these Guidelines. Not allowed:
              </p>
              <ul className="list-disc pl-8 mt-3 space-y-1">
                <li>Harassment or unwanted romantic contact</li>
                <li>Offensive or inappropriate proposals</li>
                <li>
                  Repeated messages after someone has clearly disengaged or asked you to
                  stop
                </li>
              </ul>
              <p className="mt-2">
                Messages are not actively monitored, but they may be reviewed if they
                are reported for abuse or safety concerns.
              </p>

              <h3 className="text-xl font-medium mt-4">
                5.3 User-Created Forms and Surveys
              </h3>
              <ul className="list-disc pl-8 mt-3 space-y-1">
                <li>
                  Forms cannot be used to harvest sensitive personal, financial, or
                  authentication information (for example, SSNs, full payment card
                  details, or passwords).
                </li>
                <li>
                  Forms must make it clear who is collecting the information and for
                  what purpose.
                </li>
                <li>
                  AI-assisted forms are treated as user-generated content and must also
                  follow these Guidelines.
                </li>
              </ul>

              <h3 className="text-xl font-medium mt-4">5.4 Images and Video</h3>
              <p className="mt-2">Allowed examples include:</p>
              <ul className="list-disc pl-8 mt-3 space-y-1">
                <li>Professional headshots and portfolio work</li>
                <li>Workspaces, events, or job-related visuals</li>
              </ul>
              <p className="mt-2">Not allowed:</p>
              <ul className="list-disc pl-8 mt-3 space-y-1">
                <li>NSFW or sexual content</li>
                <li>Graphic or violent imagery</li>
                <li>Deepfakes or misleading edited media</li>
              </ul>

              <h3 className="text-xl font-medium mt-4">
                5.5 Events, Forums, and Mentorship Programs
              </h3>
              <p className="mt-2">
                These Guidelines apply equally to all future community areas. Hosts,
                mentors, and forum leaders are expected to model:
              </p>
              <ul className="list-disc pl-8 mt-3 space-y-1">
                <li>Professional behavior and tone</li>
                <li>Respectful, inclusive communication</li>
                <li>Zero tolerance for harassment or exploitation</li>
              </ul>
              <p className="mt-2">
                Community spaces that become hostile or unsafe may be moderated,
                restricted, or closed.
              </p>
            </section>

            {/* 6. Crisis Support */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">6. Crisis Support</h2>
              <p className="mt-4">
                Forge Tomorrow is not a crisis hotline and cannot provide emergency
                mental-health support.
              </p>
              <p className="mt-4">
                If you or someone you know is in immediate danger or experiencing
                thoughts of self-harm:
              </p>
              <ul className="list-disc pl-8 mt-3 space-y-1">
                <li>
                  In the United States, contact the{' '}
                  <strong>988 Suicide &amp; Crisis Lifeline</strong> (available 24/7).
                </li>
                <li>
                  Outside the United States, contact your local emergency services or
                  visit the{' '}
                  <a
                    href="https://www.iasp.info/crisis-centres-helplines/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-600 underline"
                  >
                    International Association for Suicide Prevention
                  </a>{' '}
                  website for a list of international crisis helplines.
                </li>
              </ul>
              <p className="mt-4">
                If you notice posts or messages that suggest someone may be in crisis,
                please report them through the platform (where available) or email us at{' '}
                <a
                  href="mailto:support@forgetomorrow.com"
                  className="text-orange-600 underline"
                >
                  support@forgetomorrow.com
                </a>
                .
              </p>
            </section>

            {/* 7. Reporting */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                7. Reporting Violations
              </h2>
              <p className="mt-4">
                If you see content or behavior that may violate these Community
                Guidelines—including harassment, bullying, scams, harmful content, or
                safety concerns—you can report the post or message directly through the
                platform (where available).
              </p>
              <p className="mt-4">
                You may also contact us at{' '}
                <a
                  href="mailto:support@forgetomorrow.com"
                  className="text-orange-600 underline"
                >
                  support@forgetomorrow.com
                </a>{' '}
                with a link or description of the issue.
              </p>
              <p className="mt-4">Please report:</p>
              <ul className="list-disc pl-8 mt-3 space-y-1">
                <li>Harassment, abusive behavior, or bullying</li>
                <li>Threats of violence or self-harm</li>
                <li>Inappropriate or NSFW content</li>
                <li>Scams, impersonation, or fraudulent job postings</li>
                <li>Hate speech or discrimination</li>
                <li>Privacy violations (such as doxxing)</li>
                <li>Any behavior that makes the platform unsafe or unprofessional</li>
              </ul>
              <p className="mt-4">
                We review reports as quickly as we reasonably can. Abuse of the report
                system (for example, reporting content in bad faith) is also a
                violation of these Guidelines.
              </p>
            </section>

            {/* 8. Enforcement */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">8. Enforcement</h2>
              <p className="mt-4">
                Depending on the severity and frequency of violations, actions may
                include:
              </p>
              <ul className="list-disc pl-8 mt-3 space-y-1">
                <li>Content removal or editing</li>
                <li>Limits on posting, commenting, or messaging</li>
                <li>Temporary suspension of account access</li>
                <li>Permanent account bans</li>
                <li>
                  Referral to appropriate authorities where we are legally required or
                  where there is a serious risk of harm
                </li>
              </ul>
              <p className="mt-4">
                Moderation may include automated detection systems, but final
                enforcement decisions may involve human review, especially when
                decisions could significantly affect a user’s account or livelihood.
              </p>
              <p className="mt-4">
                We reserve the right to take action without prior warning when safety,
                security, or legal obligations require it.
              </p>
            </section>

            {/* 9. Appeals */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">9. Appeals</h2>
              <p className="mt-4">
                If you believe moderation action was taken in error, you may email{' '}
                <a
                  href="mailto:support@forgetomorrow.com"
                  className="text-orange-600 underline"
                >
                  support@forgetomorrow.com
                </a>{' '}
                with details of the decision and why you believe it was incorrect.
              </p>
              <p className="mt-4">
                Not all moderation decisions are eligible for appeal, but clear
                mistakes will be reviewed.
              </p>
            </section>

            {/* 10. Updates */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                10. Updates to These Guidelines
              </h2>
              <p className="mt-4">
                These Guidelines will evolve as Forge Tomorrow grows. When major
                updates occur, we will post a notice and update the “Last Updated”
                date at the top of this page.
              </p>
              <p className="mt-4">
                Your continued use of the platform after changes are published
                constitutes acceptance of the updated Guidelines.
              </p>
            </section>

            {/* 11. Closing */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                11. Building This Community Together
              </h2>
              <p className="mt-4">
                Following these Guidelines helps ensure Forge Tomorrow remains a
                supportive, empowering place for job seekers, professionals, mentors,
                recruiters, and the communities we are building together.
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
