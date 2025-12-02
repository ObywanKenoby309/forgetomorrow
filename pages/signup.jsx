"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const ReCAPTCHA = dynamic(() => import("react-google-recaptcha"), {
  ssr: false,
});

export default function Signup() {
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState("form");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaValue, setCaptchaValue] = useState(null);
  const [error, setError] = useState("");
  const [siteKey, setSiteKey] = useState("");

  // Load reCAPTCHA key
  useEffect(() => {
    setSiteKey(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "");
    if (!process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
      console.error("Missing NEXT_PUBLIC_RECAPTCHA_SITE_KEY!");
    }
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!captchaValue) {
      return setError("Please complete the CAPTCHA.");
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
          plan: "free",
          recaptchaToken: captchaValue,
        }),
      });

      if (res.ok) {
        setPhase("sent");
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Something went wrong — try again.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error — try again.");
    } finally {
      setLoading(false);
    }
  }

  if (phase === "sent") {
    return (
      <div style={pageWrapper}>
        <video
          autoPlay
          muted
          loop
          playsInline
          style={videoStyle}
        >
          <source src="/videos/forge-loop.mp4" type="video/mp4" />
        </video>

        <div style={glassCard}>
          <h1 style={title}>Check your email</h1>
          <p style={{ color: "#ddd", fontSize: 16 }}>
            We sent a verification link to <strong>{email}</strong>.
            <br />
            Click the link within 1 hour to complete your account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={pageWrapper}>
      {/* Fullscreen video background */}
      <video
        autoPlay
        muted
        loop
        playsInline
        style={videoStyle}
      >
        <source src="/videos/forge-loop.mp4" type="video/mp4" />
      </video>

      {/* Frosted glass panel */}
      <div style={glassCard}>
        <h1 style={title}>Create your account</h1>

        <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
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
            placeholder="Email address"
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

          {siteKey && (
            <div style={{ marginTop: 20 }}>
              <ReCAPTCHA sitekey={siteKey} onChange={setCaptchaValue} />
            </div>
          )}

          {error && <p style={errorStyle}>{error}</p>}

          <button type="submit" disabled={loading} style={button}>
            {loading ? "Sending…" : "Send verification email"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ---------- Styles ---------- */

const pageWrapper = {
  position: "relative",
  width: "100vw",
  height: "100vh",
  overflow: "hidden",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const videoStyle = {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  objectFit: "cover",
  zIndex: 0,
  filter: "brightness(0.55)",
};

const glassCard = {
  position: "relative",
  zIndex: 2,
  width: "100%",
  maxWidth: 480,
  padding: "32px 28px",
  borderRadius: 20,
  background: "rgba(0,0,0,0.42)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid rgba(255,255,255,0.15)",
  color: "white",
  fontFamily: "Inter, system-ui, sans-serif",
  boxShadow: "0 0 40px rgba(0,0,0,0.5)",
};

const title = {
  textAlign: "center",
  fontSize: 28,
  fontWeight: 800,
  marginBottom: 12,
  color: "white",
};

const input = {
  width: "100%",
  padding: 12,
  borderRadius: 10,
  background: "rgba(255,255,255,0.08)",
  color: "white",
  border: "1px solid rgba(255,255,255,0.18)",
  outline: "none",
};

const button = {
  width: "100%",
  padding: 14,
  borderRadius: 10,
  marginTop: 20,
  background: "#FF7043",
  color: "white",
  fontWeight: 700,
  border: "none",
  cursor: "pointer",
  fontSize: 16,
};

const errorStyle = {
  marginTop: 12,
  color: "#ff9c9c",
  fontSize: 14,
};

