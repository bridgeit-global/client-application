'use client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { createClient } from '@/lib/supabase/client';
import BillComparison from '../cards/bill-comparison';
import { useEffect } from 'react';
import { useState } from 'react';
interface NewBillFoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  id: string | undefined;
  oldBillProp: any;
  batchId: string | null;
  connectionId: string | null;
}

const supabase = createClient();

export function NewBillFoundModal({
  isOpen,
  onClose,
  id,
  oldBillProp,
  batchId,
  connectionId
}: NewBillFoundModalProps) {
  const [bill, setBill] = useState<any>(null);
  useEffect(() => {
    const fetchBill = async () => {
      const { data, error } = await supabase
        .from('bills')
        .select(
          '*,connections!inner(id,site_id,biller_list!inner(*),payments(amount),account_number,paytype,is_active)'
        )
        .match({
          connection_id: connectionId,
          is_active: true,
          is_deleted: false,
          is_valid: true
        })
        .single();
      if (error) {
        console.error('Error fetching bill', error);
      } else {
        setBill(data);
      }
    };
    fetchBill();
  }, [id]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            New Bill Found
          </DialogTitle>
        </DialogHeader>
        {bill && (
          <BillComparison
            onClose={onClose}
            oldBill={oldBillProp}
            newBill={bill}
            batchId={batchId}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
