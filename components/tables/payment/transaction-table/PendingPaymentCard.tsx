import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PaymentGatewayTransactionsProps } from '@/types/payments-type';
import { Badge } from '@/components/ui/badge';
import { CellAction } from './cell-action';
import { formatRupees } from '@/lib/utils/number-format';
import { ddmmyy } from '@/lib/utils/date-format';

interface PendingPaymentCardProps {
    transaction: PaymentGatewayTransactionsProps;
}

const PendingPaymentCard: React.FC<PendingPaymentCardProps> = ({ transaction }) => {
    return (
        <Card className="w-full max-w-md shadow-md border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold truncate">
                    {transaction.batch_id}
                </CardTitle>
                <Badge variant="secondary">Pending</Badge>
            </CardHeader>
            <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Amount</span>
                    <span className="font-medium text-base">{formatRupees(transaction.amount)}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Date</span>
                    <span className="text-sm">{transaction.transaction_date ? ddmmyy(transaction.transaction_date) : '-'}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Transaction ID</span>
                    <span className="text-xs font-mono">{transaction.transaction_reference || '-'}</span>
                </div>
                {/* Add more fields as needed */}
                <div className="pt-2 flex gap-2">
                    <CellAction data={transaction} />
                    {/* Placeholder for more actions, e.g., Approve, Reject */}
                </div>
            </CardContent>
        </Card>
    );
};

export default PendingPaymentCard; 