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

const COUNTRY_TIMEZONES = [
  {
    country: "United States",
    zones: [
      { value: "America/New_York", label: "Eastern Time" },
      { value: "America/Chicago", label: "Central Time" },
      { value: "America/Denver", label: "Mountain Time" },
      { value: "America/Phoenix", label: "Arizona" },
      { value: "America/Los_Angeles", label: "Pacific Time" },
      { value: "America/Anchorage", label: "Alaska" },
      { value: "Pacific/Honolulu", label: "Hawaii" },
    ],
  },
  {
    country: "Canada",
    zones: [
      { value: "America/St_Johns", label: "Newfoundland" },
      { value: "America/Halifax", label: "Atlantic" },
      { value: "America/Toronto", label: "Eastern" },
      { value: "America/Winnipeg", label: "Central" },
      { value: "America/Edmonton", label: "Mountain" },
      { value: "America/Vancouver", label: "Pacific" },
    ],
  },
  {
    country: "Mexico",
    zones: [
      { value: "America/Mexico_City", label: "Central" },
      { value: "America/Cancun", label: "Quintana Roo" },
      { value: "America/Chihuahua", label: "Chihuahua" },
      { value: "America/Tijuana", label: "Baja California" },
    ],
  },
  {
    country: "Brazil",
    zones: [
      { value: "America/Sao_Paulo", label: "São Paulo" },
      { value: "America/Manaus", label: "Amazonas" },
      { value: "America/Recife", label: "Recife" },
    ],
  },
  {
    country: "United Kingdom",
    zones: [{ value: "Europe/London", label: "United Kingdom" }],
  },
  {
    country: "Ireland",
    zones: [{ value: "Europe/Dublin", label: "Ireland" }],
  },
  {
    country: "Portugal",
    zones: [
      { value: "Europe/Lisbon", label: "Mainland Portugal" },
      { value: "Atlantic/Azores", label: "Azores" },
      { value: "Atlantic/Madeira", label: "Madeira" },
    ],
  },
  {
    country: "Spain",
    zones: [
      { value: "Europe/Madrid", label: "Mainland Spain" },
      { value: "Atlantic/Canary", label: "Canary Islands" },
    ],
  },
  {
    country: "France",
    zones: [{ value: "Europe/Paris", label: "France" }],
  },
  {
    country: "Germany",
    zones: [{ value: "Europe/Berlin", label: "Germany" }],
  },
  {
    country: "Netherlands",
    zones: [{ value: "Europe/Amsterdam", label: "Netherlands" }],
  },
  {
    country: "Belgium",
    zones: [{ value: "Europe/Brussels", label: "Belgium" }],
  },
  {
    country: "Switzerland",
    zones: [{ value: "Europe/Zurich", label: "Switzerland" }],
  },
  {
    country: "Italy",
    zones: [{ value: "Europe/Rome", label: "Italy" }],
  },
  {
    country: "Poland",
    zones: [{ value: "Europe/Warsaw", label: "Poland" }],
  },
  {
    country: "Sweden",
    zones: [{ value: "Europe/Stockholm", label: "Sweden" }],
  },
  {
    country: "Norway",
    zones: [{ value: "Europe/Oslo", label: "Norway" }],
  },
  {
    country: "Denmark",
    zones: [{ value: "Europe/Copenhagen", label: "Denmark" }],
  },
  {
    country: "Finland",
    zones: [{ value: "Europe/Helsinki", label: "Finland" }],
  },
  {
    country: "Latvia",
    zones: [{ value: "Europe/Riga", label: "Latvia" }],
  },
  {
    country: "Lithuania",
    zones: [{ value: "Europe/Vilnius", label: "Lithuania" }],
  },
  {
    country: "Estonia",
    zones: [{ value: "Europe/Tallinn", label: "Estonia" }],
  },
  {
    country: "Ukraine",
    zones: [{ value: "Europe/Kyiv", label: "Ukraine" }],
  },
  {
    country: "Greece",
    zones: [{ value: "Europe/Athens", label: "Greece" }],
  },
  {
    country: "Turkey",
    zones: [{ value: "Europe/Istanbul", label: "Turkey" }],
  },
  {
    country: "South Africa",
    zones: [{ value: "Africa/Johannesburg", label: "South Africa" }],
  },
  {
    country: "UAE",
    zones: [{ value: "Asia/Dubai", label: "United Arab Emirates" }],
  },
  {
    country: "Saudi Arabia",
    zones: [{ value: "Asia/Riyadh", label: "Saudi Arabia" }],
  },
  {
    country: "India",
    zones: [{ value: "Asia/Kolkata", label: "India" }],
  },
  {
    country: "Singapore",
    zones: [{ value: "Asia/Singapore", label: "Singapore" }],
  },
  {
    country: "China",
    zones: [{ value: "Asia/Shanghai", label: "China" }],
  },
  {
    country: "Japan",
    zones: [{ value: "Asia/Tokyo", label: "Japan" }],
  },
  {
    country: "South Korea",
    zones: [{ value: "Asia/Seoul", label: "South Korea" }],
  },
  {
    country: "Philippines",
    zones: [{ value: "Asia/Manila", label: "Philippines" }],
  },
  {
    country: "Indonesia",
    zones: [
      { value: "Asia/Jakarta", label: "Western Indonesia" },
      { value: "Asia/Makassar", label: "Central Indonesia" },
      { value: "Asia/Jayapura", label: "Eastern Indonesia" },
    ],
  },
  {
    country: "Thailand",
    zones: [{ value: "Asia/Bangkok", label: "Thailand" }],
  },
  {
    country: "Malaysia",
    zones: [{ value: "Asia/Kuala_Lumpur", label: "Malaysia" }],
  },
  {
    country: "Australia",
    zones: [
      { value: "Australia/Perth", label: "Western Australia" },
      { value: "Australia/Adelaide", label: "South Australia" },
      { value: "Australia/Darwin", label: "Northern Territory" },
      { value: "Australia/Brisbane", label: "Queensland" },
      { value: "Australia/Sydney", label: "New South Wales / ACT" },
      { value: "Australia/Hobart", label: "Tasmania" },
    ],
  },
  {
    country: "New Zealand",
    zones: [
      { value: "Pacific/Auckland", label: "New Zealand" },
      { value: "Pacific/Chatham", label: "Chatham Islands" },
    ],
  },
];

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

  const [country, setCountry] = useState("United States");
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
    return COUNTRY_TIMEZONES.find((item) => item.country === country)?.zones || [];
  }, [country]);

  useEffect(() => {
    if (!availableZones.length) return;
    const found = availableZones.some((zone) => zone.value === timezone);
    if (!found) {
      setTimezone(availableZones[0].value);
    }
  }, [availableZones, timezone]);

  const parsedRecipients = useMemo(() => {
    return emails
      .split(",")
      .map((email) => email.trim())
      .filter(Boolean);
  }, [emails]);

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
        }),
      });

      alert("Snapshot sent");
    } catch (err) {
      alert("Failed to send snapshot");
    }

    setSending(false);
  };

  const handleSaveSchedule = () => {
    const scheduleSummary =
      cadence === "daily"
        ? `Daily at ${timeOfDay} (${timezone})`
        : cadence === "weekly"
          ? `Weekly on ${weeklyDay} at ${timeOfDay} (${timezone})`
          : monthlyMode === "date"
            ? `Monthly on day ${monthlyDate} at ${timeOfDay} (${timezone})`
            : `Monthly on the ${monthlyOrdinal.toLowerCase()} ${monthlyWeekday} at ${timeOfDay} (${timezone})`;

    alert(`Schedule saving is the next wiring step.\n\nCurrent rule:\n${scheduleSummary}`);
  };

  return (
    <RecruiterLayout
      title="Executive Snapshot Delivery Center"
      subtitle="Configure recipients, send a snapshot now, or build a recurring executive delivery schedule."
    >
      <div
        style={{
          display: "grid",
          gap: 12,
          width: "100%",
          maxWidth: 1120,
          margin: "0 auto",
        }}
      >
        <Section
          title="Executive Snapshot Delivery Center"
          subtitle="Set up recurring snapshot distribution, global delivery timing, and one-time sends from one place."
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: 12,
            }}
          >
            <div style={{ ...GLASS_SOFT, borderRadius: 14, padding: 14 }}>
              <div style={{ fontSize: 12, color: MUTED }}>Current purpose</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: SLATE, marginTop: 4 }}>
                Executive reporting and scheduled stakeholder delivery
              </div>
            </div>
            <div style={{ ...GLASS_SOFT, borderRadius: 14, padding: 14 }}>
              <div style={{ fontSize: 12, color: MUTED }}>Supported modes</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: SLATE, marginTop: 4 }}>
                Send now, daily, weekly, monthly
              </div>
            </div>
          </div>
        </Section>

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

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) minmax(0, 1.3fr)",
            gap: 12,
            alignItems: "start",
          }}
        >
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

          <Section
            title="Automated Delivery"
            subtitle="Build a recurring schedule with the timing details needed for global delivery."
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
                <FieldLabel>Country / region</FieldLabel>
                <Select value={country} onChange={(e) => setCountry(e.target.value)}>
                  {COUNTRY_TIMEZONES.map((item) => (
                    <option key={item.country} value={item.country}>
                      {item.country}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <FieldLabel>Time zone</FieldLabel>
                <Select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                  {availableZones.map((zone) => (
                    <option key={zone.value} value={zone.value}>
                      {zone.label} — {zone.value}
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
                      <Select
                        value={monthlyOrdinal}
                        onChange={(e) => setMonthlyOrdinal(e.target.value)}
                      >
                        {ORDINAL_OPTIONS.map((ordinal) => (
                          <option key={ordinal} value={ordinal}>
                            {ordinal}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <FieldLabel>Weekday</FieldLabel>
                      <Select
                        value={monthlyWeekday}
                        onChange={(e) => setMonthlyWeekday(e.target.value)}
                      >
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
        </div>
      </div>
    </RecruiterLayout>
  );
}