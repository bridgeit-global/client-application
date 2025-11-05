import { createClient } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';

interface UseTransactionInputProps {
    transactionId?: string;
    paymentMethod?: string;
    onPaymentMethodChange?: (value: string) => void;
    onTransactionIdChange?: (value: string) => void;
    required?: boolean;
}

interface PaymentMethod {
    value: RegExp;
    name: string;
}

interface TransactionErrors {
    paymentMethod?: string;
    transactionId?: string;
}

export function useTransactionInput({
    transactionId = '',
    paymentMethod = '',
    onPaymentMethodChange = () => { },
    onTransactionIdChange = () => { },
    required = false
}: UseTransactionInputProps) {
    const supabase = createClient();

    const initialPaymentMethods = [
        {
            value: /^[A-Z0-9]{12,22}$/,
            name: "NEFT",
        },

        {
            value: /^[A-Z0-9]{12,22}$/,
            name: "RTGS",
        },

        {
            value: /^\d{12}$/,
            name: "IMPS",
        },

        {
            value: /^[A-Z0-9]{12,20}$/i,
            name: "Credit Card",
        }
    ]
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(initialPaymentMethods);


    const getPaymentMethod = async () => {
        const { data, error } = await supabase.from('master').select('*').eq('type', 'payment_method');
        if (error) {
            console.error('Error fetching payment method:', error);
            setPaymentMethods(initialPaymentMethods);
            return;
        }

        // Parse regex string (e.g. "/^[A-Z0-9]{12,22}$/" or "/^[A-Z0-9]{12,20}$/i") into RegExp
        setPaymentMethods(
            data.map(item => {
                // item.value is a string like "/^[A-Z0-9]{12,22}$/i"
                // Extract pattern and flags
                let pattern = item.value;
                let regex: RegExp;
                if (typeof pattern === 'string' && pattern.startsWith('/')) {
                    // Remove leading and trailing slashes, extract flags
                    const lastSlash = pattern.lastIndexOf('/');
                    const regexBody = pattern.slice(1, lastSlash);
                    const regexFlags = pattern.slice(lastSlash + 1);
                    regex = new RegExp(regexBody, regexFlags);
                } else {
                    // fallback, treat as plain pattern
                    regex = new RegExp(pattern);
                }
                return {
                    value: regex,
                    name: item.name
                };
            })
        );
        return data;
    };

    const [errors, setErrors] = useState<TransactionErrors>({});

    const sanitizeReferenceNumber = (value: string): string => {
        return value.replace(/[^a-zA-Z0-9]/g, '');
    };

    const validatePaymentMethod = (value: string) => {
        if (required && !value) {
            return "Payment method is required";
        }
        return "";
    };

    const validateTransactionId = (value: string, method: string) => {
        if (required && !value) {
            return "Transaction ID is required";
        }

        if (value && method) {
            const selectedMethod = paymentMethods.find(m => m.name === method);
            if (selectedMethod && !selectedMethod.value.test(value)) {
                return `Invalid ${method} transaction ID format`;
            }
        }

        return "";
    };

    const handlePaymentMethodChange = (value: string) => {
        const error = validatePaymentMethod(value);
        setErrors(prev => ({
            ...prev,
            paymentMethod: error
        }));
        onPaymentMethodChange?.(value);

        if (transactionId) {
            const transactionError = validateTransactionId(transactionId, value);
            setErrors(prev => ({
                ...prev,
                transactionId: transactionError
            }));
        }
    };

    const handleTransactionIdChange = (value: string) => {
        const error = validateTransactionId(value, paymentMethod || '');
        setErrors(prev => ({
            ...prev,
            transactionId: error
        }));
        onTransactionIdChange(sanitizeReferenceNumber(value));
    };

    useEffect(() => {
        getPaymentMethod();
        const paymentError = validatePaymentMethod(paymentMethod || '');
        const transactionError = validateTransactionId(transactionId || '', paymentMethod || '');
        setErrors({
            paymentMethod: paymentError,
            transactionId: transactionError
        });
    }, [paymentMethod, transactionId, required]);

    return {
        paymentMethods,
        errors,
        handlePaymentMethodChange,
        handleTransactionIdChange,
        sanitizeReferenceNumber,
        validatePaymentMethod,
        validateTransactionId
    };
}
