'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
    SidebarFooter,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import {
    ChevronsUpDown,
    LogOut,
    HelpCircle,
    User
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import { useBillerBoardStore } from '@/lib/store/biller-board-store';
import { createClient } from '@/lib/supabase/client';
import { Button } from '../ui/button';
import { useUser } from '@/hooks/useUser';
import { cn } from '@/lib/utils';

function FooterSidebar() {
    const { open } = useSidebar();
    const { setBillers } = useBillerBoardStore();
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();
    const user = useUser();

    const logOut = async () => {
        setBillers([]);
        await supabase.auth.signOut();
        router.push('/');
    }
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
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <SidebarMenuButton
                                size='lg'
                                className='w-full hover:bg-sidebar-accent transition-colors duration-200'
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
                                <ChevronsUpDown className='ml-auto size-4 opacity-60' />
                            </SidebarMenuButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className='w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg'
                            side='top'
                            align='end'
                            sideOffset={8}
                        >
                            <DropdownMenuLabel className='p-0 font-normal'>
                                <div onClick={() => router.push('/portal/user-profile')} className='flex items-center gap-2 px-1 py-1.5 text-left text-sm hover:bg-sidebar-accent cursor-pointer'>
                                    <Avatar className='h-8 w-8 rounded-lg'>
                                        <AvatarImage
                                            src={user?.user_metadata?.avatar_url || ''}
                                            alt={userName || ''}
                                        />
                                        <AvatarFallback className='rounded-lg'>
                                            {userName?.slice(0, 2)?.toUpperCase() || 'CN'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className='grid flex-1 text-left text-sm leading-tight'>
                                        <span className='truncate font-semibold'>
                                            {userName || ''}
                                        </span>
                                        <span className='truncate text-xs'>
                                            {userEmail || ''}
                                        </span>
                                    </div>
                                </div>
                            </DropdownMenuLabel>



                            <DropdownMenuItem
                                onClick={logOut}
                                className='text-destructive focus:text-destructive'
                            >
                                <LogOut className='mr-2 size-4' />
                                Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>
    )
}

export default FooterSidebar