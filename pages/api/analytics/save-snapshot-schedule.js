// pages/api/analytics/save-snapshot-schedule.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const schedule = await prisma.snapshotSchedule.findUnique({
        where: { id: 1 },
      });

      return res.status(200).json({ success: true, schedule });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to load schedule" });
    }
  }

  if (req.method === "POST") {
    try {
      const {
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
      } = req.body || {};

      const schedule = await prisma.snapshotSchedule.upsert({
        where: { id: 1 },
        update: {
          recipients: String(recipients || ""),
          cadence: cadence || "weekly",
          timezone: timezone || "America/Chicago",
          timeOfDay: timeOfDay || "08:00",
          weeklyDay: weeklyDay || "Monday",
          monthlyMode: monthlyMode || "date",
          monthlyDate: monthlyDate || "1",
          monthlyOrdinal: monthlyOrdinal || "First",
          monthlyWeekday: monthlyWeekday || "Monday",
          includePng: !!includePng,
          includeInsights: !!includeInsights,
        },
        create: {
          id: 1,
          recipients: String(recipients || ""),
          cadence: cadence || "weekly",
          timezone: timezone || "America/Chicago",
          timeOfDay: timeOfDay || "08:00",
          weeklyDay: weeklyDay || "Monday",
          monthlyMode: monthlyMode || "date",
          monthlyDate: monthlyDate || "1",
          monthlyOrdinal: monthlyOrdinal || "First",
          monthlyWeekday: monthlyWeekday || "Monday",
          includePng: !!includePng,
          includeInsights: !!includeInsights,
        },
      });

      return res.status(200).json({ success: true, schedule });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to save schedule" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}