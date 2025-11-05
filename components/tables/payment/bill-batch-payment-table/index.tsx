'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  PaginationState,
  useReactTable
} from '@tanstack/react-table';
import { getFilterDataLength, defaultColumnSizing } from '@/lib/utils/table';
import FilterChips from '@/components/filter-chip';
import CustomTable from '@/components/custom-table';
import { columns } from './columns';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SearchParamsProps } from '@/types';
import { createQueryString } from '@/lib/createQueryString';
import { ClientPaymentsProps } from '@/types/payments-type';
import { Button } from '@/components/ui/button';
import { formatRupees } from '@/lib/utils/number-format';
import FilterAction from './filter-action';
import { ArrowUpRight, FilterX } from 'lucide-react';
import TableColumns from '@/components/table-columns';
import ApproveIncreaseAmountDialog from './approval-increase-amount-dialog';
import { useIncreaseAmountModalStore } from '@/lib/store/increase-amount-modal-store';
import BatchHistoryTimeline from '@/components/batch/batch-history-timeline';
import BillPaymentTimeline from '@/components/bill/bill-payment-timeline';

type DataTableProps = {
  data: ClientPaymentsProps[];
  initialBody: SearchParamsProps;
  totalCount: number;
  pageCount: number;
  searchParams?: SearchParamsProps;
  batchId: string;
  increaseAmountRecords?: ClientPaymentsProps[];
  allBills: ClientPaymentsProps[];
};

export function BillBatchPaymentTable({
  data,
  initialBody,
  pageCount,
  totalCount,
  increaseAmountRecords,
  allBills
}: DataTableProps) {
  const { isModalOpen, setIsModalOpen } = useIncreaseAmountModalStore();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filterBody, setFilterBody] = useState(initialBody);
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

  // Sync pagination state with URL parameters
  useEffect(() => {
    if (page && perPage) {
      setPagination({
        pageIndex: fallbackPage - 1,
        pageSize: fallbackPerPage
      });
    }
  }, [page, perPage, fallbackPage, fallbackPerPage]);

  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    setIsLoading(true);
    const currentHash = window.location.hash;
    router.push(
      `${pathname}?${createQueryString(searchParams, {
        ...filterBody,
        page: pageIndex + 1,
        limit: pageSize
      })}${currentHash}`,
      {
        scroll: false
      }
    );
  }, [pageIndex, pageSize, filterBody, router, pathname, searchParams]);

  useEffect(() => {
    setIsLoading(false);
  }, [data]);


  const table = useReactTable({
    data: data as any,
    columns: columns,
    pageCount: pageCount ?? -1,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      pagination: { pageIndex, pageSize }
    },
    onPaginationChange: setPagination,
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    manualFiltering: true,
    defaultColumn: defaultColumnSizing,
    columnResizeMode: 'onChange'
  });

  const clearFilter = useCallback(() => {
    setFilterBody({});
  }, []);

  const applyFilters = useCallback(() => {
    router.push(
      `${pathname}?${createQueryString(searchParams, {
        ...filterBody,
        page: 1,
        limit: pageSize
      })}`,
      {
        scroll: false
      }
    );
  }, [router, pathname, createQueryString, pageSize, filterBody]);
  const filterCount = useMemo(() => getFilterDataLength(filterBody), [filterBody]);

  const summary = useMemo(() => {
    let totalBillAmount = 0;
    let totalPaidAmount = 0;
    let totalIncreaseAmount = 0;
    let totalRefundAmount = 0;
    let totalReversedAmount = 0;

    // Get batch dates from the first row (all rows should have the same batch)
    const batchCreatedAt = allBills[0]?.batches?.created_at ? new Date(allBills[0].batches.created_at) : null;
    const batchUpdatedAt = allBills[0]?.batches?.updated_at ? new Date(allBills[0].batches.updated_at) : batchCreatedAt;

    const isWithinBatchWindow = (dateStr?: string) => {
      if (!dateStr || !batchCreatedAt || !batchUpdatedAt) return false;
      const d = new Date(dateStr);
      return d >= batchCreatedAt;
    };

    allBills.forEach((row) => {
      const billAmount = Number(row.bill_amount) || 0;
      const clientPaidAmount = Number(row.client_paid_amount) || 0;
      const approvedAmount = Number(row.bills?.approved_amount) || 0 + Number(row.prepaid_recharge?.recharge_amount) || 0;
      const refundAmount = row?.bills?.refund_payment_transactions?.length > 0 ? Number(row?.bills?.refund_payment_transactions?.reduce((acc, payment) => acc + (payment.amount || 0), 0)) : 0 + Number(row.prepaid_recharge?.refund_payment_transactions?.length > 0 ? Number(row.prepaid_recharge?.refund_payment_transactions?.reduce((acc, payment) => acc + (payment.amount || 0), 0)) : 0);

      // Calculate paid amount excluding reversals
      let actualPaidAmount = row.status === 'paid' ? Number(row.paid_amount) : 0;
      let reversedAmount = row.status === 'refund' ? Number(row.paid_amount) : 0;

      totalBillAmount += billAmount;
      totalPaidAmount += actualPaidAmount;
      totalRefundAmount += refundAmount;
      totalReversedAmount += reversedAmount;
    });

    return {
      totalBillAmount,
      totalPaidAmount: totalPaidAmount,
      totalIncreaseAmount,
      totalRefundAmount,
      totalReversedAmount,
      paidPercent: totalBillAmount > 0 ? ((totalPaidAmount) / totalBillAmount) * 100 : 0,
      increasePercent: totalBillAmount > 0 ? (totalIncreaseAmount / totalBillAmount) * 100 : 0,
      totalRefundPercent: totalBillAmount > 0 ? (totalRefundAmount / totalBillAmount) * 100 : 0,
      reversedPercent: totalBillAmount > 0 ? (totalReversedAmount / totalBillAmount) * 100 : 0,
    };
  }, [allBills]);


  let historyItems = Array.isArray(data[0]?.batches?.user_actions)
    ? (data[0]?.batches?.user_actions as any[]).map((u: any) => ({
      action: u?.action || 'updated',
      user_id: u?.user_id || '',
      status_to: u?.status_to || data[0]?.batches?.batch_status || 'unpaid',
      status_from: u?.status_from ?? undefined,
      timestamp: u?.timestamp || u?.created_at || data[0]?.batches?.created_at || new Date().toISOString(),
      note: u?.note || null
    }))
    : []

  if ((historyItems?.length || 0) === 0 && data[0]?.batches) {
    historyItems = [{
      action: 'created',
      user_id: data[0]?.batches?.created_by || '',
      status_to: 'unpaid',
      status_from: null,
      timestamp: data[0]?.batches?.created_at || new Date().toISOString(),
      note: data[0]?.batches?.batch_name ? `Batch "${data[0]?.batches.batch_name}" created` : null
    }]
  }

  return (
    <>
      <div className="flex flex-1 flex-col justify-between gap-2 md:flex-row">
        <div className="flex gap-2">
          <div className="space-y-2">
            <h2 className="flex flex-col gap-2 text-2xl font-medium md:flex-row">
              <span>Manage Batch of Bill ({data[0]?.batch_id})</span>
            </h2>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <ApproveIncreaseAmountDialog
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
            increaseAmountRecords={increaseAmountRecords || []}
          />
          <FilterAction
            handleClearFilter={clearFilter}
            handleApplyFilters={applyFilters}
            filterBody={filterBody}
            setFilterBody={setFilterBody}
          />
          {filterCount > 0 ? (
            <Button onClick={clearFilter}>
              {filterCount} <FilterX className="ml-2 h-4 w-4" />
            </Button>
          ) : null}
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
      <div className="flex flex-wrap gap-4 my-4">
        {summary.totalPaidAmount > 0 && <div className="flex-1 min-w-[200px] bg-green-50 border border-green-200 rounded p-3">
          <div className="text-xs text-green-700 font-semibold">Paid Amount</div>
          <div className="text-lg font-bold text-green-900">{formatRupees(summary.totalPaidAmount)}
            <span className="ml-2 text-sm font-normal text-green-700">({summary.paidPercent.toFixed(1)}%)</span>
          </div>
        </div>}
        {increaseAmountRecords && increaseAmountRecords.length > 0 && (
          <Button variant="destructive" onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4" />
            <div className="text-xs text-white font-semibold">Increase Amount</div>
            <div className="text-lg font-bold text-white">{formatRupees(summary.totalIncreaseAmount)}
              <span className="ml-2 text-sm font-normal text-white">({summary.increasePercent.toFixed(1)}%)</span>
            </div>
          </Button>
        )}
        {summary.totalRefundAmount > 0 && <div className="flex-1 min-w-[200px] bg-blue-50 border border-blue-200 rounded p-3">
          <div className="text-xs text-blue-700 font-semibold">Refund Amount</div>
          <div className="text-lg font-bold text-blue-900">{formatRupees(summary.totalRefundAmount)}
            <span className="ml-2 text-sm font-normal text-blue-700">({summary.totalRefundPercent.toFixed(1)}%)</span>
          </div>
        </div>}
        {summary.totalReversedAmount > 0 && <div className="flex-1 min-w-[200px] bg-orange-50 border border-orange-200 rounded p-3">
          <div className="text-xs text-orange-700 font-semibold">Reversed Amount</div>
          <div className="text-lg font-bold text-orange-900">{formatRupees(summary.totalReversedAmount)}
            <span className="ml-2 text-sm font-normal text-orange-700">({summary.reversedPercent.toFixed(1)}%)</span>
          </div>
        </div>}
      </div>
      <CustomTable
        columns={columns}
        isLoading={isLoading}
        pageSize={pageSize}
        table={table}
        totalCount={totalCount}
      />
      <div className="my-4">
        <BatchHistoryTimeline items={historyItems} title="Batch Activity" />
      </div>
    </>
  );
}
