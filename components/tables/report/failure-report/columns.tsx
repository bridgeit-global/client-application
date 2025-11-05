'use client';
import { ColumnDef } from '@tanstack/react-table';
import { DlqMessagesTableProps } from '@/types/dlq-messages-type';
import { ddmmyy } from '@/lib/utils/date-format';
import { Badge } from '@/components/ui/badge';
import DocumentViewerModal from '@/components/modal/document-viewer-modal';
import { formatRupees } from '@/lib/utils/number-format';
import { DueDateCell } from '@/components/table-cells/due-date-cell';
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
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
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";

interface RegistrationMessage {
  id: string;
  siteId: string;
  parameters: Array<{ value: string }>;
  payType: number;
  billerBoard: string;
}

interface BillMessage {
  id: string;
  pdf_url: string;
  messageId: string;
}

interface PaymentMessage {
  id: string;
  bill_date: string;
  due_date: string;
  bill_amount: number;
  bill_number: string;
  bill_type: string;
}

interface PdfMessage {
  connection_id: string;
  messageId: string;
  pdf_url: string;
}

// Detailed view columns (dlq_messages rows)
export const detailedColumns: ColumnDef<DlqMessagesTableProps>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableResizing: false,
    size: 40
  },
  {
    accessorKey: 'dlq_type',
    header: 'Type',
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className="capitalize px-3 py-1 text-sm font-medium mr-4"
      >
        {row.original.dlq_type === 'pdf-dlq'
          ? 'Extraction Failure'
          : row.original.dlq_type === 'payment-dlq'
            ? 'Payment Failure'
            : row.original.dlq_type === 'activation-dlq'
              ? 'Download Failure'
              : row.original.dlq_type === 'registration-dlq'
                ? 'Register Failure'
                : row.original.dlq_type}
      </Badge>
    )
  },
  {
    accessorKey: 'account_number',
    header: 'Account Number',
    cell: ({ row }) => {
      return (
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {String(row.original.account_number).replace(/^[.\s]+/, '')}
        </span>
      );
    }
  },
  {
    accessorKey: 'biller_list',
    header: 'Biller Board',
    cell: ({ row }) => {
      return (
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {row.original.biller_list?.board_name || 'N/A'}
        </span>
      );
    }
  },
  {
    accessorKey: 'created_at',
    header: 'Date',
    cell: ({ row }) => (
      <span className="text-sm text-gray-900 dark:text-gray-100">
        {row.original.created_at && ddmmyy(row.original.created_at)}
      </span>
    )
  },
  {
    accessorKey: 'reason',
    header: 'Reason',
    cell: ({ row }) => {
      return (
        <span className="text-sm text-gray-900 dark:text-gray-100">
          {row.original.reason || ''}
        </span>
      );
    }
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => {
      return (
        <span className="text-sm text-gray-900 dark:text-gray-100">
          {row.original.description || ''}
        </span>
      );
    }
  },
  {
    accessorKey: 'message_data',
    header: 'Message',
    enableHiding: false,
    cell: ({ row }) => {
      const [open, setOpen] = useState(false);
      return (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">View</Button>
          </DialogTrigger>
          <DialogContent
            style={{
              maxWidth: 600,
              maxHeight: 400,
              overflow: "auto",
              padding: 24
            }}
          >
            <pre
              className="text-xs whitespace-pre-wrap break-all"
              style={{
                margin: 0,
                padding: 0,
                maxWidth: "100%",
                maxHeight: 350,
                overflow: "auto",
                background: "none",
                border: "none"
              }}
            >
              {JSON.stringify(row.original.message_data, null, 2)}
            </pre>
          </DialogContent>
        </Dialog>
      );
    }
  },
  {
    id: 're-trigger',
    header: 'Re-trigger',
    cell: ({ row }) => {
      const [isLoading, setIsLoading] = useState(false);
      const { toast } = useToast();
      const router = useRouter();

      const handleReTrigger = async () => {
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

          const result = await response.json();
          toast({
            title: "Success",
            description: "Failure re-triggered successfully",
            variant: "default",
          });
          router.refresh();
        } catch (error: any) {
          console.error('Error re-triggering failure:', error);
          toast({
            title: "Error",
            description: error.message || "Failed to re-trigger failure",
            variant: "destructive",
          });
        }
      };

      return (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : "Trigger"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Re-trigger Failure</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to re-trigger this failure? This will attempt to process the failed message again.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleReTrigger}
                disabled={isLoading}
              >
                {isLoading ? "Processing..." : "Yes, Re-trigger"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    }
  }
];

// Summary view columns (aggregated rows)
type SummaryRow = {
  failure_date: string;
  dlq_type: string;
  biller_board: string;
  reason: string;
  failure_count: number;
  failure_percentage: number;
};

export const summaryColumns: ColumnDef<SummaryRow>[] = [
  {
    accessorKey: 'failure_date',
    header: 'Date'
  },
  {
    accessorKey: 'dlq_type',
    header: 'Type',
    cell: ({ row }) => (
      <Badge variant="outline" className="capitalize px-3 py-1 text-sm font-medium mr-4">
        {row.original.dlq_type === 'pdf-dlq'
          ? 'Extraction Failure'
          : row.original.dlq_type === 'payment-dlq'
            ? 'Payment Failure'
            : row.original.dlq_type === 'activation-dlq'
              ? 'Download Failure'
              : row.original.dlq_type === 'registration-dlq'
                ? 'Register Failure'
                : row.original.dlq_type}
      </Badge>
    )
  },
  {
    accessorKey: 'biller_board',
    header: 'Biller Board'
  },
  {
    accessorKey: 'reason',
    header: 'Reason'
  },
  {
    accessorKey: 'failure_count',
    header: 'Count'
  },
  {
    accessorKey: 'failure_percentage',
    header: 'Percentage',
    cell: ({ row }) => (
      <span className="font-medium text-gray-900 dark:text-gray-100">
        {row.original.failure_percentage ? `${row.original.failure_percentage.toFixed(2)}%` : '0%'}
      </span>
    )
  }
];
