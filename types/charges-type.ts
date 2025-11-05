import { TableRow, ViewRow } from './supabase-type';

// portal.core_charges
export type CoreChargesProps = Omit<
  TableRow<'core_charges'>,
  'created_at' | 'updated_at'
>;

// portal.regulatory_charges
export type RegulatoryChargesProps = Omit<
  TableRow<'regulatory_charges'>,
  'created_at' | 'updated_at'
>;

// portal.additional_charges
export type AdditionalChargesProps = Omit<
  TableRow<'additional_charges'>,
  'created_at' | 'updated_at'
>;

// portal.adherence_charges
export type AdherenceChargesProps = Omit<
  TableRow<'adherence_charges'>,
  'created_at' | 'updated_at'
>;

export type ArrearsProps = ViewRow<'arrear_amount'> & {
  biller_list: TableRow<'biller_list'>;

};

export type PenaltiesProps = ViewRow<'penalties'> & {
  biller_list: TableRow<'biller_list'>;
};