// pages/features.js
import Head from "next/head";

function Badge({ children, variant = "live" }) {
  const styles =
    variant === "live"
      ? "bg-emerald-500/15 text-emerald-200 border-emerald-400/20"
      : variant === "future"
      ? "bg-amber-500/15 text-amber-200 border-amber-400/20"
      : "bg-slate-500/15 text-slate-200 border-slate-400/20";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide ${styles}`}
    >
      {children}
    </span>
  );
}

function FeatureList({ items }) {
  return (
    <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
      {items.map((t) => (
        <li
          key={t}
          className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-gray-100 backdrop-blur-[10px]"
        >
          {t}
        </li>
      ))}
    </ul>
  );
}

function SectionCard({ title, subtitle, badge, children }) {
  return (
    <section className="w-full rounded-2xl border border-white/20 bg-white/10 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-[12px]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-100">{title}</h2>
          {subtitle ? (
            <p className="mt-2 text-sm leading-relaxed text-gray-200/90">
              {subtitle}
            </p>
          ) : null}
        </div>
        <div className="shrink-0">{badge}</div>
      </div>
      {children}
    </section>
  );
}

export default function Features() {
  const seekerFeatures = [
    "AI resume generator + versioning for different roles",
    "AI cover letter generator (tailored per job)",
    "ATS alignment, keyword matching, and ATS preview",
    "Resume exports: PDF, Word, and plain text",
    "Job tracking: pinned jobs / saved jobs",
    "Application tracking states (track progress end-to-end)",
    "Profile as a resume landing page (public slug page)",
    "Portfolio showcase on profile",
    "Custom profile themes",
  ];

  const messagingFeatures = [
    "Public post feed (community updates and visibility)",
    "Private 1:1 messaging",
    "Coach message center (separate workspace)",
    "Recruiter message center (separate workspace)",
    "Messaging prioritization for coaches and businesses",
    "Bulk messaging / broadcasts for coaches and recruiters",
  ];

  const coachFeatures = [
    "Dedicated coaching advertising feed page",
    "Private coach message center + broadcast tools",
    "Closed scheduling flow (appointment booking)",
    "Posts, profile, and CSAT analytics surfaces",
    "Event hosting and newsletters",
  ];

  const recruiterFeatures = [
    "Job posting board (recruiter-loaded listings)",
    "Applications board (in-platform apply flow)",
    "Verified jobs on-platform (loaded by recruiters)",
    "AI job description builder",
    "Recruiting analytics surfaces",
    "Explainability on candidate recommendations (why they matched)",
    "Private recruiter message center + broadcast tools",
    "Closed scheduling flow (appointments with candidates/contacts)",
  ];

  const platformFeatures = [
    "Role-based workspaces and chrome gating (Seeker / Coach / Recruiter)",
    "Support center and support workflow (human support)",
    "Verified profiles (current: email verification)",
    "Transparency-first experience (no algorithmic gatekeeping as the core value)",
    "Mobile-friendly design across core pages",
  ];

  const roadmapFuture = [
    "Team seats, roles, and org administration (Recruiter Settings org page)",
    "Company profile + branding controls",
    "Compliance & privacy surfaces (expanded policy + controls)",
    "Talent pools / candidate collections",
    "Stronger identity verification (VerifyMe / VerifyID-style as you scale)",
    "Interview simulator",
    "Accomplishment-to-project recommender (turn wins into future project ideas)",
  ];

  return (
    <>
      <Head>
        <title>ForgeTomorrow - Features</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main
        role="main"
        className="
          mx-auto flex min-h-[calc(100vh-100px)] w-full max-w-6xl flex-col
          items-center justify-start px-5 py-14 text-gray-200
          sm:px-6 sm:py-16
        "
      >
        {/* HERO */}
        <div className="w-full text-center">
          <h1 className="text-5xl sm:text-6xl mb-5 tracking-wide text-[#FF7043] drop-shadow-[0_0_10px_rgba(255,112,67,0.9)]">
            Platform Features
          </h1>
          <p className="mx-auto max-w-3xl text-base sm:text-lg leading-relaxed text-gray-200/90">
            ForgeTomorrow is built as a full ecosystem for job seekers, coaches,
            and recruiters. This page lists what’s live today, plus what’s next
            as we scale.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Badge variant="live">LIVE NOW</Badge>
            <Badge variant="future">COMING NEXT</Badge>
            <Badge variant="neutral">NO FLUFF, REAL FEATURES</Badge>
          </div>
        </div>

        {/* GRID */}
        <div className="mt-10 w-full space-y-6">
          <SectionCard
            title="Seeker Tools"
            subtitle="Everything you need to execute a modern job hunt inside one platform."
            badge={<Badge variant="live">LIVE NOW</Badge>}
          >
            <FeatureList items={seekerFeatures} />
          </SectionCard>

          <SectionCard
            title="Messaging and Communication"
            subtitle="Public visibility when you want it. Private, focused communication when it matters."
            badge={<Badge variant="live">LIVE NOW</Badge>}
          >
            <FeatureList items={messagingFeatures} />
          </SectionCard>

          <SectionCard
            title="Coach and Mentor Workspace"
            subtitle="Built to support client work, outreach, scheduling, and growth."
            badge={<Badge variant="live">LIVE NOW</Badge>}
          >
            <FeatureList items={coachFeatures} />
          </SectionCard>

          <SectionCard
            title="Recruiter Workspace"
            subtitle="Job posting, applications, candidate engagement, and explainable matching."
            badge={<Badge variant="live">LIVE NOW</Badge>}
          >
            <FeatureList items={recruiterFeatures} />
          </SectionCard>

          <SectionCard
            title="Platform Foundations"
            subtitle="The trust layer: real support, role-based experiences, and verification."
            badge={<Badge variant="live">LIVE NOW</Badge>}
          >
            <FeatureList items={platformFeatures} />

            <div className="mt-5 rounded-xl border border-white/15 bg-black/20 p-4">
              <p className="text-sm text-gray-200/90 leading-relaxed">
                <span className="font-semibold text-gray-100">
                  Verified profiles (today):
                </span>{" "}
                Verified currently means the user confirmed their email address.
                <span className="ml-1 text-gray-200/80">
                  (Future: stronger identity verification as we scale.)
                </span>
              </p>
            </div>
          </SectionCard>

          <SectionCard
            title="What’s Next"
            subtitle="These are the next platform upgrades to support teams, enterprise orgs, and scaling trust."
            badge={<Badge variant="future">COMING NEXT</Badge>}
          >
            <FeatureList items={roadmapFuture} />
          </SectionCard>

          {/* CTA STRIP */}
          <div className="w-full rounded-2xl border border-white/20 bg-white/10 p-6 text-center shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-[12px]">
            <h3 className="text-xl sm:text-2xl font-extrabold text-gray-100">
              Ready to use it?
            </h3>
            <p className="mx-auto mt-2 max-w-2xl text-sm sm:text-base text-gray-200/90">
              Start as a seeker, explore coaching tools, or reach out for
              enterprise recruiting.
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <a
                href="/pricing"
                className="inline-flex items-center justify-center rounded-xl bg-[#FF7043] px-6 py-3 font-bold text-white shadow-[0_12px_30px_rgba(255,112,67,0.25)]"
              >
                View Plans
              </a>

              <a
                href="mailto:sales@forgetomorrow.com"
                className="inline-flex items-center justify-center rounded-xl border border-white/25 bg-black/20 px-6 py-3 font-bold text-gray-100 backdrop-blur-[10px]"
              >
                Email Sales
              </a>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
