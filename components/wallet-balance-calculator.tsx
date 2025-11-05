'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Wallet, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import { formatRupees } from '@/lib/utils/number-format'
import { ddmmyy } from '@/lib/utils/date-format'
import { WalletProps } from '@/types/payments-type'
import { SearchParamsProps } from '@/types'
import { createQueryString } from '@/lib/createQueryString'
import CustomTable from '@/components/custom-table'
import { ColumnDef, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable, SortingState, PaginationState } from '@tanstack/react-table'
import { defaultColumnSizing } from '@/lib/utils/table'

interface WalletBalanceCalculatorProps {
    transactions: WalletProps[]
    totalCount: number
    pageCount: number
    searchParams: SearchParamsProps
}

// Define columns for the wallet transactions table
const columns: ColumnDef<WalletProps>[] = [
    {
        accessorKey: 'created_at',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="p-0 hover:bg-transparent"
                >
                    Date
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
        cell: ({ row }) => (
            <div className="text-xs">
                {ddmmyy(row.original.created_at)}
            </div>
        ),
        size: 120
    },
    {
        accessorKey: 'batch_id',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="p-0 hover:bg-transparent"
                >
                    Batch
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
        cell: ({ row }) => (
            <Badge variant="outline" className="text-xs">
                {row.original.batch_id}
            </Badge>
        ),
        size: 150
    },
    {
        accessorKey: 'transaction_type',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="p-0 hover:bg-transparent"
                >
                    Type
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
        cell: ({ row }) => (
            <Badge
                variant={row.original.transaction_type === 'credit' ? 'default' : 'destructive'}
                className={`text-xs ${row.original.transaction_type === 'credit'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                    }`}
            >
                {row.original.transaction_type.toUpperCase()}
            </Badge>
        ),
        size: 100
    },
    {
        accessorKey: 'amount',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="p-0 hover:bg-transparent text-right"
                >
                    Amount
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
        cell: ({ row }) => (
            <div className={`text-right font-medium text-xs ${row.original.transaction_type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                {formatRupees(row.original.amount)}
            </div>
        ),
        size: 120
    }
]

export default function WalletBalanceCalculator({
    transactions,
    totalCount,
    pageCount,
    searchParams
}: WalletBalanceCalculatorProps) {
    const router = useRouter()
    const pathname = usePathname()
    const [selectedBatch, setSelectedBatch] = useState<string>(searchParams.batch_id || 'all')
    const [isLoading, setIsLoading] = useState(false)

    // Pagination state
    const currentPage = Number(searchParams.page) || 1
    const pageSize = Number(searchParams.limit) || 10

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

    const handleBatchChange = (batchId: string) => {
        setIsLoading(true)
        setSelectedBatch(batchId)
        const queryParams = {
            page: '1',
            batch_id: batchId === 'all' ? undefined : batchId
        }
        router.push(`${pathname}?${createQueryString(new URLSearchParams(searchParams as Record<string, string>), queryParams)}`)
    }

    // Since we're using server-side pagination and filtering, we use the transactions directly
    const filteredTransactions = transactions

    const summary = useMemo(() => {
        const credits = filteredTransactions
            .filter(t => t.transaction_type === 'credit' && t.transaction_id)
            .reduce((sum, t) => sum + t.amount, 0)

        const debits = filteredTransactions
            .filter(t => t.transaction_type === 'debit' && t.transaction_id)
            .reduce((sum, t) => sum + t.amount, 0)

        return {
            credits,
            debits,
            balance: credits - debits,
            count: filteredTransactions.length
        }
    }, [filteredTransactions])

    const uniqueBatches = useMemo(() => {
        return Array.from(new Set(transactions.map(t => t.batch_id))).sort()
    }, [transactions])

    // Note: For a complete list of all batches, we would need to fetch them separately
    // or modify the service to return unique batch IDs along with the paginated data

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
        data: filteredTransactions,
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
                <h2 className="text-xl font-semibold">Wallet Balance</h2>
            </div>

            {/* Balance Overview */}
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardContent className="pt-6">
                    <div className="text-center">
                        <div className="text-3xl font-bold mb-1">
                            {formatRupees(summary.balance)}
                        </div>
                        <div className="text-sm opacity-90">Current Balance</div>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-3">
                <Card className="text-center p-3">
                    <div className="flex items-center justify-center gap-1 mb-1">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Credits</span>
                    </div>
                    <div className="text-lg font-bold text-green-600">{formatRupees(summary.credits)}</div>
                </Card>

                <Card className="text-center p-3">
                    <div className="flex items-center justify-center gap-1 mb-1">
                        <TrendingDown className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-medium">Debits</span>
                    </div>
                    <div className="text-lg font-bold text-red-600">{formatRupees(summary.debits)}</div>
                </Card>

                <Card className="text-center p-3">
                    <div className="text-sm font-medium mb-1">Transactions</div>
                    <div className="text-lg font-bold text-blue-600">{totalCount}</div>
                </Card>
            </div>

            {/* Filter */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Filter by Batch</CardTitle>
                </CardHeader>
                <CardContent>
                    <Select value={selectedBatch} onValueChange={handleBatchChange}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select batch" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Batches</SelectItem>
                            {uniqueBatches.map(batch => (
                                <SelectItem key={batch} value={batch || ''}>
                                    {batch}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {/* Transactions Table */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                        Transactions ({totalCount})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <CustomTable
                        table={table}
                        columns={columns}
                        isLoading={isLoading}
                        pageSize={pageSize}
                        totalCount={totalCount}
                    />
                </CardContent>
            </Card>
        </div>
    )
}