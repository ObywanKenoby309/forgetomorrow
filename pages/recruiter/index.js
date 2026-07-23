// pages/recruiter/index.js
import { useEffect, useState } from "react";
import Head from "next/head";

import RecruiterHeader from "@/components/recruiter/RecruiterHeader";
import RecruiterWorkspaceToolbar from "@/components/recruiter/RecruiterWorkspaceToolbar";

import { useUserWallpaper } from "@/hooks/useUserWallpaper";

// Dashboard
import RecruiterDashboard from "@/components/recruiter/RecruiterDashboard";

// Candidates
//import CandidateSelector from "@/components/recruiter/CandidateSelector";
//import TalentPools from "@/components/recruiter/TalentPools";
//import InternalCandidateSearch from "@/components/recruiter/InternalCandidateSearch";

// Jobs
//import RecruiterJobPostings from "@/components/recruiter/RecruiterJobPostings";
import RecruiterJobSelector from "@/components/recruiter/RecruiterJobSelector";
import JobOverview from "@/components/recruiter/jobs/JobOverview";

// Messaging
import RecruiterInbox from "@/components/recruiter/RecruiterInbox";
import SeekerInbox from "@/components/seeker/SeekerInbox";

// Calendar
import RecruiterCalendar from "@/components/recruiter/RecruiterCalendar";

// Resources
//import RecruiterResources from "@/components/recruiter/RecruiterResources";
//import ExternalCompare from "@/components/recruiter/ExternalCompare";
//import RecruiterVault from "@/components/recruiter/RecruiterVault";

// Feedback
//import RecruiterFeedback from "@/components/recruiter/RecruiterFeedback";

// Analytics
//import RecruiterAnalytics from "@/components/recruiter/RecruiterAnalytics";

const DEFAULT_SUB_TABS = {
  dashboard: "dashboard",
  candidates: "overview",
  jobs: "overview",
  messaging: "recruiter",
  calendar: "calendar",
  resources: "resources",
  feedback: "feedback",
  analytics: "overview",
};

export default function RecruiterWorkspace() {
  const [activeWorkspace, setActiveWorkspace] = useState("dashboard");
  const [activeSubTab, setActiveSubTab] = useState("dashboard");
  const [isReady, setIsReady] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);

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
        <title>Recruiter Workspace | ForgeTomorrow</title>
      </Head>

      <RecruiterHeader />

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
              <RecruiterWorkspaceToolbar
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
				  activeSubTab === "dashboard" && <RecruiterDashboard />}
				  
				{activeWorkspace === "candidates" && (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "320px minmax(0,1fr)",
      gap: 24,
      alignItems: "start",
    }}
  >
<div
  style={{
    minHeight: 500,
    borderRadius: 18,
    background: "rgba(255,255,255,.05)",
    border: "1px solid rgba(255,255,255,.15)",
    padding: 24,
    color: "#fff",
  }}
>
  Candidate Selector coming here...
</div>

{selectedCandidate ? (
  <div
    style={{
      minHeight: 500,
      borderRadius: 18,
      background: "rgba(255,255,255,.05)",
      border: "1px solid rgba(255,255,255,.15)",
      padding: 24,
      color: "#fff",
    }}
  >
    Recruiter workspace coming here...
    <br />
    Current tab: {activeSubTab}
  </div>
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
        Select a candidate to begin.
      </div>
    )}
  </div>
)}
			  
                {activeWorkspace === "messaging" &&
                  activeSubTab === "recruiter" && <RecruiterInbox />}

                {activeWorkspace === "messaging" &&
                  activeSubTab === "seeker" && <SeekerInbox />}

                {activeWorkspace === "calendar" &&
                  activeSubTab === "calendar" && <RecruiterCalendar />}

                {activeWorkspace === "jobs" && (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "320px minmax(0,1fr)",
      gap: 24,
      alignItems: "start",
    }}
  >
    <RecruiterJobSelector
      selectedJob={selectedJob}
      onSelectJob={setSelectedJob}
    />

{selectedJob ? (
  <>
    {activeSubTab === "overview" && (
      <JobOverview
        job={selectedJob}
      />
    )}

    {activeSubTab === "pipeline" && (
      <div>Pipeline Placeholder</div>
    )}

    {activeSubTab === "applicants" && (
      <div>Applicants Placeholder</div>
    )}

    {activeSubTab === "posting" && (
      <div>Posting Placeholder</div>
    )}

    {activeSubTab === "insights" && (
      <div>Insights Placeholder</div>
    )}
  </>
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
        Select a job to begin.
      </div>
    )}
  </div>
)}

                {/* Resources placeholder */}

                {/* Analytics placeholder */}
				</div>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}
