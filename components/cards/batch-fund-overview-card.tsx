'use client';
import { Skeleton } from "../ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import Icon from "../icon";
import { formatRupees } from "@/lib/utils/number-format";
import { Separator } from "../ui/separator";
import { useUtilizeAndThresholdAmount } from "@/hooks/use-utilize-amount";
import { useUserStore } from "@/lib/store/user-store";
import { UploadBatchReceiptModal } from "../modal/upload-batch-receipt-modal";
import { useState } from "react";
import { toast } from "../ui/use-toast";
import { Button } from "../ui/button";
import { createClient } from "@/lib/supabase/client";
import { DecreaseThresholdModal } from "../modal/decrease-threshold-modal";
import { Info } from "lucide-react";
import { getContextualErrorMessage, handleDatabaseError, logAndHandleDatabaseError } from "@/lib/utils/supabase-error";

export function BatchFundsOverviewCard() {
    const supabase = createClient();
    const { user } = useUserStore();
    const { thresholdAmount, utilizeAmount, isLoading: isUtilizeAmountLoading } = useUtilizeAndThresholdAmount();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDecreaseModalOpen, setIsDecreaseModalOpen] = useState(false);
    const [isIncreasing, setIsIncreasing] = useState(false);
    const [isDecreasing, setIsDecreasing] = useState(false);

    const handleIncreaseThresholdRequest = async ({
        amount,
        transactionReference,
        paymentMode,
        transactionDate
    }: {
        amount: number;
        transactionReference: string;
        paymentMode: string;
        transactionDate: string;
    }) => {
        setIsIncreasing(true);
        try {
            const { data: batch_data, error: batch_error } = await supabase
                .from('batches')
                .insert([{ batch_name: 'threshold', validate_at: new Date().toISOString().slice(0, 10), created_by: user?.id || null }])
                .select().single();

            if (batch_error) {
                const handledError = handleDatabaseError(batch_error);
                throw new Error(handledError.message);
            }

            const { error } = await supabase.from('payment_gateway_transactions').insert({
                batch_id: batch_data?.batch_id || null,
                transaction_reference: transactionReference,
                amount: amount,
                transaction_pay_type: 'threshold',
                transaction_date: transactionDate, // YYYY-MM-DD
                payment_method: paymentMode,
                payment_status: 'pending',
                payment_remarks: 'threshold_increase_request',
                created_by: user?.id || null,
            });

            if (error) {
                const errorResponse = logAndHandleDatabaseError(error, 'payment');
                throw new Error(errorResponse.message);
            }

            toast({
                variant: "success",
                title: "Limit increase request sent",
                description: "Please wait while we confirm the payment"
            });
        } catch (error) {
            const errorMessage = error instanceof Error
                ? error.message
                : getContextualErrorMessage({ code: 'default', message: 'Unknown error occurred' } as any, 'payment');

            toast({
                variant: "destructive",
                title: "Limit increase request failed",
                description: errorMessage
            });
        } finally {
            setIsIncreasing(false);
        }
    }

    const handleDecreaseThresholdRequest = async (amount: number) => {
        setIsDecreasing(true);
        try {
            const { error } = await supabase.from('payment_gateway_transactions').insert({
                amount: amount,
                transaction_pay_type: 'threshold',
                transaction_date: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
                payment_method: 'NEFT',
                payment_status: 'pending',
                payment_remarks: 'Decrease threshold request',
                created_by: user?.id || null,
            });
            if (error) {
                const errorResponse = logAndHandleDatabaseError(error, 'payment');
                throw new Error(errorResponse.message);
            }
            toast({
                variant: "success",
                title: "Decrease threshold request sent",
                description: "Please wait while we confirm the payment"
            });
        } catch (error) {
            const errorMessage = error instanceof Error
                ? error.message
                : getContextualErrorMessage({ code: 'default', message: 'Unknown error occurred' } as any, 'payment');

            toast({
                variant: "destructive",
                title: "Decrease threshold request failed",
                description: errorMessage
            });
        } finally {
            setIsDecreasing(false);
        }
    }

    return (
        isUtilizeAmountLoading ? (
            <div className="flex justify-center items-center h-full">
                <Skeleton className="h-12 w-full" />
            </div>
        ) : <div className="mb-4">
            <Card className="border-2 border-yellow-300 bg-gradient-to-r from-yellow-50 to-yellow-100">
                <CardHeader className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-2">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Icon name="Wallet" className="h-6 w-6 text-yellow-600" />
                        <CardTitle className="text-lg font-bold text-yellow-800">Funds Overview</CardTitle>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Info className="w-4 h-4 cursor-pointer text-yellow-600" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <span>
                                        <b>Utilized</b>: Amount already used/approved.<br />
                                        <b>Limit</b>: Maximum allowed for your organization.<br />
                                        <b>Available to Process</b>: Funds you can still utilize.<br />
                                        If you exceed the threshold, you may not be able to approve more batches.
                                    </span>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    {/* Progress bar visual */}
                    <div className="w-full max-w-xs md:max-w-sm">
                        <div className="h-3 w-full bg-yellow-200 rounded-full overflow-hidden">
                            <div
                                className={`h-3 rounded-full transition-all duration-500 ${utilizeAmount < thresholdAmount * 0.7
                                    ? 'bg-green-400'
                                    : utilizeAmount < thresholdAmount
                                        ? 'bg-yellow-400'
                                        : 'bg-red-500'}`}
                                style={{ width: `${Math.min((utilizeAmount / (thresholdAmount || 1)) * 100, 100)}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                            <span className="text-green-700">Low</span>
                            <span className="text-yellow-700">Limit</span>
                            <span className="text-red-700">Max</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent
                    className="flex flex-col gap-6 md:flex-row md:items-stretch md:justify-between md:gap-4"
                >
                    {/* Utilized */}
                    <div className="flex flex-col items-start gap-1 flex-1 min-w-[120px]">
                        <span className="text-sm text-muted-foreground">Utilized</span>
                        <span className="text-2xl font-bold text-orange-600">
                            {formatRupees(utilizeAmount)}
                        </span>
                    </div>
                    <Separator orientation="vertical" className="hidden md:block h-12 mx-4" />
                    {/* Available to Process */}
                    <div className="flex flex-col items-start gap-1 flex-1 min-w-[120px]">
                        <span className="text-sm text-muted-foreground">Available to Process</span>
                        <span className={`text-3xl font-extrabold ${thresholdAmount - utilizeAmount > 0 ? 'text-green-700' : 'text-red-600'}`}
                        >
                            {formatRupees(Math.max(thresholdAmount - utilizeAmount, 0))}
                        </span>
                    </div>
                    <Separator orientation="vertical" className="hidden md:block h-12 mx-4" />
                    {/* Progress & Limit */}
                    <div className="flex flex-col gap-3 flex-1 min-w-[220px] w-full md:items-end">

                        {/* Limit controls right-aligned, horizontal row */}
                        <div className="flex flex-row items-center gap-2 mt-2 w-full md:justify-end">
                            <span className="text-sm text-muted-foreground">Limit</span>
                            <span className="text-2xl font-bold text-yellow-700">
                                {formatRupees(thresholdAmount)}
                            </span>
                            <Button
                                variant="success"
                                size="icon"
                                className="ml-1"
                                aria-label="Increase threshold"
                                tabIndex={0}
                                onClick={() => {
                                    setIsModalOpen(true);
                                }}
                            >
                                +
                            </Button>
                            <Button
                                variant="destructive"
                                size="icon"
                                className="ml-1"
                                aria-label="Decrease threshold"
                                disabled
                                tabIndex={0}
                            // onClick={() => setIsDecreaseModalOpen(true)}
                            >
                                -
                            </Button>
                        </div>
                    </div>
                    <UploadBatchReceiptModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        loading={isIncreasing}
                        payBills={async ({ transactionReference, paymentMode, remarks, amount, transactionDate }) => {
                            if (amount) {
                                await handleIncreaseThresholdRequest({
                                    amount: amount || 0,
                                    transactionReference,
                                    paymentMode,
                                    transactionDate: transactionDate || new Date().toISOString().slice(0, 10)
                                });
                            } else {
                                toast({
                                    title: "Amount is required",
                                    description: "Please enter the amount"
                                });
                            }
                            setIsModalOpen(false);
                        }}
                    />
                    <DecreaseThresholdModal
                        isOpen={isDecreaseModalOpen}
                        onClose={() => setIsDecreaseModalOpen(false)}
                        loading={isDecreasing}
                        onConfirm={async (amount) => {
                            await handleDecreaseThresholdRequest(amount);
                            setIsDecreaseModalOpen(false);
                        }}
                    />
                </CardContent>
            </Card>
        </div>
    );
}