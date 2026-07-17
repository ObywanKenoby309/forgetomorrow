// pages/coaching/index.js
//
// Private development workspace shell.
// First pass only:
// - Existing Coaching header
// - Existing global footer from pages/_app.js
// - Existing user wallpaper/background
// - CoachWorkspaceToolbar centered in the page
// - Local workspace tab state
// - Coaching Inbox and Calendar workspace views

import { useEffect, useState } from "react";
import Head from "next/head";
import CoachingHeader from "@/components/coaching/CoachingHeader";
import CoachWorkspaceToolbar from "@/components/coaching/CoachWorkspaceToolbar";
import { useUserWallpaper } from "@/hooks/useUserWallpaper";
import CoachInbox from "@/components/coaching/CoachInbox";
import CoachCalendar from "@/components/coaching/CoachCalendar";

const DEFAULT_SUB_TABS = {
  dashboard: "dashboard",
  clients: "overview",
  messaging: "",
  calendar: "calendar",
  resources: "vault",
  feedback: "feedback",
  analytics: "overview",
};

export default function CoachingWorkspaceMock() {
  const [activeWorkspace, setActiveWorkspace] = useState("dashboard");
  const [activeSubTab, setActiveSubTab] = useState("dashboard");
  const [isReady, setIsReady] = useState(false);

  const { wallpaperUrl } = useUserWallpaper();

  useEffect(() => {
    setIsReady(true);
  }, []);

  const handleWorkspaceChange = (workspace) => {
    setActiveWorkspace(workspace);
    setActiveSubTab(DEFAULT_SUB_TABS[workspace] || "overview");
  };

  return (
    <div
      style={
        wallpaperUrl
          ? {
              minHeight: "100vh",
              backgroundImage: `url(${wallpaperUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center top",
              backgroundRepeat: "no-repeat",
              backgroundAttachment: "fixed",
            }
          : {
              minHeight: "100vh",
              backgroundColor: "#ECEFF1",
            }
      }
    >
      <Head>
        <title>Coaching Workspace Mock | ForgeTomorrow</title>
      </Head>

      <CoachingHeader />

      <main
        id="main-content"
        style={{
          width: "100%",
          minHeight: "calc(100vh - 160px)",
          padding: "16px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 1440,
            margin: "0 auto",
            boxSizing: "border-box",
          }}
        >
          {isReady ? (
            <>
              <CoachWorkspaceToolbar
                activeWorkspace={activeWorkspace}
                activeSubTab={activeSubTab}
                onWorkspaceChange={handleWorkspaceChange}
                onSubTabChange={setActiveSubTab}
              />

              <div
                style={{
                  marginTop: 24,
                  width: "100%",
                }}
              >
                {activeWorkspace === "messaging" &&
                  activeSubTab === "coaching" && <CoachInbox />}

                {activeWorkspace === "calendar" &&
                  activeSubTab === "calendar" && <CoachCalendar />}
              </div>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}
