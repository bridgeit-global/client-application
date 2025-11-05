'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatRupees } from '@/lib/utils/number-format';

import { ArrearsProps } from "@/types/charges-type";


export function ArrearsTable({ data }: { data: ArrearsProps[] }) {
    // Sort the data by state and then by board_name
    const sortedData = [...data].sort((a, b) => {
        // First compare by state
        const stateComparison = (a.biller_list.state || '').localeCompare(b.biller_list.state || '');
        // If states are the same, compare by board_name
        if (stateComparison === 0) {
            return (a.biller_list.board_name || '').localeCompare(b.biller_list.board_name || '');
        }
        return stateComparison;
    });

    // Group data by state
    const groupedByState = sortedData.reduce((acc, item) => {
        const state = item.biller_list.state || 'Unknown';
        if (!acc[state]) {
            acc[state] = [];
        }
        acc[state].push(item);
        return acc;
    }, {} as Record<string, ArrearsProps[]>);

    // Calculate total values
    const totals = sortedData.reduce(
        (acc, item) => {
            return {
                bill_count: acc.bill_count + (item.bill_count || 0),
                positive_arrears: acc.positive_arrears + (item.positive_arrears || 0),
                negative_arrears: acc.negative_arrears + (item.negative_arrears || 0),
                bill_amount: acc.bill_amount + (item.bill_amount || 0),
                positive_arrear_bill_count: acc.positive_arrear_bill_count + (item.positive_arrear_bill_count || 0),
                negative_arrear_bill_count: acc.negative_arrear_bill_count + (item.negative_arrear_bill_count || 0),
            };
        },
        {
            bill_count: 0,
            positive_arrears: 0,
            negative_arrears: 0,
            bill_amount: 0,
            positive_arrear_bill_count: 0,
            negative_arrear_bill_count: 0,
        }
    );

    // Calculate state-wise totals
    const stateTotals: Record<string, typeof totals> = {};
    Object.entries(groupedByState).forEach(([state, items]) => {
        stateTotals[state] = items.reduce(
            (acc, item) => {
                return {
                    bill_count: acc.bill_count + (item.bill_count || 0),
                    positive_arrears: acc.positive_arrears + (item.positive_arrears || 0),
                    negative_arrears: acc.negative_arrears + (item.negative_arrears || 0),
                    bill_amount: acc.bill_amount + (item.bill_amount || 0),
                    positive_arrear_bill_count: acc.positive_arrear_bill_count + (item.positive_arrear_bill_count || 0),
                    negative_arrear_bill_count: acc.negative_arrear_bill_count + (item.negative_arrear_bill_count || 0),
                };
            },
            {
                bill_count: 0,
                positive_arrears: 0,
                negative_arrears: 0,
                bill_amount: 0,
                positive_arrear_bill_count: 0,
                negative_arrear_bill_count: 0,
            }
        );
    });

    return (
        <div>
            <h3 className="font-medium mb-3">Arrears on active bills</h3>
            <div className="rounded-md border overflow-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Biller ID</TableHead>
                            <TableHead className="text-right">Bill Count</TableHead>
                            <TableHead className="text-right">Positive Arrears</TableHead>
                            <TableHead className="text-right">Positive Bills</TableHead>
                            <TableHead className="text-right">Negative Arrears</TableHead>
                            <TableHead className="text-right">Negative Bills</TableHead>
                            <TableHead className="text-right">Bill Amount</TableHead>
                            <TableHead className="text-right">Net Arrears</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Object.entries(groupedByState).map(([state, stateItems]) => (
                            <>
                                {/* State Header Row */}
                                <TableRow key={state} className="bg-muted/30">
                                    <TableCell colSpan={8} className="font-bold">
                                        {state}
                                    </TableCell>
                                </TableRow>

                                {/* Board rows for this state */}
                                {stateItems.map((item) => (
                                    <TableRow key={item.biller_id}>
                                        <TableCell className="font-medium pl-6">{item.biller_list.board_name}</TableCell>
                                        <TableCell className="text-right">{item.bill_count ? item.bill_count : ""}</TableCell>
                                        <TableCell className="text-right">{item.positive_arrears ? formatRupees(item.positive_arrears) : ""}</TableCell>
                                        <TableCell className="text-right">{item.positive_arrear_bill_count ? item.positive_arrear_bill_count : ""}</TableCell>
                                        <TableCell className="text-right">{item.negative_arrears ? formatRupees(item.negative_arrears) : ""}</TableCell>
                                        <TableCell className="text-right">{item.negative_arrear_bill_count ? item.negative_arrear_bill_count : ""}</TableCell>
                                        <TableCell className="text-right">{item.bill_amount ? formatRupees(item.bill_amount) : ""}</TableCell>
                                        <TableCell className="text-right">{item.positive_arrears && item.negative_arrears ? formatRupees((item.positive_arrears || 0) + (item.negative_arrears || 0)) : ""}</TableCell>
                                    </TableRow>
                                ))}

                                {/* State total row */}
                                <TableRow className="bg-muted/20 font-medium">
                                    <TableCell className="pl-4">State Total</TableCell>
                                    <TableCell className="text-right">{stateTotals[state].bill_count ? stateTotals[state].bill_count : ""}</TableCell>
                                    <TableCell className="text-right">{stateTotals[state].positive_arrears ? formatRupees(stateTotals[state].positive_arrears) : ""}</TableCell>
                                    <TableCell className="text-right">{stateTotals[state].positive_arrear_bill_count ? stateTotals[state].positive_arrear_bill_count : ""}</TableCell>
                                    <TableCell className="text-right">{stateTotals[state].negative_arrears ? formatRupees(stateTotals[state].negative_arrears) : ""}</TableCell>
                                    <TableCell className="text-right">{stateTotals[state].negative_arrear_bill_count ? stateTotals[state].negative_arrear_bill_count : ""}</TableCell>
                                    <TableCell className="text-right">{stateTotals[state].bill_amount ? formatRupees(stateTotals[state].bill_amount) : ""}</TableCell>
                                    <TableCell className="text-right">{stateTotals[state].positive_arrears && stateTotals[state].negative_arrears ? formatRupees(stateTotals[state].positive_arrears + stateTotals[state].negative_arrears) : ""}</TableCell>
                                </TableRow>
                            </>
                        ))}

                        {/* Grand total row */}
                        <TableRow className="bg-muted/50 font-bold">
                            <TableCell>Grand Total</TableCell>
                            <TableCell className="text-right">{totals.bill_count ? totals.bill_count : ""}</TableCell>
                            <TableCell className="text-right">{totals.positive_arrears ? formatRupees(totals.positive_arrears) : ""}</TableCell>
                            <TableCell className="text-right">{totals.positive_arrear_bill_count ? totals.positive_arrear_bill_count : ""}</TableCell>
                            <TableCell className="text-right">{totals.negative_arrears ? formatRupees(totals.negative_arrears) : ""}</TableCell>
                            <TableCell className="text-right">{totals.negative_arrear_bill_count ? totals.negative_arrear_bill_count : ""}</TableCell>
                            <TableCell className="text-right">{totals.bill_amount ? formatRupees(totals.bill_amount) : ""}</TableCell>
                            <TableCell className="text-right">{totals.positive_arrears && totals.negative_arrears ? formatRupees(totals.positive_arrears + totals.negative_arrears) : ""}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        </div>
    );
} 