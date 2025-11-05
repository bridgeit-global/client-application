import { TableRow, ViewRow } from "./supabase-type";
export type RegistrationsProps = TableRow<'registrations'> & {
  user_view: ViewRow<'user_view'>;
};
