'use client';

import React, { useMemo } from 'react';
import {
    Archive,
    CheckCircle2,
    X,
    AlertCircle,
    Clock,
    CalendarDays,
    Sparkles,
    Plus,
    Minus,
    Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useBatchCartStore } from '@/lib/store/batch-cart-store';
import { formatRupees } from '@/lib/utils/number-format';
import { AllBillTableProps } from '@/types/bills-type';
import { PrepaidRechargeTableProps } from '@/types/connections-type';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from '@/components/ui/separator';

type CartItemType = AllBillTableProps | PrepaidRechargeTableProps;

interface BatchSelectionToolbarProps {
    /** Currently selected items from the table */
    selectedItems: CartItemType[];
    /** Total items available for selection */
    totalItems: CartItemType[];
    /** Callback to clear table selection */
    onClearSelection: () => void;
    /** Type of items being selected */
    itemType: 'bill' | 'recharge';
    /** Table instance for selection control */
    table?: any;
    className?: string;
}

/**
 * A floating toolbar that appears when items are selected
 * Provides quick actions for batch management
 */
export function BatchSelectionToolbar({
    selectedItems,
    totalItems,
    onClearSelection,
    itemType,
    table,
    className
}: BatchSelectionToolbarProps) {
    const { items: cartItems, addItem, addAllItem, removeItem, removeAllItems, openModal } = useBatchCartStore();

    const selectedCount = selectedItems.length;
    const isVisible = selectedCount > 0;

    // Calculate total amount of selected items
    const totalAmount = useMemo(() => {
        return selectedItems.reduce((acc, item) => {
            if ('approved_amount' in item) {
                return acc + (item.approved_amount || 0);
            } else if ('recharge_amount' in item) {
                return acc + (item.recharge_amount || 0);
            }
            return acc;
        }, 0);
    }, [selectedItems]);

    // Check how many selected items are already in cart
    const itemsInCart = useMemo(() => {
        return selectedItems.filter(item => 
            cartItems.some(cartItem => cartItem.id === item.id)
        ).length;
    }, [selectedItems, cartItems]);

    const itemsNotInCart = selectedCount - itemsInCart;

    // Add all selected items to cart
    const handleAddToCart = () => {
        const newItems = selectedItems.filter(
            item => !cartItems.some(cartItem => cartItem.id === item.id)
        );
        addAllItem(newItems);
    };

    // Remove all selected items from cart
    const handleRemoveFromCart = () => {
        const itemIds = selectedItems
            .filter(item => cartItems.some(cartItem => cartItem.id === item.id))
            .map(item => item.id);
        removeAllItems(itemIds);
    };

    // Add to cart and open modal
    const handleAddAndOpenCart = () => {
        handleAddToCart();
        openModal();
    };

    if (!isVisible) {
        return null;
    }

    return (
        <div
            className={cn(
                "fixed bottom-20 left-1/2 -translate-x-1/2 z-40",
                "bg-background/95 backdrop-blur-lg",
                "border rounded-xl shadow-2xl",
                "px-4 py-3",
                "flex items-center gap-4",
                "animate-in slide-in-from-bottom-5 duration-300",
                "max-w-[95vw]",
                className
            )}
        >
            {/* Selection count */}
            <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-semibold">
                        {selectedCount} {itemType}{selectedCount !== 1 ? 's' : ''} selected
                    </span>
                    <span className="text-xs text-muted-foreground">
                        Total: {formatRupees(totalAmount)}
                    </span>
                </div>
            </div>

            <Separator orientation="vertical" className="h-10" />

            {/* Cart status indicator */}
            {itemsInCart > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Archive className="h-3 w-3" />
                    <span>{itemsInCart} in cart</span>
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2">
                <TooltipProvider>
                    {/* Add to cart button */}
                    {itemsNotInCart > 0 && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="sm"
                                    onClick={handleAddToCart}
                                    className="gap-2"
                                >
                                    <Plus className="h-4 w-4" />
                                    <span className="hidden sm:inline">Add to Cart</span>
                                    <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                                        {itemsNotInCart}
                                    </Badge>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                Add {itemsNotInCart} selected {itemType}{itemsNotInCart !== 1 ? 's' : ''} to batch cart
                            </TooltipContent>
                        </Tooltip>
                    )}

                    {/* Remove from cart button */}
                    {itemsInCart > 0 && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleRemoveFromCart}
                                    className="gap-2"
                                >
                                    <Minus className="h-4 w-4" />
                                    <span className="hidden sm:inline">Remove</span>
                                    <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                                        {itemsInCart}
                                    </Badge>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                Remove {itemsInCart} {itemType}{itemsInCart !== 1 ? 's' : ''} from cart
                            </TooltipContent>
                        </Tooltip>
                    )}

                    {/* Create batch button */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="sm"
                                variant="default"
                                onClick={handleAddAndOpenCart}
                                className="gap-2 bg-gradient-to-r from-primary to-primary/80"
                            >
                                <Archive className="h-4 w-4" />
                                <span className="hidden sm:inline">Create Batch</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            Add selected items to cart and open batch management
                        </TooltipContent>
                    </Tooltip>

                    {/* Clear selection button */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={onClearSelection}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            Clear selection
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </div>
    );
}

interface QuickSelectButtonsProps {
    /** All available items */
    items: CartItemType[];
    /** Current filter body for context */
    filterBody?: Record<string, any>;
    /** Callback when items should be selected */
    onSelectItems: (items: CartItemType[]) => void;
    /** Callback to clear selection */
    onClearSelection: () => void;
    /** Currently selected items */
    selectedItems: CartItemType[];
    /** Type of items */
    itemType: 'bill' | 'recharge';
    className?: string;
}

/**
 * Quick selection buttons for batch operations
 * Provides one-click selection for common categories
 */
export function QuickSelectButtons({
    items,
    onSelectItems,
    onClearSelection,
    selectedItems,
    itemType,
    className
}: QuickSelectButtonsProps) {
    const { items: cartItems, addAllItem, openModal, setBatchName } = useBatchCartStore();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    // Filter functions for different categories
    const categorizedItems = useMemo(() => {
        if (itemType === 'bill') {
            const bills = items as AllBillTableProps[];
            
            const overdue = bills.filter(bill => {
                if (!bill.due_date) return false;
                const dueDate = new Date(bill.due_date);
                return dueDate < today && !bill.batch_id && !bill.payment_status;
            });

            const dueThisWeek = bills.filter(bill => {
                if (!bill.due_date) return false;
                const dueDate = new Date(bill.due_date);
                return dueDate >= today && dueDate <= sevenDaysFromNow && !bill.batch_id && !bill.payment_status;
            });

            const withDiscount = bills.filter(bill => {
                if (!bill.discount_date) return false;
                const discountDate = new Date(bill.discount_date);
                return discountDate >= today && !bill.batch_id && !bill.payment_status;
            });

            const selectable = bills.filter(bill => 
                !bill.batch_id && !bill.payment_status && bill.approved_amount && bill.approved_amount > 0
            );

            return { overdue, dueThisWeek, withDiscount, selectable };
        } else {
            const recharges = items as PrepaidRechargeTableProps[];
            
            const dueThisWeek = recharges.filter(recharge => {
                if (!recharge.recharge_date) return false;
                const rechargeDate = new Date(recharge.recharge_date);
                return rechargeDate >= today && rechargeDate <= sevenDaysFromNow && !recharge.batch_id;
            });

            const selectable = recharges.filter(recharge => 
                !recharge.batch_id && recharge.recharge_amount && recharge.recharge_amount > 0
            );

            return { overdue: [], dueThisWeek, withDiscount: [], selectable };
        }
    }, [items, itemType, today, sevenDaysFromNow]);

    // Direct add to cart and open modal
    const handleQuickAddToCart = (category: string, categoryItems: CartItemType[]) => {
        const newItems = categoryItems.filter(
            item => !cartItems.some(cartItem => cartItem.id === item.id)
        );
        addAllItem(newItems);
        setBatchName(`${category} - ${new Date().toLocaleDateString()}`);
        openModal();
    };

    const hasOverdue = categorizedItems.overdue.length > 0;
    const hasDueThisWeek = categorizedItems.dueThisWeek.length > 0;
    const hasDiscount = categorizedItems.withDiscount.length > 0;
    const hasSelectable = categorizedItems.selectable.length > 0;
    const hasSelection = selectedItems.length > 0;

    if (!hasSelectable) {
        return null;
    }

    return (
        <div className={cn(
            "flex flex-wrap items-center gap-2 p-3 rounded-lg",
            "bg-muted/30 border border-dashed",
            className
        )}>
            <div className="flex items-center gap-2 mr-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Quick Select:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                {/* Select All */}
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onSelectItems(categorizedItems.selectable)}
                                className="gap-1.5 h-8"
                            >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                All
                                <Badge variant="secondary" className="h-5 px-1.5 text-xs ml-1">
                                    {categorizedItems.selectable.length}
                                </Badge>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            Select all {categorizedItems.selectable.length} available {itemType}s
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                {/* Overdue (Bills only) */}
                {hasOverdue && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleQuickAddToCart('Overdue Bills', categorizedItems.overdue)}
                                    className="gap-1.5 h-8 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                                >
                                    <AlertCircle className="h-3.5 w-3.5" />
                                    Overdue
                                    <Badge className="h-5 px-1.5 text-xs ml-1 bg-red-100 text-red-700 hover:bg-red-100">
                                        {categorizedItems.overdue.length}
                                    </Badge>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                Add {categorizedItems.overdue.length} overdue bills directly to batch cart
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}

                {/* Due This Week */}
                {hasDueThisWeek && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleQuickAddToCart('Due This Week', categorizedItems.dueThisWeek)}
                                    className="gap-1.5 h-8 border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                                >
                                    <Clock className="h-3.5 w-3.5" />
                                    Due This Week
                                    <Badge className="h-5 px-1.5 text-xs ml-1 bg-amber-100 text-amber-700 hover:bg-amber-100">
                                        {categorizedItems.dueThisWeek.length}
                                    </Badge>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                Add {categorizedItems.dueThisWeek.length} {itemType}s due this week to batch cart
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}

                {/* With Discount (Bills only) */}
                {hasDiscount && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleQuickAddToCart('Discount Available', categorizedItems.withDiscount)}
                                    className="gap-1.5 h-8 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                                >
                                    <CalendarDays className="h-3.5 w-3.5" />
                                    Discount Date
                                    <Badge className="h-5 px-1.5 text-xs ml-1 bg-green-100 text-green-700 hover:bg-green-100">
                                        {categorizedItems.withDiscount.length}
                                    </Badge>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                Add {categorizedItems.withDiscount.length} bills with active discount to batch cart
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}

                {/* Clear Selection */}
                {hasSelection && (
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={onClearSelection}
                        className="gap-1.5 h-8 text-muted-foreground"
                    >
                        <X className="h-3.5 w-3.5" />
                        Clear
                    </Button>
                )}
            </div>
        </div>
    );
}
