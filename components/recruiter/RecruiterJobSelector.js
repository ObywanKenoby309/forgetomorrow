// components/recruiter/RecruiterJobSelector.js

import React, { useEffect, useMemo, useState } from "react";

const GLASS = {
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.22)",
  background: "rgba(255,255,255,0.58)",
  boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
};

const INPUT_STYLE = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid rgba(15,23,42,0.12)",
  borderRadius: 10,
  padding: "10px 12px",
  background: "rgba(255,255,255,0.94)",
  color: "#334155",
  fontSize: 13,
  fontFamily: "inherit",
  outline: "none",
};

const PRIMARY_BUTTON = {
  width: "100%",
  border: "none",
  borderRadius: 10,
  padding: "10px 14px",
  background: "#FF7043",
  color: "#FFFFFF",
  fontSize: 13,
  fontWeight: 800,
  fontFamily: "inherit",
  cursor: "pointer",
};

const ORANGE_HEADING_LIFT = {
  textShadow:
    "0 2px 4px rgba(15,23,42,0.65), 0 1px 2px rgba(0,0,0,0.4)",
  fontWeight: 900,
};

function normalizeStatus(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function getJobGroup(job) {
  const status = normalizeStatus(job?.status);

  if (status === "draft") {
    return "drafts";
  }

  if (
    status === "closed" ||
    status === "retired" ||
    status === "archived" ||
    status === "expired" ||
    status === "filled"
  ) {
    return "past";
  }

  return "active";
}

function getStatusAppearance(statusValue) {
  const status = normalizeStatus(statusValue);

  if (status === "open") {
    return {
      label: "Open",
      background: "#E8F5E9",
      color: "#2E7D32",
    };
  }

  if (status === "reviewing") {
    return {
      label: "Reviewing",
      background: "#E3F2FD",
      color: "#1565C0",
    };
  }

  if (status === "draft") {
    return {
      label: "Draft",
      background: "#FFF8E1",
      color: "#8D6E00",
    };
  }

  if (status === "closed") {
    return {
      label: "Closed",
      background: "#ECEFF1",
      color: "#546E7A",
    };
  }

  if (status === "retired") {
    return {
      label: "Retired",
      background: "#ECEFF1",
      color: "#546E7A",
    };
  }

  if (status === "archived") {
    return {
      label: "Archived",
      background: "#ECEFF1",
      color: "#546E7A",
    };
  }

  return {
    label: statusValue || "Unknown",
    background: "#F1F5F9",
    color: "#64748B",
  };
}

function formatApplicants(value) {
  const count = Number(value);

  if (!Number.isFinite(count)) {
    return "0 applicants";
  }

  return `${count} applicant${count === 1 ? "" : "s"}`;
}

function formatLocation(job) {
  const location = String(job?.location || "").trim();
  const worksite = String(job?.worksite || "").trim();

  if (location && worksite) {
    return `${location} · ${worksite}`;
  }

  return location || worksite || "Location not specified";
}

function sortNewestFirst(jobs) {
  return [...jobs].sort((a, b) => {
    const aDate = new Date(a?.createdAt || 0).getTime();
    const bDate = new Date(b?.createdAt || 0).getTime();

    return bDate - aDate;
  });
}

function JobCard({ job, isSelected, onSelect }) {
  const status = getStatusAppearance(job?.status);

  return (
    <button
      type="button"
      onClick={() => onSelect(job)}
      aria-pressed={isSelected}
      style={{
        width: "100%",
        display: "block",
        boxSizing: "border-box",
        border: isSelected
          ? "2px solid #FF7043"
          : "1px solid rgba(15,23,42,0.09)",
        borderRadius: 12,
        padding: "12px",
        background: isSelected
          ? "rgba(255,112,67,0.10)"
          : "rgba(255,255,255,0.94)",
        boxShadow: isSelected
          ? "0 4px 14px rgba(255,112,67,0.18)"
          : "0 2px 8px rgba(15,23,42,0.06)",
        textAlign: "left",
        cursor: "pointer",
        fontFamily: "inherit",
        transition:
          "border-color 150ms ease, background 150ms ease, box-shadow 150ms ease",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div
          style={{
            minWidth: 0,
            flex: 1,
          }}
        >
          <div
            style={{
              color: "#0F172A",
              fontSize: 13,
              fontWeight: 800,
              lineHeight: 1.35,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={job?.title || "Untitled Job"}
          >
            {job?.title || "Untitled Job"}
          </div>

          <div
            style={{
              marginTop: 3,
              color: "#475569",
              fontSize: 12,
              fontWeight: 600,
              lineHeight: 1.4,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={job?.company || ""}
          >
            {job?.company || "Company not specified"}
          </div>
        </div>

        <span
          style={{
            flexShrink: 0,
            display: "inline-block",
            borderRadius: 999,
            padding: "3px 8px",
            background: status.background,
            color: status.color,
            fontSize: 10,
            fontWeight: 800,
            lineHeight: 1.2,
          }}
        >
          {status.label}
        </span>
      </div>

      <div
        style={{
          marginTop: 9,
          color: "#64748B",
          fontSize: 11,
          lineHeight: 1.4,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={formatLocation(job)}
      >
        {formatLocation(job)}
      </div>

      <div
        style={{
          marginTop: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <span
          style={{
            color: "#475569",
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {formatApplicants(job?.applications)}
        </span>

        {job?.urgent ? (
          <span
            style={{
              color: "#C2410C",
              background: "#FFEDD5",
              borderRadius: 999,
              padding: "2px 7px",
              fontSize: 10,
              fontWeight: 800,
            }}
          >
            Urgent
          </span>
        ) : null}
      </div>
    </button>
  );
}

function JobGroup({
  title,
  jobs,
  selectedJobId,
  onSelectJob,
  emptyText,
}) {
  return (
    <section>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          marginBottom: 8,
        }}
      >
        <div
          style={{
            color: "rgba(255,255,255,0.92)",
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            textShadow: "0 1px 2px rgba(0,0,0,0.45)",
          }}
        >
          {title}
        </div>

        <span
          style={{
            minWidth: 24,
            height: 24,
            padding: "0 7px",
            boxSizing: "border-box",
            borderRadius: 999,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255,255,255,0.12)",
            color: "#FFFFFF",
            fontSize: 11,
            fontWeight: 800,
          }}
        >
          {jobs.length}
        </span>
      </div>

      {jobs.length > 0 ? (
        <div
          style={{
            display: "grid",
            gap: 8,
          }}
        >
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              isSelected={String(selectedJobId) === String(job.id)}
              onSelect={onSelectJob}
            />
          ))}
        </div>
      ) : (
        <div
          style={{
            padding: "12px",
            borderRadius: 10,
            border: "1px dashed rgba(255,255,255,0.16)",
            background: "rgba(255,255,255,0.05)",
            color: "rgba(255,255,255,0.72)",
            fontSize: 12,
            lineHeight: 1.5,
          }}
        >
          {emptyText}
        </div>
      )}
    </section>
  );
}

export default function RecruiterJobSelector({
  selectedJob = null,
  onSelectJob,
  onCreateJob,
}) {
  const [jobs, setJobs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadJobs() {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/recruiter/job-postings?kind=jobs",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(
          data?.error || `Unable to load jobs (${response.status}).`
        );
      }

      const data = await response.json();
      const nextJobs = Array.isArray(data?.jobs) ? data.jobs : [];

      setJobs(nextJobs);

      if (!selectedJob && nextJobs.length > 0 && onSelectJob) {
        const firstActiveJob =
          nextJobs.find((job) => getJobGroup(job) === "active") ||
          nextJobs.find((job) => getJobGroup(job) === "drafts") ||
          nextJobs[0];

        onSelectJob(firstActiveJob);
      }
    } catch (loadError) {
      setJobs([]);
      setError(loadError?.message || "Unable to load recruiter jobs.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadJobs();
    // The selector should load once when mounted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredJobs = useMemo(() => {
  const query = searchQuery.trim().toLowerCase();

  return jobs.filter((job) => {
    const group = getJobGroup(job);

    const matchesStatus =
      statusFilter === "all" ||
      statusFilter === group;

    const searchableText = [
      job?.title,
      job?.company,
      job?.location,
      job?.worksite,
      job?.status,
      job?.type,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch =
      !query || searchableText.includes(query);

    return matchesStatus && matchesSearch;
  });
}, [jobs, searchQuery, statusFilter]);

  const groupedJobs = useMemo(() => {
    const groups = {
      active: [],
      drafts: [],
      past: [],
    };

    for (const job of filteredJobs) {
      const group = getJobGroup(job);
      groups[group].push(job);
    }

    return {
      active: sortNewestFirst(groups.active),
      drafts: sortNewestFirst(groups.drafts),
      past: sortNewestFirst(groups.past),
    };
  }, [filteredJobs]);

  return (
  <div
    style={{
      display: "grid",
      gap: 14,
      width: "100%",
      minWidth: 0,
      boxSizing: "border-box",
    }}
  >
    {/* Selector controls */}
    <div
      style={{
        ...GLASS,
        padding: "14px 16px",
        width: "100%",
        minWidth: 0,
        boxSizing: "border-box",
        overflow: "visible",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr) 42px 42px",
          gap: 8,
          alignItems: "center",
        }}
      >
        <input
          id="job-selector-search"
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search jobs..."
          aria-label="Search jobs"
          style={INPUT_STYLE}
        />

        <div
          style={{
            position: "relative",
            overflow: "visible",
            zIndex: 20,
          }}
        >
          <button
            type="button"
            aria-label="Filter jobs"
            title="Filter"
            onClick={() => setShowFilterMenu((current) => !current)}
            style={{
              ...PRIMARY_BUTTON,
              padding: 10,
              width: 42,
              height: 42,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M4 5h16l-6 7v6l-4 2v-8L4 5z"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {showFilterMenu && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                right: 0,
                width: 180,
                background: "#FFFFFF",
                border: "1px solid rgba(0,0,0,0.10)",
                borderRadius: 10,
                boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
                overflow: "hidden",
                zIndex: 100,
              }}
            >
              {[
                ["all", "All Jobs"],
                ["active", "Active Jobs"],
                ["drafts", "Drafts"],
                ["past", "Past Postings"],
              ].map(([value, label], index, options) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setStatusFilter(value);
                    setShowFilterMenu(false);
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: "none",
                    borderBottom:
                      index < options.length - 1
                        ? "1px solid rgba(0,0,0,0.06)"
                        : "none",
                    background:
                      statusFilter === value
                        ? "rgba(255,112,67,0.12)"
                        : "#FFFFFF",
                    color: "#37474F",
                    fontSize: 13,
                    fontWeight:
                      statusFilter === value ? 700 : 500,
                    textAlign: "left",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontFamily: "inherit",
                  }}
                >
                  <span>{label}</span>

                  {statusFilter === value && (
                    <span
                      style={{
                        color: "#FF7043",
                        fontWeight: 800,
                      }}
                    >
                      ✓
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          aria-label="Create new job"
          title="New Job"
          onClick={() => onCreateJob?.()}
          style={{
            ...PRIMARY_BUTTON,
            padding: 10,
            width: 42,
            height: 42,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            lineHeight: 1,
          }}
        >
          +
        </button>
      </div>
    </div>

    {/* Job list */}
    <aside
      aria-label="Job selector"
      style={{
        ...GLASS,
        width: "100%",
        minWidth: 0,
        boxSizing: "border-box",
        padding: "18px 20px",
        background: "rgba(255,255,255,0.82)",
        border: "1px solid rgba(255,255,255,0.55)",
        backdropFilter: "none",
        WebkitBackdropFilter: "none",
        overflow: "visible",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: 14,
        }}
      >
        <h2
          style={{
            margin: 0,
            color: "#FF7043",
            fontSize: 18,
            lineHeight: 1.25,
            letterSpacing: "-0.01em",
            ...ORANGE_HEADING_LIFT,
          }}
        >
          Jobs
        </h2>

        <span
          style={{
            color: "#90A4AE",
            fontSize: 12,
          }}
        >
          {filteredJobs.length}{" "}
          {filteredJobs.length === 1 ? "job" : "jobs"}
        </span>
      </div>

      <div
        style={{
          maxHeight: "calc(100vh - 330px)",
          overflowY: "auto",
          paddingRight: 2,
          display: "grid",
          alignContent: "start",
          gap: 18,
          scrollbarWidth: "thin",
        }}
      >
        {isLoading ? (
          <div
            style={{
              display: "grid",
              gap: 8,
            }}
          >
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                style={{
                  height: 92,
                  borderRadius: 12,
                  border: "1px solid rgba(0,0,0,0.08)",
                  background: "rgba(255,255,255,0.68)",
                }}
              />
            ))}
          </div>
        ) : error ? (
          <div
            style={{
              padding: 14,
              borderRadius: 12,
              border: "1px solid rgba(239,68,68,0.30)",
              background: "rgba(254,226,226,0.92)",
              color: "#B91C1C",
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
            <div>{error}</div>

            <button
              type="button"
              onClick={loadJobs}
              style={{
                marginTop: 10,
                border: "1px solid rgba(185,28,28,0.24)",
                borderRadius: 8,
                padding: "6px 10px",
                background: "#FFFFFF",
                color: "#B91C1C",
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "inherit",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div
            style={{
              padding: 14,
              color: "#90A4AE",
              background: "rgba(255,255,255,0.60)",
              borderRadius: 10,
              border: "1px dashed rgba(0,0,0,0.10)",
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            {searchQuery.trim()
              ? "No jobs match your search."
              : "No jobs are available in this category."}
          </div>
        ) : (
          <>
            {(statusFilter === "all" ||
              statusFilter === "active") && (
              <JobGroup
                title="Active Jobs"
                jobs={groupedJobs.active}
                selectedJobId={selectedJob?.id}
                onSelectJob={onSelectJob}
                emptyText="No active jobs."
              />
            )}

            {(statusFilter === "all" ||
              statusFilter === "drafts") && (
              <JobGroup
                title="Drafts"
                jobs={groupedJobs.drafts}
                selectedJobId={selectedJob?.id}
                onSelectJob={onSelectJob}
                emptyText="No draft jobs."
              />
            )}

            {(statusFilter === "all" ||
              statusFilter === "past") && (
              <JobGroup
                title="Past Postings"
                jobs={groupedJobs.past}
                selectedJobId={selectedJob?.id}
                onSelectJob={onSelectJob}
                emptyText="No past postings."
              />
            )}
          </>
        )}
      </div>
    </aside>
  </div>
);
}