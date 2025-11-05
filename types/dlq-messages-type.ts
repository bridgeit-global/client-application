import { BillerListProps } from "./biller-list-type";
import { TableRow } from "./supabase-type";
export type DlqMessagesProps = TableRow<'dlq_messages'>;


export type DlqMessagesTableProps = DlqMessagesProps & {
    biller_list: BillerListProps;
    description?: string;
};