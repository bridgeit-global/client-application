
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { useState, useCallback } from "react";
import { UploadBatchReceiptModal } from "@/components/modal/upload-batch-receipt-modal";
import { ClientPaymentsProps } from "@/types/payments-type";
import { formatRupees } from "@/lib/utils/number-format";
import { Table } from "@tanstack/react-table";
import { BatchTableProps } from "@/types/batches-type";

interface PaymentData {
    batch_id: string;
    batch_status: string;
    client_payments: ClientPaymentsProps[];
    payment_gateway_transactions: any[];
}

interface PaymentRequest {
    transactionReference: string;
    paymentMode: string;
    remarks: string;
    transactionDate?: string;
}

interface BatchPaymentActionButtonProps {
    table: Table<BatchTableProps>
}

export const BatchPaymentActionButton = ({ table }: BatchPaymentActionButtonProps) => {
    const { toast } = useToast();
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Get selected data
    const selectedData = table.getFilteredSelectedRowModel().rows.map(row => row.original);

    // Calculate total amount
    const totalAmount = selectedData.reduce((total, item) => {
        const paidPayments = item.client_payments.filter(
            (payment: ClientPaymentsProps) => payment.status === 'paid'
        );
        return total + paidPayments.reduce(
            (sum, payment) => sum + (payment.paid_amount || 0),
            0
        );
    }, 0);

    // Check if any payment gateway transactions exist
    const hasPaymentTransactions = selectedData.some(
        item => item.payment_gateway_transactions?.length > 0
    );

    // Process payment for a single batch
    const processBatchPayment = async (
        batchData: PaymentData,
        paymentRequest: PaymentRequest
    ): Promise<void> => {
        const batchAmount = batchData.client_payments
            .filter((payment: ClientPaymentsProps) => payment.status === 'paid')
            .reduce((sum, payment) => sum + (payment.paid_amount || 0), 0);

        const response = await fetch('/api/batch/pay', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                batchId: batchData.batch_id,
                transactionReference: paymentRequest.transactionReference,
                paymentMode: paymentRequest.paymentMode,
                remarks: paymentRequest.remarks,
                amount: batchAmount,
                batch_status: batchData.batch_status,
                transactionDate: paymentRequest.transactionDate,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        return result;
    };

    // Main payment function with proper error handling
    const payBills = useCallback(async (paymentRequest: PaymentRequest): Promise<void> => {
        try {
            setIsLoading(true);

            // Process all batches in parallel with proper error handling
            const paymentPromises = selectedData.map(batchData =>
                processBatchPayment(batchData, paymentRequest)
            );

            await Promise.all(paymentPromises);

            // Refresh the page and show success message
            router.refresh();
            toast({
                title: 'Success',
                description: 'All payments processed successfully',
                variant: 'default',
            });

        } catch (error) {
            console.error('Payment processing error:', error);

            const errorMessage = error instanceof Error
                ? error.message
                : 'An unexpected error occurred during payment processing';

            toast({
                title: 'Payment Failed',
                description: errorMessage,
                variant: 'destructive',
            });
        } finally {
            table.resetRowSelection();
            setIsLoading(false);
        }
    }, [selectedData, router, toast]);

    // Handle modal close
    const handleModalClose = useCallback(() => {
        setIsModalOpen(false);
    }, []);

    // Handle payment submission
    const handlePaymentSubmit = useCallback((paymentRequest: PaymentRequest) => {
        const requestWithDate = {
            ...paymentRequest,
            transactionDate: paymentRequest.transactionDate || new Date().toISOString().slice(0, 10),
        };

        return payBills(requestWithDate);
    }, [payBills]);

    // Early return after all hooks are called
    if (selectedData.length === 0) {
        return null;
    }

    // Get batch IDs for modal
    const batchIds = selectedData.map(item => item.batch_id).join(',');

    return (
        <div className='flex items-center gap-2'>
            <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-500">
                    Total Amount: {formatRupees(totalAmount)}
                </p>
            </div>

            <UploadBatchReceiptModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                id={batchIds}
                amount={totalAmount}
                payBills={handlePaymentSubmit}
            />

            {!hasPaymentTransactions && totalAmount > 0 ? (
                <Button
                    size='sm'
                    onClick={() => setIsModalOpen(true)}
                    disabled={isLoading}
                >
                    {isLoading ? 'Processing...' : 'Pay Now'}
                </Button>
            ) : (
                <Badge variant='outline'>Processing</Badge>
            )}
        </div>
    );
};