"use client"
import { WalletProps } from "@/types/payments-type"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react"
import { formatRupees } from "@/lib/utils/number-format"
import { formatDateWithTime } from "@/lib/utils/date-format"
import { Button } from "@/components/ui/button"
import ViewBatchButton from "@/components/buttons/view-batch-button"
import { useSiteName } from "@/lib/utils/site"
import { SiteAccountBoardCell } from "@/components/table-cells/site-account-board-cell"

// Define columns for the wallet transactions table (Bank Statement Format)

export const getWalletColumns = (side: 'support' | 'portal'): ColumnDef<WalletProps>[] => {

    if (side === 'portal') {
        return portalWalletColumns
    } else {
        return supportWalletColumns
    }
}

export const portalWalletColumns: ColumnDef<WalletProps>[] = [
    {
        id: 'id',
        header: () => useSiteName(),
        cell: ({ row }) => {
            const bill = row.original.bills || row.original.prepaid_recharge
            return (
                <div>
                    {bill ? <SiteAccountBoardCell row={{ original: bill }} /> : null}
                </div>
            )
        },
    },
    {
        accessorKey: 'batch_id',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="p-0 hover:bg-transparent font-semibold"
                >
                    Batch ID
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
        size: 200,
        cell: ({ row }) => row.original.batch_id ? <ViewBatchButton link={`/portal/batch-payment/${row.original.batch_id}`} batchId={row.original.batch_id || ''} /> : null,
    },
    {
        accessorKey: 'created_at',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="p-0 hover:bg-transparent font-semibold"
                >
                    Date & Time
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
                {formatDateWithTime(row.original.created_at)}
            </div>
        ),
        size: 200
    },
    {
        id: 'transaction_id',
        header: 'Transaction ID',
        cell: ({ row }) => {
            const transaction = row.original
            return (
                <div className="text-xs text-muted-foreground">
                    Transaction ID: {transaction.transaction_id}
                </div>
            )
        },
        size: 250
    },
    {
        id: 'amount',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="p-0 hover:bg-transparent font-semibold text-right"
                >
                    Paid to BridgeIT
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
            const amount = row.original.transaction_type === 'credit' ? row.original.amount : 0
            return (
                <div className="text-sm font-medium text-red-600">
                    {amount > 0 ? formatRupees(amount) : '-'}
                </div>
            )
        },
        size: 120
    },
    {
        id: 'amount',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="p-0 hover:bg-transparent font-semibold text-right"
                >
                    Pay for Biller
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
            const amount = row.original.transaction_type === 'debit' ? row.original.amount : 0
            return (
                <div className="text-sm font-medium text-green-600">
                    {amount > 0 ? formatRupees(amount) : '-'}
                </div>
            )
        },
        size: 120
    },

]

export const supportWalletColumns: ColumnDef<WalletProps>[] = [
    {
        id: 'id',
        header: () => useSiteName(),
        cell: ({ row }) => {
            const bill = row.original.bills || row.original.prepaid_recharge
            return (
                <div>
                    {bill ? <SiteAccountBoardCell row={{ original: bill }} /> : null}
                </div>
            )
        },
    },
    {
        accessorKey: 'batch_id',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="p-0 hover:bg-transparent font-semibold"
                >
                    Batch ID
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
        size: 200,
        cell: ({ row }) => row.original.batch_id ? <ViewBatchButton link={`/portal/batch-payment/${row.original.batch_id}`} batchId={row.original.batch_id || ''} /> : null,
    },
    {
        accessorKey: 'created_at',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="p-0 hover:bg-transparent font-semibold"
                >
                    Date & Time
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
                {formatDateWithTime(row.original.created_at)}
            </div>
        ),
        size: 200
    },
    {
        id: 'transaction_id',
        header: 'Transaction ID',
        cell: ({ row }) => {
            const transaction = row.original
            return (
                <div className="text-xs text-muted-foreground">
                    Transaction ID: {transaction.transaction_id}
                </div>
            )
        },
        size: 250
    },
    {
        id: 'amount',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="p-0 hover:bg-transparent font-semibold text-right"
                >
                    Debit
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
            const amount = row.original.transaction_type === 'debit' ? row.original.amount : 0
            return (
                <div className="text-sm font-medium text-red-600">
                    {amount > 0 ? formatRupees(amount) : '-'}
                </div>
            )
        },
        size: 120
    },
    {
        id: 'amount',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="p-0 hover:bg-transparent font-semibold text-right"
                >
                    Credit
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
            const amount = row.original.transaction_type === 'credit' ? row.original.amount : 0
            return (
                <div className="text-sm font-medium text-green-600">
                    {amount > 0 ? formatRupees(amount) : '-'}
                </div>
            )
        },
        size: 120
    }
]