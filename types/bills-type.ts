import { BillerListProps } from './biller-list-type';
import {
  AdditionalChargesProps,
  AdherenceChargesProps,
  CoreChargesProps,
  RegulatoryChargesProps
} from './charges-type';
import { ConnectionsProps, ConnectionTableProps } from './connections-type';
import { MeterReadingsProps } from './meter-readings-type';
import { BillerPaymentTransactionsProps, ClientPaymentsProps, PaymentsProps, RefundPaymentTransactionsProps } from './payments-type';
import { ChartData } from '.';
import { SupabaseError, TableRow } from './supabase-type';
import { WeekGroup } from './dashboard-type';
import {
  PrepaidBalanceProps,
  PrepaidInfoProps,
  PrepaidRechargeProps
} from './prepaid-balance-type';
import { SiteProps } from './site-type';
import { BatchesProps } from './batches-type';

export type BillsProps = TableRow<'bills'>;

// export type DerivedPaidBill = TableRow<'derived_paid_bill_summary'>

export type AllBillTableProps = BillsProps & {
  // derived_paid_bill_summary: DerivedPaidBill
  connections: ConnectionsProps & {
    sites: SiteProps;
    biller_list: BillerListProps;
    payments: PaymentsProps[];
    prepaid_balances: PrepaidBalanceProps[];
    prepaid_info: PrepaidInfoProps;
    bills: BillsProps[];
  };
  biller_payment_transactions: BillerPaymentTransactionsProps[];
  refund_payment_transactions: RefundPaymentTransactionsProps[];
  client_payments: ClientPaymentsProps[];
  batches: BatchesProps;
  prepaid_recharge: PrepaidRechargeProps;
  core_charges: CoreChargesProps;
  regulatory_charges: RegulatoryChargesProps;
  adherence_charges: AdherenceChargesProps;
  additional_charges: AdditionalChargesProps;
  meter_readings: MeterReadingsProps[];
};

export type SingleBillProps = BillsProps & {
  core_charges?: CoreChargesProps;
  regulatory_charges?: RegulatoryChargesProps;
  adherence_charges?: AdherenceChargesProps;
  additional_charges?: AdditionalChargesProps;
  meter_readings?: MeterReadingsProps[];
  connections: ConnectionTableProps;
};

export type CardResult = {
  chartDueDataData: ChartData[];
  chartDiscountDataData: ChartData[];
  all_bill_amount: number;
  dueSummaryData: WeekGroup[];
  lagCount: number;
  error?: SupabaseError;
};

