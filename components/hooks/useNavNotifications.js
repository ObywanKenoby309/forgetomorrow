// components/hooks/useNavNotifications.js
import { useEffect, useState, useCallback } from 'react';

const DEFAULT_COUNTS = {
  contacts: 0,
  invitesIn: 0,
  invitesOut: 0,
  conversations: 0,
  profileViews: 0,
};

export function useNavNotifications(pollIntervalMs = 60000) {
  const [counts, setCounts] = useState(DEFAULT_COUNTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/notifications/summary');
      if (!res.ok) {
        const text = await res.text();
        console.error('notifications/summary failed:', text);
        throw new Error(text || 'Failed to load notifications');
      }

      const data = await res.json();
      setCounts({
        ...DEFAULT_COUNTS,
        ...(data.counts || {}),
      });
    } catch (err) {
      console.error('useNavNotifications error:', err);
      setError(err);
      setCounts(DEFAULT_COUNTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // initial fetch
    fetchSummary();

    // optional polling
    if (!pollIntervalMs) return;

    const id = setInterval(() => {
      fetchSummary();
    }, pollIntervalMs);

    return () => clearInterval(id);
  }, [fetchSummary, pollIntervalMs]);

  return {
    counts,
    loading,
    error,
    refresh: fetchSummary,
  };
}
