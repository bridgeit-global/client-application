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

export const SiteForm: React.FC<{ handleClose?: () => void }> = ({ handleClose }) => {
    const site_name = useSiteName();
    const supabase = createClient();
    const router = useRouter();
    const { user, setUser } = useUserStore();
    const { toast } = useToast();
    const { handleDatabaseError, clearError } = useSupabaseError();
    const [loading, setLoading] = useState(false);
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const marker = useRef<mapboxgl.Marker | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [siteIdExists, setSiteIdExists] = useState(false);
    const SITE_TYPES = useSiteType();

    const form = useForm<SiteFormValues>({
        defaultValues: {
            id: '',
            name: '',
            latitude: 0,
            longitude: 0,
            zone_id: '',
            type: ''
        },
        mode: 'onChange'
    });

    const { control, handleSubmit, reset, setValue, formState, getValues, trigger } = form;

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
            // Handle search error silently
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

    // Initialize user if not in store
    useEffect(() => {
        const initializeUser = async () => {
            // If user is not in store or is empty object, fetch from Supabase
            if (!user || !user.id || Object.keys(user).length === 0) {
                console.log('🟢 [INIT] User not in store, fetching from Supabase...');
                const { data: { user: supabaseUser }, error: userError } = await supabase.auth.getUser();
                
                if (!userError && supabaseUser) {
                    console.log('🟢 [INIT] User fetched and set in store:', supabaseUser.id);
                    setUser(supabaseUser);
                } else if (userError) {
                    console.log('🔴 [INIT] Error fetching user:', userError);
                }
            } else {
                console.log('🟢 [INIT] User already in store:', user.id);
            }
        };
        initializeUser();
    }, [setUser]); // Only run once on mount

    // Initialize map
    useEffect(() => {
        if (!mapContainer.current) return;

        mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

        // Get initial coordinates from form values
        const initialLat = form.getValues('latitude')
        const initialLng = form.getValues('longitude')

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: process.env.NEXT_PUBLIC_MAPBOX_STYLE_ID,
            center: [initialLng, initialLat], // Use initial coordinates
            zoom: 9
        });

        marker.current = new mapboxgl.Marker({
            draggable: true
        })
            .setLngLat([initialLng, initialLat]) // Use initial coordinates
            .addTo(map.current);

        // Update form values when marker is dragged
        marker.current.on('dragend', () => {
            const lngLat = marker.current?.getLngLat();
            if (lngLat) {
                setValue('latitude', Number(lngLat.lat.toFixed(6)));
                setValue('longitude', Number(lngLat.lng.toFixed(6)));
            }
        });

        // Click on map to move marker
        map.current.on('click', (e) => {
            marker.current?.setLngLat(e.lngLat);
            setValue('latitude', Number(e.lngLat.lat.toFixed(6)));
            setValue('longitude', Number(e.lngLat.lng.toFixed(6)));
        });

        return () => {
            map.current?.remove();
        };
    }, [setValue, form]);

    const onSubmit = async (siteData: SiteFormValues) => {
        console.log('🔵 [SUBMIT] onSubmit called with data:', siteData);
        console.log('🔵 [SUBMIT] Form state:', formState);
        console.log('🔵 [SUBMIT] Loading:', loading, 'SiteIdExists:', siteIdExists);
        try {
            console.log('🔵 [SUBMIT] Step 1: Setting loading to true');
            setLoading(true);
            clearError(); // Clear any previous errors

            console.log('🔵 [SUBMIT] Step 2: Checking user', { user: user?.id, hasUser: !!user, userObject: user });
            
            // If user is not in store, try to fetch it from Supabase
            let currentUser = user;
            if (!currentUser || !currentUser.id || Object.keys(currentUser).length === 0) {
                console.log('🔵 [SUBMIT] User not in store, fetching from Supabase...');
                const { data: { user: supabaseUser }, error: userError } = await supabase.auth.getUser();
                
                if (userError) {
                    console.log('🔴 [SUBMIT] Error fetching user:', userError);
                    toast({
                        title: 'Error',
                        variant: 'destructive',
                        description: 'Failed to get user information. Please try again.'
                    });
                    setLoading(false);
                    return;
                }
                
                if (supabaseUser) {
                    console.log('🔵 [SUBMIT] User fetched from Supabase:', supabaseUser.id);
                    currentUser = supabaseUser;
                    // Optionally update the store
                    // setUser(supabaseUser);
                } else {
                    console.log('🔴 [SUBMIT] No user found in Supabase');
                    toast({
                        title: 'Error',
                        variant: 'destructive',
                        description: 'You must be logged in to create a site. Please log in and try again.'
                    });
                    setLoading(false);
                    return;
                }
            }
            
            if (!currentUser || !currentUser.id) {
                console.log('🔴 [SUBMIT] Early return: No user or user.id after fetch attempt');
                toast({
                    title: 'Error',
                    variant: 'destructive',
                    description: 'User information is missing. Please refresh the page and try again.'
                });
                setLoading(false);
                return;
            }

            // Validate that site ID is provided for new sites
            console.log('🔵 [SUBMIT] Step 3: Validating site ID', { id: siteData.id, trimmed: siteData.id?.trim() });
            if (!siteData.id || siteData.id.trim() === '') {
                console.log('🔴 [SUBMIT] Early return: Site ID is empty');
                toast({
                    title: 'Error',
                    variant: 'destructive',
                    description: `${site_name} ID is required`
                });
                setLoading(false);
                return;
            }

            // Validate that coordinates are not the default (0,0)
            console.log('🔵 [SUBMIT] Step 4: Validating coordinates', { lat: siteData.latitude, lng: siteData.longitude });
            if (siteData.latitude === 0 && siteData.longitude === 0) {
                console.log('🔴 [SUBMIT] Early return: Invalid coordinates (0,0)');
                toast({
                    title: 'Error',
                    variant: 'destructive',
                    description: 'Please select a valid location. Default coordinates (0,0) are not allowed.'
                });
                setLoading(false);
                return;
            }

            // Prevent submission if site ID already exists
            console.log('🔵 [SUBMIT] Step 5: Checking if site ID exists', { siteIdExists });
            if (siteIdExists) {
                console.log('🔴 [SUBMIT] Early return: Site ID already exists');
                toast({
                    title: 'Error',
                    variant: 'destructive',
                    description: `${site_name} ID already exists. Please choose a different ID.`
                });
                setLoading(false);
                return;
            }
            console.log('🔵 [SUBMIT] Step 6: Preparing insert data', {
                id: siteData.id,
                name: siteData.name,
                org_id: currentUser.user_metadata?.org_id,
                created_by: currentUser.id,
                latitude: siteData.latitude,
                longitude: siteData.longitude,
                zone_id: siteData.zone_id,
                type: siteData.type
            });

            console.log('🔵 [SUBMIT] Step 7: Calling supabase insert');
            const { data: insertData, error: siteError } = await supabase
                .from('sites')
                .insert([
                    {
                        id: siteData.id,
                        name: siteData.name,
                        org_id: currentUser.user_metadata?.org_id,
                        created_by: currentUser.id,
                        latitude: siteData.latitude,
                        longitude: siteData.longitude,
                        zone_id: siteData.zone_id,
                        type: siteData.type
                    }
                ])
                .select();

            console.log('🔵 [SUBMIT] Step 8: Insert response', { insertData, siteError });

            if (siteError) {
                console.log('🔴 [SUBMIT] Database error:', siteError);
                const errorMessage = handleDatabaseError(siteError);
                toast({
                    title: 'Error',
                    variant: 'destructive',
                    description: errorMessage
                });
                setLoading(false);
                return;
            }

            // Verify the insert was successful
            console.log('🔵 [SUBMIT] Step 9: Verifying insert data', { insertData, length: insertData?.length });
            if (!insertData || insertData.length === 0) {
                console.log('🔴 [SUBMIT] No data inserted');
                toast({
                    title: 'Error',
                    variant: 'destructive',
                    description: `Failed to create ${site_name}. No data was inserted.`
                });
                setLoading(false);
                return;
            }

            console.log('🔵 [SUBMIT] Step 10: Success! Resetting form and navigating');
            reset();
            router.push(`/portal/site/sites?page=1&limit=10&site_id=${siteData.id}&status=0`);
            toast({
                title: 'Success',
                description: `${site_name} created successfully`
            });
        } catch (error) {
            console.log('🔴 [SUBMIT] Exception caught:', error);
            console.error('🔴 [SUBMIT] Error details:', error);
            toast({
                title: 'Error',
                variant: 'destructive',
                description: `Failed to create ${site_name}`
            });
        } finally {
            console.log('🔵 [SUBMIT] Finally: Setting loading to false');
            setLoading(false);
        }
    };

    // Modified checkSiteId function with better error handling and logging
    const checkSiteId = async (siteId: string) => {
        if (!siteId) return;
        try {
            const { data, error } = await supabase
                .from('sites')
                .select('id')
                .eq('id', siteId);

            if (error) {
                // Handle error silently
                return;
            }

            const exists = data && data.length > 0;
            setSiteIdExists(exists);

            if (exists) {
                toast({
                    variant: "destructive",
                    title: `${site_name} ID already exists`,
                    description: `Please enter a different ${site_name} ID`
                })

            }

        } catch (error) {
            // Handle error silently
        }
    };

    // Debug logging
    useEffect(() => {
        console.log('🟢 [STATE] Loading:', loading, 'SiteIdExists:', siteIdExists);
        console.log('🟢 [STATE] Form values:', getValues());
        console.log('🟢 [STATE] Form errors:', formState.errors);
        console.log('🟢 [STATE] Form isValid:', formState.isValid);
        console.log('🟢 [STATE] Button disabled:', loading || siteIdExists);
        
        // Check for elements that might be blocking the button
        setTimeout(() => {
            const submitButton = document.querySelector('button[type="submit"]');
            if (submitButton) {
                const rect = submitButton.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                const elementAtPoint = document.elementFromPoint(centerX, centerY);
                console.log('🟢 [STATE] Element at button center:', elementAtPoint);
                console.log('🟢 [STATE] Button rect:', rect);
                console.log('🟢 [STATE] Button computed style:', window.getComputedStyle(submitButton));
                console.log('🟢 [STATE] Button pointer-events:', window.getComputedStyle(submitButton).pointerEvents);
            }
        }, 100);
    }, [loading, siteIdExists, formState.errors, formState.isValid, getValues]);

    const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        console.log('🟡 [BUTTON CLICK] Submit button clicked');
        console.log('🟡 [BUTTON CLICK] Event:', e);
        console.log('🟡 [BUTTON CLICK] Button disabled:', loading || siteIdExists);
        console.log('🟡 [BUTTON CLICK] Current form values:', getValues());
        console.log('🟡 [BUTTON CLICK] Form errors:', formState.errors);
        
        // Check if button is actually disabled
        const button = e.currentTarget;
        console.log('🟡 [BUTTON CLICK] Button element:', button);
        console.log('🟡 [BUTTON CLICK] Button disabled attribute:', button.disabled);
        console.log('🟡 [BUTTON CLICK] Button computed style:', window.getComputedStyle(button));
        
        // Try to trigger validation
        trigger().then((isValid) => {
            console.log('🟡 [BUTTON CLICK] Form validation result:', isValid);
        });
    };

    const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        console.log('🟠 [FORM SUBMIT] Form submit event triggered');
        console.log('🟠 [FORM SUBMIT] Event:', e);
        console.log('🟠 [FORM SUBMIT] Form values:', getValues());
        console.log('🟠 [FORM SUBMIT] Form errors:', formState.errors);
        console.log('🟠 [FORM SUBMIT] Form isValid:', formState.isValid);
        
        // Let handleSubmit handle it, but log first
        const isValid = formState.isValid;
        if (!isValid) {
            console.log('🔴 [FORM SUBMIT] Form is not valid, errors:', formState.errors);
        }
    };

    return (
        <div className="space-y-10">
            <Card>
                <CardHeader>
                    <CardTitle>Add New {site_name}</CardTitle>
                    <CardDescription>Create a new {site_name} by filling in the details below.</CardDescription>
                </CardHeader>
                <Form {...form}>
                    <form
                        onSubmit={(e) => {
                            console.log('🟣 [FORM] onSubmit handler called');
                            handleFormSubmit(e);
                            handleSubmit(
                                onSubmit,
                                (errors) => {
                                    console.log('🔴 [FORM VALIDATION] Validation failed with errors:', errors);
                                    console.log('🔴 [FORM VALIDATION] Form values at validation failure:', getValues());
                                }
                            )(e);
                        }}
                        className="w-full space-y-8"
                    >
                        <CardContent className="p-6">
                            <div className={'w-full md:inline-block'}>
                                <FormField
                                    control={control}
                                    name="id"
                                    rules={{
                                        required: `${site_name} ID is mandatory`
                                    }}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{site_name} ID</FormLabel>
                                            <FormControl>
                                                <Input
                                                    className="border"
                                                    placeholder={`Enter ${site_name} ID`}
                                                    {...field}
                                                    onChange={(e) => {
                                                        const sanitized = sanitizeInput(e.target.value, false);
                                                        field.onChange(sanitized);
                                                        setSiteIdExists(false); // Reset existence check on change
                                                    }}
                                                    onBlur={(e) => {
                                                        field.onBlur();
                                                        checkSiteId(e.target.value);
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={control}
                                    disabled={siteIdExists}
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
                                    disabled={siteIdExists}
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
                                <FormField
                                    control={control}
                                    disabled={siteIdExists}
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
                                                        <SelectValue placeholder={`Select ${site_name} type`} />
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

                                {/* Add these form fields before the search input */}
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <FormField
                                        control={control}
                                        disabled={siteIdExists}
                                        name="latitude"
                                        rules={{
                                            required: 'Latitude is required',
                                            min: { value: -90, message: 'Minimum latitude is -90' },
                                            max: { value: 90, message: 'Maximum latitude is 90' },
                                            validate: (value) => {
                                                const lng = form.getValues('longitude');
                                                if (value === 0 && lng === 0) {
                                                    return 'Please select a valid location. Default coordinates (0,0) are not allowed.';
                                                }
                                                return true;
                                            }
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
                                        disabled={siteIdExists}
                                        name="longitude"
                                        rules={{
                                            required: 'Longitude is required',
                                            min: { value: -180, message: 'Minimum longitude is -180' },
                                            max: { value: 180, message: 'Maximum longitude is 180' },
                                            validate: (value) => {
                                                const lat = form.getValues('latitude');
                                                if (lat === 0 && value === 0) {
                                                    return 'Please select a valid location. Default coordinates (0,0) are not allowed.';
                                                }
                                                return true;
                                            }
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

                                {/* Add this before the map container */}
                                <div className="relative mb-4">
                                    <div className="relative">
                                        <Input
                                            disabled={siteIdExists}
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

                                {/* Map Container */}
                                <div className="mb-6">
                                    <FormLabel>Location</FormLabel>
                                    <div
                                        ref={mapContainer}
                                        className="w-full h-[400px] rounded-md border"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button 
                                    type="submit" 
                                    disabled={loading || siteIdExists}
                                    onClick={handleButtonClick}
                                    onMouseDown={(e) => {
                                        console.log('🟤 [BUTTON] Mouse down event');
                                    }}
                                    onMouseUp={(e) => {
                                        console.log('🟤 [BUTTON] Mouse up event');
                                    }}
                                >
                                    {loading ? "Saving..." : "Submit"}
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
        </div >
    );
};
