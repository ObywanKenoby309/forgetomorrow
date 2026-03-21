
import { useState } from "react";
import RecruiterLayout from "@/components/layouts/RecruiterLayout";

const GLASS = {
  border: "1px solid rgba(255,255,255,0.22)",
  background: "rgba(255,255,255,0.68)",
  boxShadow: "0 10px 28px rgba(15,23,42,0.12)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
};

const GLASS_SOFT = {
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.58)",
  boxShadow: "0 8px 22px rgba(15,23,42,0.10)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
};

const ORANGE = "#FF7043";
const SLATE = "#334155";
const MUTED = "#64748B";

function Section({ title, subtitle, children }) {
  return (
    <div style={{ ...GLASS, borderRadius: 18, padding: 16 }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 18, fontWeight: 900, color: SLATE }}>{title}</div>
        {subtitle && (
          <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>{subtitle}</div>
        )}
      </div>
      {children}
    </div>
  );
}

export default function SnapshotDeliveryPage() {
  const [emails, setEmails] = useState("");
  const [cadence, setCadence] = useState("weekly");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!emails) return alert("Enter at least one email");

    setSending(true);

    try {
      await fetch("/api/analytics/send-snapshot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipients: emails.split(",").map((e) => e.trim()),
        }),
      });

      alert("Snapshot sent");
    } catch (err) {
      alert("Failed to send snapshot");
    }

    setSending(false);
  };

  return (
    <RecruiterLayout
      title="Snapshot Delivery"
      subtitle="Send and automate executive reporting across your organization."
    >
      <div
        style={{
          display: "grid",
          gap: 12,
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        {/* RECIPIENTS */}
        <Section
          title="Recipients"
          subtitle="Enter emails or distribution lists separated by commas."
        >
          <textarea
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            placeholder="ceo@company.com, coo@company.com, talent@company.com"
            style={{
              width: "100%",
              minHeight: 80,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.2)",
              padding: 10,
              fontSize: 13,
              resize: "none",
            }}
          />
        </Section>

        {/* SEND NOW */}
        <Section
          title="Send Snapshot"
          subtitle="Immediately send the current executive snapshot."
        >
          <button
            onClick={handleSend}
            disabled={sending}
            style={{
              borderRadius: 10,
              background: ORANGE,
              color: "#fff",
              fontWeight: 800,
              padding: "10px 14px",
              border: "none",
              cursor: "pointer",
            }}
          >
            {sending ? "Sending..." : "Send Now"}
          </button>
        </Section>

        {/* CADENCE */}
        <Section
          title="Automated Delivery"
          subtitle="Set up recurring snapshot distribution."
        >
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {["daily", "weekly", "monthly"].map((type) => (
              <button
                key={type}
                onClick={() => setCadence(type)}
                style={{
                  borderRadius: 999,
                  padding: "8px 12px",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  background:
                    cadence === type
                      ? ORANGE
                      : "rgba(255,255,255,0.6)",
                  color: cadence === type ? "#fff" : SLATE,
                }}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 12 }}>
            <button
              onClick={() =>
                alert("Schedule saving coming next step (DB wiring)")
              }
              style={{
                borderRadius: 10,
                background: SLATE,
                color: "#fff",
                fontWeight: 800,
                padding: "10px 14px",
                border: "none",
                cursor: "pointer",
              }}
            >
              Save Schedule
            </button>
          </div>
        </Section>
      </div>
    </RecruiterLayout>
  );
}