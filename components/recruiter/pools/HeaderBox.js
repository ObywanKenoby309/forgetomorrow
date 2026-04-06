// components/recruiter/pools/HeaderBox.js
import React from "react";
import RecruiterTitleCard from "@/components/recruiter/RecruiterTitleCard";
import { getTimeGreeting } from "@/lib/dashboardGreeting";

export default function HeaderBox() {
  const greeting = getTimeGreeting();

  return (
    <RecruiterTitleCard
      greeting={greeting}
      title="Talent Pools"
      subtitle="Save, group, and reuse strong candidates for future roles with clear why-saved evidence and fast outreach."
      compact
    />
  );
}