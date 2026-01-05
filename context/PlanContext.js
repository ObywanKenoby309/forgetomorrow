// context/PlanContext.js
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

/**
 * LIVE DB SOURCE OF TRUTH (no localStorage).
 *
 * Identity from /api/auth/me (Prisma User):
 *  - user.plan: FREE | PRO | COACH | SMALL_BIZ | ENTERPRISE
 *  - user.role: SEEKER | COACH | RECRUITER | ADMIN
 *
 * Exposed:
 *  - plan: "small" | "enterprise"              (recruiter packaging)
 *  - tier: raw enum from DB                    (FREE/PRO/COACH/SMALL_BIZ/ENTERPRISE)
 *  - role: "recruiter" | "site_admin" | "seeker" | "coach"
 *  - chromeMode: "seeker" | "coach" | "recruiter-smb" | "recruiter-ent"
 *
 * NOTE:
 * - No query-param overrides persisted.
 * - No localStorage. DB is source of truth.
 */

const PlanContext = createContext(null);

function mapDbTierToPlan(tier) {
  return tier === "ENTERPRISE" ? "enterprise" : "small";
}

function mapDbRoleToRoleString(dbRole) {
  switch (dbRole) {
    case "ADMIN":
      return "site_admin";
    case "RECRUITER":
      return "recruiter";
    case "COACH":
      return "coach";
    case "SEEKER":
    default:
      return "seeker";
  }
}

function deriveChromeMode({ role, plan }) {
  // If you're a recruiter (or site admin acting in recruiter surfaces), use recruiter chrome
  if (role === "recruiter" || role === "site_admin") {
    return plan === "enterprise" ? "recruiter-ent" : "recruiter-smb";
  }
  if (role === "coach") return "coach";
  return "seeker";
}

export function PlanProvider({ children }) {
  // recruiter packaging: "small" | "enterprise"
  const [plan, setPlan] = useState("small");
  // app role: "seeker" | "coach" | "recruiter" | "site_admin"
  const [role, setRole] = useState("seeker");
  // raw Tier enum (FREE | PRO | COACH | SMALL_BIZ | ENTERPRISE)
  const [tier, setTier] = useState(null);

  // features (non-persisted; keep if you still need a runtime toggle)
  const [features, setFeatures] = useState([]);

  // sync from server user (/api/auth/me) — DB truth
  useEffect(() => {
    let cancelled = false;

    async function sync() {
      try {
        const res = await fetch("/api/auth/me", { method: "GET" });
        if (!res.ok) return;

        const json = await res.json();
        const user = json?.user;
        if (!user || cancelled) return;

        const serverTier = user.plan || null;
        const serverPlan = mapDbTierToPlan(serverTier);
        const serverRole = mapDbRoleToRoleString(user.role);

        if (cancelled) return;

        setTier(serverTier);
        setPlan(serverPlan);
        setRole(serverRole);

        // If you later add DB-backed feature flags, wire them here.
        // For now: keep existing runtime features as-is.
      } catch (err) {
        console.error("[PlanContext] failed to sync from /api/auth/me", err);
      }
    }

    sync();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => {
    const isEnterprise = plan === "enterprise";
    const isSmall = plan === "small";

    const isSiteAdmin = role === "site_admin";
    const isRecruiterSeat = role === "recruiter";
    const isCoach = role === "coach";
    const isSeeker = role === "seeker";

    const featureSet = new Set(features || []);
    const has = (f) => featureSet.has(String(f || "").toLowerCase());

    const can = (cap) => {
      switch (cap) {
        case "recruiter.settings.view":
        case "recruiter.settings.manageSeats":
          return isSiteAdmin;

        case "analytics.org.view":
          return isSiteAdmin || isEnterprise;

        case "analytics.personal.view":
          return isRecruiterSeat || isSiteAdmin;

        case "why.full":
          return isSiteAdmin || isEnterprise || has("why_plus");

        case "why.lite":
          return true;

        case "recruiter.talentpools.view":
          return isEnterprise || isSiteAdmin;

        case "integrations.sso_scim":
          return isEnterprise || isSiteAdmin;

        default:
          return false;
      }
    };

    const chromeMode = deriveChromeMode({ role, plan });

    return {
      // identity-ish
      role,
      setRole, // keep if you still need local UI switching in dev; otherwise remove later

      // recruiter-facing plan
      plan,
      isEnterprise,
      isSmall,
      setPlan, // keep if needed for dev; otherwise remove later

      // raw tier
      tier,
      isProTier: tier === "PRO",

      // chrome
      chromeMode,

      // features
      features,
      setFeatures,
      has,

      // role flags
      isSeeker,
      isCoach,
      isRecruiterSeat,
      isSiteAdmin,

      // capabilities
      can,
    };
  }, [plan, role, features, tier]);

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error("usePlan must be used within a PlanProvider");
  return ctx;
}
