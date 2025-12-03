// lib/userMode.js
// Canonical helper for interpreting a user's role + plan (tier)
// Schema:
// enum UserRole { SEEKER COACH RECRUITER ADMIN }
// enum Tier { FREE PRO COACH SMALL_BIZ ENTERPRISE }

export function getUserMode(user) {
  if (!user) {
    return {
      role: null,
      tier: null,
      isSeeker: false,
      isCoach: false,
      isRecruiter: false,
      isAdmin: false,
      isSeekerFree: false,
      isSeekerPro: false,
      isRecruiterSmallBiz: false,
      isRecruiterEnterprise: false,
    };
  }

  const role = user.role || null;
  // 🔸 Your DB/session uses `plan` for the Tier enum
  const tier = user.plan || user.tier || null;

  const isSeeker = role === "SEEKER";
  const isCoach = role === "COACH";
  const isRecruiter = role === "RECRUITER";
  const isAdmin = role === "ADMIN";

  const isSeekerFree = isSeeker && tier === "FREE";
  const isSeekerPro = isSeeker && tier === "PRO";

  const isRecruiterSmallBiz = isRecruiter && tier === "SMALL_BIZ";
  const isRecruiterEnterprise = isRecruiter && tier === "ENTERPRISE";

  return {
    role,
    tier,
    isSeeker,
    isCoach,
    isRecruiter,
    isAdmin,
    isSeekerFree,
    isSeekerPro,
    isRecruiterSmallBiz,
    isRecruiterEnterprise,
  };
}
