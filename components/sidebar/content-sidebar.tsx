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
import { Icons } from '../icons';
import { NavItem } from '@/types';

function ContentSidebar({ items }: { items: NavItem[] }) {
    const { setOpenMobile, isMobile } = useSidebar();
    const pathname = usePathname();

    const handleLinkClick = () => {
        if (isMobile) {
            setOpenMobile(false);
        }
    };

    return (
        <SidebarContent className='overflow-x-hidden'>
            <SidebarGroup>
                <SidebarMenu>
                    {items.map((item) => {
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
