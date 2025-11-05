import React from 'react';
import { Card } from '@/components/ui/card';

const mockTransactions = [
    { id: 'TXN001', status: 'Success', date: '2024-06-01', remarks: 'Paid' },
    { id: 'TXN002', status: 'Failure', date: '2024-06-02', remarks: 'Insufficient funds' },
    { id: 'TXN003', status: 'Reversed', date: '2024-06-03', remarks: 'Refunded' },
];

const mockBillRef = {
    billId: 'BILL001',
    transactionRef: 'REF123',
    status: 'Success',
    updated: '2024-06-01 12:00',
};

export default function PaymentLogsPage() {
    return (
        <div className="max-w-2xl mx-auto p-6 space-y-6">
            <h1 className="text-2xl font-bold mb-4">Payment & Status Logs</h1>
            <Card className="p-4 mb-4">
                <h2 className="font-semibold mb-2">Transaction History</h2>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b">
                            <th className="text-left py-2">Transaction ID</th>
                            <th className="text-left">Status</th>
                            <th className="text-left">Date</th>
                            <th className="text-left">Remarks</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mockTransactions.map((txn, idx) => (
                            <tr key={idx} className="border-b last:border-0">
                                <td className="py-2">{txn.id}</td>
                                <td>{txn.status}</td>
                                <td>{txn.date}</td>
                                <td>{txn.remarks}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
            <Card className="p-4">
                <h2 className="font-semibold mb-2">Bill Transaction Ref Details</h2>
                <div className="flex flex-col space-y-1">
                    <span><b>Bill ID:</b> {mockBillRef.billId}</span>
                    <span><b>Transaction Ref:</b> {mockBillRef.transactionRef}</span>
                    <span><b>Status:</b> {mockBillRef.status}</span>
                    <span><b>Updated:</b> {mockBillRef.updated}</span>
                </div>
            </Card>
        </div>
    );
} 