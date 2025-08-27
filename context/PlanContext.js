// context/PlanContext.js
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

/**
 * Access/Plan context (pre-SQL):
 * - plan: "small" | "enterprise"               (existing)
 * - role: "recruiter" | "admin" | "owner" | "billing" | "hiringManager" | "site_admin"
 * - features: string[]                          e.g., ["why_plus", "ats_greenhouse"]
 *
 * Dev overrides (persist):
 *   ?plan=enterprise|small
 *   ?role=admin|owner|billing|recruiter|hiringManager|site_admin
 *   ?features=why_plus,ats_greenhouse
 *
 * LocalStorage keys:
 *   ft_recruiter_plan, ft_role, ft_features (JSON array)
 */

const PlanContext = createContext(null);

export function PlanProvider({ children }) {
  const router = useRouter();

  // State
  const [plan, setPlan] = useState("small");
  const [role, setRole] = useState("recruiter");
  const [features, setFeatures] = useState([]);

  // Initial hydrate from localStorage
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const savedPlan = localStorage.getItem("ft_recruiter_plan");
      const savedRole = localStorage.getItem("ft_role");
      const savedFeatures = JSON.parse(localStorage.getItem("ft_features") || "[]");

      if (savedPlan === "enterprise" || savedPlan === "small") setPlan(savedPlan);
      if (savedRole) setRole(savedRole);
      if (Array.isArray(savedFeatures)) setFeatures(savedFeatures);
    } catch {
      /* noop */
    }
  }, []);

  // Query param overrides (persist)
  useEffect(() => {
    if (!router?.isReady) return;

    // plan
    const qpPlan = router.query?.plan;
    if (qpPlan === "enterprise" || qpPlan === "small") {
      setPlan(qpPlan);
      try { localStorage.setItem("ft_recruiter_plan", qpPlan); } catch {}
    }

    // role
    const qpRoleRaw = router.query?.role;
    const qpRole = typeof qpRoleRaw === "string" ? qpRoleRaw.toLowerCase() : "";
    const allowedRoles = new Set(["recruiter", "admin", "owner", "billing", "hiringmanager", "site_admin"]);
    if (allowedRoles.has(qpRole)) {
      const normalized = qpRole === "hiringmanager" ? "hiringManager" : qpRole;
      setRole(normalized);
      try { localStorage.setItem("ft_role", normalized); } catch {}
    }

    // features
    const qpFeaturesRaw = router.query?.features;
    if (typeof qpFeaturesRaw === "string") {
      const list = qpFeaturesRaw
        .split(",")
        .map(s => s.trim().toLowerCase())
        .filter(Boolean);
      setFeatures(list);
      try { localStorage.setItem("ft_features", JSON.stringify(list)); } catch {}
    }
  }, [router?.isReady, router?.query?.plan, router?.query?.role, router?.query?.features]);

  // Persist on change (plan only; role/features are set above when changed via UI)
  useEffect(() => {
    try { localStorage.setItem("ft_recruiter_plan", plan); } catch {}
  }, [plan]);

  const value = useMemo(() => {
    const isEnterprise = plan === "enterprise";
    const isSmall = plan === "small";

    // convenience role flags
    const isSiteAdmin = role === "site_admin";
    const isRecruiterAdmin = role === "owner" || role === "admin" || role === "billing" || isSiteAdmin;
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

    // Dev toggler kept from your original
    const togglePlan = () => setPlan((p) => (p === "enterprise" ? "small" : "enterprise"));

    return {
      // identity-ish
      role,
      setRole,

      // plan
      plan,
      isEnterprise,
      isSmall,
      setPlan,
      togglePlan,

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
  }, [plan, role, features]);

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error("usePlan must be used within a PlanProvider");
  return ctx;
}
