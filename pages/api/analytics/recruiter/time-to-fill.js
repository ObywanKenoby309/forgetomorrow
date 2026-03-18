// pages/api/analytics/recruiter/time-to-fill.js
  useEffect(() => {
    let active = true;

    const loadLeaderboard = async () => {
      try {
        const params = new URLSearchParams();
        params.set("range", filters.range);
        params.set("jobId", filters.jobId);
        params.set("recruiterId", filters.recruiterId);
        params.set("companyId", filters.companyId);

        if (filters.range === "custom") {
          if (filters.from) params.set("from", filters.from);
          if (filters.to) params.set("to", filters.to);
        }

        const res = await fetch(
          `/api/analytics/recruiter/leaderboard?${params.toString()}`
        );
        const json = await res.json();

        if (active) {
          setLeaderboardData(json);
        }
      } catch {
        if (active) {
          setLeaderboardData({ recruiters: [] });
        }
      }
    };

    loadLeaderboard();

    return () => {
      active = false;
    };
  }, [filters]);