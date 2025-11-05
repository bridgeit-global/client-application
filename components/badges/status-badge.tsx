'use client';
import React from 'react';
import { Badge } from '../ui/badge';
import { BILL_STATUS } from '@/constants/bill';

type Status = keyof typeof BILL_STATUS;
type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' | 'error' | 'gray';

const statusVariantMap: Record<Status, BadgeVariant> = {
    'new': 'default',
    'approved': 'default',
    'batch': 'default',
    'payment': 'gray',
    'paid': 'success',
    'rejected': 'destructive'
};

const StatusBadge = ({ status }: { status: Status }) => {
    return (
        <Badge variant={statusVariantMap[status]}>
            {BILL_STATUS[status]}
        </Badge>
    );
}

export default StatusBadge;
