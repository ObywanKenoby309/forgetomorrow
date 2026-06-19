// pages/api/visibility/test.js
import { prisma } from "@/lib/prisma";

export default async function handler(req, res) {
  try {
    const event = await prisma.visibilityEvent.create({
      data: {
        targetUserId: "test-user",
        eventType: "TEST_EVENT",
        metadata: {
          source: "api-test",
        },
      },
    });

    return res.status(200).json({
      ok: true,
      event,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
}