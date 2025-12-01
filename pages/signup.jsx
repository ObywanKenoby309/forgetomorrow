"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Dynamically import ReCAPTCHA to avoid SSR issues
const ReCAPTCHA = dynamic(() => import("react-google-recaptcha"), { ssr: false });

export default function SignupFree() {
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState("form"); // 'form' | 'sent'
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [newsletter, setNewsletter] = useState(false); // explicit opt-in
  const [error, setError] = useState("");
  const [captchaValue, setCaptchaValue] = useState(null);
  const [siteKey, setSiteKey] = useState("");

  useEffect(() => {
    setSiteKey(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "");
    if (!process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
      console.error("Missing NEXT_PUBLIC_RECAPTCHA_SITE_KEY in environment!");
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!agreed) {
      setError("You must agree to the Terms and Conditions.");
      return;
    }

    if (!captchaValue) {
      setError("Please complete the reCAPTCHA.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/preverify", {   // 👈 changed from /api/auth/preverify
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    firstName,
    lastName,
    email,
    password,
    plan: "FREE",
    recaptchaToken: captchaValue,
    // if you want everyone added to newsletter automatically:
    newsletter: true,
  }),
});

      if (res.ok) {
        setPhase("sent");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "Something went wrong — try again");
      }
    } catch (err) {
      console.error(err);
      setError("Network error — try again");
    } finally {
      setLoading(false);
    }
  };

  if (phase === "sent") {
    return (
      <div style={page}>
        <div style={shell}>
          <p style={badge}>Step 1 · Verify your email</p>
          <h1 style={heroTitle}>Check your email to begin.</h1>
          <p style={heroSubtitle}>
            We’ve sent a verification link to{" "}
            <strong style={{ color: "#FFE1D1" }}>{email}</strong>.  
            Click it within the next hour to activate your ForgeTomorrow account.
          </p>
          <div style={sentCard}>
            <p style={{ margin: 0, color: "#D1D5DB" }}>
              Didn’t get it? Check your spam/junk folder, or try again in a few minutes.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={page}>
      <div style={shell}>
        {/* Hero copy */}
        <p style={badge}>Cinematic, human, and built for your next chapter</p>
        <h1 style={heroTitle}>Forge your next move.</h1>
        <p style={heroSubtitle}>
          Create your free account to unlock AI-powered career tools, human-first networking,
          and a recruiter experience that actually respects your time.
        </p>

        <div style={cardRow}>
          {/* Left: value / reassurance */}
          <section aria-label="What you get with ForgeTomorrow" style={sideCard}>
            <h2 style={sideTitle}>You’re not just signing up.</h2>
            <p style={sideText}>
              You’re stepping into a platform built to{" "}
              <strong>protect your data, respect your time,</strong> and help you move
              faster toward work that actually fits.
            </p>
            <ul style={sideList}>
              <li style={sideListItem}>
                🔥 <span>ATS-ready resumes and offers you can negotiate with confidence.</span>
              </li>
              <li style={sideListItem}>
                🛡️ <span>No algorithmic suppression. No data selling. Ever.</span>
              </li>
              <li style={sideListItem}>
                🎯 <span>Signals that highlight your real skills — not just job titles.</span>
              </li>
            </ul>
            <p style={{ ...sideText, marginTop: 16, fontSize: 13 }}>
              ForgeTomorrow is in early access. Your feedback directly shapes the platform
              we’re building together.
            </p>
          </section>

          {/* Right: form card */}
          <section aria-label="Create your ForgeTomorrow account" style={formCard}>
            <h2 style={formTitle}>Create your account</h2>
            <p style={formSubtitle}>
              This starts with a <strong>temporary password</strong>.  
              You’ll be able to change it after verification.
            </p>

            <form onSubmit={handleSubmit} noValidate>
              <div style={nameRow}>
                <input
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  style={input}
                  aria-label="First name"
                />
                <input
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  style={input}
                  aria-label="Last name"
                />
              </div>

              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ ...input, marginTop: 12 }}
                aria-label="Email address"
              />

              <input
                type="password"
                placeholder="Temporary password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ ...input, marginTop: 12 }}
                aria-label="Temporary password"
              />

              <label style={checkboxRow}>
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  style={checkbox}
                  aria-required="true"
                />
                <span style={checkboxLabel}>
                  I agree to the{" "}
                  <a href="/terms" style={link}>
                    Terms &amp; Conditions
                  </a>{" "}
                  and understand how my data is handled.
                </span>
              </label>

              <label style={{ ...checkboxRow, marginTop: 8 }}>
                <input
                  type="checkbox"
                  checked={newsletter}
                  onChange={(e) => setNewsletter(e.target.checked)}
                  style={checkbox}
                />
                <span style={{ ...checkboxLabel, fontSize: 13 }}>
                  Also send me{" "}
                  <span style={{ fontWeight: 600 }}>ForgeTomorrow launch updates</span> and
                  occasional newsletters. No spam, no selling my data.
                </span>
              </label>

              {siteKey && (
                <div style={{ marginTop: 16 }}>
                  <ReCAPTCHA
                    sitekey={siteKey}
                    onChange={(value) => setCaptchaValue(value)}
                  />
                </div>
              )}

              {error && (
                <p style={errorText} role="alert">
                  {error}
                </p>
              )}

              <button type="submit" disabled={loading} style={button}>
                {loading ? "Sending…" : "Send verification email"}
              </button>
            </form>

            <p style={footnote}>
              Already verified an account?{" "}
              <a href="/login" style={link}>
                Log in here
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────
   Styles (theme-aligned, accessible)
   ───────────────────────────── */

const page = {
  minHeight: "100vh",
  padding: "80px 16px 40px",
  background:
    "radial-gradient(circle at top left, #1F2933 0, #050608 45%, #050608 100%)",
  color: "white",
  fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
};

const shell = {
  maxWidth: 1100,
  margin: "0 auto",
};

const badge = {
  display: "inline-flex",
  alignItems: "center",
  padding: "4px 10px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(15,23,42,0.7)",
  color: "#E5E7EB",
  fontSize: 11,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  marginBottom: 12,
};

const heroTitle = {
  fontSize: 32,
  lineHeight: 1.2,
  fontWeight: 800,
  margin: 0,
};

const heroSubtitle = {
  marginTop: 10,
  marginBottom: 28,
  maxWidth: 640,
  color: "#D1D5DB",
  fontSize: 15,
};

const cardRow = {
  display: "flex",
  flexWrap: "wrap",
  gap: 24,
  alignItems: "stretch",
};

const sideCard = {
  flex: "1 1 260px",
  padding: 24,
  borderRadius: 16,
  background:
    "linear-gradient(145deg, rgba(15,23,42,0.95), rgba(17,24,39,0.98))",
  border: "1px solid rgba(148,163,184,0.35)",
  boxShadow: "0 18px 45px rgba(0,0,0,0.45)",
};

const sideTitle = {
  margin: 0,
  fontSize: 18,
  fontWeight: 700,
};

const sideText = {
  marginTop: 10,
  marginBottom: 0,
  fontSize: 14,
  color: "#E5E7EB",
};

const sideList = {
  listStyle: "none",
  padding: 0,
  margin: "16px 0 0",
};

const sideListItem = {
  display: "flex",
  gap: 8,
  alignItems: "flex-start",
  fontSize: 14,
  color: "#E5E7EB",
  marginBottom: 8,
};

const formCard = {
  flex: "1 1 320px",
  padding: 24,
  borderRadius: 16,
  background: "#0f1112",
  border: "1px solid rgba(75,85,99,0.7)",
  boxShadow: "0 18px 45px rgba(0,0,0,0.6)",
};

const formTitle = {
  margin: 0,
  fontSize: 20,
  fontWeight: 700,
};

const formSubtitle = {
  marginTop: 8,
  marginBottom: 16,
  fontSize: 13,
  color: "#D1D5DB",
};

const nameRow = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12,
};

const input = {
  width: "100%",
  padding: 12,
  borderRadius: 8,
  background: "#16181a",
  color: "white",
  border: "1px solid #2a2c2e",
  outline: "none",
  boxSizing: "border-box",
  fontSize: 14,
};

const checkboxRow = {
  display: "flex",
  alignItems: "flex-start",
  gap: 8,
  marginTop: 16,
};

const checkbox = {
  width: 16,
  height: 16,
  marginTop: 2,
};

const checkboxLabel = {
  color: "#E5E7EB",
  fontSize: 14,
  lineHeight: 1.4,
};

const link = {
  color: "#FFB38A",
  textDecoration: "underline",
};

const errorText = {
  color: "#fca5a5",
  marginTop: 10,
  fontSize: 13,
};

const button = {
  width: "100%",
  padding: 14,
  background: "#FF7043",
  color: "white",
  border: "none",
  borderRadius: 999,
  fontWeight: 700,
  marginTop: 18,
  cursor: "pointer",
  fontSize: 15,
};

const footnote = {
  marginTop: 12,
  fontSize: 13,
  color: "#9CA3AF",
  textAlign: "center",
};

const sentCard = {
  marginTop: 24,
  padding: 20,
  borderRadius: 12,
  background: "rgba(15,23,42,0.9)",
  border: "1px solid rgba(148,163,184,0.5)",
};
