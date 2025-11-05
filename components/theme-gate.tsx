'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function ThemeGate() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    const isPortal = pathname?.startsWith('/portal');
    // Apply dark theme to all non-portal routes
    root.classList.toggle('dark', !isPortal);
  }, [pathname]);

  return null;
}


