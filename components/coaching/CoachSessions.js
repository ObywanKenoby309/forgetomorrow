// components/coaching/CoachSessions.js

import React from "react";
import { useRouter } from "next/router";
import SessionsModule from "@/components/coaching/modules/SessionsModule";

export default function CoachSessions() {
  const router = useRouter();

  const initialTab =
    router.query.tab === "requests"
      ? "requests"
      : "agenda";

  return <SessionsModule initialTab={initialTab} />;
}