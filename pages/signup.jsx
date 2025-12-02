"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Dynamically import ReCAPTCHA to avoid SSR issues
<<<<<<< HEAD
const ReCAPTCHA = dynamic(() => import("react-google-recaptcha"), {
  ssr: false,
});

export default function Signup() {
=======
const ReCAPTCHA = dynamic(() => import("react-google-recaptcha"), { ssr: false });

export default function SignupFree() {
>>>>>>> 6ee98c0 (Add privacy delete user data system)
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState("form"); // 'form' | 'sent'
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
<<<<<<< HEAD
  const [newsletter, setNewsletter] = useState(true);
=======
>>>>>>> 6ee98c0 (Add privacy delete user data system)
  const [error, setError] = useState("");
  const [captchaValue, setCaptchaValue] = useState(null);
  const [siteKey, setSiteKey] = useState("");

<<<<<<< HEAD
  // Load reCAPTCHA site key from env
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";
    setSiteKey(key);
    if (!key) {
=======
  useEffect(() => {
    setSiteKey(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "");
    if (!process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
>>>>>>> 6ee98c0 (Add privacy delete user data system)
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
      const res = await fetch("/api/auth/preverify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
<<<<<<< HEAD
          plan: "free",
          recaptchaToken: captchaValue,
          newsletter,
=======
          plan: "FREE",
          recaptchaToken: captchaValue,
>>>>>>> 6ee98c0 (Add privacy delete user data system)
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
<<<<<<< HEAD
      <main style={pageShell}>
        <div style={card}>
          <h1 style={title}>Check your email</h1>
          <p style={{ color: "#ddd", marginTop: 8, fontSize: 14, lineHeight: 1.5 }}>
            We sent a verification link to{" "}
            <strong>{email}</strong>. Click the link within 1 hour to
            complete your signup and activate your account.
          </p>
          <p style={{ color: "#888", marginTop: 16, fontSize: 13 }}>
            Already verified?{" "}
            <a href="/auth/signin" style={link}>
              Log in here
            </a>
            .
          </p>
        </div>
      </main>
=======
      <div style={container}>
        <h1 style={title}>Check your email</h1>
        <p style={{ color: "#ddd" }}>
          We sent a verification link to <strong>{email}</strong>. Click the link within 1 hour to
          complete signup.
        </p>
      </div>
>>>>>>> 6ee98c0 (Add privacy delete user data system)
    );
  }

  return (
<<<<<<< HEAD
    <main style={pageShell}>
      <div style={card}>
        <h1 style={title}>Create your ForgeTomorrow account</h1>
        <p style={subtitle}>
          Start with a free account. You can upgrade later once you’re ready to go deeper.
        </p>

        <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
          {/* Name row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <input
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              style={input}
              autoComplete="given-name"
            />
            <input
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              style={input}
              autoComplete="family-name"
            />
          </div>

          {/* Email */}
          <input
            type="email"
            placeholder="Work or personal email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ ...input, marginTop: 12 }}
            autoComplete="email"
          />

          {/* Password */}
          <input
            type="password"
            placeholder="Temporary password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ ...input, marginTop: 12 }}
            autoComplete="new-password"
          />

          {/* Terms checkbox */}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 16,
              fontSize: 13,
              color: "#ddd",
            }}
          >
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              style={{ width: 16, height: 16 }}
            />
            <span>
              I agree to the{" "}
              <a href="/terms" style={link}>
                Terms &amp; Conditions
              </a>{" "}
              and{" "}
              <a href="/privacy" style={link}>
                Privacy Policy
              </a>
              .
            </span>
          </label>

          {/* Newsletter checkbox */}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 10,
              fontSize: 13,
              color: "#aaa",
            }}
          >
            <input
              type="checkbox"
              checked={newsletter}
              onChange={(e) => setNewsletter(e.target.checked)}
              style={{ width: 16, height: 16 }}
            />
            <span>
              Send me early-access updates and practical career tips (optional).
            </span>
          </label>

          {/* reCAPTCHA */}
          {siteKey && (
            <div style={{ marginTop: 16 }}>
              <ReCAPTCHA
                sitekey={siteKey}
                onChange={(value) => setCaptchaValue(value)}
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <p style={{ color: "#ff8080", marginTop: 10, fontSize: 13 }}>
              {error}
            </p>
          )}

          {/* Submit */}
          <button type="submit" disabled={loading} style={button}>
            {loading ? "Sending verification link…" : "Send verification email"}
          </button>
        </form>

        <p style={{ marginTop: 16, fontSize: 13, color: "#999", textAlign: "center" }}>
          Already verified an account?{" "}
          <a href="/auth/signin" style={link}>
            Log in here
          </a>
          .
        </p>
      </div>
    </main>
  );
}

/* Layout styles */

const pageShell = {
  minHeight: "100vh",
  margin: 0,
  padding: "64px 16px",
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
  background:
    "radial-gradient(circle at top, #1e293b 0, #020617 45%, #020617 100%)",
  color: "white",
  fontFamily: "Inter, system-ui, -apple-system, sans-serif",
};

const card = {
  width: "100%",
  maxWidth: 520,
  padding: 28,
  borderRadius: 14,
  background: "rgba(15, 17, 18, 0.96)",
  border: "1px solid rgba(148, 163, 184, 0.25)",
  boxShadow: "0 24px 60px rgba(0, 0, 0, 0.6)",
};

const title = {
  fontSize: 24,
  fontWeight: 800,
  margin: 0,
  textAlign: "center",
};

const subtitle = {
  marginTop: 8,
  marginBottom: 0,
  fontSize: 14,
  color: "#cbd5f5",
  textAlign: "center",
=======
    <div style={container}>
      <h1 style={title}>Create your account</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <input
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            style={input}
          />
          <input
            placeholder="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            style={input}
          />
        </div>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ ...input, marginTop: 12 }}
        />

        <input
          type="password"
          placeholder="Temporary password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ ...input, marginTop: 12 }}
        />

        <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16 }}>
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            style={{ width: 16, height: 16 }}
          />
          <span style={{ color: "#ddd", fontSize: 14 }}>
            I agree to the{" "}
            <a href="/terms" style={{ color: "#FF7043", textDecoration: "underline" }}>
              Terms &amp; Conditions
            </a>
          </span>
        </label>

        {siteKey && (
          <div style={{ marginTop: 16 }}>
            <ReCAPTCHA sitekey={siteKey} onChange={(value) => setCaptchaValue(value)} />
          </div>
        )}

        {error && <p style={{ color: "#ff8080", marginTop: 10 }}>{error}</p>}

        <button type="submit" disabled={loading} style={button}>
          {loading ? "Sending…" : "Send verification email"}
        </button>
      </form>
    </div>
  );
}

/* Styles */
const container = {
  maxWidth: 520,
  margin: "80px auto",
  padding: 28,
  background: "#0f1112",
  color: "white",
  borderRadius: 12,
  fontFamily: "Inter, system-ui, -apple-system, sans-serif",
>>>>>>> 6ee98c0 (Add privacy delete user data system)
};

const input = {
  width: "100%",
  padding: 12,
  borderRadius: 8,
<<<<<<< HEAD
  background: "#020617",
  color: "white",
  border: "1px solid #1f2933",
  outline: "none",
  fontSize: 14,
=======
  background: "#16181a",
  color: "white",
  border: "1px solid #2a2c2e",
  outline: "none",
>>>>>>> 6ee98c0 (Add privacy delete user data system)
  boxSizing: "border-box",
};

const button = {
  width: "100%",
<<<<<<< HEAD
  padding: 13,
=======
  padding: 14,
>>>>>>> 6ee98c0 (Add privacy delete user data system)
  background: "#FF7043",
  color: "white",
  border: "none",
  borderRadius: 8,
  fontWeight: 700,
  marginTop: 18,
  cursor: "pointer",
<<<<<<< HEAD
  fontSize: 15,
};

const link = {
  color: "#FF7043",
  textDecoration: "underline",
  textUnderlineOffset: 2,
};
=======
};

const title = { textAlign: "center", marginBottom: 18 };
>>>>>>> 6ee98c0 (Add privacy delete user data system)
