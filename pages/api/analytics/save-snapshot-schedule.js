// pages/api/analytics/save-snapshot-schedule.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // ── Auth — every request must have a valid session
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Use email as the stable per-user key.
  // If your User model has a numeric id you'd rather use, swap this for
  // session.user.id — just make sure your NextAuth callbacks expose it.
  const userEmail = session.user.email;

  // ── GET — load THIS user's schedule only
  if (req.method === "GET") {
    try {
      const schedule = await prisma.snapshotSchedule.findUnique({
        where: { userEmail },
      });
      // Return success even if no schedule exists yet — frontend handles null
      return res.status(200).json({ success: true, schedule: schedule || null });
    } catch (err) {
      console.error("Failed to load snapshot schedule", err);
      return res.status(500).json({ error: "Failed to load schedule" });
    }
  }

  // ── POST — save THIS user's schedule only
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
        sendToSelf,
      } = req.body || {};

      const data = {
        userEmail,
        recipients: String(recipients || ""),
        cadence:        cadence        || "weekly",
        timezone:       timezone       || "America/Chicago",
        timeOfDay:      timeOfDay      || "08:00",
        weeklyDay:      weeklyDay      || "Monday",
        monthlyMode:    monthlyMode    || "date",
        monthlyDate:    monthlyDate    || "1",
        monthlyOrdinal: monthlyOrdinal || "First",
        monthlyWeekday: monthlyWeekday || "Monday",
        includePng:     !!includePng,
        includeInsights: !!includeInsights,
        sendToSelf:     !!sendToSelf,
      };

      const schedule = await prisma.snapshotSchedule.upsert({
        where:  { userEmail },
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