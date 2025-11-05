'use client';

import React, { useRef, useEffect, useState } from 'react';
import mapboxgl, { Popup } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { updateMarkers, colors, createDonutSwapChart } from '@/lib/map/utils';
import { Button } from '../ui/button';
import { useRouter } from 'next/navigation';
import { camelCaseToTitleCase } from '@/lib/utils/string-format';
import { useSiteName } from '@/lib/utils/site';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

const mag0 = ['!', ['has', 'swap_cost']];
const mag1 = ['all', ['has', 'units'], ['==', ['get', 'units'], 0]];
const mag2 = [
  'all',
  ['has', 'swap_cost'],
  ['>', ['get', 'swap_cost'], 0],
  ['<=', ['get', 'swap_cost'], 10]
];
const mag3 = [
  'all',
  ['has', 'swap_cost'],
  ['>', ['get', 'swap_cost'], 10],
  ['<=', ['get', 'swap_cost'], 25]
];
const mag4 = ['all', ['has', 'swap_cost'], ['>', ['get', 'swap_cost'], 25]];


export default function SwapCostMap({
  data,
  setActiveMap,
  activeMap
}: {
  data: any;
  activeMap: any;
  setActiveMap: (map: string) => void;
}) {
  const site_name = useSiteName();
  const router = useRouter();
  const [mapKey, setMapKey] = useState('geojsonSwapData'); // Add state for map key
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const markersOnScreen = useRef<{ [key: string]: mapboxgl.Marker }>({});

  useEffect(() => {
    const initializeMap = async () => {
      if (map.current) return;

      map.current = new mapboxgl.Map({
        container: mapContainer.current as HTMLElement,
        style: process.env.NEXT_PUBLIC_MAPBOX_STYLE_ID,
        center: [79.09, 22.17],
        zoom: 3.82
      });

      // Store map instance for cleanup
      const mapInstance = map.current;
      mapInstance.addControl(new mapboxgl.NavigationControl());

      mapInstance.on('load', async () => {
        if (!mapInstance) return;
        mapInstance.addSource('swap_cost_data', {
          type: 'geojson',
          data: data[mapKey],
          cluster: true,
          clusterRadius: 80,
          clusterProperties: {
            charges: ['+', ['case', ['has', 'charges'], ['get', 'charges'], 0]],
            units: ['+', ['case', ['has', 'units'], ['get', 'units'], 0]],
            mag0: ['+', ['case', mag0, 1, 0]],
            mag1: ['+', ['case', mag1, 1, 0]],
            mag2: ['+', ['case', mag2, 1, 0]],
            mag3: ['+', ['case', mag3, 1, 0]],
            mag4: ['+', ['case', mag4, 1, 0]]
          }
        });

        // Add layers for rendering individual earthquakes and clusters

        mapInstance.addLayer({
          id: `data-circle`,
          type: 'circle',
          source: 'swap_cost_data',
          filter: ['!=', 'cluster', true],
          paint: {
            'circle-color': [
              'case',
              mag0,
              colors[0],
              mag1,
              colors[1],
              mag2,
              colors[2],
              mag3,
              colors[3],
              colors[4]
            ],
            'circle-opacity': 0.6,
            'circle-radius': 12
          }
        });

        // Add a layer showing the custom tileset
        mapInstance.addLayer({
          id: `data-symbol`,
          type: 'symbol',
          source: 'swap_cost_data',
          filter: ['!=', 'cluster', true],
          layout: {
            'text-field': [
              'case',
              ['has', 'swap_cost'],
              [
                'number-format',
                [
                  'case',
                  ['has', 'swap_cost'],
                  ['number', ['get', 'swap_cost']],
                  0
                ],
                { 'min-fraction-digits': 1, 'max-fraction-digits': 1 }
              ],
              ''
            ],
            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
            'text-size': 10
          },
          paint: {
            'text-color': [
              'case',
              ['has', 'swap_cost'],
              [
                'case',
                ['<', ['number', ['get', 'swap_cost']], 25],
                'white',
                'black'
              ],
              'gray'
            ]
          }
        });

        // Add the legend to the map
        const legend = document.createElement('div');
        legend.className = 'mapbox-legend';
        legend.innerHTML = `
          <div style="text-align: center; padding: 5px; background-color: ${colors[0]}">No Data</div>
          <div style="text-align: center; padding: 5px; background-color: ${colors[1]}">0 Count</div>
          <div style="text-align: center; padding: 5px; background-color: ${colors[2]}">0 - 10 Swap Cost</div>
          <div style="text-align: center; padding: 5px; background-color: ${colors[3]}">10 - 25 Swap Cost</div>
          <div style="text-align: center; padding: 5px; background-color: ${colors[4]}">25+ Swap Cost</div>
        `;
        mapInstance.getContainer().appendChild(legend);

        // Add a hide button with an icon
        const hideButton = document.createElement('button');
        hideButton.innerHTML = '🔽'; // Using an emoji as an icon
        hideButton.style.position = 'absolute';
        hideButton.style.left = '10px';
        hideButton.onclick = () => {
          legend.style.display =
            legend.style.display === 'none' ? 'block' : 'none';
          hideButton.innerHTML = legend.style.display === 'none' ? '🔼' : '🔽'; // Update icon based on visibility
        };
        mapInstance.getContainer().appendChild(hideButton);

        // Position the legend
        legend.style.position = 'absolute';
        legend.style.left = '10px';
        legend.style.top = '20px';
        legend.style.backgroundColor = 'white';
        legend.style.borderRadius = '5px';
        legend.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';

        // Single render event listener
        mapInstance.on('render', () => {
          if (!mapInstance || !mapInstance.isSourceLoaded('swap_cost_data'))
            return;
          updateMarkers(
            mapInstance,
            markers.current,
            markersOnScreen.current,
            (props) => createDonutSwapChart(props) as Node,
            'swap_cost_data'
          );
        });

        const popup = new Popup();
        // Add hover event listeners for the symbol layer
        mapInstance.on('mousemove', 'data-circle', (e) => {
          const features = mapInstance.queryRenderedFeatures(e.point, {
            layers: ['data-circle']
          });

          if (!features.length) {
            popup.remove();
            return;
          }

          const feature = features[0];
          popup
            .setLngLat(e.lngLat)
            .setHTML(
              `
              <p>Account Number: ${feature.properties?.site_id.split('_')[1] || 'N/A'}</p>
              <p>${site_name} ID: ${feature.properties?.site || 'N/A'}</p>
              <p>Swap Cost: <span style="color: ${feature.properties?.swap_cost < 25 ? 'green' : 'red'
              };">${feature.properties?.swap_cost || 'No Data'}</span></p>
              
               <a href="#" id="link-${feature.properties
                ?.site_id}" style="color: #2563eb; text-decoration: underline; font-weight: 500;">More info</a>
              `
            )
            .addTo(mapInstance);

          const linkElement = document.getElementById(
            `link-${feature.properties?.site_id}`
          );
          if (linkElement) {
            linkElement.addEventListener('click', function (e) {
              e.preventDefault();
              router.push(
                `/portal/report/bill?account_number=${feature.properties?.site_id.split('_')[1]}`
              );
            });
          }
        });
      });
    };

    initializeMap();

    // Cleanup function
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      // Clear markers
      Object.values(markers.current).forEach((marker) => marker.remove());
      markers.current = {};
      markersOnScreen.current = {};
    };
  }, [mapKey]);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Swap Cost Distribution Map</h2>
      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:justify-between">
        <div className="flex gap-2">
          {['unit', 'swap'].map((key) => {
            return (
              <Button
                size={'sm'}
                key={key}
                className="flex-1 sm:flex-none"
                variant={activeMap === key ? 'default' : 'outline'}
                onClick={() => setActiveMap(key)}
              >
                {camelCaseToTitleCase(key)} Cost
              </Button>
            );
          })}
        </div>
        {/* <div className="grid grid-cols-3 gap-2 sm:flex">
          <Button
            size={'sm'}
            className="text-xs sm:text-sm"
            variant={mapKey === 'geojsonSwapData' ? 'default' : 'outline'}
            onClick={() => setMapKey('geojsonSwapData')}
          >
            Latest Month
          </Button>
          <Button
            size={'sm'}
            className="text-xs sm:text-sm"
            variant={mapKey === 'geojsonSwapThreeMonthData' ? 'default' : 'outline'}
            onClick={() => setMapKey('geojsonSwapThreeMonthData')}
          >
            Three Months
          </Button>
          <Button
            size={'sm'}
            className="text-xs sm:text-sm"
            variant={mapKey === 'geojsonSwapSixMonthData' ? 'default' : 'outline'}
            onClick={() => setMapKey('geojsonSwapSixMonthData')}
          >
            Six Months
          </Button>
        </div> */}
      </div>
      <div
        ref={mapContainer}
        className="map-container rounded-lg border"
        style={{ height: '70vh' }}
      />
    </div>
  );
}
