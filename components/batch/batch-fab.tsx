'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Archive, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useBatchCartStore } from '@/lib/store/batch-cart-store';
import { useBatchContext } from '@/hooks/use-batch-context';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatRupees } from '@/lib/utils/number-format';

interface BatchFabProps {
    className?: string;
}

function useCartTotal(items: ReturnType<typeof useBatchCartStore.getState>['items']) {
    return useMemo(() => {
        return items.reduce((acc, item) => {
            if ('approved_amount' in item) {
                return acc + (item.approved_amount || 0);
            }
            if ('recharge_amount' in item) {
                return acc + (item.recharge_amount || 0);
            }
            return acc;
        }, 0);
    }, [items]);
}

/**
 * One-shot attention when the cart gains items — no continuous blink.
 */
function useCartPop(itemCount: number) {
    const prevCount = useRef(itemCount);
    const [pop, setPop] = useState(false);

    useEffect(() => {
        if (itemCount > prevCount.current) {
            setPop(true);
            const timer = window.setTimeout(() => setPop(false), 450);
            prevCount.current = itemCount;
            return () => window.clearTimeout(timer);
        }
        prevCount.current = itemCount;
    }, [itemCount]);

    return pop;
}

/**
 * Floating batch cart entry.
 * Empty on Approved: quiet circular control.
 * With items: expanded chip (count + total + CTA) — no animate-pulse.
 */
export function BatchFab({ className }: BatchFabProps) {
    const { isApprovedBillsPage, isApprovedRechargesPage, contextLabel } =
        useBatchContext();
    const { items, openModal, isModalOpen } = useBatchCartStore();

    const hasItems = items.length > 0;
    const onApproved = isApprovedBillsPage || isApprovedRechargesPage;
    const totalAmount = useCartTotal(items);
    const pop = useCartPop(items.length);

    // Modal already shows cart — keep the chrome quiet.
    if (isModalOpen) {
        return null;
    }

    if (!onApproved && !hasItems) {
        return null;
    }

    const label = hasItems
        ? `Review batch cart, ${items.length} item${items.length === 1 ? '' : 's'}, ${formatRupees(totalAmount)}`
        : 'Open batch cart';

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        onClick={openModal}
                        size="lg"
                        className={cn(
                            // Clear sticky portal footer; stay above selection toolbar
                            'fixed bottom-20 right-6 z-[100]',
                            'shadow-lg border border-primary/20',
                            'bg-primary hover:bg-primary/90 text-primary-foreground',
                            'transition-[transform,box-shadow,width,padding] duration-300 ease-out',
                            'hover:shadow-xl active:scale-[0.98]',
                            'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                            hasItems
                                ? 'h-11 sm:h-12 rounded-full px-3.5 sm:px-4 gap-2'
                                : 'h-12 w-12 sm:h-14 sm:w-14 rounded-full p-0',
                            pop && 'scale-105 shadow-primary/40',
                            className
                        )}
                        aria-label={label}
                    >
                        {hasItems ? (
                            <>
                                <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15">
                                    <ShoppingCart className="h-4 w-4" />
                                    <span
                                        className={cn(
                                            'absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center',
                                            'rounded-full bg-background px-1 text-[10px] font-bold text-primary',
                                            'ring-2 ring-primary'
                                        )}
                                    >
                                        {items.length > 99 ? '99+' : items.length}
                                    </span>
                                </span>
                                <span className="flex min-w-0 flex-col items-start text-left leading-tight">
                                    <span className="text-xs font-semibold tracking-tight sm:text-sm">
                                        Review batch
                                    </span>
                                    <span className="max-w-[8rem] truncate text-[11px] font-medium text-primary-foreground/80 sm:max-w-[10rem]">
                                        {formatRupees(totalAmount)}
                                    </span>
                                </span>
                            </>
                        ) : (
                            <Archive className="h-5 w-5 sm:h-6 sm:w-6" />
                        )}
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                    <div className="space-y-1">
                        <p className="font-medium">
                            {hasItems
                                ? `${contextLabel} (${items.length} item${items.length === 1 ? '' : 's'})`
                                : 'Create batch'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {hasItems
                                ? 'Open cart to create a batch or add to an unpaid batch'
                                : 'Select bills or recharges to add them here'}
                        </p>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

/**
 * Mini FAB variant — quieter circular control; same no-pulse rule.
 */
export function BatchFabMini({ className }: BatchFabProps) {
    const { isApprovedBillsPage, isApprovedRechargesPage } = useBatchContext();
    const { items, openModal, isModalOpen } = useBatchCartStore();

    const hasItems = items.length > 0;
    const onApproved = isApprovedBillsPage || isApprovedRechargesPage;
    const pop = useCartPop(items.length);

    if (isModalOpen) {
        return null;
    }

    if (!onApproved && !hasItems) {
        return null;
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        onClick={openModal}
                        size="sm"
                        variant={hasItems ? 'default' : 'outline'}
                        className={cn(
                            'fixed bottom-20 right-6 z-[100]',
                            'h-12 w-12 rounded-full shadow-md',
                            'transition-transform duration-200',
                            'hover:scale-105 active:scale-95',
                            pop && 'scale-110',
                            className
                        )}
                        aria-label={
                            hasItems
                                ? `View batch cart (${items.length} items)`
                                : 'Open batch cart'
                        }
                    >
                        <div className="relative">
                            {hasItems ? (
                                <ShoppingCart className="h-5 w-5" />
                            ) : (
                                <Archive className="h-5 w-5" />
                            )}
                            {hasItems ? (
                                <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-background px-0.5 text-[10px] font-bold text-primary ring-1 ring-primary">
                                    {items.length > 9 ? '9+' : items.length}
                                </span>
                            ) : null}
                        </div>
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                    <p>
                        {hasItems
                            ? `${items.length} item${items.length === 1 ? '' : 's'} in batch`
                            : 'Batch cart'}
                    </p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
