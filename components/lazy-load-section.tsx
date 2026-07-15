'use client';

import { useEffect, useRef, useState } from 'react';

type LazyLoadSectionProps = {
  children: React.ReactNode;
  /** Force the section to mount immediately (e.g. deep-link target). */
  forceVisible?: boolean;
  /** IntersectionObserver rootMargin. Defaults to 400px. */
  rootMargin?: string;
  /** Placeholder height before the section is visible. */
  placeholderHeight?: number | string;
  /** Called once when the section first becomes visible. */
  onVisible?: () => void;
  className?: string;
  id?: string;
};

export function LazyLoadSection({
  children,
  forceVisible = false,
  rootMargin = '400px',
  placeholderHeight = 400,
  onVisible,
  className,
  id
}: LazyLoadSectionProps) {
  const [isVisible, setIsVisible] = useState(forceVisible);
  const ref = useRef<HTMLDivElement>(null);
  const onVisibleRef = useRef(onVisible);
  onVisibleRef.current = onVisible;

  useEffect(() => {
    if (forceVisible) {
      setIsVisible(true);
      onVisibleRef.current?.();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          onVisibleRef.current?.();
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [forceVisible, rootMargin]);

  return (
    <div ref={ref} id={id} className={className}>
      {isVisible ? (
        children
      ) : (
        <div style={{ height: placeholderHeight }} aria-hidden="true" />
      )}
    </div>
  );
}
