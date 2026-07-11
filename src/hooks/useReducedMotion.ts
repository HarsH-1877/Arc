'use client';

import { useEffect, useState } from 'react';

export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return reducedMotion;
}

export function useMotionSafeTransition() {
  const reducedMotion = useReducedMotion();
  return reducedMotion ? { duration: 0 } : { duration: PAGE_TRANSITION_DURATION };
}

const PAGE_TRANSITION_DURATION = 0.22;

export function useMotionVariants() {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return {
      initial: { opacity: 1, y: 0 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 1, y: 0 },
      transition: { duration: 0 },
    };
  }

  return {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
    transition: { duration: PAGE_TRANSITION_DURATION, ease: [0.25, 0.46, 0.45, 0.94] },
  };
}
