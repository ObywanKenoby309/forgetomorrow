// pages/api/analytics/run-snapshot-job.js
//
// Called hourly by Vercel Cron. Loops every user × every report schedule.
// Each schedule is checked independently for timing. Fires send-snapshot
// only when the user's configured time/cadence/timezone matches NOW.
//
// vercel.json:
// { "crons": [{ "path": "/api/analytics/run-snapshot-job", "schedule": "0 * * * *" }] }
//
// Required env vars:
//   CRON_SECRET  — set in Vercel, passed as x-cron-secret header
//   BASE_URL     — your deployment URL e.g. https://forgetomorrow.com

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Timing helpers ───────────────────────────────────────────────────────────

function nowInTimezone(timezone) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit",
      hour12: false, weekday: "long",
    }).formatToParts(new Date());

    const get = (type) => parts.find((p) => p.type === type)?.value ?? "";
    return {
      hour:    parseInt(get("hour"), 10),
      minute:  parseInt(get("minute"), 10),
      weekday: get("weekday"),
      day:     parseInt(get("day"), 10),
    };
  } catch {
    const now = new Date();
    return {
      hour:    now.getUTCHours(),
      minute:  now.getUTCMinutes(),
      weekday: ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][now.getUTCDay()],
      day:     now.getUTCDate(),
    };
  }
}

function getNthWeekdayOfMonth(ordinal, weekday, timezone) {
  try {
    const now   = new Date();
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone, year: "numeric", month: "numeric",
    }).formatToParts(now);
    const year  = parseInt(parts.find((p) => p.type === "year")?.value  ?? now.getFullYear(), 10);
    const month = parseInt(parts.find((p) => p.type === "month")?.value ?? now.getMonth() + 1, 10) - 1;

    const WEEKDAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const targetIdx = WEEKDAYS.indexOf(weekday);
    if (targetIdx === -1) return -1;

    const ORDINALS = { First: 1, Second: 2, Third: 3, Fourth: 4, Last: -1 };
    const ordinalNum = ORDINALS[ordinal];
    if (ordinalNum === undefined) return -1;

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    if (ordinalNum === -1) {
      for (let d = daysInMonth; d >= 1; d--) {
        if (new Date(year, month, d).getDay() === targetIdx) return d;
      }
      return -1;
    }

    let count = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      if (new Date(year, month, d).getDay() === targetIdx) {
        count++;
        if (count === ordinalNum) return d;
      }
    }
    return -1;
  } catch {
    return -1;
  }
}

function shouldSendNow(schedule) {
  const tz = schedule.timezone || "America/Chicago";
  const { hour, minute, weekday, day } = nowInTimezone(tz);

  const [scheduledHour, scheduledMinute] = (schedule.timeOfDay || "08:00")
    .split(":")
    .map((n) => parseInt(n, 10));

  // 5-minute window in case cron fires slightly off
  if (hour !== scheduledHour) return false;
  if (minute < scheduledMinute || minute > scheduledMinute + 5) return false;

  switch (schedule.cadence) {
    case "daily":
      return true;
    case "weekly":
      return weekday === (schedule.weeklyDay || "Monday");
    case "monthly": {
      if (schedule.monthlyMode === "ordinal") {
        const targetDay = getNthWeekdayOfMonth(
          schedule.monthlyOrdinal || "First",
          schedule.monthlyWeekday || "Monday",
          tz
        );
        return day === targetDay;
      }
      return day === parseInt(schedule.monthlyDate || "1", 10);
    }
    default:
      return false;
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  // Protect with cron secret
  const secret = req.headers["x-cron-secret"] || req.query.secret;
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const schedules = await prisma.snapshotSchedule.findMany();

    if (!schedules.length) {
      return res.status(200).json({ message: "No schedules found", sent: 0 });
    }

    const results = [];

    for (const schedule of schedules) {
      const recipients = schedule.recipients
        ? schedule.recipients.split(",").map((r) => r.trim()).filter(Boolean)
        : [];

      if (!recipients.length) {
        results.push({ userEmail: schedule.userEmail, reportType: schedule.reportType, skipped: true, reason: "no recipients" });
        continue;
      }

      if (!shouldSendNow(schedule)) {
        results.push({ userEmail: schedule.userEmail, reportType: schedule.reportType, skipped: true, reason: "not scheduled time" });
        continue;
      }

      // Fetch analytics data for this user
      let analyticsData = null;
      try {
        const analyticsRes = await fetch(
          `${process.env.BASE_URL}/api/analytics/summary?userEmail=${encodeURIComponent(schedule.userEmail)}&reportType=${encodeURIComponent(schedule.reportType)}`,
          { headers: { "x-cron-secret": process.env.CRON_SECRET } }
        );
        if (analyticsRes.ok) analyticsData = await analyticsRes.json();
      } catch {
        // Non-fatal — email sends with empty data
      }

      // Fire the email
      try {
        const sendRes = await fetch(`${process.env.BASE_URL}/api/analytics/send-snapshot`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-cron-secret": process.env.CRON_SECRET,
          },
          body: JSON.stringify({
            recipients,
            reportType:      schedule.reportType,
            accountName:     analyticsData?.accountName     || schedule.userEmail,
            recruiterName:   analyticsData?.recruiterName   || schedule.userEmail,
            reportingWindow: analyticsData?.reportingWindow || "Current period",
            kpis:            analyticsData?.kpis            || {},
            funnelData:      analyticsData?.funnel          || [],
            sourcesData:     analyticsData?.sources         || [],
            activityData:    analyticsData?.recruiterActivity || [],
            insightSummary:  analyticsData?.insightSummary  || null,
            includeInsights: schedule.includeInsights,
            sendToSelf:      schedule.sendToSelf,
            timezone:        schedule.timezone,
          }),
        });

        const sendData = await sendRes.json();
        results.push({
          userEmail:  schedule.userEmail,
          reportType: schedule.reportType,
          sent:       sendData.success ?? false,
          error:      sendData.error   || null,
        });
      } catch (err) {
        results.push({
          userEmail:  schedule.userEmail,
          reportType: schedule.reportType,
          sent:       false,
          error:      err?.message || "Send failed",
        });
      }
    }

    const sentCount    = results.filter((r) => r.sent).length;
    const skippedCount = results.filter((r) => r.skipped).length;

    return res.status(200).json({
      success: true,
      total:   schedules.length,
      sent:    sentCount,
      skipped: skippedCount,
      results,
    });
  } catch (err) {
    console.error("run-snapshot-job error:", err);
    return res.status(500).json({ error: "Job failed", message: err?.message });
  }
}