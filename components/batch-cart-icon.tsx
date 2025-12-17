'use client';

import { useState, useEffect, useMemo } from 'react';
import { Archive, X, ShoppingCart, Plus, Trash2, FolderOpen, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
import { formatRupees } from '@/lib/utils/number-format';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { ddmmyy } from '@/lib/utils/date-format';
import { useToast } from './ui/use-toast';
import { useBatchCartStore } from '@/lib/store/batch-cart-store';
import type { CartItem } from '@/lib/store/batch-cart-store';
import { Input } from './ui/input';
import { useRouter } from 'next/navigation';
import { useSiteName } from '@/lib/utils/site';
import { AllBillTableProps } from '@/types/bills-type';
import { PrepaidRechargeTableProps } from '@/types/connections-type';
import { DueDateCell } from './table-cells/due-date-cell';
import { SiteAccountBoardCell } from './table-cells/site-account-board-cell';
import TodaysPayableAmountCell from './table-cells/todays-payable-amount-cell';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { useUserStore } from '@/lib/store/user-store';

type CartItemType = AllBillTableProps | PrepaidRechargeTableProps;

interface BillTableProps {
    items: CartItemType[];
    removeItem: (id: string) => void;
}

interface ExistingBatchProps {
    batches: any[];
    onAddToBatch: (batchId: string, items?: CartItemType[]) => void;
    isLoading: boolean;
}

interface BatchCartIconProps {
    fetchData?: () => void;
}

function SelectedBillTable({
    removeItem,
    items
}: BillTableProps) {
    const site_name = useSiteName();

    const isBillType = (item: CartItemType): item is AllBillTableProps => {
        return 'due_date' in item && 'approved_amount' in item;
    };

    const isPrepaidType = (item: CartItemType): item is PrepaidRechargeTableProps => {
        return 'recharge_date' in item && 'recharge_amount' in item;
    };

    const getTableHeaders = () => {
        // Determine headers based on the first item's structure
        if (items.length === 0) {
            return [
                { label: site_name, width: 'w-[25%]' },
                { label: 'Due Date', width: 'w-[20%]' },
                { label: "Today's Amount", width: 'w-[20%]' },
                { label: 'Approved Amount', width: 'w-[25%]' },
                { label: 'Action', width: 'w-[10%] text-right' }
            ];
        }

        const firstItem = items[0];
        if ('recharge_amount' in firstItem) {
            // Prepaid recharge
            return [
                { label: `${site_name} ID`, width: 'w-[20%]' },
                { label: 'Account Number', width: 'w-[25%]' },
                { label: 'Recharge Date', width: 'w-[20%]' },
                { label: 'Recharge Amount', width: 'w-[25%]' },
                { label: 'Action', width: 'w-[10%] text-right' }
            ];
        } else {
            // Bill or submeter
            return [
                { label: site_name, width: 'w-[25%]' },
                { label: 'Due Date', width: 'w-[20%]' },
                { label: "Today's Amount", width: 'w-[20%]' },
                { label: 'Approved Amount', width: 'w-[25%]' },
                { label: 'Action', width: 'w-[10%] text-right' }
            ];
        }
    };

    const getEmptyStateMessage = () => {
        if (items.length === 0) {
            return { title: 'No items selected', subtitle: 'Add items to create a batch' };
        }

        const firstItem = items[0];
        if ('recharge_amount' in firstItem) {
            return { title: 'No recharges selected', subtitle: 'Add recharges to create a batch' };
        } else {
            return { title: 'No bills selected', subtitle: 'Add bills to create a batch' };
        }
    };

    const renderTableCell = (item: CartItemType, index: number) => {
        if (isBillType(item)) {
            switch (index) {
                case 0:
                    return <SiteAccountBoardCell row={{ original: item }} />;
                case 1:
                    return <div className="flex flex-col gap-1">
                        <p className="text-xs text-muted-foreground">
                            Due Date
                        </p>
                        <p className="text-sm font-semibold">
                            <DueDateCell discount_date_str={item.discount_date} due_date_str={item.due_date} is_active={isBillType(item) ? item.is_active : true} />
                        </p>
                    </div>;
                case 2:
                    return <div className="flex flex-col gap-1">
                        <p className="text-xs text-muted-foreground">
                            Today&apos;s Amount
                        </p>
                        <p className="text-sm font-semibold">
                            <TodaysPayableAmountCell bill={item} />
                        </p>
                    </div>;
                case 3:
                    return <div className="flex flex-col gap-1">
                        <p className="text-xs text-muted-foreground">
                            Approved Amount
                        </p>
                        <p className="font-semibold">
                            {formatRupees(item.approved_amount)}
                        </p>
                    </div>;
                default:
                    return null;
            }
        } else if (isPrepaidType(item)) {
            switch (index) {
                case 0:
                    return <SiteAccountBoardCell row={{ original: item }} />;
                case 1:
                    return <div className="flex flex-col gap-1">
                        <p className="text-xs text-muted-foreground">
                            Recharge Date
                        </p>
                        <p className="text-sm font-semibold">
                            <DueDateCell due_date_str={item.recharge_date} is_active={isPrepaidType(item) ? (item.is_active ?? true) : true} />
                        </p>
                    </div>;
                case 2:
                    return <div className="flex flex-col gap-1">
                        <p className="text-xs text-muted-foreground">
                            Recharge Amount
                        </p>
                        <p className="text-sm font-semibold text-primary">
                            {formatRupees(item.recharge_amount)}
                        </p>
                    </div>;
                case 3:
                    return <div className="flex flex-col gap-1">
                        <p className="text-xs text-muted-foreground">
                            Approved Amount
                        </p>
                        <p className="text-sm font-semibold text-primary">
                            {formatRupees(item.recharge_amount)}
                        </p>
                    </div>;
                default:
                    return null;
            }
        }
        return null;
    };

    const headers = getTableHeaders();
    const emptyState = getEmptyStateMessage();

    return (
        <div className="max-h-[35vh] sm:max-h-[40vh] overflow-y-auto rounded-lg border bg-background">
            <div className="min-w-full overflow-x-auto">
                <Table>
                    <TableHeader className="sticky top-0 bg-muted/50 backdrop-blur-sm">
                        <TableRow className="hover:bg-muted/30 border-b">
                            <TableHead className="font-semibold text-xs sm:text-sm px-3 sm:px-4 py-3 w-[25%]">
                                {site_name}
                            </TableHead>
                            <TableHead className="font-semibold text-xs sm:text-sm px-3 sm:px-4 py-3 w-[20%]">
                                Date
                            </TableHead>
                            <TableHead className="font-semibold text-xs sm:text-sm px-3 sm:px-4 py-3 w-[20%]">
                                Amount
                            </TableHead>
                            <TableHead className="font-semibold text-xs sm:text-sm px-3 sm:px-4 py-3 w-[25%]">
                                Approved Amount
                            </TableHead>
                            <TableHead className="font-semibold text-xs sm:text-sm px-3 sm:px-4 py-3 w-[10%] text-right">
                                Action
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={headers.length} className="text-center py-12">
                                    <div className="flex flex-col items-center space-y-3 text-muted-foreground">
                                        <div className="p-3 rounded-full bg-muted/50">
                                            <ShoppingCart className="h-8 w-8" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium">{emptyState.title}</p>
                                            <p className="text-xs">{emptyState.subtitle}</p>
                                        </div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            items.map((item, index) => (
                                <TableRow
                                    key={item.id}
                                    className="hover:bg-muted/30 transition-colors border-b last:border-b-0"
                                >
                                    <TableCell className="text-xs sm:text-sm px-3 sm:px-4 py-3 w-[25%]">
                                        {renderTableCell(item, 0)}
                                    </TableCell>
                                    <TableCell className="text-xs sm:text-sm px-3 sm:px-4 py-3 w-[20%]">
                                        {renderTableCell(item, 1)}
                                    </TableCell>
                                    <TableCell className="text-xs sm:text-sm px-3 sm:px-4 py-3 w-[20%]">
                                        {renderTableCell(item, 2)}
                                    </TableCell>
                                    <TableCell className="text-xs sm:text-sm px-3 sm:px-4 py-3 w-[25%]">
                                        {renderTableCell(item, 3)}
                                    </TableCell>
                                    <TableCell className="w-[10%] text-right px-3 sm:px-4 py-3">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeItem(item.id)}
                                            aria-label={`Remove ${'recharge_amount' in item ? 'recharge' : 'bill'} from cart`}
                                            className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

function ExistingBatchesTable({ batches, onAddToBatch, isLoading }: ExistingBatchProps) {
    const getBatchStatus = (batch: any) => {
        if (batch.batch_status === 'processing') return { label: 'Processing', variant: 'secondary' as const };
        if (batch.batch_status === 'paid') return { label: 'Paid', variant: 'default' as const };
        return { label: 'Unpaid', variant: 'outline' as const };
    };

    const getBatchValidityStatus = (validateAt: string) => {
        const today = new Date();
        const validityDate = new Date(validateAt);
        const isExpired = today > validityDate;
        return isExpired ? { label: 'Expired', variant: 'destructive' as const } : { label: 'Valid', variant: 'default' as const };
    };

    return (
        <div className="max-h-[35vh] sm:max-h-[40vh] overflow-y-auto rounded-lg border bg-background">
            <div className="min-w-full overflow-x-auto">
                <Table>
                    <TableHeader className="sticky top-0 bg-muted/50 backdrop-blur-sm">
                        <TableRow className="hover:bg-muted/30 border-b">
                            <TableHead className="font-semibold text-xs sm:text-sm px-3 sm:px-4 py-3">
                                Batch ID
                            </TableHead>
                            <TableHead className="font-semibold text-xs sm:text-sm px-3 sm:px-4 py-3">
                                Status
                            </TableHead>
                            <TableHead className="font-semibold text-xs sm:text-sm px-3 sm:px-4 py-3">
                                Validity
                            </TableHead>
                            <TableHead className="font-semibold text-xs sm:text-sm px-3 sm:px-4 py-3">
                                Created
                            </TableHead>
                            <TableHead className="font-semibold text-xs sm:text-sm px-3 sm:px-4 py-3 text-right">
                                Action
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {batches.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-12">
                                    <div className="flex flex-col items-center space-y-3 text-muted-foreground">
                                        <div className="p-3 rounded-full bg-muted/50">
                                            <FolderOpen className="h-8 w-8" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium">No existing batches</p>
                                            <p className="text-xs">Create a new batch to get started</p>
                                        </div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            batches.map((batch) => {
                                const status = getBatchStatus(batch);
                                const validityStatus = getBatchValidityStatus(batch.validate_at);

                                return (
                                    <TableRow key={batch.batch_id} className="hover:bg-muted/30 transition-colors border-b last:border-b-0">
                                        <TableCell className="text-xs sm:text-sm px-3 sm:px-4 py-3">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-mono font-semibold text-primary">
                                                    {batch.batch_id}
                                                </span>
                                                {batch.batch_name && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {batch.batch_name}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs sm:text-sm px-3 sm:px-4 py-3">
                                            <Badge
                                                variant={status.variant}
                                                className={cn(
                                                    "text-xs font-medium",
                                                    status.variant === 'default' && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                                                    status.variant === 'secondary' && "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                                )}
                                            >
                                                {status.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs sm:text-sm px-3 sm:px-4 py-3">
                                            <div className="flex flex-col gap-1">
                                                <Badge
                                                    variant={validityStatus.variant}
                                                    className={cn(
                                                        "text-xs font-medium",
                                                        validityStatus.variant === 'destructive' && "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                                    )}
                                                >
                                                    {validityStatus.label}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    {ddmmyy(batch.validate_at)}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs sm:text-sm px-3 sm:px-4 py-3">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-medium">
                                                    {ddmmyy(batch.created_at)}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(batch.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right px-3 sm:px-4 py-3">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onAddToBatch(batch.batch_id)}
                                                disabled={isLoading || batch.batch_status !== 'unpaid'}
                                                className={cn(
                                                    "text-xs transition-all duration-200",
                                                    batch.batch_status !== 'unpaid' && "opacity-50 cursor-not-allowed"
                                                )}
                                            >
                                                <Plus className="h-3 w-3 mr-1" />
                                                Add to Batch
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

export function BatchCartIcon({ fetchData }: BatchCartIconProps) {
    const { user } = useUserStore();
    const supabase = createClient();
    const router = useRouter();
    const { toast } = useToast();
    const { items, removeItem, clearCart, isModalOpen, openModal, closeModal, batchName, setBatchName } = useBatchCartStore();
    const [isLoading, setIsLoading] = useState(false);
    const [validate_at, setValidateAt] = useState('');
    const today = new Date().toISOString().split('T')[0];
    const [existingBatch, setExistingBatch] = useState<any[]>([]);
    const [isLoadingBatches, setIsLoadingBatches] = useState(false);
    const [activeTab, setActiveTab] = useState('cart');

    const getExistingBatch = async () => {
        setIsLoadingBatches(true);
        try {
            const { data, error } = await supabase
                .from('batches')
                .select('*,bills(id),prepaid_recharge(id)')
                .eq('batch_status', 'unpaid')
                .order('created_at', { ascending: false })
                .or('bills.not.is.null,prepaid_recharge.not.is.null');

            if (error) {
                console.error('Error fetching existing batch:', error);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Failed to fetch existing batches'
                });
            } else {
                setExistingBatch(data || []);
            }
        } catch (error) {
            console.error('Error fetching existing batch:', error);
        } finally {
            setIsLoadingBatches(false);
        }
    }

    useEffect(() => {
        getExistingBatch();
    }, []);

    const minDate = useMemo(() => {
        if (items.length === 0) return '';

        return items.reduce<string>((min, item) => {
            let date: string | undefined;

            if ('due_date' in item) {
                date = item.due_date;
            } else if ('recharge_date' in item) {
                date = item.recharge_date;
            }

            return !min || (date && date < min) ? date || min : min;
        }, '');
    }, [items]);

    useEffect(() => {
        if (minDate) {
            const isOverdue = minDate < today;
            setValidateAt(isOverdue ? today : minDate);
        }
    }, [minDate, today]);

    const totalAmount = items.reduce((acc, item: CartItem) => {
        if ('approved_amount' in item) {
            return acc + (item.approved_amount || 0);
        } else if ('recharge_amount' in item) {
            return acc + (item.recharge_amount || 0);
        }
        return acc;
    }, 0);

    const handleCreateBatch = async () => {
        try {
            setIsLoading(true);
            const data = items.map((item: CartItem) => ({ id: item.id, paytype: item.connections?.paytype }));
            const body = { data, batchName, validate_at };
            const response = await fetch('/api/batch/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                toast({
                    variant: 'success',
                    title: 'Success',
                    description: 'Batch created successfully'
                });

                clearCart();
                closeModal();
                fetchData?.();
                getExistingBatch(); // Refresh existing batches
                const responseData = await response.json();
                router.push(`/portal/batch?batch_id=${responseData.batch_id}`);
            } else {
                const error = await response.json();
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: error.message || 'Error creating batch'
                });
            }
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'An unexpected error occurred'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddToExistingBatch = async (batchId: string, itemsToAdd: CartItemType[] = []) => {


        // Use cart items if no specific items provided
        const itemsToProcess = itemsToAdd.length > 0 ? itemsToAdd : items;

        if (itemsToProcess.length === 0) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'No items to add to batch'
            });
            return;
        }

        try {
            setIsLoading(true);

            // Separate bills and recharges
            const bills = itemsToProcess.filter(item => 'approved_amount' in item);
            const recharges = itemsToProcess.filter(item => 'recharge_amount' in item);

            const billIds = bills.map(item => item.id);
            const rechargeIds = recharges.map(item => item.id);

            // Use API route to handle updates in chunks and avoid timeouts
            const response = await fetch('/api/batch/add-items', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    batchId,
                    billIds,
                    rechargeIds
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to add items to batch');
            }

            toast({
                variant: 'success',
                title: 'Success',
                description: `${itemsToProcess.length} item(s) added to batch ${batchId}`
            });

            clearCart();
            closeModal();
            fetchData?.();
            getExistingBatch(); // Refresh existing batches
            router.push(`/portal/batch/${batchId}`);
        } catch (error: any) {
            console.error('Error adding items to batch:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Failed to add items to batch'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const getModalTitle = () => {
        return `Batch Management (${items.length} items)`;
    };

    return (
        <>
            {/* Cart Button */}
            <div className="relative">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={openModal}
                    className={cn(
                        "relative w-10 h-10 sm:w-11 sm:h-11",
                        "rounded-lg transition-all duration-200",
                        "hover:bg-secondary/50 hover:scale-105 active:scale-95",
                        "group shadow-sm hover:shadow-md",
                        items.length > 0 && "ring-2 ring-primary/20"
                    )}
                    aria-label="View batch cart"
                >
                    <Archive className={cn(
                        "w-5 h-5 sm:w-6 sm:h-6",
                        "transition-all duration-200",
                        "group-hover:scale-110 group-hover:text-primary"
                    )} />

                    {/* Cart Badge */}
                    {items.length > 0 && (
                        <Badge
                            variant="destructive"
                            className={cn(
                                "absolute -top-2 -right-2",
                                "h-5 w-5 sm:h-6 sm:w-6",
                                "flex items-center justify-center",
                                "text-xs font-bold text-white",
                                "animate-pulse",
                                "bg-gradient-to-r from-red-500 to-red-600",
                                "border-2 border-background",
                                "shadow-lg"
                            )}
                        >
                            {items.length > 99 ? '99+' : items.length}
                        </Badge>
                    )}
                </Button>
            </div>

            {/* Cart Modal */}
            <Dialog open={isModalOpen} onOpenChange={closeModal}>
                <DialogContent className={cn(
                    "sm:max-w-4xl lg:max-w-6xl max-h-[90vh] w-[95vw]",
                    "p-0 overflow-hidden"
                )}>
                    <DialogHeader className="px-4 sm:px-6 py-4 sm:py-5 border-b bg-gradient-to-r from-muted/30 to-muted/50">
                        <DialogTitle className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-lg sm:text-xl font-semibold">{getModalTitle()}</span>
                                    <span className="text-xs sm:text-sm text-muted-foreground">
                                        Manage your batch items and existing batches
                                    </span>
                                </div>
                            </div>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-hidden flex flex-col">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
                            <div className="px-4">
                                <TabsList className="grid w-full grid-cols-2 bg-muted/50">
                                    <TabsTrigger
                                        value="cart"
                                        className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
                                    >
                                        <ShoppingCart className="h-4 w-4" />
                                        <span className="hidden sm:inline">Cart Items</span>
                                        <span className="sm:hidden">Cart</span>
                                        {items.length > 0 && (
                                            <Badge variant="secondary" className="h-5 w-5 p-0 text-xs">
                                                {items.length}
                                            </Badge>
                                        )}
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="existing"
                                        className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
                                    >
                                        <FolderOpen className="h-4 w-4" />
                                        <span className="hidden sm:inline">Existing Batches</span>
                                        <span className="sm:hidden">Batches</span>
                                        {existingBatch.length > 0 && (
                                            <Badge variant="secondary" className="h-5 w-5 p-0 text-xs">
                                                {existingBatch.length}
                                            </Badge>
                                        )}
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <TabsContent value="cart" className="mt-4 px-4 sm:px-6 flex-1 flex flex-col">
                                <div className="flex-1 overflow-hidden">
                                    <SelectedBillTable
                                        removeItem={removeItem}
                                        items={items}
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="existing" className="mt-4 px-4 sm:px-6 flex-1 flex flex-col">
                                <div className="flex-1 overflow-hidden">
                                    {isLoadingBatches ? (
                                        <div className="flex items-center justify-center py-12">
                                            <div className="flex flex-col items-center space-y-3">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                                <span className="text-sm text-muted-foreground">Loading batches...</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <ExistingBatchesTable
                                            batches={existingBatch}
                                            onAddToBatch={handleAddToExistingBatch}
                                            isLoading={isLoading}
                                        />
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Footer Actions */}
                    <DialogFooter className="px-4 sm:px-6 py-3 sm:py-4 border-t bg-muted/30 gap-2 sm:gap-3 flex-shrink-0">
                        {/* Total Amount Section - Only show for cart tab */}
                        {activeTab === 'cart' && items.length > 0 && (
                            <div className="flex-1 grid grid-cols-4 gap-4 items-center justify-center">
                                <div className="space-y-2">
                                    <label htmlFor="batchName" className="text-sm font-medium text-foreground">
                                        Batch Name
                                    </label>
                                    <Input
                                        id="batchName"
                                        placeholder="Enter a descriptive batch name..."
                                        value={batchName}
                                        onChange={(e) => setBatchName(e.target.value)}
                                        className="w-full focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        disabled={isLoading}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Give your batch a meaningful name for easy identification
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="validate_at" className="text-sm font-medium text-foreground">
                                        Validation Date
                                    </label>
                                    <Input
                                        id="validate_at"
                                        max={minDate as string}
                                        disabled={minDate < today || isLoading}
                                        type="date"
                                        value={validate_at}
                                        onChange={(e) => setValidateAt(e.target.value)}
                                        className={cn(
                                            "w-full focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all",
                                            (minDate < today || isLoading) && "opacity-50 cursor-not-allowed"
                                        )}
                                    />
                                    {minDate < today && (
                                        <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            Using today&apos;s date due to overdue items
                                        </p>
                                    )}
                                </div>
                                {/* Total Amount Display */}
                                <div className="flex items-center justify-between gap-4 px-4  bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20 mb-4">
                                    <div className="flex-1 p-2">
                                        <p className="font-bold">
                                            Total: {formatRupees(totalAmount)}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            After applying all applicable rebates
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <span>{items.length} item{items.length !== 1 ? 's' : ''}</span>
                                    </div>
                                </div>
                                <div className="flex flex-row gap-2 sm:gap-3 items-end">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            clearCart();
                                            router.refresh();
                                            setBatchName('');
                                            closeModal();
                                        }}
                                        size="sm"
                                        disabled={isLoading}
                                        className="flex-1 sm:flex-none"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Clear Cart
                                    </Button>
                                    <Button
                                        disabled={isLoading || items.length === 0}
                                        onClick={() => {
                                            handleCreateBatch();
                                            setBatchName('');
                                        }}
                                        size="sm"
                                        className="flex-1 sm:flex-none bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
                                    >
                                        {isLoading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                                Creating Batch...
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="h-4 w-4 mr-2" />
                                                Create Batch
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Existing Batches Tab Actions */}
                        {activeTab === 'existing' && (
                            <div className="w-full flex justify-center">
                                <Button
                                    variant="outline"
                                    onClick={() => setActiveTab('cart')}
                                    size="sm"
                                    className="flex items-center gap-2"
                                >
                                    <ShoppingCart className="h-4 w-4" />
                                    Back to Cart
                                </Button>
                            </div>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
