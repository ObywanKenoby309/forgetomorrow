// context/PlanContext.js
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

/**
 * DB-first Plan Context (LIVE)
 * Source of truth: /api/auth/me (Prisma User.plan + User.role)
 *
 * - plan: "small" | "enterprise"
 * - tier: raw Prisma enum string from DB (FREE | PRO | COACH | SMALL_BIZ | ENTERPRISE)
 * - role: "recruiter" | "admin" | "owner" | "billing" | "hiringManager" | "site_admin"
 * - features: string[] (kept, but not persisted client-side)
 *
 * Query overrides (non-persistent, for debugging only):
 *   ?plan=enterprise|small
 *   ?role=admin|owner|billing|recruiter|hiringManager|site_admin
 *   ?features=why_plus,ats_greenhouse
 */

const PlanContext = createContext(null);

function mapTierToPlan(tier) {
  switch (tier) {
    case "ENTERPRISE":
      return "enterprise";
    case "SMALL_BIZ":
    case "PRO":
    case "COACH":
    case "FREE":
    default:
      return "small";
  }
}

function mapUserRoleToContextRole(userRole) {
  // UserRole enum in DB: SEEKER | COACH | RECRUITER | ADMIN (per your comments)
  switch (userRole) {
    case "ADMIN":
      return "site_admin";
    case "RECRUITER":
      return "recruiter";
    case "COACH":
      return "recruiter";
    case "SEEKER":
    default:
      return "recruiter";
  }
}

export function PlanProvider({ children }) {
  const router = useRouter();

  // Start null to avoid “flash wrong plan” during SSR/hydration
  const [isLoaded, setIsLoaded] = useState(false);

  const [plan, setPlan] = useState(null); // "small" | "enterprise"
  const [role, setRole] = useState(null);
  const [features, setFeatures] = useState([]);
  const [tier, setTier] = useState(null);

  // ─────────────────────────────────────────────
  // 1) Sync from server (/api/auth/me) — DB truth
  // ─────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function syncFromServer() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          if (!cancelled) setIsLoaded(true);
          return;
        }

        const json = await res.json();
        const user = json?.user;

        if (!user || cancelled) {
          if (!cancelled) setIsLoaded(true);
          return;
        }

        const serverTier = user.plan || null;
        const serverPlan = mapTierToPlan(serverTier);
        const serverRole = mapUserRoleToContextRole(user.role);

        if (!cancelled) {
          setTier(serverTier);
          setPlan(serverPlan);
          setRole(serverRole);
          setIsLoaded(true);
        }
      } catch (err) {
        console.error("[PlanContext] failed to sync from /api/auth/me", err);
        if (!cancelled) setIsLoaded(true);
      }
    }

    syncFromServer();

    return () => {
      cancelled = true;
    };
  }, []);

  // ─────────────────────────────────────────────
  // 2) Optional query overrides (NO persistence)
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!router?.isReady) return;

    const qpPlan = router.query?.plan;
    if (qpPlan === "enterprise" || qpPlan === "small") {
      setPlan(qpPlan);
    }

    const qpRoleRaw = router.query?.role;
    const qpRole = typeof qpRoleRaw === "string" ? qpRoleRaw.toLowerCase() : "";
    const allowedRoles = new Set(["recruiter", "admin", "owner", "billing", "hiringmanager", "site_admin"]);
    if (allowedRoles.has(qpRole)) {
      const normalized = qpRole === "hiringmanager" ? "hiringManager" : qpRole;
      setRole(normalized);
    }

    const qpFeaturesRaw = router.query?.features;
    if (typeof qpFeaturesRaw === "string") {
      const list = qpFeaturesRaw
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      setFeatures(list);
    }
  }, [router?.isReady, router?.query?.plan, router?.query?.role, router?.query?.features]);

  // ─────────────────────────────────────────────
  // 3) Derived helpers / capabilities
  // ─────────────────────────────────────────────
  const value = useMemo(() => {
    const effectivePlan = plan || "small";
    const effectiveRole = role || "recruiter";

    const isEnterprise = effectivePlan === "enterprise";
    const isSmall = effectivePlan === "small";

    const isSiteAdmin = effectiveRole === "site_admin";
    const isRecruiterAdmin = effectiveRole === "owner" || effectiveRole === "admin" || effectiveRole === "billing" || isSiteAdmin;
    const isRecruiterSeat = effectiveRole === "recruiter";
    const isHiringManager = effectiveRole === "hiringManager";

    const featureSet = new Set(features || []);
    const has = (f) => featureSet.has(f);

    const can = (cap) => {
      switch (cap) {
        case "recruiter.settings.view":
        case "recruiter.settings.manageSeats":
          return isRecruiterAdmin || isSiteAdmin;

        case "analytics.org.view":
          return isRecruiterAdmin || isSiteAdmin;

        case "analytics.personal.view":
          return isRecruiterSeat || isRecruiterAdmin || isSiteAdmin;

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

    return {
      isLoaded,

      role: effectiveRole,
      setRole,

      plan: effectivePlan,
      isEnterprise,
      isSmall,
      setPlan,

      tier,
      isProTier: tier === "PRO",

      features,
      has,

      isRecruiterAdmin,
      isRecruiterSeat,
      isHiringManager,
      isSiteAdmin,

      can,
    };
  }, [isLoaded, plan, role, features, tier]);

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error("usePlan must be used within a PlanProvider");
  return ctx;
}
