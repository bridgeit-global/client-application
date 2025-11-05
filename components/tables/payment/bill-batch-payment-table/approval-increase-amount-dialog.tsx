'use client'
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from '@/components/ui/dialog';
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell
} from '@/components/ui/table';
import { formatRupees } from '@/lib/utils/number-format';
import { Checkbox } from '@/components/ui/checkbox';
import { UploadBatchReceiptModal } from '@/components/modal/upload-batch-receipt-modal';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { Loader2 } from 'lucide-react';
import { useUtilizeAndThresholdAmount } from '@/hooks/use-utilize-amount';
import { snakeToTitle } from '@/lib/utils/string-format';

interface ApproveIncreaseAmountDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    increaseAmountRecords: any[];
}

const ApproveIncreaseAmountDialog: React.FC<ApproveIncreaseAmountDialogProps> = ({
    open,
    onOpenChange,
    increaseAmountRecords,
}) => {

    const { thresholdAmount, utilizeAmount } = useUtilizeAndThresholdAmount();
    const user = useUser();
    const supabase = createClient();
    const router = useRouter();
    const { toast } = useToast();

    // Multi-select state
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [modalRecord, setModalRecord] = useState<any | null>(null);

    const selectedRecords = increaseAmountRecords.filter(rec => selectedIds.includes(rec.bills.id));
    const isPostpaid = selectedRecords[0]?.bills?.bill_status === 'batch';

    // Loader state
    const [isLoading, setIsLoading] = useState(false);

    // Accept and Reject handlers (stub)
    const handleAccept = async () => {
        if (selectedIds.length === 0) return;
        setIsLoading(true);
        try {
            // Filter only selected records
            const selectedRecords = increaseAmountRecords.filter(rec => selectedIds.includes(rec.bills.id));
            // Calculate total increase amount
            const amount = selectedRecords.reduce(
                (acc, rec) =>
                    rec.bill_amount &&
                        (rec.client_paid_amount > 0 || rec.bills.approved_amount > 0) &&
                        rec.bill_amount > (rec.client_paid_amount || rec.bills.approved_amount)
                        ? acc + (rec.bill_amount - (rec.client_paid_amount || rec.bills.approved_amount))
                        : acc,
                0
            );

            if (isPostpaid) {
                const allowed_amount = (utilizeAmount || 0) + amount;
                if (allowed_amount > thresholdAmount) {
                    toast({
                        variant: 'destructive',
                        title: 'Error',
                        description: `The total approved amount (${formatRupees(allowed_amount)}) exceeds your available threshold limit of ${formatRupees(thresholdAmount)}. Please contact your administrator to increase the threshold.`
                    });
                    return;
                }
                const updateResults = await Promise.all(selectedRecords.map(async (rec) => {
                    const { error } = await supabase.from('bills').update({
                        approved_amount: rec.bill_amount,
                    }).eq('id', rec.bills.id);
                    const { error: error2 } = await supabase.from('client_payments').update({
                        approval_status: 'approved',
                        updated_by: user?.id,
                    }).eq('bill_id', rec.bills.id).eq('id', rec.id);

                    if (error) {
                        throw new Error('Failed to update some bills. Please try again.');
                    }
                    if (error2) {
                        throw new Error('Failed to update some bills. Please try again.');
                    }
                }));

                let hasError = false;
                if (updateResults.some(error => error)) {
                    hasError = true;
                    toast({
                        title: 'Error',
                        description: 'Failed to update some bills. Please try again.',
                        variant: 'destructive',
                    });
                }
                if (hasError) {
                    throw new Error('Failed to update some bills. Please try again.');
                }
                setSelectedIds([]);

            } else {
                setModalRecord({
                    id: selectedRecords[0].bills.batch_id,
                    amount: amount,
                });
                setShowReceiptModal(true);
            }

        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to approve payment',
                variant: 'destructive',
            });
        } finally {
            onOpenChange(false);
            setIsLoading(false);
            router.refresh();
        }
    };

    const handleReject = async () => {
        setIsLoading(true);
        try {
            await Promise.all(selectedIds.map(async (billId) => {
                const rec = increaseAmountRecords.find(r => r.bills.id === billId);
                if (!rec) return;
                if (isPostpaid) {
                    const { error } = await supabase.from('bills').update({
                        approved_amount: null,
                        batch_id: null,
                        bill_status: 'new',
                    }).eq('id', rec.bills.id);
                    if (error) {
                        console.error('Error rejecting payments:', error);
                        toast({
                            title: 'Error',
                            description: error.message || 'Failed to reject payment',
                            variant: 'destructive',
                        });
                    }
                    const { error: error2 } = await supabase.from('client_payments').update({
                        approval_status: 'rejected',
                        updated_by: user?.id,
                    }).eq('bill_id', rec.bills.id).eq('id', rec.id);
                    if (error2) {
                        console.error('Error rejecting payments:', error2);
                        toast({
                            title: 'Error',
                            description: error2.message || 'Failed to reject payment',
                            variant: 'destructive',
                        });
                    }
                } else {
                    const { error } = await supabase.from('client_payments').update({
                        status: 'reverse',
                        updated_by: user?.id,
                        approval_status: 'rejected',
                    }).eq('bill_id', billId).eq('id', rec.id);
                    if (error) {
                        console.error('Error rejecting payments:', error);
                        toast({
                            title: 'Error',
                            description: error.message || 'Failed to reject payment',
                            variant: 'destructive',
                        });
                    }
                }
            }));
            toast({
                title: 'Success',
                description: 'Payment rejected successfully',
                variant: 'success',
            });
        } finally {
            onOpenChange(false);
            setIsLoading(false);
            setSelectedIds([]);
            router.refresh();
        }
    };

    // Select all logic
    const allIds = increaseAmountRecords.map((rec) => rec.bills.id);
    const isAllSelected = allIds.length > 0 && selectedIds.length === allIds.length;
    const isIndeterminate = selectedIds.length > 0 && selectedIds.length < allIds.length;

    // Set indeterminate state on the input inside the Checkbox
    useEffect(() => {
        const selectAllInput = document.getElementById('select-all-checkbox') as HTMLInputElement | null;
        if (selectAllInput) {
            selectAllInput.indeterminate = isIndeterminate;
        }
    }, [isIndeterminate]);

    const handleSelectAll = (checked: boolean) => {
        if (isLoading) return;
        setSelectedIds(checked ? allIds : []);
    };
    const handleSelectOne = (billId: string, checked: boolean) => {
        if (isLoading) return;
        setSelectedIds((prev) =>
            checked ? [...prev, billId] : prev.filter((sid) => sid !== billId)
        );
    };

    // Helper to calculate increase amount and percent
    function getIncreaseInfo(rec: any) {
        const bill = rec.bill_amount;
        const paid = rec.client_paid_amount || rec.bills.approved_amount;
        if (typeof bill === 'number' && typeof paid === 'number' && bill > paid && paid > 0) {
            const diff = bill - paid;
            const percent = (diff / paid) * 100;
            return `+${formatRupees(diff)} (${percent.toFixed(1)}%)`;
        }
    }

    const payBills = async ({
        batchId,
        transactionReference,
        paymentMode,
        remarks,
        amount,
        transactionDate,
    }: {
        batchId: string;
        transactionReference: string;
        paymentMode: string;
        remarks: string;
        amount: number;
        transactionDate: string;
    }) => {
        setIsLoading(true);
        try {
            const selectedRecords = increaseAmountRecords.filter(rec => selectedIds.includes(rec.bills.id));
            const billIds = selectedRecords.map(rec => rec.bills.id);
            const { error } = await supabase.from('client_payments').update({
                updated_by: user?.id,
                approval_status: 'approved',
            }).in('bill_id', billIds).eq('remarks', 'bill_amount_change');
            if (error) {
                console.error('Error approving payments:', error);
                toast({
                    title: 'Error',
                    description: error.message || 'Failed to approve payment',
                    variant: 'destructive',
                });
                return;
            }

            selectedRecords.forEach(async (rec) => {
                const { error: error2 } = await supabase.from('bills').update({
                    approved_amount: rec.bill_amount,
                }).eq('id', rec.bills.id);
                if (error2) {
                    console.error('Error approving payments:', error2);
                    toast({
                        title: 'Error',
                        description: error2.message || 'Failed to approve payment',
                        variant: 'destructive',
                    });
                }
            });

            const response = await fetch('/api/batch/pay', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    batchId,
                    transactionReference,
                    paymentMode,
                    remarks,
                    amount,
                    payType: 'postpaid',
                    transaction_pay_type: 'bill_amount_change',
                    transactionDate,
                }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to process payment');

            router.refresh();
            toast({
                title: 'Success',
                description: 'Payment made successfully',
                variant: 'success',
            });
            setSelectedIds([]);
            setShowReceiptModal(false);
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to process payment',
                variant: 'destructive',
            });
        } finally {
            setSelectedIds([]);
            setShowReceiptModal(false);
            onOpenChange(false);
            setIsLoading(false);
        }
    };


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-screen-lg">
                <DialogHeader>
                    <DialogTitle>Increase Amounts</DialogTitle>
                </DialogHeader>
                <DialogDescription>Review and approve or reject increased payment records.</DialogDescription>
                {/* Accept/Reject buttons when rows are selected */}
                {selectedIds.length > 0 && (
                    <div className="flex gap-2 mb-4">
                        <Button variant="default" onClick={handleAccept} disabled={isLoading}>
                            {isLoading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                            Accept
                        </Button>
                        <Button variant="destructive" onClick={handleReject} disabled={isLoading}>
                            {isLoading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                            Reject
                        </Button>
                    </div>
                )}
                <div className="p-2 sm:p-4 relative">
                    {isLoading && (
                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
                            <Loader2 className="animate-spin w-8 h-8 text-primary" />
                        </div>
                    )}
                    {/* Desktop/tablet table */}
                    <div className={`w-full overflow-x-auto hidden sm:block ${isLoading ? 'pointer-events-none opacity-60' : ''}`}>
                        {increaseAmountRecords && increaseAmountRecords.length > 0 ? (
                            <Table className="min-w-[800px] w-full text-sm">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>
                                            <Checkbox
                                                id="select-all-checkbox"
                                                checked={isAllSelected}
                                                onCheckedChange={handleSelectAll}
                                                aria-label="Select all"
                                            />
                                        </TableHead>
                                        <TableHead>Account Number</TableHead>
                                        <TableHead>Bill Amount</TableHead>
                                        <TableHead>{isPostpaid ? 'Approved Amount' : 'Client Paid Amount'}</TableHead>
                                        <TableHead>Increase Amount (%)</TableHead>
                                        <TableHead>Remarks</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {increaseAmountRecords.map((rec) => (
                                        <TableRow key={rec.bills.id}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedIds.includes(rec.bills.id)}
                                                    onCheckedChange={checked => handleSelectOne(rec.bills.id, !!checked)}
                                                    aria-label={`Select record ${rec.bills.id}`}
                                                    disabled={isLoading}
                                                />
                                            </TableCell>
                                            <TableCell>{rec.bills?.connections?.account_number || '-'}</TableCell>
                                            <TableCell>{formatRupees(rec.bill_amount ?? '-')}</TableCell>
                                            <TableCell>{isPostpaid ? formatRupees(rec.bills?.approved_amount ?? '-') : formatRupees(rec.client_paid_amount ?? '-')}</TableCell>
                                            <TableCell>{getIncreaseInfo(rec)}</TableCell>
                                            <TableCell>{snakeToTitle(rec?.remarks || '') ?? '-'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div>No records to approve.</div>
                        )}
                    </div>
                    {/* Mobile card list */}
                    <div className={`sm:hidden space-y-4 ${isLoading ? 'pointer-events-none opacity-60' : ''}`}>
                        {increaseAmountRecords && increaseAmountRecords.length > 0 ? (
                            increaseAmountRecords.map((rec) => (
                                <div key={rec.bills.id} className="rounded-lg border p-4 shadow-sm bg-white flex flex-col gap-2">
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>ID</span>
                                        <span>{rec.bills.id}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Account Number</span>
                                        <span className="font-medium">{rec.bills?.connections?.account_number || '-'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Biller Board</span>
                                        <span className="font-medium">{rec.bills?.connections?.biller_list?.board_name || '-'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Bill Amount</span>
                                        <span className="font-medium">{rec.bill_amount ?? '-'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Client Paid Amount</span>
                                        <span className="font-medium">{rec.client_paid_amount ?? '-'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Increase Amount (%)</span>
                                        <span className="font-medium">{getIncreaseInfo(rec)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Remarks</span>
                                        <span className="font-medium">{rec.remarks ?? '-'}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div>No records to approve.</div>
                        )}
                    </div>
                </div>
            </DialogContent>
            {modalRecord && (
                <UploadBatchReceiptModal
                    isOpen={showReceiptModal}
                    onClose={() => setShowReceiptModal(false)}
                    id={modalRecord.id}
                    amount={modalRecord.amount}
                    payBills={({ transactionReference, paymentMode, remarks, transactionDate }) => payBills({
                        batchId: modalRecord.id,
                        transactionReference,
                        paymentMode,
                        remarks,
                        amount: modalRecord.amount,
                        transactionDate: transactionDate || new Date().toISOString().slice(0, 10),
                    })}
                />
            )}
        </Dialog>
    );
};

export default ApproveIncreaseAmountDialog; 