'use client'

import { useToast } from '@/components/ui/use-toast';
import { useUtilizeAndThresholdAmount } from '@/hooks/use-utilize-amount';
import { useUserStore } from '@/lib/store/user-store';
import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { IndianRupeeIcon, RefreshCw, Calendar, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatRupees } from '@/lib/utils/number-format';
import IconButton from '@/components/buttons/icon-button';
import { AlertModal } from '@/components/modal/alert-modal';
import { UploadBatchReceiptModal } from '@/components/modal/upload-batch-receipt-modal';
import { ddmmyy } from '@/lib/utils/date-format';
import ViewBatchButton from '@/components/buttons/view-batch-button';
import ExportButton from '@/components/buttons/export-button';

const BatchAction = ({
    hasUnresolvedBillsCount,
    isBatchExpired,
    totalAmount,
    batchId,
    batchStatus,
    batchCreatedAt,
    batchValidTill,
    totalBills,
    totalRecharges,
    totalBillsAmount,
    totalRechargesAmount,
}: {
    hasUnresolvedBillsCount: number;
    isBatchExpired: boolean;
    totalAmount: number;
    batchId: string;
    batchStatus: string;
    batchCreatedAt: string;
    batchValidTill: string;
    totalBills: number;
    totalRecharges: number;
    totalBillsAmount: number;
    totalRechargesAmount: number;
}) => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showRenewConfirm, setShowRenewConfirm] = useState(false);
    const [renewLoading, setRenewLoading] = useState(false);
    const [showPayConfirm, setShowPayConfirm] = useState(false);
    const { toast } = useToast();
    const { thresholdAmount, utilizeAmount, isLoading: isUtilizeLoading } = useUtilizeAndThresholdAmount();
    const { user } = useUserStore()
    const availableAmount = thresholdAmount - utilizeAmount;
    const isPostpaid = availableAmount >= totalAmount;

    const payBills = async ({
        transactionReference,
        paymentMode,
        remarks,
        transactionDate,
    }: {
        transactionReference: string;
        paymentMode: string;
        remarks: string;
        transactionDate: string;
    }) => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/batch/pay', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    batchId: batchId,
                    transactionReference,
                    paymentMode,
                    remarks,
                    batch_status: 'processing',
                    transactionDate,
                }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to process payment');
            router.back();
            toast({
                title: 'Success',
                description: 'Payment made successfully',
                variant: 'success',
            });
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to process payment',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleRenew = async (batchId: string) => {
        const supabase = createClient();
        const { error } = await supabase
            .from('batches')
            .update({ validate_at: new Date().toISOString(), updated_by: user?.id || null })
            .eq('batch_id', batchId);

        if (error) {
            toast({
                title: 'Error',
                description: error.message
            });
            return;
        }

        router.refresh();
        toast({
            title: 'Success',
            description: 'Batch validity renewed successfully'
        });
    };

    const handlePay = async () => {
        setIsLoading(true);
        try {
            const supabase = createClient();
            const { data, error } = await supabase.rpc('is_approved_amount_within_threshold').select().single();
            if (error) {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: error.message
                });
                return;
            }
            if (data) {
                const allowed_amount = (((data as any).total_approved ?? 0) as number) + totalAmount;
                if (allowed_amount > ((data as any).threshold as number)) {
                    toast({
                        variant: 'destructive',
                        title: 'Error',
                        description: `The total approved amount (${formatRupees(allowed_amount)}) exceeds your organization's batch threshold limit of ${formatRupees((data as any).threshold)}. Please contact your administrator to increase the threshold.`
                    });
                    return;
                }
            }
            const { error: batchError } = await supabase.from('batches').update({
                batch_status: 'processing',
                updated_by: user?.id || null
            }).eq('batch_id', batchId).select();
            if (batchError) throw new Error(batchError.message);
            window.location.reload();
            toast({
                title: 'Success',
                description: 'Batch processed successfully',
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'An error occurred while processing payment.'
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 shadow-sm">
            {/* Batch Information Section */}
            <div className="flex flex-col gap-3 min-w-0 flex-1">
                <div className="flex flex-col sm:flex-row gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        <span className="font-medium text-gray-700">Created:</span>
                        <span className="text-gray-900">{ddmmyy(batchCreatedAt || "")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="h-4 w-4 text-orange-500" />
                        <span className="font-medium text-gray-700">Valid Till:</span>
                        <span className={`font-medium ${isBatchExpired ? 'text-red-600' : 'text-gray-900'}`}>
                            {ddmmyy(batchValidTill || "")}
                        </span>
                    </div>
                </div>

                {/* Status and Amount Row */}
                <div className="flex flex-wrap items-center gap-3">
                    <Badge
                        variant={batchStatus === 'processing' ? 'info' : 'success'}
                        className="font-medium"
                    >
                        {batchStatus === 'processing' ? (
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                Processing
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                Ready
                            </div>
                        )}
                    </Badge>

                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-semibold text-md">
                            {formatRupees(totalAmount)}
                        </Badge>
                    </div>
                </div>

                {/* Batch Statistics Row */}
                <div className="flex flex-wrap items-center gap-4 text-sm">
                    {
                        totalBills > 0 && (
                            <div className="flex items-center gap-2 text-gray-600">
                                <span className="font-medium text-gray-700">Bills:</span>
                                <span className="text-gray-900 font-semibold">{totalBills}</span>
                                <span className="text-gray-500">({formatRupees(totalBillsAmount)})</span>
                            </div>
                        )
                    }
                    {
                        totalRecharges > 0 && (
                            <div className="flex items-center gap-2 text-gray-600">
                                <span className="font-medium text-gray-700">Recharges:</span>
                                <span className="text-gray-900 font-semibold">{totalRecharges}</span>
                                <span className="text-gray-500">({formatRupees(totalRechargesAmount)})</span>
                            </div>
                        )
                    }
                </div>
            </div>

            {/* Action Buttons Section */}
            <div className="flex flex-col sm:flex-row items-center gap-3 min-w-fit">
                {/* Batch ID Display */}
                <ExportButton file_name='batch_items' />
                <ViewBatchButton batchId={batchId} />
                {/* Unresolved Bills Indicator */}
                {hasUnresolvedBillsCount > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-medium text-red-700">
                            {hasUnresolvedBillsCount} unresolved bill{hasUnresolvedBillsCount > 1 ? 's' : ''}
                        </span>
                    </div>
                )}

                {/* Main Action Button */}
                <div className="relative">
                    {isBatchExpired ? (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <IconButton
                                        size='sm'
                                        icon={RefreshCw}
                                        text="Renew Batch"
                                        aria-label="Renew Batch Validity"
                                        onClick={() => setShowRenewConfirm(true)}
                                        disabled={isLoading || isUtilizeLoading}
                                        variant="outline"
                                    />
                                </TooltipTrigger>
                                <TooltipContent className="bg-gray-900 text-white p-3 rounded-lg shadow-xl">
                                    <p className="font-medium">Renew batch validity</p>
                                    <p className="text-sm text-gray-300 mt-1">Extend the expiration date</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    ) : (
                        batchStatus === 'processing' ? (
                            <div className="flex items-center gap-2 px-2 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                <span className="text-xs font-medium text-blue-700">Processing...</span>
                            </div>
                        ) : (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <IconButton
                                            size='sm'
                                            icon={IndianRupeeIcon}
                                            text={'Initiate Payment'}
                                            aria-label="Process or Pay Batch"
                                            onClick={() => {
                                                if (hasUnresolvedBillsCount > 0) {
                                                    toast({
                                                        title: 'Action Required',
                                                        description: 'Please resolve the failed bills first',
                                                        variant: 'destructive',
                                                    });
                                                    return;
                                                }

                                                if (isPostpaid) {
                                                    setShowPayConfirm(true);
                                                } else {
                                                    setIsModalOpen(true);
                                                }
                                            }}
                                            disabled={isLoading || hasUnresolvedBillsCount > 0 || isUtilizeLoading}
                                        />
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-gray-900 text-white p-3 rounded-lg shadow-xl max-w-xs">
                                        {hasUnresolvedBillsCount > 0 ? (
                                            <div>
                                                <p className="font-medium text-red-300">⚠️ Action Required</p>
                                                <p className="text-sm text-gray-300 mt-1">Resolve failed bills before proceeding</p>
                                            </div>
                                        ) : isPostpaid ? (
                                            <div>
                                                <p className="font-medium text-green-300">✅ Ready to Process</p>
                                                <p className="text-sm text-gray-300 mt-1">Process all bills in this batch</p>
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="font-medium text-blue-300">💳 Payment Required</p>
                                                <p className="text-sm text-gray-300 mt-1">Pay all bills in this batch</p>
                                            </div>
                                        )}
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )
                    )}
                </div>
            </div>

            {/* Modals */}
            <AlertModal
                isOpen={showPayConfirm}
                onClose={() => setShowPayConfirm(false)}
                onConfirm={async () => {
                    setShowPayConfirm(false);
                    handlePay();
                }}
                loading={isLoading}
                title="Process Batch"
                description="Are you sure you want to process this batch? This action cannot be undone."
            />

            <UploadBatchReceiptModal
                description="Batch amount exceeds available limit"
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                id={batchId}
                amount={totalAmount}
                payBills={({ transactionReference, paymentMode, remarks, transactionDate }) => payBills({
                    transactionReference,
                    paymentMode: paymentMode || '',
                    remarks,
                    transactionDate: transactionDate || new Date().toISOString().slice(0, 10),
                })}
            />

            <AlertModal
                isOpen={showRenewConfirm}
                onClose={() => setShowRenewConfirm(false)}
                onConfirm={async () => {
                    setRenewLoading(true);
                    await handleRenew(batchId);
                    setRenewLoading(false);
                    setShowRenewConfirm(false);
                }}
                loading={renewLoading}
                title="Renew Batch Validity"
                description="This will extend the batch expiration date. Continue?"
            />
        </div>
    )
}

export default BatchAction
