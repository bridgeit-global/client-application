'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    SidebarFooter,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import * as React from 'react';
import { useUser } from '@/hooks/useUser';

function FooterSidebar() {
    const user = useUser();

    const userName = (user?.user_metadata?.first_name && user?.user_metadata?.last_name) ? user?.user_metadata?.first_name + ' ' + user?.user_metadata?.last_name : '';
    const userEmail = user?.email ? user?.email : '';

    return (
        <SidebarFooter className="border-t border-border/60 pt-2">
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton
                        size='lg'
                        className='w-full hover:bg-sidebar-accent transition-colors duration-200 cursor-default'
                        disabled
                    >
                        <Avatar className='h-9 w-9 rounded-lg border-2 border-border/60'>
                            <AvatarImage
                                src={user?.user_metadata?.avatar_url || ''}
                                alt={userName || ''}
                            />
                            <AvatarFallback className='rounded-lg bg-sidebar-accent text-foreground'>
                                {userName?.slice(0, 2)?.toUpperCase() || ''}
                            </AvatarFallback>
                        </Avatar>
                        <div className='grid flex-1 text-left text-sm leading-tight'>
                            <span className='font-medium'>
                                {userName || 'Anonymous User'}
                            </span>
                            <span className='text-xs text-muted-foreground'>
                                {userEmail || ''}
                            </span>
                        </div>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>
    )
}

export default FooterSidebar
