// components/guards/Require.js
import React from "react";
import { usePlan } from "@/context/PlanContext";

export default function Require({ capability, fallback = null, children }) {
  const { can } = usePlan();
  if (!can(capability)) return fallback ?? null;
  return <>{children}</>;
}
