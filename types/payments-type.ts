import { BatchesProps } from './batches-type';
import { AllBillTableProps } from './bills-type';
import { ConnectionTableProps, PrepaidRechargeTableProps } from './connections-type';
import { TableRow } from './supabase-type';

export type PaymentsProps = TableRow<'payments'>;


export type BillerPaymentTransactionsProps = TableRow<'biller_payment_transactions'>;

export type ClientPaymentsProps = TableRow<'client_payments'> & {
  bills: AllBillTableProps;
  prepaid_recharge: PrepaidRechargeTableProps;
  batches: BatchesProps;
};

export type PaymentGatewayTransactionsProps = TableRow<'payment_gateway_transactions'> & {
  users: TableRow<'users'>;
};

export type RefundPaymentTransactionsProps = TableRow<'refund_payment_transactions'>;

export type PaymentTableProps = PaymentsProps & {
  connections: ConnectionTableProps;
};

export type PaidBillTableProps = TableRow<'bills'> & {
  connections: ConnectionTableProps;
};



export type WalletProps = TableRow<'client_wallet_ledgers'> & {
  bills: AllBillTableProps;
  prepaid_recharge: PrepaidRechargeTableProps;
};

export type WalletSummaryProps = {
  credits: number
  debits: number
  balance: number
  count: number
}


