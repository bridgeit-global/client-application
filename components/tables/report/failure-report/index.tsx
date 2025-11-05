'use client';
import {
  PaginationState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  RowSelectionState
} from '@tanstack/react-table';
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import FilterAction from './filter-action';
import { getFilterDataLength, defaultColumnSizing } from '@/lib/utils/table';
import FilterChips from '@/components/filter-chip';
import CustomTable from '@/components/custom-table';
import { detailedColumns, summaryColumns } from './columns';
import ExportButton from '@/components/buttons/export-button';
import { DlqMessagesTableProps } from '@/types/dlq-messages-type';
import { SearchParamsProps } from '@/types';
import { createQueryString } from '@/lib/createQueryString';
import TableColumns from '@/components/table-columns';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { BarChart3, List } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DataTableProps {
  data: DlqMessagesTableProps[];
  initialBody: SearchParamsProps;
  totalCount: number;
  pageCount: number;
  searchParams?: SearchParamsProps;
  title?: string;
}

export function FailureReportTable({
  data,
  initialBody,
  pageCount,
  totalCount,
  title = "Failure Report"
}: DataTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filterBody, setFilterBody] = useState(initialBody);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [isBulkRetriggering, setIsBulkRetriggering] = useState(false);
  const { toast } = useToast();
  const isSummaryView = filterBody?.view === 'summary' || false;
  const defaultVisibleColumns = useMemo(() =>
    isSummaryView
      ? ['failure_date', 'dlq_type', 'biller_board', 'reason', 'failure_count', 'failure_percentage']
      : ['select', 'dlq_type', 'account_number', 'biller_list', 'created_at', 'reason', 'description', 're-trigger']
  , [isSummaryView]);

  // Search params
  const page = initialBody?.page;
  const perPage = initialBody?.limit;
  const pageAsNumber = Number(page);
  const fallbackPage =
    isNaN(pageAsNumber) || pageAsNumber < 1 ? 1 : pageAsNumber;
  const perPageAsNumber = Number(perPage);
  const fallbackPerPage = isNaN(perPageAsNumber) ? 10 : perPageAsNumber;

  // Handle server-side pagination
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: fallbackPage - 1,
    pageSize: fallbackPerPage
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const currentHash = window.location.hash;
    router.push(
      `${pathname}?${createQueryString(searchParams, {
        filter: filterBody,
        page: pageIndex + 1,
        limit: pageSize
      })}${currentHash}`, // Append the hash fragment
      {
        scroll: false
      }
    );
  }, [pageIndex, pageSize, filterBody, router, pathname, createQueryString]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
    }, 300); // Add a small delay to prevent flickering

    return () => clearTimeout(timeoutId);
  }, [data]);

  // Build table instance
  const table = useReactTable({
    data,
    // @ts-ignore
    columns: isSummaryView ? summaryColumns : detailedColumns,
    pageCount: pageCount ?? -1,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      pagination: { pageIndex, pageSize },
      rowSelection
    },
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    manualFiltering: true,
    enableRowSelection: true,
    defaultColumn: defaultColumnSizing,
    columnResizeMode: 'onChange'
  });

  const clearFilter = async () => {
    setIsLoading(true);
    // Reset pagination first
    setPagination({ pageIndex: 0, pageSize: fallbackPerPage });
    // Clear the filter body
    setFilterBody({});
    // Navigate to clean URL with only pagination params
    router.push(
      `${pathname}?page=1&limit=${fallbackPerPage}`,
      { scroll: false }
    );
    setIsLoading(false);
  };

  const applyFilters = useCallback(() => {
    const queryString = createQueryString(searchParams, {
      filter: filterBody,
      page: 1,
      limit: pageSize
    });

    router.push(
      `${pathname}?${queryString}`,
      {
        scroll: false
      }
    );
  }, [router, pathname, createQueryString, pageSize, filterBody]);

  const toggleView = useCallback((view: 'detailed' | 'summary') => {
    const newFilterBody = {
      ...filterBody,
      view: view === 'summary' ? 'summary' : undefined
    };
    setFilterBody(newFilterBody);
    
    const queryString = createQueryString(searchParams, {
      filter: newFilterBody,
      page: 1,
      limit: pageSize
    });

    router.push(
      `${pathname}?${queryString}`,
      {
        scroll: false
      }
    );
  }, [router, pathname, createQueryString, pageSize, filterBody]);

  const filterCount = getFilterDataLength(filterBody);

  // Columns to pass to table container for sizing fallback
  const currentColumns = useMemo(() => (isSummaryView ? summaryColumns : detailedColumns), [isSummaryView]);

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedCount = selectedRows.length;

  const handleBulkRetrigger = async () => {
    if (selectedCount === 0) return;

    setIsBulkRetriggering(true);
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    try {
      // Process each selected row
      for (const row of selectedRows) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_UPLOAD_PDF_URL}/apis/redrive-dlq-messages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              dlqType: row.original.dlq_type,
              biller_id: row.original.biller_id,
              message_id: row.original.message_id,
              message_data: row.original.message_data
            })
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
          }

          results.success++;
        } catch (error: any) {
          results.failed++;
          results.errors.push(`Row ${row.original.account_number}: ${error.message}`);
        }
      }

      // Show results
      if (results.success > 0) {
        toast({
          title: "Bulk Retrigger Complete",
          description: `Successfully retriggered ${results.success} failures${results.failed > 0 ? `, ${results.failed} failed` : ''}`,
          variant: results.failed > 0 ? "destructive" : "default",
        });
      }

      if (results.failed > 0) {
        console.error('Bulk retrigger errors:', results.errors);
      }

      // Clear selection and refresh
      setRowSelection({});
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to perform bulk retrigger operation",
        variant: "destructive",
      });
    } finally {
      setIsBulkRetriggering(false);
    }
  };

  return (
    <>
      <div className="flex flex-1 flex-col justify-between gap-2 md:flex-row">
        <div className="flex gap-2">
          <div className="space-y-2">
            <h2 className="flex items-center gap-2 text-2xl font-medium">
              {title}
            </h2>
            <div className="flex gap-2">
              <Button
                variant={!isSummaryView ? "default" : "outline"}
                size="sm"
                onClick={() => toggleView('detailed')}
                className="flex items-center gap-2"
              >
                <List className="h-4 w-4" />
                Detailed
              </Button>
              <Button
                variant={isSummaryView ? "default" : "outline"}
                size="sm"
                onClick={() => toggleView('summary')}
                className="flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Summary
              </Button>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {selectedCount > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  disabled={isBulkRetriggering}
                  className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
                >
                  {isBulkRetriggering ? "Processing..." : `Retrigger ${selectedCount} Selected`}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Bulk Retrigger Failures</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to retrigger {selectedCount} selected failure(s)? This will attempt to process all selected failed messages again.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleBulkRetrigger}
                    disabled={isBulkRetriggering}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {isBulkRetriggering ? "Processing..." : "Yes, Retrigger All"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
                     <FilterAction
             handleClearFilter={clearFilter}
             handleApplyFilters={applyFilters}
             filterBody={filterBody}
             setFilterBody={setFilterBody}
             isSummaryView={isSummaryView}
           />
          <ExportButton file_name="failure_report" />
          <TableColumns table={table} />
        </div>
      </div>
      <div className="my-2">
        <FilterChips
          filterBody={filterBody}
          setFilterBody={setFilterBody}
          fetchData={applyFilters}
        />
      </div>
      <CustomTable
        defaultVisibleColumns={defaultVisibleColumns}
        // @ts-ignore
        columns={currentColumns}
        isLoading={isLoading}
        pageSize={pageSize}
        table={table}
        totalCount={totalCount}
      />
    </>
  );
}
