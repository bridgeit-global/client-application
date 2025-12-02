'use client';

import { Fragment } from 'react';
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
                positive_arrears: acc.positive_arrears + (item.positive_arrears || 0),
                negative_arrears: acc.negative_arrears + (item.negative_arrears || 0),
            };
        },
        {
            positive_arrears: 0,
            negative_arrears: 0,
        }
    );

    // Calculate state-wise totals
    const stateTotals: Record<string, typeof totals> = {};
    Object.entries(groupedByState).forEach(([state, items]) => {
        stateTotals[state] = items.reduce(
            (acc, item) => {
                return {
                    positive_arrears: acc.positive_arrears + (item.positive_arrears || 0),
                    negative_arrears: acc.negative_arrears + (item.negative_arrears || 0),
                };
            },
            {
                positive_arrears: 0,
                negative_arrears: 0,
            }
        );
    });

    return (
        <div>
            <h3 className="font-medium mb-3">Arrears on active bills</h3>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="bg-muted">Biller ID</TableHead>
                            <TableHead className="text-right bg-muted">Pending Amounts</TableHead>
                            <TableHead className="text-right bg-muted">Overpaid Amounts</TableHead>
                            <TableHead className="text-right bg-muted">Net Arrears</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Object.entries(groupedByState).map(([state, stateItems]) => (
                            <Fragment key={state}>
                                {/* State Header Row */}
                                <TableRow className="bg-muted/30">
                                    <TableCell colSpan={4} className="font-bold">
                                        {state}
                                    </TableCell>
                                </TableRow>

                                {/* Board rows for this state */}
                                {stateItems.map((item) => (
                                    <TableRow key={item.biller_id}>
                                        <TableCell className="font-medium pl-6">{item.biller_list.board_name}</TableCell>
                                        <TableCell className="text-right">{item.positive_arrears ? formatRupees(item.positive_arrears) : ""}</TableCell>
                                        <TableCell className="text-right">{item.negative_arrears ? formatRupees(item.negative_arrears) : ""}</TableCell>
                                        <TableCell className="text-right">{item.positive_arrears && item.negative_arrears ? formatRupees((item.positive_arrears || 0) + (item.negative_arrears || 0)) : ""}</TableCell>
                                    </TableRow>
                                ))}

                                {/* State total row */}
                                <TableRow className="bg-muted/20 font-medium">
                                    <TableCell className="pl-4">State Total</TableCell>
                                    <TableCell className="text-right">{stateTotals[state].positive_arrears ? formatRupees(stateTotals[state].positive_arrears) : ""}</TableCell>
                                    <TableCell className="text-right">{stateTotals[state].negative_arrears ? formatRupees(stateTotals[state].negative_arrears) : ""}</TableCell>
                                    <TableCell className="text-right">{stateTotals[state].positive_arrears && stateTotals[state].negative_arrears ? formatRupees(stateTotals[state].positive_arrears + stateTotals[state].negative_arrears) : ""}</TableCell>
                                </TableRow>
                            </Fragment>
                        ))}

                        {/* Grand total row */}
                        <TableRow className="bg-muted/50 font-bold">
                            <TableCell>Grand Total</TableCell>
                            <TableCell className="text-right">{totals.positive_arrears ? formatRupees(totals.positive_arrears) : ""}</TableCell>
                            <TableCell className="text-right">{totals.negative_arrears ? formatRupees(totals.negative_arrears) : ""}</TableCell>
                            <TableCell className="text-right">{totals.positive_arrears && totals.negative_arrears ? formatRupees(totals.positive_arrears + totals.negative_arrears) : ""}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        </div>
    );
} 