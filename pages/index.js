// pages/index.js — ForgeTomorrow homepage v2 — product-first, premium dark SaaS
import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <Head>
        <title>ForgeTomorrow — The career system after algorithms.</title>
        <meta
          name="description"
          content="ForgeTomorrow is a career platform built for clarity, alignment, and human dignity. Proof over keywords. Clarity over guesswork."
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

          .hero-eyebrow {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: var(--orange-dim);
            border: 1px solid rgba(255,112,67,0.25);
            border-radius: 100px;
            padding: 6px 16px;
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: var(--orange);
            margin-bottom: 32px;
          }

          .hero-eyebrow-dot {
            width: 6px;
            height: 6px;
            background: var(--orange);
            border-radius: 50%;
            animation: pulse 2s ease-in-out infinite;
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

          .section-label {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: var(--text-muted);
            margin-bottom: 20px;
          }

          .section-label::before {
            content: '';
            display: block;
            width: 20px;
            height: 1px;
            background: var(--text-muted);
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
            margin-bottom: 12px;
          }

          .showcase-sub {
            font-size: 17px;
            color: var(--text-secondary);
            max-width: 520px;
            margin: 0 auto 16px;
            line-height: 1.65;
          }

          .showcase-proof-tag {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: rgba(74,222,128,0.07);
            border: 1px solid rgba(74,222,128,0.2);
            border-radius: 100px;
            padding: 5px 14px;
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 0.05em;
            color: #4ade80;
            margin-bottom: 56px;
          }

          .showcase-proof-dot {
            width: 5px;
            height: 5px;
            background: #4ade80;
            border-radius: 50%;
          }

          .showcase-frame {
            max-width: 1400px;
            margin: 0 auto;
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

          /* ─── DIVIDER LINE ──────────────────────────────────────── */
          .section-divider {
            width: 100%;
            height: 1px;
            background: var(--border);
          }

          /* Util */
          .max-container { max-width: 1100px; margin: 0 auto; }
          .text-center { text-align: center; }
        `}</style>
      </Head>

      <main>

        {/* ── HERO ─────────────────────────────────────────────────── */}
        <section className="hero">
          <div className="hero-bg" aria-hidden="true" />
          <div className="hero-overlay" aria-hidden="true" />

          <div className="hero-content">
            <div className="hero-eyebrow">
              <span className="hero-eyebrow-dot" />
              Now in early access
            </div>

            <h1 className="hero-h1">
              The career system after algorithms.
              <span className="hero-h1-accent">This is where futures are forged.</span>
            </h1>

            <p className="hero-sub">
              Professional networking, career intelligence, coaching, and hiring — finally built into one system.
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
            <div className="section-label">The problem</div>
            <h2 className="problem-heading">
              The current career system is misaligned with human outcomes.
            </h2>
            <p className="problem-sub">
              Most platforms optimize for engagement metrics instead of career outcomes — creating noise, delays, and real career damage.
            </p>

            <div className="problem-grid">
              <div className="problem-col">
                <div className="problem-col-label bad">What's happening right now</div>
                {[
                  'Keyword filters that discard real capability and real potential',
                  'Opaque decisions — rejected with zero explanation and no path forward',
                  'Platforms engineered to keep you scrolling, not to get you hired',
                  'Guesswork around fit, expectations, culture, and compensation',
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
                  'Proof-based signals that show what people have actually built and delivered',
                  'Transparent alignment — why something fits (or doesn\'t) and what to do next',
                  'Tools designed for outcomes: prepare, align, act, and move forward',
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
            <div className="section-label" style={{ justifyContent: 'center' }}>See the system</div>
            <h2 className="showcase-heading">
              Built. Working. Available today.
            </h2>
            <p className="showcase-sub">
              A complete career operating system built for seekers, recruiters, and coaches.
            </p>
            <div className="showcase-proof-tag">
              <span className="showcase-proof-dot" />
              No mockups. No concepts. No future promises.
            </div>
          </div>

          <div className="showcase-frame">
            <div className="showcase-glow" aria-hidden="true" />
            <div className="showcase-img-wrap">
              <img
                src="/images/forge-platform-overview-v1.png"
                alt="ForgeTomorrow platform overview — live product"
                loading="lazy"
              />
            </div>
          </div>
        </section>

        {/* ── CAPABILITY STRIP ─────────────────────────────────────── */}
        <section className="capability-section">
          <div className="capability-grid">
            {[
              { icon: '🤝', title: 'Professional Networking', desc: 'Build meaningful professional relationships without algorithmic gatekeeping.' },
              { icon: '🎯', title: 'Career Intelligence', desc: 'Understand alignment, strengths, opportunities, and next steps.' },
              { icon: '🔍', title: 'Recruiter Intelligence', desc: 'Evaluate candidates with transparent, explainable matching.' },
              { icon: '🎥', title: 'Foundry Meetings', desc: 'Meet, interview, coach, and collaborate inside the platform.' },
              { icon: '📄', title: 'Portfolio & Resume Tools', desc: 'Create, manage, and showcase professional achievements.' },
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
              <div className="section-label" style={{ justifyContent: 'center' }}>Built for</div>
              <h2 className="audience-heading">One platform. Three workspaces.</h2>
              <p className="audience-sub">Every role gets a dedicated workspace built around how they actually work.</p>
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
                  Build your career signal, understand fit before you apply, and move forward without guessing what hidden systems want.
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
                  Hire with clarity and accountability. Review candidates with visible reasoning and communicate without opaque filters.
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
              One platform.<br />
              <span>Three workspaces.</span><br />
              One source of truth.
            </h2>
            <p className="final-cta-sub">
              Stop stitching together five different platforms. ForgeTomorrow brings everything into one place.
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