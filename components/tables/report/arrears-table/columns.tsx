"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrearsProps } from "@/types/charges-type";
import { formatRupees } from '@/lib/utils/number-format';

import { ArrowDownIcon, ArrowUpIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";

export const columns: ColumnDef<ArrearsProps>[] = [
    {
        accessorKey: "biller_list.board_name",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="flex items-center gap-2 p-0 hover:bg-transparent"
                >
                    Biller ID
                    {column.getIsSorted() === "asc" && <ArrowUpIcon className="h-4 w-4" />}
                    {column.getIsSorted() === "desc" && <ArrowDownIcon className="h-4 w-4" />}
                </Button>
            )
        },
        cell: ({ row }) => <div className="text-left">{row.getValue("biller_list.board_name")}</div>,
    },
    {
        accessorKey: "bill_count",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="flex items-center gap-2 p-0 hover:bg-transparent"
                >
                    Bill Count
                    {column.getIsSorted() === "asc" && <ArrowUpIcon className="h-4 w-4" />}
                    {column.getIsSorted() === "desc" && <ArrowDownIcon className="h-4 w-4" />}
                </Button>
            )
        },
        cell: ({ row }) => <div className="text-right">{row.getValue("bill_count")}</div>,
    },
    {
        accessorKey: "positive_arrears",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="flex items-center gap-2 p-0 hover:bg-transparent"
                >
                    Positive Arrears
                    {column.getIsSorted() === "asc" && <ArrowUpIcon className="h-4 w-4" />}
                    {column.getIsSorted() === "desc" && <ArrowDownIcon className="h-4 w-4" />}
                </Button>
            )
        },
        cell: ({ row }) => <div className="text-right">{formatRupees(row.getValue("positive_arrears"))}</div>,
    },
    {
        accessorKey: "positive_arrear_bill_count",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="flex items-center gap-2 p-0 hover:bg-transparent"
                >
                    Positive Bills
                    {column.getIsSorted() === "asc" && <ArrowUpIcon className="h-4 w-4" />}
                    {column.getIsSorted() === "desc" && <ArrowDownIcon className="h-4 w-4" />}
                </Button>
            )
        },
        cell: ({ row }) => <div className="text-right">{row.getValue("positive_arrear_bill_count")}</div>,
    },
    {
        accessorKey: "negative_arrears",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="flex items-center gap-2 p-0 hover:bg-transparent"
                >
                    Negative Arrears
                    {column.getIsSorted() === "asc" && <ArrowUpIcon className="h-4 w-4" />}
                    {column.getIsSorted() === "desc" && <ArrowDownIcon className="h-4 w-4" />}
                </Button>
            )
        },
        cell: ({ row }) => <div className="text-right">{formatRupees(row.getValue("negative_arrears"))}</div>,
    },
    {
        accessorKey: "negative_arrear_bill_count",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="flex items-center gap-2 p-0 hover:bg-transparent"
                >
                    Negative Bills
                    {column.getIsSorted() === "asc" && <ArrowUpIcon className="h-4 w-4" />}
                    {column.getIsSorted() === "desc" && <ArrowDownIcon className="h-4 w-4" />}
                </Button>
            )
        },
        cell: ({ row }) => <div className="text-right">{row.getValue("negative_arrear_bill_count")}</div>,
    },
    {
        accessorKey: "bill_amount",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="flex items-center gap-2 p-0 hover:bg-transparent"
                >
                    Bill Amount
                    {column.getIsSorted() === "asc" && <ArrowUpIcon className="h-4 w-4" />}
                    {column.getIsSorted() === "desc" && <ArrowDownIcon className="h-4 w-4" />}
                </Button>
            )
        },
        cell: ({ row }) => <div className="text-right">{formatRupees(row.getValue("bill_amount"))}</div>,
    },
    {
        id: "net_arrears",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="flex items-center gap-2 p-0 hover:bg-transparent"
                >
                    Net Arrears
                    {column.getIsSorted() === "asc" && <ArrowUpIcon className="h-4 w-4" />}
                    {column.getIsSorted() === "desc" && <ArrowDownIcon className="h-4 w-4" />}
                </Button>
            )
        },
        cell: ({ row }) => {
            const positive = (row.getValue("positive_arrears") as number) || 0;
            const negative = (row.getValue("negative_arrears") as number) || 0;
            return <div className="text-right">{formatRupees(positive + negative)}</div>;
        },
    },
]; 