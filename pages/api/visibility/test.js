// pages/api/visibility/test.js
import { prisma } from "@/lib/prisma";

export default async function handler(req, res) {
  try {
    const user = await prisma.user.findFirst({
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        ok: false,
        error: "No user found to test against.",
      });
    }

    const event = await prisma.visibilityEvent.create({
      data: {
        targetUserId: user.id,
        eventType: "TEST_EVENT",
        metadata: {
          source: "api-test",
          targetEmail: user.email,
          targetName: user.name,
        },
      },
    });

    return res.status(200).json({
      ok: true,
      targetUser: user,
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