// pages/api/analytics/save-snapshot-schedule.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

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
    } = req.body;

    // TEMP: single schedule per user (replace with auth later)
    const schedule = await prisma.snapshotSchedule.upsert({
      where: { id: 1 },
      update: {
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
      },
      create: {
        id: 1,
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
      },
    });

    return res.status(200).json({ success: true, schedule });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to save schedule" });
  }
}