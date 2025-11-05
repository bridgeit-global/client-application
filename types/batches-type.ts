import { AllBillTableProps, BillsProps } from './bills-type';
import { ConnectionsProps, ConnectionTableProps, PrepaidRechargeTableProps } from './connections-type';
import { ClientPaymentsProps, PaymentGatewayTransactionsProps, RefundPaymentTransactionsProps } from './payments-type';
import { TableRow, ViewRow } from './supabase-type';

export type BatchesProps = TableRow<'batches'>;

export type BatchTableProps = BatchesProps & {
  bills: AllBillTableProps[];
  client_payments: ClientPaymentsProps[];
  prepaid_recharge: PrepaidRechargeTableProps[];
  payment_gateway_transactions: PaymentGatewayTransactionsProps[];
  refund_payment_transactions: RefundPaymentTransactionsProps[];
  created_by_user?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  updated_by_user?: {
    id: string;
    first_name: string;
    last_name: string;
  };
};

export type CreateBatchTableProps = BillsProps & {
  connections: ConnectionTableProps;
};

