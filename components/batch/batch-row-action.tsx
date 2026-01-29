'use client';

import React from 'react';
import { Plus, Check, Minus, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useBatchCartStore } from '@/lib/store/batch-cart-store';
import { AllBillTableProps } from '@/types/bills-type';
import { PrepaidRechargeTableProps } from '@/types/connections-type';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { isDisabled } from '@/lib/utils';

type CartItemType = AllBillTableProps | PrepaidRechargeTableProps;

interface BatchRowActionProps {
    /** The row data */
    row: any;
    /** Whether to show checkbox (for table selection) */
    showCheckbox?: boolean;
    /** Type of item */
    itemType?: 'bill' | 'recharge';
}

/**
 * Improved row action component for batch operations
 * Provides both checkbox selection and explicit "Add to Batch" button
 */
export function BatchRowAction({ row, showCheckbox = true, itemType = 'bill' }: BatchRowActionProps) {
    const { items, addItem, removeItem } = useBatchCartStore();
    const item = row.original as CartItemType;

    const isItemDisabled = isDisabled(item);
    const isInCart = items.some(cartItem => cartItem.id === item.id);
    const isSelected = row.getIsSelected();

    const handleToggleCart = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent row click
        if (isInCart) {
            removeItem(item.id);
            row.toggleSelected(false);
        } else {
            addItem(item);
            row.toggleSelected(true);
        }
    };

    const handleCheckboxChange = (checked: boolean) => {
        row.toggleSelected(checked);
        if (checked) {
            addItem(item);
        } else {
            removeItem(item.id);
        }
    };

    if (isItemDisabled) {
        return (
            <div className="flex items-center gap-2">
                {showCheckbox && (
                    <Checkbox
                        checked={false}
                        disabled
                        aria-label="Already in batch or paid"
                        className="opacity-30"
                    />
                )}
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="w-8 h-8 flex items-center justify-center rounded-md bg-muted/50 text-muted-foreground">
                                <Archive className="h-4 w-4 opacity-30" />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Already in a batch or paid</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            {showCheckbox && (
                <Checkbox
                    checked={isSelected || isInCart}
                    onCheckedChange={handleCheckboxChange}
                    aria-label={`Select ${itemType}`}
                    className={cn(
                        "transition-all duration-200",
                        isInCart && "border-primary bg-primary data-[state=checked]:bg-primary"
                    )}
                />
            )}
            
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant={isInCart ? "default" : "outline"}
                            size="icon"
                            onClick={handleToggleCart}
                            className={cn(
                                "h-8 w-8 transition-all duration-200",
                                isInCart 
                                    ? "bg-primary hover:bg-primary/90 text-primary-foreground" 
                                    : "hover:bg-primary/10 hover:border-primary hover:text-primary"
                            )}
                        >
                            {isInCart ? (
                                <Check className="h-4 w-4" />
                            ) : (
                                <Plus className="h-4 w-4" />
                            )}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{isInCart ? `Remove from batch cart` : `Add to batch cart`}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
}

/**
 * Header action for batch selection
 * Provides "Select All" functionality with cart integration
 */
interface BatchHeaderActionProps {
    table: any;
    itemType?: 'bill' | 'recharge';
}

export function BatchHeaderAction({ table, itemType = 'bill' }: BatchHeaderActionProps) {
    const { addAllItem, removeAllItems, items } = useBatchCartStore();

    // Get rows that can be selected (not already in batch, not paid)
    const selectableRows = table
        .getFilteredRowModel()
        .rows.filter((row: any) => !isDisabled(row.original));

    const selectableItems = selectableRows.map((row: any) => row.original);

    // Check if all selectable rows are in cart
    const allInCart = selectableItems.length > 0 && 
        selectableItems.every((item: CartItemType) =>
            items.some(cartItem => cartItem.id === item.id)
        );

    // Check if some (but not all) are in cart
    const someInCart = selectableItems.some((item: CartItemType) =>
        items.some(cartItem => cartItem.id === item.id)
    );

    const handleSelectAll = (checked: boolean) => {
        selectableRows.forEach((row: any) => row.toggleSelected(checked));
        
        if (checked) {
            addAllItem(selectableItems);
        } else {
            const itemIds = selectableItems.map((item: CartItemType) => item.id);
            removeAllItems(itemIds);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <Checkbox
                checked={allInCart}
                ref={(el) => {
                    if (el) {
                        (el as any).indeterminate = someInCart && !allInCart;
                    }
                }}
                onCheckedChange={handleSelectAll}
                aria-label={`Select all ${itemType}s`}
                className={cn(
                    "transition-all duration-200",
                    allInCart && "border-primary bg-primary"
                )}
            />
            {selectableItems.length > 0 && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSelectAll(!allInCart)}
                                className="h-7 px-2 text-xs"
                            >
                                {allInCart ? 'Deselect' : 'Select'} All
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            {allInCart 
                                ? `Remove all ${selectableItems.length} ${itemType}s from selection` 
                                : `Add all ${selectableItems.length} ${itemType}s to selection`}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
        </div>
    );
}

/**
 * Compact version of row action - just the add button
 */
export function BatchRowActionCompact({ row, itemType = 'bill' }: BatchRowActionProps) {
    const { items, addItem, removeItem } = useBatchCartStore();
    const item = row.original as CartItemType;

    const isItemDisabled = isDisabled(item);
    const isInCart = items.some(cartItem => cartItem.id === item.id);

    const handleToggleCart = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isInCart) {
            removeItem(item.id);
            row.toggleSelected(false);
        } else {
            addItem(item);
            row.toggleSelected(true);
        }
    };

    if (isItemDisabled) {
        return (
            <div className="w-7 h-7 flex items-center justify-center rounded bg-muted/30">
                <Archive className="h-3.5 w-3.5 text-muted-foreground/50" />
            </div>
        );
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant={isInCart ? "default" : "ghost"}
                        size="icon"
                        onClick={handleToggleCart}
                        className={cn(
                            "h-7 w-7 transition-all duration-200",
                            isInCart 
                                ? "bg-primary hover:bg-primary/90" 
                                : "hover:bg-primary/10 text-muted-foreground hover:text-primary"
                        )}
                    >
                        {isInCart ? (
                            <Check className="h-3.5 w-3.5" />
                        ) : (
                            <Plus className="h-3.5 w-3.5" />
                        )}
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                    <p>{isInCart ? 'Remove from cart' : 'Add to cart'}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
