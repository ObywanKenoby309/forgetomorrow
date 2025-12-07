// context/PlanContext.js
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/router";

/**
 * Access/Plan context:
 * - plan: "small" | "enterprise"           ← recruiter-facing packaging
 * - tier: "FREE" | "PRO" | "COACH" | "SMALL_BIZ" | "ENTERPRISE" (Prisma enum)
 * - role: "recruiter" | "admin" | "owner" | "billing" | "hiringManager" | "site_admin"
 * - features: string[]
 *
 * Dev overrides (persist):
 *   ?plan=enterprise|small
 *   ?role=admin|owner|billing|recruiter|hiringManager|site_admin
 *   ?features=why_plus,ats_greenhouse
 *
 * LocalStorage keys:
 *   ft_recruiter_plan, ft_role, ft_features (JSON array), ft_tier
 */

const PlanContext = createContext(null);

export function PlanProvider({ children }) {
  const router = useRouter();

  // State
  const [plan, setPlan] = useState("small"); // recruiter packaging: "small" | "enterprise"
  const [role, setRole] = useState("recruiter");
  const [features, setFeatures] = useState([]);

  // Raw Tier enum from user (FREE | PRO | COACH | SMALL_BIZ | ENTERPRISE)
  const [tier, setTier] = useState(null);

  // Track if query params have explicitly overridden plan/role
  const [hasQueryPlanOverride, setHasQueryPlanOverride] = useState(false);
  const [hasQueryRoleOverride, setHasQueryRoleOverride] = useState(false);

  // ─────────────────────────────────────────────
  // 1) Initial hydrate from localStorage
  // ─────────────────────────────────────────────
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;

      const savedPlan = localStorage.getItem("ft_recruiter_plan");
      const savedRole = localStorage.getItem("ft_role");
      const savedFeatures = JSON.parse(
        localStorage.getItem("ft_features") || "[]"
      );
      const savedTier = localStorage.getItem("ft_tier");

      if (savedPlan === "enterprise" || savedPlan === "small") {
        setPlan(savedPlan);
      }
      if (savedRole) setRole(savedRole);
      if (Array.isArray(savedFeatures)) setFeatures(savedFeatures);

      if (typeof savedTier === "string" && savedTier.length > 0) {
        setTier(savedTier);
      }
    } catch {
      /* noop */
    }
  }, []);

  // ─────────────────────────────────────────────
  // 2) Query param overrides (persist)
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!router?.isReady) return;

    // plan
    const qpPlan = router.query?.plan;
    if (qpPlan === "enterprise" || qpPlan === "small") {
      setPlan(qpPlan);
      setHasQueryPlanOverride(true);
      try {
        localStorage.setItem("ft_recruiter_plan", qpPlan);
      } catch {}
    }

    // role
    const qpRoleRaw = router.query?.role;
    const qpRole =
      typeof qpRoleRaw === "string" ? qpRoleRaw.toLowerCase() : "";
    const allowedRoles = new Set([
      "recruiter",
      "admin",
      "owner",
      "billing",
      "hiringmanager",
      "site_admin",
    ]);
    if (allowedRoles.has(qpRole)) {
      const normalized = qpRole === "hiringmanager" ? "hiringManager" : qpRole;
      setRole(normalized);
      setHasQueryRoleOverride(true);
      try {
        localStorage.setItem("ft_role", normalized);
      } catch {}
    }

    // features
    const qpFeaturesRaw = router.query?.features;
    if (typeof qpFeaturesRaw === "string") {
      const list = qpFeaturesRaw
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      setFeatures(list);
      try {
        localStorage.setItem("ft_features", JSON.stringify(list));
      } catch {}
    }
  }, [
    router?.isReady,
    router?.query?.plan,
    router?.query?.role,
    router?.query?.features,
  ]);

  // ─────────────────────────────────────────────
  // 3) Sync from server user (/api/auth/me)
  //
  //    - Only runs if there is NO ?plan override.
  //    - Maps Prisma enums → local "small"/"enterprise" + role.
  //    - Also preserves raw Tier enum for seeker headers, etc.
  // ─────────────────────────────────────────────
  useEffect(() => {
    // Don’t fight explicit ?plan / ?role overrides
    if (hasQueryPlanOverride && hasQueryRoleOverride) return;

    let cancelled = false;

    async function syncFromServer() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) return;

        const json = await res.json();
        const user = json?.user;
        if (!user || cancelled) return;

        // Persist raw Tier for seekers, etc.
        const serverTier = user.plan || null;
        if (!cancelled) {
          setTier(serverTier);
          try {
            if (serverTier) {
              localStorage.setItem("ft_tier", serverTier);
            }
          } catch {}
        }

        // Map Tier enum → "small" | "enterprise"
        // Tier: FREE | PRO | COACH | SMALL_BIZ | ENTERPRISE
        let serverPlan = "small";
        switch (user.plan) {
          case "ENTERPRISE":
            serverPlan = "enterprise";
            break;
          case "SMALL_BIZ":
          case "PRO":
          case "COACH":
          case "FREE":
          default:
            serverPlan = "small";
            break;
        }

        // Map UserRole enum → recruiter-role-ish string
        // UserRole: SEEKER | COACH | RECRUITER | ADMIN
        let serverRole = "recruiter";
        switch (user.role) {
          case "ADMIN":
            serverRole = "site_admin";
            break;
          case "RECRUITER":
            serverRole = "recruiter";
            break;
          case "COACH":
            // For now treat as recruiter seat in this context;
            // coaching-specific context can specialize later.
            serverRole = "recruiter";
            break;
          case "SEEKER":
          default:
            serverRole = "recruiter";
            break;
        }

        if (!cancelled) {
          // Only override plan if no ?plan= override is present
          if (!hasQueryPlanOverride) {
            setPlan(serverPlan);
            try {
              localStorage.setItem("ft_recruiter_plan", serverPlan);
            } catch {}
          }

          // Only override role if no ?role= override is present
          if (!hasQueryRoleOverride) {
            setRole(serverRole);
            try {
              localStorage.setItem("ft_role", serverRole);
            } catch {}
          }
        }
      } catch (err) {
        console.error("[PlanContext] failed to sync from /api/auth/me", err);
      }
    }

    syncFromServer();

    return () => {
      cancelled = true;
    };
  }, [hasQueryPlanOverride, hasQueryRoleOverride]);

  // ─────────────────────────────────────────────
  // 4) Persist on change (plan only; role/features
  //    are set above when changed via UI or query)
  // ─────────────────────────────────────────────
  useEffect(() => {
    try {
      localStorage.setItem("ft_recruiter_plan", plan);
    } catch {
      /* noop */
    }
  }, [plan]);

  // ─────────────────────────────────────────────
  // 5) Derived helpers / capabilities
  // ─────────────────────────────────────────────
  const value = useMemo(() => {
    const isEnterprise = plan === "enterprise";
    const isSmall = plan === "small";

    // convenience role flags
    const isSiteAdmin = role === "site_admin";
    const isRecruiterAdmin =
      role === "owner" || role === "admin" || role === "billing" || isSiteAdmin;
    const isRecruiterSeat = role === "recruiter";
    const isHiringManager = role === "hiringManager";

    const featureSet = new Set(features || []);
    const has = (f) => featureSet.has(f);

    // central capability check
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

    // Dev toggler kept for non-prod use
    const togglePlan = () =>
      setPlan((p) => (p === "enterprise" ? "small" : "enterprise"));

    return {
      // identity-ish
      role,
      setRole,

      // recruiter-facing plan
      plan,
      isEnterprise,
      isSmall,
      setPlan,
      togglePlan,

      // raw Tier from user (FREE / PRO / COACH / SMALL_BIZ / ENTERPRISE)
      tier,
      isProTier: tier === "PRO",

      // features
      features,
      has,

      // roles
      isRecruiterAdmin,
      isRecruiterSeat,
      isHiringManager,
      isSiteAdmin,

      // capabilities
      can,
    };
  }, [plan, role, features, tier]);

  return (
    <PlanContext.Provider value={value}>{children}</PlanContext.Provider>
  );
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error("usePlan must be used within a PlanProvider");
  return ctx;
}
