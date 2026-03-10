// pages/api/register.js
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { normalizeSlug, randomSuffix, hasBannedTerm } from '@/lib/slug';

// ---- Slug generator -------------------------------------------------------
async function generateUniqueSlug(email) {
  const base = normalizeSlug(email.split('@')[0]) || 'user';
  let attempt = 0;
  while (attempt < 10) {
    const candidate = `${base}-${randomSuffix(5)}`;
    if (hasBannedTerm(candidate)) { attempt++; continue; }
    const exists = await prisma.user.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!exists) return candidate;
    attempt++;
  }
  return `user-${randomSuffix(8)}`;
}

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, password, role: inputRole } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  try {
    // ---- Role + Tier mapping -------------------------------------------------
    const roleMap = {
      seeker: "SEEKER",
      "seeker pro": "SEEKER",
      coach: "COACH",
      recruiter: "RECRUITER",
      "recruiter smb": "RECRUITER",
      "recruiter enterprise": "RECRUITER",
      admin: "ADMIN",
    };
    const tierMap = {
      "seeker pro": "PRO",
      "recruiter smb": "SMALL_BIZ",
      "recruiter enterprise": "ENTERPRISE",
    };

    const normalized = inputRole?.toLowerCase().trim() || "seeker";
    const prismaRole = roleMap[normalized] || "SEEKER";
    const plan = tierMap[normalized] || (prismaRole === "SEEKER" ? "FREE" : null);

    // ---- Check existing user -------------------------------------------------
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      return res.status(409).json({ error: "User already exists" });
    }

    // ---- Hash password -------------------------------------------------------
    const passwordHash = await bcrypt.hash(password, 12);

    // ---- Generate slug -------------------------------------------------------
    const slug = await generateUniqueSlug(normalizedEmail);

    // ---- Create user ---------------------------------------------------------
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        role: prismaRole,
        plan,
        slug,
      },
      select: {
        id: true,
        email: true,
        role: true,
        plan: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      message: "User registered successfully",
      user,
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return res.status(500).json({
      error: "Failed to register user",
      details: err.message,
    });
  }
}