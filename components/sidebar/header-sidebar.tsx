'use client'
import React, { useState, useEffect } from 'react'
import { SidebarHeader } from '@/components/ui/sidebar'
import Logo from '../logo'
import { createClient } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { useAsyncOperation } from '@/hooks/use-supabase-error';
import { usePathname } from 'next/navigation';

interface OrganizationData {
    logo_url: string | null;
    name: string | null;
}

function HeaderSidebar() {
    const supabase = createClient();
    const pathname = usePathname();
    const [error, setError] = useState(false);
    const { loading, data, execute } = useAsyncOperation<OrganizationData>();
    const isSupportSection = pathname?.includes('/support');

    useEffect(() => {
        // Only fetch organization data if not in support section
        if (!isSupportSection) {
            execute(async () => {
                const { data: { user } } = await supabase.auth.getUser();
                const { data, error } = await supabase.from('organizations').select('*').eq('id', user?.user_metadata?.org_id).single();
                if (error) throw error;
                return {
                    logo_url: data?.logo_url || null,
                    name: data?.name || null
                };
            });
        }
    }, [execute, isSupportSection]);

    const handleImgError = () => {
        setError(true);
    };

    return (
        <SidebarHeader>
            <div className="flex gap-2 py-2 text-sidebar-accent-foreground items-center">
                <div
                    className="flex aspect-square size-8 items-center justify-center rounded-lg bg-white shadow border border-gray-200 text-sidebar-primary-foreground transition-all duration-200"
                    aria-label={isSupportSection ? "Support logo" : "Organization logo"}
                >
                    {isSupportSection ? (
                        <Logo aria-label="Support logo" />
                    ) : loading ? (
                        <Skeleton className="w-8 h-8 rounded-lg" />
                    ) : data?.logo_url && !error ? (
                        <img
                            src={data.logo_url}
                            alt="Organization logo"
                            width={24}
                            height={24}
                            className="object-contain w-6 h-6 self-center"
                            onError={handleImgError}
                        />
                    ) : (
                        <Logo aria-label="Default logo" />
                    )}
                </div>
                {isSupportSection ? (
                    <span className='truncate font-semibold'>Support Team</span>
                ) : loading ? (
                    <Skeleton className="w-24 h-4 rounded-lg" />
                ) : !error && (
                    <span className='truncate font-semibold'>{data?.name || 'BridgeIT'}</span>
                )}
            </div>
        </SidebarHeader>
    )
}

export default HeaderSidebar