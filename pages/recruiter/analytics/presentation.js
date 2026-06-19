// pages/recruiter/analytics/presentation.js
// Legacy route shim: keeps old direct links working while the analytics workspace uses inlay tabs.

import { useEffect } from "react";
import { useRouter } from "next/router";

export default function RecruiterAnalyticsPresentationRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    router.replace(
      {
        pathname: "/recruiter/analytics",
        query: {
          ...router.query,
          tab: "presentation",
        },
      },
      undefined,
      { shallow: false }
    );
  }, [router]);

  return null;
}
