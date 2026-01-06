// context/PlanContext.js
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

/**
 * DB-first Plan Context (LIVE)
 * Source of truth: /api/auth/me (Prisma User.plan + User.role)
 *
 * - plan: "small" | "enterprise" | null (null until loaded)
 * - tier: raw Prisma enum string from DB (FREE | PRO | COACH | SMALL_BIZ | ENTERPRISE)
 * - role: "seeker" | "coach" | "recruiter" | "site_admin" | null (null until loaded)
 * - features: string[] (debug overrides only; not persisted client-side)
 *
 * Query overrides (non-persistent, for debugging only):
 *   ?plan=enterprise|small
 *   ?role=seeker|coach|recruiter|site_admin|owner|admin|billing|hiringManager
 *   ?features=why_plus,ats_greenhouse
 */

const PlanContext = createContext(null);

function mapTierToPlan(tier) {
  switch (String(tier || "").toUpperCase()) {
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
  // DB enum: SEEKER | COACH | RECRUITER | ADMIN
  const r = String(userRole || "").toUpperCase();
  switch (r) {
    case "ADMIN":
      return "site_admin";
    case "RECRUITER":
      return "recruiter";
    case "COACH":
      return "coach";
    case "SEEKER":
      return "seeker";
    default:
      // Unknown should not force recruiter
      return "seeker";
  }
}

export function PlanProvider({ children }) {
  const router = useRouter();

  // Start null to avoid “flash wrong plan” during SSR/hydration
  const [isLoaded, setIsLoaded] = useState(false);

  // IMPORTANT: keep these null until server resolves.
  const [plan, setPlan] = useState(null); // "small" | "enterprise" | null
  const [role, setRole] = useState(null); // "seeker" | "coach" | "recruiter" | "site_admin" | null
  const [features, setFeatures] = useState([]);
  const [tier, setTier] = useState(null);

  // ─────────────────────────────────────────────
  // 1) Sync from server (/api/auth/me) — DB truth
  // ─────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function syncFromServer() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
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

        const serverTier = user.plan || null; // DB enum (ENTERPRISE, PRO, etc)
        const serverPlan = mapTierToPlan(serverTier); // small|enterprise
        const serverRole = mapUserRoleToContextRole(user.role); // seeker|coach|recruiter|site_admin

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
  //    Applies AFTER router ready; does not force defaults pre-load.
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!router?.isReady) return;

    const qpPlan = router.query?.plan;
    if (qpPlan === "enterprise" || qpPlan === "small") {
      setPlan(qpPlan);
    }

    const qpRoleRaw = router.query?.role;
    const qpRole = typeof qpRoleRaw === "string" ? qpRoleRaw.trim() : "";
    const qpRoleLower = qpRole.toLowerCase();

    // Allow both “DB context roles” and “org-style roles” for testing
    const allowedRoles = new Set([
      "seeker",
      "coach",
      "recruiter",
      "site_admin",
      "owner",
      "admin",
      "billing",
      "hiringmanager",
    ]);

    if (allowedRoles.has(qpRoleLower)) {
      const normalized =
        qpRoleLower === "hiringmanager" ? "hiringManager" : qpRoleLower;
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
    // KEY CHANGE:
    // Do NOT default to "small"/"recruiter" before isLoaded.
    // That was causing the SMB flash.
    const effectivePlan = isLoaded ? (plan || "small") : null;
    const effectiveRole = isLoaded ? (role || "seeker") : null;

    const isEnterprise = effectivePlan === "enterprise";
    const isSmall = effectivePlan === "small";

    // Support both context roles and org-style roles (your sidebar uses owner/admin/billing)
    const isSiteAdmin = effectiveRole === "site_admin";

    const isRecruiterAdmin =
      effectiveRole === "owner" ||
      effectiveRole === "admin" ||
      effectiveRole === "billing" ||
      isSiteAdmin;

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

      // expose raw resolved values
      plan: effectivePlan, // null until loaded
      role: effectiveRole, // null until loaded
      tier,

      // booleans
      isEnterprise,
      isSmall,
      isProTier: tier === "PRO",

      // debug controls (ok to keep)
      setPlan,
      setRole,

      // features (debug only)
      features,
      has,

      // role helpers
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
