'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { RefundPaymentTransactionsProps } from '@/types/payments-type';
import { createClient } from '@/lib/supabase/client';
import { FormField } from '@/components/input/form-field';
import { useUserStore } from '@/lib/store/user-store';
import { formatRupees } from '@/lib/utils/number-format';
import { TransactionInput } from '@/components/input/transaction-input';
import { useTransactionInput } from '@/hooks/use-transaction-input';


export function AddTransactionIdModal({ id, amount }: RefundPaymentTransactionsProps) {
    const { user } = useUserStore();
    const supabase = createClient();
    const [isOpen, setIsOpen] = useState(false);
    const [transactionId, setTransactionId] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('NEFT');
    const [transactionDate, setTransactionDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    });
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const { validateTransactionId } = useTransactionInput({});
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const isErrorTransactionId = validateTransactionId(transactionId, paymentMethod);
        if (isErrorTransactionId) {
            toast({
                variant: "destructive",
                title: "Validation Error",
                description: "Invalid transaction ID format",
            });
            return;
        }

        setIsLoading(true);

        try {
            const { error } = await supabase
                .from('refund_payment_transactions')
                .update({
                    reference_id: transactionId.trim(),
                    updated_at: new Date().toISOString(),
                    status: 'completed',
                    date: transactionDate,
                    payment_method: paymentMethod,
                    updated_by: user.id
                })
                .eq('id', id);
            if (error) {
                throw new Error(error.message);
            }
            toast({
                title: 'Success',
                description: 'Transaction ID updated successfully',
                variant: 'default'
            });
            setIsOpen(false);
            setTransactionId('');
            setPaymentMethod('');
            setTransactionDate(() => {
                const today = new Date();
                return today.toISOString().split('T')[0];
            });

        } catch (error) {
            console.error('Error updating transaction ID:', error);
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to update transaction ID',
                variant: 'destructive'
            });
        } finally {
            window?.location?.reload();
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        setTransactionId('');
        setPaymentMethod('');
        setTransactionDate(() => {
            const today = new Date();
            return today.toISOString().split('T')[0];
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="px-2">
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add Transaction ID</DialogTitle>
                    <DialogDescription>
                        Add a transaction ID for this wallet ledger entry. All fields marked with * are required.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Amount:</span>
                            <span className="text-sm">{formatRupees(amount)}</span>
                        </div>
                    </div>
                    <div className="grid gap-6 py-4">
                        <TransactionInput
                            transactionId={transactionId}
                            paymentMethod={paymentMethod}
                            onTransactionIdChange={(value) => setTransactionId(value)}
                            onPaymentMethodChange={(value) => setPaymentMethod(value)}
                            required={true}
                        />
                        <FormField
                            label="Date"
                            id="transactionDate"
                            type="date"
                            value={transactionDate}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setTransactionDate(e.target.value)}
                            required
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading || !paymentMethod || !transactionId.trim()}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                'Update Transaction ID'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog >
    );
} 