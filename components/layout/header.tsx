'use client'

import React from 'react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import SearchBar from '../searchbar/search'
import Cart from '../cart'
import { cn } from '@/lib/utils'
import { useUserStore } from '@/lib/store/user-store'
import { useBatchContext } from '@/hooks/use-batch-context'
import { useBatchCartStore } from '@/lib/store/batch-cart-store'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

function Header() {
    const { user } = useUserStore();
    const { isBatchRelevantPage, contextLabel } = useBatchContext();
    const { items } = useBatchCartStore();

    // Show cart if on a batch-relevant page OR if there are items in the cart
    const shouldShowCart = isBatchRelevantPage || items.length > 0;

    return (
        <header className={cn(
            "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
            "transition-all duration-300 ease-in-out"
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

                {/* Right Section - Cart (shown only on batch-relevant pages or when cart has items) */}
                {user?.user_metadata?.role !== 'operator' && shouldShowCart ? (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className={cn(
                                    "flex items-center space-x-3",
                                    "transition-all duration-200 ease-in-out"
                                )}>
                                    <div className={cn(
                                        "flex items-center justify-center",
                                        "w-10 h-10 sm:w-11 sm:h-11",
                                        "rounded-lg bg-gradient-to-br from-secondary/10 to-secondary/5",
                                        "border border-secondary/20",
                                        "hover:from-secondary/20 hover:to-secondary/10",
                                        "transition-all duration-200 ease-in-out",
                                        "shadow-sm hover:shadow-md",
                                        "group",
                                        items.length > 0 && "ring-2 ring-primary/30"
                                    )}>
                                        <Cart />
                                    </div>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-xs">
                                <p className="font-medium">{contextLabel}</p>
                                {items.length > 0 ? (
                                    <p className="text-xs text-muted-foreground">
                                        {items.length} item{items.length !== 1 ? 's' : ''} in cart
                                    </p>
                                ) : (
                                    <p className="text-xs text-muted-foreground">
                                        Select bills or recharges to create a batch
                                    </p>
                                )}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ) : null}
            </div>

            {/* Subtle gradient overlay for visual appeal */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-50 pointer-events-none" />
        </header>
    )
}

export default Header