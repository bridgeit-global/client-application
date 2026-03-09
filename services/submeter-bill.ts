import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import type { SearchParamsProps } from '@/types';
import type { ConnectionTableProps } from '@/types/connections-type';
import type { SubmeterReadingWithConnection } from '@/types/submeter-readings-type';

export type SubmeterConnection = Pick<
  ConnectionTableProps,
  'id' | 'account_number' | 'site_id' | 'tariff' | 'submeter_info'
>;

export type BillReadingPair = {
  startReading: SubmeterReadingWithConnection | null;
  endReading: SubmeterReadingWithConnection | null;
};

export const fetchSubmeterConnectionsBySite = cache(
  async (site_id: string): Promise<{ data: SubmeterConnection[]; error: any }> => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('connections')
      .select('id, account_number, site_id, tariff, submeter_info')
      .eq('site_id', site_id)
      .eq('is_deleted', false)
      .eq('is_active', true)
      .eq('paytype', -1)
      .order('account_number', { ascending: true });

    return {
      data: (data || []) as SubmeterConnection[],
      error
    };
  }
);

type ReadingParams = {
  connection_id: string;
  billing_start: string;
  billing_end: string;
};

export const fetchBillReadings = async ({
  connection_id,
  billing_start,
  billing_end
}: ReadingParams): Promise<{ data: BillReadingPair; error: any }> => {
  const supabase = await createClient();

  // Start reading: latest reading on or before billing_start
  const { data: startData, error: startError } = await supabase
    .from('submeter_readings')
    .select(
      `
        *,
        connections!inner(
          account_number,
          site_id,
          biller_list!inner(
            board_name,
            state
          )
        )
      `
    )
    .eq('connection_id', connection_id)
    .lte('reading_date', billing_start)
    .order('reading_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (startError) {
    return {
      data: { startReading: null, endReading: null },
      error: startError
    };
  }

  // End reading: latest reading on or before billing_end
  const { data: endData, error: endError } = await supabase
    .from('submeter_readings')
    .select(
      `
        *,
        connections!inner(
          account_number,
          site_id,
          biller_list!inner(
            board_name,
            state
          )
        )
      `
    )
    .eq('connection_id', connection_id)
    .lte('reading_date', billing_end)
    .order('reading_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (endError) {
    return {
      data: { startReading: null, endReading: null },
      error: endError
    };
  }

  return {
    data: {
      startReading: (startData as SubmeterReadingWithConnection) || null,
      endReading: (endData as SubmeterReadingWithConnection) || null
    },
    error: null
  };
};

