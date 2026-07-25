'use client';

import React, { createContext, useContext, useRef } from 'react';

interface LandingContextValue {
  /** Global scroll progress 0–1 driven by GSAP ScrollTrigger */
  progressRef: React.MutableRefObject<number>;
}

const LandingContext = createContext<LandingContextValue | null>(null);

export function LandingProvider({ children }: { children: React.ReactNode }) {
  const progressRef = useRef<number>(0);
  return (
    <LandingContext.Provider value={{ progressRef }}>
      {children}
    </LandingContext.Provider>
  );
}

export function useLandingProgress() {
  const ctx = useContext(LandingContext);
  if (!ctx) throw new Error('useLandingProgress must be used inside LandingProvider');
  return ctx.progressRef;
}
