// pages/index.js — ForgeTomorrow homepage v2 — product-first, premium dark SaaS
import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

function getDashboardPath(user) {
  const role = String(user?.role || '').toUpperCase();

  if (role === 'ADMIN' || role === 'SITE_ADMIN') return '/admin';
  if (role === 'RECRUITER') return '/recruiter/dashboard';
  if (role === 'COACH') return '/coaching-dashboard';

  return '/seeker-dashboard';
}

export default function Home() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function routeSignedInUser() {
      try {
        const res = await fetch('/api/auth/me', { method: 'GET' });
        if (!res.ok) {
          if (!cancelled) setCheckingSession(false);
          return;
        }

        const data = await res.json();
        const user = data?.user || null;

        if (!cancelled && user) {
          router.replace(getDashboardPath(user));
          return;
        }
      } catch {
        // Logged-out public homepage should still render if the check fails.
      }

      if (!cancelled) setCheckingSession(false);
    }

    routeSignedInUser();

    return () => {
      cancelled = true;
    };
  }, [router]);

return (
  <>
    <Head>
      <title>ForgeTomorrow | The Professional Intelligence Ecosystem</title>

      <meta
        name="description"
        content="ForgeTomorrow is a professional intelligence ecosystem connecting job seekers, recruiters, coaches, hiring managers, and organizations through explainable career intelligence, professional networking, recruiting, coaching, and career development tools."
      />

      <meta
        name="keywords"
        content="professional intelligence, career intelligence, recruiting platform, professional networking, coaching platform, career development, human-centered career intelligence, HCCI, hiring technology"
      />

        <link rel="icon" href="/favicon.ico" sizes="any" />
		<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
		<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
		<link rel="apple-touch-icon" href="/apple-touch-icon.png" />

<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Organization",

      name: "ForgeTomorrow",
      alternateName: "ForgeTomorrow, Inc.",

      url: "https://www.forgetomorrow.com",

      logo:
        "https://www.forgetomorrow.com/apple-touch-icon.png",

      description:
        "ForgeTomorrow is a professional intelligence ecosystem connecting job seekers, recruiters, coaches, hiring managers, and organizations through Human-Centered Career Intelligence (HCCI), explainable career intelligence, professional networking, recruiting, coaching, and career development tools.",

      founder: {
        "@type": "Person",
        name: "Eric James",
        jobTitle: "Founder & CEO"
      },

      sameAs: [
        "https://www.linkedin.com/company/135134198/",
        "https://www.facebook.com/people/ForgeTomorrow/61579627354284/",
        "https://www.youtube.com/@ForgeTomorrow-h2z"
      ],

      knowsAbout: [
        "Professional Intelligence",
        "Human-Centered Career Intelligence",
        "Career Intelligence",
        "Professional Networking",
        "Recruiting",
        "Coaching",
        "Career Development",
        "Hiring Technology",
        "Professional Ecosystems"
      ]
    })
  }}
/>

	  <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,900;1,9..40,300&display=swap');

          * { box-sizing: border-box; margin: 0; padding: 0; }

          :root {
            --orange: #FF7043;
            --orange-bright: #ff8c6b;
            --orange-dim: rgba(255,112,67,0.12);
            --slate: #334155;
            --bg-base: #0a0a0b;
            --bg-mid: #0f0f11;
            --bg-elevated: #141416;
            --surface: rgba(255,255,255,0.04);
            --surface-hover: rgba(255,255,255,0.07);
            --border: rgba(255,255,255,0.07);
            --border-bright: rgba(255,255,255,0.13);
            --text-primary: #f0f0f2;
            --text-secondary: #9094a0;
            --text-muted: #5a5e6a;
            --glass-bg: rgba(255,255,255,0.03);
            --glass-border: rgba(255,255,255,0.08);
          }

          body {
            font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
            background: var(--bg-base);
            color: var(--text-primary);
            -webkit-font-smoothing: antialiased;
          }

          /* ─── HERO ─────────────────────────────────────────────── */
          .hero {
            position: relative;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 0 24px;
            overflow: hidden;
          }

          .hero-bg {
            position: absolute;
            inset: 0;
            background-image: url('/images/forge-bg-bw.png');
            background-size: cover;
            background-position: center;
            opacity: 0.18;
          }

          .hero-overlay {
            position: absolute;
            inset: 0;
            background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,112,67,0.08) 0%, transparent 65%),
                        linear-gradient(to bottom, transparent 60%, var(--bg-base) 100%);
          }

          .hero-content {
            position: relative;
            z-index: 10;
            max-width: 900px;
          }

          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(0.7); }
          }

          .hero-h1 {
            font-size: clamp(42px, 7vw, 80px);
            font-weight: 900;
            line-height: 1.02;
            letter-spacing: -0.03em;
            color: var(--text-primary);
            margin-bottom: 16px;
          }

          .hero-h1-accent {
            display: block;
            color: var(--orange);
            font-size: clamp(34px, 5.5vw, 64px);
            margin-top: 12px;
            font-weight: 800;
          }

          .hero-sub {
            font-size: clamp(16px, 2vw, 20px);
            color: var(--text-secondary);
            font-weight: 400;
            line-height: 1.6;
            max-width: 560px;
            margin: 24px auto 48px;
            letter-spacing: 0.01em;
          }

          .hero-ctas {
            display: flex;
            flex-wrap: wrap;
            gap: 14px;
            justify-content: center;
            align-items: center;
          }

          .btn-primary {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: var(--orange);
            color: #fff;
            font-family: 'DM Sans', sans-serif;
            font-weight: 700;
            font-size: 16px;
            padding: 14px 32px;
            border-radius: 100px;
            border: none;
            cursor: pointer;
            transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
            box-shadow: 0 0 32px rgba(255,112,67,0.3);
            text-decoration: none;
          }

          .btn-primary:hover {
            background: #f46036;
            transform: translateY(-1px);
            box-shadow: 0 0 48px rgba(255,112,67,0.45);
          }

          .btn-secondary {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: transparent;
            color: var(--text-primary);
            font-family: 'DM Sans', sans-serif;
            font-weight: 600;
            font-size: 16px;
            padding: 13px 32px;
            border-radius: 100px;
            border: 1px solid var(--border-bright);
            cursor: pointer;
            transition: background 0.2s, border-color 0.2s, transform 0.15s;
            text-decoration: none;
          }

          .btn-secondary:hover {
            background: var(--surface-hover);
            border-color: rgba(255,255,255,0.22);
            transform: translateY(-1px);
          }

          .btn-ghost {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            color: var(--text-secondary);
            font-family: 'DM Sans', sans-serif;
            font-weight: 500;
            font-size: 15px;
            background: none;
            border: none;
            cursor: pointer;
            transition: color 0.2s;
            text-decoration: none;
          }

          .btn-ghost:hover { color: var(--text-primary); }

          /* ─── PROBLEM / SOLUTION ───────────────────────────────── */
          .problem-section {
            background: var(--bg-mid);
            padding: 112px 24px;
            border-top: 1px solid var(--border);
          }

          .problem-heading {
            font-size: clamp(28px, 4vw, 44px);
            font-weight: 800;
            letter-spacing: -0.025em;
            line-height: 1.12;
            color: var(--text-primary);
            max-width: 600px;
            margin-bottom: 16px;
          }

          .problem-sub {
            font-size: 16px;
            color: var(--text-secondary);
            max-width: 520px;
            line-height: 1.7;
            margin-bottom: 64px;
          }

          .problem-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2px;
            max-width: 1100px;
            margin: 0 auto;
            border-radius: 16px;
            overflow: hidden;
            border: 1px solid var(--border);
          }

          @media (max-width: 768px) {
            .problem-grid { grid-template-columns: 1fr; }
          }

          .problem-col {
            padding: 40px 40px 48px;
            background: var(--bg-elevated);
          }

          .problem-col:first-child {
            border-right: 1px solid var(--border);
          }

          @media (max-width: 768px) {
            .problem-col { padding: 28px 20px 32px; }
            .problem-col:first-child { border-right: none; border-bottom: 1px solid var(--border); }
            .problem-section { padding: 72px 16px; }
            .showcase-section { padding: 80px 16px; }
            .capability-section { padding: 0 16px 72px; }
            .audience-section { padding: 72px 16px; }
            .final-cta-section { padding: 80px 16px; }
            .audience-card { padding: 28px 22px 24px; }
            .hero { padding: 0 16px; min-height: 88vh; }
          }

          .problem-col-label {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            margin-bottom: 28px;
          }

          .problem-col-label.bad { color: #f87171; }
          .problem-col-label.good { color: #4ade80; }

          .problem-item {
            display: flex;
            gap: 14px;
            margin-bottom: 20px;
            align-items: flex-start;
          }

          .problem-item:last-child { margin-bottom: 0; }

          .problem-icon {
            flex-shrink: 0;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: 900;
            margin-top: 2px;
          }

          .problem-icon.bad {
            background: rgba(248,113,113,0.12);
            color: #f87171;
          }

          .problem-icon.good {
            background: rgba(74,222,128,0.1);
            color: #4ade80;
          }

          .problem-text {
            font-size: 15px;
            color: var(--text-secondary);
            line-height: 1.6;
          }

          /* ─── PRODUCT SHOWCASE ─────────────────────────────────── */
          .showcase-section {
            background: var(--bg-base);
            padding: 120px 24px;
            text-align: center;
          }

          .showcase-heading {
            font-size: clamp(32px, 4.5vw, 52px);
            font-weight: 800;
            letter-spacing: -0.03em;
            line-height: 1.1;
            color: var(--text-primary);
            margin-bottom: 40px;
          }

          .showcase-frame {
            max-width: 1160px;
            margin: 32px auto 0;
            position: relative;
          }

          .showcase-glow {
            position: absolute;
            inset: -60px;
            background: radial-gradient(ellipse 70% 50% at 50% 50%, rgba(255,112,67,0.07) 0%, transparent 70%);
            pointer-events: none;
            z-index: 0;
          }

          .showcase-img-wrap {
            position: relative;
            z-index: 1;
            border-radius: 16px;
            border: 1px solid var(--border-bright);
            overflow: hidden;
            background: var(--bg-elevated);
            box-shadow:
              0 0 0 1px rgba(255,255,255,0.05),
              0 32px 80px rgba(0,0,0,0.6),
              0 8px 24px rgba(0,0,0,0.4);
          }

          .showcase-img-wrap img {
            display: block;
            width: 100%;
            height: auto;
          }

          /* ─── CAPABILITY STRIP ─────────────────────────────────── */
          .capability-section {
            background: var(--bg-mid);
            padding: 0 24px 112px;
            border-bottom: 1px solid var(--border);
          }

          .capability-grid {
            max-width: 1100px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1px;
            border: 1px solid var(--border);
            border-radius: 16px;
            overflow: hidden;
          }

          @media (max-width: 900px) {
            .capability-grid { grid-template-columns: repeat(2, 1fr); }
          }

          @media (max-width: 560px) {
            .capability-grid { grid-template-columns: 1fr; }
          }

          .cap-card {
            background: var(--bg-elevated);
            padding: 32px 28px;
            transition: background 0.2s;
          }

          .cap-card:hover {
            background: var(--surface-hover);
          }

          .cap-icon {
            width: 36px;
            height: 36px;
            border-radius: 10px;
            background: var(--orange-dim);
            border: 1px solid rgba(255,112,67,0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 16px;
            font-size: 16px;
          }

          .cap-title {
            font-size: 14px;
            font-weight: 700;
            color: var(--text-primary);
            margin-bottom: 6px;
            letter-spacing: -0.01em;
          }

          .cap-desc {
            font-size: 13px;
            color: var(--text-muted);
            line-height: 1.6;
          }

          /* ─── AUDIENCE SECTION ─────────────────────────────────── */
          .audience-section {
            background: var(--bg-base);
            padding: 112px 24px;
          }

          .audience-header {
            text-align: center;
            margin-bottom: 64px;
          }

          .audience-heading {
            font-size: clamp(26px, 3.5vw, 40px);
            font-weight: 800;
            letter-spacing: -0.025em;
            color: var(--text-primary);
            margin-bottom: 12px;
          }

          .audience-sub {
            font-size: 16px;
            color: var(--text-secondary);
            max-width: 400px;
            margin: 0 auto;
            line-height: 1.65;
          }

          .audience-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            max-width: 1100px;
            margin: 0 auto;
          }

          @media (max-width: 768px) {
            .audience-grid { grid-template-columns: 1fr; }
          }

          .audience-card {
            background: var(--glass-bg);
            border: 1px solid var(--glass-border);
            border-radius: 20px;
            padding: 40px 32px 36px;
            position: relative;
            overflow: hidden;
            transition: border-color 0.25s, background 0.25s, transform 0.2s;
            backdrop-filter: blur(10px);
          }

          .audience-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, var(--card-accent, rgba(255,112,67,0.4)), transparent);
            opacity: 0;
            transition: opacity 0.25s;
          }

          .audience-card:hover {
            border-color: rgba(255,255,255,0.14);
            background: var(--surface-hover);
            transform: translateY(-3px);
          }

          .audience-card:hover::before { opacity: 1; }

          .audience-monogram {
            width: 56px;
            height: 56px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
            font-weight: 900;
            color: #fff;
            margin-bottom: 24px;
          }

          .audience-card-title {
            font-size: 20px;
            font-weight: 800;
            margin-bottom: 12px;
            letter-spacing: -0.02em;
          }

          .audience-card-desc {
            font-size: 14px;
            color: var(--text-secondary);
            line-height: 1.7;
            margin-bottom: 24px;
          }

          .audience-link {
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 0.02em;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            transition: gap 0.2s;
          }

          .audience-link:hover { gap: 10px; }

          /* ─── FINAL CTA ─────────────────────────────────────────── */
          .final-cta-section {
            background: var(--bg-mid);
            padding: 120px 24px;
            text-align: center;
            border-top: 1px solid var(--border);
            position: relative;
            overflow: hidden;
          }

          .final-cta-glow {
            position: absolute;
            inset: 0;
            background: radial-gradient(ellipse 60% 70% at 50% 100%, rgba(255,112,67,0.06) 0%, transparent 65%);
            pointer-events: none;
          }

          .final-cta-heading {
            font-size: clamp(30px, 5vw, 56px);
            font-weight: 900;
            letter-spacing: -0.035em;
            line-height: 1.08;
            color: var(--text-primary);
            max-width: 700px;
            margin: 0 auto 20px;
          }

          .final-cta-heading span {
            color: var(--orange);
          }

          .final-cta-sub {
            font-size: 16px;
            color: var(--text-secondary);
            max-width: 540px;
            margin: 0 auto 48px;
            line-height: 1.7;
          }

          .final-cta-buttons {
            display: flex;
            flex-wrap: wrap;
            gap: 14px;
            justify-content: center;
          }

          /* Util */
          .max-container { max-width: 1100px; margin: 0 auto; }
          .text-center { text-align: center; }
        `}</style>
      </Head>

      <main>

        {checkingSession && (
          <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(10,10,11,0.96)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF7043', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: 12 }}>
            Opening ForgeTomorrow…
          </div>
        )}

        {/* ── HERO ─────────────────────────────────────────────────── */}
        <section className="hero">
          <div className="hero-bg" aria-hidden="true" />
          <div className="hero-overlay" aria-hidden="true" />

          <div className="hero-content">
            <h1 className="hero-h1">
              The career platform built for people, not algorithms.
              <span className="hero-h1-accent">This is where futures are forged.</span>
            </h1>

            <p className="hero-sub">
              We built the platform we wish existed when we needed it. Build your professional network, find jobs, get coaching, hire great people, and manage your career in one place.
            </p>

            <div className="hero-ctas">
              <Link href="/pricing" className="btn-primary">
                Enter the Forge
              </Link>
              <Link href="/about" className="btn-secondary">
                Our Promise
              </Link>
              <Link href="/features" className="btn-ghost">
                Explore the platform →
              </Link>
            </div>
          </div>
        </section>

        {/* ── PROBLEM / SOLUTION ───────────────────────────────────── */}
        <section className="problem-section">
          <div className="max-container">
            <h2 className="problem-heading">
              Today's hiring system isn't working for people.
            </h2>
            <p className="problem-sub">
              Most career websites make money by keeping you clicking instead of helping you get hired.
            </p>

            <div className="problem-grid">
              <div className="problem-col">
                <div className="problem-col-label bad">What's happening right now</div>
                {[
                  "Good people get rejected because their resume doesn't use the right words.",
                  'You get rejected without knowing why or what to improve.',
                  'Platforms engineered to keep you scrolling, not to get you hired',
                  'You have to guess if the job is really right for you.',
                ].map((t, i) => (
                  <div className="problem-item" key={i}>
                    <div className="problem-icon bad">✕</div>
                    <div className="problem-text">{t}</div>
                  </div>
                ))}
              </div>

              <div className="problem-col">
                <div className="problem-col-label good">What ForgeTomorrow replaces it with</div>
                {[
                  "Show employers what you've actually done, not just what's on your resume.",
                  "We show you why you're a good fit—and how to become a better one.",
                  'Tools that help you prepare, apply, interview, and get hired.',
                  'One complete system for seekers, recruiters, and coaches',
                ].map((t, i) => (
                  <div className="problem-item" key={i}>
                    <div className="problem-icon good">✓</div>
                    <div className="problem-text">{t}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── PRODUCT SHOWCASE ─────────────────────────────────────── */}
        <section className="showcase-section">
          <div className="max-container text-center">
            <h2 className="showcase-heading">
              Everything connected in one place.
            </h2>
          </div>

          <div className="showcase-frame">
            <div className="showcase-glow" aria-hidden="true" />
            <div className="showcase-img-wrap">
              <img
                src="/images/forge-platform-overview-v1.png"
                alt="ForgeTomorrow platform overview"
                loading="lazy"
              />
            </div>
          </div>

          <div className="text-center" style={{ marginTop: '32px' }}>
            <Link href="/features" className="btn-ghost">
              See the full platform →
            </Link>
          </div>
        </section>

        {/* ── CAPABILITY STRIP ─────────────────────────────────────── */}
        <section className="capability-section">
          <div className="capability-grid">
            {[
              { icon: '🤝', title: 'Professional Networking', desc: 'Meet professionals based on your goals and experience instead of fighting social media algorithms.' },
              { icon: '🎯', title: 'Career Guidance', desc: 'Learn what jobs match your experience, what you\'re good at, and what to work on next.' },
              { icon: '🔍', title: 'Recruiter Tools', desc: 'Compare candidates using real experience instead of guesswork.' },
              { icon: '🎥', title: 'Foundry Meetings', desc: 'Meet, interview, coach, and collaborate inside the platform.' },
              { icon: '📄', title: 'Career Tools', desc: 'Build resumes and portfolios, negotiate offers, plan career moves, and prepare for what\'s next.' },
              { icon: '📊', title: 'Coaching Workspace', desc: 'Manage sessions, feedback, calendars, and client growth.' },
            ].map((c, i) => (
              <div className="cap-card" key={i}>
                <div className="cap-icon">{c.icon}</div>
                <div className="cap-title">{c.title}</div>
                <div className="cap-desc">{c.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── AUDIENCE ─────────────────────────────────────────────── */}
        <section className="audience-section">
          <div className="max-container">
            <div className="audience-header">
              <h2 className="audience-heading">One platform. Three workspaces.</h2>
              <p className="audience-sub">Intentionally designed workspaces built around how you actually work.</p>
            </div>

            <div className="audience-grid">
              {/* Seekers */}
              <div className="audience-card" style={{ '--card-accent': 'rgba(255,112,67,0.5)' }}>
                <div
                  className="audience-monogram"
                  style={{ background: 'linear-gradient(135deg, #FF7043, #f46036)' }}
                >
                  S
                </div>
                <div className="audience-card-title" style={{ color: '#FF7043' }}>Job Seekers</div>
                <p className="audience-card-desc">
                  Build a profile that shows employers what you can do, understand your job matches before you apply, and move forward with confidence.
                </p>
                <Link href="/features" className="audience-link" style={{ color: '#FF7043' }}>
                  Explore Seeker Tools →
                </Link>
              </div>

              {/* Recruiters */}
              <div className="audience-card" style={{ '--card-accent': 'rgba(52,211,153,0.5)' }}>
                <div
                  className="audience-monogram"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                >
                  R
                </div>
                <div className="audience-card-title" style={{ color: '#34d399' }}>Recruiters & Employers</div>
                <p className="audience-card-desc">
                  Hire with confidence. Review candidates with clear explanations and communicate directly without hidden filters.
                </p>
                <Link href="/features" className="audience-link" style={{ color: '#34d399' }}>
                  Explore Recruiter Tools →
                </Link>
              </div>

              {/* Coaches */}
              <div className="audience-card" style={{ '--card-accent': 'rgba(167,139,250,0.5)' }}>
                <div
                  className="audience-monogram"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
                >
                  C
                </div>
                <div className="audience-card-title" style={{ color: '#a78bfa' }}>Coaches & Mentors</div>
                <p className="audience-card-desc">
                  Support professionals inside a system built for outcomes. Schedule sessions, organize clients, and gather feedback.
                </p>
                <Link href="/features" className="audience-link" style={{ color: '#a78bfa' }}>
                  Explore Coaching Tools →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ────────────────────────────────────────────── */}
        <section className="final-cta-section">
          <div className="final-cta-glow" aria-hidden="true" />
          <div className="max-container text-center" style={{ position: 'relative', zIndex: 1 }}>
            <h2 className="final-cta-heading">
              Move forward with<br />
              <span>clarity.</span>
            </h2>
            <p className="final-cta-sub">
              Whatever comes next, don't navigate it alone. ForgeTomorrow gives you the tools to move forward with confidence.
            </p>
            <div className="final-cta-buttons">
              <Link href="/pricing" className="btn-primary">
                Enter the Forge
              </Link>
              <Link href="/features" className="btn-secondary">
                Explore the Platform
              </Link>
            </div>
          </div>
        </section>

      </main>
    </>
  );
}