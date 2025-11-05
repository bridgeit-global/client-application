import { ConnectionTableProps } from "./connections-type";
import { TableRow } from "./supabase-type";

export type SubmeterReadingProps = TableRow<'submeter_readings'>;

export interface SubmeterReadingInsert {
    connection_id: string;
    reading_date: string;
    start_reading: number;
    end_reading: number;
    operator_info?: any;
    snapshot_urls?: string[];
    created_by?: string;
}

export interface SubmeterReadingUpdate {
    connection_id?: string;
    reading_date?: string;
    start_reading?: number;
    end_reading?: number;
    operator_info?: any;
    snapshot_urls?: string[];
    updated_by?: string;
}

export interface SubmeterReadingWithConnection extends SubmeterReadingProps {
    connections?: ConnectionTableProps;
} 