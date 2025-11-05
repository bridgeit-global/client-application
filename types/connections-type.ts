import { BatchesProps } from './batches-type';
import { BillerListProps } from './biller-list-type';
import { AllBillTableProps } from './bills-type';
import { BillerPaymentTransactionsProps, PaymentsProps, RefundPaymentTransactionsProps } from './payments-type';
import { PrepaidBalanceProps, PrepaidInfoProps, PrepaidRechargeProps } from './prepaid-balance-type';
import { SiteProps } from './site-type';
import { SubmeterReadingProps } from './submeter-readings-type';
import { TableRow, ViewRow } from './supabase-type';

export type ConnectionsProps = TableRow<'connections'>;

export type ConnectionTableProps = ConnectionsProps & {
  biller_list: BillerListProps;
  sites: SiteProps;
  bills: AllBillTableProps[];
  payments: PaymentsProps[];
  prepaid_balances: PrepaidBalanceProps[];
  prepaid_info: PrepaidInfoProps;
  prepaid_recharge: PrepaidRechargeTableProps[];
  submeter_readings: SubmeterReadingProps[];
  balance_amount?: number;
  current_balance?: number;
};

export type LowBalanceConnectionTableProps = ViewRow<'low_balance_connections'> & {
  biller_list: BillerListProps;
};

export type PrepaidRechargeTableProps = PrepaidRechargeProps & {
  connections: ConnectionTableProps;
  batches: BatchesProps;
  biller_payment_transactions: BillerPaymentTransactionsProps[];
  refund_payment_transactions: RefundPaymentTransactionsProps[];
};
