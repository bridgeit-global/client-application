import { CHART_COLORS } from '@/constants/colors';
import mapboxgl from 'mapbox-gl';

export const colors = ['#fff', '#fed976', '#feb24c', '#fd8d3c', '#fc4e2a'];

export function createDonutChart(props: any) {
  const offsets = [];
  const units = [props.mag0, props.mag1, props.mag2, props.mag3, props.mag4];
  const avg_unit_cost =
    props.units > 0 && props.charges > 0
      ? Number(props.charges / props.units).toFixed(2)
      : 0;
  let total = 0;
  for (const count of units) {
    offsets.push(total);
    total += count;
  }
  const fontSize =
    total >= 1000 ? 22 : total >= 100 ? 20 : total >= 10 ? 18 : 16;
  const r = total >= 50 ? 50 : total >= 20 ? 44 : total >= 10 ? 38 : 32;
  const r0 = Math.round(r * 0.6);
  const w = r * 2;

  let html = `<div>
    <svg width="${w}" height="${w}" viewbox="0 0 ${w} ${w}" text-anchor="middle" style="font: ${fontSize}px sans-serif; display: block">`;

  for (let i = 0; i < units.length; i++) {
    html += donutSegment(
      offsets[i] / total,
      (offsets[i] + units[i]) / total,
      r,
      r0,
      colors[i]
    );
  }
  html += `<circle cx="${r}" cy="${r}" r="${r0}" fill="white" />
    <text dominant-baseline="central" transform="translate(${r}, ${r})">
      ${avg_unit_cost.toLocaleString()}
    </text>
    </svg>
    </div>`;

  const el = document.createElement('div');
  el.innerHTML = html;
  return el.firstChild;
}

export function createDonutSwapChart(props: any) {
  const offsets = [];
  const units = [props.mag0, props.mag1, props.mag2, props.mag3, props.mag4];
  const avg_unit_cost =
    props.charges > 0 && props.units > 0
      ? Number(props.charges / props.units).toFixed(2)
      : 0;
  let total = 0;
  for (const count of units) {
    offsets.push(total);
    total += count;
  }
  const fontSize =
    total >= 1000 ? 22 : total >= 100 ? 20 : total >= 10 ? 18 : 16;
  const r = total >= 50 ? 50 : total >= 20 ? 44 : total >= 10 ? 38 : 32;
  const r0 = Math.round(r * 0.6);
  const w = r * 2;

  let html = `<div>
    <svg width="${w}" height="${w}" viewbox="0 0 ${w} ${w}" text-anchor="middle" style="font: ${fontSize}px sans-serif; display: block">`;

  for (let i = 0; i < units.length; i++) {
    html += donutSegment(
      offsets[i] / total,
      (offsets[i] + units[i]) / total,
      r,
      r0,
      colors[i]
    );
  }
  html += `<circle cx="${r}" cy="${r}" r="${r0}" fill="white" />
    <text dominant-baseline="central" transform="translate(${r}, ${r})">
      ${avg_unit_cost.toLocaleString()}
    </text>
    </svg>
    </div>`;

  const el = document.createElement('div');
  el.innerHTML = html;
  return el.firstChild;
}

export function createStationTypeDonutChart(props: any, types: string[]): Node {
  const offsets = [];
  // Calculate counts for each type
  const counts = types.map(type => {
    const count = props[`${type}_count`];
    return typeof count === 'number' ? count : 0;
  });

  // Defensive: log props and counts

  let total = 0;
  for (const count of counts) {
    offsets.push(total);
    total += count;
  }

  // If no stations found, show a fallback
  if (!total || isNaN(total)) {
    const el = document.createElement('div');
    el.textContent = '0';
    return el;
  }


  const fontSize = total >= 1000 ? 22 : total >= 100 ? 20 : total >= 10 ? 18 : 16;
  const r = total >= 50 ? 50 : total >= 20 ? 44 : total >= 10 ? 38 : 32;
  const r0 = Math.round(r * 0.6);
  const w = r * 2;

  let html = `<div>
    <svg width="${w}" height="${w}" viewbox="0 0 ${w} ${w}" text-anchor="middle" style="font: ${fontSize}px sans-serif; display: block">`;

  // Draw segments for each type
  for (let i = 0; i < types.length; i++) {
    if (counts[i] > 0) {
      html += donutSegment(
        offsets[i] / total,
        (offsets[i] + counts[i]) / total,
        r,
        r0,
        CHART_COLORS[i]
      );
    }
  }

  html += `<circle cx="${r}" cy="${r}" r="${r0}" fill="white" />
    <text dominant-baseline="central" transform="translate(${r}, ${r})">
      ${total}
    </text>
    </svg>
    </div>`;

  const el = document.createElement('div');
  el.innerHTML = html;
  const node = el.firstChild;
  if (!node) {
    const fallback = document.createElement('div');
    fallback.textContent = total.toString();
    return fallback;
  }
  return node;
}

export function createPaymentTypeDonutChart(props: any): Node {
  const offsets = [];
  const types = ['prepaid', 'postpaid', 'submeter'] as const;
  type PaymentType = typeof types[number];

  const paymentColors: Record<PaymentType, string> = {
    'prepaid': '#10b981',  // Emerald
    'postpaid': '#6366f1', // Indigo  
    'submeter': '#ec4899', // Pink
  };

  // Calculate counts for each type
  const counts = types.map(type => {
    const count = props[`${type}_count`];
    return typeof count === 'number' ? count : 0;
  });

  let total = 0;
  for (const count of counts) {
    offsets.push(total);
    total += count;
  }

  // If no connections found, show a fallback
  if (total === 0) {
    const el = document.createElement('div');
    el.textContent = '0';
    return el;
  }

  const fontSize = total >= 1000 ? 22 : total >= 100 ? 20 : total >= 10 ? 18 : 16;
  const r = total >= 50 ? 50 : total >= 20 ? 44 : total >= 10 ? 38 : 32;
  const r0 = Math.round(r * 0.6);
  const w = r * 2;

  let html = `<div>
    <svg width="${w}" height="${w}" viewbox="0 0 ${w} ${w}" text-anchor="middle" style="font: ${fontSize}px sans-serif; display: block">`;

  // Draw segments for each type
  for (let i = 0; i < types.length; i++) {
    if (counts[i] > 0) {
      html += donutSegment(
        offsets[i] / total,
        (offsets[i] + counts[i]) / total,
        r,
        r0,
        paymentColors[types[i]]
      );
    }
  }

  html += `<circle cx="${r}" cy="${r}" r="${r0}" fill="white"/>
    <text dominant-baseline="central" transform="translate(${r}, ${r})">${total}</text>
    </svg>
    </div>`;

  const el = document.createElement('div');
  el.innerHTML = html;
  return el.firstChild as Node;
}

export function createConnectionTypeDonutChart(props: any): Node {
  const offsets = [];
  const types = ['ev', 'nonev'] as const;
  type ConnectionType = typeof types[number];

  const connectionColors: Record<ConnectionType, string> = {
    'ev': '#22c55e',    // Green
    'nonev': '#3b82f6'  // Blue
  };

  // Calculate counts for each type
  const counts = types.map(type => {
    const count = props[`${type}_count`];
    return typeof count === 'number' ? count : 0;
  });

  let total = 0;
  for (const count of counts) {
    offsets.push(total);
    total += count;
  }

  // If no connections found, show a fallback
  if (total === 0) {
    const el = document.createElement('div');
    el.textContent = '0';
    return el;
  }

  const fontSize = total >= 1000 ? 22 : total >= 100 ? 20 : total >= 10 ? 18 : 16;
  const r = total >= 50 ? 50 : total >= 20 ? 44 : total >= 10 ? 38 : 32;
  const r0 = Math.round(r * 0.6);
  const w = r * 2;

  let html = `<div>
    <svg width="${w}" height="${w}" viewbox="0 0 ${w} ${w}" text-anchor="middle" style="font: ${fontSize}px sans-serif; display: block">`;

  // Draw segments for each type
  for (let i = 0; i < types.length; i++) {
    if (counts[i] > 0) {
      html += donutSegment(
        offsets[i] / total,
        (offsets[i] + counts[i]) / total,
        r,
        r0,
        connectionColors[types[i]]
      );
    }
  }

  html += `<circle cx="${r}" cy="${r}" r="${r0}" fill="white"/>
    <text dominant-baseline="central" transform="translate(${r}, ${r})">${total}</text>
    </svg>
    </div>`;

  const el = document.createElement('div');
  el.innerHTML = html;
  return el.firstChild as Node;
}

function donutSegment(
  start: number,
  end: number,
  r: number,
  r0: number,
  color: string
) {
  if (end - start === 1) end -= 0.00001;
  const a0 = 2 * Math.PI * (start - 0.25);
  const a1 = 2 * Math.PI * (end - 0.25);
  const x0 = Math.cos(a0),
    y0 = Math.sin(a0);
  const x1 = Math.cos(a1),
    y1 = Math.sin(a1);
  const largeArc = end - start > 0.5 ? 1 : 0;

  // draw an SVG path
  return `<path d="M ${r + r0 * x0} ${r + r0 * y0} L ${r + r * x0} ${r + r * y0
    } A ${r} ${r} 0 ${largeArc} 1 ${r + r * x1} ${r + r * y1} L ${r + r0 * x1} ${r + r0 * y1
    } A ${r0} ${r0} 0 ${largeArc} 0 ${r + r0 * x0} ${r + r0 * y0
    }" fill="${color}" />`;
}

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

export function updateMarkers(
  map: mapboxgl.Map,
  markers: { [key: string]: mapboxgl.Marker },
  markersOnScreen: { [key: string]: mapboxgl.Marker },
  createDonutChart: (props: any) => Node,
  dataSource: string
) {
  const newMarkers: { [key: string]: mapboxgl.Marker } = {};
  const features = map.querySourceFeatures(dataSource);

  for (const feature of features) {
    const coords = (feature.geometry as GeoJSON.Point).coordinates as [
      number,
      number
    ];
    const props = feature.properties;
    if (!props?.cluster) continue;
    const id = props.cluster_id;

    let marker = markers[id];
    if (!marker) {
      const el = createDonutChart(props);
      el?.addEventListener('click', () =>
        onMarkerClick(id, coords, props, map, dataSource)
      );

      marker = markers[id] = new mapboxgl.Marker({
        element: el as HTMLElement
      }).setLngLat(coords as [number, number]);
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
function getClusterExpansionZoom(
  clusterId: number,
  arg1: (err: any, zoom: any) => void
) {
  throw new Error('Function not implemented.');
}
