'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { createClient } from '@/lib/supabase/client';
import { ChargesCard, ChargesProps } from '../cards/charges-card';
import { Badge } from '../ui/badge';

export function ChargesModal({ bill_id }: { bill_id: string }) {
  const supabase = createClient();
  const [charges, setCharges] = useState<ChargesProps>();
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const getCharges = async () => {
    if (bill_id) {
      const { data, error } = await supabase
        .from('bills')
        .select(
          `id,bill_date,due_date,core_charges(*),regulatory_charges(*),adherence_charges(*),additional_charges(*)`
        )
        .eq('id', bill_id)
        .single();

      if (error) {
        console.error('error', error);
      }

      const sampleBillData = {
        additionalCharges: {
          title: 'Additional Charges',
          charges: data?.additional_charges
        },
        adherenceCharges: {
          title: 'Adherence Charges',
          charges: data?.adherence_charges
        },
        regulatoryCharges: {
          title: 'Regulatory Charges',
          charges: data?.regulatory_charges
        },
        coreCharges: {
          title: 'Core Charges',
          charges: data?.core_charges
        }
      };
      setCharges(sampleBillData as any);
    }
  };
  useEffect(() => {
    getCharges();
  }, [bill_id]);
  return (
    charges &&
    (charges.additionalCharges.charges !== null ||
      charges?.adherenceCharges.charges !== null ||
      charges.regulatoryCharges.charges !== null ||
      charges.coreCharges.charges !== null) && (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Badge
            className="cursor-pointer hover:bg-yellow-50"
            variant="outline"
          >
            Charges
          </Badge>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <ChargesCard {...charges} />
        </DialogContent>
      </Dialog>
    )
  );
}
