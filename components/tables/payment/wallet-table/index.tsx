'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Wallet, TrendingUp, TrendingDown, FilterX } from 'lucide-react'
import { formatRupees } from '@/lib/utils/number-format'
import { WalletProps, WalletSummaryProps } from '@/types/payments-type'
import { SearchParamsProps } from '@/types'
import { createQueryString } from '@/lib/createQueryString'
import CustomTable from '@/components/custom-table'
import { getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable, SortingState, PaginationState } from '@tanstack/react-table'
import { defaultColumnSizing } from '@/lib/utils/table'
import FilterAction from './filter-action'
import ExportButton from '@/components/buttons/export-button'
import TableColumns from '@/components/table-columns'
import FilterChips from '@/components/filter-chip'
import { Button } from '@/components/ui/button'
import { getFilterDataLength } from '@/lib/utils/table'
import { getWalletColumns } from './columns'
import { useUtilizeAndThresholdAmount } from '@/hooks/use-utilize-amount'

interface WalletBalanceCalculatorProps {
  transactions: WalletProps[]
  totalCount: number
  pageCount: number
  searchParams: SearchParamsProps
  summary: WalletSummaryProps
  pendingAmount: number
  side: 'support' | 'portal'
}

export default function WalletTable({
  transactions,
  totalCount,
  pageCount,
  searchParams,
  summary,
  pendingAmount,
  side
}: WalletBalanceCalculatorProps) {

  const columns = getWalletColumns(side)
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)
  const { thresholdAmount, utilizeAmount, isLoading: isUtilizeLoading } = useUtilizeAndThresholdAmount()

  const availableLimit = useMemo(
    () => Math.max(thresholdAmount - utilizeAmount, 0),
    [thresholdAmount, utilizeAmount]
  )

  const availableLimitClass = (thresholdAmount - utilizeAmount) >= 0 ? 'text-green-500' : 'text-red-500'

  // Filter state
  const [filterBody, setFilterBody] = useState<any>({
    transaction_type: searchParams.transaction_type || '',
    batch_id: searchParams.batch_id || '',
    transaction_id: searchParams.transaction_id || '',
    amount_min: searchParams.amount_min || '',
    amount_max: searchParams.amount_max || '',
    date_from: searchParams.date_from || '',
    date_to: searchParams.date_to || '',
    remarks: searchParams.remarks || ''
  })

  // Pagination state
  const currentPage = Number(searchParams.page) || 1
  const pageSize = Number(searchParams.limit) || 10

  // Filter count
  const filterCount = useMemo(() => getFilterDataLength(filterBody), [filterBody])

  // Pagination functions
  const handlePageChange = (newPage: number) => {
    setIsLoading(true)
    const queryParams = {
      page: String(newPage)
    }
    router.push(`${pathname}?${createQueryString(new URLSearchParams(searchParams as Record<string, string>), queryParams)}`)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setIsLoading(true)
    const queryParams = {
      page: '1',
      limit: String(newPageSize)
    }
    router.push(`${pathname}?${createQueryString(new URLSearchParams(searchParams as Record<string, string>), queryParams)}`)
  }



  // Filter functions
  const applyFilters = () => {
    setIsLoading(true)
    const queryParams: Record<string, string> = {
      page: '1'
    }

    // Add filter parameters
    Object.entries(filterBody).forEach(([key, value]) => {
      if (value && value !== '') {
        queryParams[key] = String(value)
      }
    })

    router.push(`${pathname}?${createQueryString(new URLSearchParams(searchParams as Record<string, string>), queryParams)}`)
  }

  const clearFilter = () => {
    setFilterBody({
      transaction_type: '',
      batch_id: '',
      transaction_id: '',
      amount_min: '',
      amount_max: '',
      date_from: '',
      date_to: '',
      remarks: ''
    })
    router.push(pathname)
  }

  // Reset loading state when data changes
  useEffect(() => {
    if (transactions.length > 0) {
      setIsLoading(false)
    }
  }, [transactions])

  // Table configuration
  const [{ pageIndex, pageSize: tablePageSize }, setPagination] = useState<PaginationState>({
    pageIndex: currentPage - 1,
    pageSize: pageSize
  })

  const [sorting, setSorting] = useState<SortingState>(() => {
    if (searchParams.sort && searchParams.order) {
      return [
        {
          id: searchParams.sort,
          desc: searchParams.order === 'desc'
        }
      ];
    }
    return [];
  })

  const table = useReactTable({
    data: transactions,
    columns,
    pageCount: pageCount ?? -1,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      pagination: { pageIndex, pageSize: tablePageSize },
      sorting,
    },
    onSortingChange: (updater) => {
      setIsLoading(true)
      const newSorting = typeof updater === 'function' ? updater(sorting) : updater
      setSorting(newSorting)

      // Update URL with sorting parameters
      const queryParams: Record<string, string> = {
        page: '1' // Reset to first page when sorting changes
      }

      if (newSorting.length > 0) {
        queryParams.sort = newSorting[0].id
        queryParams.order = newSorting[0].desc ? 'desc' : 'asc'
      }

      router.push(`${pathname}?${createQueryString(new URLSearchParams(searchParams as Record<string, string>), queryParams)}`)
    },
    onPaginationChange: (updater) => {
      const newState = typeof updater === 'function' ? updater({ pageIndex, pageSize: tablePageSize }) : updater
      setPagination(newState)
      handlePageChange(newState.pageIndex + 1)
      if (newState.pageSize !== tablePageSize) {
        handlePageSizeChange(newState.pageSize)
      }
    },
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
    defaultColumn: defaultColumnSizing,
    columnResizeMode: 'onChange'
  })

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Wallet className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-semibold">Statement</h2>
      </div>

      {/* Balance Overview */}
      <Card>
        <CardContent className="pt-6 flex justify-between">
          <div className="text-center p-4 rounded-lg w-1/2">
            <div className="text-sm opacity-90"> Available Limit</div>
            <div className={`text-3xl font-bold mb-1 ${availableLimitClass}`}>
              {isUtilizeLoading ? '—' : formatRupees(availableLimit)}
            </div>
          </div>
          <div className="text-center text-red-500 p-4 rounded-lg w-1/2">
            <div className="text-sm opacity-90">Pending for Payment</div>
            <div className="text-3xl font-bold mb-1">
              {formatRupees(pendingAmount)}
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center p-3">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium">
              {side === 'portal' ? 'Total Paid to BridgeIT' : 'Total Credits'}
            </span>
          </div>
          <div className="text-lg font-bold text-red-600">{formatRupees(summary.credits)}</div>
        </Card>

        <Card className="text-center p-3">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingDown className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">
              {side === 'portal' ? 'Total Pay for Biller' : 'Total Debits'}
            </span>
          </div>
          <div className="text-lg font-bold text-green-600">{formatRupees(summary.debits)}</div>
        </Card>

        <Card className="text-center p-3">
          <div className="text-sm font-medium mb-1">Total Transactions</div>
          <div className="text-lg font-bold text-blue-600">{totalCount}</div>
        </Card>
      </div>

      {/* Filter and Export Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FilterAction
            filterBody={filterBody}
            setFilterBody={setFilterBody}
            handleApplyFilters={applyFilters}
            handleClearFilter={clearFilter}
          />
          {filterCount > 0 && (
            <Button onClick={clearFilter} variant="outline">
              {filterCount} <FilterX className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ExportButton file_name={`${side}_statement`} />
          <TableColumns table={table} />
        </div>
      </div>

      {/* Filter Chips */}
      <div className="my-2">
        <FilterChips
          filterBody={filterBody}
          setFilterBody={setFilterBody}
          fetchData={applyFilters}
        />
      </div>

      {/* Transactions Table */}
      <CustomTable
        table={table}
        columns={columns}
        isLoading={isLoading}
        pageSize={pageSize}
        totalCount={totalCount}
      />
    </div>
  )
}