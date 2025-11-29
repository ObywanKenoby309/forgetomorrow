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
      const res = await fetch("/api/auth/preverify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
          plan: "FREE",
          recaptchaToken: captchaValue,
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
      <div style={container}>
        <h1 style={title}>Check your email</h1>
        <p style={{ color: "#ddd" }}>
          We sent a verification link to <strong>{email}</strong>. Click the link within 1 hour to
          complete signup.
        </p>
      </div>
    );
  }

  return (
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
};

const button = {
  width: "100%",
  padding: 14,
  background: "#FF7043",
  color: "white",
  border: "none",
  borderRadius: 8,
  fontWeight: 700,
  marginTop: 18,
  cursor: "pointer",
};

const title = { textAlign: "center", marginBottom: 18 };
