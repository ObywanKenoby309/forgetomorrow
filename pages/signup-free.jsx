// pages/signup-free.js
import { useState } from "react";

export default function SignupFree() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/auth/signup-free", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
    if (res.ok) {
      window.location.href = "/dashboard";
    } else {
      alert("Something went wrong — try again");
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 400, margin: "100px auto", padding: 32, background: "#111", color: "white", borderRadius: 16 }}>
      <h1 style={{ textAlign: "center", marginBottom: 32 }}>Create your free account</h1>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required style={{ width: "100%", padding: 12, marginBottom: 12, borderRadius: 8 }} />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: "100%", padding: 12, marginBottom: 12, borderRadius: 8 }} />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: "100%", padding: 12, marginBottom: 24, borderRadius: 8 }} />
        <button type="submit" disabled={loading} style={{ width: "100%", padding: 14, background: "#FF7043", color: "white", border: "none", borderRadius: 8, fontWeight: "bold" }}>
          {loading ? "Creating…" : "Sign up free"}
        </button>
      </form>
    </div>
  );
}