import { ConnectionTableProps } from './connections-type';
import { TableRow } from './supabase-type';
export type BillerListProps = TableRow<'biller_list'>;

export type BillerListTableProps = BillerListProps & {
  connections: ConnectionTableProps;
};
