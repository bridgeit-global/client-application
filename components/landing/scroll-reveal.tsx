'use client';

import React, { useMemo, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

type ScrollRevealProps = {
  children: React.ReactNode;
  /**
   * Base delay applied to each revealed child.
   * Example: 0.05 means staggered by 0.05s.
   */
  staggerDelaySeconds?: number;
  /**
   * Extra class applied to the wrapper container.
   */
  className?: string;
  /**
   * Optional selector override for targets inside the section.
   */
  targetSelector?: string;
};

export default function ScrollReveal({
  children,
  staggerDelaySeconds = 0.06,
  className,
  targetSelector = '.container > *',
}: ScrollRevealProps) {
  const scopeRef = useRef<HTMLDivElement | null>(null);

  const targetsSelector = useMemo(() => targetSelector, [targetSelector]);

  // Run-once setup: we keep this wrapper intentionally small and reliable.
  React.useEffect(() => {
    const scopeEl = scopeRef.current;
    if (!scopeEl) return;

    const targets = Array.from(scopeEl.querySelectorAll<HTMLElement>(targetsSelector));

    // If the section doesn't have a `.container`, fall back to direct children.
    const safeTargets = targets.length > 0 ? targets : Array.from(scopeEl.children) as HTMLElement[];

    // Ensure no duplicate animations on fast navigation.
    gsap.set(safeTargets, { opacity: 0, y: 16 });

    safeTargets.forEach((el, idx) => {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.75,
        ease: 'power2.out',
        delay: idx === 0 ? 0 : idx * staggerDelaySeconds,
        scrollTrigger: {
          trigger: scopeEl,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      });
    });

    return () => {
      // Clear triggers created by this wrapper.
      ScrollTrigger.getAll().forEach((t) => {
        if (t.trigger === scopeEl) t.kill();
      });
    };
  }, [staggerDelaySeconds, targetsSelector]);

  return (
    <div ref={scopeRef} className={className}>
      {children}
    </div>
  );
}

