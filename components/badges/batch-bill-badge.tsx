'use client';
import React from 'react';
import { Badge } from '../ui/badge';

const statusMap: Record<string, { label: string; variant: string }> = {
    unpaid: { label: 'Unpaid', variant: 'destructive' },
    paid: { label: 'Paid', variant: 'success' },
    reverse: { label: 'Reversed', variant: 'info' },
    refund: { label: 'Refunded', variant: 'warning' },
};

const BatchBillBadge = ({ status }: { status: string | null }) => {
    // If status is not in map, capitalize first letter
    const defaultStatus = status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : '';
    const { label, variant } = statusMap[status || ''] || { label: defaultStatus, variant: 'default' };
    return (
        <Badge variant={variant as any}>
            {label}
        </Badge>
    );
}

export default BatchBillBadge;
