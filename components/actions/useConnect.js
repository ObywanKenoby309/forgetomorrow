// components/actions/useConnect.js
import { useCallback } from 'react';

/**
 * useConnect
 * Centralized helper for sending connection requests.
 * Returns:
 *   { ok: boolean, alreadyConnected?: boolean, alreadyRequested?: boolean, status?: string, errorMessage?: string }
 */
export function useConnect() {
  const connectWith = useCallback(async (toUserId) => {
    if (!toUserId) {
      return { ok: false, errorMessage: 'Missing target userId' };
    }

    try {
      const res = await fetch('/api/contacts/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.error('[useConnect] contacts/request failed:', text);
        return {
          ok: false,
          errorMessage:
            "We couldn't send this connection request. Please try again.",
        };
      }

      const data = await res.json().catch(() => ({}));

      return {
        ok: true,
        alreadyConnected: !!data.alreadyConnected,
        alreadyRequested: !!data.alreadyRequested,
        status: data.status,
      };
    } catch (err) {
      console.error('[useConnect] error:', err);
      return {
        ok: false,
        errorMessage:
          "We couldn't send this connection request. Please try again.",
      };
    }
  }, []);

  return { connectWith };
}
