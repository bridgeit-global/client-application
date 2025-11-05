"use client"

import React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { DoubleArrowLeftIcon, DoubleArrowRightIcon } from "@radix-ui/react-icons"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { type ColumnDef, flexRender, Table as TableInstance } from "@tanstack/react-table"
import { Skeleton } from "@/components/ui/skeleton"
import { ABNORMAL_BILL_STATUS_COLOR } from "@/constants/colors"
import { cn } from "@/lib/utils"


interface CustomTableProps<TData> {
  table: TableInstance<TData>;
  columns: ColumnDef<TData>[];
  isLoading: boolean;
  pageSize: number;
  totalCount: number;
  defaultVisibleColumns?: string[];
}

export default function CustomTable<TData>({
  table,
  columns,
  isLoading,
  pageSize,
  totalCount,
  defaultVisibleColumns,
}: CustomTableProps<TData>) {
  const pageSizeOptions: number[] = [5, 10, 20, 30, 40, 60]
  const initialSetupDone = React.useRef(false)


  React.useEffect(() => {
    if (!initialSetupDone.current && defaultVisibleColumns) {
      table.getAllColumns().forEach((column) => {
        const columnId = column.id || ""
        const isVisible = defaultVisibleColumns.includes(columnId)
        column.toggleVisibility(isVisible)
      })
      initialSetupDone.current = true
    }
  }, [defaultVisibleColumns])

  return (
    <>
      <div className="flex flex-col items-center justify-end gap-2 space-x-2 py-4 text-muted-foreground  sm:flex-row">
        <div className="flex w-full items-center justify-between">
          <div className="flex flex-1 flex-col text-sm md:flex-row">
            <div className="mr-2">
              {table.getFilteredSelectedRowModel().rows.length} of {totalCount}
            </div>
            <div>row(s) selected.</div>
          </div>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6 lg:gap-8">
            <div className="flex items-center space-x-2">
              <p className="whitespace-nowrap text-sm font-medium">Rows per page</p>
              <Select
                value={`${pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value))
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={table.getState().pagination.pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {pageSizeOptions.map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="flex w-full items-center justify-between gap-2 sm:justify-end">
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            {isLoading ? 'Loading...' : `Page ${table.getState().pagination.pageIndex + 1} of ${table.getPageCount()}`}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              aria-label="Go to first page"
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <DoubleArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              aria-label="Go to previous page"
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              aria-label="Go to next page"
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              aria-label="Go to last page"
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <DoubleArrowRightIcon className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto rounded-md border">
        <Table
          {...{
            style: {
              width: table.getCenterTotalSize(),
            },
          }}
        >
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow className="border-none" key={headerGroup.id}>
                {headerGroup.headers.map((header, index) => {
                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      style={{
                        width: header.getSize(),
                        position: "relative",
                      }}
                      className="overflow-hidden text-ellipsis whitespace-nowrap"
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          {...{
                            className: "h-full group",
                            onMouseDown: header.getResizeHandler(),
                            onTouchStart: header.getResizeHandler(),
                            style: {
                              cursor: "col-resize",
                              position: "absolute",
                              right: 0,
                              top: 0,
                              height: "100%",
                              width: "5px",
                              transition: "background-color 150ms ease",
                            },
                            onMouseEnter: (e) => {
                              e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.2)"
                            },
                            onMouseLeave: (e) => {
                              if (!header.column.getIsResizing()) {
                                e.currentTarget.style.backgroundColor = "transparent"
                              }
                            }
                          }}
                          className={`h-full ${header.column.getIsResizing() ? "bg-black/50" : ""}`}
                        />
                      )}
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {Array.from({ length: pageSize }, (_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row: any) => (
                <TableRow
                  className={cn(
                    "border-none items-start",
                    row.original?.bill_type?.toLowerCase() === "abnormal" ? "[&_td]:text-gray-900" : ""
                  )}
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  style={{
                    backgroundColor: row.original?.bill_type?.toLowerCase() === "abnormal" ? ABNORMAL_BILL_STATUS_COLOR : "",
                  }}
                >
                  {row.getVisibleCells().map((cell: any, index: any) => (
                    <TableCell
                      key={cell.id}
                      style={{
                        maxWidth: cell.column.getSize(),
                      }}
                      className="overflow-hidden text-ellipsis whitespace-nowrap"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  )
}

