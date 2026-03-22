// pages/api/analytics/run-snapshot-job.js
import { PrismaClient } from "@prisma/client";
import fetch from "node-fetch";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const schedule = await prisma.snapshotSchedule.findFirst();

  if (!schedule) {
    return res.status(200).json({ message: "No schedule" });
  }

  // SIMPLE: always send (MVP)
  await fetch(`${process.env.BASE_URL}/api/analytics/send-snapshot`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      recipients: schedule.recipients.split(","),
      snapshotType: "executive",
    }),
  });

  res.status(200).json({ success: true });
}