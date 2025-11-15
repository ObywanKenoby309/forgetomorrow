// context/AiUsageContext.js
'use client'; // ← ADD THIS FIRST LINE

import { createContext, useContext, useState, useEffect } from 'react';

const AiUsageContext = createContext();

export function AiUsageProvider({ children }) {
  const [usage, setUsage] = useState({ count: 0, month: new Date().getMonth() });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem('ai_usage');
      if (saved) {
        const parsed = JSON.parse(saved);
        const now = new Date();
        if (parsed.month === now.getMonth()) {
          setUsage(parsed);
        } else {
          const newUsage = { count: 0, month: now.getMonth() };
          localStorage.setItem('ai_usage', JSON.stringify(newUsage));
          setUsage(newUsage);
        }
      }
    } catch {
      const newUsage = { count: 0, month: new Date().getMonth() };
      localStorage.setItem('ai_usage', JSON.stringify(newUsage));
      setUsage(newUsage);
    }
  }, []);

  const canUse = () => {
    if (typeof window === 'undefined') return true;
    const now = new Date();
    return usage.month !== now.getMonth() || usage.count < 3;
  };

  const incrementUsage = () => {
    if (typeof window === 'undefined') return;
    const now = new Date();
    const newUsage = { count: usage.count + 1, month: now.getMonth() };
    setUsage(newUsage);
    try {
      localStorage.setItem('ai_usage', JSON.stringify(newUsage));
    } catch {}
  };

  return (
    <AiUsageContext.Provider value={{ usage, canUse, incrementUsage }}>
      {children}
    </AiUsageContext.Provider>
  );
}

export const useAiUsage = () => useContext(AiUsageContext);