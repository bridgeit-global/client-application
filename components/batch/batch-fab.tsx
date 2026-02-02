'use client';

import React from 'react';
import { Archive, Plus, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useBatchCartStore } from '@/lib/store/batch-cart-store';
import { useBatchContext } from '@/hooks/use-batch-context';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from '@/components/ui/badge';

interface BatchFabProps {
    className?: string;
}

/**
 * Floating Action Button for batch management
 * Shows only on batch-relevant pages (approved bills, approved recharges)
 * Provides quick access to view/manage batch cart
 */
export function BatchFab({ className }: BatchFabProps) {
    const { isBatchRelevantPage, isBatchPage, contextLabel } = useBatchContext();
    const { items, openModal } = useBatchCartStore();

    // Don't show FAB on batch management pages (already have full interface)
    // Only show on approved bills/recharges pages
    if (!isBatchRelevantPage || isBatchPage) {
        return null;
    }

    const hasItems = items.length > 0;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        onClick={openModal}
                        size="lg"
                        className={cn(
                            "fixed bottom-6 right-6 z-50",
                            "h-14 w-14 sm:h-16 sm:w-16",
                            "rounded-full shadow-lg",
                            "bg-primary hover:bg-primary/90",
                            "transition-all duration-300 ease-in-out",
                            "hover:scale-110 active:scale-95",
                            "group",
                            hasItems && "animate-pulse",
                            className
                        )}
                        aria-label={hasItems ? `View batch cart (${items.length} items)` : "Open batch cart"}
                    >
                        <div className="relative">
                            {hasItems ? (
                                <ShoppingCart className="h-6 w-6 sm:h-7 sm:w-7 text-primary-foreground" />
                            ) : (
                                <Archive className="h-6 w-6 sm:h-7 sm:w-7 text-primary-foreground" />
                            )}
                            
                            {/* Item count badge */}
                            {hasItems && (
                                <Badge
                                    variant="destructive"
                                    className={cn(
                                        "absolute -top-3 -right-3",
                                        "h-6 w-6",
                                        "flex items-center justify-center",
                                        "text-xs font-bold",
                                        "bg-white text-primary",
                                        "border-2 border-primary",
                                        "shadow-md"
                                    )}
                                >
                                    {items.length > 99 ? '99+' : items.length}
                                </Badge>
                            )}
                        </div>
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                    <div className="space-y-1">
                        <p className="font-medium">
                            {hasItems ? `${contextLabel} (${items.length} items)` : 'Create Batch'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {hasItems 
                                ? 'Click to view and manage your batch' 
                                : 'Select items from the table to add to batch'}
                        </p>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

/**
 * Mini FAB variant - smaller, less prominent
 */
export function BatchFabMini({ className }: BatchFabProps) {
    const { isBatchRelevantPage, isBatchPage } = useBatchContext();
    const { items, openModal } = useBatchCartStore();

    if (!isBatchRelevantPage || isBatchPage) {
        return null;
    }

    const hasItems = items.length > 0;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        onClick={openModal}
                        size="sm"
                        variant={hasItems ? "default" : "outline"}
                        className={cn(
                            "fixed bottom-6 right-6 z-50",
                            "h-12 w-12",
                            "rounded-full shadow-md",
                            "transition-all duration-200",
                            "hover:scale-105 active:scale-95",
                            className
                        )}
                        aria-label={hasItems ? `View batch cart (${items.length} items)` : "Open batch cart"}
                    >
                        <div className="relative">
                            <Archive className="h-5 w-5" />
                            {hasItems && (
                                <span className="absolute -top-2 -right-2 h-4 w-4 bg-destructive rounded-full text-[10px] text-destructive-foreground flex items-center justify-center font-bold">
                                    {items.length > 9 ? '9+' : items.length}
                                </span>
                            )}
                        </div>
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                    <p>{hasItems ? `${items.length} items in batch` : 'Batch Cart'}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
