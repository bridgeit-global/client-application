"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getSortedRowModel,
    SortingState,
    getFilteredRowModel,
    ColumnFiltersState,
    getPaginationRowModel,
} from "@tanstack/react-table";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    UploadCloud,
    ReceiptIndianRupee,
} from "lucide-react";
import { AllBillTableProps } from "@/types/bills-type";
import { formatRupees } from '@/lib/utils/number-format';
import { ddmmyy } from "@/lib/utils/date-format";
import DocumentViewerModalWithPresigned from "@/components/modal/document-viewer-modal-with-presigned";
import { UnitCost } from "../table-cells/unit-cost";
import { UploadReceiptModal } from "../modal/upload-receipt-modal";
import { Badge } from "../ui/badge";
import IconButton from "../buttons/icon-button";
import { DaysToPayCell } from "../table-cells/days-to-pay-cell";
import { ABNORMAL_BILL_STATUS_COLOR } from "@/constants/colors";
import BillTypeCell from "../table-cells/bill-type-cell";
import { DueDateCell } from "../table-cells/due-date-cell";
const columns: ColumnDef<AllBillTableProps>[] = [

    {
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="p-0 hover:bg-transparent text-gray-900 font-medium"
                >
                    Bill Date
                    {column.getIsSorted() === "asc" ? (
                        <ArrowUp className="ml-2 h-4 w-4" />
                    ) : column.getIsSorted() === "desc" ? (
                        <ArrowDown className="ml-2 h-4 w-4" />
                    ) : (
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                </Button>
            )
        },
        cell: ({ row }) => row.original.bill_date && ddmmyy(row.original.bill_date),
        accessorKey: 'bill_date'
    },
    {
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="p-0 hover:bg-transparent text-gray-900 font-medium"
                >
                    Due Date
                    {column.getIsSorted() === "asc" ? (
                        <ArrowUp className="ml-2 h-4 w-4" />
                    ) : column.getIsSorted() === "desc" ? (
                        <ArrowDown className="ml-2 h-4 w-4" />
                    ) : (
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                </Button>
            )
        },
        cell: ({ row }) => <DueDateCell discount_date_str={row.original.discount_date} due_date_str={row.original.due_date} is_active={row.original.is_active} />,
        accessorKey: 'due_date'
    },
    {
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="p-0 hover:bg-transparent text-gray-900 font-medium"
                >
                    Bill Amount
                    {column.getIsSorted() === "asc" ? (
                        <ArrowUp className="ml-2 h-4 w-4" />
                    ) : column.getIsSorted() === "desc" ? (
                        <ArrowDown className="ml-2 h-4 w-4" />
                    ) : (
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                </Button>
            )
        },
        cell: ({ row }) => formatRupees(row.original.bill_amount),
        accessorKey: 'bill_amount'
    },
    {
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="p-0 hover:bg-transparent text-gray-900 font-medium"
                >
                    Bill Type
                    {column.getIsSorted() === "asc" ? (
                        <ArrowUp className="ml-2 h-4 w-4" />
                    ) : column.getIsSorted() === "desc" ? (
                        <ArrowDown className="ml-2 h-4 w-4" />
                    ) : (
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                </Button>
            )
        },
        cell: ({ row }) => <BillTypeCell row={row} />,
        accessorKey: 'bill_type'
    },
    {
        id: 'days_to_pay',
        header: () => <span className="text-gray-900 font-medium">Days to Pay</span>,
        cell: ({ row }: any) => <DaysToPayCell row={row} />
    },
    {
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="p-0 hover:bg-transparent text-gray-900 font-medium"
                >
                    Billed Unit
                    {column.getIsSorted() === "asc" ? (
                        <ArrowUp className="ml-2 h-4 w-4" />
                    ) : column.getIsSorted() === "desc" ? (
                        <ArrowDown className="ml-2 h-4 w-4" />
                    ) : (
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                </Button>
            )
        },
        accessorKey: 'billed_unit'
    },
    {
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="p-0 hover:bg-transparent text-gray-900 font-medium"
                >
                    Start Date
                    {column.getIsSorted() === "asc" ? (
                        <ArrowUp className="ml-2 h-4 w-4" />
                    ) : column.getIsSorted() === "desc" ? (
                        <ArrowDown className="ml-2 h-4 w-4" />
                    ) : (
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                </Button>
            )
        },
        cell: ({ row }) => row.original.start_date && ddmmyy(row.original.start_date),
        accessorKey: 'start_date'
    },
    {
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="p-0 hover:bg-transparent text-gray-900 font-medium"
                >
                    End Date
                    {column.getIsSorted() === "asc" ? (
                        <ArrowUp className="ml-2 h-4 w-4" />
                    ) : column.getIsSorted() === "desc" ? (
                        <ArrowDown className="ml-2 h-4 w-4" />
                    ) : (
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                </Button>
            )
        },
        cell: ({ row }) => row.original.end_date && ddmmyy(row.original.end_date),
        accessorKey: 'end_date'
    },
    {
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="p-0 hover:bg-transparent text-gray-900 font-medium"
                >
                    Unit Cost
                    {column.getIsSorted() === "asc" ? (
                        <ArrowUp className="ml-2 h-4 w-4" />
                    ) : column.getIsSorted() === "desc" ? (
                        <ArrowDown className="ml-2 h-4 w-4" />
                    ) : (
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                </Button>
            )
        },
        cell: ({ row }) => <UnitCost row={row} />,
        accessorKey: 'unit_cost'
    },
    {
        id: 'bill_copy',
        header: () => <span className="text-gray-900 font-medium">Bill Copy</span>,
        cell: ({ row }) => row.original.content ? <DocumentViewerModalWithPresigned
            contentType={row.original.content_type}
            fileKey={row.original.content}
        /> : null
    },
    {
        id: 'arrear_penalty',
        header: () => <span className="text-gray-900 font-medium">Arrear & Penalty</span>,
        cell: ({ row }) => {
            const arrear = Number(row.original.additional_charges?.arrears || 0);
            const penalty = Object.values(row.original.adherence_charges || {})
                .filter((value): value is number => typeof value === 'number')
                .reduce((sum, value) => sum + value, 0);
            return (
                <div className="flex gap-2">
                    {arrear !== 0 && (
                        <Badge variant={arrear > 0 ? 'destructive' : 'success'}  >
                            Arrear: {formatRupees(arrear)}
                        </Badge>
                    )}
                    {Number(penalty) > 0 && (
                        <Badge variant="destructive">
                            Penalty: {formatRupees(penalty)}
                        </Badge>
                    )}
                </div>
            );
        }
    }
];

export function BillTable({ data }: { data: AllBillTableProps[] }) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [pageSize, setPageSize] = useState(10);
    const [pageIndex, setPageIndex] = useState(0);
    const pageSizeOptions = [10, 20, 30, 40, 50];

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onPaginationChange: (updater) => {
            if (typeof updater === 'function') {
                const newState = updater(table.getState().pagination);
                setPageIndex(newState.pageIndex);
                setPageSize(newState.pageSize);
            } else {
                setPageIndex(updater.pageIndex);
                setPageSize(updater.pageSize);
            }
        },
        state: {
            sorting,
            columnFilters,
            pagination: {
                pageSize,
                pageIndex,
            },
        },
    });

    return (
        <div className="space-y-4 border rounded-lg p-4">
            <div className="text-lg font-bold text-gray-900">Bills</div>
            <div className="flex flex-col items-center justify-end gap-2 space-x-2 py-4 sm:flex-row">
                <div className="flex w-full items-center justify-between">
                    <div className="text-sm text-gray-900 font-medium">
                        Showing {table.getFilteredRowModel().rows.length} of {data.length} items
                    </div>
                    <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6 lg:gap-8">
                        <div className="flex items-center space-x-2">
                            <p className="whitespace-nowrap text-sm font-medium text-gray-900">Rows per page</p>
                            <Select
                                value={`${pageSize}`}
                                onValueChange={(value) => {
                                    table.setPageSize(Number(value));
                                    setPageSize(Number(value));
                                }}
                            >
                                <SelectTrigger className="h-8 w-[70px]">
                                    <SelectValue placeholder={pageSize} />
                                </SelectTrigger>
                                <SelectContent side="top">
                                    {pageSizeOptions.map((size) => (
                                        <SelectItem key={size} value={`${size}`}>
                                            {size}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
                <div className="flex w-full items-center justify-between gap-2 sm:justify-end">
                    <div className="flex w-[100px] items-center justify-center text-sm font-medium text-gray-900">
                        Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            className="hidden h-8 w-8 p-0 lg:flex"
                            onClick={() => table.setPageIndex(0)}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="hidden h-8 w-8 p-0 lg:flex"
                            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                            disabled={!table.getCanNextPage()}
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
            <div className="overflow-x-auto rounded-md border">
                <Table   {...{
                    style: {
                        width: table.getCenterTotalSize(),
                    },
                }}>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    style={{
                                        backgroundColor: row.original?.bill_type?.toLowerCase() === "abnormal" ? ABNORMAL_BILL_STATUS_COLOR : "",
                                    }}
                                    className={row.original?.bill_type?.toLowerCase() === "abnormal" ? "[&_td]:text-gray-900" : ""}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center text-gray-900"
                                >
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
} 