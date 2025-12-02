// pages/api/account/delete.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { clearUserData, deleteUserCompletely } from "@/lib/privacy/deleteUserData";

// TODO: replace this with your real auth logic
async function getUserIdFromRequest(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<string | null> {
  // Example if you're using NextAuth:
  //
  // const session = await getServerSession(req, res, authOptions);
  // return session?.user?.id ?? null;
  //
  // For now this is just a placeholder that looks for req.userId:
  return (req as any).userId ?? null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.setHeader("Allow", ["POST"]).status(405).json({ error: "Method not allowed" });
  }

  try {
    const userId = await getUserIdFromRequest(req, res);
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { type, confirm } = req.body || {};

    if (confirm !== "DELETE") {
      return res.status(400).json({ error: 'You must type "DELETE" to confirm.' });
    }

    if (type === "clear") {
      await clearUserData(userId);
      return res.status(200).json({ ok: true, type: "clear" });
    }

    if (type === "delete") {
      await deleteUserCompletely(userId);
      return res.status(200).json({ ok: true, type: "delete" });
    }

    return res.status(400).json({ error: "Invalid operation type" });
  } catch (error) {
    console.error("Error in /api/account/delete:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
