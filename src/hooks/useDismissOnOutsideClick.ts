'use client';

import { useEffect, type RefObject } from 'react';

export function useDismissOnOutsideClick<T extends HTMLElement>(
  ref: RefObject<T>,
  onDismiss: () => void,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onDismiss();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [enabled, onDismiss, ref]);
}
