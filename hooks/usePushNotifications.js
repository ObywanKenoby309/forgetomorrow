// hooks/usePushNotifications.js
// Client-side hook for managing push notification subscription state.
//
// Usage:
//   const { permission, isSubscribed, isSupported, subscribe, unsubscribe, loading } = usePushNotifications();
//
// `subscribe()` triggers the browser's native permission prompt (must be called from a user
// gesture like a button click — browsers block silent permission requests).

import { useCallback, useEffect, useState } from 'react';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = typeof window !== 'undefined' ? window.atob(base64) : '';
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  // ─── Initial check on mount ────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function check() {
      const supported =
        typeof window !== 'undefined' &&
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window;

      if (!supported) {
        if (!cancelled) {
          setIsSupported(false);
          setLoading(false);
        }
        return;
      }

      if (!cancelled) setIsSupported(true);
      if (!cancelled) setPermission(Notification.permission);

      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;

        const existingSubscription = await registration.pushManager.getSubscription();
        if (!cancelled) setIsSubscribed(!!existingSubscription);
      } catch (err) {
        console.error('[usePushNotifications] SW registration failed:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    check();
    return () => { cancelled = true; };
  }, []);

  // ─── Subscribe — must be called from a user gesture (button click) ────
  const subscribe = useCallback(async () => {
    if (!isSupported) return { ok: false, reason: 'unsupported' };

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== 'granted') {
        return { ok: false, reason: 'denied' };
      }

      const registration = await navigator.serviceWorker.ready;
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!publicKey) {
        console.error('[usePushNotifications] Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY');
        return { ok: false, reason: 'misconfigured' };
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });

      if (!res.ok) {
        return { ok: false, reason: 'server_error' };
      }

      setIsSubscribed(true);
      return { ok: true };
    } catch (err) {
      console.error('[usePushNotifications] subscribe failed:', err);
      return { ok: false, reason: 'exception', error: err };
    }
  }, [isSupported]);

  // ─── Unsubscribe ────────────────────────────────────────────────────────
  const unsubscribe = useCallback(async () => {
    if (!isSupported) return { ok: false };

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint }),
        }).catch(() => {});
      }

      setIsSubscribed(false);
      return { ok: true };
    } catch (err) {
      console.error('[usePushNotifications] unsubscribe failed:', err);
      return { ok: false, error: err };
    }
  }, [isSupported]);

  return { isSupported, permission, isSubscribed, loading, subscribe, unsubscribe };
}