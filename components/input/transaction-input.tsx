'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useTransactionInput } from '@/hooks/use-transaction-input';

interface TransactionInputProps {
    transactionId: string;
    paymentMethod: string;
    onPaymentMethodChange: (value: string) => void;
    onTransactionIdChange: (value: string) => void;
    className?: string;
    required?: boolean;
}

export function TransactionInput({
    transactionId,
    onTransactionIdChange,
    onPaymentMethodChange,
    className,
    paymentMethod,
    required = false
}: TransactionInputProps) {
    const {
        paymentMethods,
        errors,
        handlePaymentMethodChange,
        handleTransactionIdChange
    } = useTransactionInput({
        transactionId,
        paymentMethod,
        onPaymentMethodChange,
        onTransactionIdChange,
        required
    });

    return (
        <div className={cn("space-y-4", className)}>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="paymentMethod" className="text-right text-sm font-medium">
                    Payment Method {required && <span className="text-red-500">*</span>}
                </Label>
                <div className="col-span-3">
                    <Select
                        value={paymentMethod || ''}
                        onValueChange={handlePaymentMethodChange}
                    >
                        <SelectTrigger className={cn(errors.paymentMethod && "border-red-500 focus:border-red-500")}>
                            <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                            {paymentMethods.map((method) => (
                                <SelectItem key={method.name} value={method.name}>
                                    {method.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.paymentMethod && (
                        <p className="text-sm text-red-500 mt-1">{errors.paymentMethod}</p>
                    )}
                </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="transactionId" className="text-right text-sm font-medium">
                    Transaction ID {required && <span className="text-red-500">*</span>}
                </Label>
                <div className="col-span-3">
                    <Input
                        id="transactionId"
                        value={transactionId}
                        onChange={(e) => handleTransactionIdChange(e.target.value)}
                        placeholder={paymentMethod ? `Enter ${paymentMethod} transaction ID` : "Enter transaction ID"}
                        className={cn(errors.transactionId && "border-red-500 focus:border-red-500")}
                    />
                    {errors.transactionId && (
                        <p className="text-sm text-red-500 mt-1">{errors.transactionId}</p>
                    )}
                </div>
            </div>
        </div>
    );
} 