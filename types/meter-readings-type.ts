import { TableRow } from './supabase-type';

export type MeterReadingsProps = Omit<
  TableRow<'meter_readings'>,
  'created_at' | 'updated_at'
>;
