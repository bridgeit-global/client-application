'use client';
import React from 'react';
import { RefundPaymentTransactionsProps } from '@/types/payments-type';
import { RefundPaymentTransactionCard } from './refund-amount-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface RefundPaymentTransactionsCardsGridProps {
    data: RefundPaymentTransactionsProps[];
    isLoading?: boolean;
}
export function RefundPaymentTransactionsCardsGrid({ data, isLoading = false }: RefundPaymentTransactionsCardsGridProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, index) => (
                    <Card key={index} className="w-full animate-pulse">
                        <CardHeader className="pb-3">
                            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <div className="h-4 w-4 bg-gray-200 rounded"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                        No Records Without Transaction IDs
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        All wallet ledger records have transaction IDs assigned. There are no records that need transaction ID updates.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                    Records Without Transaction IDs ({data.length})
                </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.map((record) => (
                    <RefundPaymentTransactionCard key={record.id} record={record} />
                ))}
            </div>
        </div>
    );
} 