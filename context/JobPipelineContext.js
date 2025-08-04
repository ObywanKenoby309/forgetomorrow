import React, { createContext, useContext, useState } from 'react';

const JobPipelineContext = createContext();

export function JobPipelineProvider({ children }) {
  const [viewedJobs, setViewedJobs] = useState([]);
  const [appliedJobs, setAppliedJobs] = useState([]);

  const addViewedJob = (job) => {
    setViewedJobs((prev) => {
      // Avoid duplicates by job id
      if (prev.find((j) => j.id === job.id)) return prev;
      return [...prev, job];
    });
  };

  const addAppliedJob = (job) => {
    setAppliedJobs((prev) => {
      if (prev.find((j) => j.id === job.id)) return prev;
      return [...prev, job];
    });
  };

  return (
    <JobPipelineContext.Provider
      value={{
        viewedJobs,
        appliedJobs,
        addViewedJob,
        addAppliedJob,
      }}
    >
      {children}
    </JobPipelineContext.Provider>
  );
}

export function useJobPipeline() {
  const context = useContext(JobPipelineContext);
  if (!context) {
    throw new Error('useJobPipeline must be used within a JobPipelineProvider');
  }
  return context;
}

