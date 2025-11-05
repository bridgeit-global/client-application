'use client';
import React from 'react';
import { Badge } from '../ui/badge';

const ClientPaymentApprovalStatus = ({ approval_status }: { approval_status: string }) => {

    if (approval_status === 'approved') {
        return (
            <Badge variant="success">
                Approved
            </Badge>
        );
    }

    if (approval_status === 'rejected') {
        return (
            <Badge variant="destructive">
                Rejected
            </Badge>
        );
    }

    return (
        <Badge variant="outline">
            Pending
        </Badge>
    );

}

export default ClientPaymentApprovalStatus;
