// pages/api/analytics/save-snapshot-schedule.js
//
// GET  ?reportType=executive  — load one schedule for current user
// POST body.reportType        — save one schedule for current user
//
// Each user has up to 5 independent schedules:
//   executive | funnel | sources | activity | time-to-fill
// Saving one NEVER touches another.

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const VALID_REPORT_TYPES = [
  "executive",
  "funnel",
  "sources",
  "activity",
  "time-to-fill",
];

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userEmail = session.user.email;

  // ── GET
  if (req.method === "GET") {
    const reportType = req.query.reportType || "executive";
    if (!VALID_REPORT_TYPES.includes(reportType)) {
      return res.status(400).json({ error: "Invalid reportType" });
    }
    try {
      const schedule = await prisma.snapshotSchedule.findUnique({
        where: { userEmail_reportType: { userEmail, reportType } },
      });
      return res.status(200).json({ success: true, schedule: schedule || null });
    } catch (err) {
      console.error("Failed to load snapshot schedule", err);
      return res.status(500).json({ error: "Failed to load schedule" });
    }
  }

  // ── POST
  if (req.method === "POST") {
    const {
      reportType = "executive",
      recipients,
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
      sendToSelf,
    } = req.body || {};

    if (!VALID_REPORT_TYPES.includes(reportType)) {
      return res.status(400).json({ error: "Invalid reportType" });
    }

    const data = {
      userEmail,
      reportType,
      recipients:      String(recipients || ""),
      cadence:         cadence         || "weekly",
      timezone:        timezone        || "America/Chicago",
      timeOfDay:       timeOfDay       || "08:00",
      weeklyDay:       weeklyDay       || "Monday",
      monthlyMode:     monthlyMode     || "date",
      monthlyDate:     monthlyDate     || "1",
      monthlyOrdinal:  monthlyOrdinal  || "First",
      monthlyWeekday:  monthlyWeekday  || "Monday",
      includePng:      !!includePng,
      includeInsights: !!includeInsights,
      sendToSelf:      !!sendToSelf,
    };

    try {
      const schedule = await prisma.snapshotSchedule.upsert({
        where:  { userEmail_reportType: { userEmail, reportType } },
        update: data,
        create: data,
      });
      return res.status(200).json({ success: true, schedule });
    } catch (err) {
      console.error("Failed to save snapshot schedule", err);
      return res.status(500).json({ error: "Failed to save schedule" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}