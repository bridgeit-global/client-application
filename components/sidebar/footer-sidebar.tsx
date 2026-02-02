'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    SidebarFooter,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import {
    HelpCircle,
    User
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import { useUser } from '@/hooks/useUser';
import { cn } from '@/lib/utils';

function FooterSidebar() {
    const { open } = useSidebar();
    const pathname = usePathname();
    const router = useRouter();
    const user = useUser();

    const gotoSupport = () => {
        router.push('/support/dashboard');
    }
    const goToPortal = () => {
        router.push('/portal/dashboard');
    }
    const userName = (user?.user_metadata?.first_name && user?.user_metadata?.last_name) ? user?.user_metadata?.first_name + ' ' + user?.user_metadata?.last_name : '';
    const userEmail = user?.email ? user?.email : '';
    const isSupport = user?.role === 'service_role' ? true : false;
    const isPortalPage = pathname.includes('portal') ? true : false;

    return (
        <SidebarFooter className="border-t border-border/60 pt-2">
            <SidebarMenu>
                {isSupport && (
                    <div className='flex gap-2 px-2 mb-2'>
                        {isPortalPage ? (
                            <SidebarMenuButton
                                className='p-2'
                                variant='outline'
                                onClick={gotoSupport}
                            >
                                <HelpCircle className={cn('mr-2 h-4 w-4', !open && 'hidden')} />
                                {open && 'Support Dashboard'}
                            </SidebarMenuButton>
                        ) : (
                            <SidebarMenuButton
                                className='p-2'
                                variant='outline'
                                onClick={goToPortal}
                            >
                                <User className={cn('mr-2 h-4 w-4', !open && 'hidden')} />
                                {open && 'Portal Dashboard'}
                            </SidebarMenuButton>
                        )}
                    </div>
                )}
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