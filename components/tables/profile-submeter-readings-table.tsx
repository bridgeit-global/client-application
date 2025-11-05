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
    Eye,
    Images,
    Image,
} from "lucide-react";
import { SubmeterReadingProps } from "@/types/submeter-readings-type";
import { ddmmyy } from "@/lib/utils/date-format";
import { ImageViewerModal } from "@/components/image-viewer-modal";

// Helper component for image viewing in table cells
function ImageViewerCell({ imageUrls, reading }: {
    imageUrls: string[],
    reading: SubmeterReadingProps
}) {
    const [isViewerOpen, setIsViewerOpen] = useState(false)
    const isMultiple = imageUrls.length > 1

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => setIsViewerOpen(true)}
            >
                {isMultiple ? (
                    <>
                        <Images className="w-4 h-4" />
                        <span>{imageUrls.length} Images</span>
                    </>
                ) : (
                    <>
                        <Eye className="w-4 h-4" />
                        <span>View Image</span>
                    </>
                )}
            </Button>

            <ImageViewerModal
                isOpen={isViewerOpen}
                onClose={() => setIsViewerOpen(false)}
                images={imageUrls}
                title={`Meter Snapshot`}
                description={`Reading Date: ${ddmmyy(reading.reading_date)}`}
            />
        </>
    )
}

const columns: ColumnDef<SubmeterReadingProps>[] = [
    {
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="p-0 hover:bg-transparent"
                >
                    Reading Date
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
        cell: ({ row }) => row.original.reading_date && ddmmyy(row.original.reading_date),
        accessorKey: 'reading_date'
    },
    {
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="p-0 hover:bg-transparent"
                >
                    Start Reading
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
        cell: ({ row }) => row.original.start_reading?.toLocaleString() || '0',
        accessorKey: 'start_reading'
    },
    {
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="p-0 hover:bg-transparent"
                >
                    End Reading
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
        cell: ({ row }) => row.original.end_reading?.toLocaleString() || '0',
        accessorKey: 'end_reading'
    },
    {
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="p-0 hover:bg-transparent"
                >
                    Per Day Unit
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
        cell: ({ row }) => row.original.per_day_unit?.toLocaleString() || 'N/A',
        accessorKey: 'per_day_unit'
    },
    {
        id: 'snapshot_urls',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="p-0 hover:bg-transparent"
                >
                    Meter Snapshot
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
        cell: ({ row }) => {
            const reading = row.original;
            const snapshotUrls = reading.snapshot_urls;

            // Handle different possible types for snapshot_urls
            let urlsArray: string[] = [];
            if (Array.isArray(snapshotUrls)) {
                urlsArray = snapshotUrls.filter((url): url is string => typeof url === 'string' && url.trim() !== '');
            } else if (typeof snapshotUrls === 'string' && snapshotUrls.trim() !== '') {
                urlsArray = [snapshotUrls.trim()];
            }

            if (urlsArray.length === 0) {
                return (
                    <div className="flex items-center text-muted-foreground">
                        <Image className="w-4 h-4 mr-2" />
                        <span className="text-sm">No image</span>
                    </div>
                );
            }

            return (
                <ImageViewerCell
                    imageUrls={urlsArray}
                    reading={reading}
                />
            );
        },
        accessorFn: (row) => {
            const snapshotUrls = row.snapshot_urls;
            if (!snapshotUrls) return 0;

            if (Array.isArray(snapshotUrls)) {
                return snapshotUrls.filter((url): url is string => typeof url === 'string').length;
            } else if (typeof snapshotUrls === 'string') {
                return 1;
            }
            return 0;
        }
    },
    {
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="p-0 hover:bg-transparent"
                >
                    Created At
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
        cell: ({ row }) => row.original.created_at && ddmmyy(row.original.created_at),
        accessorKey: 'created_at'
    }
];

export function ProfileSubmeterReadingsTable({ data }: { data: SubmeterReadingProps[] }) {
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
            <div className="text-lg font-bold">Submeter Readings</div>
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
                                    No submeter readings found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
