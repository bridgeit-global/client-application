import { TableRow } from './supabase-type';
import { ConnectionsProps } from './connections-type';
import { SiteProps } from './site-type';
import { BillerListProps } from './biller-list-type';

export type PrepaidBalanceProps = TableRow<'prepaid_balances'>;

export type PrepaidInfoProps = TableRow<'prepaid_info'>;

export type PrepaidRechargeProps = TableRow<'prepaid_recharge'>;

export type PrepaidRechargeTableProps = PrepaidRechargeProps & {
    connections: ConnectionsProps & {
        sites: SiteProps;
        biller_list: BillerListProps;
    };
};


