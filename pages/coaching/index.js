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
import CoachDashboard from "@/components/coaching/CoachDashboard";
import ClientSelector from "@/components/coaching/ClientSelector";
import ClientOverview from "@/components/coaching/ClientOverview";
import CoachInbox from "@/components/coaching/CoachInbox";
import SeekerInbox from "@/components/seeker/SeekerInbox";
import CoachCalendar from "@/components/coaching/CoachCalendar";
import CoachSessions from "@/components/coaching/CoachSessions";
import CoachResources from "@/components/coaching/CoachResources";
import CoachFeedback from "@/components/coaching/CoachFeedback";

const DEFAULT_SUB_TABS = {
  dashboard: "dashboard",
  clients: "overview",
  messaging: "coaching",
  calendar: "calendar",
  resources: "resources",
  feedback: "feedback",
  analytics: "overview",
};

export default function CoachingWorkspaceMock() {
  const [activeWorkspace, setActiveWorkspace] = useState("dashboard");
  const [activeSubTab, setActiveSubTab] = useState("dashboard");
  const [isReady, setIsReady] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

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
				{activeWorkspace === "dashboard" &&
				  activeSubTab === "dashboard" && <CoachDashboard />}
				  
				{activeWorkspace === "clients" && (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "320px minmax(0,1fr)",
      gap: 24,
      alignItems: "start",
    }}
  >
    <ClientSelector
      selectedClient={selectedClient}
      onSelectClient={setSelectedClient}
    />

    {selectedClient ? (
      activeSubTab === "overview" ? (
        <ClientOverview client={selectedClient} />
      ) : null
    ) : (
      <div
        style={{
          minHeight: 500,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          border: "1px dashed rgba(255,255,255,.25)",
          borderRadius: 18,
          background: "rgba(255,255,255,.05)",
          color: "#fff",
          fontSize: 18,
          fontWeight: 700,
        }}
      >
        Select a client to begin.
      </div>
    )}
  </div>
)}
			  
                {activeWorkspace === "messaging" &&
				  activeSubTab === "coaching" && <CoachInbox />}

				{activeWorkspace === "messaging" &&
				  activeSubTab === "seeker" && <SeekerInbox />}

				{activeWorkspace === "calendar" &&
				  activeSubTab === "calendar" && <CoachCalendar />}
				  
				{activeWorkspace === "calendar" &&
				  activeSubTab === "sessions" && <CoachSessions />}
				  
				{activeWorkspace === "resources" &&
				  activeSubTab === "resources" && <CoachResources />}

				{activeWorkspace === "feedback" &&
				  activeSubTab === "feedback" && <CoachFeedback />}				  
              </div>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}
