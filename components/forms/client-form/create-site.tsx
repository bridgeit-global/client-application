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
import { Card, CardContent } from '@/components/ui/card';
import type { SiteFormValues } from '@/types';
import { useUserStore } from '@/lib/store/user-store';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSiteName } from '@/lib/utils/site';
import { useSiteType } from '@/hooks/use-site-type';
type SearchResult = {
  place_name: string;
  center: [number, number];
};

export const CreateSiteOne: React.FC<{ initialData: SiteFormValues | null, handleClose?: () => void }> = ({ initialData, handleClose }) => {
  const SITE_TYPES = useSiteType();
  const site_name = useSiteName();
  const supabase = createClient();
  const router = useRouter();
  const { user } = useUserStore();
  const { toast } = useToast();
  const { handleDatabaseError, clearError } = useSupabaseError();
  const [loading, setLoading] = useState(false);
  const toastMessage = initialData
    ? `${site_name} updated.`
    : 'Request created.';
  const toastDescription = initialData
    ? `Successfully Updated ${site_name}.`
    : `Successfully Created ${site_name}.`;

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [siteIdExists, setSiteIdExists] = useState(false);


  const form = useForm<SiteFormValues>({
    defaultValues: initialData || {
      siteId: '',
      name: '',
      latitude: 0,
      longitude: 0,
      zone_id: '',
      type: ''
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
  }, [setValue]);

  const onSubmit = async (siteData: SiteFormValues) => {
    try {
      setLoading(true);
      clearError(); // Clear any previous errors

      if (!user || !user.id) return;

      if (initialData) {
        const { error: siteError } = await supabase
          .from('sites')
          .update({
            name: siteData.name,
            latitude: siteData.latitude,
            longitude: siteData.longitude,
            zone_id: siteData.zone_id,
            type: siteData.type,
            updated_at: new Date().toISOString(),
          })
          .eq('id', siteData.siteId);

        if (siteError) {
          const errorMessage = handleDatabaseError(siteError);
          toast({
            title: 'Error',
            variant: 'destructive',
            description: errorMessage
          });
          return;
        }
      } else {
        const { error: siteError } = await supabase
          .from('sites')
          .insert([
            {
              id: siteData.siteId,
              name: siteData.name,
              org_id: user.user_metadata.org_id,
              created_by: user.id,
              latitude: siteData.latitude,
              longitude: siteData.longitude,
              zone_id: siteData.zone_id,
              type: siteData.type
            }
          ]);

        if (siteError) {
          const errorMessage = handleDatabaseError(siteError);
          toast({
            title: 'Error',
            variant: 'destructive',
            description: errorMessage
          });
          return;
        }
      }

      reset();
      handleClose?.();
      router.refresh();
      toast({
        title: toastMessage,
        description: toastDescription
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Modified checkSiteId function with better error handling and logging
  const checkSiteId = async (siteId: string) => {
    if (!siteId || initialData) return;

    try {
      const { data, error } = await supabase
        .from('sites')
        .select('id')
        .eq('id', siteId);

      if (error) {
        console.error(`Error checking ${site_name} ID:`, error);
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
      console.error(`Error checking ${site_name} ID:`, error);
    }
  };

  return (
    <div className="space-y-10">
      <Card>
        <Form {...form}>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="w-full space-y-8"
          >
            <CardContent className="p-6 overflow-auto max-h-[80vh]">
              <div className={'w-full md:inline-block'}>
                <FormField
                  control={control}
                  name="siteId"
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
                            field.onChange(e);
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
                        />
                      </FormControl>
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
                            value={field.value === 0 || field.value === undefined ? '' : field.value}
                            onChange={(e) => {
                              // Allow empty string for controlled input
                              const val = e.target.value;
                              if (val === '') {
                                field.onChange(undefined);
                              } else {
                                field.onChange(Number(val));
                                if (map.current && marker.current) {
                                  const lng = marker.current.getLngLat().lng;
                                  marker.current.setLngLat([lng, Number(val)]);
                                  map.current.flyTo({ center: [lng, Number(val)] });
                                }
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
                            value={field.value === 0 || field.value === undefined ? '' : field.value}
                            onChange={(e) => {
                              // Allow empty string for controlled input
                              const val = e.target.value;
                              if (val === '') {
                                field.onChange(undefined);
                              } else {
                                field.onChange(Number(val));
                                if (map.current && marker.current) {
                                  const lat = marker.current.getLngLat().lat;
                                  marker.current.setLngLat([Number(val), lat]);
                                  map.current.flyTo({ center: [Number(val), lat] });
                                }
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
                        setSearchQuery(e.target.value);
                        handleSearch(e.target.value);
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
                    className="w-full h-[200px] rounded-md border"
                  />
                </div>
              </div>
              <Button type="submit" disabled={loading || siteIdExists}>
                {loading ? "Saving..." : "Submit"}
              </Button>
            </CardContent>
          </form>
        </Form>
      </Card>
    </div >
  );
};
