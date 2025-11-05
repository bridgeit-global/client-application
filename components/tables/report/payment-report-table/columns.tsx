'use client';
import { ColumnDef } from '@tanstack/react-table';
import { ddmmyy } from '@/lib/utils/date-format';
import { formatRupees } from '@/lib/utils/number-format';
import { PaymentTableProps } from '@/types/payments-type';
import ReceiptIndianRupee from '@/components/icons/receipt-indian-rupee';
import DocumentViewerModal from '@/components/modal/document-viewer-modal';
import PayTypeBadge from '@/components/badges/pay-type-badge';
import { useSiteName } from '@/lib/utils/site';
import { SiteAccountBoardCell } from '@/components/table-cells/site-account-board-cell';
export const columns: ColumnDef<PaymentTableProps>[] = [

  {
    id: 'id',
    header: () => useSiteName(),
    cell: ({ row }) => <SiteAccountBoardCell row={row} />
  },
  {
    header: 'State',
    accessorKey: 'connections.biller_list.state',
  },
  {
    header: 'Consumer Name',
    accessorKey: 'connections.name',
  },
  {
    header: 'Paid Amount',
    cell: ({ row }) => formatRupees(row.original.amount)
  },
  {
    header: 'Collection Date',
    cell: ({ row }) => row.original.collection_date && ddmmyy(row.original.collection_date)
  },
  {
    header: 'Reference ID',
    accessorKey: 'reference_id',
  },
  {
    header: 'Pay Type',
    cell: ({ row }) => {
      const paytype = row.original.connections.paytype;
      return <PayTypeBadge paytype={paytype} />
    }
  },
  {
    header: 'Receipt Copy',
    cell: ({ row }) => {
      const content = row.original.content;
      const content_type = row.original.content_type;
      if (content) {
        return (
          <DocumentViewerModal
            icon={<ReceiptIndianRupee />}
            contentType={content_type}
            documentUrl={`${process.env.NEXT_PUBLIC_BUCKET_URL}/${row.original.content}`}
          />
        );
      }
      return null;
    }
  }
];
