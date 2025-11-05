import { icons } from 'lucide-react';
import { TableRow } from './supabase-type';

export type LagDataProps = {
  age: string;
  count: number;
};

export type LagCardProps = {
  title: string;
  count: number;
  index: number;
  buttonColor: string;
};

type BaseData = TableRow<'dashboard_data'>;
export type DashboardData = Omit<BaseData, 'icon'> & {
  icon: keyof typeof icons | null;
};

type SupportBaseData = TableRow<'dashboard_support_data'>;
export type SupportDashboardData = Omit<SupportBaseData, 'icon'> & {
  icon: keyof typeof icons | null;
};
export type BillerBoardGroupResult = TableRow<'biller_board_summary'> & {
  biller_list: TableRow<'biller_list'>;
};

export type WeekGroup = TableRow<'due_summary'>;

export type DashboardTitleProp = {
  title: string;
  icon: keyof typeof icons;
};
