'use client';
import { AllBillTableProps, SingleBillProps } from '@/types/bills-type';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { ddmmyy, timeAgo } from '@/lib/utils/date-format';
import { snakeToTitle } from '@/lib/utils/string-format';
import { formatRupees } from '@/lib/utils/number-format';
import { DaysToPayCell } from '../table-cells/days-to-pay-cell';
import { Button } from '../ui/button';
import { useSidebar } from '../ui/sidebar';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { UnifiedCharges } from './UnifiedCharges';
import { Tabs, TabsList, TabsContent, TabsTrigger } from '@/components/ui/tabs';
import { useBatchCartStore } from '@/lib/store/batch-cart-store';
import BillTypeCell from '../table-cells/bill-type-cell';
import { DueDateCell } from '../table-cells/due-date-cell';
import StatusBadge from '../badges/status-badge';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import DisconnectionDateCell from '../table-cells/disconnection-date-cell';
import { SiteAccountBoardCell } from '../table-cells/site-account-board-cell';
interface BillDetailsProps {
    bill: SingleBillProps | null;
}

interface ChargeType {
    [key: string]: number | string;
}

interface ChargesState {
    core: ChargeType;
    regulatory: ChargeType;
    adherence: ChargeType;
    additional: ChargeType;
}

interface ApprovedLogsUpdate {
    table: string;
    data: Record<string, number | string>;
    id: string;
}

interface ApprovedLogs {
    approved_by: string;
    updates: ApprovedLogsUpdate[];
    approved_at: string;
    approved_amount: string;
    bill_id: string;
}

interface BillApprovedLogs {
    id: string;
    approved_logs: {
        current: ApprovedLogs;
        history: ApprovedLogs[];
    };
}

// Add new function to calculate total charges
const calculateTotalCharges = (
    chargeTypes: readonly string[],
    currentCharges: ChargesState | null,
    customFieldsChanges: { [key: string]: ChargeType } | null,
    bill: SingleBillProps | null
): number => {
    // Calculate total from all charge types
    const chargesTotal = chargeTypes.reduce((total, type) => {
        const chargeKey = `${type}_charges` as keyof SingleBillProps;
        const existingCharges = (bill?.[chargeKey] as ChargeType) || {};
        const updatedCharges = currentCharges?.[type as keyof ChargesState] || {};
        const customCharges = customFieldsChanges?.[type] || {};

        // Combine existing and updated charges, with updates taking precedence
        const finalCharges = { ...existingCharges, ...updatedCharges, ...customCharges };


        return total + Object.entries(finalCharges).reduce((sum, [key, value]) => {
            // Skip metadata fields and only sum numeric values
            if (['created_at', 'updated_at', 'id'].includes(key)) return sum;
            // Treat specific fields as negative adjustments
            const negativeKeys = new Set(['tod_rebate', 'interest_on_sd', 'rebate_subsidy', 'power_factor_incentive']);
            const numericValue = typeof value === 'number' ? value : 0;
            return sum + (negativeKeys.has(key) ? -numericValue : numericValue);
        }, 0);
    }, 0);

    let finalTotal = chargesTotal;
    const currentDate = new Date(new Date().toISOString().split('T')[0]);

    const discountDate = bill?.discount_date ? new Date(bill.discount_date) : null;
    const dueDate = bill?.due_date ? new Date(bill.due_date) : null;
    const dueDateRebate = bill?.due_date_rebate || 0;
    const discountDateRebate = bill?.discount_date_rebate || 0;

    if (dueDate && currentDate > dueDate && bill?.penalty_amount) {
        finalTotal += bill.penalty_amount;
    }

    if (dueDate && currentDate <= dueDate) {
        finalTotal -= dueDateRebate;
    }

    if (discountDate && currentDate <= discountDate) {
        finalTotal -= discountDateRebate;
    }

    return finalTotal;
};

export function BillDetails({ bill }: BillDetailsProps) {
    const user = useUser()
    const { addItem, items } = useBatchCartStore()
    const { toggleSidebar, state } = useSidebar();
    const [isLoading, setIsLoading] = useState(false);
    const [currentCharges, setCurrentCharges] = useState<ChargesState | null>(null);
    const [customFieldsChanges, setCustomFieldsChanges] = useState<{ [key: string]: ChargeType } | null>(null);
    const [shouldReset, setShouldReset] = useState(false);
    const { toast } = useToast();
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createClient();
    const [isApproving, setIsApproving] = useState(false);
    const [isUnapproving, setIsUnapproving] = useState(false);
    const [isRemovingFromBatch, setIsRemovingFromBatch] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [approvedLogs, setApprovedLogs] = useState<ApprovedLogs | null>(null);
    const [approvedLogsData, setApprovedLogsData] = useState<BillApprovedLogs | null>(null);

    const isDisabled = useMemo(() => {
        return bill?.bill_status !== 'new' && bill?.payment_status !== false
    }, [bill]);

    useEffect(() => {
        if (state === 'expanded') {
            toggleSidebar();
        }
    }, []);

    const handleChargesChange = useCallback((charges: ChargesState) => {
        // Only update if there are actual changes
        const hasChanges = Object.entries(charges).some(([category, values]) => {
            const currentValues = bill?.[`${category}_charges` as keyof SingleBillProps] as ChargeType || {};
            return Object.entries(values as ChargeType).some(([key, value]) => {
                // Skip metadata fields and compare only numeric values
                if (['created_at', 'updated_at', 'id'].includes(key)) return false;
                return currentValues[key] !== value;
            });
        });

        if (hasChanges) {
            setCurrentCharges(charges);
        } else {
            setCurrentCharges(null);
        }
    }, [bill]);

    // Add calculation of pending approved amount
    const pendingApprovedAmount = useMemo(() => {
        const chargeTypes = ['core', 'regulatory', 'adherence', 'additional'] as const;
        if (currentCharges || customFieldsChanges) {
            return calculateTotalCharges(chargeTypes, currentCharges, customFieldsChanges, bill);
        }
        // If no changes, calculate total from original bill charges
        return calculateTotalCharges(chargeTypes, null, null, bill);
    }, [currentCharges, customFieldsChanges, bill]);

    // Add function to fetch approved logs
    const fetchApprovedLogs = useCallback(async () => {
        if (!bill?.id) return;

        try {
            const { data, error } = await supabase
                .from('bills_approved_logs')
                .select('*')
                .eq('id', bill.id)
                .single();

            if (error) throw error;
            if (data?.approved_logs?.current) {
                setApprovedLogs(data.approved_logs.current);
                setApprovedLogsData(data);
            }
        } catch (error) {
            console.error('Error fetching approved logs:', error);
        }
    }, [bill?.id, supabase]);

    // Fetch approved logs on component mount
    useEffect(() => {
        fetchApprovedLogs();
    }, [fetchApprovedLogs]);

    const handleSaveAndApprove = async () => {
        setIsLoading(true);
        setIsApproving(true);
        try {
            const updates: ApprovedLogsUpdate[] = [];
            let totalCharges = 0;

            // Get all charge types
            const chargeTypes = ['core', 'regulatory', 'adherence', 'additional'] as const;

            // If there are changes, use them. Otherwise, use existing data
            if (currentCharges || customFieldsChanges) {
                // Add regular charges updates
                if (currentCharges) {
                    for (const type of chargeTypes) {
                        const chargeData = currentCharges[type];
                        if (chargeData && Object.keys(chargeData).length > 0) {
                            // Filter out metadata fields and zero values
                            const filteredData = Object.entries(chargeData).reduce((acc, [key, value]) => {
                                if (!['created_at', 'updated_at', 'id'].includes(key) && Number(value) !== 0) {
                                    acc[key] = value;
                                }
                                return acc;
                            }, {} as Record<string, number | string>);

                            if (Object.keys(filteredData).length > 0) {
                                updates.push({
                                    table: `${type}_charges`,
                                    data: filteredData,
                                    id: bill?.id || ''
                                });
                            }
                        }
                    }
                }

                // Add custom fields updates
                if (customFieldsChanges) {
                    for (const [category, fields] of Object.entries(customFieldsChanges)) {
                        const filteredData = Object.entries(fields).reduce((acc, [key, value]) => {
                            if (!['created_at', 'updated_at', 'id'].includes(key) && Number(value) !== 0) {
                                acc[key] = value;
                            }
                            return acc;
                        }, {} as Record<string, number | string>);

                        if (Object.keys(filteredData).length > 0) {
                            updates.push({
                                table: category,
                                data: filteredData,
                                id: bill?.id || ''
                            });
                        }
                    }
                }
            } else {
                // If no changes, use existing bill data
                for (const type of chargeTypes) {
                    const chargeKey = `${type}_charges` as keyof SingleBillProps;
                    const existingCharges = bill?.[chargeKey] as ChargeType;

                    if (existingCharges && Object.keys(existingCharges).length > 0) {
                        // Filter out metadata fields and zero values
                        const filteredData = Object.entries(existingCharges).reduce((acc, [key, value]) => {
                            if (!['created_at', 'updated_at', 'id'].includes(key) && Number(value) !== 0) {
                                acc[key] = value;
                            }
                            return acc;
                        }, {} as Record<string, number | string>);

                        if (Object.keys(filteredData).length > 0) {
                            updates.push({
                                table: `${type}_charges`,
                                data: filteredData,
                                id: bill?.id || ''
                            });
                        }
                    }
                }
            }

            // Calculate total charges
            totalCharges = calculateTotalCharges(chargeTypes, currentCharges, customFieldsChanges, bill);

            // Validate total charges is not zero
            if (totalCharges <= 0) {
                throw new Error('Approved amount must be greater than zero');
            }

            if (!user?.email) {
                throw new Error('User email not found');
            }

            // Prepare approved logs data
            const approvedLogsData: ApprovedLogs = {
                approved_by: user.email,
                updates: updates,
                approved_at: new Date().toISOString(),
                approved_amount: totalCharges.toFixed(2),
                bill_id: bill?.id || ''
            };

            // Get existing logs first
            const { data: existingLogsData } = await supabase
                .from('bills_approved_logs')
                .select('*')
                .eq('id', bill?.id)
                .single();

            // Prepare the new approved logs structure
            const newApprovedLogs = {
                current: approvedLogsData,
                history: existingLogsData?.approved_logs
                    ? [
                        ...(existingLogsData.approved_logs.history || []),
                        existingLogsData.approved_logs.current
                    ]
                    : []
            };

            // Save to bills_approved_logs
            const { error: updateError } = await supabase
                .from('bills_approved_logs')
                .upsert({
                    id: bill?.id,
                    approved_logs: newApprovedLogs
                });

            if (updateError) throw updateError;

            // Update bill status and approved amount
            const { error } = await supabase
                .from('bills')
                .update({
                    approved_amount: totalCharges.toFixed(2),
                    bill_status: 'approved'
                })
                .eq('id', bill?.id);

            if (error) throw error;

            // Update local state
            setApprovedLogs(approvedLogsData);
            setCurrentCharges(null);
            setCustomFieldsChanges(null);

            toast({
                title: "Success",
                description: "Bill has been saved and approved successfully.",
                variant: "success"
            });

            router.push(pathname);
            router.refresh();

        } catch (error: any) {
            console.error('Error saving and approving bill:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to save and approve bill.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
            setIsApproving(false);
        }
    };

    const handleCreateBatch = async () => {
        if (bill) {
            addItem(bill as unknown as AllBillTableProps)
            toast({
                title: "Success",
                description: "Bill has been added to cart successfully.",
                variant: "success"
            });
        }
    };

    const handleRemoveFromBatch = async () => {
        setIsRemovingFromBatch(true);
        try {
            const { error } = await supabase
                .from('bills')
                .update({
                    bill_status: 'approved',
                    batch_id: null
                })
                .eq('id', bill?.id);

            if (error) throw error;

            toast({
                title: "Success",
                description: "Bill has been removed from batch successfully.",
                variant: "success"
            });

            router.push(pathname);
            router.refresh();
        } catch (error: any) {
            console.error('Error removing from batch:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to remove bill from batch.",
                variant: "destructive"
            });
        } finally {
            setIsRemovingFromBatch(false);
        }
    };

    const handleUnApprove = async () => {
        setIsUnapproving(true);
        try {
            const { error } = await supabase
                .from('bills')
                .update({
                    bill_status: 'new',
                    approved_amount: null // Reset approved amount when unapproving
                })
                .eq('id', bill?.id);

            if (error) throw error;

            toast({
                title: "Success",
                description: "Bill has been unapproved successfully.",
                variant: "success"
            });

            // Force a hard refresh
            router.push(pathname);
            router.refresh();
        } catch (error: any) {
            console.error('Error unapproving bill:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to un-approve bill.",
                variant: "destructive"
            });
        } finally {
            setIsUnapproving(false);
        }
    };

    const handleReset = () => {
        setCurrentCharges(null);
        setCustomFieldsChanges(null);
        setShouldReset(true);
        // Reset the flag after a short delay
        setTimeout(() => setShouldReset(false), 100);
        toast({
            title: "Reset Complete",
            description: "All fields have been reset to their initial values.",
            variant: "default"
        });
    };

    const handleReject = async () => {
        setIsRejecting(true);
        try {
            const { error } = await supabase
                .from('bills')
                .update({
                    bill_status: 'rejected',
                    approved_amount: null
                })
                .eq('id', bill?.id);

            if (error) throw error;

            toast({
                title: "Success",
                description: "Bill has been rejected successfully.",
                variant: "success"
            });

            router.push(pathname);
            router.refresh();
        } catch (error: any) {
            console.error('Error rejecting bill:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to reject bill.",
                variant: "destructive"
            });
        } finally {
            setIsRejecting(false);
        }
    };

    if (!bill) {
        return <div>No bill data found</div>;
    }

    return (
        <div className="space-y-3 px-3 py-3">
            <div className="flex flex-col sm:flex-row justify-between gap-3 p-4 bg-gray-50/50 rounded-lg border-b">
                <div className='flex flex-col'>
                    <h1 className="text-lg font-bold text-gray-900">Bill Approval</h1>
                    {/* Current Status */}
                    <div>
                        <div className="mt-1">
                            <StatusBadge status={bill.bill_status} />
                        </div>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch gap-2">
                    {(() => {
                        switch (bill?.bill_status) {
                            case 'approved':
                                return (
                                    <>
                                        <Button
                                            onClick={handleUnApprove}
                                            disabled={isUnapproving}
                                            className="w-full sm:w-auto bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 flex items-center gap-2"
                                        >
                                            {isUnapproving ? (
                                                <>
                                                    <span className="loading loading-spinner loading-sm"></span>
                                                    Unapproving...
                                                </>
                                            ) : (
                                                <>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h18v18H3z" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></svg>
                                                    Un-approve Bill
                                                </>
                                            )}
                                        </Button>
                                        {
                                            !items.map((e) => e.id).includes(bill.id) && <Button
                                                onClick={handleCreateBatch}
                                                className="w-full sm:w-auto bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 flex items-center gap-2"
                                            >
                                                <>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>
                                                    Create Batch
                                                </>
                                            </Button>
                                        }
                                    </>
                                );
                            case 'batch':
                                return (
                                    <Button
                                        onClick={handleRemoveFromBatch}
                                        disabled={isRemovingFromBatch}
                                        className="w-full sm:w-auto bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 flex items-center gap-2"
                                    >
                                        {isRemovingFromBatch ? (
                                            <>
                                                <span className="loading loading-spinner loading-sm"></span>
                                                Removing from Batch...
                                            </>
                                        ) : (
                                            <>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" /><line x1="18" y1="9" x2="12" y2="15" /><line x1="12" y1="9" x2="18" y2="15" /></svg>
                                                Remove from Batch
                                            </>
                                        )}
                                    </Button>
                                );
                            case 'new':
                                return (
                                    <>
                                        <Button
                                            onClick={handleReject}
                                            disabled={isRejecting}
                                            className="w-full sm:w-auto bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 flex items-center gap-2"
                                        >
                                            {isRejecting ? (
                                                <>
                                                    <span className="loading loading-spinner loading-sm"></span>
                                                    Rejecting...
                                                </>
                                            ) : (
                                                <>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h18v18H3z" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></svg>
                                                    Reject Bill
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            onClick={handleSaveAndApprove}
                                            disabled={isApproving || isLoading}
                                            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                                        >
                                            {isApproving || isLoading ? (
                                                <>
                                                    <span className="loading loading-spinner loading-sm"></span>
                                                    Saving & Approving...
                                                </>
                                            ) : (
                                                <>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                                                    Save & Approve Bill
                                                </>
                                            )}
                                        </Button>
                                    </>
                                );
                            case 'payment':
                            case 'paid':
                                return (
                                    <Button
                                        disabled
                                        className="w-full sm:w-auto bg-gray-50 text-gray-500 cursor-not-allowed flex items-center gap-2"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" /><path d="M12 6v6l4 2" /></svg>
                                        No Actions Available
                                    </Button>
                                );
                            default:
                                return null;
                        }
                    })()}
                </div>


            </div>

            <div className="grid gap-4">
                <Card className="shadow-sm border">
                    <CardHeader className="border-b bg-gray-50/50 py-3">
                        <CardTitle className="text-gray-700 text-base">Bill Details</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 sm:p-4">
                        <div className="sm:col-span-2">
                            <p className="text-sm font-medium text-gray-500 mb-2">Connection Details</p>
                            <SiteAccountBoardCell row={{ original: bill }} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Days to Pay</p>
                            <DaysToPayCell row={{ original: bill }} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Disconnection Date</p>
                            <DisconnectionDateCell row={{ original: bill }} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Bill Number</p>
                            <p className="font-medium text-gray-900 break-all">{bill.bill_number}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Bill Amount</p>
                            <p className="font-medium text-gray-900">{formatRupees(bill.bill_amount)}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Bill Date</p>
                            <p className="font-medium text-gray-900">{ddmmyy(bill.bill_date)}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Due Date</p>
                            <DueDateCell discount_date_str={bill.discount_date} due_date_str={bill.due_date} is_active={bill.is_active} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Bill Type</p>
                            <BillTypeCell row={{ original: bill }} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Billed Units</p>
                            <p className="font-medium text-gray-900">{bill.billed_unit}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Average Consumption</p>
                            <p className="font-medium text-gray-900">
                                {(() => {
                                    const filterBill = bill.connections?.bills?.filter((b: { bill_type: string, is_valid: boolean | null }) =>
                                        b.bill_type?.toLowerCase() === 'normal' && b.is_valid === true
                                    );
                                    let totalBillUnited = 0;
                                    filterBill.forEach((b: { billed_unit: number }) => {
                                        totalBillUnited += Number(b.billed_unit);
                                    });
                                    return filterBill.length > 0 ? (totalBillUnited / filterBill.length).toFixed(2) : null;
                                })()}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Start Date</p>
                            <p className="font-medium text-gray-900">{bill.start_date && ddmmyy(bill.start_date)}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">End Date</p>
                            <p className="font-medium text-gray-900">{bill.end_date && ddmmyy(bill.end_date)}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Arrear & Penalty</p>
                            <div className="flex gap-1 text-left">
                                {(() => {
                                    const arrear = Number(bill.additional_charges?.arrears || 0);
                                    const penalty = Object.values(bill.adherence_charges || {})
                                        .filter((value): value is number => typeof value === 'number')
                                        .reduce((sum, value) => sum + value, 0);
                                    return <>
                                        {arrear !== 0 && (
                                            <Badge variant="outline" className={cn(arrear > 0 ? 'bg-destructive/10' : 'bg-success/10')}>
                                                Arrear: {formatRupees(arrear)}
                                            </Badge>
                                        )}
                                        {Number(penalty) > 0 && (
                                            <Badge variant="outline" className={cn(penalty > 0 ? 'bg-destructive/10' : 'bg-success/10')}>
                                                Penalty: {formatRupees(penalty)}
                                            </Badge>
                                        )}
                                    </>;
                                })()}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-3">
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">

                        <div className="flex flex-col items-start sm:items-end">
                            <p className={`text-sm font-medium mb-1 ${isDisabled ? 'text-gray-400' : 'text-gray-500'}`}> {bill.approved_amount ? 'Approved Amount' : 'Approval Amount'}</p>
                            <div className="flex flex-col items-start sm:items-end gap-1">
                                {/* Show applicable rebates */}
                                {(bill.discount_date && new Date(new Date().toISOString().split('T')[0]) <= new Date(bill.discount_date) && bill.discount_date_rebate && bill.discount_date_rebate > 0) ? (
                                    <p className={`text-sm ${isDisabled ? 'text-gray-400' : 'text-green-600'}`}>
                                        Discount Date Rebate: - {formatRupees(Number(bill.discount_date_rebate))}
                                    </p>
                                ) : null}
                                {(bill.due_date && new Date(new Date().toISOString().split('T')[0]) <= new Date(bill.due_date) && bill.due_date_rebate && bill.due_date_rebate > 0) ? (
                                    <p className={`text-sm ${isDisabled ? 'text-gray-400' : 'text-green-600'}`}>
                                        Due Date Rebate: - {formatRupees(Number(bill.due_date_rebate))}
                                    </p>
                                ) : null}
                                {(bill.penalty_amount && new Date(new Date().toISOString().split('T')[0]) > new Date(bill.due_date) && bill.penalty_amount > 0) ? (
                                    <p className={`text-sm ${isDisabled ? 'text-gray-400' : 'text-red-600'}`}>
                                        Penalty Amount: + {formatRupees(Number(bill.penalty_amount))}
                                    </p>
                                ) : null}
                                {/* Show total amount */}
                                <p className={`text-2xl font-bold ${isDisabled ? 'text-gray-400' : 'text-gray-900'}`}>
                                    {bill.approved_amount ? formatRupees(Number(bill.approved_amount)) : ''}
                                    {pendingApprovedAmount !== null && !bill.approved_amount && formatRupees(pendingApprovedAmount)}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                onClick={handleReset}
                                variant="outline"
                                disabled={isLoading || isDisabled}
                                size="sm"
                                className="text-gray-600 hover:text-gray-900"
                            >
                                Reset Changes
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border">
                    <UnifiedCharges
                        coreCharges={bill?.core_charges}
                        regulatoryCharges={bill?.regulatory_charges}
                        adherenceCharges={bill?.adherence_charges}
                        additionalCharges={bill?.additional_charges}
                        onChargesChange={handleChargesChange}
                        disabled={isDisabled}
                        shouldReset={shouldReset}
                    />
                </div>

                <Card className="shadow-sm border">
                    <CardHeader className="border-b bg-gray-50/50 py-3">
                        <CardTitle className="text-gray-700 text-base">Approval Status</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4">
                        <Tabs defaultValue="current" className="space-y-4">
                            <TabsList>
                                <TabsTrigger value="current">Current Status</TabsTrigger>
                                <TabsTrigger value="history">Approval History</TabsTrigger>
                            </TabsList>
                            <TabsContent value="current">
                                <div className="space-y-4">
                                    {approvedLogs && (
                                        <div className="mt-4 pt-4 border-t">
                                            <p className="text-sm font-medium text-gray-500 mb-2">Current Approval</p>
                                            <div className="text-sm space-y-2">
                                                <p className="break-all">Approved by: <span className="font-medium">{approvedLogs.approved_by}</span></p>
                                                <p>Approved on: <span className="font-medium">{ddmmyy(approvedLogs.approved_at)} ({timeAgo(approvedLogs.approved_at)})</span></p>
                                                <div className="mt-2">
                                                    <p className="font-medium mb-1">Changes Made:</p>
                                                    <div className="space-y-2">
                                                        {approvedLogs.updates.map((update, index) => (
                                                            <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                                                                <p className="font-medium">{snakeToTitle(update.table).toUpperCase()}</p>
                                                                <div>
                                                                    {(Object.entries(update.data) as [string, number | string][]).map(([key, value]) => (
                                                                        <p key={key} className="ml-2 break-all">
                                                                            {snakeToTitle(key).toUpperCase()}: {typeof value === 'number' ? formatRupees(value) : value}
                                                                        </p>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="history">
                                {approvedLogsData?.approved_logs?.history && (
                                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                                        {approvedLogsData.approved_logs.history.map((historyLog: ApprovedLogs, historyIndex: number) => (
                                            <div key={historyIndex} className="border-b last:border-0 pb-4">
                                                <div className="text-sm space-y-2">
                                                    <p className="break-all">Approved by: <span className="font-medium">{historyLog?.approved_by}</span></p>
                                                    <p>Approved on: <span className="font-medium">{ddmmyy(historyLog?.approved_at)} ({timeAgo(historyLog?.approved_at)})</span></p>
                                                    <p>Amount: <span className="font-medium">{formatRupees(Number(historyLog?.approved_amount))}</span></p>
                                                    <div className="mt-2">
                                                        <p className="font-medium mb-1">Changes Made:</p>
                                                        <div className="space-y-2">
                                                            {historyLog?.updates?.map((update: ApprovedLogsUpdate, index: number) => (
                                                                <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                                                                    <p className="font-medium">{snakeToTitle(update?.table).toUpperCase()}</p>
                                                                    <div>
                                                                        {(Object.entries(update.data) as [string, number | string][]).map(([key, value]) => (
                                                                            <p key={key} className="ml-2 break-all">
                                                                                {snakeToTitle(key).toUpperCase()}: {typeof value === 'number' ? formatRupees(value) : value}
                                                                            </p>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
} 