'use client';

import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('@/components/Map'), { ssr: false });

interface SiteProfileMapProps {
  latitude: number;
  longitude: number;
}

export function SiteProfileMap({ latitude, longitude }: SiteProfileMapProps) {
  return (
    <MapComponent
      latitude={latitude}
      longitude={longitude}
    />
  );
}
