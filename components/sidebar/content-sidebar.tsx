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
                item.url === '/portal/meter-reading' || item.url === '/portal/meter-reading-list'
            );
            setSidebarItems(operatorNavItems);
        } else if (user?.user_metadata.role === 'admin') {
            // For admin users, show all items except meter-reading pages (which are operator-only)
            const adminItems = items.filter(item =>
                item.url !== '/portal/meter-reading' && item.url !== '/portal/meter-reading-list'
            );
            setSidebarItems([
                ...adminItems,
                {
                    title: 'User',
                    url: '/portal/user',
                    icon: 'user',
                    isCollapsible: false,
                }
            ]);
        } else {
            // For regular users, show all items except meter-reading pages (which are operator-only)
            const regularUserItems = items.filter(item =>
                item.url !== '/portal/meter-reading' && item.url !== '/portal/meter-reading-list'
            );
            setSidebarItems(regularUserItems);
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