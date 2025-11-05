'use client';

import dynamic from 'next/dynamic';
import { LngLatLike } from 'mapbox-gl';
import { useRef, useEffect, useState } from 'react';
import { getMapboxInstance, getGeocoder } from './client';

// Default coordinates for India
const INDIA_BOUNDS = {
  center: [78.9629, 20.5937] as LngLatLike,
  zoom: 3
};

export function MapboxLandingPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const mapboxgl = getMapboxInstance();
    
    // Initialize map with reduced initial render quality for faster loading
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: process.env.NEXT_PUBLIC_HOME_STYLE_ID,
      center: INDIA_BOUNDS.center,
      zoom: INDIA_BOUNDS.zoom,
      dragPan: false,
      // scrollZoom: false,
      renderWorldCopies: false,
      preserveDrawingBuffer: false,
      fadeDuration: 0,
      maxZoom: 15
    });

    const mapInstance = map.current;

    mapInstance.once('load', () => {
      setIsMapLoaded(true);
      // Add controls only after map is loaded
      const geocoder = getGeocoder();
      // Geocoder types target mapbox-gl v2; cast for v3 compatibility
      mapInstance.addControl(geocoder as any);

      // Handle clear event to reset to India view
      geocoder.on('clear', () => {
        mapInstance?.flyTo({
          center: INDIA_BOUNDS.center,
          zoom: INDIA_BOUNDS.zoom,
          essential: true
        });
      });
    });

    // Cleanup
    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  return (
    <div>
      <div
        ref={mapContainer}
        className="map-container w-full"
        style={{
          height: '80vh',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          background: '#f3f4f6' // Add a background color while map loads
        }}
      />
    </div>
  );
}
