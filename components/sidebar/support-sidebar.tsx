import {
    Sidebar,
    SidebarRail
} from '@/components/ui/sidebar';

import * as React from 'react';
import HeaderSidebar from './header-sidebar';
import ContentSidebar from './content-sidebar';
import FooterSidebar from './footer-sidebar';
import { supportNavItems } from '@/constants/nav-item';
export function SupportSidebar() {
    return (
        <Sidebar collapsible='icon' variant='sidebar'>
            <HeaderSidebar />
            <ContentSidebar items={supportNavItems} />
            <FooterSidebar />
            <SidebarRail />
        </Sidebar>
    );
}