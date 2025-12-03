// pages/post-login.jsx
import { useEffect } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { usePlan } from "@/context/PlanContext"; // you already use this in headers

export default function PostLoginRedirect() {
  const router = useRouter();
  const { status } = useSession();
  const { role } = usePlan(); // 'seeker' | 'recruiter' | 'coach' | 'enterprise' | etc.

  useEffect(() => {
    // Still loading session? Do nothing yet.
    if (status === "loading") return;

    // If somehow we got here unauthenticated, kick back to home.
    if (status === "unauthenticated") {
      router.replace("/");
      return;
    }

    // Decide target route based on role.
    let target = "/seeker-dashboard";

    if (role === "recruiter") {
      target = "/recruiter";
    } else if (role === "coach") {
      target = "/coaching-dashboard";
    } else if (role === "enterprise" || role === "recruiter_admin") {
      // Adjust this to whatever your enterprise main route is
      target = "/recruiter/options";
    } else if (role === "seeker") {
      target = "/seeker-dashboard";
    }

    router.replace(target);
  }, [status, role, router]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#ECEFF1",
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          padding: 24,
          borderRadius: 12,
          background: "white",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          textAlign: "center",
          maxWidth: 360,
        }}
      >
        <h1
          style={{
            margin: 0,
            marginBottom: 8,
            fontSize: 20,
            color: "#263238",
            fontWeight: 700,
          }}
        >
          Welcome back
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            color: "#607D8B",
          }}
        >
          Checking your account and routing you to your dashboard…
        </p>
      </div>
    </main>
  );
}
