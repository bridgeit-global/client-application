'use client';

import { useEffect, useRef, useState } from 'react';
import { getMapboxInstance } from '@/components/mapbox/client';
import type { FeatureCollection, Point } from 'geojson';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CHART_COLORS } from '@/constants/colors';
import { useSiteType } from '@/hooks/use-site-type';
import { useSiteName } from '@/lib/utils/site';
export interface MapLocation {
    id: string;
    latitude: number;
    longitude: number;
    type?: string;
    is_active: boolean;
}

// Initialize Mapbox
const mapboxgl = getMapboxInstance();

interface StationProperties extends MapLocation {
    color: string;
}

export default function StationsMap({ mapData }: { mapData: MapLocation[] }) {
    const site_name = useSiteName();
    const SITE_TYPES = useSiteType();
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const [mapLoaded, setMapLoaded] = useState(false);

    // Convert station data to GeoJSON format
    const geojsonData: FeatureCollection<Point, StationProperties> = {
        type: 'FeatureCollection',
        features: mapData.map((station, index) => ({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [
                    station.longitude || (78 + (index % 5) * 2), // Use actual longitude if available
                    station.latitude || (20 + Math.floor(index / 5) * 2) // Use actual latitude if available
                ]
            },
            properties: {
                ...station,
                color: CHART_COLORS[index]
            }
        }))
    };

    useEffect(() => {
        if (!mapContainer.current || map.current) return;

        // Initialize map
        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: process.env.NEXT_PUBLIC_MAPBOX_STYLE_ID,
            center: [78.9629, 20.5937], // Center of India
            zoom: 4,
            maxZoom: 15,
            minZoom: 3
        });

        const mapInstance = map.current;

        mapInstance.on('style.load', () => {
            setMapLoaded(true);

            try {
                // Add data source with clustering
                mapInstance.addSource('stations', {
                    type: 'geojson',
                    data: geojsonData,
                    cluster: true,
                    clusterMaxZoom: 14,
                    clusterRadius: 50
                });

                // Add cluster layer
                mapInstance.addLayer({
                    id: 'clusters',
                    type: 'circle',
                    source: 'stations',
                    filter: ['has', 'point_count'],
                    paint: {
                        'circle-color': [
                            'step',
                            ['get', 'point_count'],
                            '#84cc16',
                            10,
                            '#22c55e',
                            30,
                            '#15803d'
                        ],
                        'circle-radius': [
                            'step',
                            ['get', 'point_count'],
                            20,
                            10,
                            30,
                            30,
                            40
                        ]
                    }
                });


                // Add cluster count labels
                mapInstance.addLayer({
                    id: 'cluster-count',
                    type: 'symbol',
                    source: 'stations',
                    filter: ['has', 'point_count'],
                    layout: {
                        'text-field': '{point_count_abbreviated}',
                        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                        'text-size': 12
                    },
                    paint: {
                        'text-color': '#ffffff'
                    }
                });

                // Add individual station points
                mapInstance.addLayer({
                    id: 'unclustered-point',
                    type: 'circle',
                    source: 'stations',
                    filter: ['!', ['has', 'point_count']],
                    paint: {
                        'circle-color': ['get', 'color'],
                        'circle-radius': 8,
                        'circle-stroke-width': 2,
                        'circle-stroke-color': '#ffffff'
                    }
                });

                // Add popup on hover
                const popup = new mapboxgl.Popup({
                    closeButton: false,
                    closeOnClick: false
                });

                mapInstance.on('mouseenter', 'unclustered-point', (e) => {
                    const feature = e.features?.[0];
                    if (!feature || !feature.geometry || !feature.properties) return;

                    const coordinates = (feature.geometry as Point).coordinates.slice();
                    const { type, is_active } = feature.properties;

                    const popupContent = `
              <div class="p-2">
                <p class="font-medium">${type || 'Unknown'} ${site_name}</p>
                <p class="text-sm ${is_active ? 'text-green-600' : 'text-red-600'}">
                  Status: ${is_active ? 'Active' : 'Inactive'}
                </p>
              </div>
            `;

                    popup.setLngLat(coordinates as [number, number]).setHTML(popupContent).addTo(mapInstance);
                });

                mapInstance.on('mouseleave', 'unclustered-point', () => {
                    popup.remove();
                });

                // Add navigation controls
                mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right');
            } catch (error) {
                console.error('Error adding data source or layers:', error);
            }
        });

        return () => {
            map.current?.remove();
        };
    }, [geojsonData]);

    useEffect(() => {
        if (!map.current || !mapLoaded) return;

        try {
            // Update the data source when mapData changes
            const source = map.current.getSource('stations');
            if (source) {
                (source as mapboxgl.GeoJSONSource).setData(geojsonData);
            } else {
                // If source doesn't exist, try to add it
                map.current.addSource('stations', {
                    type: 'geojson',
                    data: geojsonData,
                    cluster: true,
                    clusterMaxZoom: 14,
                    clusterRadius: 50
                });
                // Re-add all layers
                // ... (copy all layer adding code from the initial setup)
            }
        } catch (error) {
            console.error('Error updating map data:', error);
        }
    }, [mapData, mapLoaded, geojsonData]);

    // Calculate total statistics
    const totalStats = mapData.reduce(
        (acc, curr) => ({
            active: acc.active + (curr.is_active ? 1 : 0),
            inactive: acc.inactive + (curr.is_active ? 0 : 1),
            total: acc.total + 1
        }),
        { active: 0, inactive: 0, total: 0 }
    );

    return (
        <Card className="w-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold text-gray-800">
                    {site_name} Distribution Map
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Statistics Bar */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-600">Active {site_name}</p>
                        <p className="text-2xl font-bold text-green-600">{totalStats.active}</p>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-600">Inactive {site_name}</p>
                        <p className="text-2xl font-bold text-red-600">{totalStats.inactive}</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-600">Total {site_name}</p>
                        <p className="text-2xl font-bold text-blue-600">{totalStats.total}</p>
                    </div>
                </div>

                {/* Map Container */}
                <div className="relative">
                    <div
                        ref={mapContainer}
                        className="w-full h-[500px] rounded-lg border border-gray-200"
                    />

                    {/* Legend */}
                    <Card className="absolute bottom-4 right-4 w-48 bg-white/90 backdrop-blur-sm">
                        <CardContent className="p-3">
                            <h3 className="font-medium mb-2">{site_name} Types</h3>
                            <div className="space-y-2">
                                {SITE_TYPES.map((type, index) => (
                                    <div key={type.value} className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: CHART_COLORS[index] }}
                                        />
                                        <span className="text-sm">
                                            {type.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </CardContent>
        </Card>
    );
} 