// context/PlanContext.js
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

/**
 * PlanContext manages recruiter plan state across the recruiter suite.
 * Plans: "small" | "enterprise"
 *
 * Dev toggles:
 *  - Add ?plan=enterprise or ?plan=small to the URL to override (persists).
 *  - Header switch in recruiter pages to flip plans quickly for testing.
 *
 * Persisted in localStorage under "ft_recruiter_plan".
 */

const PlanContext = createContext(null);

export function PlanProvider({ children }) {
  const router = useRouter();
  const [plan, setPlan] = useState("small"); // default for first-time

  // Read from localStorage once on mount
  useEffect(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("ft_recruiter_plan") : null;
      if (saved === "enterprise" || saved === "small") {
        setPlan(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  // Allow URL param override (?plan=enterprise|small)
  useEffect(() => {
    if (!router?.isReady) return;
    const qp = router.query?.plan;
    if (qp === "enterprise" || qp === "small") {
      setPlan(qp);
      try {
        localStorage.setItem("ft_recruiter_plan", qp);
      } catch {
        // ignore
      }
    }
  }, [router?.isReady, router?.query?.plan]);

  // Persist on change
  useEffect(() => {
    try {
      localStorage.setItem("ft_recruiter_plan", plan);
    } catch {
      // ignore
    }
  }, [plan]);

  const value = useMemo(() => {
    const isEnterprise = plan === "enterprise";
    const isSmall = plan === "small";

    // Simple access gate. We’ll replace with a feature map later if needed.
    const hasEnterpriseAccess = () => isEnterprise;

    // Dev/test helper to flip plans in UI
    const togglePlan = () => setPlan((p) => (p === "enterprise" ? "small" : "enterprise"));

    return {
      plan,
      isEnterprise,
      isSmall,
      setPlan,
      togglePlan,
      hasEnterpriseAccess,
    };
  }, [plan]);

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error("usePlan must be used within a PlanProvider");
  return ctx;
}
