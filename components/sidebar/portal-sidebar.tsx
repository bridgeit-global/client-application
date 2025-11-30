'use client';
import {
    Sidebar,
    SidebarRail
} from '@/components/ui/sidebar';

import * as React from 'react';
import HeaderSidebar from './header-sidebar';
import ContentSidebar from './content-sidebar';
import FooterSidebar from './footer-sidebar';
import { getNavItems } from '@/constants/nav-item';
import { NavItem } from '@/types';
import { useSiteName } from '@/lib/utils/site';
export function PortalSidebar() {
    const site_name = useSiteName();
    const navItems: NavItem[] = getNavItems(site_name);
    console.log('site_name', site_name)

    return (
        <Sidebar collapsible='offcanvas' variant='sidebar'>
            <HeaderSidebar />
            <ContentSidebar items={navItems} />
            <FooterSidebar />
            <SidebarRail />
        </Sidebar>
    );
}