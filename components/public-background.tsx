'use client';

import { usePathname } from 'next/navigation';

export function PublicBackground() {
  const pathname = usePathname();
  const isPortal = pathname?.startsWith('/portal');
  if (isPortal) return null;
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 bg-theme-mesh" />
  );
}


