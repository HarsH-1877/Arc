export const SPRING_SNAPPY = { type: 'spring' as const, stiffness: 500, damping: 35 };
export const SPRING_GENTLE = { type: 'spring' as const, stiffness: 300, damping: 30 };
export const EASE_OUT_FAST = { duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] as const };
export const EASE_OUT_SLOW = { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const };

export const PAGE_TRANSITION = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export const PAGE_TRANSITION_DURATION = 0.22;
