'use client';
import { useTransition } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { PaymentGatewayTransactionsProps } from '@/types/payments-type';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogAction,
    AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { useUserStore } from '@/lib/store/user-store';
import { createClient } from '@/lib/supabase/client';
import { useUtilizeAndThresholdAmount } from '@/hooks/use-utilize-amount';

interface CellActionProps {
    data: PaymentGatewayTransactionsProps;
}


export const CellAction: React.FC<CellActionProps> = ({ data }) => {
    const { user } = useUserStore();
    const { thresholdAmount } = useUtilizeAndThresholdAmount();
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const router = useRouter();

    const handleApprove = async () => {
        try {
            const supabase = createClient()
            const { error: error1, data: payment_data } = await supabase
                .from('payment_gateway_transactions')
                .update({
                    payment_status: "approved",
                    updated_by: user?.id,
                }).eq("transaction_reference", data.transaction_reference).eq("batch_id", data.batch_id)
                .select().single()
            if (payment_data?.transaction_pay_type === 'threshold') {
                const { data: { user } } = await supabase.auth.getUser();
                const { error: error3 } = await supabase.from('organizations').update({
                    batch_threshold_amount: thresholdAmount + payment_data.amount,
                }).eq('id', user?.user_metadata?.org_id).select().single()
                if (error3) {
                    throw new Error(error3?.message || 'Failed to approve transaction.');
                }
            }

            if (error1) {
                throw new Error(error1?.message || 'Failed to approve transaction.');
            }

            toast({
                title: 'Success',
                description: 'Transaction approved successfully.',
                variant: 'success',
            });
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to approve transaction.',
                variant: 'destructive',
            });
        } finally {
            router.refresh();
        }
    };

    const handleReject = async () => {
        try {
            const supabase = createClient()
            const { error: error1 } = await supabase
                .from('payment_gateway_transactions')
                .update({
                    payment_status: "rejected",
                    updated_by: user?.id,
                }).eq("transaction_reference", data.transaction_reference).eq("batch_id", data.batch_id)

            if (thresholdAmount > 0 && data?.batch_id) {
                const { error: error2 } = await supabase.from('batches').update({
                    batch_status: "client_paid",
                    updated_by: user?.id,
                }).eq("batch_id", data.batch_id)
                if (error2) {
                    throw new Error(error2?.message || 'Failed to reject transaction.');
                }
            }

            if (error1) {
                throw new Error(error1?.message || 'Failed to reject transaction.');
            }

            toast({
                title: 'Rejected',
                description: 'Transaction has been rejected.',
                variant: 'success',
            });
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to reject transaction.',
                variant: 'destructive',
            });
        } finally {
            router.refresh();
        }
    };

    return (
        <div className="flex gap-2">
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button
                        size='sm'
                        disabled={isPending}
                    >
                        {isPending ? 'Approving…' : 'Approve'}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Approval</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to approve this transaction?<br />
                            <strong>Reference ID:</strong> {data.transaction_reference}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => startTransition(handleApprove)}
                            disabled={isPending}
                        >
                            {isPending ? 'Approving…' : 'Yes, Approve'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button
                        size='sm'
                        disabled={isPending}
                        variant="outline"
                    >
                        {isPending ? 'Rejecting…' : 'Reject'}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Rejection</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to reject this transaction?<br />
                            <strong>Reference ID:</strong> {data.transaction_reference}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => startTransition(handleReject)}
                            disabled={isPending}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {isPending ? 'Rejecting…' : 'Yes, Reject'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}; 