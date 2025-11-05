'use client'
import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BillerResult {
    state: string;
    board_name: string;
    active_count: number;
}

interface BillerStatsTableProps {
    data: BillerResult[];
}

export default function BillerStatsTable({ data }: BillerStatsTableProps) {

    // Group data by state
    const stateGroups = data.reduce((acc, item) => {
        if (!acc[item.state]) {
            acc[item.state] = [];
        }
        acc[item.state].push(item);
        return acc;
    }, {} as Record<string, BillerResult[]>);

    // Sort states by total connections (highest to lowest)
    const sortedStateEntries = Object.entries(stateGroups).sort(([, boardsA], [, boardsB]) => {
        const totalA = boardsA.reduce((sum, board) => sum + board.active_count, 0);
        const totalB = boardsB.reduce((sum, board) => sum + board.active_count, 0);
        return totalB - totalA; // Sort from highest to lowest
    });

    // Calculate totals
    const totalActiveCount = data.reduce((sum, item) => sum + item.active_count, 0);
    const totalBoards = data.length;
    const totalStates = Object.keys(stateGroups).length;

    return (
        <div className="col-span-4">
            <CardHeader>
                <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                    <div className="space-y-1">
                        <CardTitle>State-wise & Board-wise Active Connections</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Active connections count by state and biller board
                        </p>
                    </div>
                    <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
                        <div className="text-sm text-muted-foreground">
                            Total: {totalActiveCount} connections across {totalBoards} boards in {totalStates} states
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>State</TableHead>
                                <TableHead>Biller Board</TableHead>
                                <TableHead className="text-center">Active Connections</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedStateEntries.map(([state, boards]) => {
                                const stateTotal = boards.reduce((sum, board) => sum + board.active_count, 0);
                                return (
                                    <React.Fragment key={state}>
                                        {boards.map((item, index) => (
                                            <TableRow key={`${state}-${item.board_name}-${index}`}>
                                                {index === 0 && (
                                                    <TableCell 
                                                        rowSpan={boards.length} 
                                                        className="font-medium bg-blue-50/30 align-top"
                                                    >
                                                        <div className="font-semibold text-blue-800">{state}</div>
                                                        <div className="text-xs text-blue-600 mt-1">
                                                            {stateTotal} total connections
                                                        </div>
                                                    </TableCell>
                                                )}
                                                <TableCell className="font-medium min-w-[200px]">
                                                    <div className="text-sm font-medium">
                                                        {item.board_name}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="text-sm font-semibold text-green-600">
                                                        {item.active_count}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </React.Fragment>
                                );
                            })}
                            <TableRow className="font-bold border-t-2 bg-gray-50">
                                <TableCell colSpan={2} className="font-semibold">
                                    Grand Total
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="text-lg font-bold text-green-700">
                                        {totalActiveCount}
                                    </div>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </div >
    );
} 