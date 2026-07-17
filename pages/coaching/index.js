// pages/coaching/index.js
//
// Private development workspace shell.
// First pass only:
// - Existing Coaching header
// - Existing global footer from pages/_app.js
// - Existing user wallpaper/background from pages/_app.js
// - CoachWorkspaceToolbar centered in the page
// - Local mock tab state only
//
// No page modules, APIs, database calls, or routing are wired yet.

import { useEffect, useState } from "react";
import Head from "next/head";
import CoachingHeader from "@/components/coaching/CoachingHeader";
import CoachWorkspaceToolbar from "@/components/coaching/CoachWorkspaceToolbar";
import CoachInbox from "@/components/coaching/CoachInbox";

const DEFAULT_SUB_TABS = {
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

  useEffect(() => {
    setIsReady(true);
  }, []);

  const handleWorkspaceChange = (workspace) => {
    setActiveWorkspace(workspace);
    setActiveSubTab(DEFAULT_SUB_TABS[workspace] || "overview");
  };

  return (
    <>
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
        activeSubTab === "coaching" && (
          <CoachInbox />
        )}
    </div>
  </>
) : null}
        </div>
      </main>
    </>
  );
}
