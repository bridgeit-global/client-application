import { Database } from './supabase';
export type Tables = Database['portal']['Tables'];
export type Views = Database['portal']['Views'];
export type TableRow<T extends keyof Tables> = Tables[T]['Row'];
export type ViewRow<T extends keyof Views> = Views[T]['Row'];

export type SupabaseError = {
  message: string;
  code?: string;
  status?: number;
};
