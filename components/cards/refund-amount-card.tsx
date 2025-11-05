'use client';
import React from 'react';
import { RefundPaymentTransactionsProps, WalletProps } from '@/types/payments-type';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatRupees } from '@/lib/utils/number-format';
import ViewBillButton from '@/components/buttons/view-bill-button';
import ViewBatchButton from '@/components/buttons/view-batch-button';
import { timeAgo } from '@/lib/utils/date-format';
import { AddTransactionIdModal } from '@/components/tables/payment/client-wallet-ledgers-table/add-transaction-id-modal';

interface RefundPaymentTransactionCardProps {
    record: RefundPaymentTransactionsProps;
}

export function RefundPaymentTransactionCard({ record }: RefundPaymentTransactionCardProps) {


    return (
        <Card className="w-full">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                        <Badge variant={record.status === 'pending' ? 'destructive' : 'success'} >
                            {record.status?.toUpperCase()}
                        </Badge>
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Amount:</span>
                    <span className={`font-semibold ${record.status === 'pending' ? 'text-green-600' : 'text-red-600'}`}>
                        {formatRupees(record.amount)}
                    </span>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Date:</span>
                    <span className="text-sm">{timeAgo(record.created_at)}</span>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Batch:</span>
                    {record.batch_id ? (
                        <ViewBatchButton
                            link={`/portal/batch-payment/${record.batch_id}`}
                            batchId={record.batch_id}
                        />
                    ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                    )}
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Bill:</span>
                    {record.bill_id ? (
                        <ViewBillButton billId={record.bill_id} />
                    ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                    )}
                </div>

                {record.remarks && (
                    <div className="pt-2 border-t">
                        <div className="text-xs">
                            Remarks: {record.remarks}
                        </div>
                    </div>
                )}
                {
                    record.status === 'pending' ? (
                        <div className="pt-2 border-t">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Ref ID:</span>
                                <AddTransactionIdModal {...record} />
                            </div>
                        </div>
                    ) : (
                        <div className="pt-2 border-t">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Ref ID:</span>
                                <span className="text-sm text-muted-foreground">{record.reference_id}</span>
                            </div>
                        </div>
                    )
                }
            </CardContent>
        </Card>
    );
} 