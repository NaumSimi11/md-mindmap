/**
 * useScrollSpy Hook
 * Tracks which section/heading is currently visible in the editor viewport
 * for dynamic outline highlighting
 */

import { useEffect, useState, useRef } from 'react';

interface UseScrollSpyOptions {
  /** Selector for heading elements to track */
  headingSelector?: string;
  /** Offset from top of viewport for "active" detection (in px) */
  offset?: number;
  /** Throttle interval for scroll event (in ms) */
  throttle?: number;
}

export function useScrollSpy(
  containerRef: React.RefObject<HTMLElement | null>,
  options: UseScrollSpyOptions = {}
): string | null {
  const {
    headingSelector = 'h1, h2, h3, h4, h5, h6',
    offset = 100,
    throttle = 100,
  } = options;

  const [activeId, setActiveId] = useState<string | null>(null);
  const lastScrollTime = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const now = Date.now();
      if (now - lastScrollTime.current < throttle) return;
      lastScrollTime.current = now;

      const headings = container.querySelectorAll(headingSelector);
      if (headings.length === 0) return;

      // Get scroll position
      const scrollPosition = container.scrollTop + offset;

      // Find the current heading
      let currentHeading: Element | null = null;

      for (let i = headings.length - 1; i >= 0; i--) {
        const heading = headings[i];
        const rect = heading.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        // Calculate position relative to container
        const relativeTop = rect.top - containerRect.top + container.scrollTop;

        if (relativeTop <= scrollPosition) {
          currentHeading = heading;
          break;
        }
      }

      if (currentHeading) {
        const headingText = currentHeading.textContent || '';
        if (headingText !== activeId) {
          setActiveId(headingText);
        }
      } else if (headings.length > 0 && scrollPosition < 100) {
        // At the top, highlight the first heading
        const firstHeading = headings[0];
        const firstText = firstHeading.textContent || '';
        if (firstText !== activeId) {
          setActiveId(firstText);
        }
      }
    };

    // Initial check
    handleScroll();

    // Listen to scroll events
    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [containerRef, headingSelector, offset, throttle]); // Removed activeId from dependencies to prevent infinite loop

  return activeId;
}

