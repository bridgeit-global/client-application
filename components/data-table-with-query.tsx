'use client';

import { useEffect, useState } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef, SortingState, OnChangeFn } from '@tanstack/react-table';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { useAsyncOperation } from '@/hooks/use-supabase-error';

interface DataTableWithQueryProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  queryFn: (searchParams: any, options?: any) => Promise<{ data: TData[]; totalCount: number; pageCount: number }>;
  queryOptions?: any;
  searchParams?: any;
  renderData?: (data: TData[]) => React.ReactNode;
}

export function DataTableWithQuery<TData, TValue>({
  columns,
  queryFn,
  queryOptions,
  searchParams = {},
  renderData
}: DataTableWithQueryProps<TData, TValue>) {
  const { loading, error, data, execute, clearError } = useAsyncOperation<{ data: TData[]; totalCount: number; pageCount: number }>();
  const [sorting, setSorting] = useState<SortingState>([]);

  const handleSortingChange: OnChangeFn<SortingState> = (updater) => {
    setSorting(typeof updater === 'function' ? updater(sorting) : updater);
  };

  const handleExportToExcel = () => {
    try {
      // Convert data to worksheet
      const ws = XLSX.utils.json_to_sheet(data?.data || []);

      // Create workbook and add worksheet
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data');

      // Generate Excel file and trigger download
      XLSX.writeFile(wb, 'exported-data.xlsx');
    } catch (err) {
      console.error('Error exporting to Excel:', err);
    }
  };

  useEffect(() => {
    execute(async () => {
      // Add sorting parameters to the query
      const sortingParams = sorting.length > 0 ? {
        sort: sorting[0].id,
        order: sorting[0].desc ? 'desc' : 'asc'
      } : {};

      const result = await queryFn(
        {
          ...searchParams,
          ...sortingParams
        },
        queryOptions
      );
      return result;
    });
  }, [queryFn, searchParams, queryOptions, sorting, execute]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      {renderData && renderData(data?.data || [])}
      <DataTable
        handleExportToExcel={handleExportToExcel}
        columns={columns}
        data={data?.data || []}
        sorting={sorting}
        onSortingChange={handleSortingChange}
      />
    </div>
  );
} 