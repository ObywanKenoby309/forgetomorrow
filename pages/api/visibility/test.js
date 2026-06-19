// pages/api/visibility/test.js
import { prisma } from "@/lib/prisma";

export default async function handler(req, res) {
  try {
    const count = await prisma.visibilityEvent.count();

    return res.status(200).json({
      ok: true,
      count,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
}