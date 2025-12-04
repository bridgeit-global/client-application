'use client';
import { ColumnDef } from '@tanstack/react-table';
import { ToggleButton } from '@/components/ui/toggle-button';
import UploadFormModal from '@/components/ui/payment-upload-form';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { formatRupees } from '@/lib/utils/number-format';
import { ddmmyy } from '@/lib/utils/date-format';
import axios from 'axios';
import { useToast } from '@/components/ui/use-toast';
import DocumentViewerModalWithPresigned from '@/components/modal/document-viewer-modal-with-presigned';
import { DueDateCell } from '@/components/table-cells/due-date-cell';
import { AllBillTableProps } from '@/types/bills-type';
import { CellAction } from './cell-action';
import { useSiteName } from '@/lib/utils/site';
import { SiteAccountBoardCell } from '@/components/table-cells/site-account-board-cell';
import { PrepaidRechargeTableProps } from '@/types/connections-type';
const supabase = createClient();

const payStatusUpdate = async (id: string | number, dataWithRow: Record<string, any>, type: 'bill' | 'recharge') => {
  try {
    // Insert payment record in payments table
    const userId = await supabase.auth.getUser().then((res) => res.data.user?.id);
    const { data: paymentData, count, error: paymentError } = await supabase
      .from('payments')
      .select('id', { count: 'exact' })
      .eq('connection_id', dataWithRow.connection_id)
      .eq('collection_date', dataWithRow.collection_date)
    if (paymentError) throw paymentError;
    if (count === 0) {
      console.log('inserting payment', dataWithRow);
      const { error: insertError } = await supabase
        .from('payments')
        .upsert([{ ...dataWithRow, created_by: userId }], { onConflict: 'id' });
      if (insertError) throw insertError;
    } else {
      console.log('updating payment', paymentData);
      const { error: updateError } = await supabase
        .from('payments')
        .update({ ...dataWithRow, updated_by: userId })
        .eq('id', paymentData[0].id);
      if (updateError) throw updateError;
    }
    // Update bill payment_status in bills table
    if (type === 'bill') {
      const { error: updateError1 } = await supabase
        .from('bills')
        .update({ payment_status: true })
        .eq('id', id)
      if (updateError1) throw updateError1;
    }

    return true;
  } catch (error) {
    console.error('payStatusUpdate error:', error);
    return false;
  }
};

export const billColumns: ColumnDef<AllBillTableProps>[] = [
  {
    id: 'id',
    header: () => useSiteName(),
    cell: ({ row }) => <SiteAccountBoardCell row={row} />
  },
  {
    header: 'Bill Date',
    cell: ({ row }: any) => row.original.bill_date && ddmmyy(row.original.bill_date)
  },
  {
    accessorKey: 'due_date',
    header: 'Due Date',
    cell: ({ row }: any) => <DueDateCell discount_date_str={row.original.discount_date} due_date_str={row.original.due_date} />
  },
  {
    header: 'Bill Amount',
    cell: ({ row }: any) => {
      return formatRupees(row.original.bill_amount);
    }
  },
  {
    header: 'Bill Copy',
    cell: ({ row }) => {
      const content = row.original.content;
      const content_type = row.original.content_type;
      if (content) {
        return (
          <DocumentViewerModalWithPresigned
            contentType={content_type}
            fileKey={content}
          />
        );
      }
      return null;
    }
  },
  {
    id: 'actions',
    header: 'Paid Status',
    cell: ({ row }) => <CellAction data={row.original} />
  },
  {
    header: 'Mark as Paid',
    cell: ({
      row
    }: {
      row: {
        original: any;
      };
    }) => {
      const [isModalOpen, setIsModalOpen] = useState(false);
      const router = useRouter();
      const { toast } = useToast();

      const handleToggleClick = () => {
        setIsModalOpen(true);
      };

      const handleModalSubmit = async (formData: {
        file?: File | undefined | null;
        collectionDate: string;
        payableAmount: number;
        utrId?: string;
      }) => {

        const cleanCollectionDate = formData.collectionDate.replace(/-/g, '');
        const id = `${row.original.connection_id}_${cleanCollectionDate}`;
        let content_type = '';
        try {
          if (formData.file) {
            // Convert file to base64
            const base64File = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.readAsDataURL(formData.file!);
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = (error) => reject(error);
            });
            // Extract content type and base64 content
            const [, contentType, base64Content] = base64File.match(/^data:(.+);base64,(.+)$/) || [];
            content_type = contentType.split('/')[1];
            const body = { id, contentType, base64Content };
            const response = await axios.post(
              `${process.env.NEXT_PUBLIC_UPLOAD_PDF_URL}/payment/receipt_upload`,
              body
            );
          }

          const [billerId, _, collection_date] = id.split('_');
          const key = `payment-receipt/${billerId}/${collection_date}/${id}.${content_type}`;
          const dataWithRow = {
            id: id,
            connection_id: row.original.connection_id,
            reference_id: formData.utrId,
            amount: formData.payableAmount,
            collection_date: formData.collectionDate,
            content: content_type ? key : null,
            content_type: content_type
              ? content_type.includes('pdf')
                ? 'pdf'
                : 'html'
              : null
          };

          const updateSuccess = await payStatusUpdate(
            row.original.id,
            dataWithRow,
            'bill'
          );

          if (updateSuccess) {
            toast({
              title: 'Success',
              description: 'Payment Status Updated',
              variant: 'default'
            });
            router.refresh();
          }
        } catch (error) {
          console.error('Error processing file:', error);
          // Here you might want to show an error message to the user
          toast({
            title: 'Error',
            description: 'Something Wrong!',
            variant: 'destructive'
          });
        }
      };

      return (
        <div className="flex" >
          <ToggleButton onClick={handleToggleClick} />
          <UploadFormModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleModalSubmit}
          />
        </div >
      );
    }
  },

];

export const rechargeColumns: ColumnDef<PrepaidRechargeTableProps>[] = [
  {
    id: 'id',
    header: () => useSiteName(),
    cell: ({ row }) => <SiteAccountBoardCell row={row} />
  },
  {
    header: 'Recharge Amount',
    cell: ({ row }) => {
      return formatRupees(row.original.recharge_amount);
    }
  },
  {
    header: 'Recharge Date',
    cell: ({ row }) => {
      return ddmmyy(row.original.recharge_date);
    }
  },
  {
    header: 'Recharge Status',
    cell: ({ row }) => {
      return row.original.recharge_status;
    }
  },
  {
    header: 'Mark as Paid',
    cell: ({
      row
    }: {
      row: {
        original: any;
      };
    }) => {
      const [isModalOpen, setIsModalOpen] = useState(false);
      const router = useRouter();
      const { toast } = useToast();

      const handleToggleClick = () => {
        setIsModalOpen(true);
      };

      const handleModalSubmit = async (formData: {
        file?: File | undefined | null;
        collectionDate: string;
        payableAmount: number;
        utrId?: string;
      }) => {

        const cleanCollectionDate = formData.collectionDate.replace(/-/g, '');
        const id = `${row.original.connection_id}_${cleanCollectionDate}`;
        let content_type = '';
        try {
          if (formData.file) {
            // Convert file to base64
            const base64File = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.readAsDataURL(formData.file!);
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = (error) => reject(error);
            });
            // Extract content type and base64 content
            const [, contentType, base64Content] = base64File.match(/^data:(.+);base64,(.+)$/) || [];
            content_type = contentType.split('/')[1];
            const body = { id, contentType, base64Content };
            const response = await axios.post(
              `${process.env.NEXT_PUBLIC_UPLOAD_PDF_URL}/payment/receipt_upload`,
              body
            );
          }

          const [billerId, _, collection_date] = id.split('_');
          const key = `payment-receipt/${billerId}/${collection_date}/${id}.${content_type}`;
          const dataWithRow = {
            id: id,
            connection_id: row.original.connection_id,
            reference_id: formData.utrId,
            amount: formData.payableAmount,
            collection_date: formData.collectionDate,
            content: content_type ? key : null,
            content_type: content_type
              ? content_type.includes('pdf')
                ? 'pdf'
                : 'html'
              : null
          };

          const updateSuccess = await payStatusUpdate(
            row.original.id,
            dataWithRow,
            'recharge'
          );

          if (updateSuccess) {
            toast({
              title: 'Success',
              description: 'Payment Status Updated',
              variant: 'default'
            });
            router.refresh();
          }
        } catch (error) {
          console.error('Error processing file:', error);
          // Here you might want to show an error message to the user
          toast({
            title: 'Error',
            description: 'Something Wrong!',
            variant: 'destructive'
          });
        }
      };

      return (
        <div className="flex" >
          <ToggleButton onClick={handleToggleClick} />
          <UploadFormModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleModalSubmit}
          />
        </div >
      );
    }
  },
];