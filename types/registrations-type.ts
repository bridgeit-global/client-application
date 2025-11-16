import { TableRow } from "./supabase-type";
export type RegistrationsProps = TableRow<'registrations'> & {
  users: TableRow<'users'>;
};
