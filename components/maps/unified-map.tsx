'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { getMapboxInstance } from '@/components/mapbox/client';
import type { FeatureCollection, Point, GeoJsonProperties } from 'geojson';
import 'mapbox-gl/dist/mapbox-gl.css';
import { createPaymentTypeDonutChart, createStationTypeDonutChart } from '@/lib/map/utils';
import { useRouter } from 'next/navigation';
import { PAY_TYPE } from '@/constants/bill';
import { camelCaseToTitleCase } from '@/lib/utils/string-format';
import { useSiteName } from '@/lib/utils/site';
import { CHART_COLORS } from '@/constants/colors';
import { useSiteType } from '@/hooks/use-site-type';

function onMarkerClick(
    clusterId: number,
    coordinates: [number, number],
    props: any,
    map: any,
    dataSource: string
) {
    map
        .getSource(dataSource)
        ?.getClusterExpansionZoom(clusterId, (err: any, zoom: any) => {
            if (err) return;

            map.easeTo({
                center: coordinates,
                zoom: zoom
            });
        });
}

function updateMarkers(
    map: mapboxgl.Map,
    markers: { [key: string]: mapboxgl.Marker },
    markersOnScreen: { [key: string]: mapboxgl.Marker },
    createDonutChart: (props: any) => Node,
    dataSource: string,
    type: MapType
) {
    const newMarkers: { [key: string]: mapboxgl.Marker } = {};
    const features = map.querySourceFeatures(dataSource);

    for (const feature of features) {
        const coords = (feature.geometry as GeoJSON.Point).coordinates as [number, number];
        const props = feature.properties;
        if (!props?.cluster) continue;
        const id = `${type}-${props.cluster_id}`;

        let marker = markers[id];
        if (!marker) {
            const el = createDonutChart(props);
            el?.addEventListener('click', () =>
                onMarkerClick(props.cluster_id, coords, props, map, dataSource)
            );

            marker = markers[id] = new mapboxgl.Marker({
                element: el as HTMLElement
            }).setLngLat(coords);
        }
        newMarkers[id] = marker;

        if (!markersOnScreen[id]) marker.addTo(map);
    }

    // Remove markers that are no longer visible
    for (const id in markersOnScreen) {
        if (!newMarkers[id]) {
            markersOnScreen[id].remove();
            delete markersOnScreen[id];
        }
    }

    // Update markersOnScreen
    for (const id in newMarkers) {
        markersOnScreen[id] = newMarkers[id];
    }
}

// Initialize Mapbox
const mapboxgl = getMapboxInstance();

// Color constants
const PAYMENT_COLORS: Record<string, string> = {
    'prepaid': '#10b981',  // Emerald
    'postpaid': '#6366f1', // Indigo  
    'submeter': '#ec4899', // Pink
};

export interface MapLocation {
    id?: string;
    site_id?: string;
    station_type?: string;
    zone_id?: string;
    paytype?: number;
    latitude: number;
    longitude: number;
    account_number?: string;
}

export type MapType = 'stations' | 'payments';

interface UnifiedMapProps {
    stationsData: MapLocation[];
    paymentsData: MapLocation[];
    title: string;
}

export default function UnifiedMap({ stationsData, paymentsData }: UnifiedMapProps) {

    const router = useRouter();
    const site_name = useSiteName();
    const SITE_TYPES = useSiteType();
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [sourcesInitialized, setSourcesInitialized] = useState(false);
    const prevSiteTypesRef = useRef<string>('');
    const popupRef = useRef<mapboxgl.Popup | null>(null);
    // Separate markers for each type
    const markers = useRef<{
        stations: { [key: string]: mapboxgl.Marker };
        payments: { [key: string]: mapboxgl.Marker };
    }>({
        stations: {},
        payments: {}
    });
    const markersOnScreen = useRef<{
        stations: { [key: string]: mapboxgl.Marker };
        payments: { [key: string]: mapboxgl.Marker };
    }>({
        stations: {},
        payments: {}
    });
    // Get appropriate colors and chart creator based on map type
    const getMapConfig = useCallback((type: MapType) => {

        const types = SITE_TYPES.map(type => type.value);
        switch (type) {
            case 'payments':
                return {
                    colors: PAYMENT_COLORS,
                    chartCreator: createPaymentTypeDonutChart,
                    clusterProperties: {
                        'prepaid_count': ['+', ['case', ['==', ['get', 'paytype'], 0], 1, 0]],
                        'postpaid_count': ['+', ['case', ['==', ['get', 'paytype'], 1], 1, 0]],
                        'submeter_count': ['+', ['case', ['==', ['get', 'paytype'], -1], 1, 0]]
                    }
                };
            case 'stations':
                return {
                    colors: CHART_COLORS,
                    chartCreator: (props: any) => createStationTypeDonutChart(props, types),
                    clusterProperties: types.reduce((acc, type) => ({
                        ...acc,
                        [`${type}_count`]: ['+', ['case', ['==', ['get', 'station_type'], type], 1, 0]]
                    }), {})
                };
            default:
                throw new Error('Invalid map type');
        }
    }, [SITE_TYPES]);

    // Convert data to GeoJSON for each type
    const convertToGeoJSON = useCallback((data: MapLocation[], type: MapType): FeatureCollection<Point, GeoJsonProperties> => {
        // Handle null/undefined data
        if (!data || !Array.isArray(data)) {
            return {
                type: 'FeatureCollection',
                features: []
            };
        }

        const config = getMapConfig(type);
        const station_colors: Record<string, string> = {};
        SITE_TYPES.map((type, index) => {
            station_colors[type.value] = CHART_COLORS[index];
        });
        return {
            type: 'FeatureCollection',
            features: data.map((location: MapLocation) => {
                const color = type === 'payments'
                    ? (config?.colors as Record<string, string>)[PAY_TYPE[location.paytype || 0]] || ''
                    : station_colors[location.station_type || ''];

                return {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [location.longitude, location.latitude]
                    },
                    properties: {
                        ...location,
                        color,
                        type
                    }
                };
            })
        };
    }, [getMapConfig, SITE_TYPES]);

    // Initialize map (only create the map container, not the sources)
    useEffect(() => {
        if (!mapContainer.current || map.current) return;

        try {
            map.current = new mapboxgl.Map({
                container: mapContainer.current,
                style: process.env.NEXT_PUBLIC_MAPBOX_STYLE_ID,
                center: [78.9629, 20.5937],
                zoom: 4,
            });

            const mapInstance = map.current;

            mapInstance.on('load', () => {
                setMapLoaded(true);

                // Add navigation controls
                mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right');

                // Initialize popup
                popupRef.current = new mapboxgl.Popup({
                    closeButton: false,
                    closeOnClick: false
                });
            });
        } catch (error) {
            // Handle map initialization error silently
        }
    }, []);

    // Initialize sources and layers when map is loaded and data is available
    useEffect(() => {
        if (!map.current || !mapLoaded || !stationsData || !paymentsData) return;

        const mapInstance = map.current;
        const currentSiteTypesKey = SITE_TYPES.map(t => t.value).join(',');

        // Skip if site types haven't changed
        if (prevSiteTypesRef.current === currentSiteTypesKey && sourcesInitialized) {
            return;
        }

        prevSiteTypesRef.current = currentSiteTypesKey;

        // Remove existing sources and layers if they exist
        const cleanupExisting = () => {
            ['stations', 'payments'].forEach(type => {
                try {
                    if (mapInstance.getLayer(`${type}-clusters`)) mapInstance.removeLayer(`${type}-clusters`);
                    if (mapInstance.getLayer(`${type}-counts`)) mapInstance.removeLayer(`${type}-counts`);
                    if (mapInstance.getLayer(`${type}-points`)) mapInstance.removeLayer(`${type}-points`);
                    if (mapInstance.getSource(`${type}-source`)) mapInstance.removeSource(`${type}-source`);
                } catch (e) {
                    // Ignore errors during cleanup
                }
            });

            // Clear markers
            Object.values(markers.current.stations).forEach(marker => marker.remove());
            Object.values(markers.current.payments).forEach(marker => marker.remove());
            markers.current = { stations: {}, payments: {} };
            Object.values(markersOnScreen.current.stations).forEach(marker => marker.remove());
            Object.values(markersOnScreen.current.payments).forEach(marker => marker.remove());
            markersOnScreen.current = { stations: {}, payments: {} };
        };

        cleanupExisting();

        try {
            // Add sources for each data type
            const sources = {
                stations: convertToGeoJSON(stationsData, 'stations'),
                payments: convertToGeoJSON(paymentsData, 'payments')
            };

            // Add each source to the map
            Object.entries(sources).forEach(([type, data]) => {
                const sourceId = `${type}-source`;
                const config = getMapConfig(type as MapType);

                mapInstance.addSource(sourceId, {
                    type: 'geojson',
                    data,
                    cluster: true,
                    clusterMaxZoom: 14,
                    clusterRadius: 50,
                    clusterProperties: config.clusterProperties
                });

                // Add cluster layer
                mapInstance.addLayer({
                    id: `${type}-clusters`,
                    type: 'circle',
                    source: sourceId,
                    filter: ['has', 'point_count'],
                    paint: {
                        'circle-color': '#ffffff',
                        'circle-radius': ['step', ['get', 'point_count'], 20, 10, 30, 30, 40],
                        'circle-stroke-width': 1,
                        'circle-stroke-color': '#000000'
                    }
                });

                // Add cluster count layer
                mapInstance.addLayer({
                    id: `${type}-counts`,
                    type: 'symbol',
                    source: sourceId,
                    filter: ['has', 'point_count'],
                    layout: {
                        'text-field': ['number-format', ['+', ...Object.keys(config.clusterProperties).map(key => ['coalesce', ['get', key], 0])], {}],
                        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                        'text-size': 12
                    },
                    paint: { 'text-color': '#000000' }
                });

                // Hide default cluster layers (we use custom donut markers)
                mapInstance.setLayoutProperty(`${type}-clusters`, 'visibility', 'none');
                mapInstance.setLayoutProperty(`${type}-counts`, 'visibility', 'none');

                // Add unclustered point layer
                mapInstance.addLayer({
                    id: `${type}-points`,
                    type: 'circle',
                    source: sourceId,
                    filter: ['!', ['has', 'point_count']],
                    paint: {
                        'circle-color': ['get', 'color'],
                        'circle-radius': 8,
                        'circle-stroke-width': 2,
                        'circle-stroke-color': '#ffffff'
                    }
                });

                // Initially hide all layers except stations
                if (type !== 'stations') {
                    mapInstance.setLayoutProperty(`${type}-points`, 'visibility', 'none');
                }
            });

            // Update markers function
            const updateAllMarkers = () => {
                ['stations', 'payments'].forEach(type => {
                    const sourceId = `${type}-source`;
                    if (!mapInstance.getSource(sourceId) || !mapInstance.isSourceLoaded(sourceId)) return;

                    const config = getMapConfig(type as MapType);
                    updateMarkers(
                        mapInstance,
                        markers.current[type as MapType],
                        markersOnScreen.current[type as MapType],
                        config.chartCreator,
                        sourceId,
                        type as MapType
                    );
                });
            };

            // Update markers on render and moveend
            mapInstance.on('render', updateAllMarkers);
            mapInstance.on('moveend', updateAllMarkers);

            // Add click event for clusters
            mapInstance.on('click', ['stations-clusters', 'payments-clusters'], (e) => {
                const features = e.features as mapboxgl.MapboxGeoJSONFeature[];
                if (!features?.[0]?.geometry) return;

                const clusterId = features[0]?.properties?.cluster_id;
                const sourceId = features[0]?.source;

                if (clusterId !== undefined && sourceId) {
                    const source = mapInstance.getSource(sourceId) as mapboxgl.GeoJSONSource;
                    source.getClusterExpansionZoom(clusterId, (err, zoom) => {
                        if (err || !zoom) return;
                        mapInstance.easeTo({
                            center: (features[0].geometry as Point).coordinates as [number, number],
                            zoom
                        });
                    });
                }
            });

            // Add hover effect for points
            mapInstance.on('mouseenter', ['stations-points', 'payments-points'], (e) => {
                const feature = e.features?.[0];
                if (!feature?.geometry || !feature.properties || !popupRef.current) return;

                const coordinates = (feature.geometry as Point).coordinates.slice();
                const properties = feature.properties;

                const getPopupContent = () => {
                    const type = properties.type as MapType;
                    switch (type) {
                        case 'stations':
                            return `
                                <div class="p-2">
                                    <div class="flex justify-between items-start">
                                        <div>
                                            <p class="font-medium">${properties.station_type || 'Unknown'} ${site_name}</p>
                                            <p class="font-medium">${site_name} ID: ${properties.id || 'Unknown'}</p>
                                            <p class="font-medium">Zone: ${properties.zone_id || 'N/A'}</p>
                                            <a href="#" id="link-${properties.id}" style="color: #2563eb; text-decoration: underline; font-weight: 500; margin-top: 8px; display: block;">
                                                More info
                                            </a>
                                        </div>
                                        <button class="text-gray-500 hover:text-gray-700" onclick="document.querySelector('.mapboxgl-popup').remove();">
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            `;
                        case 'payments':
                            return `
                                <div class="p-2">
                                    <div class="flex justify-between items-start">
                                        <div>
                                            <p class="font-medium">${camelCaseToTitleCase(PAY_TYPE[properties.paytype]) || 'Unknown'} Connection</p>
                                            <p class="font-medium">Station ID: ${properties.site_id || 'Unknown'}</p>
                                            <p class="font-medium">Account Number: ${properties.account_number || 'Unknown'}</p>
                                            <a href="#" id="link-${properties.account_number}" style="color: #2563eb; text-decoration: underline; font-weight: 500; margin-top: 8px; display: block;">
                                                More info
                                            </a>
                                        </div>
                                        <button class="text-gray-500 hover:text-gray-700" onclick="document.querySelector('.mapboxgl-popup').remove();">
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            `;
                    }
                };

                popupRef.current
                    .setLngLat(coordinates as [number, number])
                    .setHTML(getPopupContent())
                    .addTo(mapInstance);

                const linkElement = document.getElementById(
                    `link-${properties.type === 'stations' ? properties.id : properties.account_number}`
                );
                if (linkElement) {
                    linkElement.addEventListener('click', () => {
                        if (properties.type === 'stations') {
                            router.push(`/portal/site/sites?site_id=${properties.id}`);
                        } else {
                            router.push(`/portal/site/${PAY_TYPE[properties.paytype]}?account_number=${properties.account_number}`);
                        }
                    });
                }
            });

            setSourcesInitialized(true);

            // Initial marker update
            mapInstance.once('idle', updateAllMarkers);

        } catch (error) {
            // Handle source initialization error silently
        }
    }, [mapLoaded, stationsData, paymentsData, SITE_TYPES, getMapConfig, convertToGeoJSON, router, site_name, sourcesInitialized]);

    // Setup UI controls (legend and toggle buttons)
    useEffect(() => {
        if (!map.current || !mapLoaded || !sourcesInitialized) return;

        const mapInstance = map.current;

        // Check if controls already exist
        if (document.getElementById('toggle-stations')) return;

        // Add data type toggle buttons
        const dataTypeToggleControl = document.createElement('div');
        dataTypeToggleControl.className = 'bg-white p-4 rounded-lg shadow-lg absolute right-4 bottom-4';
        dataTypeToggleControl.style.minWidth = '200px';
        dataTypeToggleControl.style.zIndex = '1';

        dataTypeToggleControl.innerHTML = `
            <div class="text-sm font-medium mb-2">Data Type</div>
            <div class="space-y-2">
                <button id="toggle-stations" class="w-full py-2 text-sm font-medium rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors">
                    ${site_name} Types
                </button>
                <button id="toggle-payments" class="w-full py-2 text-sm font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                    Payment Types
                </button>
            </div>
        `;
        mapInstance.getContainer().appendChild(dataTypeToggleControl);

        // Add legend control
        const legendControl = document.createElement('div');
        legendControl.className = 'bg-white p-4 rounded-lg shadow-lg absolute left-4 top-4';
        legendControl.style.minWidth = '200px';
        legendControl.style.zIndex = '1';
        legendControl.id = 'map-legend';

        const station_colors: Record<string, string> = {};
        SITE_TYPES.forEach((type, index) => {
            station_colors[type.value] = CHART_COLORS[index];
        });

        legendControl.innerHTML = `
            <div class="space-y-4">
                <div class="legend-section" id="legend-stations" style="display: block">
                    <div class="text-sm font-medium mb-2">${site_name} Types</div>
                    <div class="space-y-2">
                        ${Object.entries(station_colors).map(([key, color]) => `
                            <div class="flex items-center gap-2">
                                <div class="w-4 h-4 rounded-full" style="background-color: ${color}"></div>
                                <span class="text-sm">${key}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="legend-section" id="legend-payments" style="display: none">
                    <div class="text-sm font-medium mb-2">Payment Types</div>
                    <div class="space-y-2">
                        ${Object.entries(PAYMENT_COLORS).map(([key, color]) => `
                            <div class="flex items-center gap-2">
                                <div class="w-4 h-4 rounded-full" style="background-color: ${color}"></div>
                                <span class="text-sm">${camelCaseToTitleCase(key)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        mapInstance.getContainer().appendChild(legendControl);

        // Add hide button for legend
        const hideLegendButton = document.createElement('button');
        hideLegendButton.innerHTML = '🔽';
        hideLegendButton.className = 'bg-white rounded-md p-1 absolute left-4 shadow-lg';
        hideLegendButton.style.zIndex = '1';
        hideLegendButton.style.marginTop = '5px';
        hideLegendButton.style.top = '0px';
        hideLegendButton.onclick = () => {
            const isHidden = legendControl.style.display === 'none';
            legendControl.style.display = isHidden ? 'block' : 'none';
            hideLegendButton.innerHTML = isHidden ? '🔽' : '🔼';
        };
        mapInstance.getContainer().appendChild(hideLegendButton);

        // Add hide button for controls
        const hideControlsButton = document.createElement('button');
        hideControlsButton.innerHTML = '🔽';
        hideControlsButton.className = 'bg-white rounded-md p-1 absolute right-4 shadow-lg';
        hideControlsButton.style.zIndex = '1';
        hideControlsButton.style.marginTop = '5px';
        hideControlsButton.onclick = () => {
            const isHidden = dataTypeToggleControl.style.display === 'none';
            dataTypeToggleControl.style.display = isHidden ? 'block' : 'none';
            hideControlsButton.innerHTML = isHidden ? '🔽' : '🔼';
        };
        mapInstance.getContainer().appendChild(hideControlsButton);

        // Add toggle functionality
        ['stations', 'payments'].forEach(type => {
            const button = document.getElementById(`toggle-${type}`);
            if (button) {
                button.addEventListener('click', () => {
                    // Update button styles
                    ['stations', 'payments'].forEach(t => {
                        const btn = document.getElementById(`toggle-${t}`);
                        if (btn) {
                            if (t === type) {
                                btn.classList.remove('bg-gray-100', 'text-gray-700');
                                btn.classList.add('bg-blue-100', 'text-blue-700');
                            } else {
                                btn.classList.remove('bg-blue-100', 'text-blue-700');
                                btn.classList.add('bg-gray-100', 'text-gray-700');
                            }
                        }
                    });

                    // Show/hide layers
                    ['stations', 'payments'].forEach(t => {
                        const visibility = t === type ? 'visible' : 'none';
                        if (mapInstance.getLayer(`${t}-points`)) {
                            mapInstance.setLayoutProperty(`${t}-points`, 'visibility', visibility);
                        }
                    });

                    // Update legend
                    ['stations', 'payments'].forEach(t => {
                        const legendSection = document.getElementById(`legend-${t}`);
                        if (legendSection) {
                            legendSection.style.display = t === type ? 'block' : 'none';
                        }
                    });
                });
            }
        });
    }, [mapLoaded, sourcesInitialized, site_name, SITE_TYPES]);

    return (
        <div
            ref={mapContainer}
            className="w-full rounded-lg border"
            style={{ height: '70vh' }}
        />
    );
} 