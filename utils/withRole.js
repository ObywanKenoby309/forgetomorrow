// utils/withRole.js
import React from 'react';

export function withRole(Component, requiredRole) {
  return function Guarded(props) {
    const roles = props?.user?.roles || []; // adapt to your auth wiring if you pass user via pageProps
    if (!roles.includes(requiredRole)) {
      return <div style={{ padding: 24 }}>403 — You don’t have access to this area.</div>;
    }
    return <Component {...props} />;
  };
}
