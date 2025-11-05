'use client'

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'

interface MapProps {
    latitude: number
    longitude: number
}

export default function Map({ latitude, longitude }: MapProps) {
    const mapContainer = useRef<HTMLDivElement>(null)
    const map = useRef<mapboxgl.Map | null>(null)

    useEffect(() => {
        if (!mapContainer.current) return

        mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ''

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: process.env.NEXT_PUBLIC_MAPBOX_STYLE_ID,
            center: [longitude, latitude],
            zoom: 15
        })

        // Add marker
        new mapboxgl.Marker()
            .setLngLat([longitude, latitude])
            .addTo(map.current)

        // Cleanup
        return () => {
            map.current?.remove()
        }
    }, [latitude, longitude])

    return <div ref={mapContainer} className="h-full w-full" />
} 