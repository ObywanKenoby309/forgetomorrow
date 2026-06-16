// components/notifications/PushPermissionPrompt.js
// One-time prompt shown after login/signup, asking the user to enable push notifications.
// Dismisses permanently once the user makes a choice (accept or "Not now") via localStorage flag.
// Settings page remains the fallback for users who skip this or change their mind later.

import React, { useEffect, useState } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

const DISMISS_KEY = 'ft_push_prompt_dismissed';

export default function PushPermissionPrompt() {
  const { isSupported, permission, isSubscribed, loading, subscribe } = usePushNotifications();
  const [visible, setVisible] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    if (loading || !isSupported) return;
    if (permission !== 'default') return; // already granted or denied — never show again
    if (isSubscribed) return;

    const dismissed = typeof window !== 'undefined' && localStorage.getItem(DISMISS_KEY);
    if (dismissed) return;

    // Small delay so it doesn't compete with the page's own load animations
    const timer = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(timer);
  }, [loading, isSupported, permission, isSubscribed]);

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch {}
    setVisible(false);
  };

  const handleEnable = async () => {
    setSubscribing(true);
    const result = await subscribe();
    setSubscribing(false);
    dismiss();
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'calc(env(safe-area-inset-bottom, 16px) + 84px)',
        left: 16,
        right: 16,
        maxWidth: 420,
        margin: '0 auto',
        zIndex: 500,
        background: 'rgba(17,32,51,0.97)',
        borderRadius: 16,
        border: '1px solid rgba(255,112,67,0.25)',
        boxShadow: '0 16px 40px rgba(0,0,0,0.35)',
        padding: 16,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
      }}
      role="dialog"
      aria-label="Enable notifications"
    >
      <div style={{ fontSize: 22, flexShrink: 0, lineHeight: 1 }}>🔔</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: 'white', fontWeight: 800, fontSize: 14, marginBottom: 3 }}>
          Stay in the loop
        </div>
        <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12.5, lineHeight: 1.5, marginBottom: 12 }}>
          Get notified about new messages, invites, and application updates — even when ForgeTomorrow isn't open.
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={handleEnable}
            disabled={subscribing}
            style={{
              flex: 1,
              background: '#FF7043',
              color: 'white',
              border: 'none',
              borderRadius: 10,
              padding: '9px 14px',
              fontWeight: 800,
              fontSize: 13,
              cursor: subscribing ? 'default' : 'pointer',
              opacity: subscribing ? 0.7 : 1,
              fontFamily: 'inherit',
            }}
          >
            {subscribing ? 'Enabling…' : 'Enable Notifications'}
          </button>
          <button
            type="button"
            onClick={dismiss}
            style={{
              background: 'transparent',
              color: 'rgba(255,255,255,0.55)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 10,
              padding: '9px 14px',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'inherit',
              whiteSpace: 'nowrap',
            }}
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}