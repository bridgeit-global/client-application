'use client';

import { useState, useTransition } from 'react';
import {
  CalendarDays,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  IndianRupee
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAdjustedAmount } from '@/lib/utils';
import { formatRupees } from '@/lib/utils/number-format';
import { ddmmyy } from '@/lib/utils/date-format';
import { createClient } from '@/lib/supabase/client';
import { AlertModal } from '../modal/alert-modal';
import { useRouter } from 'next/navigation';
import { AllBillTableProps } from '@/types/bills-type';
import DocumentViewerModal from '../modal/document-viewer-modal';

interface BillComparisonProps {
  oldBill?: AllBillTableProps;
  newBill?: AllBillTableProps;
  batchId: string | null;
  onClose: () => void;
}

const supabase = createClient();

const removeBill = async (batchId: string | null, billId: string) => {
  const { data, error } = await supabase
    .from('bills')
    .update({ batch_id: null, bill_status: 'rejected' })
    .match({ id: billId, batch_id: batchId })
    .select();
  if (error) {
    console.error('Error removing bill', error);
  }
  return data;
};

const replaceBill = async (
  batchId: string | null,
  billId: string,
  oldBillId: string,
  newBillAmount: number
) => {
  const { error: oldBillError } = await supabase
    .from('bills')
    .update({ batch_id: null, bill_status: 'rejected' })
    .match({ id: oldBillId, batch_id: batchId })
    .select();
  if (oldBillError) {
    console.error('Error removing old bill', oldBillError);
  }
  const { data, error } = await supabase
    .from('bills')
    .update({ batch_id: batchId, bill_status: 'batch', approved_amount: newBillAmount })
    .match({ id: billId })
    .select();
  if (error) {
    console.error('Error replacing bill', error);
  }
  return data;
};

export default function BillComparison({
  onClose,
  oldBill: oldBillProp,
  newBill: newBillProp,
  batchId
}: BillComparisonProps) {
  const [showDifference, setShowDifference] = useState(true);
  const oldBill = oldBillProp;
  const newBill = newBillProp;
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isReplaceOpen, setIsReplaceOpen] = useState(false);
  const router = useRouter();
  return (
    <div className="flex items-center justify-center rounded bg-gradient-to-br from-yellow-50 to-yellow-100 p-4">
      <AlertModal
        title="Do you want to remove bill from batch?"
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={() => {
          startTransition(() => {
            removeBill(batchId, oldBill?.id || '');
          });
          setOpen(false);
          onClose();
          router.refresh();
        }}
        loading={isPending}
      />
      <AlertModal
        title="Do you want to replace bill with new bill?"
        isOpen={isReplaceOpen}
        onClose={() => setIsReplaceOpen(false)}
        onConfirm={() => {
          startTransition(() => {
            replaceBill(batchId, newBill?.id || '', oldBill?.id || '', newBill?.bill_amount || 0);
          });
          setIsReplaceOpen(false);
          onClose();
          router.refresh();
        }}
        loading={isPending}
      />
      <div className="w-full max-w-5xl space-y-4">
        <div className="flex flex-col gap-4 md:flex-row">
          <BillCard title="Old Bill" bill={oldBill} />
          <div className="flex items-center justify-center">
            <ArrowRight className="hidden text-gray-400 md:block" size={24} />
          </div>
          <BillCard title="New Bill" bill={newBill} isNew />
        </div>
        <Card>
          <CardContent className="pt-6">
            <Button
              variant="link"
              size="sm"
              onClick={() => setShowDifference(!showDifference)}
              className="w-full"
            >
              {showDifference ? 'Hide' : 'Show'} Difference
            </Button>
            {showDifference && (
              <div className="mt-4 space-y-2">
                <DifferenceRow
                  label="Bill Amount"
                  oldValue={oldBill ? getAdjustedAmount(oldBill) : 0}
                  newValue={newBill ? getAdjustedAmount(newBill) : 0}
                  format={(value) => `${formatRupees(value)}`}
                />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setOpen(true)}
            >
              Remove Old Bill
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsReplaceOpen(true)}
            >
              Replace with New Bill
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

function BillCard({
  title,
  bill,
  isNew = false
}: {
  title: string;
  bill: any;
  isNew?: boolean;
}) {
  return (
    <Card className={`w-full ${isNew ? 'border-green-500' : ''}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          {isNew && (
            <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-normal text-green-800">
              New
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <BillDetail
          icon={<CalendarDays className="text-blue-500" />}
          label="Bill Date"
          value={bill?.bill_date ? ddmmyy(bill?.bill_date) : 'N/A'}
        />
        <BillDetail
          icon={<CalendarDays className="text-red-500" />}
          label="Due Date"
          value={bill.due_date ? ddmmyy(bill.due_date) : 'N/A'}
        />
        <BillDetail
          icon={<IndianRupee className="text-green-500" />}
          label="Bill Amount"
          value={
            bill.bill_amount !== undefined
              ? `${formatRupees(getAdjustedAmount(bill))}`
              : 'N/A'
          }
        />
        <div className="flex items-center justify-center">
          <DocumentViewerModal
            label="View Document"
            contentType={bill.content_type}
            documentUrl={`${process.env.NEXT_PUBLIC_BUCKET_URL}/${bill.content}`}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function BillDetail({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: string | undefined;
}) {
  return (
    <div className="flex items-center space-x-2">
      {icon}
      <div>
        <div className="text-sm font-medium text-gray-500">{label}</div>
        <div className="text-md font-semibold">{value || 'N/A'}</div>
      </div>
    </div>
  );
}

function DifferenceRow({
  label,
  oldValue,
  newValue,
  format
}: {
  label: string;
  oldValue: number;
  newValue: number;
  format: (value: number) => string;
}) {
  const difference = newValue - oldValue;
  const percentChange =
    oldValue !== 0 ? ((difference / oldValue) * 100).toFixed(2) : '0.00';
  const isIncrease = difference > 0;

  return (
    <div className="flex items-center justify-between">
      <span className="font-medium">{label}</span>
      <div className="flex items-center space-x-2">
        <span
          className={`font-semibold ${isIncrease ? 'text-red-500' : 'text-green-500'
            }`}
        >
          {isIncrease ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
        </span>
        <span>{format(Math.abs(difference))}</span>
        <span className={isIncrease ? 'text-red-500' : 'text-green-500'}>
          ({isIncrease ? '+' : '-'}
          {Math.abs(Number.parseFloat(percentChange))}%)
        </span>
      </div>
    </div>
  );
}
