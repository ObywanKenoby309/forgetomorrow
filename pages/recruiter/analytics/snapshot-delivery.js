// pages/recruiter/analytics/snapshot-delivery.js
import { useEffect, useMemo, useState } from "react";
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

const WEEKDAY_OPTIONS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const ORDINAL_OPTIONS = ["First", "Second", "Third", "Fourth", "Last"];

const FALLBACK_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
  "America/Toronto",
  "America/Vancouver",
  "America/Mexico_City",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Dublin",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Rome",
  "Europe/Amsterdam",
  "Europe/Zurich",
  "Europe/Warsaw",
  "Europe/Stockholm",
  "Europe/Helsinki",
  "Europe/Riga",
  "Europe/Vilnius",
  "Europe/Tallinn",
  "Europe/Athens",
  "Europe/Istanbul",
  "Europe/Kyiv",
  "Africa/Johannesburg",
  "Africa/Cairo",
  "Africa/Lagos",
  "Asia/Dubai",
  "Asia/Riyadh",
  "Asia/Jerusalem",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Bangkok",
  "Asia/Kuala_Lumpur",
  "Asia/Manila",
  "Asia/Jakarta",
  "Asia/Shanghai",
  "Asia/Hong_Kong",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Australia/Perth",
  "Australia/Adelaide",
  "Australia/Brisbane",
  "Australia/Sydney",
  "Australia/Hobart",
  "Pacific/Auckland",
  "UTC",
];

function regionFromTimeZone(tz) {
  if (tz === "UTC") return "UTC / Other";
  const [prefix] = tz.split("/");
  if (prefix === "America" || prefix === "Pacific") return "Americas";
  if (prefix === "Europe") return "Europe";
  if (prefix === "Africa") return "Africa";
  if (prefix === "Asia") return "Asia / Middle East";
  if (prefix === "Australia") return "Oceania";
  return "UTC / Other";
}

function prettyTimeZoneLabel(tz) {
  if (tz === "UTC") return "UTC";
  const parts = tz.split("/");
  const region = parts[0];
  const city = parts.slice(1).join(" / ").replace(/_/g, " ");
  return `${city} — ${tz}`;
}

function buildTimeZoneGroups() {
  let zones = [];

  try {
    if (typeof Intl !== "undefined" && typeof Intl.supportedValuesOf === "function") {
      zones = Intl.supportedValuesOf("timeZone");
    }
  } catch {
    zones = [];
  }

  if (!zones.length) zones = FALLBACK_TIMEZONES;

  const deduped = Array.from(new Set([...zones, "UTC"])).sort((a, b) => a.localeCompare(b));

  const groups = ["Americas", "Europe", "Africa", "Asia / Middle East", "Oceania", "UTC / Other"].map(
    (region) => ({
      region,
      zones: deduped.filter((tz) => regionFromTimeZone(tz) === region),
    })
  );

  return groups.filter((group) => group.zones.length > 0);
}

function Section({ title, subtitle, children }) {
  return (
    <section style={{ ...GLASS, borderRadius: 18, padding: 16 }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 900, color: SLATE }}>{title}</div>
        {subtitle ? (
          <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>{subtitle}</div>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function FieldLabel({ children }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 800, color: SLATE, marginBottom: 6 }}>
      {children}
    </div>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        borderRadius: 10,
        border: "1px solid rgba(51,65,85,0.14)",
        background: "rgba(255,255,255,0.88)",
        color: SLATE,
        fontSize: 13,
        padding: "10px 12px",
        outline: "none",
        ...(props.style || {}),
      }}
    />
  );
}

function Select(props) {
  return (
    <select
      {...props}
      style={{
        width: "100%",
        borderRadius: 10,
        border: "1px solid rgba(51,65,85,0.14)",
        background: "rgba(255,255,255,0.88)",
        color: SLATE,
        fontSize: 13,
        padding: "10px 12px",
        outline: "none",
        ...(props.style || {}),
      }}
    />
  );
}

function Textarea(props) {
  return (
    <textarea
      {...props}
      style={{
        width: "100%",
        minHeight: 110,
        borderRadius: 10,
        border: "1px solid rgba(51,65,85,0.14)",
        background: "rgba(255,255,255,0.88)",
        color: SLATE,
        fontSize: 13,
        padding: "10px 12px",
        resize: "vertical",
        outline: "none",
        ...(props.style || {}),
      }}
    />
  );
}

function PillButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        borderRadius: 999,
        padding: "9px 14px",
        fontWeight: 800,
        border: "none",
        cursor: "pointer",
        background: active ? ORANGE : "rgba(255,255,255,0.75)",
        color: active ? "#fff" : SLATE,
      }}
    >
      {children}
    </button>
  );
}

function ToggleRow({ checked, onChange, label, hint }) {
  return (
    <label
      style={{
        ...GLASS_SOFT,
        borderRadius: 12,
        padding: 12,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12,
        cursor: "pointer",
      }}
    >
      <div>
        <div style={{ fontSize: 13, fontWeight: 800, color: SLATE }}>{label}</div>
        {hint ? (
          <div style={{ fontSize: 12, color: MUTED, marginTop: 4, lineHeight: 1.5 }}>{hint}</div>
        ) : null}
      </div>
      <input type="checkbox" checked={checked} onChange={onChange} />
    </label>
  );
}

export default function SnapshotDeliveryPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [emails, setEmails] = useState("");
  const [snapshotType, setSnapshotType] = useState("executive");
  const [cadence, setCadence] = useState("weekly");
  const [sending, setSending] = useState(false);

  const timeZoneGroups = useMemo(() => buildTimeZoneGroups(), []);
  const [timeZoneRegion, setTimeZoneRegion] = useState("Americas");
  const [timezone, setTimezone] = useState("America/New_York");
  const [timeOfDay, setTimeOfDay] = useState("08:00");
  const [weeklyDay, setWeeklyDay] = useState("Monday");

  const [monthlyMode, setMonthlyMode] = useState("date");
  const [monthlyDate, setMonthlyDate] = useState("1");
  const [monthlyOrdinal, setMonthlyOrdinal] = useState("First");
  const [monthlyWeekday, setMonthlyWeekday] = useState("Monday");

  const [includePng, setIncludePng] = useState(true);
  const [includeInsights, setIncludeInsights] = useState(true);
  const [sendToSelf, setSendToSelf] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const availableZones = useMemo(() => {
    return timeZoneGroups.find((group) => group.region === timeZoneRegion)?.zones || [];
  }, [timeZoneGroups, timeZoneRegion]);

  useEffect(() => {
    if (!availableZones.length) return;
    if (!availableZones.includes(timezone)) {
      setTimezone(availableZones[0]);
    }
  }, [availableZones, timezone]);

  const parsedRecipients = useMemo(() => {
    return emails
      .split(",")
      .map((email) => email.trim())
      .filter(Boolean);
  }, [emails]);

  const header = (
    <div style={{ textAlign: "center" }}>
      <h1
        style={{
          fontSize: 28,
          fontWeight: 900,
          color: ORANGE,
          lineHeight: 1.05,
          margin: 0,
        }}
      >
        Executive Snapshot
      </h1>
      <div
        style={{
          fontSize: 22,
          fontWeight: 900,
          color: SLATE,
          lineHeight: 1.1,
          marginTop: 2,
        }}
      >
        Delivery Center
      </div>
      <p
        style={{
          fontSize: 14,
          color: "#475569",
          marginTop: 8,
          maxWidth: 760,
          marginLeft: "auto",
          marginRight: "auto",
          lineHeight: 1.6,
        }}
      >
        Set up recurring snapshot distribution, global delivery timing, and one-time sends from one place.
      </p>
    </div>
  );

  const rightRail = (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ ...GLASS_SOFT, borderRadius: 12, padding: 14 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#94A3B8",
            marginBottom: 8,
          }}
        >
          Sponsored
        </div>
        <div
          style={{
            borderRadius: 12,
            border: "1px dashed rgba(100,116,139,0.24)",
            background: "rgba(255,255,255,0.60)",
            minHeight: 180,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            textAlign: "center",
            color: "#94A3B8",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          Reserved ad / sponsor panel
        </div>
      </div>
    </div>
  );

  const handleSend = async () => {
    if (!parsedRecipients.length) {
      alert("Enter at least one email recipient.");
      return;
    }

    setSending(true);

    try {
      await fetch("/api/analytics/send-snapshot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipients: parsedRecipients,
          snapshotType,
          includePng,
          includeInsights,
          timezone,
          timeZoneRegion,
        }),
      });

      alert("Snapshot sent");
    } catch {
      alert("Failed to send snapshot");
    }

    setSending(false);
  };

  const handleSaveSchedule = () => {
    const summary =
      cadence === "daily"
        ? `Daily at ${timeOfDay} (${timezone})`
        : cadence === "weekly"
          ? `Weekly on ${weeklyDay} at ${timeOfDay} (${timezone})`
          : monthlyMode === "date"
            ? `Monthly on day ${monthlyDate} at ${timeOfDay} (${timezone})`
            : `Monthly on the ${monthlyOrdinal.toLowerCase()} ${monthlyWeekday} at ${timeOfDay} (${timezone})`;

    alert(`Schedule saving is the next DB/API wiring step.\n\nCurrent rule:\n${summary}`);
  };

  return (
    <RecruiterLayout
      title="Executive Snapshot Delivery Center"
      header={header}
      right={rightRail}
      activeNav="analytics"
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) minmax(0, 1fr)",
          gap: 12,
        }}
      >
        <Section
          title="Automated Delivery"
          subtitle="Build a recurring schedule with full timing details for global delivery."
        >
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
            {["daily", "weekly", "monthly"].map((type) => (
              <PillButton key={type} active={cadence === type} onClick={() => setCadence(type)}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </PillButton>
            ))}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
              gap: 12,
            }}
          >
            <div>
              <FieldLabel>Region</FieldLabel>
              <Select value={timeZoneRegion} onChange={(e) => setTimeZoneRegion(e.target.value)}>
                {timeZoneGroups.map((group) => (
                  <option key={group.region} value={group.region}>
                    {group.region}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <FieldLabel>Time zone</FieldLabel>
              <Select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                {availableZones.map((zone) => (
                  <option key={zone} value={zone}>
                    {prettyTimeZoneLabel(zone)}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <FieldLabel>Delivery time</FieldLabel>
              <Input type="time" value={timeOfDay} onChange={(e) => setTimeOfDay(e.target.value)} />
            </div>

            {cadence === "weekly" ? (
              <div>
                <FieldLabel>Day of week</FieldLabel>
                <Select value={weeklyDay} onChange={(e) => setWeeklyDay(e.target.value)}>
                  {WEEKDAY_OPTIONS.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </Select>
              </div>
            ) : null}
          </div>

          {cadence === "monthly" ? (
            <div style={{ marginTop: 14 }}>
              <FieldLabel>Monthly rule</FieldLabel>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
                <PillButton active={monthlyMode === "date"} onClick={() => setMonthlyMode("date")}>
                  Specific date
                </PillButton>
                <PillButton
                  active={monthlyMode === "ordinal"}
                  onClick={() => setMonthlyMode("ordinal")}
                >
                  Ordinal weekday
                </PillButton>
              </div>

              {monthlyMode === "date" ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) minmax(0, 1fr)",
                    gap: 12,
                  }}
                >
                  <div>
                    <FieldLabel>Date of month</FieldLabel>
                    <Select value={monthlyDate} onChange={(e) => setMonthlyDate(e.target.value)}>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                        <option key={day} value={String(day)}>
                          {day}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
                    gap: 12,
                  }}
                >
                  <div>
                    <FieldLabel>Ordinal</FieldLabel>
                    <Select value={monthlyOrdinal} onChange={(e) => setMonthlyOrdinal(e.target.value)}>
                      {ORDINAL_OPTIONS.map((ordinal) => (
                        <option key={ordinal} value={ordinal}>
                          {ordinal}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <FieldLabel>Weekday</FieldLabel>
                    <Select value={monthlyWeekday} onChange={(e) => setMonthlyWeekday(e.target.value)}>
                      {WEEKDAY_OPTIONS.map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          <div style={{ marginTop: 14 }}>
            <button
              onClick={handleSaveSchedule}
              style={{
                borderRadius: 10,
                background: SLATE,
                color: "#fff",
                fontWeight: 800,
                padding: "11px 16px",
                border: "none",
                cursor: "pointer",
                minWidth: 160,
              }}
            >
              Save Schedule
            </button>
          </div>
        </Section>

        <Section
          title="Send Snapshot"
          subtitle="Immediately send the current executive snapshot to the selected recipients."
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
              gap: 12,
            }}
          >
            <div>
              <FieldLabel>Snapshot type</FieldLabel>
              <Select value={snapshotType} onChange={(e) => setSnapshotType(e.target.value)}>
                <option value="executive">Executive Snapshot</option>
                <option value="full-analytics">Full Analytics Summary</option>
                <option value="funnel">Funnel Summary</option>
                <option value="source-performance">Source Performance Summary</option>
              </Select>
            </div>

            <div>
              <FieldLabel>Delivery preview</FieldLabel>
              <div style={{ ...GLASS_SOFT, borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 13, color: MUTED }}>
                  {parsedRecipients.length
                    ? `Sending to ${parsedRecipients.length} recipient${parsedRecipients.length === 1 ? "" : "s"}`
                    : "No recipients entered yet"}
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            <ToggleRow
              checked={includePng}
              onChange={(e) => setIncludePng(e.target.checked)}
              label="Include PNG-ready reporting attachment"
              hint="Prepare this for executive and stakeholder sharing."
            />
            <ToggleRow
              checked={includeInsights}
              onChange={(e) => setIncludeInsights(e.target.checked)}
              label="Include AI insights summary"
              hint="Adds the recruiter-facing insight layer to the outbound snapshot."
            />
          </div>

          <div style={{ marginTop: 14 }}>
            <button
              onClick={handleSend}
              disabled={sending}
              style={{
                borderRadius: 10,
                background: ORANGE,
                color: "#fff",
                fontWeight: 800,
                padding: "11px 16px",
                border: "none",
                cursor: "pointer",
                minWidth: 140,
              }}
            >
              {sending ? "Sending..." : "Send Now"}
            </button>
          </div>
        </Section>
      </div>

      <Section
        title="Recipients"
        subtitle="Enter emails separated by commas. These recipients are used for both one-time sends and recurring delivery."
      >
        <Textarea
          value={emails}
          onChange={(e) => setEmails(e.target.value)}
          placeholder="ceo@company.com, coo@company.com, cfo@company.com"
        />

        <div
          style={{
            marginTop: 12,
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
            gap: 10,
          }}
        >
          <ToggleRow
            checked={sendToSelf}
            onChange={(e) => setSendToSelf(e.target.checked)}
            label="Send a copy to me"
            hint="Useful for visibility and confirmation on recurring delivery."
          />
          <div style={{ ...GLASS_SOFT, borderRadius: 12, padding: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: SLATE }}>Current recipient count</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: ORANGE, marginTop: 6 }}>
              {parsedRecipients.length}
            </div>
          </div>
        </div>
      </Section>
    </RecruiterLayout>
  );
}