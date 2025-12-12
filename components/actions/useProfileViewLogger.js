// components/actions/useProfileViewLogger.js
import { useCallback } from 'react';

/**
 * useProfileViewLogger
 * Fire-and-forget logging of profile views.
 * Safe to call anywhere (errors are swallowed + logged).
 */
export function useProfileViewLogger() {
  const logView = useCallback(async (targetUserId, source = 'unknown') => {
    if (!targetUserId) return;

    try {
      await fetch('/api/profile/views', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId, source }),
      });
    } catch (err) {
      console.error('[useProfileViewLogger] failed to log profile view:', err);
    }
  }, []);

  return { logView };
}
