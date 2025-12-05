'use client';
import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { createClient } from '@/lib/supabase/client';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Search } from 'lucide-react';
import { useSupabaseError } from '@/hooks/use-supabase-error';

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useUserStore } from '@/lib/store/user-store';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSiteName } from '@/lib/utils/site';
import { useSiteType } from '@/hooks/use-site-type';
import { sanitizeInput } from '@/lib/utils/string-format';
type SearchResult = {
    place_name: string;
    center: [number, number];
};

export type SiteFormValues = {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    zone_id: string;
    type: string;
};

interface EditSiteFormProps {
    initialData: SiteFormValues;
    handleClose?: () => void;
}

export const EditSiteForm: React.FC<EditSiteFormProps> = ({ initialData, handleClose }) => {
    const site_name = useSiteName();
    const supabase = createClient();
    const router = useRouter();
    const { user } = useUserStore();
    const { toast } = useToast();
    const { handleDatabaseError, clearError } = useSupabaseError();
    const [loading, setLoading] = useState(false);
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const marker = useRef<mapboxgl.Marker | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [showResults, setShowResults] = useState(false);
    const SITE_TYPES = useSiteType();
    const form = useForm<SiteFormValues>({
        defaultValues: {
            id: initialData.id,
            name: initialData.name,
            latitude: initialData.latitude,
            longitude: initialData.longitude,
            zone_id: initialData.zone_id,
            type: initialData.type || ''
        },
        mode: 'onChange'
    });

    const { control, handleSubmit, reset, setValue } = form;

    const handleSearch = async (query: string) => {
        if (!query) {
            setSearchResults([]);
            return;
        }

        const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            query
        )}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}&limit=5`;

        try {
            const response = await fetch(endpoint);
            const data = await response.json();
            setSearchResults(data.features);
            setShowResults(true);
        } catch (error) {
            console.error('Search error:', error);
        }
    };

    const handleLocationSelect = (result: SearchResult) => {
        if (map.current && marker.current) {
            map.current.flyTo({
                center: result.center,
                zoom: 14
            });
            marker.current.setLngLat(result.center);
            setValue('latitude', Number(result.center[1].toFixed(6)));
            setValue('longitude', Number(result.center[0].toFixed(6)));
        }
        setSearchQuery(result.place_name);
        setShowResults(false);
    };

    // Initialize map
    useEffect(() => {
        if (!mapContainer.current) return;

        mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: process.env.NEXT_PUBLIC_MAPBOX_STYLE_ID,
            center: [initialData.longitude, initialData.latitude],
            zoom: 14
        });

        marker.current = new mapboxgl.Marker({
            draggable: true
        })
            .setLngLat([initialData.longitude, initialData.latitude])
            .addTo(map.current);

        marker.current.on('dragend', () => {
            const lngLat = marker.current?.getLngLat();
            if (lngLat) {
                setValue('latitude', Number(lngLat.lat.toFixed(6)));
                setValue('longitude', Number(lngLat.lng.toFixed(6)));
            }
        });

        map.current.on('click', (e) => {
            marker.current?.setLngLat(e.lngLat);
            setValue('latitude', Number(e.lngLat.lat.toFixed(6)));
            setValue('longitude', Number(e.lngLat.lng.toFixed(6)));
        });

        return () => {
            map.current?.remove();
        };
    }, [setValue, initialData]);

    const onSubmit = async (siteData: SiteFormValues) => {
        try {
            setLoading(true);
            clearError(); // Clear any previous errors

            if (!user || !user.id) return;

            const { error: siteError } = await supabase
                .from('sites')
                .update({
                    name: siteData.name,
                    latitude: siteData.latitude,
                    longitude: siteData.longitude,
                    zone_id: siteData.zone_id,
                    type: siteData.type,
                    updated_at: new Date().toISOString()
                })
                .eq('id', siteData.id);

            if (siteError) {
                const errorMessage = handleDatabaseError(siteError);
                toast({
                    title: 'Error',
                    variant: 'destructive',
                    description: errorMessage
                });
                return;
            }

            handleClose?.();
            router.refresh();
            toast({
                title: 'Success',
                description: `${site_name} updated successfully`
            });
        } catch (error) {
            console.error(error);
            toast({
                title: 'Error',
                variant: 'destructive',
                description: `Failed to update ${site_name}`
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-10">
            <Card>
                <CardHeader>
                    <CardTitle>Edit {site_name}</CardTitle>
                    <CardDescription>Update the {site_name} details below.</CardDescription>
                </CardHeader>
                <Form {...form}>
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="w-full space-y-8"
                    >
                        <CardContent className="p-6">
                            <div className={'w-full md:inline-block'}>
                                <FormField
                                    control={control}
                                    name="id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{site_name} ID</FormLabel>
                                            <FormControl>
                                                <Input
                                                    className="border"
                                                    disabled
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={control}
                                    name="name"
                                    rules={{
                                        required: `${site_name} Name is mandatory`
                                    }}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{site_name} Name</FormLabel>
                                            <FormControl>
                                                <Input
                                                    disabled={loading}
                                                    placeholder={`Enter ${site_name} Name`}
                                                    {...field}
                                                    onChange={(e) => {
                                                        const sanitized = sanitizeInput(e.target.value, true);
                                                        field.onChange(sanitized);
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={control}
                                    name="type"
                                    rules={{
                                        required: `${site_name} Type is required`
                                    }}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{site_name} Type</FormLabel>
                                            <Select
                                                disabled={loading}
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {SITE_TYPES.map((type) => (
                                                        <SelectItem key={type.value} value={type.value}>
                                                            {type.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={control}
                                    name="zone_id"
                                    rules={{
                                        required: 'Zone ID is required'
                                    }}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Zone ID</FormLabel>
                                            <FormControl>
                                                <Input
                                                    disabled={loading}
                                                    placeholder="Enter Zone ID"
                                                    {...field}
                                                    onChange={(e) => {
                                                        const sanitized = sanitizeInput(e.target.value, false);
                                                        field.onChange(sanitized);
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <FormField
                                        control={control}
                                        name="latitude"
                                        rules={{
                                            required: 'Latitude is required',
                                            min: { value: -90, message: 'Minimum latitude is -90' },
                                            max: { value: 90, message: 'Maximum latitude is 90' }
                                        }}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Latitude</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        step="0.000001"
                                                        disabled={loading}
                                                        placeholder="Enter latitude"
                                                        {...field}
                                                        onChange={(e) => {
                                                            field.onChange(Number(e.target.value));
                                                            if (map.current && marker.current) {
                                                                const lng = marker.current.getLngLat().lng;
                                                                marker.current.setLngLat([lng, Number(e.target.value)]);
                                                                map.current.flyTo({ center: [lng, Number(e.target.value)] });
                                                            }
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={control}
                                        name="longitude"
                                        rules={{
                                            required: 'Longitude is required',
                                            min: { value: -180, message: 'Minimum longitude is -180' },
                                            max: { value: 180, message: 'Maximum longitude is 180' }
                                        }}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Longitude</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        step="0.000001"
                                                        disabled={loading}
                                                        placeholder="Enter longitude"
                                                        {...field}
                                                        onChange={(e) => {
                                                            field.onChange(Number(e.target.value));
                                                            if (map.current && marker.current) {
                                                                const lat = marker.current.getLngLat().lat;
                                                                marker.current.setLngLat([Number(e.target.value), lat]);
                                                                map.current.flyTo({ center: [Number(e.target.value), lat] });
                                                            }
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="relative mb-4">
                                    <div className="relative">
                                        <Input
                                            type="text"
                                            placeholder="Search for a location..."
                                            value={searchQuery}
                                            onChange={(e) => {
                                                const sanitized = sanitizeInput(e.target.value, true);
                                                setSearchQuery(sanitized);
                                                handleSearch(sanitized);
                                            }}
                                            className="pl-10"
                                        />
                                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    </div>
                                    {showResults && searchResults.length > 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                                            {searchResults.map((result, index) => (
                                                <div
                                                    key={index}
                                                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                                    onClick={() => handleLocationSelect(result)}
                                                >
                                                    {result.place_name}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="mb-6">
                                    <FormLabel>Location</FormLabel>
                                    <div
                                        ref={mapContainer}
                                        className="w-full h-[200px] rounded-md border"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" disabled={loading}>
                                    {loading ? "Saving..." : `Update ${site_name}`}
                                </Button>
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => router.push('/portal/site/sites')}
                                    disabled={loading}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </CardContent>
                    </form>
                </Form>
            </Card>
        </div>
    );
}; 