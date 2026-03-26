import { ConnectionsProps, ConnectionTableProps } from './connections-type';
import type { Json } from './supabase';
import { TableRow } from './supabase-type';
import { AllBillTableProps } from "./bills-type";
import { PrepaidRechargeTableProps } from "./connections-type";
import type { PaymentsProps } from './payments-type';
import type { SubmeterReadingWithConnection } from './submeter-readings-type';
import type { BillerListProps } from './biller-list-type';

export type SiteProps = TableRow<'sites'>;

export type SiteConnectionProps = SiteProps & {
  connections: ConnectionsProps[];
};

export type SiteConnectionTableProps = SiteProps & {
  connections: ConnectionTableProps[];
};

export interface SiteProfile {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  zone_id: string | null;
  type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type PrepaidBalance = TableRow<'prepaid_balances'>

export interface Connection {
  id: string;
  account_number: string;
  connection_type: string;
  tariff: string;
  is_active: boolean;
  paytype: number;
  bills: AllBillTableProps[];
  prepaid_recharge: PrepaidRechargeTableProps[];
  prepaid_info: {
    threshold_amount: number;
  } | null;
  prepaid_balances: PrepaidBalance[];
  security_deposit: number;
  /** Enriched on full connection fetch (explorer / profile). */
  name?: string | null;
  address?: string | null;
  connection_date?: string | null;
  biller_list?: BillerListProps | null;
  payments?: PaymentsProps[];
  submeter_readings?: SubmeterReadingWithConnection[];
  connection_details?: Json | null;
}

export interface SiteProfilePageData {
  site: SiteProfile;
  connections: Connection[];
}
