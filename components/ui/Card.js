// components/ui/Card.js
import React from 'react';

const base = {
  background: '#f5f7fa', // Changed from white to light gray
  border: '1px solid #eee',
  borderRadius: 12,
  boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
};

export function Card({ as: Tag = 'section', style, children, ...rest }) {
  return (
    <Tag style={{ ...base, padding: 16, ...style }} {...rest}>
      {children}
    </Tag>
  );
}

export function CardHeader({ style, children }) {
  return (
    <div style={{ marginBottom: 8, ...style }}>
      {children}
    </div>
  );
}

export function CardTitle({ style, children }) {
  return (
    <h3 style={{ margin: 0, color: '#263238', fontWeight: 700, ...style }}>
      {children}
    </h3>
  );
}

export function CardSubtle({ style, children }) {
  return (
    <div style={{ color: '#607D8B', fontSize: 14, ...style }}>
      {children}
    </div>
  );
}

export function CardContent({ style, children }) {
  return <div style={{ ...style }}>{children}</div>;
}
