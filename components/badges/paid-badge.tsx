'use client';
import React from 'react';
import { Badge } from '../ui/badge';
import { AllBillTableProps } from '@/types/bills-type';
const PaidBadge = ({ row }: { row: AllBillTableProps }) => {
    const is_active = row.is_active;
    const payment_status = row.payment_status;
    if (!is_active && !payment_status) {
        return (
            <Badge variant="outline">
                Carried Forward
            </Badge>
        );
    }

    return (
        payment_status ? (
            <Badge variant="success">
                Paid
            </Badge>
        ) : (
            <Badge variant="outline">
                Unpaid
            </Badge>
        )
    );
}

export default PaidBadge;
