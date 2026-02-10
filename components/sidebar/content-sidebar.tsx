'use client';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger
} from '@/components/ui/collapsible';

import {
    SidebarContent,
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    useSidebar,
} from '@/components/ui/sidebar';
import {
    ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import { Icons } from '../icons';
import { NavItem } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

const buildAccountsItems = (
    items: NavItem[],
    options: { includeUsers: boolean; includeApiClients: boolean; includeSiteZoneConfig: boolean }
): NavItem[] => {
    return items.map((item) => {
        if (item.url !== '/portal/accounts') {
            return item;
        }

        const existingItems = item.items ?? [];
        const byUrl = new Map<string, NavItem>();
        
        // Build map and filter out duplicates
        const uniqueItems: NavItem[] = [];
        for (const entry of existingItems) {
            if (!byUrl.has(entry.url)) {
                byUrl.set(entry.url, entry);
                uniqueItems.push(entry);
            }
        }

        // Add User Management if it doesn't exist and should be included
        if (options.includeUsers && !byUrl.has('/portal/user')) {
            const userItem: NavItem = {
                title: 'User Management',
                url: '/portal/user',
                icon: 'user',
                isCollapsible: false,
            };
            uniqueItems.unshift(userItem);
            byUrl.set('/portal/user', userItem);
        }

        // Add API Clients if it doesn't exist and should be included
        // Insert after Profile if Profile exists
        if (options.includeApiClients && !byUrl.has('/portal/accounts/api-clients')) {
            const profileIndex = uniqueItems.findIndex(item => item.url === '/portal/user-profile');
            const apiClientsItem: NavItem = {
                title: 'API',
                url: '/portal/accounts/api-clients',
                icon: 'extraction',
                isCollapsible: false,
            };
            if (profileIndex >= 0) {
                uniqueItems.splice(profileIndex + 1, 0, apiClientsItem);
            } else {
                uniqueItems.push(apiClientsItem);
            }
            byUrl.set('/portal/accounts/api-clients', apiClientsItem);
        }

        if (options.includeSiteZoneConfig && !byUrl.has('/portal/accounts/site-zone-config')) {
            const profileIndex = uniqueItems.findIndex(item => item.url === '/portal/user-profile');
            const siteZoneConfigItem: NavItem = {
                title: 'Site & zone config',
                url: '/portal/accounts/site-zone-config',
                icon: 'settings',
                isCollapsible: false,
            };
            if (profileIndex >= 0) {
                uniqueItems.splice(profileIndex + 1, 0, siteZoneConfigItem);
            } else {
                uniqueItems.push(siteZoneConfigItem);
            }
            byUrl.set('/portal/accounts/site-zone-config', siteZoneConfigItem);
        }

        return {
            ...item,
            items: uniqueItems,
        };
    });
};

function ContentSidebar({ items }: { items: NavItem[] }) {
    const supabase = createClient();
    const [sidebarItems, setSidebarItems] = useState<NavItem[]>(items);
    const { setOpenMobile, isMobile } = useSidebar();

    const handleLinkClick = () => {
        if (isMobile) {
            setOpenMobile(false);
        }
    };

    const getUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();

        // For operator users, show only meter-reading navigation
        if (user?.user_metadata.role === 'operator') {
            const operatorNavItems = items.filter(item =>
                item.url === '/portal/meter-reading' ||
                item.url === '/portal/meter-reading-list' ||
                item.url === '/portal/accounts'
            );
            setSidebarItems(buildAccountsItems(operatorNavItems, { includeUsers: false, includeApiClients: false, includeSiteZoneConfig: false }));
        } else if (user?.user_metadata.role === 'admin') {
            // For admin users, show all items except meter-reading pages (which are operator-only)
            const adminItems = items.filter(item =>
                item.url !== '/portal/meter-reading' && item.url !== '/portal/meter-reading-list'
            );
            setSidebarItems(buildAccountsItems(adminItems, { includeUsers: true, includeApiClients: true, includeSiteZoneConfig: true }));
        } else {
            // For regular users, show all items except meter-reading pages (which are operator-only)
            const regularUserItems = items.filter(item =>
                item.url !== '/portal/meter-reading' && item.url !== '/portal/meter-reading-list'
            );
            setSidebarItems(buildAccountsItems(regularUserItems, { includeUsers: false, includeApiClients: false, includeSiteZoneConfig: false }));
        }
    }

    useEffect(() => {
        getUser();
    }, [items]);

    const pathname = usePathname();
    return (
        <SidebarContent className='overflow-x-hidden'>
            <SidebarGroup>
                <SidebarMenu>
                    {sidebarItems.map((item) => {
                        const Icon = item.icon ? Icons[item.icon] : Icons.logo;
                        return item?.items && item?.items?.length > 0 ? (
                            <Collapsible
                                key={item.title}
                                asChild
                                defaultOpen={item.isCollapsible}
                                className='group/collapsible'
                            >
                                <SidebarMenuItem>
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton
                                            tooltip={item.title}
                                            isActive={pathname === item.url}
                                        >
                                            {item.icon && <Icon />}
                                            <Link className='hover:text-primary hover:underline' href={item.url} onClick={handleLinkClick}><span>{item.title}</span></Link>
                                            <ChevronRight className='ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <SidebarMenuSub>
                                            {item.items?.map((subItem) => (
                                                <SidebarMenuSubItem key={subItem.title}>
                                                    <SidebarMenuSubButton
                                                        asChild
                                                        isActive={pathname === subItem.url}
                                                    >
                                                        <Link href={subItem.url} onClick={handleLinkClick}>
                                                            <span>{subItem.title}</span>
                                                        </Link>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                            ))}
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                </SidebarMenuItem>
                            </Collapsible>
                        ) : (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    asChild
                                    tooltip={item.title}
                                    isActive={pathname === item.url}
                                >
                                    <Link href={item.url} onClick={handleLinkClick}>
                                        <Icon />
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        );
                    })}
                </SidebarMenu>
            </SidebarGroup>
        </SidebarContent>
    )
}

export default ContentSidebar