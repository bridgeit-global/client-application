'use client';

import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useState, useTransition } from 'react';

export function useStoreKPIMetrics() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const supabase = createClient();

  const storeKPIMetrics = async (orgId: string, calculationMonth: string) => {
    return new Promise<boolean>((resolve) => {
      startTransition(async () => {
        try {
          const { error } = await supabase.rpc('store_kpi_metrics', {
            p_org_id: orgId,
            p_calculation_month: calculationMonth,
          });

          if (error) {
            console.error('Error storing KPI metrics:', error);
            toast({
              variant: 'destructive',
              title: 'Error',
              description: 'Failed to store KPI metrics. Please try again.',
            });
            resolve(false);
            return;
          }

          toast({
            variant: 'default',
            title: 'Success',
            description: 'KPI metrics stored successfully.',
          });
          resolve(true);
        } catch (error) {
          console.error('Error in storeKPIMetrics:', error);
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'An unexpected error occurred. Please try again.',
          });
          resolve(false);
        }
      });
    });
  };

  return { storeKPIMetrics, isPending };
}
