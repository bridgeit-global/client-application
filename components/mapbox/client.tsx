import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

// Initialize Mapbox only once
let mapboxInstance: typeof mapboxgl | null = null;

export function getMapboxInstance() {
  if (!mapboxInstance) {
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    mapboxInstance = mapboxgl;
  }
  return mapboxInstance;
}

// Lazy load geocoder
let geocoderInstance: MapboxGeocoder | null = null;

export function getGeocoder() {
  if (!geocoderInstance) {
    geocoderInstance = new MapboxGeocoder({
      accessToken: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN as string,
      mapboxgl: getMapboxInstance() as any,
      marker: true,
      placeholder: 'Search for places',
      clearOnBlur: true,
      collapsed: false
    });
  }
  return geocoderInstance;
}

export { geocoderInstance as geocoder };
export default getMapboxInstance();
