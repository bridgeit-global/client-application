"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
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
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight
} from "lucide-react";
import { useRouter } from "next/navigation";

interface ZoneData {
    zone_id: string;
    active_count: number;
    inactive_count: number;
    total_count: number;
}

const columns: ColumnDef<ZoneData>[] = [
    {
        accessorKey: "zone_id",
        cell: ({ row }) => {
            const router = useRouter()
            return (
                <Button size="sm" variant="link" onClick={() => router.push(`/portal/site/sites?zone_id=${row.original.zone_id}`)}>
                    {row.original.zone_id}
                </Button>
            );
        },
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="hover:bg-transparent"
                >
                    Zone ID
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
    },
    {
        accessorKey: "active_count",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="hover:bg-transparent"
                >
                    Active
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const value = row.getValue("active_count") as number;
            const total = row.getValue("total_count") as number;
            const percentage = ((value / total) * 100).toFixed(1);
            return (
                <div className="flex items-center gap-2">
                    <span>{value}</span>
                    <span className="text-xs text-gray-500">({percentage}%)</span>
                </div>
            );
        },
    },
    {
        accessorKey: "inactive_count",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="hover:bg-transparent"
                >
                    Inactive
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const value = row.getValue("inactive_count") as number;
            const total = row.getValue("total_count") as number;
            const percentage = ((value / total) * 100).toFixed(1);
            return (
                <div className="flex items-center gap-2">
                    <span>{value}</span>
                    <span className="text-xs text-gray-500">({percentage}%)</span>
                </div>
            );
        },
    },
    {
        accessorKey: "total_count",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="hover:bg-transparent"
                >
                    Total
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
    },
];

export function ZoneTable({ data }: { data: ZoneData[] }) {
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
        <div className="space-y-4">
            <Input
                placeholder="Filter by zone ID..."
                value={(table.getColumn("zone_id")?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                    table.getColumn("zone_id")?.setFilterValue(event.target.value)
                }
                className="max-w-sm"
            />
            <div className="flex flex-col items-center justify-end gap-2 space-x-2 py-4 text-muted-foreground sm:flex-row">
                <div className="flex w-full items-center justify-between">
                    <div className="text-sm">
                        Showing {table.getFilteredRowModel().rows.length} of {data.length} items
                    </div>
                    <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6 lg:gap-8">
                        <div className="flex items-center space-x-2">
                            <p className="whitespace-nowrap text-sm font-medium">Rows per page</p>
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
                    <div className="flex w-[100px] items-center justify-center text-sm font-medium">
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
            <Table>
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
                                className="h-24 text-center"
                            >
                                No results.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
} 