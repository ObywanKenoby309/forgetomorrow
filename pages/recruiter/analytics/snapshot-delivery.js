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
  "UTC",
  "Pacific/Midway",
  "Pacific/Honolulu",
  "America/Anchorage",
  "America/Adak",
  "America/Los_Angeles",
  "America/Tijuana",
  "America/Phoenix",
  "America/Denver",
  "America/Edmonton",
  "America/Chicago",
  "America/Mexico_City",
  "America/Winnipeg",
  "America/New_York",
  "America/Toronto",
  "America/Halifax",
  "America/St_Johns",
  "America/Sao_Paulo",
  "America/Buenos_Aires",
  "Atlantic/Azores",
  "Europe/London",
  "Europe/Dublin",
  "Europe/Lisbon",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Amsterdam",
  "Europe/Brussels",
  "Europe/Madrid",
  "Europe/Rome",
  "Europe/Zurich",
  "Europe/Warsaw",
  "Europe/Prague",
  "Europe/Vienna",
  "Europe/Stockholm",
  "Europe/Copenhagen",
  "Europe/Oslo",
  "Europe/Helsinki",
  "Europe/Athens",
  "Europe/Riga",
  "Europe/Vilnius",
  "Europe/Tallinn",
  "Europe/Kyiv",
  "Europe/Bucharest",
  "Europe/Istanbul",
  "Africa/Cairo",
  "Africa/Johannesburg",
  "Africa/Lagos",
  "Africa/Nairobi",
  "Asia/Jerusalem",
  "Asia/Riyadh",
  "Asia/Dubai",
  "Asia/Tehran",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Dhaka",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Kuala_Lumpur",
  "Asia/Manila",
  "Asia/Jakarta",
  "Asia/Shanghai",
  "Asia/Hong_Kong",
  "Asia/Taipei",
  "Asia/Seoul",
  "Asia/Tokyo",
  "Australia/Perth",
  "Australia/Adelaide",
  "Australia/Darwin",
  "Australia/Brisbane",
  "Australia/Sydney",
  "Australia/Hobart",
  "Pacific/Auckland",
  "Pacific/Chatham",
];

const TIMEZONE_LABEL_MAP = {
  UTC: "Coordinated Universal Time",
  "Pacific/Midway": "Samoa Standard Time",
  "Pacific/Honolulu": "Hawaii Aleutian Time",
  "America/Adak": "Hawaii Aleutian Time",
  "America/Anchorage": "Alaska Time",
  "America/Los_Angeles": "Pacific Time",
  "America/Tijuana": "Pacific Time",
  "America/Phoenix": "Mountain Time Arizona",
  "America/Denver": "Mountain Time",
  "America/Edmonton": "Mountain Time Canada",
  "America/Chicago": "Central Time",
  "America/Mexico_City": "Central Time Mexico",
  "America/Winnipeg": "Central Time Canada",
  "America/New_York": "Eastern Time",
  "America/Toronto": "Eastern Time Canada",
  "America/Halifax": "Atlantic Time",
  "America/St_Johns": "Newfoundland Time",
  "America/Sao_Paulo": "Brasilia Time",
  "America/Buenos_Aires": "Argentina Time",
  "Atlantic/Azores": "Azores Time",
  "Europe/London": "Greenwich Mean Time",
  "Europe/Dublin": "Irish Time",
  "Europe/Lisbon": "Western European Time",
  "Europe/Paris": "Central European Time",
  "Europe/Berlin": "Central European Time",
  "Europe/Amsterdam": "Central European Time",
  "Europe/Brussels": "Central European Time",
  "Europe/Madrid": "Central European Time",
  "Europe/Rome": "Central European Time",
  "Europe/Zurich": "Central European Time",
  "Europe/Warsaw": "Central European Time",
  "Europe/Prague": "Central European Time",
  "Europe/Vienna": "Central European Time",
  "Europe/Stockholm": "Central European Time",
  "Europe/Copenhagen": "Central European Time",
  "Europe/Oslo": "Central European Time",
  "Europe/Helsinki": "Eastern European Time",
  "Europe/Athens": "Eastern European Time",
  "Europe/Riga": "Eastern European Time",
  "Europe/Vilnius": "Eastern European Time",
  "Europe/Tallinn": "Eastern European Time",
  "Europe/Kyiv": "Eastern European Time",
  "Europe/Bucharest": "Eastern European Time",
  "Europe/Istanbul": "Turkey Time",
  "Africa/Cairo": "Eastern European Time Egypt",
  "Africa/Johannesburg": "South Africa Standard Time",
  "Africa/Lagos": "West Africa Time",
  "Africa/Nairobi": "East Africa Time",
  "Asia/Jerusalem": "Israel Time",
  "Asia/Riyadh": "Arabia Standard Time",
  "Asia/Dubai": "Gulf Standard Time",
  "Asia/Tehran": "Iran Standard Time",
  "Asia/Karachi": "Pakistan Standard Time",
  "Asia/Kolkata": "India Standard Time",
  "Asia/Dhaka": "Bangladesh Standard Time",
  "Asia/Bangkok": "Indochina Time",
  "Asia/Singapore": "Singapore Time",
  "Asia/Kuala_Lumpur": "Malaysia Time",
  "Asia/Manila": "Philippine Time",
  "Asia/Jakarta": "Western Indonesia Time",
  "Asia/Shanghai": "China Standard Time",
  "Asia/Hong_Kong": "Hong Kong Time",
  "Asia/Taipei": "Taipei Standard Time",
  "Asia/Seoul": "Korea Standard Time",
  "Asia/Tokyo": "Japan Standard Time",
  "Australia/Perth": "Australian Western Time",
  "Australia/Adelaide": "Australian Central Time",
  "Australia/Darwin": "Australian Central Time",
  "Australia/Brisbane": "Australian Eastern Time",
  "Australia/Sydney": "Australian Eastern Time",
  "Australia/Hobart": "Australian Eastern Time",
  "Pacific/Auckland": "New Zealand Time",
  "Pacific/Chatham": "Chatham Islands Time",
};

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

function locationLabelFromTimeZone(tz) {
  if (tz === "UTC") return "UTC";
  return tz.split("/").slice(1).join(" / ").replace(/_/g, " ");
}

function prettyTimeZoneLabel(tz) {
  const friendly = TIMEZONE_LABEL_MAP[tz] || "Time Zone";
  const location = locationLabelFromTimeZone(tz);
  if (tz === "UTC") return "Coordinated Universal Time | UTC";
  return `${friendly} | ${location}`;
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

  const deduped = Array.from(new Set([...zones, ...FALLBACK_TIMEZONES, "UTC"])).sort((a, b) =>
    a.localeCompare(b)
  );

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

function TimeZoneSelector({
  isMobile,
  groups,
  timeZoneRegion,
  setTimeZoneRegion,
  timezone,
  setTimezone,
  timeZoneSearch,
  setTimeZoneSearch,
  detectedTimezone,
}) {
  const search = timeZoneSearch.trim().toLowerCase();

  const filteredGroups = useMemo(() => {
    if (!search) {
      return groups.map((group) => ({
        ...group,
        zones: group.zones.filter((tz) => regionFromTimeZone(tz) === timeZoneRegion),
      }));
    }

    return groups.map((group) => ({
      ...group,
      zones: group.zones.filter((tz) => {
        const friendly = prettyTimeZoneLabel(tz).toLowerCase();
        const raw = tz.toLowerCase();
        return friendly.includes(search) || raw.includes(search);
      }),
    }));
  }, [groups, search, timeZoneRegion]);

  const flatMatches = filteredGroups.flatMap((group) => group.zones);

  return (
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
          {groups.map((group) => (
            <option key={group.region} value={group.region}>
              {group.region}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <FieldLabel>Search time zone</FieldLabel>
        <Input
          type="text"
          value={timeZoneSearch}
          onChange={(e) => setTimeZoneSearch(e.target.value)}
          placeholder="Search by time zone or city"
        />
      </div>

      <div style={{ gridColumn: "1 / -1" }}>
        <FieldLabel>Time zone</FieldLabel>
        <Select value={timezone} onChange={(e) => setTimezone(e.target.value)} size={isMobile ? 1 : 8}>
          {!search &&
            filteredGroups
              .filter((group) => group.zones.length > 0)
              .map((group) => (
                <optgroup key={group.region} label={group.region}>
                  {group.zones.map((zone) => (
                    <option key={zone} value={zone}>
                      {prettyTimeZoneLabel(zone)}
                    </option>
                  ))}
                </optgroup>
              ))}

          {search &&
            flatMatches.map((zone) => (
              <option key={zone} value={zone}>
                {prettyTimeZoneLabel(zone)}
              </option>
            ))}
        </Select>

        <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
          {detectedTimezone ? (
            <div style={{ fontSize: 12, color: MUTED }}>
              Detected current time zone:{" "}
              <strong style={{ color: SLATE }}>{prettyTimeZoneLabel(detectedTimezone)}</strong>
            </div>
          ) : null}

          <div style={{ fontSize: 12, color: MUTED }}>
            Selected: <strong style={{ color: SLATE }}>{prettyTimeZoneLabel(timezone)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SnapshotDeliveryPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [emails, setEmails] = useState("");
  const [snapshotType, setSnapshotType] = useState("executive");
  const [cadence, setCadence] = useState("weekly");
  const [sending, setSending] = useState(false);

  const timeZoneGroups = useMemo(() => buildTimeZoneGroups(), []);
  const [timeZoneRegion, setTimeZoneRegion] = useState("Americas");
  const [timezone, setTimezone] = useState("America/Chicago");
  const [timeZoneSearch, setTimeZoneSearch] = useState("");
  const [detectedTimezone, setDetectedTimezone] = useState("");
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

  useEffect(() => {
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      if (detected) {
        setDetectedTimezone(detected);
        setTimezone(detected);
        setTimeZoneRegion(regionFromTimeZone(detected));
      }
    } catch {
      // keep defaults
    }
  }, []);

  useEffect(() => {
    let alive = true;

    async function loadSchedule() {
      try {
        const res = await fetch("/api/analytics/save-snapshot-schedule");
        const data = await res.json();

        if (!alive || !data?.success || !data?.schedule) {
          if (alive) setLoadingSchedule(false);
          return;
        }

        const schedule = data.schedule;

        setEmails(schedule.recipients || "");
        setCadence(schedule.cadence || "weekly");
        setTimezone(schedule.timezone || "America/Chicago");
        setTimeZoneRegion(regionFromTimeZone(schedule.timezone || "America/Chicago"));
        setTimeOfDay(schedule.timeOfDay || "08:00");
        setWeeklyDay(schedule.weeklyDay || "Monday");
        setMonthlyMode(schedule.monthlyMode || "date");
        setMonthlyDate(schedule.monthlyDate || "1");
        setMonthlyOrdinal(schedule.monthlyOrdinal || "First");
        setMonthlyWeekday(schedule.monthlyWeekday || "Monday");
        setIncludePng(!!schedule.includePng);
        setIncludeInsights(!!schedule.includeInsights);
      } catch (err) {
        console.error("Failed to load snapshot schedule", err);
      } finally {
        if (alive) setLoadingSchedule(false);
      }
    }

    loadSchedule();

    return () => {
      alive = false;
    };
  }, []);

  const currentRegionZones = useMemo(() => {
    return timeZoneGroups.find((group) => group.region === timeZoneRegion)?.zones || [];
  }, [timeZoneGroups, timeZoneRegion]);

  useEffect(() => {
    if (!currentRegionZones.length) return;
    if (!currentRegionZones.includes(timezone)) {
      setTimezone(currentRegionZones[0]);
    }
  }, [currentRegionZones, timezone]);

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
      const res = await fetch("/api/analytics/send-snapshot", {
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
          cadence,
          timeOfDay,
          weeklyDay,
          monthlyMode,
          monthlyDate,
          monthlyOrdinal,
          monthlyWeekday,
        }),
      });

      const data = await res.json();

      if (data?.success) {
        alert("Snapshot sent");
      } else {
        alert(data?.error || "Failed to send snapshot");
      }
    } catch {
      alert("Failed to send snapshot");
    }

    setSending(false);
  };

  const handleSaveSchedule = async () => {
    if (!parsedRecipients.length) {
      alert("Add at least one recipient");
      return;
    }

    try {
      const res = await fetch("/api/analytics/save-snapshot-schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipients: emails,
          cadence,
          timezone,
          timeOfDay,
          weeklyDay,
          monthlyMode,
          monthlyDate,
          monthlyOrdinal,
          monthlyWeekday,
          includePng,
          includeInsights,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert("Schedule saved");
      } else {
        alert("Failed to save");
      }
    } catch (err) {
      alert("Error saving schedule");
    }
  };

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

  return (
    <RecruiterLayout
      title="Executive Snapshot Delivery Center"
      pageTitle="Executive Snapshot Delivery Center"
      pageSubtitle="Set up recurring snapshot distribution, global delivery timing, and one-time sends from one place."
      right={rightRail}
      activeNav="analytics"
    >

      {/* ── Page title ── */}
      <section style={{ ...GLASS, borderRadius: 18, padding: 16, textAlign: "center" }}>
        <div style={{ fontSize: 24, fontWeight: 900, color: ORANGE }}>Executive Snapshot</div>
        <div style={{ fontSize: 18, fontWeight: 900, color: SLATE, marginTop: 2 }}>Delivery Center</div>
        <div style={{ fontSize: 14, color: MUTED, marginTop: 6 }}>
          Set up recurring snapshot distribution.
        </div>
      </section>

      {/* ── Row 1: Recipients (left, 60%) + Send Now (right, 40%) ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 3fr) minmax(0, 2fr)",
          gap: 12,
          alignItems: "stretch",
        }}
      >
        {/* Recipients — stretches to match Send Now height */}
        <section style={{ ...GLASS, borderRadius: 18, padding: 16, display: "flex", flexDirection: "column" }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: SLATE }}>Recipients</div>
            <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>
              Enter emails separated by commas. These recipients are used for both one-time sends and recurring delivery.
            </div>
          </div>

          {/* Textarea grows to fill available height */}
          <Textarea
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            placeholder="ceo@company.com, coo@company.com, cfo@company.com"
            style={{ flex: 1, minHeight: 80, resize: "none" }}
          />

          <div
            style={{
              marginTop: 12,
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: 10,
              alignItems: "center",
            }}
          >
            <ToggleRow
              checked={sendToSelf}
              onChange={(e) => setSendToSelf(e.target.checked)}
              label="Send a copy to me"
              hint="Useful for visibility and confirmation on recurring delivery."
            />
            <div style={{ ...GLASS_SOFT, borderRadius: 12, padding: "10px 16px", textAlign: "center", minWidth: 80 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.05em" }}>Recipients</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: ORANGE, lineHeight: 1.1, marginTop: 2 }}>
                {parsedRecipients.length}
              </div>
            </div>
          </div>
        </section>

        {/* Send Now — action panel */}
        <section style={{ ...GLASS, borderRadius: 18, padding: 16, display: "flex", flexDirection: "column" }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: SLATE }}>Send Snapshot</div>
            <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>
              Immediately send the current executive snapshot to the selected recipients.
            </div>
          </div>

          <div style={{ display: "grid", gap: 10, flex: 1 }}>
            <div>
              <FieldLabel>Snapshot type</FieldLabel>
              <Select value={snapshotType} onChange={(e) => setSnapshotType(e.target.value)}>
                <option value="executive">Executive Snapshot</option>
                <option value="full-analytics">Full Analytics Summary</option>
                <option value="funnel">Funnel Summary</option>
                <option value="source-performance">Source Performance Summary</option>
              </Select>
            </div>

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

          {/* Send Now button pinned to bottom */}
          <button
            onClick={handleSend}
            disabled={sending || loadingSchedule}
            style={{
              borderRadius: 10,
              background: ORANGE,
              color: "#fff",
              fontWeight: 800,
              padding: "13px 16px",
              border: "none",
              cursor: sending || loadingSchedule ? "not-allowed" : "pointer",
              width: "100%",
              fontSize: 15,
              opacity: sending || loadingSchedule ? 0.7 : 1,
              boxShadow: "0 4px 14px rgba(255,112,67,0.30)",
              marginTop: 14,
            }}
          >
            {sending ? "Sending..." : "Send Now"}
          </button>
        </section>
      </div>

      {/* ── Row 2: Automated Delivery — full width ── */}
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

        <TimeZoneSelector
          isMobile={isMobile}
          groups={timeZoneGroups}
          timeZoneRegion={timeZoneRegion}
          setTimeZoneRegion={setTimeZoneRegion}
          timezone={timezone}
          setTimezone={setTimezone}
          timeZoneSearch={timeZoneSearch}
          setTimeZoneSearch={setTimeZoneSearch}
          detectedTimezone={detectedTimezone}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
            gap: 12,
            marginTop: 12,
          }}
        >
          <div>
            <FieldLabel>Delivery time</FieldLabel>
            <Input type="time" value={timeOfDay} onChange={(e) => setTimeOfDay(e.target.value)} />
          </div>

          {cadence === "weekly" ? (
            <div>
              <FieldLabel>Day of week</FieldLabel>
              <Select value={weeklyDay} onChange={(e) => setWeeklyDay(e.target.value)}>
                {WEEKDAY_OPTIONS.map((day) => (
                  <option key={day} value={day}>{day}</option>
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
              <PillButton active={monthlyMode === "ordinal"} onClick={() => setMonthlyMode("ordinal")}>
                Ordinal weekday
              </PillButton>
            </div>

            {monthlyMode === "date" ? (
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) minmax(0, 1fr)", gap: 12 }}>
                <div>
                  <FieldLabel>Date of month</FieldLabel>
                  <Select value={monthlyDate} onChange={(e) => setMonthlyDate(e.target.value)}>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <option key={day} value={String(day)}>{day}</option>
                    ))}
                  </Select>
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 12 }}>
                <div>
                  <FieldLabel>Ordinal</FieldLabel>
                  <Select value={monthlyOrdinal} onChange={(e) => setMonthlyOrdinal(e.target.value)}>
                    {ORDINAL_OPTIONS.map((ordinal) => (
                      <option key={ordinal} value={ordinal}>{ordinal}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <FieldLabel>Weekday</FieldLabel>
                  <Select value={monthlyWeekday} onChange={(e) => setMonthlyWeekday(e.target.value)}>
                    {WEEKDAY_OPTIONS.map((day) => (
                      <option key={day} value={day}>{day}</option>
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
            disabled={loadingSchedule}
            style={{
              borderRadius: 10,
              background: SLATE,
              color: "#fff",
              fontWeight: 800,
              padding: "11px 16px",
              border: "none",
              cursor: loadingSchedule ? "not-allowed" : "pointer",
              minWidth: 160,
              opacity: loadingSchedule ? 0.7 : 1,
            }}
          >
            {loadingSchedule ? "Loading..." : "Save Schedule"}
          </button>
        </div>
      </Section>

    </RecruiterLayout>
  );
}