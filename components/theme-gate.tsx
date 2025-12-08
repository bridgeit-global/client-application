'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function ThemeGate() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    const isPortal = pathname?.startsWith('/portal');
    const isSupport = pathname?.startsWith('/support');
    // Apply dark theme only to routes that are neither portal nor support (public routes)
    root.classList.toggle('dark', !isPortal && !isSupport);
  }, [pathname]);

  return null;
}


