'use client';

import { useEffect, useRef, useState } from 'react';

export function LazyLoadSection({ children }: { children: React.ReactNode }) {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            {
                rootMargin: '400px', // Content will start loading when 50px away from viewport
            }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <div ref={ref}>
            {isVisible ? children : <div style={{ height: '400px' }} />}
        </div>
    );
} 