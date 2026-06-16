// components/notifications/PushNotificationToggle.js
// Settings-page toggle for enabling/disabling push notifications.
// This is the fallback for users who dismissed the post-login prompt or want to change their mind.

import React, { useState } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export default function PushNotificationToggle() {
  const { isSupported, permission, isSubscribed, loading, subscribe, unsubscribe } = usePushNotifications();
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleToggle = async () => {
    setErrorMsg('');
    setBusy(true);

    if (isSubscribed) {
      await unsubscribe();
    } else {
      const result = await subscribe();
      if (!result.ok) {
        if (result.reason === 'denied') {
          setErrorMsg('Notifications are blocked in your browser settings. Enable them for this site to turn this on.');
        } else if (result.reason === 'unsupported') {
          setErrorMsg('Push notifications aren\u2019t supported on this browser or device.');
        } else {
          setErrorMsg('Something went wrong enabling notifications. Please try again.');
        }
      }
    }

    setBusy(false);
  };

  if (loading) {
    return (
      <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(0,0,0,0.03)', fontSize: 13, color: '#64748B' }}>
        Checking notification support…
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.06)' }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: '#334155', marginBottom: 4 }}>Push Notifications</div>
        <div style={{ fontSize: 12.5, color: '#94A3B8', lineHeight: 1.5 }}>
          Not supported on this browser. Try Chrome, Edge, or Safari (iOS 16.4+, after adding ForgeTomorrow to your home screen).
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '14px 16px', borderRadius: 12, background: 'white', border: '1px solid rgba(0,0,0,0.08)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: '#112033', marginBottom: 3 }}>Push Notifications</div>
          <div style={{ fontSize: 12.5, color: '#64748B', lineHeight: 1.5 }}>
            Get notified about messages, invites, and updates — even when ForgeTomorrow isn't open.
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggle}
          disabled={busy || permission === 'denied'}
          role="switch"
          aria-checked={isSubscribed}
          style={{
            flexShrink: 0,
            width: 48,
            height: 28,
            borderRadius: 999,
            border: 'none',
            background: isSubscribed ? '#FF7043' : 'rgba(0,0,0,0.15)',
            position: 'relative',
            cursor: busy || permission === 'denied' ? 'not-allowed' : 'pointer',
            opacity: busy ? 0.6 : permission === 'denied' ? 0.5 : 1,
            transition: 'background 0.2s ease',
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: 3,
              left: isSubscribed ? 23 : 3,
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: 'white',
              boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
              transition: 'left 0.2s ease',
            }}
          />
        </button>
      </div>

      {permission === 'denied' && (
        <div style={{ marginTop: 10, fontSize: 12, color: '#B91C1C', fontWeight: 600 }}>
          Notifications are blocked for this site in your browser. Enable them in your browser's site settings to turn this on.
        </div>
      )}

      {errorMsg && (
        <div style={{ marginTop: 10, fontSize: 12, color: '#B91C1C', fontWeight: 600 }}>
          {errorMsg}
        </div>
      )}
    </div>
  );
}