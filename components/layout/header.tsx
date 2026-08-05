'use client'

import React from 'react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import SearchBar from '../searchbar/search'
import { cn } from '@/lib/utils'
import { useUserStore } from '@/lib/store/user-store'
import { UserNav } from './user-nav'

function Header() {
    const { user } = useUserStore();

    return (
        <header className={cn(
            "sticky top-0 z-[60] w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
            "isolate will-change-transform" // stable layer to reduce scroll flicker
        )}>
            <div className={cn(
                "flex items-center justify-between",
                "px-2 py-2 sm:px-6 lg:px-8",
                "min-h-[50px] sm:min-h-[55px]",
                "relative"
            )}>
                {/* Left Section - Sidebar Trigger */}
                <div className="flex items-center space-x-3">
                    <div className={cn(
                        "flex items-center justify-center",
                        "w-10 h-10 sm:w-11 sm:h-11",
                        "rounded-lg bg-gradient-to-br from-primary/10 to-primary/5",
                        "transition-all duration-200 ease-in-out",
                        "border border-primary/20",
                        "hover:from-primary/20 hover:to-primary/10",
                        "shadow-sm hover:shadow-md",
                        "group"
                    )}>
                        <SidebarTrigger />
                    </div>
                </div>

                {/* Center Section - Search Bar */}
                <div className={cn(
                    "flex-1 max-w-2xl",
                    "mx-4 sm:mx-6 lg:mx-8",
                    "transition-all duration-300 ease-in-out"
                )}>
                    <div className={cn(
                        "relative",
                        "transform transition-all duration-200",
                        "hover:scale-[1.02] focus-within:scale-[1.02]"
                    )}>
                        {user?.user_metadata?.role !== 'operator' ? <SearchBar /> : <></>}
                    </div>
                </div>

                {/* Right Section - Account */}
                <div className="flex items-center space-x-2 sm:space-x-3">
                    <UserNav />
                </div>
            </div>

            {/* Subtle gradient overlay for visual appeal */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-50 pointer-events-none" />
        </header>
    )
}

export default Header
