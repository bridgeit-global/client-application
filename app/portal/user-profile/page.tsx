'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUserStore } from '@/lib/store/user-store';
import { useToast } from '@/components/ui/use-toast';
import { useSupabaseError } from '@/hooks/use-supabase-error';
import { updateUserMetadata } from '@/lib/utils/update-user-metadata';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, Settings2, MapPin, Zap, Building2, X, ChevronsUpDown, Check } from 'lucide-react';
import { gsap } from 'gsap';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { formatRupees } from '@/lib/utils/number-format';
import { useSiteType } from '@/hooks/use-site-type';
import { useSiteName } from '@/lib/utils/site';

export default function UserProfilePage() {
    const SITE_TYPES = useSiteType();
    const site_name = useSiteName();
    const { user, setUser } = useUserStore();
    const { handleDatabaseError, clearError } = useSupabaseError();
    const [isEditing, setIsEditing] = useState({
        personal: false,
        contact: false,
        station: false
    });
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        site_type: '',
    });
    const [open, setOpen] = useState(false);
    const supabase = createClient();
    const { toast } = useToast();
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                clearError(); // Clear any previous errors

                const { data: { user: supabaseUser }, error } = await supabase.auth.getUser();
                console.log('supabaseUser',supabaseUser)

                if (error) {
                    // Handle AuthError separately
                    toast({
                        title: 'Error',
                        description: error.message,
                        variant: 'destructive'
                    });
                    return;
                }

                if (supabaseUser) {
                    setUser(supabaseUser);
                    setFormData({
                        first_name: supabaseUser.user_metadata?.first_name || '',
                        last_name: supabaseUser.user_metadata?.last_name || '',
                        email: supabaseUser.email || '',
                        phone: supabaseUser.phone || '',
                        site_type: (supabaseUser.user_metadata?.site_type ?? supabaseUser.user_metadata?.station_type) || '',
                    });
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to fetch user data',
                    variant: 'destructive'
                });
            }
        };

        fetchUserData();
    }, [setUser, toast, clearError, handleDatabaseError]);

    useEffect(() => {
        if (cardRef.current) {
            const ctx = gsap.context(() => {
                // Main card entrance
                gsap.from(cardRef.current, {
                    opacity: 0,
                    y: 20,
                    duration: 0.8,
                    ease: "power3.out"
                });

                // Staggered content sections
                gsap.from(".profile-section", {
                    opacity: 0,
                    y: 20,
                    duration: 0.6,
                    stagger: 0.2,
                    delay: 0.3,
                    ease: "power2.out"
                });

                // Avatar animation
                gsap.from(".profile-avatar", {
                    scale: 0.8,
                    opacity: 0,
                    duration: 0.8,
                    delay: 0.5,
                    ease: "back.out(1.7)"
                });
            }, cardRef);

            return () => ctx.revert();
        }
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? Number(value) : value
        }));
    };

    const handleSiteTypeChange = (value: string) => {
        setFormData(prev => {
            const currentTypes: string[] = prev.site_type ? prev.site_type.split(',') : [];
            const newTypes = currentTypes.includes(value)
                ? currentTypes.filter(type => type !== value)
                : [...currentTypes, value];

            return {
                ...prev,
                site_type: newTypes.join(',')
            };
        });
    };

    const removeSiteType = (value: string) => {
        setFormData(prev => ({
            ...prev,
            site_type: prev.site_type.split(',').filter((type: string) => type !== value).join(',')
        }));
    };

    const handleSave = async (section: 'personal' | 'contact' | 'station') => {
        try {
            clearError(); // Clear any previous errors

            if (section === 'station') {
                // Update user metadata (site_type) using Edge Function
                const updatedUser = await updateUserMetadata({
                    site_type: formData.site_type,
                });
                setUser(updatedUser);
            } else {
                // Personal or contact info (only user metadata)
                const updatedUser = await updateUserMetadata({
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    site_type: formData.site_type
                });
                setUser(updatedUser);
            }
            setIsEditing(prev => ({ ...prev, [section]: false }));
            toast({
                title: 'Success',
                description: 'Profile updated successfully'
            });
        } catch (error: any) {
            console.error('Error updating profile:', error);
            toast({
                title: 'Error',
                description: error?.message || 'Failed to update profile',
                variant: 'destructive'
            });
        }
    };

    return (
        <div ref={cardRef}>
            <Card className="overflow-hidden">
                <div className="bg-gradient-to-r from-primary to-secondary h-32 relative">
                    <div className="absolute -bottom-12 left-8">
                        <Avatar className="h-24 w-24 border-4 border-background profile-avatar">
                            <AvatarImage src={user?.user_metadata?.avatar_url} />
                            <AvatarFallback className="text-2xl">
                                {formData.first_name.charAt(0)}{formData.last_name.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                </div>
                <CardHeader className="pt-16">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-2xl">
                                {formData.first_name} {formData.last_name}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-1">
                                <Mail className="h-4 w-4" />
                                {formData.email}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <Separator />
                <CardContent className="pt-6 space-y-8">
                    {/* Personal Information Section */}
                    <div className="space-y-4 profile-section">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <User className="h-5 w-5 text-primary" />
                                <h3 className="text-lg font-semibold">Personal Information</h3>
                            </div>
                            <Button
                                variant={isEditing.personal ? "secondary" : "outline"}
                                onClick={() => setIsEditing(prev => ({ ...prev, personal: !prev.personal }))}
                                className="flex items-center gap-2"
                            >
                                <Settings2 className="h-4 w-4" />
                                {isEditing.personal ? 'Cancel' : 'Edit'}
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-7">
                            <div className="space-y-2">
                                <Label>First Name</Label>
                                <Input
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleInputChange}
                                    disabled={!isEditing.personal}
                                    className="bg-muted/50"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Last Name</Label>
                                <Input
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleInputChange}
                                    disabled={!isEditing.personal}
                                    className="bg-muted/50"
                                />
                            </div>
                        </div>
                        {isEditing.personal && (
                            <div className="pl-7">
                                <Button
                                    onClick={() => handleSave('personal')}
                                    className="w-full md:w-auto"
                                >
                                    Save Personal Information
                                </Button>
                            </div>
                        )}
                    </div>

                    <Separator />

                    {/* Contact Information Section */}
                    <div className="space-y-4 profile-section">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Mail className="h-5 w-5 text-primary" />
                                <h3 className="text-lg font-semibold">Contact Information</h3>
                            </div>
                            <Button
                                variant={isEditing.contact ? "secondary" : "outline"}
                                onClick={() => setIsEditing(prev => ({ ...prev, contact: !prev.contact }))}
                                className="flex items-center gap-2"
                            >
                                <Settings2 className="h-4 w-4" />
                                {isEditing.contact ? 'Cancel' : 'Edit'}
                            </Button>
                        </div>
                        <div className="pl-7 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Email Address</Label>
                                <Input
                                    value={formData.email}
                                    disabled
                                    className="bg-muted/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Phone Number</Label>
                                <Input
                                    value={formData.phone}
                                    disabled
                                    className="bg-muted/50"
                                />
                            </div>
                        </div>
                        {isEditing.contact && (
                            <div className="pl-7">
                                <Button
                                    onClick={() => handleSave('contact')}
                                    className="w-full md:w-auto"
                                >
                                    Save Contact Information
                                </Button>
                            </div>
                        )}
                    </div>

                    <Separator />

                    {/* Station Information Section */}
                    <div className="space-y-4 profile-section">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-primary" />
                                <h3 className="text-lg font-semibold">{site_name} Information</h3>
                            </div>
                            <Button
                                variant={isEditing.station ? "secondary" : "outline"}
                                onClick={() => setIsEditing(prev => ({ ...prev, station: !prev.station }))}
                                className="flex items-center gap-2"
                            >
                                <Settings2 className="h-4 w-4" />
                                {isEditing.station ? 'Cancel' : 'Edit'}
                            </Button>
                        </div>
                        <div className="pl-7">
                            <div className="space-y-2">
                                <Label>{site_name} Types</Label>

                                <div className="flex flex-col gap-3">
                                    <div className="flex flex-wrap gap-2">
                                        {formData.site_type ? (
                                            formData.site_type.split(',').filter(Boolean).map((type: string) => {
                                                const siteTypeLabel = SITE_TYPES.find(st => st.value === type);
                                                return (
                                                    <div key={type}>
                                                        <Badge
                                                            variant="secondary"
                                                            className="flex items-center gap-1 px-3 py-1"
                                                        >
                                                            {siteTypeLabel?.label}
                                                            {isEditing.station && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeSiteType(type)}
                                                                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:bg-white/20"
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </button>
                                                            )}
                                                        </Badge>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <Badge
                                                variant="secondary"
                                                className="flex items-center gap-1 px-3 py-1"
                                            >
                                                ALL
                                            </Badge>
                                        )}
                                    </div>
                                    {isEditing.station && (
                                        <Popover open={open} onOpenChange={setOpen}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={open}
                                                    className="w-full justify-between"
                                                >
                                                    Add {site_name} type
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-full p-0">
                                                <Command>
                                                    <CommandInput placeholder={`Search ${site_name} types...`} />
                                                    <CommandEmpty>No {site_name} type found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {SITE_TYPES.map((type) => (
                                                            <CommandItem
                                                                key={type.value}
                                                                value={type.value}
                                                                onSelect={() => handleSiteTypeChange(type.value)}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        formData.site_type.split(',').includes(type.value) ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                {type.label}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    )}
                                </div>
                            </div>
                        </div>
                        {isEditing.station && (
                            <div className="pl-7">
                                <Button
                                    onClick={() => handleSave('station')}
                                    className="w-full md:w-auto"
                                >
                                    Save {site_name} Information
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
