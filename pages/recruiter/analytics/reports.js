// pages/recruiter/analytics/reports.js
// Legacy route shim: keeps old direct links working while the analytics workspace uses inlay tabs.

import { useEffect } from "react";
import { useRouter } from "next/router";

export default function RecruiterAnalyticsReportsRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    router.replace(
      {
        pathname: "/recruiter/analytics",
        query: {
          ...router.query,
          tab: "reports",
        },
      },
      undefined,
      { shallow: false }
    );
  }, [router]);

  return null;
}
