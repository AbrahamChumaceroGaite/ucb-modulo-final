'use client';

import { useCallback, useEffect, useRef } from 'react';
import { driver, type DriveStep, type Driver } from 'driver.js';

/** A step of a guided tour. `element` is a `[data-tour="…"]` selector built by `tourAnchor`. */
export type TourStep = DriveStep;

/** `tourAnchor('lot')` → `[data-tour="lot"]`: the attribute and its selector come from one place. */
export function tourAnchor(name: string): string {
  return `[data-tour="${name}"]`;
}

// driver.js paints the overlay inline and does not read CSS variables: this is --color-on-surface written out.
const OVERLAY = '#2e1506';

/**
 * Returns a function that starts the tour. The driver is created on demand,
 * when the targets are on screen, and destroyed on unmount so a route change
 * never leaves the overlay behind. With reduced motion it neither animates
 * nor scrolls smoothly.
 */
export function useGuidedTour(steps: TourStep[]): () => void {
  const tour = useRef<Driver | null>(null);

  useEffect(() => () => tour.current?.destroy(), []);

  return useCallback(() => {
    tour.current?.destroy();
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    tour.current = driver({
      steps,
      animate: !still,
      smoothScroll: !still,
      showProgress: true,
      progressText: '{{current}} de {{total}}',
      nextBtnText: 'Siguiente',
      prevBtnText: 'Atrás',
      doneBtnText: 'Listo',
      overlayColor: OVERLAY,
      overlayOpacity: 0.55,
      stagePadding: 6,
      stageRadius: 12,
      popoverClass: 'guided-tour',
      // An empty list has no lot to point at: skip those steps instead of floating them in the middle.
      skipMissingElement: true,
    });
    tour.current.drive();
  }, [steps]);
}
